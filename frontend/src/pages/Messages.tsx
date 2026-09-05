import { useEffect, useState, useCallback } from "react";
import { Send, Mail, MailOpen, Plus } from "lucide-react";
import { messageApi } from "../services/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { formatDateTime, cn } from "../utils/helpers";

type Tab = "inbox" | "sent";

export const Messages = () => {
  const [tab, setTab] = useState<Tab>("inbox");
  const [inbox, setInbox] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const [contacts, setContacts] = useState<any[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ receiverId: "", subject: "", content: "" });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([messageApi.getInbox(), messageApi.getSent()])
      .then(([inboxRes, sentRes]) => {
        setInbox(inboxRes.data.data);
        setSent(sentRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCompose = () => {
    setForm({ receiverId: "", subject: "", content: "" });
    setSendError(null);
    messageApi.getContacts().then((res) => setContacts(res.data.data)).catch(() => {});
    setComposeOpen(true);
  };

  const handleSend = async () => {
    if (!form.receiverId || !form.content.trim()) {
      setSendError("Recipient and message are required.");
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      await messageApi.send(form);
      setComposeOpen(false);
      load();
    } catch (err: any) {
      setSendError(err?.message || "Couldn't send message.");
    } finally {
      setSending(false);
    }
  };

  const openMessage = (m: any) => {
    setSelected(m);
    if (tab === "inbox" && !m.isRead) {
      messageApi.markRead(m.id).then(() => {
        setInbox((prev) => prev.map((x) => (x.id === m.id ? { ...x, isRead: true } : x)));
      });
    }
  };

  const list = tab === "inbox" ? inbox : sent;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Messages</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Direct messages between staff, teachers, and families</p>
        </div>
        <button onClick={openCompose} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> New Message
        </button>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {(["inbox", "sent"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelected(null); }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors",
              tab === t ? "border-gold-400 text-primary-900 dark:text-white" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : list.length === 0 ? (
        <div className="card"><EmptyState title={tab === "inbox" ? "No messages" : "Nothing sent yet"} description={tab === "inbox" ? "Messages sent to you will show up here." : "Messages you send will show up here."} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 card p-0 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 max-h-[32rem] overflow-y-auto">
            {list.map((m) => {
              const other = tab === "inbox" ? m.sender : m.receiver;
              return (
                <button
                  key={m.id}
                  onClick={() => openMessage(m)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 flex items-start gap-3",
                    selected?.id === m.id && "bg-gray-50 dark:bg-white/5"
                  )}
                >
                  {tab === "inbox" && !m.isRead ? <Mail className="w-4 h-4 text-gold-500 mt-0.5 flex-shrink-0" /> : <MailOpen className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className={cn("text-sm truncate", !m.isRead && tab === "inbox" ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300")}>
                      {other?.email || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.subject}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-2 card">
            {!selected ? (
              <EmptyState title="Select a message" description="Choose a message from the list to read it." />
            ) : (
              <div>
                <h3 className="font-serif font-semibold text-lg text-primary-900 dark:text-white">{selected.subject}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {tab === "inbox" ? `From ${selected.sender?.email}` : `To ${selected.receiver?.email}`} · {formatDateTime(selected.createdAt)}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-4 whitespace-pre-wrap">{selected.content}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="New Message"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setComposeOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSend} disabled={sending} className="btn-primary flex items-center gap-2">
              <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {sendError && <div className="px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{sendError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">To</label>
            <select className="input-field" value={form.receiverId} onChange={(e) => setForm({ ...form, receiverId: e.target.value })}>
              <option value="">Select a recipient</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.teacher ? `${c.teacher.firstName} ${c.teacher.lastName} (Teacher)` : c.student ? `${c.student.firstName} ${c.student.lastName} (Student)` : c.parent ? `${c.parent.firstName} ${c.parent.lastName} (Parent)` : c.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
            <input className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
            <textarea className="input-field" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
};
