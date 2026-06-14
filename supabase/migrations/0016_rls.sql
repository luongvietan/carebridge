-- Helper: is the current user an admin or founder?
-- SECURITY DEFINER so it bypasses RLS when reading `users` — otherwise the users
-- admin policy would call is_admin() which reads users, causing infinite recursion.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from users u
     where u.id = auth.uid() and (u.account_type = 'admin' or u.is_founder));
$$;

-- Standard Supabase access model: grant table privileges to the API roles and gate
-- actual row access with RLS policies below.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Enable RLS everywhere
alter table users                          enable row level security;
alter table consents                       enable row level security;
alter table professionals                  enable row level security;
alter table professional_skills            enable row level security;
alter table professional_availability      enable row level security;
alter table eligibility_screenings         enable row level security;
alter table professional_training_records  enable row level security;
alter table assessment_question_bank       enable row level security;
alter table assessment_attempts            enable row level security;
alter table assessment_answers             enable row level security;
alter table documents                      enable row level security;
alter table compliance_requirements        enable row level security;
alter table compliance_alerts              enable row level security;
alter table professional_status_actions    enable row level security;
alter table private_clients                enable row level security;
alter table organisations                  enable row level security;
alter table rate_cards                     enable row level security;
alter table bookings                       enable row level security;
alter table booking_status_history         enable row level security;
alter table booking_cancellations          enable row level security;
alter table payments                       enable row level security;
alter table payouts                        enable row level security;
alter table professional_payout_details    enable row level security;
alter table notification_templates         enable row level security;
alter table notifications                  enable row level security;
alter table audit_log                      enable row level security;
alter table content_pages                  enable row level security;
alter table faq_items                      enable row level security;

-- Admin/Founder: full access on every table
do $$
declare t text;
begin
  foreach t in array array[
    'users','consents','professionals','professional_skills','professional_availability',
    'eligibility_screenings','professional_training_records','assessment_question_bank',
    'assessment_attempts','assessment_answers','documents','compliance_requirements',
    'compliance_alerts','professional_status_actions','private_clients','organisations',
    'rate_cards','bookings','booking_status_history','booking_cancellations','payments',
    'payouts','professional_payout_details','notification_templates','notifications',
    'audit_log','content_pages','faq_items']
  loop
    execute format('create policy %I_admin_all on %I for all using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end $$;

-- Professional: see/update own profile and own child rows
create policy prof_self on professionals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy prof_docs_self on documents
  for all using (professional_id in (select id from professionals where user_id = auth.uid()))
  with check (professional_id in (select id from professionals where user_id = auth.uid()));

-- Open bookings are visible to professionals (to view/accept); plus their assigned bookings
create policy bookings_prof_visibility on bookings
  for select using (
    status = 'open'
    or assigned_professional_id in (select id from professionals where user_id = auth.uid()));

-- Clients/Orgs: own bookings
create policy bookings_requester on bookings
  for all using (requester_user_id = auth.uid()) with check (requester_user_id = auth.uid());

-- Public read-only content
create policy content_public_read on content_pages for select using (true);
create policy faq_public_read on faq_items for select using (is_active);
