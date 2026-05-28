# Super Admin Bootstrap

The super admin (Owner) account is provisioned by the `seed-owner` edge function
using two backend secrets:

- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`

These are **never** shipped to the client. Update them at any time from the
Lovable Cloud secrets manager.

## Run the seed (new environment)

```bash
curl -X POST \
  "https://<PROJECT_REF>.supabase.co/functions/v1/seed-owner" \
  -H "apikey: <ANON_KEY>"
```

The first call (when no Owner exists yet) is unauthenticated by design — it
bootstraps the very first account. Every subsequent call requires either:

1. **Bootstrap token** — pass the current `SUPER_ADMIN_PASSWORD` as the
   `X-Bootstrap-Token` header. Useful for re-syncing the password after a
   secret rotation.
2. **Owner JWT** — pass `Authorization: Bearer <owner-jwt>` from an already
   authenticated Owner session.

## Behavior

The function is idempotent:

- Creates the auth user if missing (email auto-confirmed).
- Updates the password to the current secret on every call.
- Ensures the `profiles` row exists and `is_active = true`.
- Removes any non-`owner` roles assigned by the signup trigger and upserts
  the `owner` role.

## Rotating the super admin password

1. Update the `SUPER_ADMIN_PASSWORD` secret in Lovable Cloud.
2. Re-run the seed endpoint with the **old** password as `X-Bootstrap-Token`,
   or while signed in as the Owner.

## Password reset flow

Standard reset is wired end-to-end:

- `/auth` → **Forgot password** → `supabase.auth.resetPasswordForEmail`
- Recovery link lands on `/reset-password`, which calls
  `supabase.auth.updateUser({ password })`.
- Admins/Owners can trigger a reset email for any teammate from
  **Team → ⋯ → Send Password Reset**.
