# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_API_TIMEOUT
ARG VITE_TAG_PRODUTO

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT
ENV VITE_TAG_PRODUTO=$VITE_TAG_PRODUTO

# Build the application
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy build output to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
