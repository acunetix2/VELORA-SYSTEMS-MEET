import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTables() {
  const { data, error } = await supabase.from('meeting_summaries').select('*').limit(1)
  if (error) {
    console.log('meeting_summaries table might not exist:', error.message)
  } else {
    console.log('meeting_summaries table exists!')
  }
}

checkTables()
