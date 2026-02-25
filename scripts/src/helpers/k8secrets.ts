import * as fs from 'node:fs'
import * as path from 'node:path'
import { $ } from 'zx'
import { listAppDirectories } from './repo.ts'

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function sealAll(repoRoot: string): Promise<void> {
	for (const app of listAppDirectories(repoRoot)) {
		const appDir = path.join(repoRoot, 'apps', app)
		const envFile = path.join(appDir, '.env.local')

		if (!fs.existsSync(envFile)) {
			continue
		}

		const output = path.join(appDir, 'k8s', 'sealed-secret.yaml')
		fs.mkdirSync(path.dirname(output), { recursive: true })

		console.log(`Sealing ${app}...`)

		const created = await $({ cwd: repoRoot, stdio: 'pipe' })`
			kubectl create secret generic ${`${app}-secrets`} \
				--namespace ${app} \
				--from-env-file=${envFile} \
				--dry-run=client -o yaml
		`

		const sealed = await $({
			cwd: repoRoot,
			input: created.stdout,
			stdio: 'pipe',
		})`
			kubeseal --format=yaml \
				--controller-name=sealed-secrets \
				--controller-namespace=kube-system
		`

		const patchedYaml = sealed.stdout.replace(
			new RegExp(`^  name: ${escapeRegex(`${app}-secrets`)}$`, 'm'),
			'  name: secrets',
		)

		fs.writeFileSync(output, patchedYaml)
		console.log(`Written to ${output}`)
	}
}

async function unsealAll(repoRoot: string): Promise<void> {
	const defaultSecretName = process.env.SEALED_SECRET_NAME ?? ''
	const defaultNamespace = process.env.SEALED_SECRET_NAMESPACE ?? ''

	for (const app of listAppDirectories(repoRoot)) {
		const appDir = path.join(repoRoot, 'apps', app)
		const sealedSecretFile = path.join(appDir, 'k8s', 'sealed-secret.yaml')
		const envFile = path.join(appDir, '.env.local')

		if (!fs.existsSync(sealedSecretFile)) {
			continue
		}

		let secretName = defaultSecretName
		if (!secretName) {
			const nameResult = await $({
				cwd: repoRoot,
				nothrow: true,
				stdio: 'pipe',
			})`kubectl create --dry-run=client -f ${sealedSecretFile} -o jsonpath={.spec.template.metadata.name}`
			secretName = nameResult.exitCode === 0 ? nameResult.stdout.trim() : ''
		}
		if (!secretName) {
			secretName = 'secrets'
		}

		let namespace = defaultNamespace
		if (!namespace) {
			const namespaceResult = await $({
				cwd: repoRoot,
				nothrow: true,
				stdio: 'pipe',
			})`kubectl create --dry-run=client -f ${sealedSecretFile} -o jsonpath={.spec.template.metadata.namespace}`
			namespace =
				namespaceResult.exitCode === 0 ? namespaceResult.stdout.trim() : ''
		}
		if (!namespace) {
			namespace = app
		}

		console.log(`Unsealing ${app}...`)
		const exists = await $({ cwd: repoRoot, nothrow: true, stdio: 'pipe' })`
			kubectl get secret ${secretName} --namespace ${namespace}
		`

		if (exists.exitCode !== 0) {
			console.log(
				`Skipping ${app}: secret '${secretName}' not found in namespace '${namespace}'`,
			)
			continue
		}

		const secretResult = await $({ cwd: repoRoot, stdio: 'pipe' })`
			kubectl get secret ${secretName} --namespace ${namespace} -o json
		`
		const secret = JSON.parse(secretResult.stdout) as {
			data?: Record<string, string>
		}

		const entries = Object.entries(secret.data ?? {})
			.sort(([a], [b]) => a.localeCompare(b))
			.map(
				([key, value]) =>
					`${key}=${Buffer.from(value, 'base64').toString('utf8')}`,
			)

		fs.writeFileSync(envFile, `${entries.join('\n')}\n`)
		console.log(`Written to ${envFile}`)
	}
}

export { sealAll, unsealAll }
