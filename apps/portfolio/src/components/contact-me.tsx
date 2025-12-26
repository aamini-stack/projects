import Email from '@/components/icons/email.svg'
import { Button } from '@aamini/ui/components/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@aamini/ui/components/card'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@aamini/ui/components/form'
import { Input } from '@aamini/ui/components/input'
import { Textarea } from '@aamini/ui/components/textarea'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
	email: z.email({ message: 'Invalid email address' }),
	message: z.string().min(1, 'Message is required'),
})

type FormValues = z.infer<typeof formSchema>

export function ContactCard() {
	const form = useForm<FormValues>({
		resolver: standardSchemaResolver(formSchema),
		defaultValues: {
			email: '',
			message: '',
		},
	})

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			const response = await fetch('/api/sendEmail', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(values),
			})

			if (!response.ok) throw new Error('Failed to send')

			toast.success('Message sent successfully!')
			form.reset()
		} catch {
			toast.error('An unexpected error occurred')
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
				<Card data-testid="contact-card">
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
					<CardContent className="flex flex-col gap-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="your.email@example.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
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
							<Email />
						</Button>
					</CardFooter>
				</Card>
			</form>
		</Form>
	)
}
