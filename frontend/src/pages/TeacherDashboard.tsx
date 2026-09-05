import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, School, BookOpen, Clock, ClipboardList, ClipboardCheck,
  MessageSquare, Bell, CheckCircle2, AlertCircle, BarChart3,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { classApi, timetableApi, assignmentApi, attendanceApi, messageApi, notificationApi, sessionApi } from "../services/api";
import { StatCard } from "../components/StatCard";
import { LoadingSpinner } from "../components/LoadingSpinner";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const QuickAction = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-primary-950/30 hover:border-gold-300 dark:hover:border-gold-500/40 transition-colors"
    >
      <div className="w-9 h-9 rounded-md bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary-700 dark:text-primary-300" />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{label}</span>
    </button>
  );
};

export const TeacherDashboard = ({ greetingName }: { greetingName: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const homeroomArms = user?.teacher?.classArms || [];
  const classSubjects = user?.teacher?.classSubjects || [];
  const isFormTeacher = homeroomArms.length > 0;

  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [submissionsReceived, setSubmissionsReceived] = useState(0);
  const [pendingAttendanceClasses, setPendingAttendanceClasses] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [classOverview, setClassOverview] = useState<any[]>([]);
  const [subjectOverview, setSubjectOverview] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayName = DAY_NAMES[today.getDay()];
  const todayIso = today.toISOString().slice(0, 10);

  // Every distinct class arm this teacher touches: homeroom classes, plus every arm
  // under classes they teach a subject in.
  const myClassArms = useMemo(() => {
    const subjectClassIds = new Set(classSubjects.map((cs: any) => cs.class?.id).filter(Boolean));
    const armsFromSubjects = allClasses
      .filter((c: any) => subjectClassIds.has(c.id))
      .flatMap((c: any) => c.arms.map((a: any) => ({ ...a, class: c })));
    const combined = [...homeroomArms, ...armsFromSubjects];
    const seen = new Set<string>();
    return combined.filter((a: any) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
  }, [allClasses, homeroomArms, classSubjects]);

  const totalStudents = useMemo(
    () => myClassArms.reduce((sum: number, a: any) => sum + (a._count?.enrollments ?? 0), 0),
    [myClassArms]
  );

  const uniqueSubjects = useMemo(() => {
    const seen = new Set<string>();
    return classSubjects.filter((cs: any) => (seen.has(cs.subject?.id) ? false : (seen.add(cs.subject?.id), true)));
  }, [classSubjects]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      classApi.getAll(),
      timetableApi.getAll({ teacherId: user?.teacher?.id }),
      assignmentApi.getAll({ teacherId: user?.teacher?.id, limit: 100 }),
      messageApi.getInbox(),
      notificationApi.getAll(),
      sessionApi.getCurrent().catch(() => null),
    ]).then(async ([classesRes, timetableRes, assignmentsRes, inboxRes, notifRes, sessionRes]) => {
      if (!mounted) return;
      const classesData = classesRes.data.data;
      setAllClasses(classesData);

      const entries = timetableRes.data.data.filter((e: any) => e.day === todayName)
        .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
      setTodaySchedule(entries);

      const myAssignments = assignmentsRes.data.data.assignments;
      setSubmissionsReceived(myAssignments.reduce((sum: number, a: any) => sum + (a._count?.submissions ?? 0), 0));

      setUnreadMessages(inboxRes.data.data.filter((m: any) => !m.isRead).length);
      setUnreadNotifications(notifRes.data.data.unreadCount);

      // Subject overview: group this teacher's own assignments by subject+class,
      // and pair each with the total students enrolled across that class's arms.
      const subjectGroups = new Map<string, any>();
      classSubjects.forEach((cs: any) => {
        const key = `${cs.subject?.id}-${cs.class?.id}`;
        const classDef = classesData.find((c: any) => c.id === cs.class?.id);
        const studentsOffering = (classDef?.arms || []).reduce((sum: number, a: any) => sum + (a._count?.enrollments ?? 0), 0);
        subjectGroups.set(key, {
          subjectName: cs.subject?.name,
          className: cs.class?.name,
          classId: cs.class?.id,
          subjectId: cs.subject?.id,
          studentsOffering,
          totalAssignments: 0,
          totalSubmissions: 0,
        });
      });
      myAssignments.forEach((a: any) => {
        const key = `${a.subject?.id}-${a.classArm?.class?.id}`;
        const group = subjectGroups.get(key);
        if (group) {
          group.totalAssignments += 1;
          group.totalSubmissions += a._count?.submissions ?? 0;
        }
      });
      if (mounted) setSubjectOverview(Array.from(subjectGroups.values()));

      // Class overview: for each homeroom class, today's attendance breakdown plus
      // every assignment given to that class (from any subject teacher, not just this one).
      if (homeroomArms.length > 0 && sessionRes) {
        const results = await Promise.all(
          homeroomArms.map(async (arm: any) => {
            const [attendanceRes, classAssignmentsRes] = await Promise.all([
              attendanceApi.getAll({ classArmId: arm.id, date: todayIso, limit: 300 }),
              assignmentApi.getAll({ classArmId: arm.id, limit: 100 }),
            ]);
            const records = attendanceRes.data.data.attendances;
            const classAssignments = classAssignmentsRes.data.data.assignments;
            return {
              arm,
              totalStudents: arm._count?.enrollments ?? 0,
              present: records.filter((r: any) => r.status === "PRESENT").length,
              absent: records.filter((r: any) => r.status === "ABSENT").length,
              late: records.filter((r: any) => r.status === "LATE").length,
              excused: records.filter((r: any) => r.status === "EXCUSED").length,
              attendanceTaken: records.length > 0,
              totalAssignments: classAssignments.length,
              totalSubmissions: classAssignments.reduce((sum: number, a: any) => sum + (a._count?.submissions ?? 0), 0),
            };
          })
        );
        if (mounted) {
          setClassOverview(results);
          setPendingAttendanceClasses(results.filter((r) => !r.attendanceTaken).map((r) => r.arm));
        }
      }
    }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.teacher?.id]);

  if (loading) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-primary-900 dark:text-white">
          Good {today.getHours() < 12 ? "Morning" : today.getHours() < 17 ? "Afternoon" : "Evening"}, <span className="capitalize">{greetingName}</span>
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">Here's your teaching overview for today, {todayName}.</p>
      </div>

      {classSubjects.length === 0 && homeroomArms.length === 0 ? (
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">You haven't been assigned to any class or subject yet — ask an admin to set this up.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard title="My Students" value={totalStudents} icon={Users} color="blue" />
            <StatCard title="My Classes" value={myClassArms.length} icon={School} color="green" />
            <StatCard title="My Subjects" value={uniqueSubjects.length} icon={BookOpen} color="purple" />
            <StatCard title="Today's Classes" value={todaySchedule.length} icon={Clock} color="yellow" />
            <StatCard title="Submissions to Review" value={submissionsReceived} icon={ClipboardList} color="blue" />
            <StatCard title="Attendance Pending" value={pendingAttendanceClasses.length} icon={ClipboardCheck} color={pendingAttendanceClasses.length > 0 ? "red" : "green"} />
            <StatCard title="Unread Messages" value={unreadMessages} icon={MessageSquare} color="purple" />
            <StatCard title="Notifications" value={unreadNotifications} icon={Bell} color="yellow" />
          </div>

          {pendingAttendanceClasses.length > 0 && (
            <div className="card border-l-[3px] border-l-red-600 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  Attendance not yet taken today for {pendingAttendanceClasses.map((a: any) => a.fullName).join(", ")}.
                </p>
              </div>
              <button onClick={() => navigate("/attendance")} className="btn-primary text-xs py-1.5">Take Attendance</button>
            </div>
          )}

          {/* Class Overview — form teachers only */}
          {classOverview.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Class Overview</h3>
              <div className="space-y-4">
                {classOverview.map((co: any) => (
                  <div key={co.arm.id} className="px-4 py-3.5 rounded-md border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900 dark:text-white">{co.arm.fullName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{co.totalStudents} students</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Present Today</p>
                        <p className="font-serif font-semibold text-lg text-emerald-700 dark:text-emerald-400">{co.attendanceTaken ? co.present : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Absent Today</p>
                        <p className="font-serif font-semibold text-lg text-red-700 dark:text-red-400">{co.attendanceTaken ? co.absent : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Late / Excused</p>
                        <p className="font-serif font-semibold text-lg text-gold-600 dark:text-gold-400">{co.attendanceTaken ? `${co.late} / ${co.excused}` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Assignments</p>
                        <p className="font-serif font-semibold text-lg text-primary-900 dark:text-white">{co.totalAssignments} <span className="text-xs font-sans font-normal text-gray-500 dark:text-gray-400">({co.totalSubmissions} submitted)</span></p>
                      </div>
                    </div>
                    {!co.attendanceTaken && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2.5">Attendance not yet taken today.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Schedule */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Today's Schedule</h3>
            {todaySchedule.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No periods scheduled for today.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {todaySchedule.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between py-3 gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">{e.startTime}–{e.endTime}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{e.subject?.name} · {e.classArm?.fullName}</p>
                        {e.room && <p className="text-xs text-gray-500 dark:text-gray-400">{e.room}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {homeroomArms.some((a: any) => a.id === e.classArmId) && (
                        <button onClick={() => navigate("/attendance")} className="btn-secondary text-xs py-1">Attendance</button>
                      )}
                      <button onClick={() => navigate("/results")} className="btn-secondary text-xs py-1">Results</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Classes */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">My Classes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myClassArms.map((a: any) => {
                const isHomeroom = homeroomArms.some((h: any) => h.id === a.id);
                const subjectsHere = classSubjects.filter((cs: any) => cs.class?.id === a.class?.id).map((cs: any) => cs.subject?.name);
                return (
                  <div key={a.id} className="px-4 py-3 rounded-md border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{a.fullName}</span>
                      {isHomeroom && (
                        <span className="flex items-center gap-1 text-xs font-medium text-gold-700 dark:text-gold-400 bg-gold-50 dark:bg-gold-500/10 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Form Teacher
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{a._count?.enrollments ?? 0} students{subjectsHere.length > 0 ? ` · ${subjectsHere.join(", ")}` : ""}</p>
                    <div className="flex gap-2 mt-2.5 flex-wrap">
                      <button onClick={() => navigate("/students")} className="btn-secondary text-xs py-1">Students</button>
                      {isHomeroom && <button onClick={() => navigate("/attendance")} className="btn-secondary text-xs py-1">Attendance</button>}
                      <button onClick={() => navigate("/results")} className="btn-secondary text-xs py-1">Results</button>
                      <button onClick={() => navigate("/assignments")} className="btn-secondary text-xs py-1">Assignments</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* My Subjects Overview */}
          {subjectOverview.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">My Subjects Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjectOverview.map((so: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => navigate("/results")}
                    className="text-left px-4 py-3 rounded-md border border-gray-200 dark:border-gray-800 hover:border-gold-300 dark:hover:border-gold-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{so.subjectName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{so.className}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-300">
                      <span>{so.studentsOffering} students offering</span>
                      <span>{so.totalAssignments} assignment{so.totalAssignments === 1 ? "" : "s"} · {so.totalSubmissions} submitted</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {isFormTeacher && <QuickAction to="/attendance" icon={ClipboardCheck} label="Take Attendance" />}
              <QuickAction to="/results" icon={BookOpen} label="Enter Results" />
              <QuickAction to="/assignments" icon={ClipboardList} label="Assignments" />
              <QuickAction to="/students" icon={Users} label="My Students" />
              <QuickAction to="/timetable" icon={Clock} label="Timetable" />
              <QuickAction to="/messages" icon={MessageSquare} label="Messages" />
              <QuickAction to="/report-cards" icon={School} label="Report Cards" />
              <QuickAction to="/performance" icon={BarChart3} label="Performance" />
              <QuickAction to="/announcements" icon={Bell} label="Announcements" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
