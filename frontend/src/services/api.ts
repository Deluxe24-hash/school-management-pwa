import axios, { AxiosError, AxiosResponse } from "axios";
import { ApiResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => response,
  (error: AxiosError<ApiResponse<any>>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    const message = error.response?.data?.message || "An error occurred";
    return Promise.reject({ ...error, message });
  }
);

// Auth APIs
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: any) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
};

// Student APIs
export const studentApi = {
  getAll: (params?: any) => api.get("/students", { params }),
  getById: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post("/students", data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  promote: (id: string, data: any) => api.post(`/students/${id}/promote`, data),
};

// Teacher APIs
export const teacherApi = {
  getAll: (params?: any) => api.get("/teachers", { params }),
  getById: (id: string) => api.get(`/teachers/${id}`),
  create: (data: any) => api.post("/teachers", data),
  update: (id: string, data: any) => api.put(`/teachers/${id}`, data),
  assignSubject: (data: any) => api.post("/teachers/assign-subject", data),
};

// Class APIs
export const classApi = {
  getAll: () => api.get("/classes"),
  getById: (id: string) => api.get(`/classes/${id}`),
  create: (data: any) => api.post("/classes", data),
  createArm: (data: any) => api.post("/classes/arms", data),
  updateArm: (id: string, data: any) => api.put(`/classes/arms/${id}`, data),
};

// Subject APIs
export const subjectApi = {
  getAll: () => api.get("/subjects"),
  getById: (id: string) => api.get(`/subjects/${id}`),
  create: (data: any) => api.post("/subjects", data),
  update: (id: string, data: any) => api.put(`/subjects/${id}`, data),
  delete: (id: string) => api.delete(`/subjects/${id}`),
};

// Session APIs
export const sessionApi = {
  getAll: () => api.get("/sessions"),
  getCurrent: () => api.get("/sessions/current"),
  create: (data: any) => api.post("/sessions", data),
  setCurrent: (id: string) => api.post(`/sessions/${id}/set-current`),
  updateTerm: (id: string, data: any) => api.put(`/sessions/terms/${id}`, data),
};

// Attendance APIs
export const attendanceApi = {
  getAll: (params?: any) => api.get("/attendance", { params }),
  getStats: (params?: any) => api.get("/attendance/stats", { params }),
  getStudentAttendance: (studentId: string, params?: any) =>
    api.get(`/attendance/student/${studentId}`, { params }),
  mark: (data: any) => api.post("/attendance/mark", data),
};

// Result APIs
export const resultApi = {
  getAll: (params?: any) => api.get("/results", { params }),
  getStudentResults: (studentId: string, params?: any) =>
    api.get(`/results/student/${studentId}`, { params }),
  enter: (data: any) => api.post("/results/enter", data),
  lock: (data: any) => api.post("/results/lock", data),
  unlock: (data: any) => api.post("/results/unlock", data),
  process: (data: any) => api.post("/results/process", data),
};

// Fee APIs
export const feeApi = {
  getItems: () => api.get("/fees/items"),
  createItem: (data: any) => api.post("/fees/items", data),
  getAll: (params?: any) => api.get("/fees", { params }),
  create: (data: any) => api.post("/fees", data),
  getStudentFees: (studentId: string, params?: any) =>
    api.get(`/fees/student/${studentId}`, { params }),
};

// Payment APIs
export const paymentApi = {
  getAll: (params?: any) => api.get("/payments", { params }),
  create: (data: any) => api.post("/payments", data),
  verify: (id: string, data: any) => api.post(`/payments/${id}/verify`, data),
  getReceipt: (id: string) => api.get(`/payments/${id}/receipt`),
};

// Assignment APIs
export const assignmentApi = {
  getAll: (params?: any) => api.get("/assignments", { params }),
  getById: (id: string) => api.get(`/assignments/${id}`),
  create: (data: any) => api.post("/assignments", data),
  submit: (data: any) => api.post("/assignments/submit", data),
  grade: (data: any) => api.post("/assignments/grade", data),
};

// Announcement APIs
export const announcementApi = {
  getAll: (params?: any) => api.get("/announcements", { params }),
  getById: (id: string) => api.get(`/announcements/${id}`),
  create: (data: any) => api.post("/announcements", data),
  update: (id: string, data: any) => api.put(`/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/announcements/${id}`),
};

// Settings APIs
export const settingApi = {
  get: () => api.get("/settings"),
  update: (data: any) => api.put("/settings", data),
};

// Report APIs
export const reportApi = {
  getDashboardStats: () => api.get("/reports/dashboard"),
  getStudentReport: (studentId: string, params?: any) =>
    api.get(`/reports/student/${studentId}`, { params }),
  getClassPerformance: (params?: any) =>
    api.get("/reports/class-performance", { params }),
};

export default api;
