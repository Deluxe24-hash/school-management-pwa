import { useEffect, useState, useCallback } from "react";
import { Plus, ChevronDown, ChevronUp, Users } from "lucide-react";
import { classApi } from "../services/api";
import { Class } from "../types";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";

export const Classes = () => {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [classForm, setClassForm] = useState({ name: "", level: "", description: "" });

  const [armModalOpen, setArmModalOpen] = useState(false);
  const [armForm, setArmForm] = useState({ classId: "", name: "" });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    classApi.getAll()
      .then((res) => setClasses(res.data.data))
      .catch(() => setError("Couldn't load classes."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateClass = async () => {
    if (!classForm.name.trim() || !classForm.level.trim()) {
      setFormError("Name and level are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await classApi.create(classForm);
      const newClass = res.data.data;
      // Auto-create a default arm so the class is immediately usable in
      // student/assignment forms, which assign into a specific arm, not the class itself.
      await classApi.createArm({ classId: newClass.id, name: "A" });
      setClassModalOpen(false);
      setClassForm({ name: "", level: "", description: "" });
      load();
    } catch (err: any) {
      setFormError(err?.message || "Couldn't create class.");
    } finally {
      setSaving(false);
    }
  };

  const openArmModal = (classId: string) => {
    setArmForm({ classId, name: "" });
    setFormError(null);
    setArmModalOpen(true);
  };

  const handleCreateArm = async () => {
    if (!armForm.name.trim()) {
      setFormError("Arm name is required (e.g. A, B, Gold).");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await classApi.createArm(armForm);
      setArmModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Couldn't create class arm.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Classes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Class levels and their arms</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => { setClassForm({ name: "", level: "", description: "" }); setFormError(null); setClassModalOpen(true); }}
            className="btn-primary flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" /> Add Class
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="card"><EmptyState title="Unable to load classes" description={error} /></div>
      ) : classes.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No classes yet"
            description="Add your first class level to get started."
            action={isAdmin() ? <button onClick={() => setClassModalOpen(true)} className="btn-primary">Add Class</button> : undefined}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <div key={c.id} className="card p-0 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <p className="font-serif font-semibold text-primary-900 dark:text-white">{c.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.level} · {c.arms?.length || 0} arm{(c.arms?.length || 0) === 1 ? "" : "s"}</p>
                </div>
                {expanded === c.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expanded === c.id && (
                <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-4">
                  {(!c.arms || c.arms.length === 0) ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No arms yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                      {c.arms.map((a) => (
                        <div key={a.id} className="flex items-center justify-between px-3 py-2.5 rounded-md border border-gray-200 dark:border-gray-800">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{a.fullName}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Users className="w-3.5 h-3.5" /> {a._count?.enrollments ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {isAdmin() && (
                    <button onClick={() => openArmModal(c.id)} className="btn-secondary text-xs flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add Arm
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        title="Add Class"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setClassModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreateClass} disabled={saving} className="btn-primary">{saving ? "Saving..." : "Add Class"}</button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && <div className="px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{formError}</div>}
          <div className="px-3 py-2 rounded-md bg-gold-50 dark:bg-gold-500/10 border border-gold-200 dark:border-gold-500/30 text-xs text-gold-700 dark:text-gold-400">
            A default arm "A" is created automatically — add more arms afterward if the class has multiple streams.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input className="input-field" placeholder="e.g. Primary 4" value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Level</label>
            <input className="input-field" placeholder="e.g. Primary" value={classForm.level} onChange={(e) => setClassForm({ ...classForm, level: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <input className="input-field" value={classForm.description} onChange={(e) => setClassForm({ ...classForm, description: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={armModalOpen}
        onClose={() => setArmModalOpen(false)}
        title="Add Class Arm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setArmModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreateArm} disabled={saving} className="btn-primary">{saving ? "Saving..." : "Add Arm"}</button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && <div className="px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{formError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Arm name</label>
            <input className="input-field" placeholder="e.g. A, B, Gold" value={armForm.name} onChange={(e) => setArmForm({ ...armForm, name: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
};
