-- Lock down the `documents` private bucket: allow only PDF/JPEG/PNG and cap size.
-- Defence-in-depth alongside the application-layer allow-list in uploadDocument;
-- this prevents a bypass via direct storage API calls and a future leaky route.
update storage.buckets
   set allowed_mime_types = array['application/pdf','image/jpeg','image/png'],
       file_size_limit    = 25 * 1024 * 1024
 where id = 'documents';
