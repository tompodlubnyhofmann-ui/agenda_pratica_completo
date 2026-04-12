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
const messaging = admin.messaging();

/**
 * CRON FUNCTION - Executa 4x ao dia para verificar e enviar notificações
 * Horários: 8h, 12h, 17h, 20h (São Paulo/Brasília)
 */
module.exports = async (req, res) => {
  console.log('🔔 [CRON] Iniciando verificação de eventos...');
  
  try {
    const hoje = new Date().toLocaleDateString('pt-BR', { 
      timeZone: 'America/Sao_Paulo' 
    });
    
    console.log(`📅 Data verificada: ${hoje}`);
    
    // Buscar TODOS os usuários
    const usersSnapshot = await db.collection('users').get();
    let notificationsSent = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      // Buscar eventos do usuário
      const eventsSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('events')
        .get();

      for (const eventDoc of eventsSnapshot.docs) {
        const evento = eventDoc.data();
        let ehHoje = false;

        // Verificar data do evento
        if (evento.type === 'aniversario') {
          // Aniversário: compare MM-DD
          const eventMD = evento.birthdayKey; // formato: "05-15"
          const hojeMD = hoje.split('/').slice(1).reverse().join('-'); // "DD/MM/YYYY" → "MM-DD"
          ehHoje = eventMD === hojeMD;
        } else {
          // Evento regular: compare DD/MM/YYYY
          ehHoje = evento.date === hoje;
        }

        if (ehHoje) {
          // 🎯 Evento encontrado para hoje! Enviar notificação
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
                data: {
                  type: evento.type || 'evento',
                  title: evento.title || 'Evento'
                },
                notification: {
                  title: '📅 Lembrete da Agenda',
                  body: `${evento.title} - ${evento.time || 'Horário não definido'}`,
                  icon: 'https://agenda-pratica2.web.app/icon-192.png'
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

              console.log(`✅ Notificação enviada para ${token.substring(0, 20)}...`);
              notificationsSent++;
            } catch (error) {
              if (error.code === 'messaging/registration-token-not-registered') {
                // Token inválido, remover
                await tokenDoc.ref.delete();
                console.log(`🗑️ Token removido (inválido): ${token.substring(0, 20)}...`);
              } else {
                console.error(`❌ Erro ao enviar para token:`, error.message);
              }
            }
          }
        }
      }
    }

    console.log(`✨ CRON finalizado - ${notificationsSent} notificações enviadas`);
    return res.status(200).json({ 
      success: true, 
      message: `Verificação completa: ${notificationsSent} notificações enviadas`
    });
  } catch (error) {
    console.error('❌ Erro na função CRON:', error.message);
    return res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
};
