import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import { timetableApi, classApi, subjectApi, sessionApi, teacherApi } from "../services/api";
import { ClassArm, Subject, Teacher } from "../types";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface EntryForm {
  day: string; startTime: string; endTime: string; room: string;
  teacherId: string; subjectId: string;
}

export const Timetable = () => {
  const { isAdmin } = useAuth();
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classArmId, setClassArmId] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ sessionId: string; termId: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<EntryForm>({ day: "Monday", startTime: "08:00", endTime: "08:40", room: "", teacherId: "", subjectId: "" });
  const [teachersForSubject, setTeachersForSubject] = useState<Teacher[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const load = useCallback(() => {
    if (!classArmId) { setEntries([]); return; }
    setLoading(true);
    timetableApi.getAll({ classArmId }).then((res) => setEntries(res.data.data)).finally(() => setLoading(false));
  }, [classArmId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ day: "Monday", startTime: "08:00", endTime: "08:40", room: "", teacherId: "", subjectId: "" });
    setTeachersForSubject([]);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubjectChange = async (subjectId: string) => {
    setForm((f) => ({ ...f, subjectId, teacherId: "" }));
    if (!subjectId) { setTeachersForSubject([]); return; }
    // Teachers assigned to this subject for this class are the natural choice; fall back to all teachers.
    const res = await teacherApi.getAll({ limit: 200 });
    setTeachersForSubject(res.data.data.teachers);
  };

  const handleSave = async () => {
    if (!form.startTime || !form.endTime || !form.teacherId || !form.subjectId) {
      setFormError("All fields are required.");
      return;
    }
    if (!sessionInfo) { setFormError("No active session/term found."); return; }
    const arm = classArms.find((a) => a.id === classArmId) as any;
    setSaving(true);
    setFormError(null);
    try {
      await timetableApi.create({
        ...form,
        classArmId,
        classId: arm?.class?.id,
        sessionId: sessionInfo.sessionId,
        termId: sessionInfo.termId,
      });
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Couldn't add timetable entry — check for a clashing slot.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await timetableApi.delete(id);
    load();
  };

  const byDay = DAYS.map((day) => ({ day, items: entries.filter((e) => e.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime)) }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Timetable</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Weekly class schedule</p>
        </div>
        {isAdmin() && classArmId && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> Add Period
          </button>
        )}
      </div>

      <div className="card max-w-sm">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class</label>
        <select className="input-field" value={classArmId} onChange={(e) => setClassArmId(e.target.value)}>
          <option value="">Select a class</option>
          {classArms.map((a) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
        </select>
      </div>

      {!classArmId ? (
        <div className="card"><EmptyState title="Select a class" description="Choose a class above to view its timetable." /></div>
      ) : loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {byDay.map(({ day, items }) => (
            <div key={day} className="card">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">{day}</h3>
              {items.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">No periods</p>
              ) : (
                <div className="space-y-2">
                  {items.map((e) => (
                    <div key={e.id} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><Clock className="w-3 h-3" />{e.startTime}–{e.endTime}</span>
                        {isAdmin() && (
                          <button onClick={() => handleDelete(e.id)} className="text-gray-400 hover:text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white mt-1">{e.subject?.name}</p>
                      <p className="text-gray-500 dark:text-gray-400">{e.teacher?.firstName} {e.teacher?.lastName}{e.room ? ` · ${e.room}` : ""}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Timetable Period"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "Saving..." : "Add Period"}</button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && <div className="px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{formError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Day</label>
            <select className="input-field" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start time</label>
              <input type="time" className="input-field" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">End time</label>
              <input type="time" className="input-field" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
            <select className="input-field" value={form.subjectId} onChange={(e) => handleSubjectChange(e.target.value)}>
              <option value="">Select a subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Teacher</label>
            <select className="input-field" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} disabled={!form.subjectId}>
              <option value="">Select a teacher</option>
              {teachersForSubject.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Room (optional)</label>
            <input className="input-field" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
};
