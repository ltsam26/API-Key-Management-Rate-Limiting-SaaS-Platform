# Use official Node.js lts image
FROM node:22-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source
COPY . .

# Expose the API port (as per .env simulation 5050, but usually 5000 in prod)
# We will use the PORT env var in docker-compose
EXPOSE 5050

# Start command
CMD ["node", "src/server.js"]