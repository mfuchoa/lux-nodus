import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lluihqshivfzjusfrewt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdWlocXNoaXZmemp1c2ZyZXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzAzMzksImV4cCI6MjA5Mzc0NjMzOX0.3gbHc5qO_lGzhXcf1cQoHdl8ScXGvncR2DSd1OXZ20w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);