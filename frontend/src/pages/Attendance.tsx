import { useEffect, useState, useCallback } from "react";
import { Check, X, Clock, FileWarning } from "lucide-react";
import { attendanceApi, classApi, studentApi, sessionApi } from "../services/api";
import { ClassArm, Student } from "../types";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { cn } from "../utils/helpers";

type Status = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

const statusConfig: Record<Status, { label: string; icon: any; classes: string }> = {
  PRESENT: { label: "Present", icon: Check, classes: "bg-emerald-600 text-white border-emerald-600" },
  ABSENT: { label: "Absent", icon: X, classes: "bg-red-700 text-white border-red-700" },
  LATE: { label: "Late", icon: Clock, classes: "bg-gold-500 text-white border-gold-500" },
  EXCUSED: { label: "Excused", icon: FileWarning, classes: "bg-primary-600 text-white border-primary-600" },
};

export const Attendance = () => {
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [classArmId, setClassArmId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ sessionId: string; termId: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    classApi.getAll().then((res) => {
      const arms: ClassArm[] = res.data.data.flatMap((c: any) => c.arms.map((a: any) => ({ ...a, class: c })));
      setClassArms(arms);
    }).catch(() => {});

    sessionApi.getCurrent().then((res) => {
      const current = res.data.data;
      const currentTerm = current.terms?.find((t: any) => t.isCurrent) || current.terms?.[0];
      if (currentTerm) setSessionInfo({ sessionId: current.id, termId: currentTerm.id });
    }).catch(() => {});
  }, []);

  const loadStudents = useCallback(() => {
    if (!classArmId) { setStudents([]); return; }
    setLoadingStudents(true);
    setError(null);
    studentApi.getAll({ classArmId, limit: 200 })
      .then((res) => {
        const list: Student[] = res.data.data.students;
        setStudents(list);
        setMarks(Object.fromEntries(list.map((s) => [s.id, "PRESENT" as Status])));
      })
      .catch(() => setError("Couldn't load students for this class."))
      .finally(() => setLoadingStudents(false));
  }, [classArmId]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const handleSubmit = async () => {
    if (!classArmId || !sessionInfo) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await attendanceApi.mark({
        classArmId,
        date,
        sessionId: sessionInfo.sessionId,
        termId: sessionInfo.termId,
        records: students.map((s) => ({ studentId: s.id, status: marks[s.id] || "PRESENT" })),
      });
      setSaveMsg("Attendance saved.");
    } catch (err: any) {
      setSaveMsg(err?.message || "Couldn't save attendance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Attendance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mark daily attendance for a class</p>
      </div>

      <div className="card flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class</label>
          <select className="input-field" value={classArmId} onChange={(e) => setClassArmId(e.target.value)}>
            <option value="">Select a class</option>
            {classArms.map((a) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
          </select>
        </div>
        <div className="sm:w-48">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
          <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {!classArmId ? (
        <div className="card"><EmptyState title="Select a class" description="Choose a class above to mark attendance." /></div>
      ) : loadingStudents ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="card"><EmptyState title="Unable to load students" description={error} /></div>
      ) : students.length === 0 ? (
        <div className="card"><EmptyState title="No students in this class" description="Enroll students into this class arm first." /></div>
      ) : !sessionInfo ? (
        <div className="card"><EmptyState title="No active term" description="Set an active academic session and term before marking attendance." /></div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {students.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.admissionNumber}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {(Object.keys(statusConfig) as Status[]).map((st) => {
                      const cfg = statusConfig[st];
                      const active = marks[s.id] === st;
                      return (
                        <button
                          key={st}
                          onClick={() => setMarks({ ...marks, [s.id]: st })}
                          className={cn(
                            "w-8 h-8 rounded-md border flex items-center justify-center transition-colors",
                            active ? cfg.classes : "border-gray-300 dark:border-gray-700 text-gray-400 hover:border-gray-400"
                          )}
                          title={cfg.label}
                        >
                          <cfg.icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save Attendance"}
            </button>
            {saveMsg && <p className="text-sm text-gray-600 dark:text-gray-300">{saveMsg}</p>}
          </div>
        </>
      )}
    </div>
  );
};
