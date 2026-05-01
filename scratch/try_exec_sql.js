import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function tryExecSql() {
  const sql = `
    CREATE OR REPLACE FUNCTION is_classroom_owner(_classroom_id UUID)
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM classrooms 
        WHERE id = _classroom_id 
        AND user_id = auth.uid()
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error('exec_sql failed:', error.message);
  } else {
    console.log('exec_sql successful!');
  }
}

tryExecSql();
