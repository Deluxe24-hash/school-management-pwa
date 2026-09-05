import { useEffect, useState, useCallback } from "react";
import { Plus, Users, Pencil, Trash2, Link2 } from "lucide-react";
import { teacherApi, classApi, subjectApi } from "../services/api";
import { Teacher, Class, Subject } from "../types";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";

interface TeacherForm {
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  email: string;
  phone: string;
  qualification: string;
  department: string;
  dateEmployed: string;
  homeroomClassArmId: string;
}

const emptyForm: TeacherForm = {
  firstName: "", lastName: "", gender: "MALE", email: "", phone: "",
  qualification: "", department: "", dateEmployed: "", homeroomClassArmId: "",
};

export const Teachers = () => {
  const { isAdmin } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classArms, setClassArms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<TeacherForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTeacher, setAssignTeacher] = useState<Teacher | null>(null);
  const [assignForm, setAssignForm] = useState({ classId: "", subjectId: "" });
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

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

  useEffect(() => {
    classApi.getAll().then((res) => {
      setClasses(res.data.data);
      const arms = res.data.data.flatMap((c: any) => c.arms.map((a: any) => ({ ...a, class: c })));
      setClassArms(arms);
    }).catch(() => {});
    subjectApi.getAll().then((res) => setSubjects(res.data.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (t: Teacher) => {
    const currentHomeroom = classArms.find((a: any) => a.classTeacherId === t.id);
    setEditing(t);
    setForm({
      firstName: t.firstName,
      lastName: t.lastName,
      gender: t.gender as "MALE" | "FEMALE" | "OTHER",
      email: (t as any).user?.email || t.email || "",
      phone: t.phone || "",
      qualification: t.qualification || "",
      department: t.department || "",
      homeroomClassArmId: currentHomeroom?.id || "",
      dateEmployed: t.dateEmployed ? t.dateEmployed.slice(0, 10) : "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || (!editing && !form.email.trim())) {
      setFormError("First name, last name, and email are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      let teacherId = editing?.id;
      const { homeroomClassArmId, ...teacherFields } = form;
      if (editing) {
        const { email, ...rest } = teacherFields;
        await teacherApi.update(editing.id, rest);
      } else {
        const res = await teacherApi.create(teacherFields);
        teacherId = res.data.data.id;
      }

      // Sync homeroom (form teacher) assignment: clear any previous arm this teacher
      // was set as form teacher of, then set the newly selected one (if any).
      if (teacherId) {
        const oldArm = classArms.find((a: any) => a.classTeacherId === teacherId && a.id !== homeroomClassArmId);
        if (oldArm) await classApi.updateArm(oldArm.id, { classTeacherId: null });
        if (homeroomClassArmId) await classApi.updateArm(homeroomClassArmId, { classTeacherId: teacherId });
      }

      const res = await classApi.getAll();
      setClasses(res.data.data);
      setClassArms(res.data.data.flatMap((c: any) => c.arms.map((a: any) => ({ ...a, class: c }))));

      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Couldn't save teacher.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await teacherApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const openAssign = (t: Teacher) => {
    setAssignTeacher(t);
    setAssignForm({ classId: "", subjectId: "" });
    setAssignMsg(null);
    setAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (!assignTeacher || !assignForm.classId || !assignForm.subjectId) {
      setAssignMsg("Select both a class and a subject.");
      return;
    }
    setAssigning(true);
    setAssignMsg(null);
    try {
      await teacherApi.assignSubject({
        teacherId: assignTeacher.id,
        classId: assignForm.classId,
        subjectId: assignForm.subjectId,
      });
      setAssignMsg("Assigned. This teacher can now grade this subject for this class.");
      load();
    } catch (err: any) {
      setAssignMsg(err?.message || "Couldn't assign — this pairing may already exist.");
    } finally {
      setAssigning(false);
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
                  {isAdmin() && <th className="px-4 py-3 font-medium text-right">Actions</th>}
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
                    {isAdmin() && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openAssign(t)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500" title="Assign class & subject">
                            <Link2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600" title="Remove">
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Teacher" : "Add Teacher"}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Teacher"}
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
              A portal account is created automatically with a temporary password (Teacher@123) — ask them to change it after first login.
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Gender</label>
              <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editing} />
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
            <div className="sm:col-span-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Form Teacher Of (Homeroom Class)</label>
              <select className="input-field" value={form.homeroomClassArmId} onChange={(e) => setForm({ ...form, homeroomClassArmId: e.target.value })}>
                <option value="">None</option>
                {classArms.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName}{a.classTeacherId && a.classTeacherId !== editing?.id ? " (already has a form teacher)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Only the form teacher of a class can mark its daily attendance.</p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Class & Subject — ${assignTeacher?.firstName} ${assignTeacher?.lastName}`}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setAssignModalOpen(false)} className="btn-secondary">Close</button>
            <button onClick={handleAssign} disabled={assigning} className="btn-primary">{assigning ? "Assigning..." : "Assign"}</button>
          </div>
        }
      >
        <div className="space-y-4">
          {assignMsg && <p className="text-sm text-gray-600 dark:text-gray-300">{assignMsg}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class</label>
            <select className="input-field" value={assignForm.classId} onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}>
              <option value="">Select a class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
            <select className="input-field" value={assignForm.subjectId} onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}>
              <option value="">Select a subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Once assigned, this teacher will see this class + subject when marking attendance and entering results.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove teacher"
        message={`Remove ${deleteTarget?.firstName} ${deleteTarget?.lastName}? Their portal login will also be deleted.`}
        confirmText="Remove"
        isLoading={deleting}
      />
    </div>
  );
};
