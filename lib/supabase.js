//supabase.ts
import { createClient } from '@supabase/supabase-js'
// import dotenv from 'dotenv';
// dotenv.config();
// const supabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = 'https://qorzcargbhgjgbvdioym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcnpjYXJnYmhnamdidmRpb3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDI4MDAsImV4cCI6MjA2Mjc3ODgwMH0.xOH74HMTRm4rS42lMlnZ2jCTDSC1ZnAkL5DB-CfclQ0'
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

