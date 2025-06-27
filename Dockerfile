# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

RUN apk add --no-cache openssl

# Copy package files and install deps
COPY package.json ./
RUN npm install

# Install prisma CLI
RUN npm install -g prisma

# Copy source code
COPY . .

# ✅ Generate Prisma client (for correct binary target)
RUN prisma generate

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "run", "dev"]
