# Base Image
FROM node:22-alpine

# Working Directory
WORKDIR /app

# Copy Dependency List
COPY package*.json ./

# Install Dependencies 
RUN npm install

# Copy Source Code
COPY src ./src
COPY tsconfig.json ./

# Execute the Build Script
RUN npm run build

# Start the Application (Assuming output in 'build')
CMD [ "node", "build/index.js" ] 
