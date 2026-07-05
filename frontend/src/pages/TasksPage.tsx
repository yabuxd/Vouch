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

  if (loading) return <p className="text-sm text-ink-muted">Loading tasks…</p>;

  return (
    <div className="space-y-14">
      <section>
        <div className="flex items-end justify-between gap-4 border-b border-rule pb-3">
          <div>
            <p className="label-caps">Group tasks</p>
            <p className="mt-1 text-sm text-ink-muted">Shared — everyone in the crew is on the hook.</p>
          </div>
          {isOwner ? (
            <Link to={`/groups/${id}/goals/new?type=group`} className="btn btn-accent shrink-0">
              Add group task
            </Link>
          ) : (
            <span className="text-xs text-ink-muted">Owner adds group tasks</span>
          )}
        </div>
        {groupTasks.length === 0 ? (
          <p className="mt-8 text-sm text-ink-muted">
            No group tasks yet.
            {isOwner ? ' Set one the whole crew has to hit.' : ' Ask the owner to add one.'}
          </p>
        ) : (
          <div className="mt-2">
            {groupTasks.map((goal) => (
              <TaskRow key={goal.id} goal={goal} assignment={assignmentForGoal(goal.id)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 border-b border-rule pb-3">
          <div>
            <p className="label-caps">My tasks</p>
            <p className="mt-1 text-sm text-ink-muted">Personal — only you answer for these.</p>
          </div>
          <Link to={`/groups/${id}/goals/new?type=individual`} className="btn btn-ghost shrink-0">
            Add my task
          </Link>
        </div>
        {myTasks.length === 0 ? (
          <p className="mt-8 text-sm text-ink-muted">No personal tasks yet. Add one that&apos;s just yours.</p>
        ) : (
          <div className="mt-2">
            {myTasks.map((goal) => (
              <TaskRow key={goal.id} goal={goal} assignment={assignmentForGoal(goal.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
