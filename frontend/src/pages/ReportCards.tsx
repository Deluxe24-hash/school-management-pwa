import { useEffect, useState } from "react";
import { FileText, Printer, CheckCircle2, Undo2, GraduationCap } from "lucide-react";
import { reportCardApi, classApi, studentApi, sessionApi, settingApi } from "../services/api";
import { ClassArm, Student, AcademicSession } from "../types";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { formatDate } from "../utils/helpers";

export const ReportCards = () => {
  const { user, isTeacher, isAdmin, isParent, isStudent } = useAuth();
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classArmId, setClassArmId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [school, setSchool] = useState<any>(null);

  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const restrictedView = isParent() || isStudent();
  const myChildren = user?.parent?.children || [];

  useEffect(() => {
    settingApi.get().then((res) => setSchool(res.data.data)).catch(() => {});
    sessionApi.getAll().then((res) => setSessions(res.data.data)).catch(() => {});

    if (!restrictedView) {
      classApi.getAll().then((res) => {
        const arms: ClassArm[] = res.data.data.flatMap((c: any) => c.arms.map((a: any) => ({ ...a, class: c })));
        setClassArms(arms);
      }).catch(() => {});
    }
  }, [restrictedView]);

  // Students/Parents: auto-select the right student(s) and current term, then load immediately.
  useEffect(() => {
    if (!restrictedView) return;
    if (isStudent() && user?.student) setStudentId(user.student.id);
    if (isParent() && myChildren.length === 1) setStudentId(myChildren[0].id);

    sessionApi.getCurrent().then((res) => {
      const current = res.data.data;
      const currentTerm = current.terms?.find((t: any) => t.isCurrent) || current.terms?.[0];
      setSessionId(current.id);
      if (currentTerm) setTermId(currentTerm.id);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restrictedView]);

  useEffect(() => {
    if (!classArmId || restrictedView) { if (!restrictedView) setStudents([]); return; }
    studentApi.getAll({ classArmId, limit: 200 }).then((res) => setStudents(res.data.data.students)).catch(() => {});
  }, [classArmId, restrictedView]);

  useEffect(() => {
    if (studentId && sessionId && termId) handleView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, sessionId, termId]);

  const selectedSession = sessions.find((s) => s.id === sessionId);
  const terms = selectedSession?.terms || [];

  const handleGenerate = async () => {
    if (!studentId || !classArmId || !sessionId || !termId) return;
    setGenerating(true);
    setGenMsg(null);
    try {
      await reportCardApi.generate({ studentId, classArmId, sessionId, termId });
      setGenMsg("Report card generated — sent to admin for review before it can be published.");
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
      .catch((err: any) => {
        setData(null);
        setError(err?.message || "No report card found for this term yet — generate one first.");
      })
      .finally(() => setLoading(false));
  };

  const handlePublishToggle = async () => {
    if (!data?.reportCard) return;
    setPublishing(true);
    try {
      if (data.reportCard.isPublished) {
        await reportCardApi.unpublish({ studentId, sessionId, termId });
      } else {
        await reportCardApi.publish({ studentId, sessionId, termId });
      }
      handleView();
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="print:hidden">
        <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Report Cards</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {restrictedView ? "View and print report cards once published by the school." : "Generate report cards for admin review, then publish for parents and students to view."}
        </p>
      </div>

      {!restrictedView && (
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
      )}

      {restrictedView && isParent() && myChildren.length > 1 && (
        <div className="card max-w-sm print:hidden">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Child</label>
          <select className="input-field" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Select</option>
            {myChildren.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </select>
        </div>
      )}

      {restrictedView && terms.length > 0 && (
        <div className="card max-w-sm print:hidden">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Term</label>
          <select className="input-field" value={termId} onChange={(e) => setTermId(e.target.value)}>
            {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}

      {!restrictedView && (
        <div className="flex items-center gap-3 flex-wrap print:hidden">
          <button onClick={handleView} disabled={!studentId || !termId} className="btn-secondary">View</button>
          {isTeacher() && (
            <button onClick={handleGenerate} disabled={generating || !studentId || !termId} className="btn-primary flex items-center gap-2">
              <FileText className="w-4 h-4" /> {generating ? "Generating..." : "Generate / Refresh"}
            </button>
          )}
          {isAdmin() && data?.reportCard && (
            <button onClick={handlePublishToggle} disabled={publishing} className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-md ${data.reportCard.isPublished ? "btn-secondary" : "btn-primary"}`}>
              {data.reportCard.isPublished ? <><Undo2 className="w-4 h-4" /> Unpublish</> : <><CheckCircle2 className="w-4 h-4" /> Publish to Parent</>}
            </button>
          )}
          {genMsg && <p className="text-sm text-gray-600 dark:text-gray-300">{genMsg}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="card print:hidden"><EmptyState title="No report card" description={error} /></div>
      ) : data ? (
        !isAdmin() && !isTeacher() && !data.reportCard.isPublished ? (
          <div className="card print:hidden"><EmptyState title="Not published yet" description="The school hasn't published this report card yet. Check back soon." /></div>
        ) : (
          <div className="card print:shadow-none print:border-none">
            <div className="flex items-center justify-between mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-semibold text-lg text-primary-900 dark:text-white">Report Card Preview</h3>
                {!isAdmin() && !isTeacher() ? null : (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${data.reportCard.isPublished ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-gold-50 text-gold-700 dark:bg-gold-500/10 dark:text-gold-400"}`}>
                    {data.reportCard.isPublished ? "Published" : "Draft — awaiting admin review"}
                  </span>
                )}
              </div>
              <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>

            {/* School letterhead — part of the printed document itself */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-primary-900 dark:border-white">
              {school?.logoUrl ? (
                <img src={school.logoUrl} alt="School logo" className="w-16 h-16 object-contain flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-md bg-primary-900 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-8 h-8 text-gold-400" />
                </div>
              )}
              <div>
                <h1 className="font-serif font-bold text-xl text-primary-900 dark:text-white">{school?.schoolName || "School Name"}</h1>
                {school?.motto && <p className="text-xs italic text-gray-500 dark:text-gray-400">{school.motto}</p>}
                {school?.address && <p className="text-xs text-gray-500 dark:text-gray-400">{school.address}</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {[school?.phone, school?.email].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>

            <div className="text-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-serif font-bold text-lg text-primary-900 dark:text-white">Term Report Card</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {data.student?.firstName} {data.student?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {data.student?.admissionNumber} · {data.student?.enrollments?.[0]?.classArm?.fullName}
              </p>
            </div>

            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="py-2">Subject</th>
                  <th className="py-2 text-center">Class Eval. (30%)</th>
                  <th className="py-2 text-center">Home Task (10%)</th>
                  <th className="py-2 text-center">Exams (60%)</th>
                  <th className="py-2 text-center">Total (100%)</th>
                  <th className="py-2 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.results?.map((r: any) => (
                  <tr key={r.id}>
                    <td className="py-2 font-medium text-gray-900 dark:text-white">{r.subject?.name}</td>
                    <td className="py-2 text-center">{r.ca1Score ?? "—"}</td>
                    <td className="py-2 text-center">{r.ca2Score ?? "—"}</td>
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
        )
      ) : (
        <div className="card print:hidden"><EmptyState title="Select a student and term" description="Choose a class, student, session, and term, then generate or view their report card." /></div>
      )}
    </div>
  );
};
