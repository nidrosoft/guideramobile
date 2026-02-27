import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pkydmdygctojtfzbqcud.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreWRtZHlnY3RvanRmemJxY3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjQyNzUsImV4cCI6MjA4MjY0MDI3NX0.mnUr0Iv2IYGvQPAFg5WCeMiQB_cvWcSLvK__bLBpPeU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { supabaseUrl, supabaseAnonKey };
