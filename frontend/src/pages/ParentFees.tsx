import { useEffect, useState } from "react";
import { Receipt, Upload, CreditCard, Landmark, Wallet, CheckCircle2, Clock, XCircle } from "lucide-react";
import { feeApi, paymentApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { formatCurrency, cn } from "../utils/helpers";

const MAX_RECEIPT_BYTES = 1.5 * 1024 * 1024; // 1.5MB — kept small since receipts are stored directly in the database

type Method = "BANK_TRANSFER" | "CASH_DEPOSIT" | "PAYSTACK";

export const ParentFees = () => {
  const { user, isStudent } = useAuth();
  const children = isStudent() ? (user?.student ? [user.student] : []) : (user?.parent?.children || []);

  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id || "");
  const [feeData, setFeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeFee, setActiveFee] = useState<any>(null);
  const [method, setMethod] = useState<Method>("BANK_TRANSFER");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [receiptFile, setReceiptFile] = useState<{ name: string; data: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const load = (childId: string) => {
    if (!childId) return;
    setLoading(true);
    setError(null);
    feeApi.getStudentFees(childId)
      .then((res) => setFeeData(res.data.data))
      .catch(() => setError("Couldn't load fees."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(selectedChildId); }, [selectedChildId]);

  const openPay = (fee: any) => {
    setActiveFee(fee);
    setMethod("BANK_TRANSFER");
    setAmount(String(fee.balance ?? fee.amount));
    setNote("");
    setReceiptFile(null);
    setFileError(null);
    setSubmitMsg(null);
    setPayModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (!file) { setReceiptFile(null); return; }
    if (file.size > MAX_RECEIPT_BYTES) {
      setFileError("Image is too large — please use one under 1.5MB.");
      setReceiptFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReceiptFile({ name: file.name, data: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (method !== "PAYSTACK" && !receiptFile) {
      setSubmitMsg("Please upload your payment receipt.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setSubmitMsg("Enter a valid amount.");
      return;
    }
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      await paymentApi.create({
        studentId: selectedChildId,
        feeId: activeFee.id,
        amount: Number(amount),
        method,
        receiptData: receiptFile?.data,
        submittedNote: note || undefined,
      });
      setSubmitMsg("Submitted — the school will confirm your payment shortly.");
      load(selectedChildId);
      setTimeout(() => setPayModalOpen(false), 1200);
    } catch (err: any) {
      setSubmitMsg(err?.message || "Couldn't submit payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const feePaymentStatus = (fee: any) => {
    const latest = [...(fee.payments || [])].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
    if ((fee.balance ?? fee.amount) <= 0) return { label: "Paid", color: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2 };
    if (latest?.status === "PENDING") return { label: "Awaiting confirmation", color: "text-gold-600 dark:text-gold-400", icon: Clock };
    if (latest?.status === "FAILED") return { label: "Last payment rejected", color: "text-red-700 dark:text-red-400", icon: XCircle };
    return { label: "Unpaid", color: "text-gray-500 dark:text-gray-400", icon: Receipt };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Fees</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isStudent() ? "Your school fees" : "Fees for your children, based on their class"}
        </p>
      </div>

      {children.length === 0 ? (
        <div className="card"><EmptyState title="No linked student" description="No student record is linked to your account yet — contact the school office." /></div>
      ) : (
        <>
          {!isStudent() && children.length > 1 && (
            <div className="card max-w-sm">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Child</label>
              <select className="input-field" value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}>
                {children.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : error ? (
            <div className="card"><EmptyState title="Unable to load fees" description={error} /></div>
          ) : !feeData || feeData.fees.length === 0 ? (
            <div className="card"><EmptyState title="No fees assigned yet" description="Once the school assigns fees to your child's class, they'll show up here." /></div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="card">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Bill</p>
                  <p className="font-serif font-semibold text-xl text-primary-900 dark:text-white mt-1">{formatCurrency(feeData.totalBill)}</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
                  <p className="font-serif font-semibold text-xl text-emerald-700 dark:text-emerald-400 mt-1">{formatCurrency(feeData.totalPaid)}</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
                  <p className="font-serif font-semibold text-xl text-red-700 dark:text-red-400 mt-1">{formatCurrency(feeData.balance)}</p>
                </div>
              </div>

              <div className="space-y-3">
                {feeData.fees.map((fee: any) => {
                  const paid = (fee.payments || []).filter((p: any) => p.status === "SUCCESSFUL").reduce((s: number, p: any) => s + p.amount, 0);
                  const balance = fee.amount - paid;
                  const status = feePaymentStatus({ ...fee, balance });
                  return (
                    <div key={fee.id} className="card flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-gold-50 dark:bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                          <Receipt className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{fee.feeItem?.name}</p>
                          <p className={cn("text-xs flex items-center gap-1", status.color)}>
                            <status.icon className="w-3 h-3" /> {status.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(fee.amount)}</p>
                          {balance > 0 && <p className="text-xs text-red-600 dark:text-red-400">Bal: {formatCurrency(balance)}</p>}
                        </div>
                        {balance > 0 && (
                          <button onClick={() => openPay({ ...fee, balance })} className="btn-primary text-xs py-1.5">Pay</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={`Pay — ${activeFee?.feeItem?.name || ""}`}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setPayModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting || method === "PAYSTACK"} className="btn-primary">
              {submitting ? "Submitting..." : "Submit Payment"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {submitMsg && (
            <div className="px-3 py-2 rounded-md bg-gold-50 dark:bg-gold-500/10 border border-gold-200 dark:border-gold-500/30 text-sm text-gold-700 dark:text-gold-400">
              {submitMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">How are you paying?</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMethod("BANK_TRANSFER")}
                className={cn("flex flex-col items-center gap-1.5 px-3 py-3 rounded-md border text-xs font-medium", method === "BANK_TRANSFER" ? "border-primary-700 bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300" : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300")}
              >
                <Landmark className="w-5 h-5" /> Bank Transfer
              </button>
              <button
                onClick={() => setMethod("CASH_DEPOSIT")}
                className={cn("flex flex-col items-center gap-1.5 px-3 py-3 rounded-md border text-xs font-medium", method === "CASH_DEPOSIT" ? "border-primary-700 bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300" : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300")}
              >
                <Wallet className="w-5 h-5" /> Cash Deposit
              </button>
              <button
                onClick={() => setMethod("PAYSTACK")}
                className={cn("flex flex-col items-center gap-1.5 px-3 py-3 rounded-md border text-xs font-medium relative", method === "PAYSTACK" ? "border-primary-700 bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300" : "border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500")}
              >
                <CreditCard className="w-5 h-5" /> Pay Online
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">SOON</span>
              </button>
            </div>
          </div>

          {method === "PAYSTACK" ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 rounded-md bg-gray-50 dark:bg-white/5">
              Online card/bank payment is coming soon. Please use Bank Transfer or Cash Deposit for now.
            </p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Amount</label>
                <input type="number" min={1} max={activeFee?.balance} className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {method === "BANK_TRANSFER" ? "Transfer receipt / screenshot" : "Deposit slip photo"}
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-6 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:border-gold-400 transition-colors">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">{receiptFile ? receiptFile.name : "Tap to choose an image"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
                {fileError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fileError}</p>}
                {receiptFile && <img src={receiptFile.data} alt="Receipt preview" className="mt-2 max-h-40 rounded-md border border-gray-200 dark:border-gray-800 object-contain" />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Note (optional)</label>
                <input className="input-field" placeholder="e.g. Transaction reference, bank name" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">The school will confirm this payment after reviewing your receipt.</p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
