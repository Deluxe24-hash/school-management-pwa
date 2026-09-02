import { useAuthStore } from "../store/authStore";
import { UserRole } from "../types";

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, logout, fetchUser } = useAuthStore();

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = () => hasRole(["SUPER_ADMIN", "ADMIN", "PRINCIPAL"]);
  const isTeacher = () => hasRole(["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HEAD_TEACHER", "TEACHER"]);
  const isFinance = () => hasRole(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]);
  const isStudent = () => user?.role === "STUDENT";
  const isParent = () => user?.role === "PARENT";

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    fetchUser,
    hasRole,
    isAdmin,
    isTeacher,
    isFinance,
    isStudent,
    isParent,
  };
};
