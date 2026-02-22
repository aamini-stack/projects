#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = dirname(__dirname)

const appName = process.env.npm_package_name || process.argv[2]

if (!appName) {
	console.error('Usage: node scripts/docker-build.js <app-name>')
	process.exit(1)
}

const appPath = `${rootDir}/apps/${appName}`
if (!existsSync(appPath)) {
	console.error(`App '${appName}' not found at ${appPath}`)
	process.exit(1)
}

const image = `docker.io/aamini/${appName}:latest`

const cmd = [
	'docker build --platform linux/amd64',
	`--build-arg APP_NAME=${appName}`,
	`--build-arg PORT=${process.env.PORT || '3000'}`,
	`--build-arg NODE_VERSION=${process.env.NODE_VERSION || '22'}`,
	'--target production',
	`-t ${image}`,
	'.',
].join(' ')

console.log(`\n🐳 Building ${image}\n`)

try {
	execSync(cmd, { cwd: rootDir, stdio: 'inherit' })
	execSync(`docker push ${image}`, { stdio: 'inherit' })
	console.log(`\n✓ ${image}\n`)
} catch {
	process.exit(1)
}
