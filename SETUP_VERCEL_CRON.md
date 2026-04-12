# 🚀 Setup - Vercel Cron para Agenda Prática

## ✨ Vantagens desta solução:
- ✅ **Sem Hibernação** - Funções rodam 24/7 sem pausas
- ✅ **Gratuito** - Limite de 63 execuções/mês (mais que suficiente)
- ✅ **Rápido** - Notificações entregues instantaneamente
- ✅ **Confiável** - Infraestrutura da Vercel
- ✅ **Fácil** - Deploy automático via GitHub

---

## 📋 Passo 1: Gerar Firebase Service Account Key

### 1.1 Acessar Firebase Console
```
https://console.firebase.google.com/project/agenda-pratica2/settings/serviceaccounts/adminsdk
```

### 1.2 Gerar chave
- Clique em **"Gerar chave privada"**
- Arquivo `serviceAccountKey.json` será baixado

### 1.3 Copiar conteúdo
Abra o arquivo gerado e copie o conteúdo JSON inteiro.

---

## 📋 Passo 2: Preparar Git

### 2.1 Inicializar repositório (primeira vez)
```powershell
cd c:\Users\PC\OneDrive\programação\agenda_pratica_completo

git init
git add .
git commit -m "Initial commit - Vercel Cron setup"
```

### 2.2 Conectar ao GitHub
```powershell
git remote add origin https://github.com/SEU_USER/agenda-pratica.git
git branch -M main
git push -u origin main
```

**Se já tem repositório:**
```powershell
git add .
git commit -m "Migrate to Vercel Cron"
git push
```

---

## 📋 Passo 3: Deploy no Vercel

### 3.1 Criar conta Vercel
👉 https://vercel.com/signup
- Use conta GitHub (mais fácil)

### 3.2 Conectar projeto
- Menu: **"New Project"**
- Selecione repository `agenda-pratica`
- Clique: **"Import"**

### 3.3 Configurar Variáveis de Ambiente
Na página de Project Settings → **Environment Variables**

Adicione estas 3 variáveis (pegue do `serviceAccountKey.json`):

| Nome | Valor | Onde encontrar |
|------|-------|---|
| `FIREBASE_PROJECT_ID` | `agenda-pratica2` | "project_id" no JSON |
| `FIREBASE_CLIENT_EMAIL` | seu-email@.... | "client_email" no JSON |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | "private_key" no JSON (*com as quebras de linha*) |

**Exemplo:**
```
FIREBASE_PROJECT_ID = agenda-pratica2
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-abc123@agenda-pratica2.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\nMIIEvgIBA....\n-----END PRIVATE KEY-----\n
```

### 3.4 Deploy
- Clique em **"Deploy"**
- Aguarde ~2-3 minutos
- Copie a URL gerada (ex: `https://agenda-pratica.vercel.app`)

---

## 📋 Passo 4: Atualizar index.html

### 4.1 Abrir `agenda/index.html`
Procure por:
```javascript
const BACKEND_URL = 'https://agenda-pratica.vercel.app';
```

### 4.2 Atualizar com sua URL
Se sua URL foi `https://seu-projeto.vercel.app`:
```javascript
const BACKEND_URL = 'https://seu-projeto.vercel.app';
```

### 4.3 Deploy para Firebase Hosting
```powershell
firebase deploy --only hosting
```

---

## ✅ Passo 5: Testar

### 5.1 Abrir app
👉 https://agenda-pratica2.web.app

### 5.2 Permitir notificações
- Clique no 🔔 (sino)
- Autorize permissões

### 5.3 Ver logs
```
Vercel Dashboard → seu projeto → "Functions" tab
```

### 5.4 Testar cron manualmente
Acesse em seu navegador:
```
https://seu-projeto.vercel.app/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2026-04-12T15:30:00.000Z",
  "message": "🟢 Servidor Vercel Cron está funcionando!"
}
```

---

## 🔄 Agendamento de Notificações

**Horários fixos quando notificações são enviadas:**
- ⏰ **8:00 AM** (Brasília)
- ⏰ **12:00 PM** (Brasília)
- ⏰ **17:00** (Brasília)
- ⏰ **20:00** (Brasília)

Configurado em `vercel.json`:
```json
"crons": [
  {
    "path": "/api/cron",
    "schedule": "0 8,12,17,20 * * *"
  }
]
```

---

## 🐛 Troubleshooting

### ❌ "Error: Invalid private key"
- Copie a chave COMPLETA de `serviceAccountKey.json`
- Inclua: `-----BEGIN PRIVATE KEY-----` até `-----END PRIVATE KEY-----`

### ❌ "Cron não está executando"
- Verifique: Vercel Dashboard → Functions → Crons
- Logs aparecerão aproximadamente 2 minutos APÓS a execução

### ❌ "Token não registrado"
- Abra DevTools do navegador (F12)
- Selecione aba **Console**
- Procure por erros de rede ao autorizar notificações

### ❌ "Notificação não chega"
1. Verifique se token foi registrado:
   ```
   https://seu-projeto.vercel.app/api/health
   ```
   Se retorna 200 → backend OK

2. Verifique logs do Vercel:
   ```
   Vercel → Project → Functions → cron.js → Logs
   ```

3. Verifique Firestore:
   ```
   Firebase Console → Firestore → users → seu_user_id → fcmTokens
   ```

---

## 📞 Resumo Quick

| Etapa | Tempo | Status |
|-------|-------|--------|
| 1. Gerar Firebase Key | 2 min | ⏳ |
| 2. GitHub Setup | 5 min | ⏳ |
| 3. Vercel Deploy | 5 min | ⏳ |
| 4. Atualizar URL | 2 min | ⏳ |
| 5. Testar | 5 min | ⏳ |
| **TOTAL** | **~19 min** | ⏳ |

---

## 🎉 Pronto!

Sua agenda terá notificações:
- ✅ Sem hibernação
- ✅ Automáticas 4x ao dia
- ✅ Gratuitas
- ✅ Confiáveis

**Avisa quando precisar de help! 🚀**
