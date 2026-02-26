import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://oultpirylilasscnzwdz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bHRwaXJ5bGlsYXNzY256d2R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzU2MDQsImV4cCI6MjA4NzExMTYwNH0.qgkLnRxNdkWxpDd8WrNYUocqgTd5zl3fSH_JO6SecbQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
