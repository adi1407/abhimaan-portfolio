-- Abhimaan CMS — paste this into the Supabase SQL editor (once).
create extension if not exists "pgcrypto";

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null
);

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text not null default '',
  service text not null,
  deliverable text not null default '',
  deadline text not null default '',
  budget text not null default '',
  message text not null,
  read boolean not null default false
);
create index if not exists inquiries_email_idx on inquiries (email);
create index if not exists inquiries_created_idx on inquiries (created_at desc);

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  mime text not null default 'application/octet-stream',
  path text not null,
  width int,
  height int,
  alt text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists work_categories (
  id text primary key,
  label text not null,
  short text not null,
  slot text not null default 'tl',
  blurb text not null default '',
  sort int not null default 0,
  behance_url text not null default ''
);

create table if not exists work_items (
  id text primary key,
  category_id text not null references work_categories(id) on delete cascade,
  title text not null,
  year text not null default '',
  media_id uuid references media(id) on delete set null,
  aspect text not null default 'wide',
  sort int not null default 0,
  behance_url text not null default ''
);
create index if not exists work_items_category_idx on work_items (category_id);

create table if not exists campaigns (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  layout text not null default 'mosaic-6a',
  cover_media_id uuid references media(id) on delete set null,
  sort int not null default 0
);

create table if not exists campaign_images (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references campaigns(id) on delete cascade,
  media_id uuid references media(id) on delete set null,
  slug text not null default '',
  label text not null default '',
  aspect text not null default '',
  sort int not null default 0
);
create index if not exists campaign_images_campaign_idx on campaign_images (campaign_id);

create table if not exists books (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  cover_media_id uuid references media(id) on delete set null
);

create table if not exists book_pages (
  id uuid primary key default gen_random_uuid(),
  book_id text not null references books(id) on delete cascade,
  media_id uuid references media(id) on delete set null,
  label text not null default '',
  sort int not null default 0
);
create index if not exists book_pages_book_idx on book_pages (book_id);

create table if not exists site_pages (
  key text primary key,
  body jsonb not null default '{}'::jsonb
);

alter table admin_users enable row level security;
alter table inquiries enable row level security;
alter table media enable row level security;
alter table work_categories enable row level security;
alter table work_items enable row level security;
alter table campaigns enable row level security;
alter table campaign_images enable row level security;
alter table books enable row level security;
alter table book_pages enable row level security;
alter table site_pages enable row level security;

-- Public reads (Next.js can also use the service role, which bypasses RLS).
drop policy if exists "public read media" on media;
create policy "public read media" on media for select using (true);
drop policy if exists "public read work_categories" on work_categories;
create policy "public read work_categories" on work_categories for select using (true);
drop policy if exists "public read work_items" on work_items;
create policy "public read work_items" on work_items for select using (true);
drop policy if exists "public read campaigns" on campaigns;
create policy "public read campaigns" on campaigns for select using (true);
drop policy if exists "public read campaign_images" on campaign_images;
create policy "public read campaign_images" on campaign_images for select using (true);
drop policy if exists "public read books" on books;
create policy "public read books" on books for select using (true);
drop policy if exists "public read book_pages" on book_pages;
create policy "public read book_pages" on book_pages for select using (true);
drop policy if exists "public read site_pages" on site_pages;
create policy "public read site_pages" on site_pages for select using (true);
drop policy if exists "public insert inquiries" on inquiries;
create policy "public insert inquiries" on inquiries for insert with check (true);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "public read cms media" on storage.objects;
create policy "public read cms media"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "service write cms media" on storage.objects;
create policy "service write cms media"
  on storage.objects for all
  using (bucket_id = 'media')
  with check (bucket_id = 'media');
