import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Megaphone } from "lucide-react";
import { announcementApi } from "../services/api";
import { Announcement } from "../types";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { formatDateTime, cn } from "../utils/helpers";

const priorityClasses: Record<string, string> = {
  urgent: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
  high: "bg-gold-50 text-gold-700 dark:bg-gold-500/10 dark:text-gold-400 border-gold-200 dark:border-gold-500/30",
  normal: "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 border-primary-200 dark:border-primary-800",
};

export const Announcements = () => {
  const { isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "normal" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    announcementApi.getAll({ limit: 50 })
      .then((res) => setAnnouncements(res.data.data.announcements))
      .catch(() => setError("Couldn't load announcements."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm({ title: "", content: "", priority: "normal" }); setFormError(null); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setFormError("Title and message are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await announcementApi.create({ ...form, targetRoles: [], targetClassArms: [] });
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Couldn't publish announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await announcementApi.delete(deleteTarget.id);
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
          <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Announcements</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">School-wide notices</p>
        </div>
        {isAdmin() && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> Publish Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <div className="card"><EmptyState title="Unable to load announcements" description={error} /></div>
      ) : announcements.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No announcements yet"
            description="Publish your first notice to reach the school."
            action={isAdmin() ? <button onClick={openCreate} className="btn-primary">Publish Announcement</button> : undefined}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className={cn("card border-l-[3px]", priorityClasses[a.priority] || priorityClasses.normal)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Megaphone className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{a.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDateTime(a.publishedAt)}</p>
                  </div>
                </div>
                {isAdmin() && (
                  <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">{a.content}</p>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Publish Announcement"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "Publishing..." : "Publish"}</button>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
            <textarea className="input-field" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
            <select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete announcement"
        message={`Delete "${deleteTarget?.title}"? This can't be undone.`}
        confirmText="Delete"
        isLoading={deleting}
      />
    </div>
  );
};
