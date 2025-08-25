import { PostHog } from 'posthog-node'

const client = new PostHog('phc_LWC2pawiFEeBiZTp3rxnzsebkRVJ1ZkOwsTiZARWXgC', {
	host: 'https://us.i.posthog.com',
})

export function logVisit(ref: string) {
	client.capture({
		distinctId: ref,
		event: 'referral_visit',
	})
}
