# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# These will be provided at build time via --build-arg
ARG VITE_API_URL
ARG VITE_INTELLIGENCE_API
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_INTELLIGENCE_API=$VITE_INTELLIGENCE_API
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 8080
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
