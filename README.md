# 🚀 SRSync API: Secure API Key Management & Rate-Limiting SaaS Platform

**A production-ready SaaS platform for developers to manage API keys, monitor usage, enforce rate-limiting, and get AI-powered support — all from a single dashboard.**

---

## 🔒 Problem Statement
Managing API security, usage tracking, and tiered subscriptions is complex and time-consuming for developers. Most existing solutions are either too expensive (AWS API Gateway), lack integrated monitoring, or don't offer AI-driven debugging support. SRSync API solves all of these with a single, self-hosted, open-source platform.

## 💡 Solution Overview
SRSync API provides a unified dashboard where developers can:
- **Generate Secure Keys**: Create and manage project-specific API keys (stored as bcrypt hashes — never in plaintext).
- **Enforce Rate Limits**: Plan-based throttling (10–1,000 req/min) with Redis + in-memory fallback.
- **Monitor Analytics**: Real-time charts for API hits, error rates, status codes, and 7-day trends.
- **Manage Billing**: Multi-tier subscriptions (Free, Basic, Pro, Enterprise) with Razorpay payment integration.
- **AI-Powered Support**: Get instant, context-aware help via a Gemini-integrated support desk that uses your real usage data.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Vanilla CSS (Glassmorphic Dark Mode), Recharts |
| **Backend** | Node.js, Express 5, JWT, Bcrypt, Passport.js |
| **Data & Cache** | PostgreSQL (Primary DB), Redis (Rate Limiting & Caching) |
| **AI Integration** | Google Gemini API |
| **Payments** | Razorpay (HMAC-SHA256 Signature Verification) |
| **Auth** | JWT + OAuth 2.0 (Google, GitHub) via Passport.js |
| **Infrastructure** | Docker, Docker Compose, Nginx, AWS EC2 |

---

## ✨ Features

| Feature | Description |
| :--- | :--- |
| 🔑 **Secure API Key Management** | Generate, revoke, and rotate API keys stored as bcrypt hashes |
| ⚡ **Plan-Based Rate Limiting** | 10/30/100/1,000 req/min + daily quotas using Redis + in-memory fallback |
| 💳 **Multi-Tier Billing** | Free, Basic (₹99), Pro (₹299), Enterprise (₹499) with Razorpay integration |
| 📊 **Real-Time Analytics** | AreaCharts, BarCharts for API hits, errors, status codes, and daily trends |
| 📁 **Project Workspaces** | Organize API keys by projects, each with its own plan and analytics |
| 🤖 **AI Support Desk** | Google Gemini chatbot with real-time access to user's actual usage data |
| 🔐 **OAuth 2.0 Social Login** | Sign in with Google and GitHub alongside email/password |
| 🛡️ **IP Whitelisting & Key Expiry** | Restrict API keys to specific IPs with automatic expiration |
| 👨‍💼 **Admin Panel** | Platform-wide user management and usage monitoring |
| 📝 **Request Logging** | Every API call logged with endpoint, method, IP, status code, timestamp |

---

## 🌐 Live Demo & Deployment
- **Live URL**: [http://13.50.245.234](http://13.50.245.234)
- **Deployment**: Hosted on **AWS EC2 (Ubuntu 24.04)** using Docker Compose with PostgreSQL, Redis, Node.js, and Nginx containers.

---

## 🏗️ Project Folder Structure
```text
├── backend/                # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/         # Database, Redis, Passport, Swagger configs
│   │   ├── controllers/    # Route logic (auth, apikey, ai, payment, analytics, admin, support)
│   │   ├── middlewares/    # API Key validation, Rate limiting, Auth, Admin, Quota
│   │   ├── models/         # Database queries (user, apikey, analytics, project, ratelimit)
│   │   ├── routes/         # API route definitions (10 route modules)
│   │   ├── migrations/     # Database schema migration scripts
│   │   ├── utils/          # Logger (Winston)
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   ├── .env                # Environment variables (not committed)
│   ├── Dockerfile          # Backend Docker image
│   └── package.json        # Backend dependencies
│
├── frontend/               # Frontend UI (React + Vite)
│   ├── src/
│   │   ├── pages/          # Dashboard pages (Overview, ApiKeys, Analytics, Billing, Support)
│   │   ├── components/     # Layout (Sidebar, Topbar), UI (AIAssistant)
│   │   ├── services/       # API service layer (8 service files)
│   │   ├── context/        # AuthContext, ThemeContext
│   │   ├── hooks/          # Custom React hooks
│   │   └── App.jsx         # Root component with routing
│   ├── Dockerfile          # Nginx-based frontend build
│   └── package.json        # Frontend dependencies
│
├── docker-compose.yml      # Full stack orchestration (PostgreSQL, Redis, Backend, Frontend)
└── README.md
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
- **Node.js** v18+ and **npm**
- **PostgreSQL** v15+
- **Redis** (optional — app works without it via in-memory fallback)
- **Docker & Docker Compose** (for containerized deployment)

### Option 1: Local Development

#### Step 1: Clone the Repository
```bash
git clone https://github.com/ltsam26/API-Key-Management-Rate-Limiting-SaaS-Platform.git
cd API-Key-Management-Rate-Limiting-SaaS-Platform
```

#### Step 2: Setup Backend
```bash
cd backend
cp .env.example .env       # Configure your environment variables
npm install
npm run dev                 # Starts on http://localhost:5050
```

#### Step 3: Setup Frontend
```bash
cd frontend
npm install
npm run dev                 # Starts on http://localhost:5173
```

### Option 2: Docker Deployment (Recommended)

#### Step 1: Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5050
DATABASE_URL=postgresql://postgres:1234@db:5432/api_platform
REDIS_URL=redis://redis:6379
JWT_SECRET=your_super_secret_key
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
FRONTEND_URL=http://localhost
```

#### Step 2: Build & Run
```bash
docker-compose up --build -d
```

This starts 4 containers: PostgreSQL, Redis, Backend API, and Frontend (Nginx).

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | — | Register a new developer account |
| `POST` | `/api/auth/login` | — | Login and get JWT token |
| `GET` | `/api/auth/google` | — | Sign in with Google OAuth |
| `GET` | `/api/auth/github` | — | Sign in with GitHub OAuth |
| `POST` | `/api/projects` | JWT | Create a new project workspace |
| `GET` | `/api/projects` | JWT | List all user projects |
| `POST` | `/api/keys/generate` | JWT | Generate a new API key |
| `GET` | `/api/keys/:projectId` | JWT | List API keys for a project |
| `PUT` | `/api/keys/:id/revoke` | JWT | Revoke an API key |
| `PUT` | `/api/keys/:id/rotate` | JWT | Rotate an API key |
| `GET` | `/api/analytics/:projectId` | JWT | Get project analytics |
| `GET` | `/api/analytics/user/overview` | JWT | Get user overview dashboard |
| `GET` | `/api/billing/plans` | — | Get available plans |
| `GET` | `/api/billing/overview` | JWT | Get billing overview |
| `POST` | `/api/billing/razorpay/create-order` | JWT | Create Razorpay payment order |
| `POST` | `/api/billing/razorpay/verify` | JWT | Verify Razorpay payment |
| `POST` | `/api/ai/chat` | JWT | AI support chat |
| `GET` | `/api/public/data` | API Key | Test public endpoint (requires `x-api-key` header) |

---

## 🔐 Security Architecture

| Layer | Implementation |
| :--- | :--- |
| API Key Storage | bcrypt hashed (10 salt rounds) — never stored in plaintext |
| Password Hashing | bcrypt with salt |
| Authentication | JWT tokens + OAuth 2.0 (Google, GitHub) |
| Rate Limiting | Redis per-minute + daily quotas with in-memory fallback |
| IP Whitelisting | API keys restricted to allowed IPs |
| HTTP Security | Helmet.js (XSS, HSTS, X-Frame-Options) |
| CORS | Restricted to frontend domain only |
| Payment Security | HMAC-SHA256 signature verification |
| SQL Injection | Parameterized queries ($1, $2) throughout |
| RBAC | Admin middleware for admin-only routes |

---

## ⏭️ Future Improvements
- [ ] **Webhook Notifications**: Alert when API keys reach 80%/100% quota
- [ ] **Official SDKs**: Python and JavaScript packages for easy integration
- [ ] **Custom Domains**: Map own domains to API endpoints
- [ ] **Team Collaboration**: Multi-user workspaces with role-based permissions
- [ ] **Geographic Analytics**: World map showing API usage by region
- [ ] **Two-Factor Authentication**: TOTP-based 2FA for dashboard login
- [ ] **API Playground**: Built-in endpoint testing in the dashboard

---

## 👥 Team Members

| Name | Role | Contribution |
| :--- | :--- | :--- |
| **Samir Sonkar** | Backend Developer | REST API, Authentication, Rate Limiting, Payments, AI Integration, Deployment |
| **Sakshi** | Frontend Developer | React Dashboard, UI/UX Design, Charts, AI Assistant Widget, Admin Panel |
| **Rupam** | Database Developer | PostgreSQL Schema, Data Models, Migrations, Redis Config, Analytics Queries |

---

## 📬 Contact
- **GitHub**: [@ltsam26](https://github.com/ltsam26)
- **Email**: sonkarsamir2035@gmail.com
