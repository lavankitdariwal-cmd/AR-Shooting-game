import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lcsqgjfcdutgwbqjxhky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjc3FnamZjZHV0Z3dicWp4aGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTI1MzgsImV4cCI6MjA4MzM2ODUzOH0.E8D3WQWyl3-lSGMCnGVKKHj6nEf3jZjKR11aOMG6Q38';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface LeaderboardEntry {
  id?: string;
  created_at?: string;
  player_name: string;
  score: number;
  difficulty: string;
  control_mode: string;
}

/**
 * Fetches top scores from the Supabase 'leaderboard' table.
 */
export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(200); // Increased limit for detailed rank analysis

    if (error) {
      console.error('Supabase Fetch Error Details:', JSON.stringify(error, null, 2));
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error('Unexpected Leaderboard Fetch Exception:', err.message || err);
    return [];
  }
};

/**
 * Submits a new score to the 'leaderboard' table.
 */
export const submitScore = async (entry: LeaderboardEntry): Promise<boolean> => {
  try {
    const payload = {
      player_name: entry.player_name || 'RECON_UNIT',
      score: entry.score,
      difficulty: entry.difficulty,
      control_mode: entry.control_mode
    };

    const { error } = await supabase
      .from('leaderboard')
      .insert([payload]);

    if (error) {
      console.error('Supabase Submit Error Details:', JSON.stringify(error, null, 2));
      return false;
    }

    return true;
  } catch (err: any) {
    console.error('Unexpected Leaderboard Submit Exception:', err.message || err);
    return false;
  }
};