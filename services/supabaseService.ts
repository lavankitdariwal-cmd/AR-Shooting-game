
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

export const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Supabase fetch error:', err);
    return [];
  }
};

export const submitScore = async (entry: LeaderboardEntry): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('leaderboard')
      .insert([entry]);

    if (error) {
      console.error('Error submitting score:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Supabase submit error:', err);
    return false;
  }
};
