# 🚀 SRSync API: Secure API Management & Rate-Limiting SaaS Platform

**A production-ready SaaS platform for developers to manage API keys, monitor usage, and enforce rate-limiting with a built-in AI support engine.**

---

## 🔒 Problem Statement
Managing API security, usage tracking, and tiered subscriptions is complex and time-consuming for developers. Most solutions are either too expensive or lack integrated monitoring and AI-driven support.

## 💡 Solution Overview
SRSync API provides a unified dashboard where developers can:
- **Generate Secure Keys**: Create and manage project-specific API keys.
- **Enforce Rate Limits**: Track and limit requests based on subscription tiers.
- **Simulate Billing**: Test premium features using a high-fidelity payment simulation mode.
- **AI-Powered Support**: Get instant technical help via a Gemini-integrated support desk.

---

## 🛠️ Tech Stack
| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Vanilla CSS (Premium Design), Lucide Icons, Recharts |
| **Backend** | Node.js, Express, JWT, Bcrypt |
| **Data & Cache** | PostgreSQL (Primary DB), Redis (Rate Limiting & Caching) |
| **AI Integration** | Google Gemini 1.5 Flash |
| **Infrastructure** | Docker, Docker Compose, Nginx, AWS EC2 |

---

## ✨ Features
- **Project Workspaces**: Organize API keys by individual projects.
- **Real-time Analytics**: Visual charts for API hits, latency, and status codes.
- **Multi-Plan Billing**: Support for Free, Pro, and Enterprise tiers (Simulation Mode included).
- **Security First**: All keys are stored as cryptographic hashes; JWT-based session management.
- **Responsive UI**: Sleek, glassmorphic dark-mode dashboard.

---

## 🌐 Live Demo & Deployment
- **Live URL**: [http://13.50.245.234](http://13.50.245.234)
- **Deployment**: Hosted on **AWS EC2 (Ubuntu 24.04)** using a containerized architecture with Docker Compose.

---

## 🏗️ Project Folder Structure
```text
├── frontend/             # React application (Vite)
│   ├── src/              # Components, Pages, Hooks, Services
│   └── Dockerfile        # Nginx-based frontend build
├── src/                  # Backend API (Node.js)
│   ├── controllers/      # Route logic handlers
│   ├── models/           # Database schemas and queries
│   ├── routes/           # API path definitions
│   └── middlewares/      # API Key & Rate limiting logic
├── docker-compose.yml    # Full stack orchestration (DB, Redis, API, UI)
└── .env                  # Environment configuration
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
- Docker & Docker Compose
- Node.js v18+ (for local development)

### Step 1: Clone the Repository
```bash
git clone https://github.com/ltsam26/API-Key-Management-Rate-Limiting-SaaS-Platform.git
cd API-Key-Management-Rate-Limiting-SaaS-Platform
```

### Step 2: Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5050
DATABASE_URL=postgresql://postgres:1234@db:5432/api_platform
REDIS_URL=redis://redis:6379
JWT_SECRET=your_super_secret_key
GEMINI_API_KEY=your_gemini_key
RESEND_API_KEY=your_resend_api_key
GOOGLE_CLIENT_ID=...
GITHUB_CLIENT_ID=...
FRONTEND_URL=http://localhost
```

### Step 3: Docker Deployment (Recommended)
```bash
docker-compose up --build -d
# Run initialization script to setup tables
docker exec -it srsync-backend node db-init.js
```

---

## 📡 API Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new developer account |
| `POST` | `/api/projects` | Create a new API workspace |
| `GET` | `/api/keys` | List current active API keys |
| `POST` | `/api/support/chat` | AI support interaction |

---

## ⏭️ Future Improvements
- [ ] **Custom Domains**: Allow users to map their own domains to API endpoints.
- [ ] **Webhooks**: Notify developers when keys reach 90% quota.
- [ ] **SDKs**: Official Python and JavaScript SDKs for easier integration.

---

## 👤 Author / Contact
**Samir Sonkar**
- GitHub: [@ltsam26](https://github.com/ltsam26)
- Email: sonkarsamir2035@gmail.com
