-- entries.drank_on is always overwritten by the entries_set_day trigger; a default
-- makes the generated Insert type optional so the client stops passing a throwaway
-- value (M1 review carry-in).
alter table entries alter column drank_on
  set default (now() at time zone 'America/Sao_Paulo')::date;

-- Realtime: postgres_changes only fires for tables in the publication.
alter publication supabase_realtime add table entries;

-- Private photos bucket (spec §13).
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Storage RLS (spec §11): paths are {group_id}/{profile_id}/{entry_id}.jpg.
-- read: first segment is a group I belong to.
-- write/delete: additionally, second segment is me.
create policy photos_select on storage.objects for select
  using (
    bucket_id = 'photos'
    and is_group_member(((storage.foldername(name))[1])::uuid)
  );

create policy photos_insert on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and is_group_member(((storage.foldername(name))[1])::uuid)
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- update exists so a retried or replaced upload can upsert the same path
create policy photos_update on storage.objects for update
  using (
    bucket_id = 'photos'
    and is_group_member(((storage.foldername(name))[1])::uuid)
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'photos'
    and is_group_member(((storage.foldername(name))[1])::uuid)
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy photos_delete on storage.objects for delete
  using (
    bucket_id = 'photos'
    and is_group_member(((storage.foldername(name))[1])::uuid)
    and (storage.foldername(name))[2] = auth.uid()::text
  );
