# Stage 1: Build
FROM node:22 AS build

# Install git and other dependencies required for building
RUN apt-get update && apt-get -y install build-essential

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:22 AS production

# Set working directory
WORKDIR /app

# Create a non-root user and use it
RUN adduser appuser && addgroup appgroup && usermod -G appgroup appuser
USER appuser

# Copy the built files and necessary directories/files from the build stage
COPY --chown=appuser:appgroup --from=build /app/build ./build
COPY --chown=appuser:appgroup --from=build /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=build /app/package.json ./package.json
COPY --chown=appuser:appgroup --from=build /app/tsconfig.json ./tsconfig.json

# Switch to root temporarily to ensure correct ownership
USER root
RUN chown -R appuser:appgroup /app

# Switch back to non-root user
USER appuser

# Expose the application port
EXPOSE 3000
# Run migrations and start the application in production mode
CMD npm run start
