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

function addDias(dateStr, dias) {
  const parts = dateStr.split('/');
  const d = new Date(parts[2], parts[1] - 1, parts[0]);
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

async function main() {
  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log('Iniciando envio de notificacoes para o dia ' + hoje);

  const usersSnapshot = await db.collection('users').get();
  let sent = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const eventsSnapshot = await db.collection('users').doc(userId).collection('events').get();

    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      let deveNotificar = false;
      let mensagemAviso = '';

      if (eventData.type === 'aniversario') {
        const [month, day] = eventData.birthdayKey ? eventData.birthdayKey.split('-') : [null, null];
        const hojeParts = hoje.split('/');
        deveNotificar = day === hojeParts[0] && month === hojeParts[1];
        mensagemAviso = 'Hoje!';
      } else {
        const advance = parseInt(eventData.advance) || 0;
        if (eventData.date === hoje) {
          deveNotificar = true;
          mensagemAviso = 'Hoje!';
        } else if (advance > 0) {
          const dataAviso = addDias(eventData.date, -advance);
          if (dataAviso === hoje) {
            deveNotificar = true;
            mensagemAviso = advance + ' dia(s) antes';
          }
        }
      }

      if (!deveNotificar) continue;

      const tokensSnapshot = await db.collection('users').doc(userId).collection('fcmTokens').where('active', '==', true).get();

      for (const tokenDoc of tokensSnapshot.docs) {
        const token = tokenDoc.id;
        try {
          await messaging.send({
            token,
            notification: {
              title: 'Agenda Pratica',
              body: (eventData.title || 'Lembrete') + ' - ' + (eventData.time || 'Sem horario') + ' (' + mensagemAviso + ')'
            },
            webpush: {
              fcmOptions: { link: 'https://agenda-pratica2.web.app' },
              notification: {
                icon: 'https://agenda-pratica2.web.app/icon-192.png',
                badge: 'https://agenda-pratica2.web.app/icon-192.png',
                vibrate: [200, 100, 200]
              }
            }
          });
          sent += 1;
          console.log('Notificacao enviada: ' + token.substring(0, 16));
        } catch (error) {
          if (error.code === 'messaging/registration-token-not-registered') {
            await tokenDoc.ref.delete();
          } else {
            console.error('Erro ao enviar:', error.message);
          }
        }
      }
    }
  }
  console.log('Envio finalizado. Total: ' + sent);
}

main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});