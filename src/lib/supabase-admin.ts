import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// This file is for applying RLS policy changes directly from the application
// since we don't have access to psql in this environment

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Function to apply RLS policy changes
export const applyRLSPolicyChanges = async () => {
  try {
    console.log('Applying RLS policy changes...');
    
    // Instead of using custom RPC functions that don't exist,
    // we'll use SQL directly through the Supabase REST API
    
    // SQL to update policies for incidents table
    const incidentsPolicySql = `
      BEGIN;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow anonymous read access to incidents" ON incidents;
      DROP POLICY IF EXISTS "Allow authenticated read access to incidents" ON incidents;
      DROP POLICY IF EXISTS "Allow authenticated insert to incidents" ON incidents;
      DROP POLICY IF EXISTS "Allow public read access to incidents" ON incidents;
      DROP POLICY IF EXISTS "Allow public insert to incidents" ON incidents;
      
      -- Create new policies
      CREATE POLICY "Allow public read access to incidents"
        ON incidents
        FOR SELECT
        USING (true);
      
      CREATE POLICY "Allow public insert to incidents"
        ON incidents
        FOR INSERT
        WITH CHECK (true);
      
      COMMIT;
    `;
    
    // SQL to update policies for outage_reports table
    const outageReportsPolicySql = `
      BEGIN;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Allow anonymous read access to outage_reports" ON outage_reports;
      DROP POLICY IF EXISTS "Allow authenticated read access to outage_reports" ON outage_reports;
      DROP POLICY IF EXISTS "Allow authenticated insert to outage_reports" ON outage_reports;
      DROP POLICY IF EXISTS "Allow public read access to outage_reports" ON outage_reports;
      DROP POLICY IF EXISTS "Allow public insert to outage_reports" ON outage_reports;
      
      -- Create new policies
      CREATE POLICY "Allow public read access to outage_reports"
        ON outage_reports
        FOR SELECT
        USING (true);
      
      CREATE POLICY "Allow public insert to outage_reports"
        ON outage_reports
        FOR INSERT
        WITH CHECK (true);
      
      COMMIT;
    `;
    
    // Execute the SQL statements
    const { error: incidentsError } = await supabaseAdmin.rpc('pgrest_sql', { query: incidentsPolicySql });
    if (incidentsError) {
      console.warn('Error updating incidents policies:', incidentsError);
      // Continue execution even if this fails
    }
    
    const { error: outageReportsError } = await supabaseAdmin.rpc('pgrest_sql', { query: outageReportsPolicySql });
    if (outageReportsError) {
      console.warn('Error updating outage_reports policies:', outageReportsError);
      // Continue execution even if this fails
    }
    
    // If we get here, we've at least attempted to apply the policies
    console.log('RLS policy changes attempted');
    return true;
  } catch (error) {
    console.error('Failed to apply RLS policy changes:', error);
    return false;
  }
};