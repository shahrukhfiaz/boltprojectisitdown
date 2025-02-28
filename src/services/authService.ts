import { User } from '../types';
import { supabase } from '../lib/supabase';
import { isSupabaseConnected } from '../lib/supabase';

// Mock user data for fallback when Supabase is not connected
const mockUsers: User[] = [
  {
    id: 'user1',
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date()
  }
];

// Mock current user
let currentUser: User | null = null;

/**
 * Register a new user
 * @param username Username
 * @param email Email address
 * @param password Password
 * @returns Promise with the registered user
 */
export const register = async (
  username: string,
  email: string,
  password: string
): Promise<User> => {
  try {
    // Check if Supabase is connected
    const connected = await isSupabaseConnected;
    
    if (connected) {
      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });
      
      if (error) throw error;
      
      if (!data.user) {
        throw new Error('Registration failed');
      }
      
      // Create user object
      const newUser: User = {
        id: data.user.id,
        username: username,
        email: data.user.email || email,
        createdAt: new Date(data.user.created_at || Date.now())
      };
      
      // Set as current user
      currentUser = newUser;
      
      return newUser;
    } else {
      // Fallback to mock implementation
      console.log('Using mock registration (Supabase not connected)');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check if user already exists
      if (mockUsers.some(user => user.email === email)) {
        throw new Error('User with this email already exists');
      }
      
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        username,
        email,
        createdAt: new Date()
      };
      
      // In a real app, this would be saved to a database
      mockUsers.push(newUser);
      
      // Set as current user
      currentUser = newUser;
      
      return newUser;
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login a user
 * @param email Email address
 * @param password Password
 * @returns Promise with the logged in user
 */
export const login = async (email: string, password: string): Promise<User> => {
  try {
    // Check if Supabase is connected
    const connected = await isSupabaseConnected;
    
    if (connected) {
      // Login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (!data.user) {
        throw new Error('Login failed');
      }
      
      // Get user profile from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }
      
      // Create user object
      const user: User = {
        id: data.user.id,
        username: profileData?.username || data.user.user_metadata?.username || email.split('@')[0],
        email: data.user.email || email,
        createdAt: new Date(data.user.created_at || Date.now())
      };
      
      // Set as current user
      currentUser = user;
      
      return user;
    } else {
      // Fallback to mock implementation
      console.log('Using mock login (Supabase not connected)');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Find user by email
      const user = mockUsers.find(user => user.email === email);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Set as current user
      currentUser = user;
      
      return user;
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout the current user
 * @returns Promise that resolves when logout is complete
 */
export const logout = async (): Promise<void> => {
  try {
    // Check if Supabase is connected
    const connected = await isSupabaseConnected;
    
    if (connected) {
      // Logout with Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      // Fallback to mock implementation
      console.log('Using mock logout (Supabase not connected)');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Clear current user
    currentUser = null;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get the current user
 * @returns The current user or null if not logged in
 */
export const getCurrentUser = (): User | null => {
  // Check if we already have a current user
  if (currentUser) {
    return currentUser;
  }
  
  // Try to get the user from Supabase session
  const session = supabase.auth.getSession();
  
  // If we can get a session synchronously, use it
  if (session) {
    // This is a promise, so we can't use it synchronously
    // But we'll set up a listener to update the current user when it resolves
    session.then(({ data }) => {
      if (data.session?.user) {
        const user = data.session.user;
        
        // Get user profile from profiles table
        supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
          .then(({ data: profileData }) => {
            currentUser = {
              id: user.id,
              username: profileData?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'User',
              email: user.email || 'unknown@example.com',
              createdAt: new Date(user.created_at || Date.now())
            };
          })
          .catch(error => {
            console.error('Error fetching profile:', error);
            
            // Still set the user even if profile fetch fails
            currentUser = {
              id: user.id,
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
              email: user.email || 'unknown@example.com',
              createdAt: new Date(user.created_at || Date.now())
            };
          });
      }
    });
  }
  
  // For now, return null since we don't have a user yet
  return null;
};

/**
 * Request a password reset
 * @param email Email address
 * @returns Promise that resolves when request is complete
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    // Check if Supabase is connected
    const connected = await isSupabaseConnected;
    
    if (connected) {
      // Request password reset with Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
    } else {
      // Fallback to mock implementation
      console.log('Using mock password reset (Supabase not connected)');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if user exists
      const user = mockUsers.find(user => user.email === email);
      
      if (!user) {
        throw new Error('No user found with this email');
      }
      
      // In a real app, this would send a reset email
      console.log(`Password reset requested for ${email}`);
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    throw error;
  }
};

/**
 * Reset a password
 * @param token Reset token
 * @param newPassword New password
 * @returns Promise that resolves when reset is complete
 */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  try {
    // Check if Supabase is connected
    const connected = await isSupabaseConnected;
    
    if (connected) {
      // Reset password with Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
    } else {
      // Fallback to mock implementation
      console.log('Using mock password reset (Supabase not connected)');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // In a real app, this would verify the token and update the password
      console.log(`Password reset with token ${token}`);
    }
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    const user = session.user;
    
    // Get user profile from profiles table
    supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
      .then(({ data: profileData }) => {
        currentUser = {
          id: user.id,
          username: profileData?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'User',
          email: user.email || 'unknown@example.com',
          createdAt: new Date(user.created_at || Date.now())
        };
      })
      .catch(error => {
        console.error('Error fetching profile:', error);
        
        // Still set the user even if profile fetch fails
        currentUser = {
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
          email: user.email || 'unknown@example.com',
          createdAt: new Date(user.created_at || Date.now())
        };
      });
  } else if (event === 'SIGNED_OUT') {
    currentUser = null;
  }
});

// Export supabase for use in AuthContext
export { supabase };