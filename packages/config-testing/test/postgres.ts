import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { Wait } from 'testcontainers'

type State = {
	container: StartedPostgreSqlContainer
	databaseUrl: string
}

let state: State | undefined

export async function ensurePostgresContainer() {
	const databaseUrl = process.env.DATABASE_URL
	if (databaseUrl) {
		return {
			databaseUrl,
		}
	}

	if (!state) {
		const container = await new PostgreSqlContainer('postgres:17')
			.withDatabase('imdbgraph')
			.withUsername('imdbgraph')
			.withPassword('imdbgraph')
			.withWaitStrategy(Wait.forHealthCheck())
			.start()

		state = {
			container,
			databaseUrl: container.getConnectionUri(),
		}
	}

	return state
}

export async function stopPostgresContainer() {
	if (!state) return
	await state.container.stop()
	state = undefined
}
