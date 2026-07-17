import type { ApiType } from "./ai-provider";
import type {
  AISettings,
  AssetSearchSettings,
  SystemSettings,
  WebSearchSettings,
} from "../store/settings";
import type { Conversation, MemoryItem, Message, ProjectFiles } from "../types";

export interface BuilderSettingsPayload {
  ai?: Partial<AISettings> & { apiType?: string };
  webSearch?: Partial<WebSearchSettings>;
  assetSearch?: Partial<AssetSearchSettings>;
  system?: Partial<SystemSettings>;
}

export interface BuilderProfile {
  id: string;
  email: string;
  full_name: string | null;
  active: boolean;
  builder_enabled: boolean;
  builder_settings: BuilderSettingsPayload;
}

export interface BuilderConversationRow {
  id: string;
  user_id: string;
  title: string;
  template: string;
  messages: unknown;
  files: unknown;
  is_project_initialized: boolean;
  compressed_context: { summary: string; fromIndex: number } | null;
  pinned: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface BuilderMemoryRow {
  id: string;
  user_id: string;
  content: string;
  category: MemoryItem["category"];
  created_at: string;
  updated_at: string;
}

export interface BuilderPublishedSiteRow {
  id: string;
  slug: string;
  user_id: string;
  client_id: string;
  conversation_id: string;
  title: string;
  template: string;
  files: unknown;
  created_at: string;
  updated_at: string;
}

const API_TYPES: ApiType[] = [
  "openai-compatible",
  "openai",
  "anthropic",
  "google",
];

function asApiType(value: string | undefined): ApiType {
  if (value && (API_TYPES as string[]).includes(value)) {
    return value as ApiType;
  }
  return "openai-compatible";
}

export function applyBuilderSettings(payload: BuilderSettingsPayload | null | undefined): {
  ai: AISettings;
  webSearch: WebSearchSettings;
  assetSearch: AssetSearchSettings;
  system: SystemSettings;
} {
  const p = payload ?? {};
  return {
    ai: {
      apiType: asApiType(p.ai?.apiType),
      apiKey: p.ai?.apiKey ?? "",
      apiBaseUrl: (p.ai?.apiBaseUrl ?? "").replace(/\/+$/, ""),
      model: p.ai?.model ?? "",
    },
    webSearch: {
      engine: p.webSearch?.engine ?? "disabled",
      tavilyApiKey: p.webSearch?.tavilyApiKey ?? "",
      tavilyApiUrl: p.webSearch?.tavilyApiUrl ?? "https://api.tavily.com",
      firecrawlApiKey: p.webSearch?.firecrawlApiKey ?? "",
      firecrawlApiUrl: p.webSearch?.firecrawlApiUrl ?? "https://api.firecrawl.dev",
    },
    assetSearch: {
      engine: p.assetSearch?.engine ?? "disabled",
      pixabayApiKey: p.assetSearch?.pixabayApiKey ?? "",
      pixabayApiUrl: p.assetSearch?.pixabayApiUrl ?? "https://pixabay.com/api",
      unsplashApiKey: p.assetSearch?.unsplashApiKey ?? "",
      unsplashApiUrl: p.assetSearch?.unsplashApiUrl ?? "https://api.unsplash.com",
    },
    system: {
      language: p.system?.language ?? "system",
      theme:
        p.system?.theme === "dark" || p.system?.theme === "light"
          ? p.system.theme
          : "light",
      reverseProxy: p.system?.reverseProxy ?? false,
    },
  };
}

export function rowToConversation(row: BuilderConversationRow): Conversation {
  return {
    id: row.id,
    title: row.title,
    messages: (Array.isArray(row.messages) ? row.messages : []) as Message[],
    files: (row.files && typeof row.files === "object" && !Array.isArray(row.files)
      ? row.files
      : {}) as ProjectFiles,
    template: row.template || "vite-react-ts",
    isProjectInitialized: row.is_project_initialized,
    compressedContext: row.compressed_context ?? undefined,
    pinned: row.pinned,
    archived: row.archived,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function conversationToRow(
  userId: string,
  conv: Conversation,
): Omit<BuilderConversationRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
} {
  return {
    id: conv.id,
    user_id: userId,
    title: conv.title,
    template: conv.template,
    messages: conv.messages,
    files: conv.files,
    is_project_initialized: conv.isProjectInitialized,
    compressed_context: conv.compressedContext ?? null,
    pinned: !!conv.pinned,
    archived: !!conv.archived,
    created_at: new Date(conv.createdAt).toISOString(),
    updated_at: new Date(conv.updatedAt).toISOString(),
  };
}

export function rowToMemory(row: BuilderMemoryRow): MemoryItem {
  return {
    id: row.id,
    content: row.content,
    category: row.category,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function memoryToRow(userId: string, item: MemoryItem) {
  return {
    id: item.id,
    user_id: userId,
    content: item.content,
    category: item.category,
    created_at: new Date(item.createdAt).toISOString(),
    updated_at: new Date(item.updatedAt).toISOString(),
  };
}
