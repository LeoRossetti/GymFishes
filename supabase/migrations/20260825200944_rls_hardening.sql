-- Fix: entries_update did not pin group_id, letting an author move an entry
-- into a group they do not belong to. Pin membership on both sides.
drop policy entries_update on entries;
create policy entries_update on entries for update
  using (profile_id = auth.uid() and is_group_member(group_id))
  with check (profile_id = auth.uid() and is_group_member(group_id));

-- Hardening: pg_temp resolves BEFORE pg_catalog for relation lookups unless
-- listed last; pin it so a temp table can never shadow group_members.
create or replace function is_group_member(gid uuid) returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists (
    select 1 from group_members
    where group_id = gid and profile_id = auth.uid()
  );
$$;

create or replace function shares_group_with(pid uuid) returns boolean
language sql security definer stable set search_path = public, pg_temp as $$
  select exists (
    select 1
    from group_members mine
    join group_members theirs using (group_id)
    where mine.profile_id = auth.uid() and theirs.profile_id = pid
  );
$$;

-- Fix: unauthenticated callers could distinguish valid from invalid codes
-- (23502 vs P0001). Same domain error for both, and pg_temp pinned.
create or replace function join_group(code text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare gid uuid;
begin
  if auth.uid() is null then
    raise exception 'invalid_code';
  end if;
  select id into gid from groups where invite_code = upper(code);
  if gid is null then
    raise exception 'invalid_code';
  end if;
  insert into group_members (group_id, profile_id)
  values (gid, auth.uid())
  on conflict do nothing;
  return gid;
end $$;
