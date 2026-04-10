# 🚀 SRSync: Professional API Key Management & Rate Limiting SaaS

![SRSync Banner](https://img.shields.io/badge/Production--Grade-API--Platform-7c6fcd?style=for-the-badge&logo=rocket)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Node--Postgres--Redis-blue?style=for-the-badge)

**SRSync** is an enterprise-ready API management platform that simulates the infrastructure used by world-class providers like Stripe and OpenAI. It offers a complete suite for secure API access, intelligent rate limiting, real-time analytics, and AI-driven support.

---

## ✨ Key Features

### 🔐 Advanced Authentication
*   **Multi-Provider OAuth**: One-click Sign-in/Sign-up with **Google** and **GitHub**.
*   **JWT Security**: Robust session management with encrypted token storage.
*   **Account Linking**: Smart matching of existing email accounts across providers.

### 🔑 API Key Governance
*   **Secure Generation**: Industry-standard cryptographic key creation.
*   **Project Context**: Group keys by project for granular organization.
*   **Lifecycle Control**: Instantly create, rotate, or revoke keys via a premium dashboard.

### ⚡ Intelligent Rate Limiting
*   **Redis-Powered**: High-performance tracking using sliding window algorithms.
*   **Tiered Plans**: Flexible limits (Basic to Enterprise) mapped directly to your account.
*   **Instant Enforcement**: Real-time 429 (Too Many Requests) blocking to protect infrastructure.

### 📊 Real-time Monitoring & AI
*   **Visual Analytics**: Time-series charts for request volume, errors, and performance.
*   **AI Assistant**: Context-aware floating AI widget (Powered by Gemini) for instant usage analysis and troubleshooting.
*   **Usage Quotas**: Visual progress gauges for daily and monthly API consumption.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Recharts, Custom HSL Theming |
| **Backend** | Node.js, Express.js, Passport.js |
| **Database** | PostgreSQL (Relational Data & Subscriptions) |
| **Cache** | Redis (Rate Limiting & Session Storage) |
| **AI** | Google Gemini Pro |
| **Deployment** | Docker, Docker Compose, Nginx |

---

## 🚀 Quick Start (Local Development)

### 1️⃣ Prerequisites
*   Node.js (v20+)
*   PostgreSQL & Redis (Running locally or via Docker)
*   GitHub/Google OAuth Credentials

### 2️⃣ Clone & Install
```bash
git clone https://github.com/ltsam26/API-Key-Management-Rate-Limiting-SaaS-Platform.git
cd api-platform
npm install
cd frontend && npm install
```

### 3️⃣ Configure Environment
Create a `.env` in the root:
```env
PORT=5050
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379
JWT_SECRET=super_secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GEMINI_API_KEY=...
```

### 4️⃣ Run
```bash
# Backend
npm run dev
# Frontend
cd frontend && npm run dev
```

---

## 🐳 Deployment (Docker)

Launch the entire stack (Frontend, Backend, DB, Redis) with a single command:

```bash
docker-compose up --build -d
```
*   **UI**: [http://localhost](http://localhost)
*   **API**: [http://localhost:5050](http://localhost:5050)

---

## 📋 API Specification

All protected routes require the `x-api-key` header.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/google` | GET | Initiates Google OAuth flow |
| `/api/public/data` | GET | Example public API (simulated) |
| `/api/keys` | POST | Generate a new API key |
| `/api/analytics` | GET | Fetch usage statistics |

---

## 🧪 Simulation Mode (Testing)
SRSync features a built-in **Simulation Mode** for subscription testing. You can instantly upgrade your account between Basic, Pro, and Enterprise tiers without a real payment gateway to validate rate-limit behavior and UI responsiveness.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
*Built with ❤️ for the Developer Community.*
