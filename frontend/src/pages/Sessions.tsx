import { useEffect, useState, useCallback } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { sessionApi } from "../services/api";
import { AcademicSession } from "../types";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { formatDate } from "../utils/helpers";

export const Sessions = () => {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    sessionApi.getAll()
      .then((res) => setSessions(res.data.data))
      .catch(() => setError("Couldn't load sessions."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      setFormError("All fields are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await sessionApi.create(form);
      setModalOpen(false);
      setForm({ name: "", startDate: "", endDate: "" });
      load();
    } catch (err: any) {
      setFormError(err?.message || "Couldn't create session.");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id: string) => {
    setActivating(id);
    try {
      await sessionApi.setCurrent(id);
      load();
    } finally {
      setActivating(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Academic Sessions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sessions and their terms — creating a session auto-generates three terms</p>
        </div>
        <button onClick={() => { setForm({ name: "", startDate: "", endDate: "" }); setFormError(null); setModalOpen(true); }} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> New Session
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="card"><EmptyState title="Unable to load sessions" description={error} /></div>
      ) : sessions.length === 0 ? (
        <div className="card"><EmptyState title="No sessions yet" description="Create your first academic session to get started." /></div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-semibold text-lg text-primary-900 dark:text-white">{s.name}</h3>
                    {s.isCurrent && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(s.startDate)} – {formatDate(s.endDate)}
                  </p>
                </div>
                {!s.isCurrent && (
                  <button onClick={() => handleActivate(s.id)} disabled={activating === s.id} className="btn-secondary text-xs">
                    {activating === s.id ? "Activating..." : "Set as Current"}
                  </button>
                )}
              </div>
              {s.terms && s.terms.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  {s.terms.map((t) => (
                    <div key={t.id} className="px-3 py-2.5 rounded-md border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.name}</span>
                        {t.isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(t.startDate)} – {formatDate(t.endDate)}</p>
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
        title="New Academic Session"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary">{saving ? "Creating..." : "Create Session"}</button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && <div className="px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{formError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input className="input-field" placeholder="e.g. 2027/2028" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start date</label>
              <input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">End date</label>
              <input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
