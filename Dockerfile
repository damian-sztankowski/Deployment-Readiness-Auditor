FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm i -g serve

COPY . .

RUN npm run build

ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.js"]
