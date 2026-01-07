import { getGitHubAuthUrl } from '@/routes/api/oauth/github/authorize'
import { createFileRoute } from '@tanstack/react-router'
import { Github } from 'lucide-react'

export const Route = createFileRoute('/login')({
	component: Login,
})

function Login() {
	const handleLogin = async () => {
		const { url } = await getGitHubAuthUrl()
		window.location.href = url
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#E0E7F1]">
			<div className="w-full max-w-md border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
				<div className="mb-8 text-center">
					<h1 className="text-3xl font-black text-black">Welcome to PaaS</h1>
					<p className="mt-2 text-sm font-bold text-neutral-600">
						Sign in to manage your deployments
					</p>
				</div>

				<div className="space-y-4">
					<button
						type="button"
						onClick={handleLogin}
						className="flex w-full items-center justify-center gap-3 border-2 border-black bg-[#FF7E33] px-6 py-4 text-sm font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-[2px_2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-[4px_4px] active:shadow-none"
					>
						<Github className="h-6 w-6" />
						Login with GitHub
					</button>
				</div>
			</div>
		</div>
	)
}
