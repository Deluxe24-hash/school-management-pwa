import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { studentApi, classApi } from "../services/api";
import { Student, ClassArm } from "../types";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { getStatusColor } from "../utils/helpers";

interface StudentForm {
  firstName: string;
  lastName: string;
  middleName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
  phone: string;
  address: string;
  email: string;
  previousSchool: string;
  classArmId: string;
}

const emptyForm: StudentForm = {
  firstName: "", lastName: "", middleName: "", gender: "MALE", dateOfBirth: "",
  phone: "", address: "", email: "", previousSchool: "", classArmId: "",
};

export const Students = () => {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    studentApi
      .getAll({ search: search || undefined, page, limit })
      .then((res) => {
        setStudents(res.data.data.students);
        setTotal(res.data.data.total);
      })
      .catch(() => setError("Couldn't load students."))
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    classApi.getAll().then((res) => {
      const arms: ClassArm[] = res.data.data.flatMap((c: any) =>
        c.arms.map((a: any) => ({ ...a, class: c }))
      );
      setClassArms(arms);
    }).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setForm({
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName || "",
      gender: student.gender,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : "",
      phone: student.phone || "",
      address: student.address || "",
      email: "",
      previousSchool: student.previousSchool || "",
      classArmId: student.enrollments?.[0]?.classArm?.id || "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError("First and last name are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload: any = { ...form };
      if (!payload.email) delete payload.email;
      if (!payload.dateOfBirth) delete payload.dateOfBirth;
      if (!payload.classArmId) delete payload.classArmId;

      if (editing) {
        await studentApi.update(editing.id, payload);
      } else {
        await studentApi.create(payload);
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Couldn't save student.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await studentApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Students</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} student{total === 1 ? "" : "s"} enrolled
          </p>
        </div>
        {isAdmin() && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> Add Student
          </button>
        )}
      </div>

      <SearchBar
        placeholder="Search by name or admission number..."
        onSearch={(q) => { setSearch(q); setPage(1); }}
        className="max-w-md"
      />

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <div className="p-6"><EmptyState title="Unable to load students" description={error} /></div>
        ) : students.length === 0 ? (
          <EmptyState
            title="No students yet"
            description="Add your first student to get started."
            action={isAdmin() ? <button onClick={openCreate} className="btn-primary">Add Student</button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Admission No.</th>
                  <th className="px-4 py-3 font-medium">Class</th>
                  <th className="px-4 py-3 font-medium">Gender</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {isAdmin() && <th className="px-4 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-4 h-4 text-primary-700 dark:text-primary-300" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {s.firstName} {s.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.admissionNumber}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {s.enrollments?.[0]?.classArm?.fullName || "Unassigned"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">{s.gender.toLowerCase()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(s.academicStatus)}`}>
                        {s.academicStatus}
                      </span>
                    </td>
                    {isAdmin() && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400 px-2">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Student" : "Add Student"}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Student"}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Middle name</label>
              <input className="input-field" value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date of birth</label>
              <input type="date" className="input-field" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class</label>
              <select className="input-field" value={form.classArmId} onChange={(e) => setForm({ ...form, classArmId: e.target.value })}>
                <option value="">Unassigned</option>
                {classArms.map((a) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Portal email {!editing && <span className="text-gray-400 font-normal">(optional — a login is created either way)</span>}
              </label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editing} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
              <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Previous school</label>
              <input className="input-field" value={form.previousSchool} onChange={(e) => setForm({ ...form, previousSchool: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove student"
        message={`Remove ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This can't be undone.`}
        confirmText="Remove"
        isLoading={deleting}
      />
    </div>
  );
};
