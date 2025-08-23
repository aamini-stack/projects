const readline = require('readline')

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})

rl.question('Enter the company name (e.g., "Google"): ', (company) => {
	rl.question(
		'Enter the application date (YYYY-MM-DD, e.g., "2024-08-21"): ',
		(date) => {
			const ref = `${company.toLowerCase().replace(/\s/g, '-')}-app-${date}`
			const url = `https://yourportfolio.com/?ref=${ref}`
			console.log(`\nGenerated Referral URL:`)
			console.log(url)
			rl.close()
		},
	)
})
