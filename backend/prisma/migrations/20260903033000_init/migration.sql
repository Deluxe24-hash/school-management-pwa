-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HEAD_TEACHER', 'TEACHER', 'ACCOUNTANT', 'STUDENT', 'PARENT');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE "AcademicStatus" AS ENUM ('ENROLLED', 'PROMOTED', 'REPEATED', 'GRADUATED', 'WITHDRAWN', 'TRANSFERRED');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
CREATE TYPE "TermStatus" AS ENUM ('PENDING', 'OPEN', 'CLOSED', 'ARCHIVED');
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED', 'CANCELLED');
CREATE TYPE "NotificationType" AS ENUM ('ANNOUNCEMENT', 'FEE_REMINDER', 'PAYMENT_CONFIRMATION', 'RESULT_PUBLISHED', 'ASSIGNMENT_CREATED', 'ASSIGNMENT_DEADLINE', 'ATTENDANCE_ALERT', 'GENERAL');
CREATE TYPE "AssignmentType" AS ENUM ('HOMEWORK', 'CLASSWORK', 'PROJECT', 'PRACTICAL');

-- CreateTable
CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "lastLogin" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "school_settings" (
  "id" TEXT NOT NULL,
  "schoolName" TEXT NOT NULL,
  "motto" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "logoUrl" TEXT,
  "primaryColor" TEXT NOT NULL DEFAULT '#2563eb',
  "secondaryColor" TEXT NOT NULL DEFAULT '#1e40af',
  "principalName" TEXT,
  "headTeacherName" TEXT,
  "schoolType" TEXT,
  "gradingSystem" JSONB,
  "caWeight" INTEGER NOT NULL DEFAULT 40,
  "examWeight" INTEGER NOT NULL DEFAULT 60,
  "attendanceThreshold" INTEGER NOT NULL DEFAULT 75,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "academic_sessions" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "academic_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "terms" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" "TermStatus" NOT NULL DEFAULT 'PENDING',
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "sessionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "terms_sessionId_name_key" ON "terms"("sessionId", "name");

CREATE TABLE "classes" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "level" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "class_arms" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "classTeacherId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "class_arms_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "class_arms_classId_name_key" ON "class_arms"("classId", "name");

CREATE TABLE "subjects" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "category" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

CREATE TABLE "class_subjects" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "teacherId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "class_subjects_classId_subjectId_key" ON "class_subjects"("classId", "subjectId");

CREATE TABLE "students" (
  "id" TEXT NOT NULL,
  "admissionNumber" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "middleName" TEXT,
  "lastName" TEXT NOT NULL,
  "gender" "Gender" NOT NULL,
  "dateOfBirth" TIMESTAMP(3),
  "photoUrl" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "emergencyContact" TEXT,
  "emergencyPhone" TEXT,
  "medicalInfo" TEXT,
  "previousSchool" TEXT,
  "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "academicStatus" "AcademicStatus" NOT NULL DEFAULT 'ENROLLED',
  "userId" TEXT NOT NULL,
  "parentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "students_admissionNumber_key" ON "students"("admissionNumber");
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

CREATE TABLE "student_enrollments" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "classArmId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "student_enrollments_studentId_sessionId_key" ON "student_enrollments"("studentId", "sessionId");

CREATE TABLE "teachers" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "gender" "Gender" NOT NULL,
  "dateOfBirth" TIMESTAMP(3),
  "photoUrl" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "qualification" TEXT,
  "department" TEXT,
  "dateEmployed" TIMESTAMP(3),
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "teachers_teacherId_key" ON "teachers"("teacherId");
CREATE UNIQUE INDEX "teachers_userId_key" ON "teachers"("userId");

CREATE TABLE "parents" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "address" TEXT,
  "occupation" TEXT,
  "relationship" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "parents_userId_key" ON "parents"("userId");

CREATE TABLE "staff" (
  "id" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "gender" "Gender" NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "address" TEXT,
  "department" TEXT,
  "position" TEXT,
  "dateEmployed" TIMESTAMP(3),
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "staff_staffId_key" ON "staff"("staffId");
CREATE UNIQUE INDEX "staff_userId_key" ON "staff"("userId");

CREATE TABLE "attendances" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "status" "AttendanceStatus" NOT NULL,
  "remark" TEXT,
  "studentId" TEXT NOT NULL,
  "classArmId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "termId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "attendances_studentId_date_termId_key" ON "attendances"("studentId", "date", "termId");

CREATE TABLE "results" (
  "id" TEXT NOT NULL,
  "caScore" DOUBLE PRECISION,
  "examScore" DOUBLE PRECISION,
  "totalScore" DOUBLE PRECISION,
  "grade" TEXT,
  "gradePoint" DOUBLE PRECISION,
  "position" INTEGER,
  "remark" TEXT,
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "studentId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "classArmId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "termId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "results_studentId_subjectId_sessionId_termId_key" ON "results"("studentId", "subjectId", "sessionId", "termId");

CREATE TABLE "report_cards" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "classArmId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "termId" TEXT NOT NULL,
  "totalSubjects" INTEGER,
  "totalScore" DOUBLE PRECISION,
  "average" DOUBLE PRECISION,
  "classPosition" INTEGER,
  "classSize" INTEGER,
  "attendancePresent" INTEGER,
  "attendanceAbsent" INTEGER,
  "attendanceLate" INTEGER,
  "attendanceExcused" INTEGER,
  "teacherRemark" TEXT,
  "principalRemark" TEXT,
  "nextTermBegins" TIMESTAMP(3),
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "report_cards_studentId_sessionId_termId_key" ON "report_cards"("studentId", "sessionId", "termId");

CREATE TABLE "fee_items" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isMandatory" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fee_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fees" (
  "id" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "studentId" TEXT NOT NULL,
  "feeItemId" TEXT NOT NULL,
  "classArmId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "termId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "fees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "reference" TEXT NOT NULL,
  "gateway" TEXT,
  "gatewayRef" TEXT,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP(3),
  "studentId" TEXT NOT NULL,
  "feeId" TEXT NOT NULL,
  "processedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payments_reference_key" ON "payments"("reference");

CREATE TABLE "assignments" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "instructions" TEXT,
  "type" "AssignmentType" NOT NULL DEFAULT 'HOMEWORK',
  "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "attachmentUrl" TEXT,
  "teacherId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "classArmId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "termId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "submissions" (
  "id" TEXT NOT NULL,
  "content" TEXT,
  "attachmentUrl" TEXT,
  "score" DOUBLE PRECISION,
  "feedback" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "studentId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "submissions_studentId_assignmentId_key" ON "submissions"("studentId", "assignmentId");

CREATE TABLE "timetables" (
  "id" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "room" TEXT,
  "teacherId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "classArmId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "termId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "timetables_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "announcements" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "targetRoles" "UserRole"[],
  "targetClassArms" TEXT[],
  "publishedBy" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messages" (
  "id" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "data" JSONB,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "oldData" JSONB,
  "newData" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "terms" ADD CONSTRAINT "terms_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_arms" ADD CONSTRAINT "class_arms_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_arms" ADD CONSTRAINT "class_arms_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_classArmId_fkey" FOREIGN KEY ("classArmId") REFERENCES "class_arms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "parents" ADD CONSTRAINT "parents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff" ADD CONSTRAINT "staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "results" ADD CONSTRAINT "results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "results" ADD CONSTRAINT "results_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "results" ADD CONSTRAINT "results_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "results" ADD CONSTRAINT "results_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "results" ADD CONSTRAINT "results_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fees" ADD CONSTRAINT "fees_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fees" ADD CONSTRAINT "fees_feeItemId_fkey" FOREIGN KEY ("feeItemId") REFERENCES "fee_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fees" ADD CONSTRAINT "fees_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fees" ADD CONSTRAINT "fees_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_classArmId_fkey" FOREIGN KEY ("classArmId") REFERENCES "class_arms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
