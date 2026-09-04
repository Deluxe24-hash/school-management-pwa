import { useEffect, useState } from "react";
import { Save, Plus, Trash2, GraduationCap } from "lucide-react";
import { settingApi } from "../services/api";
import { LoadingSpinner } from "../components/LoadingSpinner";

interface GradeRow { grade: string; min: string; max: string; remark: string; gp: string; }

const defaultGrading: GradeRow[] = [
  { grade: "A", min: "70", max: "100", remark: "Excellent", gp: "5" },
  { grade: "B", min: "60", max: "69", remark: "Very Good", gp: "4" },
  { grade: "C", min: "50", max: "59", remark: "Good", gp: "3" },
  { grade: "D", min: "40", max: "49", remark: "Pass", gp: "2" },
  { grade: "F", min: "0", max: "39", remark: "Fail", gp: "0" },
];

export const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    schoolName: "", motto: "", address: "", phone: "", email: "", website: "", logoUrl: "",
    principalName: "", headTeacherName: "", caWeight: 40, examWeight: 60,
    attendanceThreshold: 75, currency: "NGN",
  });
  const [grading, setGrading] = useState<GradeRow[]>(defaultGrading);

  useEffect(() => {
    settingApi.get()
      .then((res) => {
        const s = res.data.data;
        if (s) {
          setForm((f) => ({ ...f, ...s }));
          if (Array.isArray(s.gradingSystem) && s.gradingSystem.length > 0) {
            setGrading(s.gradingSystem.map((g: any) => ({
              grade: g.grade ?? "", min: String(g.min ?? ""), max: String(g.max ?? ""),
              remark: g.remark ?? "", gp: String(g.gp ?? ""),
            })));
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const updateRow = (i: number, patch: Partial<GradeRow>) => {
    setGrading((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const addRow = () => setGrading((rows) => [...rows, { grade: "", min: "", max: "", remark: "", gp: "" }]);
  const removeRow = (i: number) => setGrading((rows) => rows.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const gradingSystem = grading
        .filter((g) => g.grade.trim())
        .map((g) => ({ grade: g.grade, min: Number(g.min) || 0, max: Number(g.max) || 0, remark: g.remark, gp: Number(g.gp) || 0 }));
      await settingApi.update({ ...form, gradingSystem });
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-primary-950/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="School logo" className="w-full h-full object-contain" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
              ) : (
                <GraduationCap className="w-6 h-6 text-gray-300" />
              )}
            </div>
            <input
              className="input-field flex-1"
              placeholder="https://example.com/logo.png"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Paste a hosted image URL — direct file upload isn't set up yet.</p>
        </div>

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

        <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grade bands</label>
            <button onClick={addRow} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
              <Plus className="w-3.5 h-3.5" /> Add grade
            </button>
          </div>
          <div className="space-y-2">
            {grading.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_2fr_1fr_auto] gap-2 items-center">
                <input className="input-field py-1.5 text-sm" placeholder="Grade" value={row.grade} onChange={(e) => updateRow(i, { grade: e.target.value })} />
                <input className="input-field py-1.5 text-sm" placeholder="Min" type="number" value={row.min} onChange={(e) => updateRow(i, { min: e.target.value })} />
                <input className="input-field py-1.5 text-sm" placeholder="Max" type="number" value={row.max} onChange={(e) => updateRow(i, { max: e.target.value })} />
                <input className="input-field py-1.5 text-sm" placeholder="Remark" value={row.remark} onChange={(e) => updateRow(i, { remark: e.target.value })} />
                <input className="input-field py-1.5 text-sm" placeholder="GP" type="number" value={row.gp} onChange={(e) => updateRow(i, { gp: e.target.value })} />
                <button onClick={() => removeRow(i)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
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
