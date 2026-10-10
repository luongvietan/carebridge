-- Server-only atomic contact persistence, deduplication and mailbox throttling.
create index contact_messages_email_created_idx on public.contact_messages (email, created_at desc);

create or replace function public.submit_contact_enquiry(
  p_name text, p_email text, p_subject text, p_message text
) returns text
language plpgsql
set search_path = public, pg_temp
as $$
declare
  mailbox text := lower(trim(p_email));
begin
  if length(trim(p_name)) not between 1 and 150
     or length(mailbox) not between 3 and 254
     or length(trim(p_message)) not between 1 and 5000
     or coalesce(length(p_subject), 0) > 200 then
    raise exception 'Invalid enquiry';
  end if;
  -- A transaction lock ensures concurrent server instances cannot both pass
  -- the recent-submission checks. The service role is the only caller.
  perform pg_advisory_xact_lock(hashtextextended('contact:' || mailbox, 0));
  if exists (
    select 1 from public.contact_messages
    where email = mailbox and created_at >= now() - interval '10 minutes'
      and name = p_name and subject is not distinct from p_subject and message = p_message
  ) then return 'duplicate'; end if;
  if (select count(*) from public.contact_messages where email = mailbox
      and created_at >= now() - interval '10 minutes') >= 3 then
    return 'throttled';
  end if;
  insert into public.contact_messages(name, email, subject, message)
    values(p_name, mailbox, p_subject, p_message);
  return 'saved';
end;
$$;
revoke all on function public.submit_contact_enquiry(text,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_contact_enquiry(text,text,text,text) to service_role;
