begin;
select plan(4);

select has_table('content_pages');
select has_table('faq_items');
select has_view('v_platform_revenue');
select has_view('v_export_bookings');

select * from finish();
rollback;
