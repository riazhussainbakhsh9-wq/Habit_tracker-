-- Run this in Supabase SQL editor

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key,
  email text unique not null,
  created_at timestamptz default now()
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  image_url text,
  frequency text default 'daily',
  created_at timestamptz default now()
);

alter table if exists habits add column if not exists image_url text;

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  date date not null,
  status text not null check (status in ('completed', 'missed')),
  created_at timestamptz default now(),
  unique(habit_id, date)
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan text not null check (plan in ('free', 'premium')),
  billing_cycle text default 'monthly',
  status text not null check (status in ('pending', 'active', 'expired')),
  start_date timestamptz,
  end_date timestamptz,
  payment_phone text,
  screenshot_url text,
  approved_by_admin boolean default false,
  created_at timestamptz default now()
);

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text default 'admin',
  created_at timestamptz default now()
);

create table if not exists ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  emotion text,
  prompt text,
  response_json jsonb,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);
