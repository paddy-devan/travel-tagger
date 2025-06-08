import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CreateUserOptions {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface UserServiceResult {
  success: boolean;
  existed: boolean;
  error?: string;
}

/**
 * Centralized user service to handle user creation across the application
 * Ensures users exist in the database after authentication
 */
export class UserService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Ensures a user exists in the database, creating them if necessary
   * @param options User data including required id and email
   * @returns Result indicating success, whether user existed, and any errors
   */
  async ensureUserExists(options: CreateUserOptions): Promise<UserServiceResult> {
    const { id, email, name, avatar_url } = options;

    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', id)
        .single();

      // User exists - no action needed
      if (existingUser && !checkError) {
        return { success: true, existed: true };
      }

      // User doesn't exist (PGRST116 is "not found" error)
      if (checkError && checkError.code === 'PGRST116') {
        const { error: insertError } = await this.supabase
          .from('users')
          .insert({
            id,
            email,
            name: name || email.split('@')[0], // Default name from email
            avatar_url: avatar_url || null,
          });

        if (insertError) {
          // If it's a duplicate key error, user was created by another process
          if (insertError.code === '23505') {
            return { success: true, existed: true };
          }
          
          console.error('Error creating user:', insertError);
          return { 
            success: false, 
            existed: false, 
            error: insertError.message 
          };
        }

        return { success: true, existed: false };
      }

      // Unexpected error during check
      console.error('Error checking user existence:', checkError);
      return { 
        success: false, 
        existed: false, 
        error: checkError?.message || 'Failed to check user existence' 
      };

    } catch (error) {
      console.error('Exception in ensureUserExists:', error);
      return { 
        success: false, 
        existed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Creates a user service instance with regular Supabase client
   * @param supabaseClient Regular Supabase client
   */
  static withClient(supabaseClient: SupabaseClient): UserService {
    return new UserService(supabaseClient);
  }

  /**
   * Creates a user service instance with service role key (for server-side operations)
   * @param supabaseUrl Supabase project URL
   * @param serviceRoleKey Service role key
   */
  static withServiceRole(supabaseUrl: string, serviceRoleKey: string): UserService {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    return new UserService(supabase);
  }
} 