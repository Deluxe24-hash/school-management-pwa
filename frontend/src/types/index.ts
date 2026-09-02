export type UserRole = "SUPER_ADMIN" | "ADMIN" | "PRINCIPAL" | "HEAD_TEACHER" | "TEACHER" | "ACCOUNTANT" | "STUDENT" | "PARENT";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  lastLogin?: string;
  createdAt: string;
  student?: Student;
  teacher?: Teacher;
  parent?: Parent;
  staff?: Staff;
}

export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  photoUrl?: string;
  address?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalInfo?: string;
  previousSchool?: string;
  admissionDate: string;
  academicStatus: string;
  parent?: Parent;
  enrollments?: StudentEnrollment[];
}

export interface Teacher {
  id: string;
  teacherId: string;
  firstName: string;
  lastName: string;
  gender: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
  qualification?: string;
  department?: string;
  dateEmployed?: string;
  classArms?: ClassArm[];
  classSubjects?: ClassSubject[];
}

export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  occupation?: string;
  relationship?: string;
  children?: Student[];
}

export interface Staff {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
}

export interface Class {
  id: string;
  name: string;
  level: string;
  description?: string;
  arms?: ClassArm[];
  subjects?: ClassSubject[];
}

export interface ClassArm {
  id: string;
  name: string;
  fullName: string;
  classId: string;
  class?: Class;
  classTeacherId?: string;
  classTeacher?: Teacher;
  _count?: { enrollments: number };
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  category?: string;
  description?: string;
  classSubjects?: ClassSubject[];
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId?: string;
  class?: Class;
  subject?: Subject;
  teacher?: Teacher;
}

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
  terms?: Term[];
}

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
  sessionId: string;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  classArmId: string;
  sessionId: string;
  enrolledAt: string;
  classArm?: ClassArm;
}

export interface Attendance {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remark?: string;
  studentId: string;
  classArmId: string;
  teacherId: string;
  sessionId: string;
  termId: string;
  student?: Student;
  teacher?: Teacher;
}

export interface Result {
  id: string;
  caScore?: number;
  examScore?: number;
  totalScore?: number;
  grade?: string;
  gradePoint?: number;
  position?: number;
  remark?: string;
  isLocked: boolean;
  studentId: string;
  subjectId: string;
  classArmId: string;
  teacherId: string;
  sessionId: string;
  termId: string;
  student?: Student;
  subject?: Subject;
  session?: AcademicSession;
  term?: Term;
  teacher?: Teacher;
}

export interface ReportCard {
  id: string;
  studentId: string;
  classArmId: string;
  sessionId: string;
  termId: string;
  totalSubjects?: number;
  totalScore?: number;
  average?: number;
  classPosition?: number;
  classSize?: number;
  attendancePresent?: number;
  attendanceAbsent?: number;
  attendanceLate?: number;
  attendanceExcused?: number;
  teacherRemark?: string;
  principalRemark?: string;
  nextTermBegins?: string;
}

export interface FeeItem {
  id: string;
  name: string;
  description?: string;
  isMandatory: boolean;
  isActive: boolean;
}

export interface Fee {
  id: string;
  amount: number;
  studentId: string;
  feeItemId: string;
  classArmId: string;
  sessionId: string;
  termId: string;
  feeItem?: FeeItem;
  student?: Student;
  payments?: Payment[];
  totalPaid?: number;
  balance?: number;
}

export interface Payment {
  id: string;
  amount: number;
  reference: string;
  gateway?: string;
  gatewayRef?: string;
  status: "PENDING" | "SUCCESSFUL" | "FAILED" | "CANCELLED";
  paidAt?: string;
  studentId: string;
  feeId: string;
  student?: Student;
  fee?: Fee;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  type: string;
  maxScore: number;
  dueDate: string;
  attachmentUrl?: string;
  teacherId: string;
  subjectId: string;
  classArmId: string;
  sessionId: string;
  termId: string;
  subject?: Subject;
  teacher?: Teacher;
  submissions?: Submission[];
  _count?: { submissions: number };
}

export interface Submission {
  id: string;
  content?: string;
  attachmentUrl?: string;
  score?: number;
  feedback?: string;
  submittedAt: string;
  studentId: string;
  assignmentId: string;
  student?: Student;
  assignment?: Assignment;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetRoles: UserRole[];
  targetClassArms: string[];
  publishedBy: string;
  publishedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface SchoolSetting {
  id: string;
  schoolName: string;
  motto?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  principalName?: string;
  headTeacherName?: string;
  schoolType?: string;
  gradingSystem?: Array<{ grade: string; min: number; max: number; remark: string; gp: number }>;
  caWeight: number;
  examWeight: number;
  attendanceThreshold: number;
  currency: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  totalSubjects: number;
  currentSession?: AcademicSession;
  todayAttendances: number;
  recentPayments: Payment[];
  genderStats: Array<{ gender: string; _count: { gender: number } }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
