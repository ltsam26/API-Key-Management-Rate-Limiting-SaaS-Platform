# API-Key-Management-Rate-Limiting-SaaS-Platform
Production-grade API Key Management and Rate Limiting SaaS platform that provides secure API access, usage control, analytics tracking, and scalable traffic management. Built with Node.js, Express, PostgreSQL, and Redis, it enables project creation, secure API key generation, rate limiting, and real-time monitoring of API usage.
## Features
- Register and log in securely using JWT authentication
- Create multiple projects
- Generate and manage secure API keys
- Protect APIs using API key middleware
- Apply rate limiting to prevent API abuse
- Track API usage with real-time analytics
- Monitor request logs and performance
## 🔐 Authentication & Security
- WT-based user authentication
- Password hashing using bcrypt
-  routes with middleware
-  API key hashing (not stored in plain text)
-  Ownership validation for API keys
## 🔑 API Key Management System
- Secure API key generation using crypto module
- Masked API key display for security
- API key lifecycle management (create, view, revoke)
- Header-based validation using x-api-key
- Scoped permissions for controlled API access
## ⚡Rate Limiting Feature
- Per-second, per-minute, and per-day limits
- Sliding window and token bucket concepts
- Abuse prevention and server protection
- Automatic blocking (HTTP 429) when limits exceed
## 📊 Usage Logging & Analytics
- API request count
- Endpoints accessed
- Status codes
- Timestamps
- Success vs failed requests
- Daily and total usage statistics
## 📈 Developer Experience
- View API usage graphs
- Monitor request activity
- Manage projects and API keys
- Analyze performance metrics
- Track rate limit consumption
## 🛠️ Tech Stack Used
- Node.js
- Express.js
- PostgreSQL
- Redis
- JWT Authentication
- Bcrypt (Password Security)
- Winston (Logging)
