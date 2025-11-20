# Build Stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Pass the API key at build time if strictly necessary, 
# but for client-side apps, it's better to inject variables at runtime 
# or use a proxy if the key must be hidden. 
# For this demo, we assume the key is bundled or loaded from env.
RUN npm run build

# Serve Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Cloud Run requires listening on port 8080 by default
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
