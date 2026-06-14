begin;
select plan(2);

select is( (select public from storage.buckets where id='documents'), false, 'documents bucket is private');
select isnt( (select count(*) from pg_policies
              where schemaname='storage' and tablename='objects' and policyname like 'documents_%'),
             0::bigint, 'documents storage policies exist');

select * from finish();
rollback;
