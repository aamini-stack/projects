import { defineAction } from 'astro:actions'
import { z } from 'astro:schema'
import { sendEmail } from '@/lib/email'

export const server = {
	sendEmail: defineAction({
		input: z.object({
			message: z.string().nonempty(),
			email: z.string().email(),
		}),
		handler: async ({ message, email }, context) =>
			sendEmail({ message, email, ipAddress: context.clientAddress }),
	}),
}
