import { Button } from '@aamini/ui/components/button'
import { Card, CardContent } from '@aamini/ui/components/card'
import { Mail, MessageCircle, Send } from 'lucide-react'

export function ContactUs() {
	return (
		<section id="contact-us" className="py-20 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				{/* Section Header */}
				<div className="text-center mb-16">
					<h2 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
						Contact Us
					</h2>
					<p className="text-gray-400 text-lg max-w-2xl mx-auto">
						Ready to create something amazing together? Let's start the
						conversation.
					</p>
					<div className="mt-6 flex justify-center">
						<div className="w-24 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
					</div>
				</div>

				<Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm shadow-2xl">
					<CardContent className="p-8">
						<form className="space-y-6" aria-label="Contact form (UI only)">
							<div className="space-y-6">
								{/* Email Input */}
								<div className="space-y-2">
									<label className="text-sm font-medium text-gray-300 flex items-center gap-2">
										<Mail className="w-4 h-4" />
										Email Address
									</label>
									<input
										type="email"
										placeholder="your.email@example.com"
										className="w-full rounded-lg border border-gray-600/50 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm"
										readOnly
										onFocus={(event) => event.target.blur()}
									/>
								</div>

								{/* Subject Input */}
								<div className="space-y-2">
									<label className="text-sm font-medium text-gray-300 flex items-center gap-2">
										<MessageCircle className="w-4 h-4" />
										Subject
									</label>
									<input
										type="text"
										placeholder="What's this about?"
										className="w-full rounded-lg border border-gray-600/50 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm"
										readOnly
										onFocus={(event) => event.target.blur()}
									/>
								</div>

								{/* Message Textarea */}
								<div className="space-y-2">
									<label className="text-sm font-medium text-gray-300">
										Message
									</label>
									<textarea
										placeholder="Tell us about your project, event, or collaboration idea..."
										rows={6}
										className="w-full rounded-lg border border-gray-600/50 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 resize-none backdrop-blur-sm"
										readOnly
										onFocus={(event) => event.target.blur()}
									/>
								</div>
							</div>

							{/* Form Bottom Section */}
							<div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-700/50">
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
									className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-3 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 group"
								>
									<Send className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
