#!/usr/bin/env tsx
/**
 * Database seeding script
 * Run with: pnpm tsx src/db/seed.ts
 */

import { createDb } from './client'
import {
	buildLogs,
	clusters,
	deployments,
	domains,
	environmentVariables,
	namespaces,
	oauthTokens,
	previewEnvironments,
	projects,
	teamMembers,
	teams,
	users,
} from './schema'
import {
	testBuildLogs,
	testClusters,
	testDeployments,
	testDomains,
	testEnvVars,
	testNamespaces,
	testPreviewEnvironments,
	testProjects,
	testTeamMembers,
	testTeams,
	testUsers,
} from './__fixtures__/seed-data'

async function seed() {
	console.log('🌱 Seeding database...')
	const db = createDb()

	try {
		// Insert users
		console.log('  → Inserting users...')
		await db.insert(users).values(testUsers)

		// Insert OAuth tokens (optional - for testing)
		console.log('  → Inserting OAuth tokens...')
		await db.insert(oauthTokens).values([
			{
				id: 'token-1',
				userId: 'user-1',
				provider: 'github',
				accessTokenEncrypted: 'test-token-1',
				providerAccountId: 'gh-alice-123',
				providerUsername: 'alice',
			},
		])

		// Insert teams
		console.log('  → Inserting teams...')
		await db.insert(teams).values(testTeams)

		// Insert team members
		console.log('  → Inserting team members...')
		await db.insert(teamMembers).values(testTeamMembers)

		// Insert projects
		console.log('  → Inserting projects...')
		await db.insert(projects).values(testProjects)

		// Insert deployments
		console.log('  → Inserting deployments...')
		await db.insert(deployments).values(testDeployments)

		// Insert domains
		console.log('  → Inserting domains...')
		await db.insert(domains).values(testDomains)

		// Insert environment variables
		console.log('  → Inserting environment variables...')
		await db.insert(environmentVariables).values(testEnvVars)

		// Insert preview environments
		console.log('  → Inserting preview environments...')
		await db.insert(previewEnvironments).values(testPreviewEnvironments)

		// Insert clusters
		console.log('  → Inserting clusters...')
		await db.insert(clusters).values(testClusters)

		// Insert namespaces
		console.log('  → Inserting namespaces...')
		await db.insert(namespaces).values(testNamespaces)

		// Insert build logs
		console.log('  → Inserting build logs...')
		await db.insert(buildLogs).values(testBuildLogs)

		console.log('✅ Database seeded successfully!')
		console.log('\nTest accounts:')
		console.log('  - alice@example.com (user-1) - Owner of Acme Corp')
		console.log('  - bob@example.com (user-2) - Member of Acme Corp')
		console.log('  - charlie@example.com (user-3) - Owner of Startup Inc')
	} catch (error) {
		console.error('❌ Error seeding database:', error)
		process.exit(1)
	}
}

// Run the seed function
void seed()
