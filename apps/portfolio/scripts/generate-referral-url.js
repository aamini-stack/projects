import { stdin as input, stdout as output } from 'node:process'
import readline from 'node:readline/promises'

const rl = readline.createInterface({ input, output })

// https://www.ariaamini.dev/?utm_source=linkedin&utm_medium=job-application&utm_campaign=stubhub
async function generateUrl() {
	try {
		const utmSource = await rl.question(
			'Enter the UTM Source (e.g., "linkedin"): ',
		)
		const utmMedium = await rl.question(
			'Enter the UTM Medium (e.g., "job-application"): ',
		)
		const utmCampaign = await rl.question(
			'Enter the UTM Campaign (e.g., "stubhub"): ',
		)

		const url = `https://www.ariaamini.dev/?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`
		console.log(`\nGenerated Referral URL:`)
		console.log(url)
	} catch (err) {
		console.error('Error:', err)
	}
}

void generateUrl()
