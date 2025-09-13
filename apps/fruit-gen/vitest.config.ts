import { defineProject } from 'vitest/config'

export default defineProject({
	test: {
		include: [''],
		projects: ['./vitest.config.*.ts'],
	},
})
