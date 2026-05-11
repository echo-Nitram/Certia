const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function otpCleanupJob() {
  const eliminados = await prisma.otpCode.deleteMany({
    where: {
      OR: [
        { expiraEn: { lt: new Date() } },
        { usado: true },
      ],
    },
  });
  if (eliminados.count > 0) {
    console.log(`[CRON] OTPs eliminados: ${eliminados.count}`);
  }
}

module.exports = otpCleanupJob;
