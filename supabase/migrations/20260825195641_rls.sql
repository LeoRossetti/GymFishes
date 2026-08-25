alter table profiles      enable row level security;
alter table groups        enable row level security;
alter table group_members enable row level security;
alter table bottles       enable row level security;
alter table entries       enable row level security;

create or replace function is_group_member(gid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from group_members
    where group_id = gid and profile_id = auth.uid()
  );
$$;

create or replace function shares_group_with(pid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from group_members mine
    join group_members theirs using (group_id)
    where mine.profile_id = auth.uid() and theirs.profile_id = pid
  );
$$;

-- profiles
create policy profiles_select on profiles for select
  using (id = auth.uid() or shares_group_with(id));
create policy profiles_insert on profiles for insert
  with check (id = auth.uid());
create policy profiles_update on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- groups
create policy groups_select on groups for select
  using (is_group_member(id) or created_by = auth.uid());
create policy groups_insert on groups for insert
  with check (created_by = auth.uid());
create policy groups_update on groups for update
  using (created_by = auth.uid()) with check (created_by = auth.uid());

-- group_members
create policy gm_select on group_members for select
  using (is_group_member(group_id));
create policy gm_insert on group_members for insert
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );
create policy gm_delete on group_members for delete
  using (profile_id = auth.uid());

-- bottles are strictly private; entries carry their own snapshot
create policy bottles_all on bottles for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- entries: readable by the group, writable only by the author.
-- No delete policy on purpose: deletion is a soft delete via update.
create policy entries_select on entries for select
  using (is_group_member(group_id));
create policy entries_insert on entries for insert
  with check (profile_id = auth.uid() and is_group_member(group_id));
create policy entries_update on entries for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Joining a group must not be a plain insert, or a user could add themselves
-- to any group whose id they guessed.
create or replace function join_group(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  select id into gid from groups where invite_code = upper(code);
  if gid is null then
    raise exception 'invalid_code';
  end if;
  insert into group_members (group_id, profile_id)
  values (gid, auth.uid())
  on conflict do nothing;
  return gid;
end $$;
