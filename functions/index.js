const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// ═══════════════════════════════════════════════════════════
// VERIFICAR E ENVIAR NOTIFICAÇÕES (roda diariamente às 8h)
// ═══════════════════════════════════════════════════════════
exports.verificarEventosEEnviarNotificacoes = functions.pubsub
  .schedule("0 8 * * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    console.log("🔔 Iniciando verificação de eventos...");

    try {
      const data = new Date();
      const hoje = data.toISOString().slice(0, 10); // YYYY-MM-DD
      const hojeObj = {
        dia: String(data.getDate()).padStart(2, "0"),
        mes: String(data.getMonth() + 1).padStart(2, "0")
      };

      // Buscar todos os usuários
      const usersSnapshot = await db.collection("users").get();
      let notificacoesEnviadas = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        try {
          // Buscar tokens do usuário
          const tokensSnapshot = await db
            .collection("users")
            .doc(userId)
            .collection("fcmTokens")
            .get();

          if (tokensSnapshot.empty) {
            console.log(`⚠️  Usuário ${userId} sem tokens`);
            continue;
          }

          // Buscar eventos do usuário
          const eventsSnapshot = await db
            .collection("users")
            .doc(userId)
            .collection("events")
            .get();

          const tokens = tokensSnapshot.docs.map(doc => doc.id);

          for (const eventDoc of eventsSnapshot.docs) {
            const evento = eventDoc.data();

            // Verificar se é hoje
            let ehHoje = false;

            if (evento.type === "aniversario") {
              // Aniversário: verificar dia/mês
              const [mm, dd] = evento.birthdayKey.split("-");
              ehHoje = dd === hojeObj.dia && mm === hojeObj.mes;
            } else {
              // Evento normal: verificar data completa
              ehHoje = evento.date === hoje;
            }

            if (ehHoje && !evento.done) {
              const descricao = evento.text || "Evento agendado";
              
              // Buscar dias de antecedência
              const diasAntecedencia = parseInt(evento.advance || 0);
              const dataNotif = new Date(data);
              dataNotif.setDate(dataNotif.getDate() + diasAntecedencia);

              // Se é hoje (ou passou o dia de antecedência), enviar
              if (dataNotif.toISOString().slice(0, 10) <= hoje) {
                console.log(`📤 Enviando notificação para ${userId}: ${descricao}`);

                // Enviar para cada token
                const mensagem = {
                  notification: {
                    title: "Agenda Prática 📅",
                    body: `${descricao}`
                  },
                  data: {
                    eventId: eventDoc.id,
                    type: evento.type
                  }
                };

                // Enviar para todos os tokens do usuário
                for (const token of tokens) {
                  try {
                    await admin.messaging().send({
                      ...mensagem,
                      token: token
                    });
                    notificacoesEnviadas++;
                  } catch (tokeError) {
                    console.error(`Erro ao enviar para token ${token}:`, tokeError.message);
                  }
                }
              }
            }
          }
        } catch (userError) {
          console.error(`Erro ao processar usuário ${userId}:`, userError);
        }
      }

      console.log(`✅ Verificação concluída! ${notificacoesEnviadas} notificações enviadas`);
      return null;
    } catch (error) {
      console.error("❌ Erro na função de notificações:", error);
      return null;
    }
  });

// ═══════════════════════════════════════════════════════════
// VERIFICAR E ENVIAR NOTIFICAÇÕES (roda a cada hora)
// ═══════════════════════════════════════════════════════════
exports.verificarEventosHoraria = functions.pubsub
  .schedule("0 * * * *") // A cada hora
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    console.log("⏰ Verificação horária de eventos...");

    try {
      const data = new Date();
      const hoje = data.toISOString().slice(0, 10);
      const hora = String(data.getHours()).padStart(2, "0");
      const minuto = String(data.getMinutes()).padStart(2, "0");

      const usersSnapshot = await db.collection("users").get();
      let notificacoesEnviadas = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        try {
          const tokensSnapshot = await db
            .collection("users")
            .doc(userId)
            .collection("fcmTokens")
            .get();

          if (tokensSnapshot.empty) continue;

          const eventsSnapshot = await db
            .collection("users")
            .doc(userId)
            .collection("events")
            .get();

          const tokens = tokensSnapshot.docs.map(doc => doc.id);

          for (const eventDoc of eventsSnapshot.docs) {
            const evento = eventDoc.data();

            if (evento.type !== "aniversario" && evento.date === hoje && !evento.done) {
              const descricao = evento.text || "Evento agendado";

              const mensagem = {
                notification: {
                  title: "Lembrete 🔔",
                  body: `${descricao}`
                },
                data: {
                  eventId: eventDoc.id
                }
              };

              for (const token of tokens) {
                try {
                  await admin.messaging().send({
                    ...mensagem,
                    token: token
                  });
                  notificacoesEnviadas++;
                } catch (tokenError) {
                  console.error(`Erro ao enviar:`, tokenError.message);
                }
              }
            }
          }
        } catch (userError) {
          console.error(`Erro ao processar usuário:`, userError);
        }
      }

      console.log(`✅ Verificação horária concluída! ${notificacoesEnviadas} enviadas`);
      return null;
    } catch (error) {
      console.error("❌ Erro na verificação horária:", error);
      return null;
    }
  });

// ═══════════════════════════════════════════════════════════
// LIMPAR TOKENS INATIVOS
// ═══════════════════════════════════════════════════════════
exports.limparTokensInativos = functions.pubsub
  .schedule("0 2 * * *") // 2h da manhã
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    console.log("🧹 Limpando tokens inativos...");

    const usersSnapshot = await db.collection("users").get();
    let tokensDeletados = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const tokensSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("fcmTokens")
        .get();

      for (const tokenDoc of tokensSnapshot.docs) {
        try {
          await admin.messaging().send({
            token: tokenDoc.id,
            notification: {
              title: "Teste",
              body: "Teste"
            }
          }).catch(() => {
            // Token inválido, deletar
            throw new Error("Token inválido");
          });
        } catch (error) {
          await tokenDoc.ref.delete();
          tokensDeletados++;
          console.log(`Deletado token inválido: ${tokenDoc.id.slice(0, 20)}...`);
        }
      }
    }

    console.log(`✅ Limpeza concluída! ${tokensDeletados} tokens removidos`);
    return null;
  });

console.log("✅ Firebase Cloud Functions iniciadas com sucesso!");
