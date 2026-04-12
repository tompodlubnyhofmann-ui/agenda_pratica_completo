const admin = require('firebase-admin');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
let FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error('Missing Firebase environment variables.');
  process.exit(1);
}

FIREBASE_PRIVATE_KEY = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

const serviceAccount = {
  projectId: FIREBASE_PROJECT_ID,
  clientEmail: FIREBASE_CLIENT_EMAIL,
  privateKey: FIREBASE_PRIVATE_KEY
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: FIREBASE_PROJECT_ID
});

const db = admin.firestore();
const messaging = admin.messaging();

async function main() {
  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`🔔 Iniciando envio de notificações para o dia ${hoje}`);

  const usersSnapshot = await db.collection('users').get();
  let sent = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const eventsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('events')
      .get();

    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      let ehHoje = false;

      if (eventData.type === 'aniversario') {
        const [month, day] = eventData.birthdayKey ? eventData.birthdayKey.split('-') : [null, null];
        const hojeParts = hoje.split('/');
        const hojeDay = hojeParts[0];
        const hojeMonth = hojeParts[1];
        ehHoje = day === hojeDay && month === hojeMonth;
      } else {
        ehHoje = eventData.date === hoje;
      }

      if (!ehHoje) continue;

      const tokensSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('fcmTokens')
        .where('active', '==', true)
        .get();

      for (const tokenDoc of tokensSnapshot.docs) {
        const token = tokenDoc.id;

        try {
          await messaging.send({
            token,
            notification: {
              title: 'Agenda Prática',
              body: `${eventData.title || 'Lembrete'} - ${eventData.time || 'Sem horário definido'}`
            },
            webpush: {
              fcmOptions: {
                link: 'https://agenda-pratica2.web.app'
              },
              notification: {
                icon: 'https://agenda-pratica2.web.app/icon-192.png',
                badge: 'https://agenda-pratica2.web.app/icon-192.png',
                vibrate: [200, 100, 200]
              }
            }
          });

          sent += 1;
          console.log(`✅ Notificação enviada para ${token.substring(0, 16)}...`);
        } catch (error) {
          if (error.code === 'messaging/registration-token-not-registered') {
            await tokenDoc.ref.delete();
            console.log(`🗑️ Token inválido removido: ${token.substring(0, 16)}...`);
          } else {
            console.error('❌ Erro ao enviar notificação:', error.message);
          }
        }
      }
    }
  }

  console.log(`✨ Envio finalizado. Total de notificações enviadas: ${sent}`);
}

main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});