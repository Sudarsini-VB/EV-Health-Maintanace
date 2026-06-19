FROM node:20-alpine

WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy simple fallback as the main page
COPY fallback.html ./index.html

EXPOSE 5173

# Start serve pointing to current directory (so index.html is served at /)
CMD ["serve", "-s", ".", "-l", "tcp://0.0.0.0:5173"]
