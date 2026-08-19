# ── Build ──────────────────────────────────────────────────────────────────────
FROM 883907968008.dkr.ecr.eu-west-1.amazonaws.com/ecr-public/docker/library/node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ── Serve ──────────────────────────────────────────────────────────────────────
FROM 883907968008.dkr.ecr.eu-west-1.amazonaws.com/ecr-public/docker/library/nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
