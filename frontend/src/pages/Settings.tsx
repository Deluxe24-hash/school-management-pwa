import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { settingApi } from "../services/api";
import { LoadingSpinner } from "../components/LoadingSpinner";

export const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    schoolName: "", motto: "", address: "", phone: "", email: "", website: "",
    principalName: "", headTeacherName: "", caWeight: 40, examWeight: 60,
    attendanceThreshold: 75, currency: "NGN",
  });

  useEffect(() => {
    settingApi.get()
      .then((res) => {
        const s = res.data.data;
        if (s) setForm((f) => ({ ...f, ...s }));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await settingApi.update(form);
      setSaveMsg("Settings saved.");
    } catch (err: any) {
      setSaveMsg(err?.message || "Couldn't save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">School Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">School identity and grading configuration</p>
      </div>

      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">School Identity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">School name</label>
            <input className="input-field" value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Motto</label>
            <input className="input-field" value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
            <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
            <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Principal</label>
            <input className="input-field" value={form.principalName} onChange={(e) => setForm({ ...form, principalName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Head teacher</label>
            <input className="input-field" value={form.headTeacherName} onChange={(e) => setForm({ ...form, headTeacherName: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Grading</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">CA weight (%)</label>
            <input type="number" className="input-field" value={form.caWeight} onChange={(e) => setForm({ ...form, caWeight: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Exam weight (%)</label>
            <input type="number" className="input-field" value={form.examWeight} onChange={(e) => setForm({ ...form, examWeight: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Attendance threshold (%)</label>
            <input type="number" className="input-field" value={form.attendanceThreshold} onChange={(e) => setForm({ ...form, attendanceThreshold: Number(e.target.value) })} />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">CA and exam weight should add up to 100%.</p>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Settings"}
        </button>
        {saveMsg && <p className="text-sm text-gray-600 dark:text-gray-300">{saveMsg}</p>}
      </div>
    </div>
  );
};
