# KP WhatsApp Automation — User Guide

## Table of Contents

1. [What is KP WhatsApp Automation?](#1-what-is-kp-whatsapp-automation)
2. [Getting Started — Create Your Account](#2-getting-started--create-your-account)
3. [Connecting Your WhatsApp](#3-connecting-your-whatsapp)
4. [Setting Up Automation](#4-setting-up-automation)
   - 4a. [Welcome Greeting](#4a-welcome-greeting)
   - 4b. [AI Assistant](#4b-ai-assistant)
   - 4c. [Keyword Auto-Replies](#4c-keyword-auto-replies)
5. [Using the Inbox](#5-using-the-inbox)
   - 5a. [Reading Conversations](#5a-reading-conversations)
   - 5b. [Pausing the AI and Replying Manually](#5b-pausing-the-ai-and-replying-manually)
6. [Logging Out](#6-logging-out)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. What is KP WhatsApp Automation?

KP WhatsApp Automation is a WhatsApp automation platform for business owners. After linking your WhatsApp number, the platform automatically reads incoming customer messages and replies on your behalf using:

- A **Welcome Greeting** for new customers
- **Keyword Rules** that trigger instant preset replies
- An **AI Assistant** that generates intelligent, context-aware responses

You can monitor all conversations in real time, pause the AI at any time, and step in to reply manually.

---

## 2. Getting Started — Create Your Account

### Step 1 — Open the app

Navigate to the KP WhatsApp Automation web address in your browser (e.g. `http://localhost:3000`).

You will see the **Welcome to KP WhatsApp Automation** screen.

```
┌───────────────────────────────────┐
│        Welcome to KP WhatsApp Automation        │
│     WhatsApp Business Automation  │
│                                   │
│  Email ________________________   │
│  Password ______________________  │
│                                   │
│       [ Sign In ]                 │
│                                   │
│  Don't have an account? Sign up   │
└───────────────────────────────────┘
```

### Step 2 — Sign up

1. Click **Sign up** at the bottom of the form.
2. Enter your **Email address** and a **Password**.
3. Click **Create Account**.

If your account is created successfully, you will be taken directly to the dashboard.

### Step 3 — Log in (returning users)

1. Enter your registered **Email** and **Password**.
2. Click **Sign In**.

You will be redirected to the dashboard automatically.

> **Note:** If you see "Authentication failed", double-check your email and password. Passwords are case-sensitive.

---

## 3. Connecting Your WhatsApp

After logging in, you land on the **Connect WhatsApp** page. This is where you link your WhatsApp Business number to KP WhatsApp Automation.

### What you will see

```
┌──────────────────────────────────────────┐
│         WhatsApp Connection              │
│                                          │
│  Link your WhatsApp Business account     │
│  to enable AI automation.                │
│                                          │
│  ┌──────────┐                            │
│  │ Scan to  │   Open WhatsApp on your    │
│  │ Connect  │   phone, tap Menu >        │
│  │          │   Linked Devices >         │
│  │  [QR]    │   Link a Device, and       │
│  │          │   point your phone at      │
│  └──────────┘   this screen.             │
│                                          │
└──────────────────────────────────────────┘
```

### Step-by-step procedure

**On your computer (KP WhatsApp Automation dashboard):**

1. Wait for the QR code to appear. It loads automatically. This may take 5–10 seconds.
2. If the QR does not appear, click **Retry**.

**On your phone:**

3. Open **WhatsApp**.
4. Tap the three-dot menu (⋮) in the top right corner.
5. Tap **Linked Devices**.
6. Tap **Link a Device**.
7. Your phone may ask for face ID or fingerprint — confirm it.
8. The camera opens. **Point it at the QR code on your computer screen.**

**Back on your computer:**

9. The QR code disappears and is replaced with:

```
┌────────────────────────────────────────┐
│                                        │
│         ✓  Successfully Connected      │
│                                        │
│   Your WhatsApp account is securely    │
│   connected. KP WhatsApp Automation is ready to      │
│   handle your incoming messages.       │
│                                        │
└────────────────────────────────────────┘
```

Your WhatsApp is now linked. KP WhatsApp Automation will start receiving and processing customer messages immediately.

> **Important:** Do not log out of WhatsApp Linked Devices on your phone — this will disconnect KP WhatsApp Automation.

---

## 4. Setting Up Automation

Click **Automation** in the left sidebar to open the automation settings page.

```
┌─────────────────────────────────────────────────────────┐
│  Automation                          [ Save Changes ]   │
│  Configure auto-replies and AI assistant.               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  💬 Welcome Greeting              [ Toggle ]    │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  🤖 AI Assistant                  [ Toggle ]    │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  ⚡ Keyword Auto-Replies      [ + Add Rule ]    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

Always click **Save Changes** in the top-right corner after making any changes.

---

### 4a. Welcome Greeting

The Welcome Greeting is a fixed message sent automatically the very first time a customer messages you. It does not use AI.

**To enable it:**

1. Click the toggle next to **Welcome Greeting** to turn it **Enabled** (turns green).
2. Edit the message in the text box below.

```
┌───────────────────────────────────────────────────────┐
│  💬 Welcome Greeting              [●  Enabled ]       │
│                                                       │
│  Greeting Message                                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Thanks for contacting Prime Estates! A member   │ │
│  │ of our team will be in touch shortly.           │ │
│  └─────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

3. Click **Save Changes**.

**When it fires:** Only once per new contact, on their very first message. All subsequent messages from that contact go through the keyword rules or AI assistant.

---

### 4b. AI Assistant

The AI Assistant uses an external AI model to generate replies in real time based on the system prompt you write.

**Step 1 — Enable the AI Assistant**

Click the toggle next to **AI Assistant** to set it to **Active** (turns blue/purple).

**Step 2 — Select an AI Provider**

Click one of the provider buttons:

```
[ OpenAI ]  [ Anthropic (Claude) ]  [ Google (Gemini) ]  [ DeepSeek ]  [ OpenRouter ]
```

| Provider | Best for |
|---|---|
| OpenAI | General purpose, widely tested |
| Anthropic (Claude) | Nuanced, longer conversations |
| Google Gemini | Fast, cost-effective |
| DeepSeek | Budget-friendly, strong reasoning |
| OpenRouter | Access to many models from one key |

**Step 3 — Select a Model**

After selecting a provider, a dropdown appears with available models. Choose one.

Example (OpenAI selected):
```
Model
┌──────────────────────────────────┐
│ GPT-4o Mini (Fast & Cheap)   ▼  │
└──────────────────────────────────┘
```

> For **OpenRouter**: a text field appears instead. Type the full model ID, e.g. `openai/gpt-4o`.

**Step 4 — Enter Your API Key**

Paste your API key from the provider's website.

```
🔑 API Key
┌──────────────────────────────────────────┐
│ sk-...                                   │
└──────────────────────────────────────────┘
```

> Your API key is stored securely and used only to call the AI model on your behalf. Keep it private.

**Step 5 — Write Your System Prompt**

The system prompt tells the AI who it is and how to behave. Be specific. Include:

- What your business does
- Products or services and their prices
- Tone of voice (formal, friendly, etc.)
- What the AI should never do (e.g. never confirm a price reduction)

Example prompt:

```
You are a professional sales assistant for Prime Estates, a real estate agency
in Kampala, Uganda. You help customers inquire about available properties,
schedule viewings, and get pricing information.

Available properties:
- 3-bedroom house in Kololo: UGX 450,000,000
- 2-bedroom apartment in Ntinda: UGX 180,000,000

Rules:
- Never reduce the listed price by more than 10%.
- Always encourage customers to book a viewing.
- Be friendly and professional. Keep replies concise.
- If a customer asks something you cannot answer, say "Our team will follow up."
```

**Step 6 — Save**

Click **Save Changes**. The AI will now respond to all incoming messages that are not caught by keyword rules.

---

### 4c. Keyword Auto-Replies

Keyword rules are checked before the AI. If a customer message contains a matching keyword, the preset reply is sent instantly — no AI is used.

**To add a rule:**

1. Click **+ Add Rule**.
2. A new row appears:

```
┌──────────────────┐  →  ┌─────────────────────────────────┐  [ 🗑 ]
│ Keyword (e.g. PRICE) │     │ Reply message                     │
└──────────────────┘     └─────────────────────────────────┘
```

3. In the **Keyword** box, type a word or phrase (e.g. `price`, `hours`, `location`).
4. In the **Reply** box, type the response to send.
5. Repeat for as many rules as you need.
6. Click **Save Changes**.

**Example rules:**

| Keyword | Reply |
|---|---|
| price | Our pricing starts from UGX 180,000,000. Reply with VIEWING to book an appointment. |
| location | We are located at Plot 12, Kampala Road, Kampala. Open Mon–Sat, 8am–6pm. |
| hours | We are open Monday to Saturday, 8:00 AM to 6:00 PM. |

**To delete a rule:** Click the red trash icon on the right side of any rule row.

> **Keyword matching is case-insensitive.** A customer typing "PRICE", "price", or "Price" will all trigger the same rule.

---

## 5. Using the Inbox

Click **Inbox** in the left sidebar to open the live chat view.

```
┌─────────────────────────────────────────────────────────────┐
│  💬 Live Chat (Inbox)                                       │
│  Read transcripts, pause the AI, and reply manually.        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  +256700123456         [ Pause AI ]                 │   │
│  │─────────────────────────────────────────────────────│   │
│  │                                                     │   │
│  │   Customer ● 10:04 AM                               │   │
│  │   ┌─────────────────────────────────┐               │   │
│  │   │ Hello, what is your price?      │               │   │
│  │   └─────────────────────────────────┘               │   │
│  │                                                     │   │
│  │               ┌──────────────────────────────────┐  │   │
│  │               │ Our pricing starts from UGX 180M │  │   │
│  │               └──────────────────────────────────┘  │   │
│  │               ⚡ RULE ● 10:04 AM                    │   │
│  │                                                     │   │
│  │  ┌────────────────────────────┐  [ Send → ]        │   │
│  │  │ Pause AI to reply manually │                    │   │
│  │  └────────────────────────────┘                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5a. Reading Conversations

Each conversation card shows one customer's message thread. Conversations are sorted by contact.

**Message badges:**

| Badge | Meaning |
|---|---|
| `Customer` | Message received from the customer |
| `🤖 AI` | Reply generated by the AI assistant |
| `⚡ RULE` | Reply triggered by a keyword rule |
| `👤 SYSTEM` | Manual reply sent by you |

The inbox refreshes automatically every 5 seconds. You do not need to reload the page.

---

### 5b. Pausing the AI and Replying Manually

By default, every conversation is handled by the AI. To take over a conversation:

**Step 1 — Pause the AI**

Click the **Pause AI** button in the conversation header.

```
[ Pause AI ]  → changes to →  [ Resume AI ]
```

The AI will stop responding to this customer. The reply box becomes active.

**Step 2 — Type your reply**

Click inside the reply box at the bottom of the conversation and type your message.

```
┌────────────────────────────────────────────────┐  [ → ]
│  Type a manual reply...                        │
└────────────────────────────────────────────────┘
```

**Step 3 — Send**

Press **Enter** or click the **Send** button (arrow icon).

Your message is sent immediately via WhatsApp and logged with the `SYSTEM` badge.

**Step 4 — Resume the AI**

When you are done, click **Resume AI**. The AI will take over again from the next incoming message.

> **Tip:** You can pause the AI for specific customers without affecting others. Each conversation has its own pause state.

---

## 6. Logging Out

Click **Logout** at the bottom of the left sidebar.

You will be returned to the login screen. Your WhatsApp session remains active on the server — your automation continues running even after you log out of the dashboard.

---

## 7. Troubleshooting

### QR code is not loading

- Wait 10–15 seconds and refresh the page.
- Click **Retry** if the button appears.
- Check that the backend server is running.

### QR code expired before I could scan it

WhatsApp QR codes expire after about 60 seconds. Refresh the page to generate a new one, then scan it quickly.

### WhatsApp says "This QR code has already been scanned"

You may have scanned an expired or already-used code. Refresh the dashboard page to get a new QR code.

### The connection shows "Successfully Connected" but messages are not being replied to

1. Go to **Automation** and check that the AI Assistant toggle is **Active** or that at least one Keyword Rule is saved.
2. Make sure you clicked **Save Changes** after configuring settings.
3. Check that your API key is correct and has not expired.

### AI replies with an error or stops working

- Your AI provider API key may have run out of credits. Log into your provider's dashboard to check.
- The model name may be incorrect. Double-check the model field in Automation settings.

### I cannot log in

- Make sure you are using the same email and password used at sign-up.
- Passwords are case-sensitive.
- If you have forgotten your password, contact your system administrator (password reset is not yet available in the UI).

### The Inbox shows no conversations

- No messages have been received yet, or the WhatsApp connection may be disconnected.
- Check the **Connect WhatsApp** page to confirm the status shows **Successfully Connected**.
