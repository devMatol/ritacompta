-- Kozha Cloud Database Schema for Supabase
-- Paste and run this script in your Supabase SQL Editor (https://app.supabase.com)

-- 1. Items Table (Active Inventory)
create table if not exists items (
  id text primary key,
  brand text not null,
  title text not null,
  category text not null,
  size text,
  source text,
  purchase_price numeric default 0,
  target_price numeric default 0,
  photo text,
  purchase_date text,
  vinted_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Sales Table (Sales Ledger)
create table if not exists sales (
  id text primary key,
  item_id text,
  brand text not null,
  title text not null,
  channel text not null,
  sale_price numeric not null,
  purchase_price numeric default 0,
  photo text,
  sale_date text not null,
  purchase_date text,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Vinted Catalog Table (Rita's 120 verified wardrobe items)
create table if not exists vinted_catalog (
  id text primary key,
  title text not null,
  brand text not null,
  condition text,
  size text,
  price numeric not null,
  photo text,
  url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS) & Public access for Kozha app
alter table items enable row level security;
alter table sales enable row level security;
alter table vinted_catalog enable row level security;

create policy "Allow all operations for anon users on items"
  on items for all
  to anon
  using (true)
  with check (true);

create policy "Allow all operations for anon users on sales"
  on sales for all
  to anon
  using (true)
  with check (true);

create policy "Allow all operations for anon users on vinted_catalog"
  on vinted_catalog for all
  to anon
  using (true)
  with check (true);

-- 5. Enable Realtime subscriptions across all connected devices (phones, laptops)
alter publication supabase_realtime add table items;
alter publication supabase_realtime add table sales;
alter publication supabase_realtime add table vinted_catalog;
