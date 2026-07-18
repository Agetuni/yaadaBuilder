import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isCloudEnabled } from "../lib/supabase";
import { fetchBuilderProfile } from "../lib/cloud-api";
import {
  applyBuilderSettings,
  type BuilderProfile,
} from "../lib/builder-types";
import { useSettingsStore } from "./settings";
import { useConversationStore } from "./conversation";
import { useMemoryStore } from "./memory";
import { fetchConversations, fetchMemories } from "../lib/cloud-api";

interface AuthState {
  /** Cloud mode configured via Vite env */
  cloudEnabled: boolean;
  /** Finished first session check */
  ready: boolean;
  session: Session | null;
  user: User | null;
  profile: BuilderProfile | null;
  /** Settings come from TinyHustle profile — UI should be read-only */
  settingsManagedByAdmin: boolean;
  error: string | null;

  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

let syncStop: (() => void) | null = null;
let authListenerAttached = false;

async function hydrateFromCloud(userId: string, profile: BuilderProfile) {
  const applied = applyBuilderSettings(profile.builder_settings);
  useSettingsStore.setState({
    ai: applied.ai,
    webSearch: applied.webSearch,
    assetSearch: applied.assetSearch,
    system: applied.system,
  });

  const [conversations, memories] = await Promise.all([
    fetchConversations(userId),
    fetchMemories(userId),
  ]);

  // Load history but never restore the last project — App always opens blank
  useConversationStore.setState({
    conversations,
    activeId: null,
    _hasHydrated: true,
  });
  useMemoryStore.setState({
    memories,
    _hasHydrated: true,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  cloudEnabled: isCloudEnabled(),
  ready: !isCloudEnabled(),
  session: null,
  user: null,
  profile: null,
  settingsManagedByAdmin: false,
  error: null,

  clearError: () => set({ error: null }),

  init: async () => {
    if (!isCloudEnabled()) {
      set({ cloudEnabled: false, ready: true });
      return;
    }

    const supabase = getSupabase();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      try {
        const profile = await fetchBuilderProfile(session.user.id);
        if (!profile?.active || !profile.builder_enabled) {
          await supabase.auth.signOut();
          set({
            ready: true,
            session: null,
            user: null,
            profile: null,
            settingsManagedByAdmin: false,
            error:
              "Your account is not allowed to use Yaada Builder. Ask an admin in TinyHustle to enable access.",
          });
        } else {
          await hydrateFromCloud(session.user.id, profile);
          const { startCloudSync } = await import("../lib/cloud-sync");
          syncStop?.();
          syncStop = startCloudSync(session.user.id);
          set({
            ready: true,
            session,
            user: session.user,
            profile,
            settingsManagedByAdmin: true,
            error: null,
          });
        }
      } catch (e) {
        set({
          ready: true,
          session: null,
          user: null,
          profile: null,
          settingsManagedByAdmin: false,
          error: e instanceof Error ? e.message : "Failed to load profile",
        });
      }
    } else {
      syncStop?.();
      syncStop = null;
      set({
        ready: true,
        session: null,
        user: null,
        profile: null,
        settingsManagedByAdmin: false,
      });
    }

    if (!authListenerAttached) {
      authListenerAttached = true;
      supabase.auth.onAuthStateChange(async (event, nextSession) => {
        if (event === "SIGNED_OUT") {
          syncStop?.();
          syncStop = null;
          set({
            session: null,
            user: null,
            profile: null,
            settingsManagedByAdmin: false,
          });
          return;
        }
        if (event === "SIGNED_IN" && nextSession?.user && !get().profile) {
          // signIn() handles hydration; ignore duplicate
        }
      });
    }
  },

  signIn: async (email, password) => {
    set({ error: null });
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      set({ error: error.message });
      throw error;
    }
    if (!data.session?.user) {
      const msg = "Sign-in failed";
      set({ error: msg });
      throw new Error(msg);
    }

    const profile = await fetchBuilderProfile(data.session.user.id);
    if (!profile?.active || !profile.builder_enabled) {
      await supabase.auth.signOut();
      const msg =
        "Your account is not allowed to use Yaada Builder. Ask an admin in TinyHustle to enable access.";
      set({ error: msg, session: null, user: null, profile: null });
      throw new Error(msg);
    }

    await hydrateFromCloud(data.session.user.id, profile);
    const { startCloudSync } = await import("../lib/cloud-sync");
    syncStop?.();
    syncStop = startCloudSync(data.session.user.id);

    set({
      session: data.session,
      user: data.session.user,
      profile,
      settingsManagedByAdmin: true,
      error: null,
    });
  },

  signOut: async () => {
    syncStop?.();
    syncStop = null;
    if (isCloudEnabled()) {
      await getSupabase().auth.signOut();
    }
    useConversationStore.setState({
      conversations: {},
      activeId: null,
    });
    useMemoryStore.setState({ memories: [] });
    set({
      session: null,
      user: null,
      profile: null,
      settingsManagedByAdmin: false,
      error: null,
    });
    // Hard navigation so browser Back cannot restore a cached logged-in UI
    window.location.replace(
      `${window.location.pathname}${window.location.search}` || "/",
    );
  },
}));
