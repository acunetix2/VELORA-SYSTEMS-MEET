# Database Migration Plan

To move data from `localStorage` to the Supabase database provided in your `.env`, we need to create three tables. Please run the following SQL in your Supabase SQL Editor:

```sql
-- 1. Meeting Analytics (Attendance History)
create table if not exists meeting_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  meeting_id text not null,
  role text not null check (role in ('host', 'participant')),
  timestamp timestamptz default now()
);

-- 2. Transcripts & Captions
create table if not exists transcripts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  meeting_id text not null,
  content jsonb not null,
  created_at timestamptz default now()
);

-- 3. Personal Contacts Directory
create table if not exists contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  email text,
  created_at timestamptz default now()
);

-- 4. Scheduled Meetings
create table if not exists scheduled_meetings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  meeting_id text not null,
  title text not null,
  scheduled_for timestamptz not null,
  notes text,
  created_at timestamptz default now()
);

-- 5. System Notifications
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  body text,
  kind text not null check (kind in ('info', 'success', 'meeting')),
  ts bigint not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table meeting_history enable row level security;
alter table transcripts enable row level security;
alter table contacts enable row level security;
alter table scheduled_meetings enable row level security;
alter table notifications enable row level security;

-- RLS Policies
create policy "Users can insert their own history" on meeting_history for insert with check (auth.uid() = user_id);
create policy "Users can view their own history" on meeting_history for select using (auth.uid() = user_id);

create policy "Users can insert their own transcripts" on transcripts for insert with check (auth.uid() = user_id);
create policy "Users can view their own transcripts" on transcripts for select using (auth.uid() = user_id);
create policy "Users can delete their own transcripts" on transcripts for delete using (auth.uid() = user_id);

create policy "Users can manage their own contacts" on contacts for all using (auth.uid() = user_id);
create policy "Users can manage their own scheduled meetings" on scheduled_meetings for all using (auth.uid() = user_id);
create policy "Users can manage their own notifications" on notifications for all using (auth.uid() = user_id);
```
