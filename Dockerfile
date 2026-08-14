# ---- Stage 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=https://studiosara.cloud
ARG VITE_TECHPACK_BUILDER_URL=https://sara-techpack-builder.vercel.app
ARG VITE_MOCKUP_API_URL=https://mock-api.studiosara.cloud

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_TECHPACK_BUILDER_URL=$VITE_TECHPACK_BUILDER_URL
ENV VITE_MOCKUP_API_URL=$VITE_MOCKUP_API_URL

RUN npm run build

# ---- Stage 2: Serve with Nginx ----
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1
