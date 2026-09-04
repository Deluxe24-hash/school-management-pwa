import { useEffect, useState, useCallback } from "react";
import { Plus, ClipboardList } from "lucide-react";
import { assignmentApi, classApi, subjectApi, sessionApi } from "../services/api";
import { Assignment, ClassArm, Subject } from "../types";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { formatDate } from "../utils/helpers";

interface AssignmentForm {
  title: string; description: string; type: string; maxScore: string;
  dueDate: string; subjectId: string; classArmId: string;
}
const emptyForm: AssignmentForm = { title: "", description: "", type: "HOMEWORK", maxScore: "100", dueDate: "", subjectId: "", classArmId: "" };

export const Assignments = () => {
  const { isTeacher } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{ sessionId: string; termId: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AssignmentForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    assignmentApi.getAll({ limit: 50 })
      .then((res) => setAssignments(res.data.data.assignments))
      .catch(() => setError("Couldn't load assignments."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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

  const openCreate = () => { setForm(emptyForm); setFormError(null); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.subjectId || !form.classArmId || !form.dueDate) {
      setFormError("Title, subject, class, and due date are required.");
      return;
    }
    if (!sessionInfo) {
      setFormError("No active academic session/term found.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await assignmentApi.create({
        ...form,
        maxScore: Number(form.maxScore),
        sessionId: sessionInfo.sessionId,
        termId: sessionInfo.termId,
      });
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Couldn't create assignment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Assignments</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Homework, classwork, and projects</p>
        </div>
        {isTeacher() && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> New Assignment
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="card"><EmptyState title="Unable to load assignments" description={error} /></div>
      ) : assignments.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No assignments yet"
            description="Create your first assignment for a class."
            action={isTeacher() ? <button onClick={openCreate} className="btn-primary">New Assignment</button> : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assignments.map((a) => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-4 h-4 text-primary-700 dark:text-primary-300" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{a.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{a.subject?.name} · {a.type}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Due {formatDate(a.dueDate)}</span>
              </div>
              {a.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{a.description}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{a._count?.submissions ?? 0} submission{(a._count?.submissions ?? 0) === 1 ? "" : "s"} · Max score {a.maxScore}</p>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Assignment"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "Creating..." : "Create Assignment"}</button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && <div className="px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{formError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class</label>
              <select className="input-field" value={form.classArmId} onChange={(e) => setForm({ ...form, classArmId: e.target.value })}>
                <option value="">Select</option>
                {classArms.map((a) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
              <select className="input-field" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                <option value="">Select</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
              <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="HOMEWORK">Homework</option>
                <option value="CLASSWORK">Classwork</option>
                <option value="PROJECT">Project</option>
                <option value="PRACTICAL">Practical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Max score</label>
              <input type="number" className="input-field" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Due date</label>
              <input type="date" className="input-field" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
