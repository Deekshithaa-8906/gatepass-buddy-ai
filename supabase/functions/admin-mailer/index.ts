declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

import { renderPassNTrackEmail } from '../_shared/email-template.ts';

type Action = 'approved' | 'rejected' | 'resend_create_password' | 'manual_add';

type RequestBody = {
  action: Action;
  email: string;
  role?: string;
  full_name?: string | null;
  appUrl?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
const resendFrom = Deno.env.get('RESEND_FROM_EMAIL') ?? 'PassNTrack <noreply@snsgroups.com>';
const defaultAppUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173';

const apiHeaders = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider error: ${response.status} ${await response.text()}`);
  }
}

function createPasswordEmail(actionLink: string, title: string) {
  return renderPassNTrackEmail({
    title: title.replace(/^PassNTrack:\s*/, ''),
    message: 'Your account is ready. Create a password to access the PassNTrack portal.',
    action: { href: actionLink, label: 'Create Password' },
    notice: 'If you did not expect this email, you can safely ignore it. Do not share this link with anyone.',
  });
}

function rejectionEmail() {
  return renderPassNTrackEmail({
    title: 'Account Request Update',
    message: 'Your account request was not approved at this time. If you believe this is an error, please contact the administration team.',
    notice: 'This is an account-status notification. No action is required unless you need help from the administration team.',
  });
}

async function createPasswordLink(email: string, type: 'invite' | 'recovery', appUrl: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: apiHeaders,
    body: JSON.stringify({
      type,
      email,
      options: {
        redirectTo: `${appUrl}/create-password`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to generate link: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json() as { properties?: { action_link?: string }; action_link?: string };
  return payload.properties?.action_link || payload.action_link || '';
}

// Resend should work for both:
// 1) existing auth users (recovery link)
// 2) pre-approved directory-only users (invite link)
async function createResendLink(email: string, appUrl: string) {
  try {
    const recoveryLink = await createPasswordLink(email, 'recovery', appUrl);
    if (recoveryLink) return recoveryLink;
  } catch {
    // fall back to invite link below
  }

  const inviteLink = await createPasswordLink(email, 'invite', appUrl);
  if (!inviteLink) {
    throw new Error('Unable to generate resend link');
  }

  return inviteLink;
}

async function upsertManualUser(body: RequestBody) {
  const response = await fetch(`${supabaseUrl}/rest/v1/user_directory?on_conflict=email`, {
    method: 'POST',
    headers: {
      ...apiHeaders,
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      email: body.email,
      full_name: body.full_name ?? null,
      role: body.role ?? 'student',
      status: 'approved',
      access_status: 'approved',
      account_status: 'inactive',
      password_created: false,
      onboarding_complete: false,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to upsert user: ${response.status} ${await response.text()}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;

    if (!body.email || !body.action) {
      return json({ error: 'email and action are required' }, 400);
    }

    if (body.action === 'manual_add') {
      const resolvedAppUrl = body.appUrl || defaultAppUrl;
      await upsertManualUser(body);
      const actionLink = await createPasswordLink(body.email, 'invite', resolvedAppUrl);
      await sendEmail(
        body.email,
        'PassNTrack: Create Your Password',
        createPasswordEmail(actionLink, 'PassNTrack: Create Your Password'),
        `Your PassNTrack account is ready. Create your password here: ${actionLink}`,
      );
      return json({ ok: true, action: body.action, email: body.email });
    }

    if (body.action === 'approved') {
      const resolvedAppUrl = body.appUrl || defaultAppUrl;
      const actionLink = await createPasswordLink(body.email, 'invite', resolvedAppUrl);
      await sendEmail(
        body.email,
        'PassNTrack: Create Your Password',
        createPasswordEmail(actionLink, 'PassNTrack: Create Your Password'),
        `Your PassNTrack account has been approved. Create your password here: ${actionLink}`,
      );
      return json({ ok: true, action: body.action, email: body.email });
    }

    if (body.action === 'resend_create_password') {
      const resolvedAppUrl = body.appUrl || defaultAppUrl;
      const actionLink = await createResendLink(body.email, resolvedAppUrl);
      await sendEmail(
        body.email,
        'PassNTrack: Create Your Password',
        createPasswordEmail(actionLink, 'PassNTrack: Create Your Password'),
        `Your PassNTrack account has been approved. Create your password here: ${actionLink}`,
      );
      return json({ ok: true, action: body.action, email: body.email });
    }

    if (body.action === 'rejected') {
      await sendEmail(
        body.email,
        'PassNTrack: Account Request Update',
        rejectionEmail(),
        'Your PassNTrack account request was not approved at this time.',
      );
      return json({ ok: true, action: body.action, email: body.email });
    }

    return json({ error: 'Unsupported action' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
