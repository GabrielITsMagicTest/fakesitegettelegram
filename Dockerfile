FROM ghcr.io/puppeteer/puppeteer:24.30.0

# Set environment variables for Puppeteer to skip Chromium download and use the installed version of Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Install dependencies, including Google Chrome
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    google-chrome-stable \
    --no-install-recommends

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of your application code
COPY . .

# Run the application
CMD ["node", "index.js"]
