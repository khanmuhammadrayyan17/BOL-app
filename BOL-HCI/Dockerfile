FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
# Use npm install here to allow generating a lockfile inside the container
# and to tolerate package.json/package-lock differences during CI builds.
RUN npm install --no-audit --no-fund

# Copy sources and build
COPY . .
RUN npm run build

# Production image: nginx serving the built static site
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
