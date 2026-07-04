FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy the rest of the source code
COPY . .

# Run postinstall manually now that source files are present
RUN npm run postinstall

# Build the React Router app
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/build ./build

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
