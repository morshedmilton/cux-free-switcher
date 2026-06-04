# cux-free 🚀

> **Claude AI Free-Tier Account Switcher & Context Preserver CLI**  
> Run multiple Claude free accounts as a single seamless terminal session with full 2026 feature compliance.

---

## 📖 Overview

`cux-free` is a lightweight, high-performance CLI tool designed for developers who love Claude's models but frequently hit rate limits on the free tier. It allows you to pool multiple free accounts together. When one account hits a rate limit (`429`) or expires (`403`), `cux-free` automatically rotates to the next active account in the pool, safely injects your conversation history, and continues the session without losing context.

### ⚡ 2026 Feature Compliance
Fully updated to support the latest Claude.ai web application payload specifications:
- **Model Support:** Choose between `Claude Sonnet 4.6` and `Claude Haiku 4.5`.
- **Thinking Switch:** Toggle the advanced internal reasoning/thinking capability (`true`/`false`).
- **4-Level Effort Control:** Native support for free-tier reasoning depth levels (`Low`, `Medium`, `High`, `Max`).

---

## ✨ Features

- **Automated Account Rotation:** Instant, automatic swap on `429 Too Many Requests` or `403 Forbidden` errors.
- **Context Preservation:** Keeps track of full conversation history in local memory and replays it automatically upon switching accounts.
- **Session-Locked Config:** Prompts for Model, Thinking, and Effort variables at startup and locks them for the rest of the conversation.
- **Safe Global Storage:** Saves your sensitive session keys inside your OS Home Directory (`~/.cux-free/config.json`), ensuring data is never lost during package updates.

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm**

### 1. Install Globally From Source
Clone the repository and link it globally to your system:

```bash
git clone https://github.com/your-username/cux-free-switcher.git
cd cux-free-switcher
npm install
npm run build
npm link
```

### 2. Configure Your Accounts
On your first run, the tool will automatically generate a secure configuration directory in your home path.

Open `~/.cux-free/config.json` (Windows: `C:\Users\<Your-Username>\.cux-free\config.json`) and add your account session tokens:

```json
{
  "accounts": [
    {
      "slot": 1,
      "email": "account1@example.com",
      "sessionKey": "sk-ant-sid02-YOUR_SESSION_KEY_1",
      "routingHint": "sk-ant-rh-YOUR_ROUTING_HINT_1",
      "status": "active"
    },
    {
      "slot": 2,
      "email": "account2@example.com",
      "sessionKey": "sk-ant-sid02-YOUR_SESSION_KEY_2",
      "routingHint": "sk-ant-rh-YOUR_ROUTING_HINT_2",
      "status": "active"
    }
  ],
  "current_slot": 0
}
```
**How to get your session key:** Log into Claude.ai in your browser, press F12 to open Developer Tools, go to the Application/Storage tab, look under Cookies, and copy the values for `sessionKey` and `routingHint`.

## 🚀 Usage
Simply launch the tool from any terminal window:

```bash
cux-free
```

### Prompt Workflow:
1. **Select Model:** Choose between Sonnet 4.6 or Haiku 4.5.
2. **Toggle Thinking:** Enable or disable internal reasoning.
3. **Select Effort:** Define the depth configuration (Low to Max).
4. **Chat:** Start typing! Type `exit` anytime to end the session gracefully.

## 🛡️ Security
- **Opaque Credentials:** Your tokens are stored strictly on your local machine.
- **No Remote Telemetry:** The tool communicates directly and exclusively with Anthropic's official endpoints.

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Md. Morshed Milton.
