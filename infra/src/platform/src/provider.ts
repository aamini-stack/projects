import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

type WorkloadEnvironment = 'staging' | 'production'

type WorkloadAccessEnvironment = {
	accountId: string
	assumeRoleName: string
	organizationAccessRoleArn: string
	pulumiDeployRoleArn: string
}

type WorkloadAccess = {
	region: string
	staging: WorkloadAccessEnvironment
	production: WorkloadAccessEnvironment
}

const config = new pulumi.Config()
const stack = pulumi.getStack()
const organization = pulumi.getOrganization()
const requiredCallerRoleFragment = config.get('requiredCallerRoleFragment')

if (stack !== 'staging' && stack !== 'production') {
	throw new Error(
		`Platform stack must be "staging" or "production", received "${stack}".`,
	)
}

const environment = stack satisfies WorkloadEnvironment
const organizationStackName =
	config.get('organizationStack') ??
	(organization ? `${organization}/organization/global` : 'organization/global')
const organizationStack = new pulumi.StackReference(organizationStackName)

const callerIdentity = aws.getCallerIdentityOutput({})

export const validatedCallerArn = pulumi
	.output(callerIdentity.arn)
	.apply((arn) => {
		if (
			requiredCallerRoleFragment &&
			!arn.includes(requiredCallerRoleFragment)
		) {
			throw new Error(
				`The platform ${environment} stack must be run with a principal containing "${requiredCallerRoleFragment}". Current caller ARN: ${arn}`,
			)
		}

		return arn
	})

const workloadAccess = organizationStack
	.requireOutput('workloadAccess')
	.apply((value) => value as WorkloadAccess)

const environmentAccess = workloadAccess.apply((access) => access[environment])

export const awsRegion = workloadAccess.apply((access) => access.region)

export const workloadProvider = new aws.Provider('workload-provider', {
	region: awsRegion,
	assumeRoles: [
		{
			roleArn: environmentAccess.apply((access) => access.pulumiDeployRoleArn),
			sessionName: `pulumi-platform-${environment}`,
		},
	],
	defaultTags: {
		tags: {
			Environment: environment,
			ManagedBy: 'Pulumi',
			Project: 'aamini-stack',
			Scope: 'platform',
		},
	},
})

export const workloadInvokeOptions = {
	provider: workloadProvider,
}

export { environment, environmentAccess, organizationStackName, workloadAccess }
