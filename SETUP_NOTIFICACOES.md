# 🚀 Setup Notificações Push - Opção B (Servidor Gratuito)

## 📋 Pré-requis
- ✅ GitHub conta (pra clonar o repo no Render.com)
- ✅ Conta no Render.com (grátis)
- ✅ Firebase Console

---

## ⏱️ Valor total: 15-20 minutos

---

## 🔑 PASSO 1: Gerar chave do Firebase (5 min)

### 1.1 - Acesse o Firebase Console
👉 https://console.firebase.google.com/project/agenda-pratica2/settings/serviceaccounts/adminsdk

### 1.2 - Clique em "Gerar chave privada"
- Um arquivo JSON será baixado
- Renomeie para **`serviceAccountKey.json`**
- Coloque na pasta **`functions/`** do seu PC

### 1.3 - Teste local (OPCIONAL)
```bash
cd functions
node server.js
# Se vir "✅ Servidor rodando em http://localhost:3000" = OK
```

---

## 🌐 PASSO 2: Deploy no Render.com (10 min)

### 2.1 - Criar repositório GitHub

```bash
cd c:\Users\PC\OneDrive\programação\agenda_pratica_completo

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USER/agenda-pratica.git
git push -u origin main
```

⚠️ **Se não tiver Git instalado:**
1. Baixe em https://git-scm.com/download/win
2. Instale
3. Abra novo PowerShell e tente novamente

### 2.2 - Criar conta no Render.com
👉 https://render.com

- Signup com GitHub
- Autorizar acesso

### 2.3 - Deploy do servidor
1. Dashboard → "New +" → "Web Service"
2. Selecionar repositório: `agenda-pratica`
3. Build Command: `cd functions && npm install`
4. Start Command: `cd functions && npm start`
5. Clicar em "Create Web Service"
6. Render vai fazer deploy automaticamente

⏱️ Espere ~3-5 minutos

### 2.4 - Copiar URL do servidor
Após deploy, você verá algo como:
```
https://agenda-pratica-xxxxx.onrender.com
```

**Copie e guarde essa URL!**

### 2.5 - Configurar variáveis de ambiente
1. Dashboard → Seu serviço → Environment
2. Adicionar variáveis:

```
FIREBASE_PROJECT_ID = agenda-pratica2

FIREBASE_CLIENT_EMAIL = (copiar do serviceAccountKey.json)

FIREBASE_PRIVATE_KEY = (copiar do serviceAccountKey.json, com quebras de linha)
```

⚠️ **Importante:** 
- Em FIREBASE_PRIVATE_KEY, substitua `\n` por quebras de linha reais
- Ou use: `"-----BEGIN PRIVATE KEY-----\nxxxxxxxxx\n-----END PRIVATE KEY-----\n"`

---

## 🔗 PASSO 3: Atualizar index.html com URL do backend (2 min)

### 3.1 - Editar arquivo
Abra `agenda/index.html` e procure por:

```javascript
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://seu-backend.onrender.com' // ← MUDE AQUI
  : 'http://localhost:3000';
```

Substitua `https://seu-backend.onrender.com` pela URL do Render que copiou.

Exemplo:
```javascript
const BACKEND_URL = 'https://agenda-pratica-abc123.onrender.com'
```

### 3.2 - Deploy
```bash
firebase deploy --only hosting
```

---

## ✅ PASSO 4: Testar (3 min)

### 4.1 - Abra o app
👉 https://agenda-pratica2.web.app

### 4.2 - Ativar notificações
1. Clique no botão 🔔
2. Autorize permissão
3. Veja no console se registrou o token

### 4.3 - Testar envio
```bash
# Na pasta functions
curl -X POST http://localhost:3000/api/test-notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_xxxxx",
    "title": "Teste",
    "body": "Notificação de teste"
  }'
```

Ou envie pelo endpoint POST `/api/test-notification`

---

## 🔔 COMO FUNCIONA AGORA

1️⃣ Você cria um evento na agenda
2️⃣ Registra o token quando ativa notificações  
3️⃣ Servidor verifica TODOS OS DIAS às:
   - 8:00 AM
   - 12:00 PM (meio-dia)
   - 5:00 PM
   - 8:00 PM

4️⃣ 🔔 **Notificação chega no seu telefone!**

---

## 🐛 Troubleshooting

### "Notificação não chega"
- [ ] Token foi registrado? (veja console do navegador)
- [ ] URL do backend está correta no index.html?
- [ ] Servidor está rodando no Render? (veri fique status)
- [ ] Permissão ativa no seu telefone?

### "Servidor dorme"
- [ ] Normal no Render free (dorme após 15min inativo)
- [ ] Acorda automaticamente quando receber requisição

### "Erro ao registrar token"
- [ ] Verifique se o Render está rodando
- [ ] Veja logs: Render Dashboard → Logs
- [ ] Confirmeseu `serviceAccountKey.json` está correto

---

## 📊 Próximos passos

1. ✅ Servidor rodando
2. ✅ Tokens sendo registrados
3. ⏭️ Integrar Firestore (salvar eventos no banco)
4. ⏭️ Interface para ver notificações enviadas
5. ⏭️ Login com Google (depois)

---

## 💡 Dicas

- **Teste local primeiro**: `node functions/server.js`
- **Veja logs do Render**: Dashboard → escolha serviço → Logs
- **Hibernation**: Render dorme 15min sem uso, mas acorda rápido
- **Crédito grátis**: Fica coberto pelo free tier do Render

---

## 🆘 Problema?

Se algo não funcionar:
1. Verifique os logs do Render
2. Teste localmente (`node functions/server.js`)
3. Verifique console do navigador (F12)
4. Veja se tokens estão sendo registrados

---

**Qualquer dúvida, me chamada! 🚀**
