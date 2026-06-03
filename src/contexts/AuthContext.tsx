import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserStatus = 'pending' | 'approved' | 'active';
export type UserRole = 'student' | 'staff' | 'mentor' | 'advisor' | 'hod' | 'warden' | 'principal' | 'admin';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  mobile_number?: string;
  register_number?: string;
  class_details?: string;
  parent_name?: string;
  parent_mobile?: string;
  gender?: string;
  institute?: string;
  year_of_study?: string;
  hostel_block?: string;
  room_number?: string;
  department?: string;
  password_created?: boolean;
  onboarding_complete?: boolean;
  access_status?: string;
  account_status?: string;
  mentor?: string;
  mentor_email?: string;
  advisor?: string;
  advisor_email?: string;
  hod?: string;
  hod_email?: string;
  principal?: string;
  principal_email?: string;
  mentor_id?: string;
  advisor_id?: string;
  hod_id?: string;
  principal_id?: string;
  profile_image_url?: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        fetchProfile(session.user.email);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser?.email) {
        fetchProfile(newUser.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userEmail: string) => {
    try {
      const [{ data: profileData, error: profileError }, { data: directoryData, error: directoryError }] = await Promise.all([
        supabase
        .from('user_profile_view')
        .select('id, email, full_name, role, status, mobile_number, register_number, class_details, parent_name, parent_number, gender, institute, year, hostel_block, room_number, department, profile_image_url, password_created, onboarding_complete, access_status, account_status, mentor_id, advisor_id, hod_id, principal_id, mentor_name, mentor_email, advisor_name, advisor_email, hod_name, hod_email, principal_name, principal_email')
        .eq('email', userEmail)
        .maybeSingle(),
        supabase
          .from('user_directory')
          .select('profile_image_url')
          .eq('email', userEmail)
          .maybeSingle(),
      ]);

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        // Map database columns to profile interface, handling legacy field names
        const mappedProfile: Profile = {
          ...profileData,
          profile_image_url: directoryData?.profile_image_url || profileData.profile_image_url,
          parent_mobile: profileData.parent_number, // Map new column name to expected interface
          year_of_study: profileData.year, // Map new column name to expected interface
          mentor: profileData.mentor_name, // Provide legacy field names for backward compatibility
          advisor: profileData.advisor_name,
          hod: profileData.hod_name,
          principal: profileData.principal_name,
        };
        setProfile(mappedProfile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string) => {
    // Check if user is in user_directory first
    const { data: existingUser, error: searchError } = await supabase
      .from('user_directory')
    .select('status')
      .eq('email', email)
    .maybeSingle();

    if (searchError && searchError.code !== 'PGRST116') {
      return { error: searchError };
    }

    // Attempt OTP sign in
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/verification-success`,
      },
    });

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const refreshProfile = async () => {
    const { data } = await supabase.auth.getUser();
    const userEmail = data.user?.email;
    if (!userEmail) {
      setProfile(null);
      return;
    }
    await fetchProfile(userEmail);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

