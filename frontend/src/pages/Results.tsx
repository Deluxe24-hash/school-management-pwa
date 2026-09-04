import { useEffect, useState, useCallback, useMemo } from "react";
import { Save } from "lucide-react";
import { resultApi, classApi, subjectApi, studentApi, sessionApi } from "../services/api";
import { ClassArm, Subject, Student } from "../types";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";

interface ScoreEntry { ca1: string; ca2: string; project: string; exam: string; existingId?: string; grade?: string; locked?: boolean; }

export const Results = () => {
  const { user, isAdmin } = useAuth();
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classArmId, setClassArmId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreEntry>>({});
  const [sessionInfo, setSessionInfo] = useState<{ sessionId: string; termId: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // For non-admin teachers: my own assigned class+subject pairs (subject teacher),
  // plus every subject in classes I'm the form teacher of (form teachers can enter any subject there).
  const myClassSubjects = user?.teacher?.classSubjects || [];
  const myFormClassIds = new Set((user?.teacher?.classArms || []).map((a: any) => a.class?.id).filter(Boolean));

  useEffect(() => {
    classApi.getAll().then((res) => {
      const arms: ClassArm[] = res.data.data.flatMap((c: any) => c.arms.map((a: any) => ({ ...a, class: c })));
      setClassArms(arms);
    }).catch(() => {});
    subjectApi.getAll().then((res) => setSubjects(res.data.data)).catch(() => {});
    sessionApi.getCurrent().then((res) => {
      const current = res.data.data;
      const currentTerm = current.terms?.find((t: any) => t.isCurrent) || current.terms?.[0];
      if (currentTerm) setSessionInfo({ sessionId: current.id, termId: currentTerm.id });
    }).catch(() => {});
  }, []);

  // Classes this teacher can pick from: admins see all; teachers see classes where
  // they're either the form teacher or teach at least one subject.
  const availableClassArms = useMemo(() => {
    if (isAdmin()) return classArms;
    const allowedClassIds = new Set([
      ...myFormClassIds,
      ...myClassSubjects.map((cs: any) => cs.class?.id).filter(Boolean),
    ]);
    return classArms.filter((a: any) => allowedClassIds.has(a.class?.id));
  }, [classArms, isAdmin, myFormClassIds, myClassSubjects]);

  // Subjects available for the selected class: admins/form-teachers see every subject
  // in that class; plain subject teachers only see subjects they're assigned to there.
  const availableSubjects = useMemo(() => {
    if (!classArmId) return [];
    const arm = classArms.find((a) => a.id === classArmId) as any;
    if (!arm) return [];
    if (isAdmin() || myFormClassIds.has(arm.class?.id)) return subjects;
    const mySubjectIds = new Set(
      myClassSubjects.filter((cs: any) => cs.class?.id === arm.class?.id).map((cs: any) => cs.subject?.id)
    );
    return subjects.filter((s) => mySubjectIds.has(s.id));
  }, [classArmId, classArms, subjects, isAdmin, myFormClassIds, myClassSubjects]);

  const load = useCallback(() => {
    if (!classArmId || !subjectId || !sessionInfo) { setStudents([]); return; }
    setLoading(true);
    setError(null);
    Promise.all([
      studentApi.getAll({ classArmId, limit: 200 }),
      resultApi.getAll({ classArmId, subjectId, sessionId: sessionInfo.sessionId, termId: sessionInfo.termId, limit: 200 }),
    ])
      .then(([studentsRes, resultsRes]) => {
        const list: Student[] = studentsRes.data.data.students;
        setStudents(list);
        const existing = resultsRes.data.data.results;
        const map: Record<string, ScoreEntry> = {};
        list.forEach((s) => {
          const r = existing.find((x: any) => x.studentId === s.id);
          map[s.id] = r
            ? {
                ca1: r.ca1Score?.toString() ?? "",
                ca2: r.ca2Score?.toString() ?? "",
                project: r.projectScore?.toString() ?? "",
                exam: r.examScore?.toString() ?? "",
                existingId: r.id,
                grade: r.grade,
                locked: r.isLocked,
              }
            : { ca1: "", ca2: "", project: "", exam: "" };
        });
        setScores(map);
      })
      .catch(() => setError("Couldn't load results."))
      .finally(() => setLoading(false));
  }, [classArmId, subjectId, sessionInfo]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!classArmId || !subjectId || !sessionInfo) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const entries = students.filter((s) => {
        const e = scores[s.id];
        return e && (e.ca1 !== "" || e.ca2 !== "" || e.project !== "" || e.exam !== "");
      });
      for (const s of entries) {
        const entry = scores[s.id];
        if (entry.locked) continue;
        await resultApi.enter({
          studentId: s.id,
          subjectId,
          classArmId,
          sessionId: sessionInfo.sessionId,
          termId: sessionInfo.termId,
          ca1Score: entry.ca1 === "" ? undefined : Number(entry.ca1),
          ca2Score: entry.ca2 === "" ? undefined : Number(entry.ca2),
          projectScore: entry.project === "" ? undefined : Number(entry.project),
          examScore: entry.exam === "" ? undefined : Number(entry.exam),
        });
      }
      setSaveMsg("Scores saved.");
      load();
    } catch (err: any) {
      setSaveMsg(err?.message || "Couldn't save scores.");
    } finally {
      setSaving(false);
    }
  };

  const noAccessAtAll = !isAdmin() && myFormClassIds.size === 0 && myClassSubjects.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Results</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter CA1, CA2, Project, and Exam scores</p>
      </div>

      {noAccessAtAll ? (
        <div className="card"><EmptyState title="No subjects assigned" description="You haven't been assigned to teach any subject yet — ask an admin to set this up." /></div>
      ) : (
        <>
          <div className="card flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class</label>
              <select className="input-field" value={classArmId} onChange={(e) => { setClassArmId(e.target.value); setSubjectId(""); }}>
                <option value="">Select a class</option>
                {availableClassArms.map((a) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
              <select className="input-field" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!classArmId}>
                <option value="">Select a subject</option>
                {availableSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {!classArmId || !subjectId ? (
            <div className="card"><EmptyState title="Select a class and subject" description="Choose both above to enter scores." /></div>
          ) : loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : error ? (
            <div className="card"><EmptyState title="Unable to load results" description={error} /></div>
          ) : students.length === 0 ? (
            <div className="card"><EmptyState title="No students in this class" description="Enroll students into this class arm first." /></div>
          ) : (
            <>
              <div className="card p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-3 py-3 font-medium w-20">CA1</th>
                      <th className="px-3 py-3 font-medium w-20">CA2</th>
                      <th className="px-3 py-3 font-medium w-20">Project</th>
                      <th className="px-3 py-3 font-medium w-20">Exam</th>
                      <th className="px-3 py-3 font-medium w-16">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {students.map((s) => {
                      const entry = scores[s.id] || { ca1: "", ca2: "", project: "", exam: "" };
                      return (
                        <tr key={s.id}>
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-gray-900 dark:text-white">{s.firstName} {s.lastName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{s.admissionNumber}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <input type="number" min={0} className="input-field py-1.5" value={entry.ca1} disabled={entry.locked}
                              onChange={(e) => setScores({ ...scores, [s.id]: { ...entry, ca1: e.target.value } })} />
                          </td>
                          <td className="px-3 py-2.5">
                            <input type="number" min={0} className="input-field py-1.5" value={entry.ca2} disabled={entry.locked}
                              onChange={(e) => setScores({ ...scores, [s.id]: { ...entry, ca2: e.target.value } })} />
                          </td>
                          <td className="px-3 py-2.5">
                            <input type="number" min={0} className="input-field py-1.5" value={entry.project} disabled={entry.locked}
                              onChange={(e) => setScores({ ...scores, [s.id]: { ...entry, project: e.target.value } })} />
                          </td>
                          <td className="px-3 py-2.5">
                            <input type="number" min={0} max={60} className="input-field py-1.5" value={entry.exam} disabled={entry.locked}
                              onChange={(e) => setScores({ ...scores, [s.id]: { ...entry, exam: e.target.value } })} />
                          </td>
                          <td className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-300">{entry.grade || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-4">
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Scores"}
                </button>
                {saveMsg && <p className="text-sm text-gray-600 dark:text-gray-300">{saveMsg}</p>}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
