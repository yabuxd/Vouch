import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PLACEHOLDER_KEYS = ['your-service-role-key', 'your-jwt-secret', ''];

if (!supabaseUrl || !supabaseServiceKey || PLACEHOLDER_KEYS.includes(supabaseServiceKey)) {
  console.error(
    '\n⚠️  Missing SUPABASE_SERVICE_ROLE_KEY in backend/.env\n' +
    '   Get it from Supabase Dashboard → Project Settings → API → secret key (sb_secret_...)\n'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '', {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  owner_id: string;
  approval_threshold: number;
  created_at: string;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: Profile;
};

export type Goal = {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  type: 'group' | 'individual';
  frequency: 'daily' | 'weekly' | 'one_time';
  due_date: string | null;
  is_active: boolean;
  created_at: string;
};

export type GoalAssignment = {
  id: string;
  goal_id: string;
  user_id: string;
  due_date: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  goals?: Goal;
};

export type Submission = {
  id: string;
  goal_assignment_id: string;
  user_id: string;
  screenshot_url: string;
  note: string | null;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  profiles?: Profile;
  goal_assignments?: GoalAssignment;
};

export type Approval = {
  id: string;
  submission_id: string;
  approver_id: string;
  decision: 'approve' | 'reject';
  comment: string | null;
  created_at: string;
  profiles?: Profile;
};
