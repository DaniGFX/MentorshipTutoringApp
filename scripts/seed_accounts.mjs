import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://scnujngrcwaslpcreopx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbnVqbmdyY3dhc2xwY3Jlb3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NDM3ODYsImV4cCI6MjEwNzUxOTc4Nn0.CAZI-rMQTDLbcDZbC4z0SDp-JHVxvnQFAIva-pB_Ht4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SEED_USERS = [
  {
    email: 'student@mentorlink.ph',
    password: 'Password123!',
    fullName: 'Daniela Gonzales',
    role: 'student',
    school: 'Polytechnic University of the Philippines',
  },
  {
    email: 'mentor@mentorlink.ph',
    password: 'Password123!',
    fullName: 'Alex Santos',
    role: 'mentor',
    school: 'De La Salle University',
  },
];

async function seed() {
  console.log('Seeding MentorLinks accounts via Supabase Auth API...');

  for (const u of SEED_USERS) {
    console.log(`\nAttempting registration for: ${u.email} (${u.role})...`);
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: {
        data: {
          full_name: u.fullName,
          account_type: u.role,
          school_name: u.school,
        },
      },
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        console.log(`[INFO] ${u.email} is already registered in Supabase Auth.`);
      } else {
        console.error(`[ERROR] Failed to register ${u.email}:`, error.message);
      }
    } else {
      console.log(`[SUCCESS] Registered ${u.email}! User ID:`, data.user?.id);
    }
  }

  console.log('\nSeed process finished.');
}

seed();
