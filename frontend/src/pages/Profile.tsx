import { useState } from "react";
import { KeyRound, Mail, Phone, Briefcase, GraduationCap } from "lucide-react";
import { authApi } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { getUserDisplayName } from "../utils/helpers";

export const Profile = () => {
  const { user } = useAuth();
  const displayName = getUserDisplayName(user);
  const profile = user?.teacher || user?.student || user?.parent;

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgIsError, setMsgIsError] = useState(false);

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setMsg("Fill in both password fields."); setMsgIsError(true); return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMsg("New passwords don't match."); setMsgIsError(true); return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMsg("New password should be at least 6 characters."); setMsgIsError(true); return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setMsg("Password changed successfully.");
      setMsgIsError(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setMsg(err?.message || "Couldn't change password."); setMsgIsError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-primary-900 dark:text-white">My Profile</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View your details and manage your account security</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-semibold text-primary-700 dark:text-primary-300">
              {displayName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
            </span>
          </div>
          <div>
            <h3 className="font-serif font-semibold text-lg text-primary-900 dark:text-white capitalize">{displayName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role?.toLowerCase().replace("_", " ")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
            </div>
          </div>
          {(profile as any)?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{(profile as any).phone}</p>
              </div>
            </div>
          )}
          {user?.teacher && (
            <>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Teacher ID</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.teacher.teacherId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.teacher.department || "—"}</p>
                </div>
              </div>
              {user.teacher.qualification && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Qualification</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.teacher.qualification}</p>
                </div>
              )}
              {(user.teacher as any).classSubjects?.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Subjects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(user.teacher as any).classSubjects.map((cs: any) => (
                      <span key={cs.id} className="px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium">
                        {cs.subject?.name} ({cs.class?.name})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {user?.student && (
            <>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admission Number</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.student.admissionNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Class</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{(user.student as any).enrollments?.[0]?.classArm?.fullName || "Not yet enrolled"}</p>
              </div>
            </>
          )}
          {user?.parent && (user.parent as any).children?.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Children</p>
              <div className="flex flex-wrap gap-1.5">
                {(user.parent as any).children.map((c: any) => (
                  <span key={c.id} className="px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium">
                    {c.firstName} {c.lastName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4 flex items-center gap-2">
          <KeyRound className="w-4 h-4" /> Change Password
        </h3>
        {msg && (
          <div className={`px-3 py-2 rounded-md text-sm mb-4 border ${msgIsError ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400" : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"}`}>
            {msg}
          </div>
        )}
        <div className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current password</label>
            <input type="password" className="input-field" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New password</label>
            <input type="password" className="input-field" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm new password</label>
            <input type="password" className="input-field" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
          </div>
          <button onClick={handleChangePassword} disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
};
