const { startWorker } = require('../config/queue');
const sendEmail = require('../utils/sendEmail');

const start = () => {
  const worker = startWorker('email', async (job) => {
    const { email, subject, message } = job.data;
    await sendEmail({ email, subject, message });
  });
  if (worker) {
    console.log('[email-worker] started');
  }
};

module.exports = { start };
