# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Only copy npm-related files
COPY package.json ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy the rest of the app
COPY . .

# Expose port
EXPOSE 3000

# Run dev server
CMD ["npm", "run", "dev"]
