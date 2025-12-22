FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
