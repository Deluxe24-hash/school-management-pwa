import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Create default admin
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: {
      email: "admin@school.com",
      password: adminPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.staff.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      staffId: "STF/2026/001",
      firstName: "System",
      lastName: "Administrator",
      gender: "OTHER",
      phone: "+2340000000000",
    },
  });

  // Create default school settings
  await prisma.schoolSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      schoolName: "Demo School",
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

  // Create sample classes
  const classes = [
    { name: "JSS 1", level: "JSS" },
    { name: "JSS 2", level: "JSS" },
    { name: "JSS 3", level: "JSS" },
    { name: "SS 1", level: "SSS" },
    { name: "SS 2", level: "SSS" },
    { name: "SS 3", level: "SSS" },
  ];

  for (const cls of classes) {
    await prisma.class.upsert({
      where: { name: cls.name },
      update: {},
      create: cls,
    });
  }

  // Create sample subjects
  const subjects = [
    { name: "Mathematics", code: "MATH", category: "Science" },
    { name: "English Language", code: "ENG", category: "Arts" },
    { name: "Physics", code: "PHY", category: "Science" },
    { name: "Chemistry", code: "CHEM", category: "Science" },
    { name: "Biology", code: "BIO", category: "Science" },
    { name: "Geography", code: "GEO", category: "Arts" },
    { name: "History", code: "HIST", category: "Arts" },
    { name: "Economics", code: "ECO", category: "Commercial" },
  ];

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: {},
      create: subject,
    });
  }

  console.log("Seed completed successfully!");
  console.log("Default admin credentials:");
  console.log("Email: admin@school.com");
  console.log("Password: Admin@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
