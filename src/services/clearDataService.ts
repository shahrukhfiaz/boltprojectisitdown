import { supabase } from '../lib/supabase';
import { isSupabaseConnected } from '../lib/supabase';

/**
 * Clear local storage data related to reported websites
 */
export const clearLocalStorageReportData = (): void => {
  try {
    // Clear reported sites from localStorage
    localStorage.removeItem('reportedSites');
    console.log('Successfully cleared local storage report data');
  } catch (error) {
    console.error('Failed to clear local storage data:', error);
  }
};

/**
 * Reset all website statuses to "up" in the database
 * @returns Promise<boolean> indicating success or failure
 */
export const resetAllWebsiteStatuses = async (): Promise<boolean> => {
  try {
    // Check if Supabase is connected
    const connected = await isSupabaseConnected;
    if (!connected) {
      console.warn('Supabase is not connected. Cannot reset website statuses.');
      return false;
    }

    // Update all websites to status "up"
    const { error } = await supabase
      .from('websites')
      .update({ 
        status: 'up',
        last_checked: new Date().toISOString()
      })
      .neq('id', 'placeholder'); // Update all records

    if (error) {
      console.error('Error resetting website statuses:', error);
      return false;
    }

    console.log('Successfully reset all website statuses to "up"');
    return true;
  } catch (error) {
    console.error('Failed to reset website statuses:', error);
    return false;
  }
};

/**
 * Clear all outage reports and incidents from the database
 * @returns Promise<boolean> indicating success or failure
 */
export const clearAllOutageData = async (): Promise<boolean> => {
  try {
    // Check if Supabase is connected
    const connected = await isSupabaseConnected;
    if (!connected) {
      console.warn('Supabase is not connected. Cannot clear outage data.');
      return false;
    }

    // Delete all records from the incidents table
    const { error: incidentsError } = await supabase
      .from('incidents')
      .delete()
      .neq('id', 'placeholder'); // Delete all records

    if (incidentsError) {
      console.error('Error clearing incidents data:', incidentsError);
      return false;
    }

    // Delete all records from the outage_reports table
    const { error: outageReportsError } = await supabase
      .from('outage_reports')
      .delete()
      .neq('id', 'placeholder'); // Delete all records

    if (outageReportsError) {
      console.error('Error clearing outage reports data:', outageReportsError);
      return false;
    }

    console.log('Successfully cleared all outage data');
    return true;
  } catch (error) {
    console.error('Failed to clear outage data:', error);
    return false;
  }
};

/**
 * Clear all data (local storage, reset statuses, and clear outage data)
 * @returns Promise<boolean> indicating success or failure
 */
export const clearAllData = async (): Promise<boolean> => {
  try {
    const resetStatuses = await resetAllWebsiteStatuses();
    const clearedOutages = await clearAllOutageData();
    clearLocalStorageReportData();
    
    return resetStatuses && clearedOutages;
  } catch (error) {
    console.error('Failed to clear all data:', error);
    return false;
  }
};