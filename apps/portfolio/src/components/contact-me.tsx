'use client'

import { actions } from 'astro:actions'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import Email from '@/components/icons/email.svg'
import { Button } from '@/components/primitives/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/primitives/card'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/primitives/form'
import { Textarea } from '@/components/primitives/textarea'

const formSchema = z.object({
	message: z.string().nonempty(),
})

type FormValues = z.infer<typeof formSchema>

export function ContactCard() {
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			message: '',
		},
	})

	async function onSubmit(values: z.infer<typeof formSchema>) {
		const { error } = await actions.sendEmail({ message: values.message })
		if (error) {
			toast.error('An unexpected error occurred')
		} else {
			toast.success('Message sent successfully!')
			form.reset()
		}
	}

	return (
		<Form {...form}>
			<form
				className="w-full max-w-lg"
				id="email"
				method="POST"
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<Card>
					<CardHeader>
						<CardTitle>Reach out!</CardTitle>
						<CardDescription>
							Either email me at{' '}
							<a
								className="text-cyan-600 hover:underline"
								href="mailto:aamini1024@gmail.com"
							>
								aamini1024@gmail.com
							</a>{' '}
							or fill out the form below
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FormField
							control={form.control}
							name="message"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Message</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Your message..."
											className="h-40 resize-none"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
					<CardFooter className="flex-col gap-2">
						<Button
							form="email"
							type="submit"
							className="w-40"
							disabled={form.formState.isSubmitting}
						>
							{form.formState.isSubmitting ? 'Sending...' : 'Send Message'}
							<img
								src={Email.src}
								alt="Email Icon"
								width={16}
								height={16}
								className="ml-2"
							/>
						</Button>
					</CardFooter>
				</Card>
			</form>
		</Form>
	)
}
