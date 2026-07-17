import { getSupabase } from "./supabase";
import {
  conversationToRow,
  memoryToRow,
  rowToConversation,
  rowToMemory,
  type BuilderConversationRow,
  type BuilderMemoryRow,
  type BuilderProfile,
} from "./builder-types";
import type { Conversation, MemoryItem } from "../types";

export async function fetchBuilderProfile(
  userId: string,
): Promise<BuilderProfile | null> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, email, full_name, active, builder_enabled, builder_settings")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as BuilderProfile | null;
}

export async function fetchConversations(
  userId: string,
): Promise<Record<string, Conversation>> {
  const { data, error } = await getSupabase()
    .from("builder_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const map: Record<string, Conversation> = {};
  for (const row of (data ?? []) as BuilderConversationRow[]) {
    map[row.id] = rowToConversation(row);
  }
  return map;
}

export async function upsertConversation(
  userId: string,
  conv: Conversation,
): Promise<void> {
  const row = conversationToRow(userId, conv);
  const { error } = await getSupabase()
    .from("builder_conversations")
    .upsert(row, { onConflict: "id" });
  if (error) throw error;
}

export async function deleteConversationRemote(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("builder_conversations")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function fetchMemories(userId: string): Promise<MemoryItem[]> {
  const { data, error } = await getSupabase()
    .from("builder_memories")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as BuilderMemoryRow[]).map(rowToMemory);
}

export async function upsertMemory(
  userId: string,
  item: MemoryItem,
): Promise<void> {
  const { error } = await getSupabase()
    .from("builder_memories")
    .upsert(memoryToRow(userId, item), { onConflict: "id" });
  if (error) throw error;
}

export async function deleteMemoryRemote(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from("builder_memories")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function replaceAllMemories(
  userId: string,
  memories: MemoryItem[],
): Promise<void> {
  const supabase = getSupabase();
  const { error: delError } = await supabase
    .from("builder_memories")
    .delete()
    .eq("user_id", userId);
  if (delError) throw delError;

  if (memories.length === 0) return;

  const { error } = await supabase
    .from("builder_memories")
    .insert(memories.map((m) => memoryToRow(userId, m)));
  if (error) throw error;
}
