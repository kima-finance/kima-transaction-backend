# Base Image
FROM node:22-alpine

# Working Directory
WORKDIR /app

# Copy Dependency List
COPY package*.json ./

# Install Dependencies 
RUN npm install
RUN rm -f .npmrc
EXPOSE 3000
CMD npm run start
