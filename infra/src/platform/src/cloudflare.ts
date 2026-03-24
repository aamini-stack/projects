import * as cloudflare from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'

const config = new pulumi.Config()
const stack = pulumi.getStack()

const cloudflareZoneName = config.get('cloudflareZoneName') ?? 'ariaamini.com'
const cloudflareZoneIdConfig = config.get('cloudflareZoneId')
const cloudflareProxied = config.getBoolean('cloudflareProxied') ?? true
const cloudflareTtl = config.getNumber('cloudflareTtl') ?? 1
const cloudflareHostnames = config.getObject<string[]>(
	'cloudflareHostnames',
) ?? ['*', '*.staging']

const cloudflareOriginHostname = config
	.require('cloudflareOriginHostname')
	.trim()
	.replace(/^https?:\/\//, '')
	.replace(/\/.*/, '')
	.replace(/\.$/, '')

const resolvedCloudflareZoneId = cloudflareZoneIdConfig
	? pulumi.output(cloudflareZoneIdConfig)
	: cloudflare.getZoneOutput({
			filter: {
				name: cloudflareZoneName,
				status: 'active',
				match: 'all',
			},
		}).zoneId

const dnsRecords = cloudflareHostnames.map((hostname) => {
	const resourceSuffix =
		hostname === '@'
			? 'apex'
			: hostname
					.replace(/\*/g, 'wildcard')
					.replace(/[^a-zA-Z0-9]/g, '-')
					.replace(/-+/g, '-')
					.replace(/^-|-$/g, '')
	return new cloudflare.DnsRecord(`cloudflare-${resourceSuffix}`, {
		zoneId: resolvedCloudflareZoneId,
		name: hostname,
		type: 'CNAME',
		content: cloudflareOriginHostname,
		ttl: cloudflareTtl,
		proxied: cloudflareProxied,
		comment: `Managed by Pulumi platform/${stack}`,
		tags: ['managed-by:pulumi', `environment:${stack}`, 'scope:dns'],
	})
})

export const cloudflareDns = {
	zoneName: cloudflareZoneName,
	zoneId: resolvedCloudflareZoneId,
	originHostname: cloudflareOriginHostname,
	hostnames: cloudflareHostnames,
	recordIds: dnsRecords.map((record) => record.id),
}
