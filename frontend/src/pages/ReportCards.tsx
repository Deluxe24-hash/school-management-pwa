import { useEffect, useState } from "react";
import { FileText, Printer } from "lucide-react";
import { reportCardApi, classApi, studentApi, sessionApi } from "../services/api";
import { ClassArm, Student, AcademicSession } from "../types";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { formatDate } from "../utils/helpers";

export const ReportCards = () => {
  const { isTeacher } = useAuth();
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classArmId, setClassArmId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    classApi.getAll().then((res) => {
      const arms: ClassArm[] = res.data.data.flatMap((c: any) => c.arms.map((a: any) => ({ ...a, class: c })));
      setClassArms(arms);
    }).catch(() => {});
    sessionApi.getAll().then((res) => setSessions(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!classArmId) { setStudents([]); return; }
    studentApi.getAll({ classArmId, limit: 200 }).then((res) => setStudents(res.data.data.students)).catch(() => {});
  }, [classArmId]);

  const selectedSession = sessions.find((s) => s.id === sessionId);
  const terms = selectedSession?.terms || [];

  const handleGenerate = async () => {
    if (!studentId || !classArmId || !sessionId || !termId) return;
    setGenerating(true);
    setGenMsg(null);
    try {
      await reportCardApi.generate({ studentId, classArmId, sessionId, termId });
      setGenMsg("Report card generated.");
      handleView();
    } catch (err: any) {
      setGenMsg(err?.message || "Couldn't generate — make sure results exist for this term.");
    } finally {
      setGenerating(false);
    }
  };

  const handleView = () => {
    if (!studentId || !sessionId || !termId) return;
    setLoading(true);
    setError(null);
    reportCardApi.get({ studentId, sessionId, termId })
      .then((res) => setData(res.data.data))
      .catch(() => { setData(null); setError("No report card found for this term yet — generate one first."); })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Report Cards</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate and view student report cards</p>
      </div>

      <div className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class</label>
          <select className="input-field" value={classArmId} onChange={(e) => { setClassArmId(e.target.value); setStudentId(""); }}>
            <option value="">Select</option>
            {classArms.map((a) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Student</label>
          <select className="input-field" value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={!classArmId}>
            <option value="">Select</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Session</label>
          <select className="input-field" value={sessionId} onChange={(e) => { setSessionId(e.target.value); setTermId(""); }}>
            <option value="">Select</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Term</label>
          <select className="input-field" value={termId} onChange={(e) => setTermId(e.target.value)} disabled={!sessionId}>
            <option value="">Select</option>
            {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 print:hidden">
        <button onClick={handleView} disabled={!studentId || !termId} className="btn-secondary">View</button>
        {isTeacher() && (
          <button onClick={handleGenerate} disabled={generating || !studentId || !termId} className="btn-primary flex items-center gap-2">
            <FileText className="w-4 h-4" /> {generating ? "Generating..." : "Generate / Refresh"}
          </button>
        )}
        {genMsg && <p className="text-sm text-gray-600 dark:text-gray-300">{genMsg}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="card print:hidden"><EmptyState title="No report card" description={error} /></div>
      ) : data ? (
        <div className="card print:shadow-none print:border-none">
          <div className="flex items-center justify-between mb-6 print:hidden">
            <h3 className="font-serif font-semibold text-lg text-primary-900 dark:text-white">Report Card Preview</h3>
            <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>

          <div className="text-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-serif font-bold text-xl text-primary-900 dark:text-white">
              {data.student?.firstName} {data.student?.lastName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.student?.admissionNumber} · {data.student?.enrollments?.[0]?.classArm?.fullName}
            </p>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <th className="py-2">Subject</th>
                <th className="py-2 text-center">CA1</th>
                <th className="py-2 text-center">CA2</th>
                <th className="py-2 text-center">Project</th>
                <th className="py-2 text-center">Exam</th>
                <th className="py-2 text-center">Total</th>
                <th className="py-2 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.results?.map((r: any) => (
                <tr key={r.id}>
                  <td className="py-2 font-medium text-gray-900 dark:text-white">{r.subject?.name}</td>
                  <td className="py-2 text-center">{r.ca1Score ?? "—"}</td>
                  <td className="py-2 text-center">{r.ca2Score ?? "—"}</td>
                  <td className="py-2 text-center">{r.projectScore ?? "—"}</td>
                  <td className="py-2 text-center">{r.examScore ?? "—"}</td>
                  <td className="py-2 text-center font-medium">{r.totalScore?.toFixed(1) ?? "—"}</td>
                  <td className="py-2 text-center font-medium">{r.grade ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="px-3 py-2.5 rounded-md border border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Average</p>
              <p className="font-serif font-semibold text-lg text-primary-900 dark:text-white">{data.reportCard?.average?.toFixed(1) ?? "—"}%</p>
            </div>
            <div className="px-3 py-2.5 rounded-md border border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Class Position</p>
              <p className="font-serif font-semibold text-lg text-primary-900 dark:text-white">{data.reportCard?.classPosition ?? "—"} / {data.reportCard?.classSize ?? "—"}</p>
            </div>
            <div className="px-3 py-2.5 rounded-md border border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Attendance</p>
              <p className="font-serif font-semibold text-lg text-primary-900 dark:text-white">{data.reportCard?.attendancePresent ?? 0} present</p>
            </div>
            <div className="px-3 py-2.5 rounded-md border border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Generated</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5">{data.reportCard?.generatedAt ? formatDate(data.reportCard.generatedAt) : "—"}</p>
            </div>
          </div>

          {data.reportCard?.teacherRemark && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2"><span className="font-medium">Teacher's remark:</span> {data.reportCard.teacherRemark}</p>
          )}
          {data.reportCard?.principalRemark && (
            <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Principal's remark:</span> {data.reportCard.principalRemark}</p>
          )}
        </div>
      ) : (
        <div className="card print:hidden"><EmptyState title="Select a student and term" description="Choose a class, student, session, and term, then generate or view their report card." /></div>
      )}
    </div>
  );
};
