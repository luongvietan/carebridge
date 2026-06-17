/** React Doctor tuning for @carebridge/web */
export default {
  rules: {
    // Server-only mutation modules (service-writes, account-service) derive actor ids
    // from requireAuth() in the calling action — not client-supplied authz fields.
    "react-doctor/supabase-client-owned-authz-field": "off",
  },
};
