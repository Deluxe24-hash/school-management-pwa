import { useState, FormEvent } from "react";
import { GraduationCap, CheckCircle2 } from "lucide-react";
import { admissionApi } from "../services/api";

const emptyForm = {
  firstName: "", lastName: "", middleName: "", gender: "MALE", dateOfBirth: "",
  classAppliedFor: "", previousSchool: "", parentName: "", parentPhone: "", parentEmail: "", address: "",
};

export const Apply = () => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.gender || !form.classAppliedFor || !form.parentName || !form.parentPhone) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await admissionApi.apply(form);
      setDone(true);
    } catch (err: any) {
      setError(err?.message || "Couldn't submit your application — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-paper-dark px-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Application Submitted</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Thank you — the school will review your application and contact you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-paper-dark px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary-900 rounded-md flex items-center justify-center mb-4 border border-primary-800">
            <GraduationCap className="w-7 h-7 text-gold-400" />
          </div>
          <h1 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">Admission Application</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
            Fill in the form below to apply for admission. The school will contact you after review.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="px-3 py-2.5 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Student Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">First name *</label>
              <input className="input-field" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Last name *</label>
              <input className="input-field" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Middle name</label>
              <input className="input-field" value={form.middleName} onChange={(e) => set("middleName", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Gender *</label>
              <select className="input-field" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date of birth</label>
              <input type="date" className="input-field" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class applying for *</label>
              <input className="input-field" placeholder="e.g. Primary 3" value={form.classAppliedFor} onChange={(e) => set("classAppliedFor", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Previous school</label>
              <input className="input-field" value={form.previousSchool} onChange={(e) => set("previousSchool", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Home address</label>
              <input className="input-field" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide pt-2 border-t border-gray-200 dark:border-gray-800">Parent/Guardian Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full name *</label>
              <input className="input-field" value={form.parentName} onChange={(e) => set("parentName", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone *</label>
              <input className="input-field" value={form.parentPhone} onChange={(e) => set("parentPhone", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input type="email" className="input-field" value={form.parentEmail} onChange={(e) => set("parentEmail", e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
};
