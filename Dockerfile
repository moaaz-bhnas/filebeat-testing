# syntax=docker/dockerfile:1
FROM node:20-bullseye

# Install necessary dependencies
RUN apt-get update && \
    apt-get install -y curl build-essential

# Install Filebeat
RUN curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.17.3-amd64.deb && \
    dpkg -i filebeat-8.17.3-amd64.deb

WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --force

# Copy app source
COPY . .

# Copy Filebeat configuration
COPY filebeat/filebeat.yml /etc/filebeat/filebeat.yml

# Set correct permissions
RUN chmod go-w /etc/filebeat/filebeat.yml

EXPOSE 3000/tcp

# Install global TypeScript
RUN npm install -g typescript

# Build app
RUN npm run build

# Start filebeat and app
CMD filebeat -e & npm start

USER root
