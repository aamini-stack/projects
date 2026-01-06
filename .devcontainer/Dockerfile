FROM node:22

# Install basic development tools and iptables/ipset
RUN apt-get update && apt-get install -y --no-install-recommends \
	less \
	git \
	procps \
	sudo \
	fzf \
	zsh \
	man-db \
	unzip \
	gnupg2 \
	gh \
	iptables \
	ipset \
	iproute2 \
	dnsutils \
	aggregate \
	jq \
	nano \
	vim \
	&& apt-get clean && rm -rf /var/lib/apt/lists/*

RUN corepack enable
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm config set store-dir /pnpm/store --global
WORKDIR /workspace
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm fetch
COPY package.json ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --offline

RUN apt-get update  \
    && apt-get -y --no-install-recommends install  \
        # install any other dependencies you might need
        sudo curl git ca-certificates build-essential \
    && rm -rf /var/lib/apt/lists/*

ENV MISE_DATA_DIR="/mise"
ENV MISE_CONFIG_DIR="/mise"
ENV MISE_CACHE_DIR="/mise/cache"
ENV MISE_INSTALL_PATH="/usr/local/bin/mise"
ENV PATH="/mise/shims:$PATH"
# ENV MISE_VERSION="..."

RUN curl https://mise.run | sh

RUN mkdir -p /mise && chown -R node:node /mise
RUN mise trust
RUN mise install

RUN mkdir -p /mise/cache && chown -R node:node /mise

USER node
