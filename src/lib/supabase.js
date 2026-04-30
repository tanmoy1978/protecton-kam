import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gouovzlnpsyfsgbxtdmf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvdW92emxucHN5ZnNnYnh0ZG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTI1NDksImV4cCI6MjA5Mjc4ODU0OX0.Qx1Wml0sPJbTQqGkHeNm1WkiK1RuGmo8HN2vRk-DFiM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 10 }
  }
})
