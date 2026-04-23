# Stage 1: build
FROM node:18-bullseye-slim AS builder
WORKDIR /app
# Install system build dependencies needed at build time (python, compilers)
RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates \
	python3 \
	python-is-python3 \
	&& rm -rf /var/lib/apt/lists/*

# Install deps
COPY package*.json ./
RUN npm ci

# Copy sources and build
COPY . .
RUN npm run build

# Stage 2: runtime
FROM node:18-bullseye-slim
WORKDIR /app
ENV NODE_ENV=production

# Install system deps required for Whisper (python, ffmpeg) and building wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates \
	python3 \
	python-is-python3 \
	python3-pip \
	ffmpeg \
	libsndfile1 \
	libgomp1 \
	libopenblas-base \
	&& rm -rf /var/lib/apt/lists/*

# Copy production deps and built output
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Install Python packages (whisper + CPU PyTorch). This can be large.
RUN python3 -m pip install --no-cache-dir --upgrade pip setuptools wheel && \
	# Install a prebuilt CPU wheel for torch to avoid compiling from source (much faster)
	python3 -m pip install --no-cache-dir "numpy<2" torch==2.2.0+cpu -f https://download.pytorch.org/whl/cpu/torch_stable.html && \
	# Install whisper after torch is in place
	python3 -m pip install --no-cache-dir openai-whisper

# Add start script that verifies required env vars are present (mounted .env)
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

EXPOSE 3000
ENTRYPOINT ["/bin/sh", "/usr/local/bin/start.sh"]
