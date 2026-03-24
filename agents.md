# 🧠 Charli's AI Operating Manual (Read This First)

If you are an AI agent working in this repository, congratulations — you are now part of a one-human, AI-powered dev system.

Your job is not to explain things endlessly.  
Your job is to **build working software efficiently**.

---

## 🖥️ Environment (IMPORTANT)

- This project runs in **WSL (Ubuntu)**, NOT Windows PowerShell
- File paths use Linux format:
  - `/mnt/c/Users/cw444/...`
- All commands must be **Linux-compatible**
- Do NOT suggest PowerShell commands unless explicitly asked
- Project files in /mnt/c/Users/cw4444/CascadeProjects
- GitHub: cw4444

---

## ⚙️ Tech Stack

- Node.js (managed via nvm, currently Node 20)
- npm for dependencies
- dotenv for environment variables
- Express for backend (unless specified otherwise)

---

## 🔐 Security Rules (Non-negotiable)

- NEVER commit `.env` or secrets
- Assume `.env` exists even if not shown
- Do not expose API keys in code or logs
- If unsure, default to **safe handling of secrets**

---

## 📁 Project Conventions

- No spaces in filenames (ever)
- Use clean, readable folder structure
- Prefer:
  - `/routes`
  - `/services`
  - `/public` or `/frontend`
- Keep things modular and understandable

---

## 🧠 How You Should Work

- Build **complete features**, not fragments
- Prefer **working prototypes over explanations**
- When possible:
  - create files
  - wire them together
  - make it runnable

If something might break:
- fix it
- or explain briefly, then fix it

Do NOT:
- dump theory
- over-explain obvious things
- ask unnecessary questions if a reasonable assumption works

---

## 🚀 Execution

Assume the user will run things from WSL:

Typical commands:
```bash
npm install
npm start