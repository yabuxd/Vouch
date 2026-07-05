import { supabase } from './supabase';
import { getApiErrorMessage } from './errors';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(getApiErrorMessage(err, res.statusText || 'Request failed'));
  }

  return res.json();
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(getApiErrorMessage(err, res.statusText || 'Upload failed'));
  }

  return res.json();
}

export type Group = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  owner_id: string;
  approval_threshold: number;
  weekly_reset_enabled: boolean;
  my_role?: string;
  my_points?: number;
  my_streak?: number;
  members?: Array<{
    user_id: string;
    role: string;
    points: number;
    current_streak: number;
    profiles: { id: string; name: string; avatar_url: string | null };
  }>;
};

export type Goal = {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  type: 'group' | 'individual';
  frequency: 'daily' | 'weekly' | 'one_time';
  points_value: number;
  due_date: string | null;
};

export type GoalAssignment = {
  id: string;
  goal_id: string;
  user_id: string;
  due_date: string;
  status: string;
  goals?: Goal;
};

export type Submission = {
  id: string;
  user_id: string;
  screenshot_signed_url?: string;
  note: string | null;
  status: string;
  submitted_at: string;
  already_voted?: boolean;
  profiles?: { id: string; name: string };
  goal_assignments?: { goals: { title: string } };
  approvals?: Array<{ decision: string; profiles?: { name: string } }>;
};

export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  points: number;
  current_streak: number;
  role: string;
  profile: { id: string; name: string; avatar_url: string | null };
};

export type GroupDashboard = {
  my_rank: number | null;
  my_points: number;
  my_streak: number;
  pending_assignments: GoalAssignment[];
  pending_approvals_count: number;
};
