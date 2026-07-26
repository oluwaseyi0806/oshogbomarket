-- Run this in Supabase Dashboard > SQL Editor, once, after creating your project.

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  name text,
  location_area text,
  created_at timestamptz default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type text check (type in ('sell', 'buy_request')) not null,
  title text not null,
  description text,
  price numeric,
  category text,
  location_area text not null,
  images text[] default '{}',
  status text default 'active' check (status in ('active', 'sold', 'closed')),
  created_at timestamptz default now()
);

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade,
  buyer_id uuid references users(id) on delete cascade,
  seller_id uuid references users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade,
  sender_id uuid references users(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- Row Level Security: users can read all active listings, but only manage their own data.
alter table users enable row level security;
alter table listings enable row level security;
alter table chats enable row level security;
alter table messages enable row level security;

create policy "Anyone can read profiles" on users for select using (true);
create policy "Users manage own profile" on users for insert with check (auth.uid() = id);
create policy "Users update own profile" on users for update using (auth.uid() = id);

create policy "Anyone can read listings" on listings for select using (true);
create policy "Users insert own listings" on listings for insert with check (auth.uid() = user_id);
create policy "Users update own listings" on listings for update using (auth.uid() = user_id);
create policy "Users delete own listings" on listings for delete using (auth.uid() = user_id);

create policy "Chat participants can read" on chats for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Buyers can start chats" on chats for insert with check (auth.uid() = buyer_id);

create policy "Chat participants can read messages" on messages for select using (
  exists (select 1 from chats where chats.id = messages.chat_id and (chats.buyer_id = auth.uid() or chats.seller_id = auth.uid()))
);
create policy "Chat participants can send messages" on messages for insert with check (
  auth.uid() = sender_id and
  exists (select 1 from chats where chats.id = messages.chat_id and (chats.buyer_id = auth.uid() or chats.seller_id = auth.uid()))
);

-- Enable realtime on messages so the chat page gets live updates
alter publication supabase_realtime add table messages;

-- Storage bucket for listing photos (create via Dashboard > Storage, or run this if using SQL storage extension)
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "Anyone can view listing images" on storage.objects for select using (bucket_id = 'listing-images');
create policy "Authenticated users can upload listing images" on storage.objects for insert with check (
  bucket_id = 'listing-images' and auth.role() = 'authenticated'
);
