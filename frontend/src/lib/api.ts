import { refreshAuthSession, supabase } from './supabase';
import { ApiError, getApiErrorMessage, statusFallback } from './errors';
import { createNetworkError, getApiConfigError, getApiUrl } from './api-config';

const API_URL = getApiUrl();

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function parseErrorBody(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 200) };
  }
}

async function throwForResponse(res: Response, fallback: string): Promise<never> {
  const body = await parseErrorBody(res);
  const message = getApiErrorMessage(body, statusFallback(res.status) || fallback);

  if (res.status === 401) {
    await supabase.auth.signOut().catch(() => {});
  }

  throw new ApiError(message, res.status);
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('Server returned an invalid response.', res.status, 'invalid_json');
  }
}

type ApiOptions = RequestInit & { _retried?: boolean };

async function request<T>(
  path: string,
  options: ApiOptions,
  parse: (res: Response) => Promise<T>,
): Promise<T> {
  const { _retried, ...fetchOptions } = options;

  const configError = getApiConfigError();
  if (configError) throw configError;

  const token = await getToken();
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
  } catch {
    throw createNetworkError();
  }

  if (!res.ok) {
    if (res.status === 401 && !_retried) {
      const refreshed = await refreshAuthSession();
      if (refreshed?.access_token) {
        return request<T>(path, { ...options, _retried: true }, parse);
      }
    }
    await throwForResponse(res, 'Request failed');
  }

  return parse(res);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options, parseJson);
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  return request<T>(
    path,
    { method: 'POST', body: formData },
    parseJson,
  );
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
  approval_count?: number;
  rejection_count?: number;
  approval_threshold?: number;
  profiles?: { id: string; name: string };
  goal_assignments?: { goals: { title: string; points_value?: number } };
  approvals?: Array<{ decision: string; profiles?: { name: string } }>;
};

export type VoteResult = {
  approvals: number;
  rejections: number;
  threshold: number;
  resolved: boolean;
  approved?: boolean;
  points_awarded?: number;
  new_points?: number;
  new_streak?: number;
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

export type MissedEvent = {
  id: string;
  group_id: string;
  member_id: string;
  goal_id: string;
  goal_assignment_id: string;
  streak_before: number;
  created_at: string;
  member: { id: string; name: string; avatar_url: string | null };
  goal: { id: string; title: string };
  reaction_counts: Array<{ emoji: string; count: number }>;
  my_reaction: string | null;
};

export type MissedFeed = {
  events: MissedEvent[];
  total: number;
  has_more: boolean;
  available_emojis: string[];
};

export type MissedReactionResult = {
  action: 'added' | 'updated' | 'removed';
  emoji: string | null;
};
