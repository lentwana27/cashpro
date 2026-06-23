-- Supabase SQL Schema for CashUp Pro

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table
create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('ADMIN', 'ACCOUNTANT', 'HEAD_ACCOUNTANT', 'DIRECTOR', 'SUPERVISOR', 'AUDITOR')),
  branch_id text,
  active boolean default true,
  last_seen timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Branches Table
create table branches (
  id text primary key,
  name text not null,
  code text unique not null,
  location text not null,
  active boolean default true,
  lat double precision,
  lng double precision,
  created_at timestamp with time zone default now()
);

-- Exchange Rates
create table exchange_rates (
  id text primary key,
  currency_code text unique not null,
  rate_to_usd double precision not null,
  effective_date timestamp with time zone
);

-- Logs
create table system_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  user_name text not null,
  action text not null,
  details text,
  timestamp timestamp with time zone default now()
);

-- Note: You will need to create the tables for reconciliations, line items and messages 
-- based on the frontend schema when you are ready to migrate the data layer completely.
