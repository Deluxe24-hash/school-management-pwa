import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, XCircle, Eye, Copy } from "lucide-react";
import { admissionApi } from "../services/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { formatDate, cn } from "../utils/helpers";

const statusColors: Record<string, string> = {
  PENDING: "bg-gold-50 text-gold-700 dark:bg-gold-500/10 dark:text-gold-400",
  UNDER_REVIEW: "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300",
  ACCEPTED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

export const Admissions = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [acting, setActing] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    admissionApi.getAll(statusFilter ? { status: statusFilter } : undefined)
      .then((res) => setApplications(res.data.data))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const applyUrl = `${window.location.origin}/apply`;

  const handleAccept = async () => {
    if (!selected) return;
    setActing(true);
    setActionMsg(null);
    try {
      await admissionApi.accept(selected.id);
      setActionMsg("Accepted — student record and login created.");
      load();
    } catch (err: any) {
      setActionMsg(err?.message || "Couldn't accept this application.");
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActing(true);
    setActionMsg(null);
    try {
      await admissionApi.review(selected.id, { status: "REJECTED" });
      setActionMsg("Application rejected.");
      load();
    } catch (err: any) {
      setActionMsg(err?.message || "Couldn't update this application.");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Admissions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review applications submitted through the public form</p>
        </div>
        <button
          onClick={() => { navigator.clipboard?.writeText(applyUrl); setActionMsg("Application link copied."); }}
          className="btn-secondary flex items-center gap-2 self-start text-xs"
        >
          <Copy className="w-3.5 h-3.5" /> Copy Application Link
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", "PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium border",
              statusFilter === s ? "bg-primary-900 text-white border-primary-900" : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
            )}
          >
            {s === "" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {actionMsg && <p className="text-sm text-gray-600 dark:text-gray-300">{actionMsg}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : applications.length === 0 ? (
        <div className="card"><EmptyState title="No applications" description="Share the application link so families can apply." /></div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 font-medium">Applicant</th>
                <th className="px-4 py-3 font-medium">Class Applied For</th>
                <th className="px-4 py-3 font-medium">Parent</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {applications.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{a.firstName} {a.lastName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.classAppliedFor}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.parentName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(a.submittedAt)}</td>
                  <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusColors[a.status])}>{a.status.replace("_", " ")}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setSelected(a); setActionMsg(null); }} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Application Details"
        size="lg"
        footer={
          selected?.status === "PENDING" || selected?.status === "UNDER_REVIEW" ? (
            <div className="flex justify-end gap-3">
              <button onClick={handleReject} disabled={acting} className="btn-secondary flex items-center gap-2 text-red-600">
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button onClick={handleAccept} disabled={acting} className="btn-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {acting ? "Processing..." : "Accept & Enroll"}
              </button>
            </div>
          ) : undefined
        }
      >
        {selected && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500 dark:text-gray-400">Name</p><p className="font-medium text-gray-900 dark:text-white">{selected.firstName} {selected.middleName} {selected.lastName}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">Gender</p><p className="font-medium text-gray-900 dark:text-white capitalize">{selected.gender?.toLowerCase()}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">Date of Birth</p><p className="font-medium text-gray-900 dark:text-white">{selected.dateOfBirth ? formatDate(selected.dateOfBirth) : "—"}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">Class Applied For</p><p className="font-medium text-gray-900 dark:text-white">{selected.classAppliedFor}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">Previous School</p><p className="font-medium text-gray-900 dark:text-white">{selected.previousSchool || "—"}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">Address</p><p className="font-medium text-gray-900 dark:text-white">{selected.address || "—"}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">Parent/Guardian</p><p className="font-medium text-gray-900 dark:text-white">{selected.parentName}</p></div>
            <div><p className="text-gray-500 dark:text-gray-400">Parent Phone</p><p className="font-medium text-gray-900 dark:text-white">{selected.parentPhone}</p></div>
            <div className="col-span-2"><p className="text-gray-500 dark:text-gray-400">Parent Email</p><p className="font-medium text-gray-900 dark:text-white">{selected.parentEmail || "—"}</p></div>
          </div>
        )}
      </Modal>
    </div>
  );
};
