import { useEffect, useState, useCallback } from "react";
import { Plus, Users } from "lucide-react";
import { teacherApi } from "../services/api";
import { Teacher } from "../types";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/Modal";

interface TeacherForm {
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  email: string;
  phone: string;
  qualification: string;
  department: string;
  dateEmployed: string;
}

const emptyForm: TeacherForm = {
  firstName: "", lastName: "", gender: "MALE", email: "", phone: "",
  qualification: "", department: "", dateEmployed: "",
};

export const Teachers = () => {
  const { isAdmin } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TeacherForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdNotice, setCreatedNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    teacherApi
      .getAll({ search: search || undefined, limit: 50 })
      .then((res) => {
        setTeachers(res.data.data.teachers);
        setTotal(res.data.data.total);
      })
      .catch(() => setError("Couldn't load teachers."))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError(null);
    setCreatedNotice(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setFormError("First name, last name, and email are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await teacherApi.create(form);
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Couldn't add teacher.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Teachers</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} teacher{total === 1 ? "" : "s"} on staff</p>
        </div>
        {isAdmin() && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        )}
      </div>

      <SearchBar placeholder="Search by name or teacher ID..." onSearch={setSearch} className="max-w-md" />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <div className="p-6"><EmptyState title="Unable to load teachers" description={error} /></div>
        ) : teachers.length === 0 ? (
          <EmptyState
            title="No teachers yet"
            description="Add your first teacher to get started."
            action={isAdmin() ? <button onClick={openCreate} className="btn-primary">Add Teacher</button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Teacher</th>
                  <th className="px-4 py-3 font-medium">Teacher ID</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Classes</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold-100 dark:bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{t.firstName} {t.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.teacherId}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.department || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.classArms?.length || 0}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{(t as any).user?.email || t.email || "—"}</td>
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
        title="Add Teacher"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Add Teacher"}
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
          {createdNotice && (
            <div className="px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400">
              {createdNotice}
            </div>
          )}
          <div className="px-3 py-2 rounded-md bg-gold-50 dark:bg-gold-500/10 border border-gold-200 dark:border-gold-500/30 text-xs text-gold-700 dark:text-gold-400">
            A portal account is created automatically with a temporary password (Teacher@123) — ask them to change it after first login.
          </div>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Gender</label>
              <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department</label>
              <input className="input-field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Qualification</label>
              <input className="input-field" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date employed</label>
              <input type="date" className="input-field" value={form.dateEmployed} onChange={(e) => setForm({ ...form, dateEmployed: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
