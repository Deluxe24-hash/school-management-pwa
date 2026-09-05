import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse } from "../utils/response";

// Deep-dive into ONE subject for a class: average/highest/lowest, pass rate,
// grade distribution (for a bar chart), and individual student scores (for ranking).
export const getSubjectPerformance = async (req: Request, res: Response) => {
  try {
    const { classArmId, subjectId, sessionId, termId } = req.query;

    const results = await prisma.result.findMany({
      where: { classArmId: classArmId as string, subjectId: subjectId as string, sessionId: sessionId as string, termId: termId as string },
      include: { student: { select: { firstName: true, lastName: true, admissionNumber: true } } },
      orderBy: { totalScore: "desc" },
    });

    if (results.length === 0) {
      return successResponse(res, { average: 0, highest: 0, lowest: 0, passRate: 0, gradeDistribution: [], students: [] });
    }

    const scores = results.map((r) => r.totalScore || 0);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passCount = results.filter((r) => r.grade && r.grade !== "F").length;
    const passRate = (passCount / results.length) * 100;

    const gradeCounts: Record<string, number> = {};
    results.forEach((r) => {
      const g = r.grade || "Ungraded";
      gradeCounts[g] = (gradeCounts[g] || 0) + 1;
    });
    const gradeDistribution = Object.entries(gradeCounts).map(([grade, count]) => ({ grade, count }));

    const students = results.map((r) => ({
      name: `${r.student.firstName} ${r.student.lastName}`,
      admissionNumber: r.student.admissionNumber,
      totalScore: r.totalScore,
      grade: r.grade,
    }));

    return successResponse(res, { average, highest, lowest, passRate, gradeDistribution, students });
  } catch (error) { throw error; }
};

// Weekly attendance percentage trend for a class across a term — good for spotting
// a slide in engagement over the term.
export const getAttendanceTrend = async (req: Request, res: Response) => {
  try {
    const { classArmId, sessionId, termId } = req.query;

    const attendances = await prisma.attendance.findMany({
      where: { classArmId: classArmId as string, sessionId: sessionId as string, termId: termId as string },
      orderBy: { date: "asc" },
    });

    if (attendances.length === 0) {
      return successResponse(res, { weeks: [], overallRate: 0 });
    }

    // Group by ISO week number relative to the first recorded date in the term.
    const firstDate = attendances[0].date;
    const weekBuckets: Record<number, { present: number; total: number }> = {};
    attendances.forEach((a) => {
      const daysSinceStart = Math.floor((new Date(a.date).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(daysSinceStart / 7) + 1;
      if (!weekBuckets[weekIndex]) weekBuckets[weekIndex] = { present: 0, total: 0 };
      weekBuckets[weekIndex].total++;
      if (a.status === "PRESENT" || a.status === "LATE") weekBuckets[weekIndex].present++;
    });

    const weeks = Object.entries(weekBuckets)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([week, data]) => ({
        week: `Week ${week}`,
        rate: Math.round((data.present / data.total) * 100),
      }));

    const totalPresent = attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const overallRate = Math.round((totalPresent / attendances.length) * 100);

    return successResponse(res, { weeks, overallRate });
  } catch (error) { throw error; }
};

// Submission completion rate per assignment for a teacher (or a specific class).
export const getAssignmentCompletion = async (req: Request, res: Response) => {
  try {
    const { teacherId, classArmId, sessionId, termId } = req.query;
    const where: any = {};
    if (teacherId) where.teacherId = teacherId as string;
    if (classArmId) where.classArmId = classArmId as string;
    if (sessionId) where.sessionId = sessionId as string;
    if (termId) where.termId = termId as string;

    const assignments = await prisma.assignment.findMany({
      where,
      include: { submissions: true, classArm: true },
      orderBy: { dueDate: "desc" },
      take: 15,
    });

    const data = await Promise.all(
      assignments.map(async (a) => {
        const enrolledCount = await prisma.studentEnrollment.count({ where: { classArmId: a.classArmId, sessionId: a.sessionId } });
        const submittedCount = a.submissions.length;
        const gradedScores = a.submissions.filter((s) => s.score !== null).map((s) => s.score as number);
        const avgScore = gradedScores.length > 0 ? gradedScores.reduce((x, y) => x + y, 0) / gradedScores.length : null;
        return {
          title: a.title,
          className: a.classArm?.fullName,
          submitted: submittedCount,
          total: enrolledCount,
          completionRate: enrolledCount > 0 ? Math.round((submittedCount / enrolledCount) * 100) : 0,
          avgScore,
        };
      })
    );

    return successResponse(res, data);
  } catch (error) { throw error; }
};
