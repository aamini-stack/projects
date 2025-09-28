import { Button } from '@aamini/ui/components/button'
import { Card, CardContent } from '@aamini/ui/components/card'
import { Mail, MessageCircle, Send } from 'lucide-react'

export function ContactUs() {
	return (
		<section id="contact-us" className="px-4 py-20 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-4xl">
				{/* Section Header */}
				<div className="mb-16 text-center">
					<h2 className="mb-4 bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
						Contact Us
					</h2>
					<p className="mx-auto max-w-2xl text-lg text-gray-400">
						Ready to create something amazing together? Let's start the
						conversation.
					</p>
					<div className="mt-6 flex justify-center">
						<div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
					</div>
				</div>

				<Card className="transform-none border-gray-700/50 bg-gray-900/50 shadow-2xl backdrop-blur-sm transition-none">
					<CardContent className="p-8">
						<form className="space-y-6" aria-label="Contact form (UI only)">
							<div className="space-y-6">
								{/* Email Input */}
								<div className="space-y-2">
									<label
										htmlFor="contact-email"
										className="flex items-center gap-2 text-sm font-medium text-gray-300"
									>
										<Mail className="h-4 w-4" />
										Email Address
									</label>
									<input
										id="contact-email"
										type="email"
										placeholder="your.email@example.com"
										className="w-full rounded-lg border border-gray-600/50 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
										readOnly
										onFocus={(event) => event.target.blur()}
									/>
								</div>

								{/* Subject Input */}
								<div className="space-y-2">
									<label
										htmlFor="contact-subject"
										className="flex items-center gap-2 text-sm font-medium text-gray-300"
									>
										<MessageCircle className="h-4 w-4" />
										Subject
									</label>
									<input
										id="contact-subject"
										type="text"
										placeholder="What's this about?"
										className="w-full rounded-lg border border-gray-600/50 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
										readOnly
										onFocus={(event) => event.target.blur()}
									/>
								</div>

								{/* Message Textarea */}
								<div className="space-y-2">
									<label
										htmlFor="contact-message"
										className="text-sm font-medium text-gray-300"
									>
										Message
									</label>
									<textarea
										id="contact-message"
										placeholder="Tell us about your project, event, or collaboration idea..."
										rows={6}
										className="w-full resize-none rounded-lg border border-gray-600/50 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
										readOnly
										onFocus={(event) => event.target.blur()}
									/>
								</div>
							</div>

							{/* Form Bottom Section */}
							<div className="flex flex-col gap-6 border-t border-gray-700/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
								{/* reCAPTCHA Mock */}
								<div className="flex items-center gap-3 rounded-lg border border-gray-600/50 bg-gray-800/30 px-4 py-3 backdrop-blur-sm">
									<div className="flex h-5 w-5 items-center justify-center rounded border border-gray-500 bg-gray-700/50">
										<div className="h-2.5 w-2.5 rounded-[1px] bg-blue-400" />
									</div>
									<div className="text-sm text-gray-300">
										<p className="font-medium">I'm not a robot</p>
										<p className="text-xs text-gray-500">reCAPTCHA</p>
									</div>
								</div>

								{/* Send Button */}
								<Button
									type="button"
									size="lg"
									className="group bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:from-blue-600 hover:to-purple-700 hover:shadow-blue-500/40"
								>
									<Send className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
									Send Message
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</section>
	)
}
