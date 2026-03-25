export const DEFAULT_REGION = 'us-east-1'
export const DEFAULT_ASSUME_ROLE_NAME = 'AWSControlTowerExecution'
export const DEFAULT_CICD_ROLE_NAME = 'PulumiOperatorRole'
export const DEFAULT_REQUESTED_ACCOUNTS = '[]'
export const DEFAULT_MANAGEMENT_ACCOUNT_NAME = 'aamini-root'
export const DEFAULT_STAGING_ACCOUNT_NAME = 'aamini-staging'
export const DEFAULT_PRODUCTION_ACCOUNT_NAME = 'aamini-production'
export const DEFAULT_ADMINS_GROUP_NAME = 'Admins'
export const DEFAULT_DEVELOPERS_GROUP_NAME = 'Developers'
export const DEFAULT_READONLY_GROUP_NAME = 'ReadOnly'
export const DEFAULT_REPO = 'aamini-stack/projects'
export const DEFAULT_BILLING_ALERT_EMAIL = 'platform-alerts@example.com'
export const DEFAULT_STAGING_BUDGET_USD = '150'
export const DEFAULT_PRODUCTION_BUDGET_USD = '500'
export const DEFAULT_CLOUDFLARE_ORIGIN_HOSTNAME = 'origin.ariaamini.com'
export const DEFAULT_STACK_OPERATION_TIMEOUT_MINUTES = 45
export const DEFAULT_STACK_OPERATION_RETRIES = 2
export const RETRY_BASE_DELAY_MS = 5_000

export const STACK_KEY_ORDER = [
	'organization/global',
	'platform/staging',
	'platform/production',
] as const
