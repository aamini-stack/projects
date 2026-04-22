import 'varlock/auto-load'
import { getDb } from '../src/db/connection'
import {
	user,
	agents,
	agentQuestionnaires,
	session,
	account,
	consumers,
	consumerQuestionnaires,
} from '../src/db/tables'
import { writeFile } from 'fs/promises'
import { join } from 'path'

// Hardcoded seed data for deterministic tests
const SEED_AGENTS = [
	{
		index: 0,
		name: 'James Thomas',
		agency: 'EXP Realty',
		experience: '10+ years luxury market specialist',
		zipCodes: ['60601', '60602', '60603', '60604', '60605'],
		services: ['Luxury', 'Investors', 'Commercial'],
		peacePactSigned: true,
		weights: { 'working-style': 3, communication: 3, transparency: 2, fit: 1 },
		answers: {
			'A.1': 2,
			'A.2': 2,
			'A.3': 1,
			'A.4': 0,
			'A.5': 0,
			'A.6': 0,
			'A.7': 0,
			'A.8': 0,
			'A.9': 2,
			'A.10': 1,
			'A.11': 2,
			'A.12': 2,
		},
	},
	{
		index: 1,
		name: 'James Martin',
		agency: 'Coldwell Banker',
		experience: '7+ years relocation specialist',
		zipCodes: ['85001', '85003', '85004', '85006', '85007'],
		services: ['First-time Buyers', 'Sellers'],
		peacePactSigned: false,
		weights: { 'working-style': 1, communication: 2, transparency: 1, fit: 3 },
		answers: {
			'A.1': 1,
			'A.2': 2,
			'A.3': 1,
			'A.4': 0,
			'A.5': 2,
			'A.6': 2,
			'A.7': 0,
			'A.8': 1,
			'A.9': 2,
			'A.10': 2,
			'A.11': 1,
			'A.12': 0,
		},
	},
	{
		index: 2,
		name: 'James White',
		agency: 'Keller Williams',
		experience: '10+ years luxury market specialist',
		zipCodes: ['60601', '60602', '60603', '60604', '60605'],
		services: ['Buyers', 'New Construction', 'Land'],
		peacePactSigned: false,
		weights: { 'working-style': 5, communication: 5, transparency: 1, fit: 5 },
		answers: {
			'A.1': 2,
			'A.2': 1,
			'A.3': 1,
			'A.4': 1,
			'A.5': 0,
			'A.6': 1,
			'A.7': 1,
			'A.8': 2,
			'A.9': 2,
			'A.10': 1,
			'A.11': 0,
			'A.12': 2,
		},
	},
	{
		index: 3,
		name: 'James Ramirez',
		agency: 'Compass',
		experience: '15+ years commercial & residential',
		zipCodes: ['85001', '85003', '85004', '85006', '85007'],
		services: ['Buyers', 'Sellers', 'Property Management'],
		peacePactSigned: false,
		weights: { 'working-style': 3, communication: 3, transparency: 1, fit: 2 },
		answers: {
			'A.1': 1,
			'A.2': 1,
			'A.3': 1,
			'A.4': 1,
			'A.5': 2,
			'A.6': 0,
			'A.7': 1,
			'A.8': 0,
			'A.9': 0,
			'A.10': 2,
			'A.11': 2,
			'A.12': 1,
		},
	},
	{
		index: 4,
		name: 'James Johnson',
		agency: 'Berkshire Hathaway HomeServices',
		experience: '5+ years residential sales',
		zipCodes: ['77001', '77002', '77004', '77006'],
		services: ['Buyers', 'Sellers', 'Relocation'],
		peacePactSigned: false,
		weights: { 'working-style': 2, communication: 2, transparency: 5, fit: 4 },
		answers: {
			'A.1': 2,
			'A.2': 0,
			'A.3': 1,
			'A.4': 1,
			'A.5': 1,
			'A.6': 2,
			'A.7': 1,
			'A.8': 1,
			'A.9': 0,
			'A.10': 0,
			'A.11': 1,
			'A.12': 0,
		},
	},
	{
		index: 5,
		name: 'James Garcia',
		agency: "Sotheby's International Realty",
		experience: '15+ years commercial & residential',
		zipCodes: ['90210', '90211', '90212'],
		services: ['Luxury', 'Investors', 'Commercial'],
		peacePactSigned: false,
		weights: { 'working-style': 5, communication: 5, transparency: 5, fit: 1 },
		answers: {
			'A.1': 1,
			'A.2': 0,
			'A.3': 1,
			'A.4': 1,
			'A.5': 2,
			'A.6': 1,
			'A.7': 1,
			'A.8': 0,
			'A.9': 0,
			'A.10': 1,
			'A.11': 0,
			'A.12': 2,
		},
	},
	{
		index: 6,
		name: 'James Martinez',
		agency: 'Re/Max',
		experience: '5+ years residential sales',
		zipCodes: ['77001', '77002', '77004', '77006'],
		services: ['Buyers', 'New Construction', 'Land'],
		peacePactSigned: false,
		weights: { 'working-style': 3, communication: 4, transparency: 5, fit: 3 },
		answers: {
			'A.1': 2,
			'A.2': 2,
			'A.3': 1,
			'A.4': 1,
			'A.5': 1,
			'A.6': 0,
			'A.7': 1,
			'A.8': 1,
			'A.9': 0,
			'A.10': 0,
			'A.11': 2,
			'A.12': 0,
		},
	},
	{
		index: 7,
		name: 'James Wilson',
		agency: 'Compass',
		experience: '3+ years first-time buyer expert',
		zipCodes: ['90210', '90211', '90212'],
		services: ['Sellers', 'Staging', 'Marketing'],
		peacePactSigned: true,
		weights: { 'working-style': 2, communication: 2, transparency: 4, fit: 4 },
		answers: {
			'A.1': 1,
			'A.2': 2,
			'A.3': 2,
			'A.4': 1,
			'A.5': 2,
			'A.6': 2,
			'A.7': 1,
			'A.8': 2,
			'A.9': 0,
			'A.10': 1,
			'A.11': 1,
			'A.12': 2,
		},
	},
	{
		index: 8,
		name: 'James Moore',
		agency: 'Berkshire Hathaway HomeServices',
		experience: '2+ years new construction focus',
		zipCodes: ['77001', '77002', '77004', '77006'],
		services: ['Buyers', 'Sellers', 'Property Management'],
		peacePactSigned: true,
		weights: { 'working-style': 5, communication: 5, transparency: 4, fit: 1 },
		answers: {
			'A.1': 2,
			'A.2': 1,
			'A.3': 2,
			'A.4': 2,
			'A.5': 1,
			'A.6': 1,
			'A.7': 1,
			'A.8': 0,
			'A.9': 1,
			'A.10': 2,
			'A.11': 1,
			'A.12': 1,
		},
	},
	{
		index: 9,
		name: 'James Perez',
		agency: "Sotheby's International Realty",
		experience: '3+ years first-time buyer expert',
		zipCodes: ['10001', '10002', '10003', '10011'],
		services: ['Luxury', 'Investors', 'Commercial'],
		peacePactSigned: true,
		weights: { 'working-style': 4, communication: 4, transparency: 4, fit: 3 },
		answers: {
			'A.1': 1,
			'A.2': 1,
			'A.3': 2,
			'A.4': 2,
			'A.5': 0,
			'A.6': 0,
			'A.7': 1,
			'A.8': 1,
			'A.9': 1,
			'A.10': 0,
			'A.11': 0,
			'A.12': 0,
		},
	},
	{
		index: 10,
		name: 'James Sanchez',
		agency: 'Re/Max',
		experience: '2+ years new construction focus',
		zipCodes: ['30301', '30303', '30305', '30306', '30307', '30308'],
		services: ['First-time Buyers', 'Sellers'],
		peacePactSigned: true,
		weights: { 'working-style': 2, communication: 2, transparency: 4, fit: 5 },
		answers: {
			'A.1': 0,
			'A.2': 0,
			'A.3': 2,
			'A.4': 2,
			'A.5': 1,
			'A.6': 2,
			'A.7': 1,
			'A.8': 2,
			'A.9': 1,
			'A.10': 2,
			'A.11': 2,
			'A.12': 1,
		},
	},
	{
		index: 11,
		name: 'James Robinson',
		agency: 'Compass',
		experience: '10+ years luxury market specialist',
		zipCodes: ['10001', '10002', '10003', '10011'],
		services: ['Buyers', 'New Construction', 'Land'],
		peacePactSigned: true,
		weights: { 'working-style': 5, communication: 1, transparency: 3, fit: 2 },
		answers: {
			'A.1': 1,
			'A.2': 0,
			'A.3': 2,
			'A.4': 2,
			'A.5': 0,
			'A.6': 1,
			'A.7': 1,
			'A.8': 0,
			'A.9': 1,
			'A.10': 0,
			'A.11': 1,
			'A.12': 0,
		},
	},
	{
		index: 12,
		name: 'James Brown',
		agency: 'Berkshire Hathaway HomeServices',
		experience: '7+ years relocation specialist',
		zipCodes: ['30301', '30303', '30305', '30306', '30307', '30308'],
		services: ['Sellers', 'Staging', 'Marketing'],
		peacePactSigned: true,
		weights: { 'working-style': 4, communication: 4, transparency: 3, fit: 4 },
		answers: {
			'A.1': 0,
			'A.2': 2,
			'A.3': 2,
			'A.4': 2,
			'A.5': 1,
			'A.6': 0,
			'A.7': 1,
			'A.8': 2,
			'A.9': 1,
			'A.10': 1,
			'A.11': 0,
			'A.12': 2,
		},
	},
	{
		index: 13,
		name: 'James Davis',
		agency: "Sotheby's International Realty",
		experience: '10+ years luxury market specialist',
		zipCodes: ['10001', '10002', '10003', '10011'],
		services: ['Buyers', 'Sellers', 'Relocation'],
		peacePactSigned: true,
		weights: { 'working-style': 2, communication: 2, transparency: 3, fit: 1 },
		answers: {
			'A.1': 1,
			'A.2': 2,
			'A.3': 2,
			'A.4': 2,
			'A.5': 0,
			'A.6': 2,
			'A.7': 1,
			'A.8': 0,
			'A.9': 2,
			'A.10': 2,
			'A.11': 2,
			'A.12': 1,
		},
	},
	{
		index: 14,
		name: 'James Hernandez',
		agency: 'Re/Max',
		experience: '7+ years relocation specialist',
		zipCodes: ['85001', '85003', '85004', '85006', '85007'],
		services: ['Luxury', 'Investors', 'Commercial'],
		peacePactSigned: true,
		weights: { 'working-style': 1, communication: 1, transparency: 2, fit: 3 },
		answers: {
			'A.1': 0,
			'A.2': 1,
			'A.3': 2,
			'A.4': 2,
			'A.5': 1,
			'A.6': 1,
			'A.7': 1,
			'A.8': 1,
			'A.9': 2,
			'A.10': 1,
			'A.11': 1,
			'A.12': 2,
		},
	},
	{
		index: 15,
		name: 'James Anderson',
		agency: 'Compass',
		experience: '5+ years residential sales',
		zipCodes: ['60601', '60602', '60603', '60604', '60605'],
		services: ['First-time Buyers', 'Sellers'],
		peacePactSigned: true,
		weights: { 'working-style': 4, communication: 4, transparency: 2, fit: 5 },
		answers: {
			'A.1': 1,
			'A.2': 1,
			'A.3': 2,
			'A.4': 0,
			'A.5': 0,
			'A.6': 0,
			'A.7': 1,
			'A.8': 2,
			'A.9': 2,
			'A.10': 2,
			'A.11': 0,
			'A.12': 1,
		},
	},
	{
		index: 16,
		name: 'James Jackson',
		agency: 'Berkshire Hathaway HomeServices',
		experience: '15+ years commercial & residential',
		zipCodes: ['85001', '85003', '85004', '85006', '85007'],
		services: ['Sellers', 'Staging', 'Marketing'],
		peacePactSigned: true,
		weights: { 'working-style': 2, communication: 2, transparency: 2, fit: 2 },
		answers: {
			'A.1': 0,
			'A.2': 0,
			'A.3': 0,
			'A.4': 0,
			'A.5': 2,
			'A.6': 2,
			'A.7': 1,
			'A.8': 0,
			'A.9': 2,
			'A.10': 0,
			'A.11': 2,
			'A.12': 0,
		},
	},
	{
		index: 17,
		name: 'James Thompson',
		agency: "Sotheby's International Realty",
		experience: '5+ years residential sales',
		zipCodes: ['60601', '60602', '60603', '60604', '60605'],
		services: ['Buyers', 'Sellers', 'Property Management'],
		peacePactSigned: true,
		weights: { 'working-style': 1, communication: 1, transparency: 1, fit: 4 },
		answers: {
			'A.1': 1,
			'A.2': 0,
			'A.3': 0,
			'A.4': 0,
			'A.5': 0,
			'A.6': 1,
			'A.7': 1,
			'A.8': 1,
			'A.9': 2,
			'A.10': 1,
			'A.11': 1,
			'A.12': 2,
		},
	},
	{
		index: 18,
		name: 'James Clark',
		agency: 'Re/Max',
		experience: '15+ years commercial & residential',
		zipCodes: ['85001', '85003', '85004', '85006', '85007'],
		services: ['Buyers', 'Sellers', 'Relocation'],
		peacePactSigned: true,
		weights: { 'working-style': 4, communication: 4, transparency: 1, fit: 1 },
		answers: {
			'A.1': 0,
			'A.2': 2,
			'A.3': 0,
			'A.4': 0,
			'A.5': 2,
			'A.6': 0,
			'A.7': 1,
			'A.8': 0,
			'A.9': 0,
			'A.10': 0,
			'A.11': 0,
			'A.12': 1,
		},
	},
	{
		index: 19,
		name: 'James Smith',
		agency: 'Compass',
		experience: '2+ years new construction focus',
		zipCodes: ['60601', '60602', '60603', '60604', '60605'],
		services: ['First-time Buyers', 'Sellers'],
		peacePactSigned: true,
		weights: { 'working-style': 3, communication: 3, transparency: 1, fit: 2 },
		answers: {
			'A.1': 2,
			'A.2': 2,
			'A.3': 0,
			'A.4': 0,
			'A.5': 0,
			'A.6': 2,
			'A.7': 1,
			'A.8': 1,
			'A.9': 0,
			'A.10': 1,
			'A.11': 2,
			'A.12': 2,
		},
	},
]

async function downloadPhoto(agentId: string, index: number): Promise<void> {
	const photoUrl = `https://i.pravatar.cc/300?img=${(index % 70) + 1}`
	const response = await fetch(photoUrl)
	if (!response.ok) {
		throw new Error(
			`Failed to download photo for agent ${agentId}: ${response.status}`,
		)
	}
	const buffer = await response.arrayBuffer()
	const filename = `${agentId}.jpg`
	const filepath = join(process.cwd(), 'public', 'agents', filename)
	await writeFile(filepath, Buffer.from(buffer))
}

async function seedAgents() {
	const db = getDb()
	const now = new Date()
	const count = SEED_AGENTS.length

	console.log(`Clearing existing data...`)
	await db.delete(consumerQuestionnaires)
	await db.delete(consumers)
	await db.delete(agentQuestionnaires)
	await db.delete(agents)
	await db.delete(session)
	await db.delete(account)
	await db.delete(user)
	console.log(`Existing data cleared.`)

	console.log(`Seeding ${count} dummy agents...`)

	// Insert into database
	for (const agent of SEED_AGENTS) {
		const userId = `00000000-0000-0000-0000-${String(agent.index).padStart(12, '0')}`
		const agentId = `11111111-1111-1111-1111-${String(agent.index).padStart(12, '0')}`

		await db.insert(user).values({
			id: userId,
			name: agent.name,
			email: `${agent.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
			emailVerified: true,
			image: null,
			createdAt: now,
			updatedAt: now,
		})

		await db.insert(agents).values({
			id: agentId,
			userId,
			agency: agent.agency,
			experience: agent.experience,
			bio: `Experienced real estate professional serving the local community with dedication and expertise.`,
			zipCodesJson: agent.zipCodes,
			servicesJson: agent.services,
			peacePactSigned: agent.peacePactSigned,
			createdAt: now,
			updatedAt: now,
		})

		await db.insert(agentQuestionnaires).values({
			id: `22222222-2222-2222-2222-${String(agent.index).padStart(12, '0')}`,
			agentId,
			status: 'submitted',
			weightsJson: agent.weights,
			answersJson: agent.answers,
			createdAt: now,
			updatedAt: now,
		})
	}

	// Download photos (only if they don't exist)
	console.log('Downloading photos...')
	for (let i = 0; i < count; i++) {
		const agent = SEED_AGENTS[i]
		if (!agent) continue
		const agentId = `11111111-1111-1111-1111-${String(agent.index).padStart(12, '0')}`
		try {
			await downloadPhoto(agentId, i)
			console.log(`  Photo ${i + 1}/${count} downloaded`)
		} catch (err) {
			console.log(`  Photo ${i + 1}/${count} failed: ${String(err)}`)
		}
	}

	console.log(`Successfully seeded ${count} agents!`)
}

seedAgents()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('Seed failed:', err)
		process.exit(1)
	})
