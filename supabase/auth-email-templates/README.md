# PassNTrack Supabase Auth email templates

These files mirror the reusable Resend template used by the Edge Functions. In the Supabase dashboard, open **Authentication → Emails**, select the matching template, and paste the file contents into its message editor.

| Supabase template | Source file | Dynamic value |
| --- | --- | --- |
| Confirm signup | `email-verification.html` | `{{ .Token }}` |
| Magic Link | `magic-link.html` | `{{ .ConfirmationURL }}` |
| Invite user | `invite.html` | `{{ .ConfirmationURL }}` |
| Reset password | `reset-password.html` | `{{ .ConfirmationURL }}` |

The live custom registration OTP and create-password emails do not need this dashboard step: they are delivered through the Edge Functions and share `supabase/functions/_shared/email-template.ts`.
