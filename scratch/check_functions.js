import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listFunctions() {
  const { data, error } = await supabase
    .rpc('get_functions'); // checking if there is a common helper

  if (error) {
    console.log('No generic rpc found.');
  } else {
    console.log('Functions:', data);
  }
}

listFunctions();
