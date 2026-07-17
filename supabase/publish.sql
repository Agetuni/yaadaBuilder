-- Run once in the Supabase SQL editor.
-- Requires an existing `clients` table with UUID primary key `id`.

create table if not exists builder_published_sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id),
  conversation_id uuid not null,
  title text not null default '',
  template text not null default 'vite-react-ts',
  files jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- one published site per conversation (republish updates same row)
create unique index if not exists builder_published_sites_conversation_uidx
  on builder_published_sites (conversation_id);

create index if not exists builder_published_sites_client_id_idx
  on builder_published_sites (client_id);

alter table builder_published_sites enable row level security;

create policy "public read published sites"
  on builder_published_sites for select using (true);

create policy "owner write published sites"
  on builder_published_sites for insert with check (auth.uid() = user_id);

create policy "owner update published sites"
  on builder_published_sites for update using (auth.uid() = user_id);

create policy "owner delete published sites"
  on builder_published_sites for delete using (auth.uid() = user_id);
