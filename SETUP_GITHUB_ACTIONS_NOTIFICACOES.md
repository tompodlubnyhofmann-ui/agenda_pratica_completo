# Setup de Notificações com GitHub Actions

## Por que usar GitHub Actions?
- Vercel Hobby permite apenas 1 cron job diário.
- GitHub Actions permite 4 agendamentos por dia gratuitamente.
- Assim você não precisa pagar nenhum plano.

## O que ainda precisa fazer

### 1. Configurar secrets no GitHub
No repositório `tompodlubnyhofmann-ui/agenda_pratica_completo`, vá em:
`Settings` > `Secrets and variables` > `Actions`

Adicione estas secrets:
- `FIREBASE_PROJECT_ID` = `agenda-pratica2`
- `FIREBASE_CLIENT_EMAIL` = valor de `client_email` do `serviceAccountKey.json`
- `FIREBASE_PRIVATE_KEY` = valor de `private_key` do `serviceAccountKey.json`

### 2. Deploy no Vercel
- Use o projeto já importado no Vercel
- Não é necessário cron job no Vercel
- Apenas mantenha o Vercel como backend para `api/register-token`

### 3. Confirmar `BACKEND_URL` no frontend
Abra `agenda/index.html` e garanta:
```javascript
const BACKEND_URL = 'https://<seu-projeto-vercel>.vercel.app';
```

### 4. Firebase Hosting
Depois de atualizar, rode:
```powershell
firebase deploy --only hosting
```

### 5. GitHub Actions
O workflow já foi criado em:
`.github/workflows/send_notifications.yml`

Os horários agendados são:
- 08:00 BRT
- 12:00 BRT
- 17:00 BRT
- 20:00 BRT

### 6. Testar manualmente
Você pode disparar o workflow manualmente em:
`Actions` > `Send Scheduled Notifications` > `Run workflow`

---

## Observações
- O Vercel agora só serve a API de registro de tokens.
- As notificações são enviadas pelo GitHub Actions.
- Isso evita qualquer limite de cron no plano Hobby.
