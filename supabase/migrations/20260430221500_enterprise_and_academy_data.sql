-- 1. Organizations & Team Management
create table if not exists organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users not null,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists organization_members (
  id uuid default gen_random_uuid() primary key,
  org_id uuid references organizations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  unique(org_id, user_id)
);

-- 2. Academy & Learning
create table if not exists academy_courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text not null,
  lessons_count int default 0,
  image_url text,
  video_url text,
  created_at timestamptz default now()
);

create table if not exists user_course_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  course_id uuid references academy_courses on delete cascade not null,
  progress int default 0 check (progress >= 0 and progress <= 100),
  status text default 'in_progress' check (status in ('in_progress', 'completed')),
  updated_at timestamptz default now(),
  unique(user_id, course_id)
);

-- 3. RLS
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table academy_courses enable row level security;
alter table user_course_progress enable row level security;

create policy "Orgs are viewable by members" on organizations for select
  using (exists (select 1 from organization_members where org_id = organizations.id and user_id = auth.uid()));

create policy "Org admins can manage org" on organizations for all
  using (exists (select 1 from organization_members where org_id = organizations.id and user_id = auth.uid() and role = 'admin'));

create policy "Members can view their own org memberships" on organization_members for select
  using (user_id = auth.uid());

create policy "Courses are viewable by everyone" on academy_courses for select
  using (true);

create policy "Users can manage their own progress" on user_course_progress for all
  using (user_id = auth.uid());

-- 4. Seed some initial Academy content
insert into academy_courses (title, description, category, lessons_count)
values 
  ('Video Basics & Lighting', 'Set up your camera, lighting, and audio for pro results.', 'Hardware', 5),
  ('Advanced Collaboration Tools', 'Master whiteboarding, polls, and breakout rooms.', 'Features', 8),
  ('Maintaining High Engagement', 'Tips for keeping remote teams focused and happy.', 'Soft Skills', 4),
  ('Velora Expert Certification', 'Complete the tracks and earn your Velora Badge.', 'Certification', 12)
on conflict do nothing;
