import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GroupLayout } from './components/GroupLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AuthConfirmPage } from './pages/AuthConfirmPage';
import { DashboardPage } from './pages/DashboardPage';
import { GroupDashboardPage } from './pages/GroupDashboardPage';
import { GroupSettingsPage } from './pages/GroupSettingsPage';
import { GoalCreationPage } from './pages/GoalCreationPage';
import { TasksPage } from './pages/TasksPage';
import { SubmissionUploadPage } from './pages/SubmissionUploadPage';
import { ApprovalQueuePage } from './pages/ApprovalQueuePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LandingPage } from './pages/LandingPage';
import { JoinPage } from './pages/JoinPage';
import { DiscoverCrewsPage } from './pages/DiscoverCrewsPage';
import { NotFoundPage } from './pages/NotFoundPage';

/** Forward Supabase hash errors (e.g. otp_expired on Site URL /) to the callback page. */
function AuthHashForwarder() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (!hashParams.get('error') && !hashParams.get('error_code')) return;
    if (location.pathname === '/auth/callback') return;
    navigate(`/auth/callback${location.hash}`, { replace: true });
  }, [location.hash, location.pathname, navigate]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <AuthHashForwarder />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/auth/confirm" element={<AuthConfirmPage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/discover"
              element={
                <ProtectedRoute>
                  <DiscoverCrewsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:id"
              element={
                <ProtectedRoute>
                  <GroupLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<GroupDashboardPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="settings" element={<GroupSettingsPage />} />
              <Route path="goals/new" element={<GoalCreationPage />} />
              <Route path="submit" element={<SubmissionUploadPage />} />
              <Route path="approve" element={<ApprovalQueuePage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}
