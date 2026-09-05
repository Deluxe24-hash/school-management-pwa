import { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from "recharts";
import { TrendingUp, Award, Users as UsersIcon } from "lucide-react";
import { analyticsApi, classApi, subjectApi, sessionApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { cn } from "../utils/helpers";

type Tab = "subject" | "attendance" | "assignments";

const GRADE_COLORS: Record<string, string> = {
  A: "#22304e", B: "#3d4f7d", C: "#a67a24", D: "#c0912f", F: "#b91c1c", Ungraded: "#9ca3af",
};

export const Performance = () => {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("subject");

  const [classArms, setClassArms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classArmId, setClassArmId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sessionInfo, setSessionInfo] = useState<{ sessionId: string; termId: string } | null>(null);

  const myFormClassIds = new Set((user?.teacher?.classArms || []).map((a: any) => a.class?.id).filter(Boolean));
  const myClassSubjects = user?.teacher?.classSubjects || [];

  const [subjectPerf, setSubjectPerf] = useState<any>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<any>(null);
  const [assignmentCompletion, setAssignmentCompletion] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    classApi.getAll().then((res) => {
      const arms = res.data.data.flatMap((c: any) => c.arms.map((a: any) => ({ ...a, class: c })));
      setClassArms(arms);
    }).catch(() => {});
    subjectApi.getAll().then((res) => setSubjects(res.data.data)).catch(() => {});
    sessionApi.getCurrent().then((res) => {
      const current = res.data.data;
      const currentTerm = current.terms?.find((t: any) => t.isCurrent) || current.terms?.[0];
      if (currentTerm) setSessionInfo({ sessionId: current.id, termId: currentTerm.id });
    }).catch(() => {});
  }, []);

  const availableClassArms = useMemo(() => {
    if (isAdmin()) return classArms;
    const allowed = new Set([...myFormClassIds, ...myClassSubjects.map((cs: any) => cs.class?.id).filter(Boolean)]);
    return classArms.filter((a: any) => allowed.has(a.class?.id));
  }, [classArms, isAdmin, myFormClassIds, myClassSubjects]);

  const availableSubjects = useMemo(() => {
    if (!classArmId) return [];
    const arm = classArms.find((a) => a.id === classArmId);
    if (!arm) return [];
    if (isAdmin() || myFormClassIds.has((arm as any).class?.id)) return subjects;
    const mySubjectIds = new Set(myClassSubjects.filter((cs: any) => cs.class?.id === (arm as any).class?.id).map((cs: any) => cs.subject?.id));
    return subjects.filter((s: any) => mySubjectIds.has(s.id));
  }, [classArmId, classArms, subjects, isAdmin, myFormClassIds, myClassSubjects]);

  // Attendance trend is only meaningful (and only permitted to view) for a class you're the form teacher of.
  const availableAttendanceClassArms = useMemo(() => {
    if (isAdmin()) return classArms;
    return classArms.filter((a: any) => myFormClassIds.has((a as any).class?.id));
  }, [classArms, isAdmin, myFormClassIds]);

  useEffect(() => {
    if (tab !== "subject" || !classArmId || !subjectId || !sessionInfo) return;
    setLoading(true);
    analyticsApi.getSubjectPerformance({ classArmId, subjectId, sessionId: sessionInfo.sessionId, termId: sessionInfo.termId })
      .then((res) => setSubjectPerf(res.data.data))
      .finally(() => setLoading(false));
  }, [tab, classArmId, subjectId, sessionInfo]);

  useEffect(() => {
    if (tab !== "attendance" || !classArmId || !sessionInfo) return;
    setLoading(true);
    analyticsApi.getAttendanceTrend({ classArmId, sessionId: sessionInfo.sessionId, termId: sessionInfo.termId })
      .then((res) => setAttendanceTrend(res.data.data))
      .finally(() => setLoading(false));
  }, [tab, classArmId, sessionInfo]);

  useEffect(() => {
    if (tab !== "assignments" || !sessionInfo) return;
    setLoading(true);
    const params: any = { sessionId: sessionInfo.sessionId, termId: sessionInfo.termId };
    if (!isAdmin()) params.teacherId = user?.teacher?.id;
    analyticsApi.getAssignmentCompletion(params)
      .then((res) => setAssignmentCompletion(res.data.data))
      .finally(() => setLoading(false));
  }, [tab, sessionInfo, isAdmin, user?.teacher?.id]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "subject", label: "Subject Performance" },
    { id: "attendance", label: "Attendance Trend" },
    { id: "assignments", label: "Assignment Completion" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Performance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Class averages, attendance trends, and assignment completion</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.id ? "border-gold-400 text-primary-900 dark:text-white" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "subject" && (
        <div className="space-y-4">
          <div className="card flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class</label>
              <select className="input-field" value={classArmId} onChange={(e) => { setClassArmId(e.target.value); setSubjectId(""); }}>
                <option value="">Select a class</option>
                {availableClassArms.map((a: any) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
              <select className="input-field" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!classArmId}>
                <option value="">Select a subject</option>
                {availableSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {!classArmId || !subjectId ? (
            <div className="card"><EmptyState title="Select a class and subject" description="Choose both above to see performance data." /></div>
          ) : loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : !subjectPerf || subjectPerf.students.length === 0 ? (
            <div className="card"><EmptyState title="No results yet" description="Scores haven't been entered for this class/subject/term yet." /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Average</p>
                  <p className="font-serif font-semibold text-2xl text-primary-900 dark:text-white mt-1">{subjectPerf.average.toFixed(1)}</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Highest</p>
                  <p className="font-serif font-semibold text-2xl text-emerald-700 dark:text-emerald-400 mt-1">{subjectPerf.highest.toFixed(1)}</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Lowest</p>
                  <p className="font-serif font-semibold text-2xl text-red-700 dark:text-red-400 mt-1">{subjectPerf.lowest.toFixed(1)}</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pass Rate</p>
                  <p className="font-serif font-semibold text-2xl text-gold-600 dark:text-gold-400 mt-1">{subjectPerf.passRate.toFixed(0)}%</p>
                </div>
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Grade Distribution</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={subjectPerf.gradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {subjectPerf.gradeDistribution.map((entry: any, i: number) => (
                        <Cell key={i} fill={GRADE_COLORS[entry.grade] || "#22304e"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Top Performers
                </h3>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {subjectPerf.students.slice(0, 5).map((s: any, i: number) => (
                    <div key={s.admissionNumber} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-gold-50 dark:bg-gold-500/10 text-gold-700 dark:text-gold-400 text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{s.totalScore?.toFixed(1)} · {s.grade}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "attendance" && (
        <div className="space-y-4">
          <div className="card max-w-sm">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class</label>
            <select className="input-field" value={classArmId} onChange={(e) => setClassArmId(e.target.value)}>
              <option value="">Select a class</option>
              {availableAttendanceClassArms.map((a: any) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
            </select>
          </div>

          {!isAdmin() && availableAttendanceClassArms.length === 0 ? (
            <div className="card"><EmptyState title="Form teachers only" description="Attendance trends are only available for classes you're the form teacher of." /></div>
          ) : !classArmId ? (
            <div className="card"><EmptyState title="Select a class" description="Choose a class above to see its attendance trend." /></div>
          ) : loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : !attendanceTrend || attendanceTrend.weeks.length === 0 ? (
            <div className="card"><EmptyState title="No attendance recorded yet" description="Mark some attendance for this term to see the trend." /></div>
          ) : (
            <>
              <div className="card flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary-700 dark:text-primary-300" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Overall attendance rate this term</p>
                  <p className="font-serif font-semibold text-2xl text-primary-900 dark:text-white">{attendanceTrend.overallRate}%</p>
                </div>
              </div>
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Weekly Attendance Rate</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={attendanceTrend.weeks}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#a67a24" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "assignments" && (
        loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : assignmentCompletion.length === 0 ? (
          <div className="card"><EmptyState title="No assignments yet" description="Create an assignment to see completion rates here." /></div>
        ) : (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4 flex items-center gap-2">
              <UsersIcon className="w-4 h-4" /> Submission Completion Rate
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(240, assignmentCompletion.length * 44)}>
              <BarChart data={assignmentCompletion} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="title" width={140} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any, _name: string, props: any) => [`${props.payload.submitted}/${props.payload.total} (${value}%)`, "Completion"]} />
                <Bar dataKey="completionRate" fill="#22304e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      )}
    </div>
  );
};
