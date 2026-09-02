import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import { useAuth } from "./hooks/useAuth";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Students } from "./pages/Students";
import { Teachers } from "./pages/Teachers";
import { Classes } from "./pages/Classes";
import { Subjects } from "./pages/Subjects";
import { Sessions } from "./pages/Sessions";
import { Attendance } from "./pages/Attendance";
import { Results } from "./pages/Results";
import { Fees } from "./pages/Fees";
import { Assignments } from "./pages/Assignments";
import { Announcements } from "./pages/Announcements";
import { Settings } from "./pages/Settings";
import { Profile } from "./pages/Profile";
import { NotFound } from "./pages/NotFound";

function App() {
  const { fetchUser } = useAuthStore();
  const { isLoading } = useAuth();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/results" element={<Results />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
