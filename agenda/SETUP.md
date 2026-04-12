# 🚀 Agenda Prática — Guia de Configuração Completo

## 📁 Arquivos do projeto
```
agenda-pratica/
├── index.html       ← App principal
├── sw.js            ← Service Worker (notificações + offline)
├── manifest.json    ← Configuração PWA
├── icon-192.png     ← Ícone do app
├── icon-512.png     ← Ícone grande
└── SETUP.md         ← Este guia
```

---

## 🔥 PASSO 1 — Criar projeto no Firebase (gratuito)

1. Acesse: **https://console.firebase.google.com**
2. Clique em **"Criar projeto"**
3. Dê um nome, ex: `agenda-pratica`
4. Desative Google Analytics (opcional)
5. Clique em **"Criar projeto"**

---

## ⚙️ PASSO 2 — Configurar Firebase Cloud Messaging

1. No console Firebase, vá em **Configurações do projeto** (ícone ⚙️)
2. Clique na aba **"Cloud Messaging"**
3. Em "Certificados Web Push", clique em **"Gerar par de chaves"**
4. Copie a **VAPID Key** gerada

---

## 🔑 PASSO 3 — Pegar as credenciais do app

1. No console Firebase, vá em **Configurações do projeto → Geral**
2. Role até "Seus apps" e clique em **"</> Web"**
3. Registre o app com um apelido
4. Você verá um objeto assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "agenda-pratica.firebaseapp.com",
  projectId: "agenda-pratica",
  storageBucket: "agenda-pratica.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. **Abra o `index.html`** e substitua a seção marcada com os seus valores reais
6. Substitua também `"SUA_VAPID_KEY_AQUI"` pela chave do passo 2

---

## 🌐 PASSO 4 — Hospedar o app (Netlify — mais fácil)

### Opção A: Netlify Drop (sem conta, 2 minutos)
1. Acesse: **https://app.netlify.com/drop**
2. Arraste a **pasta inteira** `agenda-pratica/` para a página
3. Pronto! Você recebe um link como:
   `https://nome-aleatorio.netlify.app`

### Opção B: Netlify com conta (recomendado — link permanente)
1. Crie conta em **netlify.com** (gratuito)
2. Clique em **"Add new site → Deploy manually"**
3. Arraste a pasta
4. Vá em **"Site settings → Change site name"**
5. Escolha um nome, ex: `minha-agenda-pratica`
6. Link final: `https://minha-agenda-pratica.netlify.app`

---

## 📱 PASSO 5 — Instalar no iPhone

> ⚠️ **Obrigatório usar Safari** — Chrome no iPhone não permite instalar PWA

1. Abra o link do Netlify no **Safari** do iPhone
2. Toque no ícone de **compartilhar** (quadrado com seta ↑)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Mude o nome para **"Agenda Prática"** se quiser
5. Toque em **"Adicionar"**
6. O ícone aparece na tela inicial como um app nativo!

---

## 🔔 PASSO 6 — Ativar notificações no iPhone

> Requer **iOS 16.4 ou superior**

1. Com o app instalado na tela inicial, **abra pelo ícone** (não pelo Safari)
2. O app mostrará um banner "Ativar notificações"
3. Toque em **"Ativar"**
4. Confirme a permissão no popup do iOS
5. Pronto! Você receberá notificações mesmo com o app fechado

---

## 🔔 PASSO 7 — Configurar servidor de notificações (para push real)

Para notificações com app completamente fechado, você precisa de um servidor.
A forma mais simples é usar **Firebase Cloud Functions**:

### 7.1 — Instalar Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 7.2 — Criar função de envio de notificação
Crie um arquivo `functions/index.js`:

```javascript
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Roda todo dia às 8h da manhã (fuso -3 = UTC-3)
exports.enviarNotificacoes = functions.pubsub
  .schedule("0 11 * * *") // 8h BRT = 11h UTC
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    // Aqui você buscaria os eventos do Firestore
    // Por enquanto, o app usa localStorage e notificações locais
    console.log("Verificando notificações...");
    return null;
  });
```

### Para MVP: as notificações locais já funcionam!
O app já agenda notificações locais quando o app está aberto. Para notificações
com app fechado no iOS PWA, o Service Worker cuida disso via Firebase Push.

---

## ✅ Resumo rápido

| Etapa | O que fazer | Onde |
|-------|-------------|------|
| 1 | Criar projeto Firebase | console.firebase.google.com |
| 2 | Pegar VAPID Key | Firebase → Cloud Messaging |
| 3 | Atualizar index.html | Bloco Firebase Config |
| 4 | Hospedar arquivos | app.netlify.com/drop |
| 5 | Instalar no iPhone | Safari → Compartilhar → Tela inicial |
| 6 | Ativar notificações | Botão no app |

---

## ⚡ Notas importantes

- **iOS 16.4+**: suporte completo a notificações push em PWA
- **iOS abaixo de 16.4**: notificações locais apenas (quando app está aberto)
- **Android**: funciona 100% com Chrome
- **Dados**: salvos no dispositivo (localStorage). Não sincroniza entre aparelhos ainda.
- **Offline**: o app funciona sem internet após a primeira visita
