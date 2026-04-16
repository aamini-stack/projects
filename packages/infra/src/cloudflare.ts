import * as cloudflare from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'

import { ingressPublicIpAddress } from './aks'

const config = new pulumi.Config()
const stack = pulumi.getStack()
const provider = new cloudflare.Provider('cloudflare-provider', {
	apiToken: config.requireSecret('cloudflareApiToken'),
})

const cloudflareZoneName = config.get('cloudflareZoneName') ?? 'ariaamini.com'
const cloudflareZoneIdConfig = config.get('cloudflareZoneId')
const cloudflareProxied = config.getBoolean('cloudflareProxied') ?? true
const cloudflareTtl = config.getNumber('cloudflareTtl') ?? 1
const cloudflareHostnames = config.getObject<string[]>(
	'cloudflareHostnames',
) ?? ['*', '*.staging']

const cloudflareOriginTarget = pulumi
	.output(config.get('cloudflareOriginHostname') ?? ingressPublicIpAddress)
	.apply((value) => {
		const normalizedValue = value?.trim()
		if (!normalizedValue) {
			throw new Error('Missing Cloudflare origin target')
		}

		return normalizedValue
			.replace(/^https?:\/\//, '')
			.replace(/\/.*/, '')
			.replace(/\.$/, '')
	})

function getRecordType(value: string): 'A' | 'AAAA' | 'CNAME' {
	if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) {
		return 'A'
	}

	if (value.includes(':')) {
		return 'AAAA'
	}

	return 'CNAME'
}

const resolvedCloudflareZoneId = cloudflareZoneIdConfig
	? pulumi.output(cloudflareZoneIdConfig)
	: cloudflare.getZoneOutput(
			{
				filter: {
					name: cloudflareZoneName,
					status: 'active',
					match: 'all',
				},
			},
			{ provider },
		).zoneId

const dnsRecords = cloudflareHostnames.map((hostname) => {
	const resourceSuffix =
		hostname === '@'
			? 'apex'
			: hostname
					.replace(/\*/g, 'wildcard')
					.replace(/[^a-zA-Z0-9]/g, '-')
					.replace(/-+/g, '-')
					.replace(/^-|-$/g, '')
	return new cloudflare.DnsRecord(
		`cloudflare-${resourceSuffix}`,
		{
			zoneId: resolvedCloudflareZoneId,
			name: hostname,
			type: cloudflareOriginTarget.apply(getRecordType),
			content: cloudflareOriginTarget,
			ttl: cloudflareTtl,
			proxied: cloudflareProxied,
			comment: `Managed by Pulumi platform/${stack}`,
		},
		{ provider },
	)
})

export const cloudflareDns = {
	zoneName: cloudflareZoneName,
	zoneId: resolvedCloudflareZoneId,
	originHostname: cloudflareOriginTarget,
	hostnames: cloudflareHostnames,
	recordIds: dnsRecords.map((record) => record.id),
}
