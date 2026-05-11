const cron = require('node-cron');
const vencimientoJob = require('./vencimiento.job');
const otpCleanupJob = require('./otp.cleanup.job');

function initJobs() {
  // Diario 08:00 AM hora Uruguay (UTC-3)
  cron.schedule('0 11 * * *', async () => {
    console.log('[CRON] Ejecutando job de vencimientos...');
    await vencimientoJob();
  }, { timezone: 'America/Montevideo' });

  // Cada hora: limpieza de OTPs expirados
  cron.schedule('0 * * * *', async () => {
    await otpCleanupJob();
  });

  console.log('[CRON] Jobs inicializados.');
}

module.exports = { initJobs };
