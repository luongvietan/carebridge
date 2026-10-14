-- A private client's request can be held for admin review before it is
-- published (risk and needs assessment, Ana 14 October 2026). Professionals
-- only ever see `open` bookings (0046), so a request in `pending_review` stays
-- invisible to them until an admin approves it.
--
-- Its own migration: a new enum value cannot be used in the transaction that
-- adds it, and 0093 uses it.
alter type booking_status add value if not exists 'pending_review' before 'open';
