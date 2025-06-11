//File to setup supabase Client and export it to connect easily in other files
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://qorzcargbhgjgbvdioym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcnpjYXJnYmhnamdidmRpb3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDI4MDAsImV4cCI6MjA2Mjc3ODgwMH0.xOH74HMTRm4rS42lMlnZ2jCTDSC1ZnAkL5DB-CfclQ0'
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

