
create type public.app_role as enum ('student','faculty','hod');
create type public.verification_status as enum ('pending','verified','rejected');

create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  email text,
  register_no text,
  batch text,
  department text not null default 'CS&BS',
  current_semester int,
  phone text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('faculty','hod'))
$$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

create policy "profiles self or staff read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "profiles self insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested text := coalesce(new.raw_user_meta_data->>'role','student');
  final_role app_role;
begin
  if requested = 'faculty' then final_role := 'faculty';
  elsif requested = 'hod' and not exists (select 1 from public.user_roles where role='hod') then final_role := 'hod';
  else final_role := 'student';
  end if;
  insert into public.profiles (id, full_name, email, onboarded)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), new.email, final_role <> 'student');
  insert into public.user_roles (user_id, role) values (new.id, final_role);
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table public.semester_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  semester_no int not null check (semester_no between 1 and 8),
  sgpa numeric(4,2),
  credits int,
  attendance numeric(5,2),
  status verification_status not null default 'pending',
  feedback text,
  verified_by uuid,
  verified_at timestamptz,
  document_id uuid,
  created_at timestamptz not null default now(),
  unique(student_id, semester_no)
);

create table public.subject_marks (
  id uuid primary key default gen_random_uuid(),
  semester_record_id uuid not null references public.semester_records(id) on delete cascade,
  student_id uuid not null,
  course_code text,
  course_name text not null,
  credits numeric(4,1),
  grade text,
  grade_points numeric(4,1),
  marks numeric(6,2),
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  title text not null,
  category text not null default 'other',
  semester_no int,
  file_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  status verification_status not null default 'pending',
  feedback text,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  kind text not null default 'certificate',
  title text not null,
  issuer text,
  description text,
  achieved_on date,
  link text,
  document_id uuid references public.documents(id) on delete set null,
  status verification_status not null default 'pending',
  feedback text,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.semester_records, public.subject_marks, public.documents, public.achievements to authenticated;
grant all on public.semester_records, public.subject_marks, public.documents, public.achievements to service_role;
alter table public.semester_records enable row level security;
alter table public.subject_marks enable row level security;
alter table public.documents enable row level security;
alter table public.achievements enable row level security;

create policy "sr read" on public.semester_records for select to authenticated using (student_id = auth.uid() or public.is_staff(auth.uid()));
create policy "sr insert own" on public.semester_records for insert to authenticated with check (student_id = auth.uid() and status = 'pending');
create policy "sr update own pending" on public.semester_records for update to authenticated using (student_id = auth.uid() and status <> 'verified') with check (student_id = auth.uid() and status = 'pending');
create policy "sr staff update" on public.semester_records for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "sr delete own unverified" on public.semester_records for delete to authenticated using (student_id = auth.uid() and status <> 'verified');

create policy "sm read" on public.subject_marks for select to authenticated using (student_id = auth.uid() or public.is_staff(auth.uid()));
create policy "sm insert own" on public.subject_marks for insert to authenticated with check (student_id = auth.uid());
create policy "sm update own" on public.subject_marks for update to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "sm delete own" on public.subject_marks for delete to authenticated using (student_id = auth.uid());

create policy "doc read" on public.documents for select to authenticated using (student_id = auth.uid() or public.is_staff(auth.uid()));
create policy "doc insert own" on public.documents for insert to authenticated with check (student_id = auth.uid() and status = 'pending');
create policy "doc staff update" on public.documents for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "doc delete own" on public.documents for delete to authenticated using (student_id = auth.uid() and status <> 'verified');

create policy "ach read" on public.achievements for select to authenticated using (student_id = auth.uid() or public.is_staff(auth.uid()));
create policy "ach insert own" on public.achievements for insert to authenticated with check (student_id = auth.uid() and status = 'pending');
create policy "ach staff update" on public.achievements for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "ach delete own" on public.achievements for delete to authenticated using (student_id = auth.uid() and status <> 'verified');

create policy "docs upload own" on storage.objects for insert to authenticated with check (bucket_id = 'academic-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "docs read own or staff" on storage.objects for select to authenticated using (bucket_id = 'academic-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff(auth.uid())));
create policy "docs delete own" on storage.objects for delete to authenticated using (bucket_id = 'academic-docs' and (storage.foldername(name))[1] = auth.uid()::text);
