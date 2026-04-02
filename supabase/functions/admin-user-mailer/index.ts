declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

type Action = 'approved' | 'rejected' | 'resend_create_password' | 'manual_add';

type RequestBody = {
  action: Action;
  email: string;
  role?: string;
  full_name?: string | null;
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
const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173';

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
  return `
    <div style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
        <div style="background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 12px 40px rgba(15,23,42,0.08);">
          <div style="padding:28px 32px;background:linear-gradient(135deg,#fff6f6,#ffffff);border-bottom:1px solid #f3f4f6;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:44px;height:44px;border-radius:12px;background:#cd0000;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">P</div>
              <div>
                <div style="font-size:18px;font-weight:700;line-height:1.2;">PassNTrack</div>
                <div style="font-size:13px;color:#6b7280;">Hostel Management Access</div>
              </div>
            </div>
          </div>
          <div style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;color:#111827;">${title}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#374151;">Your account has been approved. Click the button below to create your password and continue to the portal.</p>
            <div style="margin:28px 0;">
              <a href="${actionLink}" style="display:inline-block;background:#cd0000;color:#ffffff;text-decoration:none;font-weight:700;border-radius:14px;padding:14px 24px;">Create Password</a>
            </div>
            <p style="margin:0;font-size:13px;line-height:1.8;color:#6b7280;">If the button does not work, copy and paste this link into your browser:</p>
            <p style="margin:10px 0 0;font-size:13px;line-height:1.8;word-break:break-all;color:#2563eb;">${actionLink}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function rejectionEmail() {
  return `
    <div style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
        <div style="background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 12px 40px rgba(15,23,42,0.08);padding:32px;">
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;color:#111827;">Account Request Update</h1>
          <p style="margin:0;font-size:15px;line-height:1.8;color:#374151;">Your account request was not approved at this time. If you believe this is an error, please contact the administration team.</p>
        </div>
      </div>
    </div>
  `;
}

async function createPasswordLink(email: string, type: 'invite' | 'recovery') {
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
      await upsertManualUser(body);
      const actionLink = await createPasswordLink(body.email, 'invite');
      await sendEmail(
        body.email,
        'PassNTrack: Create Your Password',
        createPasswordEmail(actionLink, 'PassNTrack: Create Your Password'),
        `Your PassNTrack account is ready. Create your password here: ${actionLink}`,
      );
      return json({ ok: true, action: body.action, email: body.email });
    }

    if (body.action === 'approved' || body.action === 'resend_create_password') {
      const actionLink = await createPasswordLink(body.email, 'recovery');
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
