import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS = [
  { email: 'alice@test.com', password: 'test1234', name: 'Alice' },
  { email: 'bob@test.com', password: 'test1234', name: 'Bob' },
  { email: 'carol@test.com', password: 'test1234', name: 'Carol' },
];

async function ensureUser(email: string, password: string, name: string) {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing.users.find((u) => u.email === email);
  if (found) return found.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  console.log('Seeding Vouch test data...');

  const userIds: Record<string, string> = {};
  for (const u of TEST_USERS) {
    userIds[u.name] = await ensureUser(u.email, u.password, u.name);
    console.log(`  User ${u.name}: ${userIds[u.name]}`);
  }

  const { data: existingGroup } = await supabase
    .from('groups')
    .select('id')
    .eq('invite_code', 'STUDYSQD')
    .maybeSingle();

  let groupId = existingGroup?.id;

  if (!groupId) {
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: 'Study Squad',
        description: 'Daily study accountability group',
        invite_code: 'STUDYSQD',
        owner_id: userIds.Alice,
        approval_threshold: 2,
      })
      .select()
      .single();
    if (error) throw error;
    groupId = group.id;

    for (const [name, id] of Object.entries(userIds)) {
      await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: id,
        role: name === 'Alice' ? 'owner' : 'member',
      });
    }
    console.log(`  Group created: Study Squad (${groupId})`);
  } else {
    console.log('  Group already exists, skipping group creation');
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: existingGoal } = await supabase
    .from('goals')
    .select('id')
    .eq('group_id', groupId)
    .eq('title', 'Study 1 hour daily')
    .maybeSingle();

  let groupGoalId = existingGoal?.id;

  if (!groupGoalId) {
    const { data: groupGoal } = await supabase
      .from('goals')
      .insert({
        group_id: groupId,
        created_by: userIds.Alice,
        title: 'Study 1 hour daily',
        description: 'Complete at least 1 hour of focused study',
        type: 'group',
        frequency: 'daily',
        points_value: 10,
      })
      .select()
      .single();
    groupGoalId = groupGoal!.id;

    for (const id of Object.values(userIds)) {
      await supabase.from('goal_assignments').insert({
        goal_id: groupGoalId,
        user_id: id,
        due_date: today,
        status: 'pending',
      });
    }

    const { data: indGoal } = await supabase
      .from('goals')
      .insert({
        group_id: groupId,
        created_by: userIds.Bob,
        title: 'Read 20 pages',
        type: 'individual',
        frequency: 'weekly',
        points_value: 15,
      })
      .select()
      .single();

    await supabase.from('goal_assignments').insert({
      goal_id: indGoal!.id,
      user_id: userIds.Bob,
      due_date: today,
      status: 'pending',
    });

    console.log('  Goals and assignments created');
  }

  const { data: bobAssignment } = await supabase
    .from('goal_assignments')
    .select('id')
    .eq('user_id', userIds.Bob)
    .eq('due_date', today)
    .maybeSingle();

  if (bobAssignment) {
    const { data: existingSub } = await supabase
      .from('submissions')
      .select('id')
      .eq('goal_assignment_id', bobAssignment.id)
      .maybeSingle();

    if (!existingSub) {
      const placeholderPath = `${groupId}/${userIds.Bob}/seed-placeholder.jpg`;
      await supabase.from('submissions').insert({
        goal_assignment_id: bobAssignment.id,
        user_id: userIds.Bob,
        screenshot_url: placeholderPath,
        note: 'Finished reading chapter 3',
        status: 'pending',
      });
      await supabase
        .from('goal_assignments')
        .update({ status: 'submitted' })
        .eq('id', bobAssignment.id);
      console.log('  Sample pending submission created (Bob)');
    }
  }

  console.log('\nSeed complete!');
  console.log('Login: alice@test.com / test1234 (owner)');
  console.log('       bob@test.com / test1234 (has pending submission)');
  console.log('       carol@test.com / test1234');
  console.log('Invite code: STUDYSQD');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
