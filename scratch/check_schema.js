import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
  console.log('Checking classrooms table...');
  const { data, error } = await supabase
    .from('classrooms')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching classrooms:', error);
  } else {
    console.log('Classrooms table exists.');
    if (data.length > 0) {
      console.log('Classrooms columns:', Object.keys(data[0]));
    } else {
      console.log('Classrooms table is empty, but it exists.');
    }
  }
}

checkSchema();
