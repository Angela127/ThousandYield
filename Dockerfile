FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Expose the Vite default port
EXPOSE 5173
CMD ["npm", "run", "dev:frontend"]
