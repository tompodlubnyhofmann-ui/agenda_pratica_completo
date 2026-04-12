const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore();

/**
 * POST /api/register-token
 * Registra um FCM token para um usuário
 * 
 * Body: { userId: string, token: string }
 */
module.exports = async (req, res) => {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ error: 'userId e token são obrigatórios' });
  }

  try {
    // Salvar token no Firestore
    await db.collection('users').doc(userId).collection('fcmTokens').doc(token).set({
      createdAt: new Date(),
      active: true,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    console.log(`✅ Token registrado para usuário: ${userId}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Token registrado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao registrar token:', error.message);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
