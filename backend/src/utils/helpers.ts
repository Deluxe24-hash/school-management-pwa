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
