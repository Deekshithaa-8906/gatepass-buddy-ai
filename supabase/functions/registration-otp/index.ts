declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

type Action = 'send' | 'verify';

type RequestBody = {
  action: Action;
  email: string;
  role?: string;
  otp?: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

import { renderPassNTrackEmail } from '../_shared/email-template.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
const resendFrom = Deno.env.get('RESEND_FROM_EMAIL') ?? 'PassNTrack <noreply@snsgroups.com>';

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

function randomOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
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

function registrationOtpEmail(otp: string, email: string) {
  return renderPassNTrackEmail({
    title: 'Verify Your Identity',
    message: `To continue creating your account for ${email}, use the verification code below. This code expires in 10 minutes.`,
    code: { value: otp },
    notice: 'If you did not request this code, please ignore this email or contact support if you have concerns about your account security.',
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    let body: RequestBody;

    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }
    const email = body.email.trim().toLowerCase();

    if (!email || !body.action) {
      return json({ error: 'email and action are required' }, 400);
    }

    if (body.action === 'send') {
      const otp = randomOtp();
      const salt = crypto.randomUUID().replace(/-/g, '');
      const otpHash = await sha256(`${otp}:${salt}`);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const upsertResponse = await fetch(`${supabaseUrl}/rest/v1/registration_otp_challenges`, {
        method: 'POST',
        headers: {
          ...apiHeaders,
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          email,
          role: body.role ?? 'student',
          otp_hash: otpHash,
          otp_salt: salt,
          expires_at: expiresAt,
          verified_at: null,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!upsertResponse.ok) {
        throw new Error(`Unable to store verification code: ${upsertResponse.status} ${await upsertResponse.text()}`);
      }

      await sendEmail(
        email,
        'PassNTrack: Verify Your Email',
        registrationOtpEmail(otp, email),
        `Your PassNTrack verification code is ${otp}. It expires in 10 minutes.`,
      );

      return json({ ok: true, email }, 200);
    }

    if (body.action === 'verify') {
      if (!body.otp) {
        return json({ error: 'otp is required' }, 400);
      }

      const challengeResponse = await fetch(
        `${supabaseUrl}/rest/v1/registration_otp_challenges?email=eq.${encodeURIComponent(email)}&select=email,role,otp_hash,otp_salt,expires_at`,
        { headers: apiHeaders },
      );

      if (!challengeResponse.ok) {
        throw new Error(`Unable to read verification code: ${challengeResponse.status} ${await challengeResponse.text()}`);
      }

      const challenges = (await challengeResponse.json()) as Array<{
        email: string;
        role: string;
        otp_hash: string;
        otp_salt: string;
        expires_at: string;
      }>;

      const challenge = challenges[0];
      if (!challenge) {
        return json({ error: 'Verification code not found. Please request a new code.' }, 404);
      }

      if (new Date(challenge.expires_at).getTime() < Date.now()) {
        return json({ error: 'Verification code has expired. Please request a new code.' }, 400);
      }

      const submittedHash = await sha256(`${body.otp.trim()}:${challenge.otp_salt}`);
      if (submittedHash !== challenge.otp_hash) {
        return json({ error: 'Invalid verification code.' }, 400);
      }

      const directoryResponse = await fetch(`${supabaseUrl}/rest/v1/user_directory?on_conflict=email`, {
        method: 'POST',
        headers: {
          ...apiHeaders,
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          email,
          role: challenge.role,
          status: 'pending',
          access_status: 'pending_approval',
          account_status: 'inactive',
          full_name: '',
          mobile_number: '',
          password_created: false,
          onboarding_complete: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });

      if (!directoryResponse.ok) {
        throw new Error(`Unable to create user_directory row: ${directoryResponse.status} ${await directoryResponse.text()}`);
      }

      await fetch(`${supabaseUrl}/rest/v1/registration_otp_challenges?email=eq.${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: apiHeaders,
      });

      return json({ ok: true, email, role: challenge.role }, 200);
    }

    return json({ error: 'Unsupported action' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
