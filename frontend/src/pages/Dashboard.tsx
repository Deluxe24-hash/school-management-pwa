import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, GraduationCap, UserCheck, School, BookOpen, CalendarCheck, ClipboardList, Megaphone, ChevronRight } from "lucide-react";
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
}

const QuickLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="card flex items-center justify-between w-full text-left hover:border-gold-300 dark:hover:border-gold-500/40 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-primary-700 dark:text-primary-300" />
        </div>
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
  );
};

const AdminDashboard = ({ greetingName }: { greetingName: string }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    reportApi
      .getDashboardStats()
      .then((res) => { if (mounted) setStats(res.data.data); })
      .catch(() => { if (mounted) setError("Couldn't load dashboard stats."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

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

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="card"><EmptyState title="Unable to load stats" description={error} /></div>
      ) : stats ? (
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
      ) : null}
    </div>
  );
};

const TeacherDashboard = ({ greetingName }: { greetingName: string }) => {
  const { user } = useAuth();
  const classArms = user?.teacher?.classArms || [];
  const classSubjects = user?.teacher?.classSubjects || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-primary-900 dark:text-white">
          Welcome back, <span className="capitalize">{greetingName}</span>
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
          {classSubjects.length > 0
            ? `You're teaching ${classSubjects.length} subject${classSubjects.length === 1 ? "" : "s"} across your assigned classes.`
            : "You haven't been assigned to any class or subject yet — ask an admin to set this up."}
        </p>
      </div>

      {classSubjects.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Your Assignments</h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {classSubjects.map((cs: any) => (
              <div key={cs.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{cs.subject?.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{cs.class?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {classArms.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Homeroom Classes</h3>
          <div className="flex flex-wrap gap-2">
            {classArms.map((a: any) => (
              <span key={a.id} className="px-3 py-1.5 rounded-md bg-gold-50 dark:bg-gold-500/10 text-gold-700 dark:text-gold-400 text-sm font-medium">
                {a.fullName}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickLink to="/attendance" icon={CalendarCheck} label="Mark Attendance" />
        <QuickLink to="/results" icon={BookOpen} label="Enter Results" />
        <QuickLink to="/assignments" icon={ClipboardList} label="Assignments" />
        <QuickLink to="/announcements" icon={Megaphone} label="Announcements" />
      </div>
    </div>
  );
};

const ParentDashboard = ({ greetingName }: { greetingName: string }) => {
  const { user } = useAuth();
  const children = user?.parent?.children || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-primary-900 dark:text-white">
          Welcome back, <span className="capitalize">{greetingName}</span>
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
          {children.length > 0 ? `${children.length} child${children.length === 1 ? "" : "ren"} linked to your account.` : "No children are linked to your account yet."}
        </p>
      </div>

      {children.length === 0 ? (
        <div className="card"><EmptyState title="No children linked" description="Ask the school admin to link your child's student record to your account." /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {children.map((child: any) => (
            <div key={child.id} className="card">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-4 h-4 text-primary-700 dark:text-primary-300" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{child.firstName} {child.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {child.enrollments?.[0]?.classArm?.fullName || "Not yet enrolled in a class"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Admission No. {child.admissionNumber}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickLink to="/announcements" icon={Megaphone} label="Announcements" />
      </div>
    </div>
  );
};

const StudentDashboard = ({ greetingName }: { greetingName: string }) => {
  const { user } = useAuth();
  const student = user?.student;
  const classArm = student?.enrollments?.[0]?.classArm as any;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-primary-900 dark:text-white">
          Welcome back, <span className="capitalize">{greetingName}</span>
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
          {classArm ? `You're enrolled in ${classArm.fullName}.` : "You haven't been enrolled in a class yet."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuickLink to="/assignments" icon={ClipboardList} label="My Assignments" />
        <QuickLink to="/announcements" icon={Megaphone} label="Announcements" />
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { user, isAdmin, isParent, isStudent } = useAuth();
  const greetingName = user?.email?.split("@")[0] ?? "there";

  if (isAdmin()) return <AdminDashboard greetingName={greetingName} />;
  if (isParent()) return <ParentDashboard greetingName={greetingName} />;
  if (isStudent()) return <StudentDashboard greetingName={greetingName} />;
  // Teachers and any other staff-level role
  return <TeacherDashboard greetingName={greetingName} />;
};
