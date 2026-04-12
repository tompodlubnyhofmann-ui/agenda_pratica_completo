/**
 * GET /api/health
 * Verifica se o servidor está online
 */
module.exports = async (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: '🟢 Servidor Vercel Cron está funcionando!'
  });
};
