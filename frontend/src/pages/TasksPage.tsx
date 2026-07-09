import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { api, type Goal, type GoalAssignment, type Group, type GroupDashboard } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { TaskRow } from '../components/TaskRow';

export function TasksPage() {
  const { id } = useParams<{ id: string }>();
  const { group } = useOutletContext<{ group: Group | null }>();
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [assignments, setAssignments] = useState<GoalAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwner = group?.my_role === 'owner';

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api<Goal[]>(`/groups/${id}/goals`),
      api<GroupDashboard>(`/groups/${id}/dashboard`),
    ])
      .then(([goalsData, dashboard]) => {
        setGoals(goalsData);
        setAssignments(dashboard.pending_assignments);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const assignmentForGoal = (goalId: string) => assignments.find((a) => a.goal_id === goalId);
  const groupTasks = goals.filter((g) => g.type === 'group');
  const myTasks = goals.filter((g) => g.type === 'individual' && g.created_by === user?.id);

  const totalAvailable = assignments
    .filter((a) => ['pending', 'rejected'].includes(a.status))
    .reduce((sum, a) => sum + (a.goals?.points_value ?? 0), 0);

  if (loading) return <p className="text-sm text-ink-muted">Loading quests…</p>;

  return (
    <div className="space-y-14">
      {totalAvailable > 0 && (
        <div className="loot-banner">
          <span className="loot-banner-icon">◎</span>
          <span><strong>{totalAvailable} pts</strong> up for grabs right now</span>
        </div>
      )}

      <section>
        <div className="section-header">
          <div>
            <p className="label-caps">Crew quests</p>
            <p className="section-sub">Everyone&apos;s on the hook for these.</p>
          </div>
          {isOwner ? (
            <Link to={`/groups/${id}/goals/new?type=group`} className="btn btn-accent shrink-0">
              + Crew quest
            </Link>
          ) : (
            <span className="text-xs text-ink-muted">Owner sets crew quests</span>
          )}
        </div>
        {groupTasks.length === 0 ? (
          <p className="mt-8 text-sm text-ink-muted">
            No crew quests yet.
            {isOwner ? ' Drop one the whole crew has to hit.' : ' Ask the owner to add one.'}
          </p>
        ) : (
          <div className="quest-list">
            {groupTasks.map((goal) => (
              <TaskRow key={goal.id} goal={goal} assignment={assignmentForGoal(goal.id)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="section-header">
          <div>
            <p className="label-caps">Solo quests</p>
            <p className="section-sub">Personal grinds — only you answer for these.</p>
          </div>
          <Link to={`/groups/${id}/goals/new?type=individual`} className="btn btn-ghost shrink-0">
            + Solo quest
          </Link>
        </div>
        {myTasks.length === 0 ? (
          <p className="mt-8 text-sm text-ink-muted">No solo quests yet. Add one that&apos;s just yours.</p>
        ) : (
          <div className="quest-list">
            {myTasks.map((goal) => (
              <TaskRow key={goal.id} goal={goal} assignment={assignmentForGoal(goal.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
