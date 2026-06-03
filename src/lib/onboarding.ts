import { supabase } from './supabase';

export type OnboardingRole = 'student' | 'staff' | 'mentor' | 'advisor' | 'hod' | 'warden' | 'principal';

type DetailTable = 'students_details' | 'staff_details' | 'hod_details' | 'principal_details' | 'warden_details';

type CompleteOnboardingArgs = {
  email: string;
  table: DetailTable;
  profileRow: Record<string, unknown>;
};

export function routeAfterOnboarding(role?: string | null) {
  const normalized = (role || 'student').toLowerCase();
  if (normalized === 'principal') return '/principal-dashboard';
  if (normalized === 'warden') return '/warden-dashboard';
  if (normalized === 'staff' || normalized === 'mentor' || normalized === 'advisor' || normalized === 'hod') {
    return '/staff-dashboard';
  }
  return '/student-dashboard';
}

export async function completeOnboarding({ email, table, profileRow }: CompleteOnboardingArgs) {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();

  const { data: accountRow, error: accountLookupError } = await supabase
    .from('user_directory')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (accountLookupError || !accountRow?.id) {
    return { error: accountLookupError ?? new Error('Failed to resolve account') };
  }

  const { error: profileError } = await supabase
    .from(table)
    .upsert(
      {
        user_id: accountRow.id,
        ...profileRow,
        updated_at: now,
      },
      { onConflict: 'user_id' },
    );

  if (profileError) {
    return { error: profileError };
  }

  const { error: directoryError } = await supabase
    .from('user_directory')
    .update({
      onboarding_complete: true,
      status: 'active',
      account_status: 'active',
      updated_at: now,
    })
    .eq('email', normalizedEmail);

  if (directoryError) {
    return { error: directoryError };
  }

  return { data: { userId: accountRow.id } };
}
