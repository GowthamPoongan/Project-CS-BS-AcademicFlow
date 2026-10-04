-- Buckets already used by the application. Keep student records private.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('academic-docs', 'academic-docs', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png']),
  ('profile-photos', 'profile-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Notifications are owner-readable and writable only by trusted server roles.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
drop policy if exists "notifications read own" on public.notifications;
drop policy if exists "notifications update own" on public.notifications;
create policy "notifications read own"
on public.notifications for select to authenticated
using (user_id = auth.uid());
create policy "notifications update own"
on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Policies call these SECURITY DEFINER helpers, so authenticated requests need execute permission.
grant execute on function public.is_staff(uuid) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- A verified semester makes its subject rows official as well. Students cannot
-- insert, edit, or delete subject marks once their parent semester is verified.
drop policy if exists "sm insert own" on public.subject_marks;
drop policy if exists "sm update own" on public.subject_marks;
drop policy if exists "sm delete own" on public.subject_marks;

create policy "sm insert own unverified semester"
on public.subject_marks for insert to authenticated
with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.semester_records sr
    where sr.id = semester_record_id
      and sr.student_id = auth.uid()
      and sr.status <> 'verified'
  )
);

create policy "sm update own unverified semester"
on public.subject_marks for update to authenticated
using (
  student_id = auth.uid()
  and exists (
    select 1 from public.semester_records sr
    where sr.id = semester_record_id
      and sr.student_id = auth.uid()
      and sr.status <> 'verified'
  )
)
with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.semester_records sr
    where sr.id = semester_record_id
      and sr.student_id = auth.uid()
      and sr.status <> 'verified'
  )
);

create policy "sm delete own unverified semester"
on public.subject_marks for delete to authenticated
using (
  student_id = auth.uid()
  and exists (
    select 1 from public.semester_records sr
    where sr.id = semester_record_id
      and sr.student_id = auth.uid()
      and sr.status <> 'verified'
  )
);
