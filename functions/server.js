const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const admin = require('firebase-admin');
require('dotenv').config();

// ═══════════════════════════════════════════════════════════
// INICIALIZAR
// ═══════════════════════════════════════════════════════════

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar Firebase Admin
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://agenda-pratica2.firebaseapp.com"
  });
  console.log('✅ Firebase Admin inicializado');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error.message);
  // Se não encontrar arquivo, usar variáveis de ambiente
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
  });
}

const db = admin.firestore();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════════════

// Health check
app.get('/health', (req, res) => {
  res.json({ status: '✅ Servidor rodando' });
});

// Registrar token FCM
app.post('/api/register-token', async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    if (!userId || !token) {
      return res.status(400).json({ error: 'userId e token são obrigatórios' });
    }

    await db.collection('users').doc(userId).collection('fcmTokens').doc(token).set({
      createdAt: new Date(),
      active: true
    });

    console.log(`📝 Token registrado para ${userId}`);
    res.json({ success: true, message: 'Token registrado' });
  } catch (error) {
    console.error('Erro ao registrar token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Testar envio de notificação
app.post('/api/test-notification', async (req, res) => {
  try {
    const { userId, title, body } = req.body;
    
    const tokensSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .get();

    let sent = 0;
    for (const tokenDoc of tokensSnapshot.docs) {
      try {
        await admin.messaging().send({
          notification: { title, body },
          token: tokenDoc.id
        });
        sent++;
      } catch (error) {
        console.error(`Erro ao enviar para ${tokenDoc.id}:`, error.message);
      }
    }

    res.json({ success: true, messagesSent: sent });
  } catch (error) {
    console.error('Erro em test-notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// CRON JOBS - VERIFICAR EVENTOS
// ═══════════════════════════════════════════════════════════

// Função para verificar e enviar notificações
async function verificarEventos() {
  console.log(`\n⏰ [${new Date().toLocaleString('pt-BR')}] Verificando eventos...`);
  
  try {
    const agora = new Date();
    const hoje = agora.toISOString().slice(0, 10); // YYYY-MM-DD
    const hojeObj = {
      dia: String(agora.getDate()).padStart(2, '0'),
      mes: String(agora.getMonth() + 1).padStart(2, '0')
    };

    const usersSnapshot = await db.collection('users').get();
    let notificacoesEnviadas = 0;
    let eventosEncontrados = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      try {
        // Buscar tokens do usuário
        const tokensSnapshot = await db
          .collection('users')
          .doc(userId)
          .collection('fcmTokens')
          .where('active', '==', true)
          .get();

        if (tokensSnapshot.empty) {
          continue;
        }

        // Buscar eventos do usuário
        const eventsSnapshot = await db
          .collection('users')
          .doc(userId)
          .collection('events')
          .get();

        const tokens = tokensSnapshot.docs.map(doc => doc.id);

        for (const eventDoc of eventsSnapshot.docs) {
          const evento = eventDoc.data();
          let ehHoje = false;

          // Verificar se é hoje
          if (evento.type === 'aniversario') {
            // Aniversário: comparar mês/dia
            if (evento.birthdayKey) {
              const [mm, dd] = evento.birthdayKey.split('-');
              ehHoje = dd === hojeObj.dia && mm === hojeObj.mes;
            }
          } else {
            // Evento normal: comparar data completa
            ehHoje = evento.date === hoje;
          }

          if (ehHoje && !evento.done) {
            eventosEncontrados++;
            console.log(`📅 Evento encontrado: ${evento.text} (${userId})`);

            const descricao = evento.text || 'Evento agendado';
            const diasAntecedencia = parseInt(evento.advance || 0);
            
            // Verificar se já passou os dias de antecedência
            const dataNotif = new Date(agora);
            dataNotif.setDate(dataNotif.getDate() - diasAntecedencia);
            
            if (dataNotif.toISOString().slice(0, 10) <= hoje) {
              const mensagem = {
                notification: {
                  title: 'Agenda Prática 📅',
                  body: `${descricao}`
                },
                data: {
                  eventId: eventDoc.id,
                  type: evento.type,
                  click_action: 'FLUTTER_NOTIFICATION_CLICK'
                }
              };

              // Enviar para cada token
              for (const token of tokens) {
                try {
                  await admin.messaging().send({
                    ...mensagem,
                    token: token
                  });
                  notificacoesEnviadas++;
                  console.log(`✅ Notificação enviada a ${token.slice(0, 20)}...`);
                } catch (tokenError) {
                  if (tokenError.code === 'messaging/invalid-registration-token' ||
                      tokenError.code === 'messaging/registration-token-not-registered') {
                    // Token inválido, deletar
                    await db.collection('users').doc(userId).collection('fcmTokens').doc(token).delete();
                    console.log(`🗑️  Token inválido deletado: ${token.slice(0, 20)}...`);
                  } else {
                    console.error(`❌ Erro ao enviar: ${tokenError.message}`);
                  }
                }
              }
            }
          }
        }
      } catch (userError) {
        console.error(`❌ Erro ao processar usuário ${userId}:`, userError.message);
      }
    }

    console.log(`✅ Verificação concluída!`);
    console.log(`   📅 Eventos encontrados: ${eventosEncontrados}`);
    console.log(`   📤 Notificações enviadas: ${notificacoesEnviadas}`);

    return { eventosEncontrados, notificacoesEnviadas };
  } catch (error) {
    console.error('❌ ERRO na verificação:', error);
  }
}

// ═══════════════════════════════════════════════════════════
// SCHEDULE - RODAR CRON JOBS
// ═══════════════════════════════════════════════════════════

console.log('\n⏰ Agendando tarefas de notificação...');

// Roda todos os dias às 8h, 12h, 17h e 20h
cron.schedule('0 8,12,17,20 * * *', async () => {
  console.log('🔔 Executando cron job programado');
  await verificarEventos();
});

// Roda a cada 30 minutos (para teste)
// Descomente para testar mais frequentemente
// cron.schedule('*/30 * * * *', async () => {
//   console.log('🔔 Verificação a cada 30 minutos');
//   await verificarEventos();
// });

console.log('✅ Tarefas agendadas:');
console.log('   - 8:00 AM');
console.log('   - 12:00 PM');
console.log('   - 5:00 PM');
console.log('   - 8:00 PM');

// ═══════════════════════════════════════════════════════════
// INICIAR SERVIDOR
// ═══════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🏥 Verificar saúde: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM recebido, encerrando...');
  process.exit(0);
});
