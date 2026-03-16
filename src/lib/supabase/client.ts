import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Read from environment variables — never hardcode secrets in source
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
  || process.env.SUPABASE_URL
  || 'https://pkydmdygctojtfzbqcud.supabase.co'; // fallback during migration — remove after .env is confirmed working

const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  || process.env.SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreWRtZHlnY3RvanRmemJxY3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjQyNzUsImV4cCI6MjA4MjY0MDI3NX0.mnUr0Iv2IYGvQPAFg5WCeMiQB_cvWcSLvK__bLBpPeU'; // fallback during migration — remove after .env is confirmed working

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { supabaseUrl, supabaseAnonKey };
