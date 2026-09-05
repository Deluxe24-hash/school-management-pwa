import { useEffect, useState, useCallback } from "react";
import { Plus, BookOpen, Undo2 } from "lucide-react";
import { libraryApi, studentApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { EmptyState } from "../components/EmptyState";
import { SearchBar } from "../components/SearchBar";
import { Modal } from "../components/Modal";
import { formatDate, cn } from "../utils/helpers";

type Tab = "catalog" | "loans";

export const Library = () => {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("catalog");
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState({ title: "", author: "", isbn: "", category: "", totalCopies: "1" });
  const [savingBook, setSavingBook] = useState(false);

  const [loans, setLoans] = useState<any[]>([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [borrowForm, setBorrowForm] = useState({ bookId: "", studentQuery: "", studentId: "", dueDate: "" });
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [borrowing, setBorrowing] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);

  const loadBooks = useCallback(() => {
    setLoading(true);
    libraryApi.getBooks({ search: search || undefined }).then((res) => setBooks(res.data.data)).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const loadLoans = useCallback(() => {
    setLoansLoading(true);
    libraryApi.getLoans().then((res) => setLoans(res.data.data)).finally(() => setLoansLoading(false));
  }, []);

  useEffect(() => { if (tab === "loans") loadLoans(); }, [tab, loadLoans]);

  const handleSaveBook = async () => {
    if (!bookForm.title.trim() || !bookForm.author.trim()) return;
    setSavingBook(true);
    try {
      await libraryApi.createBook({ ...bookForm, totalCopies: Number(bookForm.totalCopies) || 1 });
      setBookModalOpen(false);
      setBookForm({ title: "", author: "", isbn: "", category: "", totalCopies: "1" });
      loadBooks();
    } finally {
      setSavingBook(false);
    }
  };

  const openBorrow = (bookId: string) => {
    setBorrowForm({ bookId, studentQuery: "", studentId: "", dueDate: "" });
    setStudentResults([]);
    setBorrowError(null);
    setBorrowModalOpen(true);
  };

  const searchStudents = async (q: string) => {
    setBorrowForm((f) => ({ ...f, studentQuery: q, studentId: "" }));
    if (q.length < 2) { setStudentResults([]); return; }
    const res = await studentApi.getAll({ search: q, limit: 10 });
    setStudentResults(res.data.data.students);
  };

  const handleBorrow = async () => {
    if (!borrowForm.studentId || !borrowForm.dueDate) {
      setBorrowError("Select a student and due date.");
      return;
    }
    setBorrowing(true);
    setBorrowError(null);
    try {
      await libraryApi.borrowBook({ bookId: borrowForm.bookId, studentId: borrowForm.studentId, dueDate: borrowForm.dueDate });
      setBorrowModalOpen(false);
      loadBooks();
      if (tab === "loans") loadLoans();
    } catch (err: any) {
      setBorrowError(err?.message || "Couldn't issue this book.");
    } finally {
      setBorrowing(false);
    }
  };

  const handleReturn = async (loanId: string) => {
    await libraryApi.returnBook(loanId);
    loadLoans();
    loadBooks();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Library</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Book catalog and borrowing</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {(["catalog", "loans"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors",
              tab === t ? "border-gold-400 text-primary-900 dark:text-white" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"
            )}
          >
            {t === "catalog" ? "Catalog" : "Active Loans"}
          </button>
        ))}
      </div>

      {tab === "catalog" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SearchBar placeholder="Search by title or author..." onSearch={setSearch} className="max-w-md" />
            {isAdmin() && (
              <button onClick={() => setBookModalOpen(true)} className="btn-primary flex items-center gap-2 self-start">
                <Plus className="w-4 h-4" /> Add Book
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : books.length === 0 ? (
            <div className="card"><EmptyState title="No books yet" description="Add your first book to the catalog." /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((b) => (
                <div key={b.id} className="card">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-primary-700 dark:text-primary-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{b.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{b.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className={cn("text-xs font-medium", b.availableCopies > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
                      {b.availableCopies}/{b.totalCopies} available
                    </span>
                    {isAdmin() && b.availableCopies > 0 && (
                      <button onClick={() => openBorrow(b.id)} className="btn-secondary text-xs py-1">Issue</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "loans" && (
        loansLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : loans.length === 0 ? (
          <div className="card"><EmptyState title="No loans yet" description="Issued books will show up here." /></div>
        ) : (
          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Book</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {isAdmin() && <th className="px-4 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loans.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{l.book?.title}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{l.student?.firstName} {l.student?.lastName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(l.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", l.status === "RETURNED" ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" : "bg-gold-50 text-gold-700 dark:bg-gold-500/10 dark:text-gold-400")}>
                        {l.status}
                      </span>
                    </td>
                    {isAdmin() && (
                      <td className="px-4 py-3 text-right">
                        {l.status !== "RETURNED" && (
                          <button onClick={() => handleReturn(l.id)} className="btn-secondary text-xs py-1 flex items-center gap-1 ml-auto">
                            <Undo2 className="w-3.5 h-3.5" /> Return
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <Modal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        title="Add Book"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setBookModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSaveBook} disabled={savingBook} className="btn-primary">{savingBook ? "Saving..." : "Add Book"}</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input className="input-field" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Author</label>
            <input className="input-field" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ISBN</label>
              <input className="input-field" value={bookForm.isbn} onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Copies</label>
              <input type="number" min={1} className="input-field" value={bookForm.totalCopies} onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
            <input className="input-field" value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={borrowModalOpen}
        onClose={() => setBorrowModalOpen(false)}
        title="Issue Book"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setBorrowModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleBorrow} disabled={borrowing} className="btn-primary">{borrowing ? "Issuing..." : "Issue"}</button>
          </div>
        }
      >
        <div className="space-y-4">
          {borrowError && <div className="px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">{borrowError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Student</label>
            <input className="input-field" placeholder="Search by name..." value={borrowForm.studentQuery} onChange={(e) => searchStudents(e.target.value)} />
            {studentResults.length > 0 && !borrowForm.studentId && (
              <div className="mt-1.5 border border-gray-200 dark:border-gray-800 rounded-md divide-y divide-gray-100 dark:divide-gray-800 max-h-40 overflow-y-auto">
                {studentResults.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setBorrowForm((f) => ({ ...f, studentId: s.id, studentQuery: `${s.firstName} ${s.lastName}` }))}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    {s.firstName} {s.lastName} · {s.admissionNumber}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Due date</label>
            <input type="date" className="input-field" value={borrowForm.dueDate} onChange={(e) => setBorrowForm({ ...borrowForm, dueDate: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
};
