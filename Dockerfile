# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the application files
COPY . .

# Expose the port the server listens on
EXPOSE 3747

# Start the server
CMD ["node", "server.js"]