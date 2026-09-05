import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, UserCheck } from "lucide-react";
import { parentApi, studentApi } from "../services/api";
import { Parent } from "../types";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";

interface ParentForm {
  firstName: string; lastName: string; phone: string; email: string;
  address: string; occupation: string; relationship: string; childIds: string[];
}
const emptyForm: ParentForm = {
  firstName: "", lastName: "", phone: "", email: "", address: "", occupation: "", relationship: "", childIds: [],
};

export const Parents = () => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Parent | null>(null);
  const [form, setForm] = useState<ParentForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<any[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<Parent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    parentApi.getAll({ search: search || undefined, limit: 50 })
      .then((res) => { setParents(res.data.data.parents); setTotal(res.data.data.total); })
      .catch(() => setError("Couldn't load parents."))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSelectedChildren([]);
    setStudentQuery("");
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (p: Parent) => {
    setEditing(p);
    setForm({
      firstName: p.firstName, lastName: p.lastName, phone: p.phone,
      email: (p as any).user?.email && !(p as any).user.email.endsWith("@parents.local") ? (p as any).user.email : "",
      address: p.address || "", occupation: p.occupation || "", relationship: p.relationship || "",
      childIds: (p.children || []).map((c: any) => c.id),
    });
    setSelectedChildren(p.children || []);
    setStudentQuery("");
    setFormError(null);
    setModalOpen(true);
  };

  const searchStudents = async (q: string) => {
    setStudentQuery(q);
    if (q.length < 2) { setStudentResults([]); return; }
    const res = await studentApi.getAll({ search: q, limit: 10 });
    setStudentResults(res.data.data.students);
  };

  const addChild = (student: any) => {
    if (!selectedChildren.some((c) => c.id === student.id)) {
      const next = [...selectedChildren, student];
      setSelectedChildren(next);
      setForm((f) => ({ ...f, childIds: next.map((c) => c.id) }));
    }
    setStudentQuery("");
    setStudentResults([]);
  };

  const removeChild = (id: string) => {
    const next = selectedChildren.filter((c) => c.id !== id);
    setSelectedChildren(next);
    setForm((f) => ({ ...f, childIds: next.map((c) => c.id) }));
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setFormError("First name, last name, and phone are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await parentApi.update(editing.id, form);
      } else {
        await parentApi.create(form);
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Couldn't save parent.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await parentApi.delete(deleteTarget.id);
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
          <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Parents</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} parent{total === 1 ? "" : "s"} registered</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Parent
        </button>
      </div>

      <SearchBar placeholder="Search by name or phone..." onSearch={setSearch} className="max-w-md" />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <div className="p-6"><EmptyState title="Unable to load parents" description={error} /></div>
        ) : parents.length === 0 ? (
          <EmptyState
            title="No parents yet"
            description="Add a parent and link their children to get started."
            action={<button onClick={openCreate} className="btn-primary">Add Parent</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Parent</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Children</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {parents.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                          <UserCheck className="w-4 h-4 text-primary-700 dark:text-primary-300" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{p.firstName} {p.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.phone}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {p.children?.length > 0 ? p.children.map((c: any) => `${c.firstName} ${c.lastName}`).join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600" title="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Parent" : "Add Parent"}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Parent"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {formError}
            </div>
          )}
          {!editing && (
            <div className="px-3 py-2 rounded-md bg-gold-50 dark:bg-gold-500/10 border border-gold-200 dark:border-gold-500/30 text-xs text-gold-700 dark:text-gold-400">
              A portal login is created automatically (temporary password: Parent@123) — using the email below, or a generated one from their phone if left blank.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">First name</label>
              <input className="input-field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Last name</label>
              <input className="input-field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email (optional)</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Relationship</label>
              <input className="input-field" placeholder="e.g. Mother, Father, Guardian" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Occupation</label>
              <input className="input-field" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
              <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Children</label>
            {selectedChildren.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedChildren.map((c: any) => (
                  <span key={c.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium">
                    {c.firstName} {c.lastName}
                    <button onClick={() => removeChild(c.id)} className="hover:text-red-600">×</button>
                  </span>
                ))}
              </div>
            )}
            <input className="input-field" placeholder="Search students by name..." value={studentQuery} onChange={(e) => searchStudents(e.target.value)} />
            {studentResults.length > 0 && (
              <div className="mt-1.5 border border-gray-200 dark:border-gray-800 rounded-md divide-y divide-gray-100 dark:divide-gray-800 max-h-40 overflow-y-auto">
                {studentResults.map((s) => (
                  <button key={s.id} onClick={() => addChild(s)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5">
                    {s.firstName} {s.lastName} · {s.admissionNumber}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove parent"
        message={`Remove ${deleteTarget?.firstName} ${deleteTarget?.lastName}? Their portal login will also be deleted, and any linked children will become unassigned.`}
        confirmText="Remove"
        isLoading={deleting}
      />
    </div>
  );
};
