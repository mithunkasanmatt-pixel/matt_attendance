const { PrismaClient } = require('./src/generated/prisma'); const prisma = new PrismaClient(); prisma.attendance.findMany().then(console.log);
