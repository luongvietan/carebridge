-- Private bucket for compliance documents (DBS, ID, registration, insurance, training).
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
  on conflict (id) do nothing;

-- A professional may read/write only objects under their own professional-id folder:
--   documents/{professional_id}/{document_type_code}/{file}
create policy documents_owner_rw on storage.objects for all to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] in (select id::text from public.professionals where user_id = auth.uid())
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] in (select id::text from public.professionals where user_id = auth.uid())
  );

-- Admins/Founder can read any document object.
create policy documents_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.is_admin());
