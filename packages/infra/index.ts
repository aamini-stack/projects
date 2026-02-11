import * as postgres from './src/postgres'

export const db = {
	host: postgres.postgresHost,
	adminUser: postgres.postgresAdminUser,
	adminPassword: postgres.postgresAdminPassword,
	port: postgres.postgresPort,
}
export const postgresResourceGroup = postgres.postgresResourceGroup
export const postgresServerName = postgres.postgresServerName
