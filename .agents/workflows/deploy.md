---
description: Comprehensive Deployment Workflow for SRsync SaaS Platform
---

# 🚀 Deployment Workflow

Follow these steps to deploy the SRsync platform from scratch on an AWS EC2 instance.

## 1. Prerequisites
- AWS EC2 Instance (Ubuntu 24.04 recommended)
- Docker & Docker Compose installed on the instance
- Domain name (optional, but recommended for HTTPS)

## 2. Server Preparation
// turbo
1. Clone the repository on the server:
   ```bash
   git clone https://github.com/ltsam26/API-Key-Management-Rate-Limiting-SaaS-Platform.git
   cd API-Key-Management-Rate-Limiting-SaaS-Platform
   ```

2. Create the configuration file:
   ```bash
   nano .env
   ```
   *(Paste your production keys for Google, GitHub, and Gemini here)*

## 3. Infrastructure Launch
// turbo
1. Build and start the containers:
   ```bash
   sudo docker-compose up --build -d
   ```

2. Verify that all 4 containers are healthy:
   ```bash
   sudo docker ps
   ```

## 4. Database Initialization
// turbo
1. Initialize the tables and schema:
   ```bash
   sudo docker exec -it srsync-backend node db-init.js
   ```

2. (Optional) Run the migration script if updating an existing database:
   ```bash
   sudo docker exec -it srsync-backend node db-migrate.js
   ```

## 5. Post-Deployment Checks
1. Access the frontend at `http://<YOUR_EC2_IP>`
2. Attempt a **Sign Up** to verify Postgres connectivity.
3. Attempt to **Create a Project** to verify Redis rate-limiting initialization.
4. Use the **Support Chat** to verify Gemini AI API key validity.

---
**Troubleshooting**: If you encounter a `500 Server Error` on signup, check the logs:
`sudo docker logs srsync-backend --tail 50`
