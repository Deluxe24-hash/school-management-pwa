import { PrismaClient, UserRole, Gender } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const hash = (plain: string) => bcrypt.hash(plain, 12);

async function main() {
  console.log("Starting database seed...");

  // ---------------------------------------------------------------------
  // 1. School settings
  // ---------------------------------------------------------------------
  await prisma.schoolSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      schoolName: "Sunrise Model College",
      motto: "Excellence in Education",
      primaryColor: "#2563eb",
      secondaryColor: "#1e40af",
      currency: "NGN",
      caWeight: 40,
      examWeight: 60,
      gradingSystem: [
        { grade: "A", min: 70, max: 100, remark: "Excellent", gp: 5.0 },
        { grade: "B", min: 60, max: 69, remark: "Very Good", gp: 4.0 },
        { grade: "C", min: 50, max: 59, remark: "Good", gp: 3.0 },
        { grade: "D", min: 45, max: 49, remark: "Fair", gp: 2.0 },
        { grade: "E", min: 40, max: 44, remark: "Pass", gp: 1.0 },
        { grade: "F", min: 0, max: 39, remark: "Fail", gp: 0.0 },
      ],
    },
  });

  // ---------------------------------------------------------------------
  // 2. Super admin
  // ---------------------------------------------------------------------
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: { email: "admin@school.com", password: await hash("Admin@123"), role: UserRole.SUPER_ADMIN },
  });
  await prisma.staff.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id, staffId: "STF/2026/001", firstName: "System", lastName: "Administrator",
      gender: Gender.OTHER, phone: "+2340000000000",
    },
  });

  // ---------------------------------------------------------------------
  // 3. Academic session + terms
  // ---------------------------------------------------------------------
  const existingSession = await prisma.academicSession.findFirst({ where: { name: "2025/2026" } });
  const session = existingSession || await prisma.academicSession.create({
    data: {
      name: "2025/2026", startDate: new Date("2025-09-08"), endDate: new Date("2026-07-24"),
      status: "ACTIVE" as any, isCurrent: true,
    },
  });
  const termDefs = [
    { name: "First Term", start: "2025-09-08", end: "2025-12-12", current: true },
    { name: "Second Term", start: "2026-01-05", end: "2026-04-02", current: false },
    { name: "Third Term", start: "2026-04-20", end: "2026-07-24", current: false },
  ];
  const terms: Record<string, any> = {};
  for (const t of termDefs) {
    terms[t.name] = await prisma.term.upsert({
      where: { sessionId_name: { sessionId: session.id, name: t.name } },
      update: {},
      create: {
        sessionId: session.id, name: t.name, startDate: new Date(t.start), endDate: new Date(t.end),
        status: (t.current ? "OPEN" : "PENDING") as any, isCurrent: t.current,
      },
    });
  }
  const firstTerm = terms["First Term"];

  // ---------------------------------------------------------------------
  // 4. Classes + arms (JSS1A, JSS1B and SS1A fully populated for the demo;
  //    the rest exist structurally so the school "looks" real without
  //    needing dozens of demo logins)
  // ---------------------------------------------------------------------
  const classDefs = [
    { name: "JSS 1", level: "JSS" }, { name: "JSS 2", level: "JSS" }, { name: "JSS 3", level: "JSS" },
    { name: "SS 1", level: "SSS" }, { name: "SS 2", level: "SSS" }, { name: "SS 3", level: "SSS" },
  ];
  const classes: Record<string, any> = {};
  for (const c of classDefs) {
    const existingClass = await prisma.class.findFirst({ where: { name: c.name } });
    classes[c.name] = existingClass || await prisma.class.create({ data: c });
  }

  const armDefs = [
    { class: "JSS 1", name: "A" }, { class: "JSS 1", name: "B" },
    { class: "JSS 2", name: "A" }, { class: "JSS 3", name: "A" },
    { class: "SS 1", name: "A" }, { class: "SS 2", name: "A" }, { class: "SS 3", name: "A" },
  ];
  const arms: Record<string, any> = {};
  for (const a of armDefs) {
    const cls = classes[a.class];
    const fullName = `${a.class}${a.name}`;
    const existing = await prisma.classArm.findFirst({ where: { classId: cls.id, name: a.name } });
    arms[fullName] = existing || await prisma.classArm.create({ data: { classId: cls.id, name: a.name, fullName } });
  }

  // ---------------------------------------------------------------------
  // 5. Subjects + class-subject-teacher assignments
  // ---------------------------------------------------------------------
  const subjectDefs = [
    { name: "Mathematics", code: "MATH", category: "Science" },
    { name: "English Language", code: "ENG", category: "Arts" },
    { name: "Physics", code: "PHY", category: "Science" },
    { name: "Chemistry", code: "CHEM", category: "Science" },
    { name: "Biology", code: "BIO", category: "Science" },
    { name: "Geography", code: "GEO", category: "Arts" },
    { name: "History", code: "HIST", category: "Arts" },
    { name: "Economics", code: "ECO", category: "Commercial" },
  ];
  const subjects: Record<string, any> = {};
  for (const s of subjectDefs) {
    subjects[s.code] = await prisma.subject.upsert({ where: { code: s.code }, update: {}, create: s });
  }

  // ---------------------------------------------------------------------
  // 6. Teachers — a mix of form teachers and subject-only teachers, so the
  //    demo shows off the scoping differences between the two.
  // ---------------------------------------------------------------------
  const teacherDefs = [
    { email: "ifeoma.nwachukwu@school.com", first: "Ifeoma", last: "Nwachukwu", form: "JSS 1A", subjects: [{ code: "MATH", class: "JSS 1" }] },
    { email: "emeka.obi@school.com", first: "Emeka", last: "Obi", form: "JSS 1B", subjects: [{ code: "ENG", class: "JSS 1" }] },
    { email: "chidinma.eze@school.com", first: "Chidinma", last: "Eze", form: "SS 1A", subjects: [{ code: "BIO", class: "SS 1" }] },
    { email: "tunde.bakare@school.com", first: "Tunde", last: "Bakare", form: null, subjects: [{ code: "MATH", class: "SS 1" }, { code: "PHY", class: "SS 1" }] },
    { email: "grace.okon@school.com", first: "Grace", last: "Okon", form: null, subjects: [{ code: "GEO", class: "JSS 1" }, { code: "HIST", class: "JSS 1" }, { code: "CHEM", class: "SS 1" }] },
  ];
  const teachers: Record<string, any> = {};
  for (const t of teacherDefs) {
    const user = await prisma.user.upsert({
      where: { email: t.email }, update: {},
      create: { email: t.email, password: await hash("Teacher@123"), role: UserRole.TEACHER },
    });
    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id }, update: {},
      create: {
        userId: user.id, teacherId: `TCH/2026/${String(Object.keys(teachers).length + 1).padStart(3, "0")}`,
        firstName: t.first, lastName: t.last, gender: Gender.OTHER, phone: "+2348000000000",
        qualification: "B.Ed", department: "Academics", dateEmployed: new Date("2023-09-01"),
      },
    });
    teachers[t.email] = teacher;
    if (t.form) {
      await prisma.classArm.update({ where: { id: arms[t.form].id }, data: { classTeacherId: teacher.id } });
    }
    for (const s of t.subjects) {
      const cls = classes[s.class];
      await prisma.classSubject.upsert({
        where: { classId_subjectId: { classId: cls.id, subjectId: subjects[s.code].id } },
        update: { teacherId: teacher.id },
        create: { classId: cls.id, subjectId: subjects[s.code].id, teacherId: teacher.id },
      });
    }
  }

  // ---------------------------------------------------------------------
  // 7. Parents + students — 8 each in JSS1A, JSS1B, SS1A (24 total),
  //    with sibling pairs sharing a parent for realism.
  // ---------------------------------------------------------------------
  const firstNames = ["Chinedu", "Amaka", "Bola", "Femi", "Ngozi", "Yusuf", "Zainab", "Kelechi", "Adaeze", "Segun", "Blessing", "Tobi", "Halima", "Uche", "Ifeanyi", "Rita", "Chukwuemeka", "Fatima", "Damilola", "Obinna", "Precious", "Musa", "Chiamaka", "Wale"];
  const lastNames = ["Okafor", "Adeyemi", "Balogun", "Eze", "Bello", "Nwosu", "Ibrahim", "Uzoma", "Afolabi", "Chukwu", "Danladi", "Osei"];

  let studentCount = 0;
  const classArmPlan = [
    { arm: "JSS 1A" }, { arm: "JSS 1B" }, { arm: "SS 1A" },
  ];
  const jss1aStudents: any[] = [];
  let lastParent: any = null;

  for (const plan of classArmPlan) {
    for (let i = 0; i < 8; i++) {
      studentCount++;
      const fn = firstNames[studentCount % firstNames.length];
      const ln = lastNames[studentCount % lastNames.length];
      const admissionNumber = `ADM/2026/${String(studentCount).padStart(4, "0")}`;

      let parent;
      if (studentCount % 3 === 0 && lastParent) {
        parent = lastParent;
      } else {
        const parentUser = await prisma.user.upsert({
          where: { email: `parent${studentCount}@school.com` }, update: {},
          create: { email: `parent${studentCount}@school.com`, password: await hash("Parent@123"), role: UserRole.PARENT },
        });
        const parentFirstName = firstNames[(studentCount + 11) % firstNames.length];
        parent = await prisma.parent.upsert({
          where: { userId: parentUser.id }, update: {},
          create: { userId: parentUser.id, firstName: parentFirstName, lastName: ln, phone: "+2348011111111", relationship: "Father" },
        });
      }
      lastParent = parent;

      const studentUser = await prisma.user.upsert({
        where: { email: `student${studentCount}@school.com` }, update: {},
        create: { email: `student${studentCount}@school.com`, password: await hash("Student@123"), role: UserRole.STUDENT },
      });
      const student = await prisma.student.upsert({
        where: { admissionNumber }, update: {},
        create: {
          admissionNumber, firstName: fn, lastName: ln, gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
          dateOfBirth: new Date(2012 - (plan.arm.startsWith("SS") ? 4 : 0), i % 12, (i % 27) + 1),
          userId: studentUser.id, parentId: parent.id,
        },
      });
      await prisma.studentEnrollment.upsert({
        where: { studentId_sessionId: { studentId: student.id, sessionId: session.id } },
        update: { classArmId: arms[plan.arm].id },
        create: { studentId: student.id, classArmId: arms[plan.arm].id, sessionId: session.id },
      });

      if (plan.arm === "JSS 1A") jss1aStudents.push({ student, parent });
    }
  }
  console.log(`Seeded ${studentCount} students across 3 populated class arms.`);

  // ---------------------------------------------------------------------
  // 8. Attendance — last 5 weekdays for JSS 1A, marked by its form teacher
  // ---------------------------------------------------------------------
  const formTeacherJss1a = teachers["ifeoma.nwachukwu@school.com"];
  const today = new Date();
  let daysAdded = 0, dayOffset = 1;
  while (daysAdded < 5) {
    const d = new Date(today);
    d.setDate(d.getDate() - dayOffset);
    dayOffset++;
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    daysAdded++;
    for (const { student } of jss1aStudents) {
      const roll = Math.random();
      const status = roll > 0.9 ? "ABSENT" : roll > 0.8 ? "LATE" : "PRESENT";
      const existing = await prisma.attendance.findFirst({ where: { studentId: student.id, date: d } });
      if (existing) continue;
      await prisma.attendance.create({
        data: {
          date: d, status: status as any,
          studentId: student.id, classArmId: arms["JSS 1A"].id, teacherId: formTeacherJss1a.id,
          sessionId: session.id, termId: firstTerm.id,
        },
      });
    }
  }

  // ---------------------------------------------------------------------
  // 9. Assignments — one published, one still pending admin review, per
  //    populated class, to demonstrate the publish workflow.
  // ---------------------------------------------------------------------
  const dueSoon = new Date(); dueSoon.setDate(dueSoon.getDate() + 7);
  await prisma.assignment.create({
    data: {
      title: "Algebra Worksheet — Chapter 3", description: "Solve all 20 questions and show your working.",
      type: "HOMEWORK" as any, maxScore: 20, dueDate: dueSoon, teacherId: formTeacherJss1a.id,
      subjectId: subjects["MATH"].id, classArmId: arms["JSS 1A"].id, sessionId: session.id, termId: firstTerm.id,
      isPublished: true, publishedAt: new Date(), publishedBy: adminUser.id,
    },
  });
  await prisma.assignment.create({
    data: {
      title: "Fractions Quiz", description: "Short in-class quiz on fractions and decimals.",
      type: "CLASSWORK" as any, maxScore: 10, dueDate: dueSoon, teacherId: formTeacherJss1a.id,
      subjectId: subjects["MATH"].id, classArmId: arms["JSS 1A"].id, sessionId: session.id, termId: firstTerm.id,
      isPublished: false,
    },
  });
  const bioTeacher = teachers["chidinma.eze@school.com"];
  await prisma.assignment.create({
    data: {
      title: "Cell Structure Diagram", description: "Label a plant and animal cell.",
      type: "HOMEWORK" as any, maxScore: 15, dueDate: dueSoon, teacherId: bioTeacher.id,
      subjectId: subjects["BIO"].id, classArmId: arms["SS 1A"].id, sessionId: session.id, termId: firstTerm.id,
      isPublished: true, publishedAt: new Date(), publishedBy: adminUser.id,
    },
  });

  // ---------------------------------------------------------------------
  // 10. Fees — one published batch (JSS1A tuition), one still pending
  //     publish (SS1A development levy), to demonstrate that workflow.
  // ---------------------------------------------------------------------
  const tuitionItem = await prisma.feeItem.upsert({
    where: { id: "tuition-default" }, update: {},
    create: { id: "tuition-default", name: "Tuition Fee", description: "Termly tuition", isMandatory: true },
  });
  const levyItem = await prisma.feeItem.upsert({
    where: { id: "levy-default" }, update: {},
    create: { id: "levy-default", name: "Development Levy", description: "Annual development levy", isMandatory: true },
  });

  const jss1aFees: any[] = [];
  for (const { student } of jss1aStudents) {
    const existingFee = await prisma.fee.findFirst({ where: { studentId: student.id, feeItemId: tuitionItem.id, termId: firstTerm.id } });
    const fee = existingFee || await prisma.fee.create({
      data: {
        amount: 45000, studentId: student.id, feeItemId: tuitionItem.id, classArmId: arms["JSS 1A"].id,
        sessionId: session.id, termId: firstTerm.id, isPublished: true, publishedAt: new Date(), publishedBy: adminUser.id,
      },
    });
    jss1aFees.push({ student, fee });
  }
  const ss1aStudents = await prisma.student.findMany({
    where: { enrollments: { some: { classArmId: arms["SS 1A"].id, sessionId: session.id } } },
  });
  for (const student of ss1aStudents) {
    const existingLevy = await prisma.fee.findFirst({ where: { studentId: student.id, feeItemId: levyItem.id, termId: firstTerm.id } });
    if (existingLevy) continue;
    await prisma.fee.create({
      data: {
        amount: 5000, studentId: student.id, feeItemId: levyItem.id, classArmId: arms["SS 1A"].id,
        sessionId: session.id, termId: firstTerm.id, isPublished: false,
      },
    });
  }

  if (jss1aFees[0]) {
    const already = await prisma.payment.findFirst({ where: { feeId: jss1aFees[0].fee.id } });
    if (!already) {
      await prisma.payment.create({
        data: {
          amount: 45000, reference: `PAY-DEMO-${Date.now()}-1`, status: "SUCCESSFUL" as any, method: "BANK_TRANSFER" as any,
          paidAt: new Date(), submittedNote: "GTBank transfer", studentId: jss1aFees[0].student.id, feeId: jss1aFees[0].fee.id,
          processedById: adminUser.id,
        },
      });
    }
  }
  if (jss1aFees[1]) {
    const already = await prisma.payment.findFirst({ where: { feeId: jss1aFees[1].fee.id } });
    if (!already) {
      await prisma.payment.create({
        data: {
          amount: 45000, reference: `PAY-DEMO-${Date.now()}-2`, status: "PENDING" as any, method: "CASH_DEPOSIT" as any,
          submittedNote: "Deposited at school bursary, awaiting confirmation", studentId: jss1aFees[1].student.id, feeId: jss1aFees[1].fee.id,
        },
      });
    }
  }

  // ---------------------------------------------------------------------
  // 11. Results — Mathematics locked/submitted, English still open, for
  //     every JSS1A student; two published report cards to show that flow.
  // ---------------------------------------------------------------------
  const grading = [
    { grade: "A", min: 70, gp: 5 }, { grade: "B", min: 60, gp: 4 }, { grade: "C", min: 50, gp: 3 },
    { grade: "D", min: 45, gp: 2 }, { grade: "E", min: 40, gp: 1 }, { grade: "F", min: 0, gp: 0 },
  ];
  const gradeFor = (score: number) => grading.find((g) => score >= g.min) || grading[grading.length - 1];

  for (const { student } of jss1aStudents) {
    const mathCa = 15 + Math.floor(Math.random() * 15);
    const mathExam = 35 + Math.floor(Math.random() * 25);
    const mathTotal = mathCa + mathExam;
    const mathGrade = gradeFor(mathTotal);
    const existingMath = await prisma.result.findFirst({ where: { studentId: student.id, subjectId: subjects["MATH"].id, termId: firstTerm.id } });
    if (!existingMath) {
      await prisma.result.create({
        data: {
          studentId: student.id, subjectId: subjects["MATH"].id, classArmId: arms["JSS 1A"].id, teacherId: formTeacherJss1a.id,
          sessionId: session.id, termId: firstTerm.id, caScore: mathCa, examScore: mathExam, totalScore: mathTotal,
          grade: mathGrade.grade, gradePoint: mathGrade.gp, isLocked: true,
        },
      });
    }

    const engTeacher = teachers["emeka.obi@school.com"];
    const engCa = 15 + Math.floor(Math.random() * 15);
    const engExam = 35 + Math.floor(Math.random() * 25);
    const engTotal = engCa + engExam;
    const engGrade = gradeFor(engTotal);
    const existingEng = await prisma.result.findFirst({ where: { studentId: student.id, subjectId: subjects["ENG"].id, termId: firstTerm.id } });
    if (!existingEng) {
      await prisma.result.create({
        data: {
          studentId: student.id, subjectId: subjects["ENG"].id, classArmId: arms["JSS 1A"].id, teacherId: engTeacher.id,
          sessionId: session.id, termId: firstTerm.id, caScore: engCa, examScore: engExam, totalScore: engTotal,
          grade: engGrade.grade, gradePoint: engGrade.gp, isLocked: false,
        },
      });
    }
  }

  for (const { student } of jss1aStudents.slice(0, 2)) {
    const results = await prisma.result.findMany({ where: { studentId: student.id, sessionId: session.id, termId: firstTerm.id } });
    const totalScore = results.reduce((s, r) => s + (r.totalScore || 0), 0);
    await prisma.reportCard.upsert({
      where: { studentId_sessionId_termId: { studentId: student.id, sessionId: session.id, termId: firstTerm.id } },
      update: {},
      create: {
        studentId: student.id, classArmId: arms["JSS 1A"].id, sessionId: session.id, termId: firstTerm.id,
        totalSubjects: results.length, totalScore, average: results.length ? totalScore / results.length : 0,
        classPosition: 1, classSize: jss1aStudents.length,
        attendancePresent: 4, attendanceAbsent: 1, attendanceLate: 0, attendanceExcused: 0,
        teacherRemark: "A pleasure to teach. Keep up the good work.", principalRemark: "Well done this term.",
        isPublished: true, publishedAt: new Date(), publishedBy: adminUser.id,
      },
    });
  }

  // ---------------------------------------------------------------------
  // 12. Announcements
  // ---------------------------------------------------------------------
  await prisma.announcement.create({
    data: {
      title: "Welcome to the 2025/2026 Session", content: "We're excited to begin a new academic year. Please check the school calendar for key dates.",
      priority: "normal", targetRoles: ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER", "PARENT", "STUDENT"] as any,
      targetClassArms: [], publishedBy: adminUser.id,
    },
  });
  await prisma.announcement.create({
    data: {
      title: "First Term Fees Now Due", content: "Please log in to the Fees section to view and pay your child's outstanding fees for this term.",
      priority: "high", targetRoles: ["PARENT"] as any, targetClassArms: [], publishedBy: adminUser.id,
    },
  });

  console.log("\nSeed completed successfully!\n");
  console.log("Demo logins (all @school.com):");
  console.log("  Super Admin : admin@school.com / Admin@123");
  console.log("  Form Teacher: ifeoma.nwachukwu@school.com / Teacher@123  (JSS 1A)");
  console.log("  Subj Teacher: tunde.bakare@school.com / Teacher@123  (Math & Physics, SS 1)");
  console.log("  Parent      : parent1@school.com / Parent@123");
  console.log("  Student     : student1@school.com / Student@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
