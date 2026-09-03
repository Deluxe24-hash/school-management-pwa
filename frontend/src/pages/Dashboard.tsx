import { useEffect, useState } from "react";
import { Users, GraduationCap, UserCheck, School, BookOpen, CalendarCheck } from "lucide-react";
import { reportApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { StatCard } from "../components/StatCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  totalSubjects: number;
  currentSession: { name?: string; terms?: { name: string; isCurrent: boolean }[] } | null;
  todayAttendances: number;
  recentPayments: {
    id: string;
    amount: number;
    student?: { firstName: string; lastName: string };
    createdAt: string;
  }[];
  genderStats: { gender: string; _count: { gender: number } }[];
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    reportApi
      .getDashboardStats()
      .then((res) => {
        if (mounted) setStats(res.data.data);
      })
      .catch(() => {
        if (mounted) setError("Couldn't load dashboard stats.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const greetingName = user?.email?.split("@")[0] ?? "there";
  const currentTerm = stats?.currentSession?.terms?.find((t) => t.isCurrent)?.name;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-primary-900 dark:text-white">
          Welcome back, <span className="capitalize">{greetingName}</span>
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
          {stats?.currentSession?.name
            ? `${stats.currentSession.name}${currentTerm ? `, ${currentTerm}` : ""}`
            : "Here's what's happening at your school today."}
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!loading && error && (
        <div className="card">
          <EmptyState title="Unable to load stats" description={error} />
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Total Students" value={stats.totalStudents} icon={GraduationCap} color="blue" />
            <StatCard title="Total Teachers" value={stats.totalTeachers} icon={Users} color="green" />
            <StatCard title="Total Parents" value={stats.totalParents} icon={UserCheck} color="purple" />
            <StatCard title="Classes" value={stats.totalClasses} icon={School} color="yellow" />
            <StatCard title="Subjects" value={stats.totalSubjects} icon={BookOpen} color="blue" />
            <StatCard title="Marked Today" value={stats.todayAttendances} icon={CalendarCheck} color="green" />
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Payments</h3>
            {stats.recentPayments.length === 0 ? (
              <EmptyState title="No payments yet" description="Payments will show up here once recorded." />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {stats.recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {p.student ? `${p.student.firstName} ${p.student.lastName}` : "Unknown student"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      ₦{p.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
