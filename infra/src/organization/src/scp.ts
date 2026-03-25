import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type {
	OrganizationTopology,
	ServiceControlPolicyTopology,
} from './config.ts'

export function createServiceControlPolicies(input: {
	provider: aws.Provider
	topology: OrganizationTopology
	targetIds: Record<string, pulumi.Input<string>>
}) {
	const policies = Object.fromEntries(
		input.topology.serviceControlPolicies.map((policy) => {
			const resource = new aws.organizations.Policy(
				`scp-${policy.key}`,
				{
					name: policy.name,
					content: policy.content,
					type: 'SERVICE_CONTROL_POLICY',
					...(policy.description ? { description: policy.description } : {}),
				},
				{
					provider: input.provider,
					...(policy.importId ? { import: policy.importId } : {}),
				},
			)

			policy.targetKeys.forEach((targetKey) => {
				const targetId = resolvePolicyTargetId(targetKey, input.targetIds)
				const importId = resolveAttachmentImportId(policy, targetKey)
				new aws.organizations.PolicyAttachment(
					`scp-${policy.key}-attachment-${targetKey}`,
					{
						policyId: resource.id,
						targetId,
						...(typeof policy.skipDestroyAttachments === 'boolean'
							? { skipDestroy: policy.skipDestroyAttachments }
							: {}),
					},
					{
						provider: input.provider,
						...(importId ? { import: importId } : {}),
					},
				)
			})

			return [
				policy.key,
				{
					id: resource.id,
					arn: resource.arn,
					name: resource.name,
					type: resource.type,
				},
			]
		}),
	)

	return {
		policies,
		configuredPolicyCount: input.topology.serviceControlPolicies.length,
	}
}

function resolvePolicyTargetId(
	targetKey: string,
	targetIds: Record<string, pulumi.Input<string>>,
): pulumi.Input<string> {
	const targetId = targetIds[targetKey]
	if (!targetId) {
		throw new Error(
			`Service control policy target '${targetKey}' could not be resolved.`,
		)
	}

	return targetId
}

function resolveAttachmentImportId(
	policy: ServiceControlPolicyTopology,
	targetKey: string,
): string | undefined {
	return policy.attachmentImportIds?.[targetKey]
}
