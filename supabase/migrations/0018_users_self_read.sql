-- Authenticated users must be able to read their own users row — required by the
-- route middleware and the post-login role redirect. (0016 only granted admin access.)
create policy users_self_read on users
  for select using (id = auth.uid());
