import { format, parseISO } from "date-fns";

export const formatDate = (date: string | Date, pattern = "MMM dd, yyyy") => {
  if (!date) return "N/A";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, pattern);
  } catch {
    return "Invalid date";
  }
};

export const formatDateTime = (date: string | Date) => {
  return formatDate(date, "MMM dd, yyyy HH:mm");
};

export const formatCurrency = (amount: number, currency = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
  }).format(amount);
};

export const getInitials = (firstName?: string, lastName?: string) => {
  if (!firstName && !lastName) return "?";
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
};

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    PRESENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    ABSENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    LATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    EXCUSED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    SUCCESSFUL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    ENROLLED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    GRADUATED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    WITHDRAWN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    OPEN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    CLOSED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
};

export const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};
