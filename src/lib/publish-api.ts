import { getSupabase } from "./supabase";
import type { BuilderPublishedSiteRow } from "./builder-types";
import type { ProjectFiles } from "../types";

export interface PublishedSite {
  id: string;
  slug: string;
  userId: string;
  clientId: string;
  conversationId: string;
  title: string;
  template: string;
  files: ProjectFiles;
  createdAt: string;
  updatedAt: string;
}

export interface PublishSiteInput {
  userId: string;
  clientId: string;
  conversationId: string;
  title: string;
  template: string;
  files: ProjectFiles;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

function rowToPublishedSite(row: BuilderPublishedSiteRow): PublishedSite {
  return {
    id: row.id,
    slug: row.slug,
    userId: row.user_id,
    clientId: row.client_id,
    conversationId: row.conversation_id,
    title: row.title,
    template: row.template || "vite-react-ts",
    files: (row.files && typeof row.files === "object" && !Array.isArray(row.files)
      ? row.files
      : {}) as ProjectFiles,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function randomSuffix(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i]! % chars.length];
  }
  return out;
}

export function makePublishSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "site"}-${randomSuffix()}`;
}

function publishErrorMessage(error: { code?: string; message?: string }): string {
  const msg = error.message ?? "Publish failed";
  if (
    error.code === "23503" ||
    /foreign key|clients/i.test(msg)
  ) {
    return "Client UUID not found";
  }
  if (error.code === "23505" || /duplicate|unique/i.test(msg)) {
    return "Slug already exists — try again";
  }
  return msg;
}

/** Public publish links always use the Yaada Labs site. */
const PUBLISH_ORIGIN = "https://yaadalabs.com";

export function publishedSiteUrl(slug: string): string {
  return `${PUBLISH_ORIGIN}/p/${slug}`;
}

export async function fetchPublishedSite(
  slug: string,
): Promise<PublishedSite | null> {
  const { data, error } = await getSupabase()
    .from("builder_published_sites")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToPublishedSite(data as BuilderPublishedSiteRow);
}

export async function fetchPublishedForConversation(
  conversationId: string,
): Promise<PublishedSite | null> {
  const { data, error } = await getSupabase()
    .from("builder_published_sites")
    .select("*")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToPublishedSite(data as BuilderPublishedSiteRow);
}

export async function publishSite(
  input: PublishSiteInput,
): Promise<PublishedSite> {
  const clientId = input.clientId.trim();
  if (!isValidUuid(clientId)) {
    throw new Error("Invalid client UUID");
  }

  const supabase = getSupabase();
  const existing = await fetchPublishedForConversation(input.conversationId);
  const now = new Date().toISOString();

  if (existing) {
    const { data, error } = await supabase
      .from("builder_published_sites")
      .update({
        client_id: clientId,
        title: input.title,
        template: input.template,
        files: input.files,
        updated_at: now,
      })
      .eq("conversation_id", input.conversationId)
      .select("*")
      .single();

    if (error) throw new Error(publishErrorMessage(error));
    return rowToPublishedSite(data as BuilderPublishedSiteRow);
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = makePublishSlug(input.title);
    const { data, error } = await supabase
      .from("builder_published_sites")
      .insert({
        slug,
        user_id: input.userId,
        client_id: clientId,
        conversation_id: input.conversationId,
        title: input.title,
        template: input.template,
        files: input.files,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (!error) {
      return rowToPublishedSite(data as BuilderPublishedSiteRow);
    }

    lastError = new Error(publishErrorMessage(error));
    if (error.code !== "23505" && !/duplicate|unique/i.test(error.message ?? "")) {
      throw lastError;
    }
  }

  throw lastError ?? new Error("Publish failed");
}

export async function unpublishSite(conversationId: string): Promise<void> {
  const { error } = await getSupabase()
    .from("builder_published_sites")
    .delete()
    .eq("conversation_id", conversationId);
  if (error) throw error;
}
