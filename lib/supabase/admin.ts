import { createClient } from '@supabase/supabase-js'

// Only import this file in app/api/* Route Handlers — never in Client Components
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)