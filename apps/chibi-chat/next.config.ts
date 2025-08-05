import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	// https://nextjs.org/docs/messages/next-image-unconfigured-host
	// https://dev.twitch.tv/docs/irc/emotes#cdn-template
	images: {
		domains: ['static-cdn.jtvnw.net'],
	},
}

export default nextConfig
