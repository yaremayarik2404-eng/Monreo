import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ngftaomykqwfwyzrtlwj.supabase.co'
const supabaseKey = 'sb_publishable_9oJ3_8ZEiX76-l_LQvvtxQ_A7lp-PxF'

export const supabase = createClient(
    supabaseUrl,
    supabaseKey
)