export const generateAdmissionNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ADM/${year}/${random}`;
};

export const generateReference = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `PAY-${timestamp}-${random}`;
};

export const calculateGrade = (
  score: number,
  gradingSystem: Array<{ grade: string; min: number; max: number; remark: string; gp: number }>
): { grade: string; remark: string; gradePoint: number } => {
  const sorted = [...gradingSystem].sort((a, b) => b.min - a.min);
  for (const g of sorted) {
    if (score >= g.min && score <= g.max) {
      return { grade: g.grade, remark: g.remark, gradePoint: g.gp };
    }
  }
  return { grade: "F", remark: "Fail", gradePoint: 0 };
};

// Computes what a teacher is actually scoped to see/manage, distinguishing form
// (homeroom) teacher duties from subject-teacher duties. Used across students, classes,
// subjects, results, and report cards so a teacher only sees their own remit.
export const getTeacherScope = async (prisma: any, teacherId: string) => {
  const [formClassArms, classSubjects] = await Promise.all([
    prisma.classArm.findMany({ where: { classTeacherId: teacherId }, select: { id: true, classId: true } }),
    prisma.classSubject.findMany({ where: { teacherId }, select: { classId: true, subjectId: true } }),
  ]);

  const formClassArmIds: string[] = formClassArms.map((a: any) => a.id);
  const subjectIds: string[] = [...new Set(classSubjects.map((cs: any) => cs.subjectId))] as string[];
  const subjectClassIds: string[] = [...new Set(classSubjects.map((cs: any) => cs.classId))] as string[];

  const subjectClassArms = subjectClassIds.length
    ? await prisma.classArm.findMany({ where: { classId: { in: subjectClassIds } }, select: { id: true, classId: true } })
    : [];
  const subjectClassArmIds: string[] = subjectClassArms.map((a: any) => a.id);

  return {
    formClassArmIds,
    subjectIds,
    subjectClassIds,
    subjectClassArmIds,
    allClassArmIds: [...new Set([...formClassArmIds, ...subjectClassArmIds])],
    classSubjects, // raw {classId, subjectId} pairs, for exact per-class subject checks
  };
};
