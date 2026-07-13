import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GroupLayout } from './components/GroupLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
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
import { NotFoundPage } from './pages/NotFoundPage';

function AuthHashDebugProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (!hashParams.get('error') && !hashParams.get('error_code')) return;
    // #region agent log
    fetch('http://127.0.0.1:7530/ingest/e6f5fe77-9e75-413a-a6e5-206191b52f12',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'78e600'},body:JSON.stringify({sessionId:'78e600',runId:'confirm-email',hypothesisId:'A-D-E',location:'App.tsx:AuthHashDebugProbe',message:'auth hash error on route',data:{origin:window.location.origin,pathname:location.pathname,hashError:hashParams.get('error'),hashErrorCode:hashParams.get('error_code'),hashErrorDescription:hashParams.get('error_description')},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (location.pathname !== '/auth/callback') {
      navigate(`/auth/callback${location.hash}`, { replace: true });
    }
  }, [location.hash, location.pathname, navigate]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <AuthHashDebugProbe />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
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
