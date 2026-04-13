const admin = require('firebase-admin');

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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { userId, event, eventId, action } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId obrigatorio' });

  try {
    if (action === 'delete') {
      await db.collection('users').doc(userId).collection('events').doc(eventId).delete();
      return res.status(200).json({ success: true, message: 'Evento deletado' });
    }

    if (!event) return res.status(400).json({ error: 'event obrigatorio' });

    await db.collection('users').doc(userId).collection('events').doc(event.id).set(event);
    return res.status(200).json({ success: true, message: 'Evento salvo' });

  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ error: error.message });
  }
};