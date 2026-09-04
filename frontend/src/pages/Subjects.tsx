import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { subjectApi } from "../services/api";
import { Subject } from "../types";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";

interface SubjectForm { name: string; code: string; category: string; description: string; }
const emptyForm: SubjectForm = { name: "", code: "", category: "", description: "" };

export const Subjects = () => {
  const { isAdmin } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    subjectApi.getAll()
      .then((res) => setSubjects(res.data.data))
      .catch(() => setError("Couldn't load subjects."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = subjects.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormError(null); setModalOpen(true); };
  const openEdit = (s: Subject) => {
    setEditing(s);
    setForm({ name: s.name, code: s.code, category: s.category || "", description: s.description || "" });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      setFormError("Name and code are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) await subjectApi.update(editing.id, form);
      else await subjectApi.create(form);
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Couldn't save subject.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await subjectApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Subjects</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subjects.length} subject{subjects.length === 1 ? "" : "s"} in the curriculum</p>
        </div>
        {isAdmin() && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        )}
      </div>

      <SearchBar placeholder="Search by name or code..." onSearch={setSearch} className="max-w-md" />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="card"><EmptyState title="Unable to load subjects" description={error} /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No subjects yet"
            description="Add your first subject to get started."
            action={isAdmin() ? <button onClick={openCreate} className="btn-primary">Add Subject</button> : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-primary-700 dark:text-primary-300" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{s.code}</p>
                  </div>
                </div>
                {isAdmin() && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
              {s.category && <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{s.category}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Subject" : "Add Subject"}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "Saving..." : editing ? "Save Changes" : "Add Subject"}</button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && <div className="px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{formError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input className="input-field" placeholder="e.g. Mathematics" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Code</label>
            <input className="input-field" placeholder="e.g. MTH" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
            <input className="input-field" placeholder="e.g. Sciences" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete subject"
        message={`Delete ${deleteTarget?.name}? This can't be undone.`}
        confirmText="Delete"
        isLoading={deleting}
      />
    </div>
  );
};
