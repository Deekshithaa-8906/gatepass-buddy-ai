import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ADMIN_EMAIL = 'admin@snsgroups.com';
const ADMIN_PASSWORD = 'Admin@12345';
const ADMIN_NAME = 'Admin User';

async function setupAdminAccount() {
  console.log('\n🔧 Setting up Admin Account...\n');

  try {
    // Step 1: Check if auth user exists
    console.log('1️⃣ Checking/Creating Supabase Auth user...');
    
    let authUser: any = null;
    try {
      // Try to get user list - admin API only
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (!listError && users) {
        authUser = users.users.find((u: any) => u.email === ADMIN_EMAIL);
      }
    } catch (e) {
      console.log('   (User listing not available)');
    }

    if (!authUser) {
      console.log('   Creating new auth user...');
      const { data, error } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log('   ✅ Auth user already exists');
        } else {
          throw new Error(`Auth creation failed: ${error.message}`);
        }
      } else {
        authUser = data.user;
        console.log(`   ✅ Auth user created: ${data.user?.id}`);
      }
    } else {
      console.log('   ✅ Auth user already exists');
    }

    // Step 2: Create/Update user_directory entry
    console.log('\n2️⃣ Adding to user_directory...');
    
    const { error: dirError } = await supabase
      .from('user_directory')
      .upsert(
        {
          email: ADMIN_EMAIL,
          full_name: ADMIN_NAME,
          role: 'admin',
          access_status: 'approved',
          account_status: 'active',
          institute: 'SNS Institution',
          department: 'Administration',
          mobile_number: '+91-0000000000',
          password_created: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    if (dirError) throw new Error(`Directory insert failed: ${dirError.message}`);
    console.log('   ✅ user_directory entry created/updated');

    // Step 3: Verify
    console.log('\n3️⃣ Verifying admin account...');
    const { data: verify, error: verifyError } = await supabase
      .from('user_directory')
      .select('email, full_name, role, access_status, account_status')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (verifyError) throw new Error(`Verification failed: ${verifyError.message}`);

    console.log('   ✅ Admin account verified:');
    console.log(`      Email: ${verify.email}`);
    console.log(`      Name: ${verify.full_name}`);
    console.log(`      Role: ${verify.role}`);
    console.log(`      Status: ${verify.access_status} / ${verify.account_status}`);

    // Step 4: Verify .env has correct values
    console.log('\n4️⃣ Checking .env file...');
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    if (!envContent.includes(`VITE_ADMIN_EMAIL=${ADMIN_EMAIL}`)) {
      console.log('   ⚠️  .env VITE_ADMIN_EMAIL needs update');
    } else {
      console.log('   ✅ .env VITE_ADMIN_EMAIL is correct');
    }

    if (!envContent.includes(`VITE_ADMIN_PASSWORD=${ADMIN_PASSWORD}`)) {
      console.log('   ⚠️  .env VITE_ADMIN_PASSWORD needs update');
    } else {
      console.log('   ✅ .env VITE_ADMIN_PASSWORD is correct');
    }

    // Final summary
    console.log('\n✨ Admin setup complete!\n');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n🚀 Next Steps:');
    console.log('   1. npm run dev');
    console.log('   2. Navigate to: http://localhost:5173/admin-login');
    console.log('   3. Use credentials above to sign in\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting up admin account:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the setup
setupAdminAccount();

