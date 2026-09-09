import { useEffect, useState, useCallback } from "react";
import { Plus, Receipt, Eye, Check, X } from "lucide-react";
import { feeApi, paymentApi, classApi, sessionApi, studentApi } from "../services/api";
import { FeeItem, ClassArm, Payment } from "../types";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { formatCurrency, formatDate, getStatusColor, cn } from "../utils/helpers";
import { ParentFees } from "./ParentFees";

type Tab = "items" | "assign" | "payments";

export const Fees = () => {
  const { isParent, isStudent } = useAuth();
  if (isParent() || isStudent()) return <ParentFees />;
  return <AdminFees />;
};

const AdminFees = () => {
  const { isFinance } = useAuth();
  const [tab, setTab] = useState<Tab>("items");

  const [items, setItems] = useState<FeeItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState({ name: "", description: "", isMandatory: true });
  const [savingItem, setSavingItem] = useState(false);

  const [classArms, setClassArms] = useState<ClassArm[]>([]);
  const [assignForm, setAssignForm] = useState({ classArmId: "", feeItemId: "", amount: "" });
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{ sessionId: string; termId: string } | null>(null);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activePayment, setActivePayment] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const loadItems = useCallback(() => {
    setItemsLoading(true);
    feeApi.getItems().then((res) => setItems(res.data.data)).finally(() => setItemsLoading(false));
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    classApi.getAll().then((res) => {
      const arms: ClassArm[] = res.data.data.flatMap((c: any) => c.arms.map((a: any) => ({ ...a, class: c })));
      setClassArms(arms);
    }).catch(() => {});
    sessionApi.getCurrent().then((res) => {
      const current = res.data.data;
      const currentTerm = current.terms?.find((t: any) => t.isCurrent) || current.terms?.[0];
      if (currentTerm) setSessionInfo({ sessionId: current.id, termId: currentTerm.id });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== "payments") return;
    setPaymentsLoading(true);
    paymentApi.getAll({ limit: 50, status: statusFilter || undefined }).then((res) => setPayments(res.data.data.payments)).finally(() => setPaymentsLoading(false));
  }, [tab, statusFilter]);

  const loadPayments = () => {
    setPaymentsLoading(true);
    paymentApi.getAll({ limit: 50, status: statusFilter || undefined }).then((res) => setPayments(res.data.data.payments)).finally(() => setPaymentsLoading(false));
  };

  const openReceipt = async (paymentId: string) => {
    const res = await paymentApi.getReceipt(paymentId);
    setActivePayment(res.data.data);
    setReceiptModalOpen(true);
  };

  const handleVerify = async (status: "SUCCESSFUL" | "FAILED") => {
    if (!activePayment) return;
    setVerifying(true);
    try {
      await paymentApi.verify(activePayment.id, { status });
      setReceiptModalOpen(false);
      loadPayments();
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) return;
    setSavingItem(true);
    try {
      await feeApi.createItem(itemForm);
      setItemModalOpen(false);
      setItemForm({ name: "", description: "", isMandatory: true });
      loadItems();
    } finally {
      setSavingItem(false);
    }
  };

  const handleAssign = async () => {
    if (!assignForm.classArmId || !assignForm.feeItemId || !assignForm.amount || !sessionInfo) {
      setAssignMsg("All fields are required.");
      return;
    }
    setAssignSaving(true);
    setAssignMsg(null);
    try {
      // In a full build this would fetch student IDs for the class arm; kept minimal here.
      const res = await studentApi.getAll({ classArmId: assignForm.classArmId, limit: 500 });
      const studentIds = res.data.data.students.map((s: any) => s.id);
      await feeApi.create({
        studentIds,
        feeItemId: assignForm.feeItemId,
        amount: Number(assignForm.amount),
        classArmId: assignForm.classArmId,
        sessionId: sessionInfo.sessionId,
        termId: sessionInfo.termId,
      });
      setAssignMsg(`Fee assigned to ${studentIds.length} student(s).`);
    } catch (err: any) {
      setAssignMsg(err?.message || "Couldn't assign fee.");
    } finally {
      setAssignSaving(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "items", label: "Fee Items" },
    { id: "assign", label: "Assign Fees" },
    { id: "payments", label: "Payments" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Fees</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage fee items, assign charges, and track payments</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.id ? "border-gold-400 text-primary-900 dark:text-white" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "items" && (
        <div className="space-y-4">
          {isFinance() && (
            <button onClick={() => setItemModalOpen(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Fee Item
            </button>
          )}
          {itemsLoading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : items.length === 0 ? (
            <div className="card"><EmptyState title="No fee items yet" description="Define fee items like Tuition or PTA dues before assigning charges." /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="card">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-gold-50 dark:bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.isMandatory ? "Mandatory" : "Optional"}</p>
                    </div>
                  </div>
                  {item.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{item.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "assign" && (
        <div className="card max-w-lg space-y-4">
          {assignMsg && <p className="text-sm text-gray-600 dark:text-gray-300">{assignMsg}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class</label>
            <select className="input-field" value={assignForm.classArmId} onChange={(e) => setAssignForm({ ...assignForm, classArmId: e.target.value })}>
              <option value="">Select a class</option>
              {classArms.map((a) => <option key={a.id} value={a.id}>{a.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fee item</label>
            <select className="input-field" value={assignForm.feeItemId} onChange={(e) => setAssignForm({ ...assignForm, feeItemId: e.target.value })}>
              <option value="">Select a fee item</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Amount</label>
            <input type="number" className="input-field" value={assignForm.amount} onChange={(e) => setAssignForm({ ...assignForm, amount: e.target.value })} />
          </div>
          <button onClick={handleAssign} disabled={assignSaving} className="btn-primary">
            {assignSaving ? "Assigning..." : "Assign to Class"}
          </button>
        </div>
      )}

      {tab === "payments" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {["", "PENDING", "SUCCESSFUL", "FAILED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium border",
                  statusFilter === s ? "bg-primary-900 text-white border-primary-900" : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                )}
              >
                {s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {paymentsLoading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : payments.length === 0 ? (
            <div className="card"><EmptyState title="No payments yet" description="Payments will show up here once recorded." /></div>
          ) : (
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Fee</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {payments.map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {p.student ? `${p.student.firstName} ${p.student.lastName}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.fee?.feeItem?.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.method?.replace("_", " ") || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(p.status)}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(p.paidAt || p.createdAt || "")}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openReceipt(p.id)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Payment Details"
        footer={
          activePayment?.status === "PENDING" && activePayment?.method !== "PAYSTACK" ? (
            <div className="flex justify-end gap-3">
              <button onClick={() => handleVerify("FAILED")} disabled={verifying} className="btn-secondary flex items-center gap-2 text-red-600">
                <X className="w-4 h-4" /> Reject
              </button>
              <button onClick={() => handleVerify("SUCCESSFUL")} disabled={verifying} className="btn-primary flex items-center gap-2">
                <Check className="w-4 h-4" /> {verifying ? "Approving..." : "Approve"}
              </button>
            </div>
          ) : undefined
        }
      >
        {activePayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500 dark:text-gray-400">Student</p><p className="font-medium text-gray-900 dark:text-white">{activePayment.student?.firstName} {activePayment.student?.lastName}</p></div>
              <div><p className="text-gray-500 dark:text-gray-400">Fee</p><p className="font-medium text-gray-900 dark:text-white">{activePayment.fee?.feeItem?.name}</p></div>
              <div><p className="text-gray-500 dark:text-gray-400">Amount</p><p className="font-medium text-gray-900 dark:text-white">{formatCurrency(activePayment.amount)}</p></div>
              <div><p className="text-gray-500 dark:text-gray-400">Method</p><p className="font-medium text-gray-900 dark:text-white">{activePayment.method?.replace("_", " ")}</p></div>
              <div><p className="text-gray-500 dark:text-gray-400">Reference</p><p className="font-medium text-gray-900 dark:text-white font-mono text-xs">{activePayment.reference}</p></div>
              <div><p className="text-gray-500 dark:text-gray-400">Status</p><span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(activePayment.status)}`}>{activePayment.status}</span></div>
            </div>
            {activePayment.submittedNote && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Note from parent</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{activePayment.submittedNote}</p>
              </div>
            )}
            {activePayment.receiptData && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Uploaded Receipt</p>
                <img src={activePayment.receiptData} alt="Payment receipt" className="w-full max-h-96 object-contain rounded-md border border-gray-200 dark:border-gray-800" />
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title="Add Fee Item"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setItemModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveItem} disabled={savingItem} className="btn-primary">{savingItem ? "Saving..." : "Add Item"}</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input className="input-field" placeholder="e.g. Tuition, PTA Dues" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <input className="input-field" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={itemForm.isMandatory} onChange={(e) => setItemForm({ ...itemForm, isMandatory: e.target.checked })} />
            Mandatory for all students
          </label>
        </div>
      </Modal>
    </div>
  );
};
