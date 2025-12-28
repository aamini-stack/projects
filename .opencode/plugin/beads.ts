import type { Plugin } from '@opencode-ai/plugin'

export const Beads: Plugin = async ({ $, directory }) => {
	return {
		'experimental.session.compacting': async (_input, output) => {
			console.log('🔷 Running bd prime (pre-compaction)')
			const result = await $`bd prime`.cwd(directory)
			output.context.push(result.stdout)
		},
	}
}
