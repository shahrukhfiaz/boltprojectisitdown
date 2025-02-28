import axios from 'axios';
import { Website, Report, Comment, UptimeData, OutageReport } from '../types';
import { formatUrl } from '../utils/urlUtils';
import { supabase } from '../lib/supabase';
import { popularWebsites, mockOutageReports, generateUptimeData } from '../utils/mockData';

/**
 * Check if a website is up or down
 * @param url The URL to check
 * @returns Promise with website status
 */
export const checkWebsiteStatus = async (url: string): Promise<Website> => {
  const formattedUrl = formatUrl(url);
  
  try {
    // Extract domain for ID generation
    let websiteId = '';
    try {
      const urlObj = new URL(formattedUrl);
      websiteId = urlObj.hostname.replace('www.', '').split('.')[0];
    } catch (e) {
      websiteId = Math.random().toString(36).substring(2, 9);
    }
    
    // Start timing the request
    const startTime = Date.now();
    
    // Use the provided API to check if the website is up or down
    let isUp = false;
    let responseTime: number | undefined = undefined;
    
    try {
      // Call the real API endpoint
      const apiUrl = `http://isitdownchecker.com:5000/check?url=${encodeURIComponent(formattedUrl)}`;
      
      const response = await axios.get(apiUrl, { 
        timeout: 10000,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Check if the response contains "Up" or "Down"
      const responseData = response.data;
      if (typeof responseData === 'string') {
        isUp = responseData.includes('Up');
      } else {
        // If the response is not a string, check the status code
        isUp = response.status >= 200 && response.status < 400;
      }
      
      responseTime = Date.now() - startTime;
      
    } catch (apiError) {
      console.error('Error checking website with API:', typeof apiError === 'object' && apiError !== null ? 
        (apiError as Error).message || 'Unknown error' : String(apiError));
      
      // If the API call fails, consider the website down
      isUp = false;
      responseTime = undefined;
    }
    
    try {
      // Check if website exists in database by URL, not by ID
      const { data: existingWebsites, error: fetchError } = await supabase
        .from('websites')
        .select('*')
        .eq('url', formattedUrl);
      
      if (fetchError) {
        // Use safe error logging to avoid Symbol() cloning issues
        console.error('Fetch error:', fetchError.message || 'Unknown error');
        throw fetchError;
      }
      
      const existingWebsite = existingWebsites && existingWebsites.length > 0 ? existingWebsites[0] : null;
      
      if (existingWebsite) {
        // Update existing website
        const { data: updatedWebsites, error: updateError } = await supabase
          .from('websites')
          .update({
            status: isUp ? 'up' : 'down',
            last_checked: new Date().toISOString(),
            response_time: responseTime || null
          })
          .eq('id', existingWebsite.id) // Use the UUID from the database
          .select();
        
        if (updateError) {
          // Use safe error logging to avoid Symbol() cloning issues
          console.error('Update error:', updateError.message || 'Unknown error');
          throw updateError;
        }
        
        if (updatedWebsites && updatedWebsites.length > 0) {
          const updatedWebsite = updatedWebsites[0];
          return {
            id: updatedWebsite.id,
            url: updatedWebsite.url,
            status: updatedWebsite.status as 'up' | 'down' | 'unknown',
            lastChecked: new Date(updatedWebsite.last_checked),
            responseTime: updatedWebsite.response_time || undefined
          };
        }
      } else {
        // Insert new website - generate a proper UUID instead of using domain name
        const { data: newWebsites, error: insertError } = await supabase
          .from('websites')
          .insert({
            // Don't specify ID - let the database generate a UUID
            url: formattedUrl,
            status: isUp ? 'up' : 'down',
            last_checked: new Date().toISOString(),
            response_time: responseTime || null,
            name: websiteId // Store the domain name as a name field instead
          })
          .select();
        
        if (insertError) {
          // Use safe error logging to avoid Symbol() cloning issues
          console.error('Insert error:', insertError.message || 'Unknown error');
          throw insertError;
        }
        
        if (newWebsites && newWebsites.length > 0) {
          const newWebsite = newWebsites[0];
          return {
            id: newWebsite.id,
            url: newWebsite.url,
            status: newWebsite.status as 'up' | 'down' | 'unknown',
            lastChecked: new Date(newWebsite.last_checked),
            responseTime: newWebsite.response_time || undefined
          };
        }
      }
    } catch (dbError) {
      // Use safe error logging to avoid Symbol() cloning issues
      console.error('Database operation failed:', typeof dbError === 'object' && dbError !== null ? (dbError as Error).message || 'Unknown error' : String(dbError));
      // Continue with fallback response if database operations fail
    }
    
    // Fallback if database operations fail - generate a random UUID-like string
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      url: formattedUrl,
      status: isUp ? 'up' : 'down',
      lastChecked: new Date(),
      responseTime
    };
  } catch (error) {
    // Use safe error logging to avoid Symbol() cloning issues
    console.error('Error checking website status:', typeof error === 'object' && error !== null ? (error as Error).message || 'Unknown error' : String(error));
    
    // If there's any other error, consider the website down
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      url: formattedUrl,
      status: 'down',
      lastChecked: new Date()
    };
  }
};

/**
 * Get reports for a specific website
 * @param websiteId The website ID
 * @returns Promise with array of reports
 */
export const getWebsiteReports = async (websiteId: string): Promise<Report[]> => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('website_id', websiteId)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(incident => ({
      id: incident.id,
      websiteId: incident.website_id,
      userId: incident.ip_address, // Using IP as userId for demo
      timestamp: new Date(incident.timestamp),
      description: `Reported issue: ${incident.type}`,
      meTooCount: incident.me_too_count
    }));
  } catch (error) {
    // Use safe error logging to avoid Symbol() cloning issues
    console.error('Error getting website reports:', typeof error === 'object' && error !== null ? (error as Error).message || 'Unknown error' : String(error));
    return [];
  }
};

/**
 * Submit a new report for a website
 * @param report The report to submit
 * @returns Promise with the submitted report
 */
export const submitReport = async (report: Omit<Report, 'id' | 'timestamp' | 'meTooCount'>): Promise<Report> => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .insert({
        website_id: report.websiteId,
        website_url: `https://${report.websiteId}.com`, // Simplified for demo
        type: 'down', // Default type
        ip_address: report.userId,
        timestamp: new Date().toISOString(),
        me_too_count: 0
      })
      .select();
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error('Failed to insert report');
    }
    
    const insertedReport = data[0];
    
    return {
      id: insertedReport.id,
      websiteId: insertedReport.website_id,
      userId: insertedReport.ip_address,
      timestamp: new Date(insertedReport.timestamp),
      description: report.description,
      meTooCount: insertedReport.me_too_count
    };
  } catch (error) {
    // Use safe error logging to avoid Symbol() cloning issues
    console.error('Failed to submit report:', typeof error === 'object' && error !== null ? (error as Error).message || 'Unknown error' : String(error));
    throw error;
  }
};

/**
 * Add a "Me Too" to an existing report
 * @param reportId The report ID
 * @returns Promise with the updated report
 */
export const addMeToo = async (reportId: string): Promise<Report> => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .update({ me_too_count: supabase.rpc('increment', { x: 1 }) })
      .eq('id', reportId)
      .select();
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error('Failed to update report');
    }
    
    const updatedReport = data[0];
    
    return {
      id: updatedReport.id,
      websiteId: updatedReport.website_id,
      userId: updatedReport.ip_address,
      timestamp: new Date(updatedReport.timestamp),
      description: `Reported issue: ${updatedReport.type}`,
      meTooCount: updatedReport.me_too_count
    };
  } catch (error) {
    // Use safe error logging to avoid Symbol() cloning issues
    console.error('Error adding me too:', typeof error === 'object' && error !== null ? (error as Error).message || 'Unknown error' : String(error));
    throw error;
  }
};

/**
 * Get comments for a specific website
 * @param websiteId The website ID
 * @returns Promise with array of comments
 */
export const getWebsiteComments = async (websiteId: string): Promise<Comment[]> => {
  // This is a mock function as we don't have comments in our database yet
  return [];
};

/**
 * Submit a new comment for a website
 * @param comment The comment to submit
 * @returns Promise with the submitted comment
 */
export const submitComment = async (comment: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment> => {
  // This is a mock function as we don't have comments in our database yet
  return {
    id: Math.random().toString(36).substring(2, 9),
    websiteId: comment.websiteId,
    userId: comment.userId,
    content: comment.content,
    timestamp: new Date()
  };
};

/**
 * Get uptime data for a specific website
 * @param websiteId The website ID
 * @param days Number of days of data to retrieve
 * @returns Promise with array of uptime data points
 */
export const getUptimeData = async (websiteId: string, days: number = 30): Promise<UptimeData[]> => {
  try {
    // Try to get data from Supabase (in a real app)
    // For demo, we'll use our mock data generator
    return generateUptimeData(websiteId, days);
  } catch (error) {
    // Use safe error logging to avoid Symbol() cloning issues
    console.error('Error getting uptime data:', typeof error === 'object' && error !== null ? (error as Error).message || 'Unknown error' : String(error));
    // Fallback to mock data
    return generateUptimeData(websiteId, days);
  }
};

/**
 * Get outage reports for mapping
 * @param websiteId Optional website ID to filter by
 * @returns Promise with array of outage reports
 */
export const getOutageReports = async (websiteId?: string): Promise<OutageReport[]> => {
  try {
    let query = supabase
      .from('outage_reports')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (websiteId) {
      query = query.eq('website_id', websiteId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return (data || []).map(report => ({
      id: report.id,
      websiteId: report.website_id,
      latitude: report.latitude,
      longitude: report.longitude,
      timestamp: new Date(report.timestamp),
      status: report.status as 'up' | 'down'
    }));
  } catch (error) {
    // Use safe error logging to avoid Symbol() cloning issues
    console.error('Error getting outage reports:', typeof error === 'object' && error !== null ? (error as Error).message || 'Unknown error' : String(error));
    // Return mock data as fallback
    return mockOutageReports;
  }
};

/**
 * Get popular websites for quick checks
 * @returns Promise with array of popular websites
 */
export const getPopularWebsites = async (): Promise<Website[]> => {
  try {
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .order('last_checked', { ascending: false });
    
    if (error) throw error;
    
    // Return the actual status from the database
    return (data || []).map(website => {
      return {
        id: website.id,
        url: website.url,
        status: website.status as 'up' | 'down' | 'unknown',
        lastChecked: new Date(website.last_checked),
        responseTime: website.response_time || undefined
      };
    });
  } catch (error) {
    // Use safe error logging to avoid Symbol() cloning issues
    console.error('Error getting popular websites:', typeof error === 'object' && error !== null ? (error as Error).message || 'Unknown error' : String(error));
    
    // Fallback to mock data if database fails
    return popularWebsites;
  }
};