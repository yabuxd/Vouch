import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
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
