import { defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { sendEmail } from '@/lib/email'

export const server = {
	sendEmail: defineAction({
		input: z.object({ message: z.string().nonempty() }),
		handler: async ({ message }, context) =>
			sendEmail({ message, ipAddress: context.clientAddress }),
	}),
}
