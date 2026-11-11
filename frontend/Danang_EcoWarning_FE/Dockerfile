FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_GOONG_MAP_TILES_KEY
ARG VITE_OPENWEATHER_API_KEY
ENV VITE_GOONG_MAP_TILES_KEY=$VITE_GOONG_MAP_TILES_KEY
ENV VITE_OPENWEATHER_API_KEY=$VITE_OPENWEATHER_API_KEY
ENV VITE_OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5
RUN npm run build
FROM nginx:1.28-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
