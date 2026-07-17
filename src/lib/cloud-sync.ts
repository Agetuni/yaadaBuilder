import { useConversationStore } from "../store/conversation";
import { useMemoryStore } from "../store/memory";
import {
  deleteConversationRemote,
  deleteMemoryRemote,
  replaceAllMemories,
  upsertConversation,
  upsertMemory,
} from "./cloud-api";
import type { Conversation, MemoryItem } from "../types";

const DEBOUNCE_MS = 800;

/**
 * Keep Supabase in sync with local Zustand stores (latest conversation state only).
 * Returns a cleanup function.
 */
export function startCloudSync(userId: string): () => void {
  let convTimer: ReturnType<typeof setTimeout> | null = null;
  let memTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  let prevConvIds = new Set(
    Object.keys(useConversationStore.getState().conversations),
  );
  let prevMemoryIds = new Set(
    useMemoryStore.getState().memories.map((m) => m.id),
  );

  const flushConversations = async (
    conversations: Record<string, Conversation>,
  ) => {
    if (stopped) return;
    const nextIds = new Set(Object.keys(conversations));

    for (const id of prevConvIds) {
      if (!nextIds.has(id)) {
        try {
          await deleteConversationRemote(id);
        } catch (e) {
          console.error("[cloud-sync] delete conversation failed", id, e);
        }
      }
    }

    for (const conv of Object.values(conversations)) {
      try {
        await upsertConversation(userId, conv);
      } catch (e) {
        console.error("[cloud-sync] upsert conversation failed", conv.id, e);
      }
    }

    prevConvIds = nextIds;
  };

  const flushMemories = async (memories: MemoryItem[]) => {
    if (stopped) return;
    const nextIds = new Set(memories.map((m) => m.id));
    const deleted = [...prevMemoryIds].filter((id) => !nextIds.has(id));

    try {
      if (deleted.length > 3) {
        await replaceAllMemories(userId, memories);
      } else {
        for (const id of deleted) {
          await deleteMemoryRemote(id);
        }
        for (const m of memories) {
          await upsertMemory(userId, m);
        }
      }
    } catch (e) {
      console.error("[cloud-sync] memories sync failed", e);
    }

    prevMemoryIds = nextIds;
  };

  const unsubConv = useConversationStore.subscribe((state) => {
    if (convTimer) clearTimeout(convTimer);
    convTimer = setTimeout(() => {
      void flushConversations(state.conversations);
    }, DEBOUNCE_MS);
  });

  const unsubMem = useMemoryStore.subscribe((state) => {
    if (memTimer) clearTimeout(memTimer);
    memTimer = setTimeout(() => {
      void flushMemories(state.memories);
    }, DEBOUNCE_MS);
  });

  return () => {
    stopped = true;
    if (convTimer) clearTimeout(convTimer);
    if (memTimer) clearTimeout(memTimer);
    unsubConv();
    unsubMem();
  };
}
