#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = dirname(__dirname)

// Get app name from npm_package_name (when run from pnpm) or CLI arg
const appName = process.env.npm_package_name || process.argv[2]

// Get optional build args
const nodeVersion = process.env.NODE_VERSION || '22'
const port = process.env.PORT || '3000'

if (!appName) {
	console.error('ERROR: App name required')
	console.error('Usage: node scripts/docker-build.js <app-name>')
	console.error('   or: pnpm --filter=<app-name> docker:build')
	process.exit(1)
}

// Validate app exists
const appPath = `${rootDir}/apps/${appName}`
if (!existsSync(appPath)) {
	console.error(`ERROR: App '${appName}' not found at ${appPath}`)
	process.exit(1)
}

// Validate Dockerfile exists
const dockerfile = `${rootDir}/docker/Dockerfile`
if (!existsSync(dockerfile)) {
	console.error(`ERROR: Dockerfile not found at ${dockerfile}`)
	process.exit(1)
}

// Build the Docker image
const buildArgs = [
	`--build-arg APP_NAME=${appName}`,
	`--build-arg PORT=${port}`,
	`--build-arg NODE_VERSION=${nodeVersion}`,
].join(' ')

const cmd = `docker build ${buildArgs} -f docker/Dockerfile -t ${appName}:latest .`

console.log(`\n🐳 Building Docker image for ${appName}...\n`)
console.log(`Command: ${cmd}\n`)

try {
	execSync(cmd, { cwd: rootDir, stdio: 'inherit' })
	console.log(`\n✓ Successfully built ${appName}:latest\n`)
} catch (error) {
	console.error(error)
	console.error(`\n✗ Failed to build ${appName}\n`)
	process.exit(1)
}
