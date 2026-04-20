import { sql } from 'drizzle-orm'
import {
	boolean,
	foreignKey,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/pg-core'

export const listing = pgTable(
	'listing',
	{
		id: varchar('id', { length: 64 }).primaryKey().notNull(),
		slug: varchar('slug', { length: 128 }).notNull(),
		title: text().notNull(),
		city: varchar('city', { length: 80 }).notNull(),
		state: varchar('state', { length: 2 }).notNull(),
		propertyType: varchar('property_type', { length: 40 }).notNull(),
		bedrooms: integer('bedrooms').notNull(),
		bathrooms: integer('bathrooms').notNull(),
		squareFeet: integer('square_feet').notNull(),
		listPrice: integer('list_price').notNull(),
		status: varchar('status', { length: 40 }).notNull(),
		vibeSummary: text('vibe_summary').notNull(),
		heroImageUrl: text('hero_image_url'),
		swipeScore: integer('swipe_score').default(50).notNull(),
	},
	(table) => [
		uniqueIndex('listing_slug_index').on(table.slug),
		index('listing_swipe_score_index').using(
			'btree',
			table.swipeScore.desc().nullsLast().op('int4_ops'),
		),
		index('listing_price_index').using('btree', table.listPrice),
		index('listing_search_trigram_index').using(
			'gin',
			sql`(title || ' ' || city || ' ' || state) gin_trgm_ops`,
		),
	],
)

export const pricePoint = pgTable(
	'price_point',
	{
		id: varchar('id', { length: 64 }).primaryKey().notNull(),
		listingId: varchar('listing_id', { length: 64 }).notNull(),
		recordedAt: timestamp('recorded_at', { withTimezone: false }).notNull(),
		price: integer('price').notNull(),
		eventType: varchar('event_type', { length: 40 }).notNull(),
		title: text().notNull(),
	},
	(table) => [
		index('price_point_listing_id_index').using('btree', table.listingId),
		foreignKey({
			columns: [table.listingId],
			foreignColumns: [listing.id],
			name: 'price_point_listing_id_fk',
		}),
	],
)

export const user = pgTable(
	'user',
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		email: text().notNull(),
		emailVerified: boolean('email_verified').default(false).notNull(),
		image: text(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
	},
	(table) => [uniqueIndex('user_email_index').on(table.email)],
)

export const session = pgTable(
	'session',
	{
		id: text().primaryKey().notNull(),
		userId: text('user_id').notNull(),
		token: text().notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
	},
	(table) => [
		uniqueIndex('session_token_index').on(table.token),
		index('session_user_id_index').using('btree', table.userId),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'session_user_id_fk',
		}),
	],
)

export const account = pgTable(
	'account',
	{
		id: text().primaryKey().notNull(),
		userId: text('user_id').notNull(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at', {
			withTimezone: true,
		}),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
			withTimezone: true,
		}),
		scope: text(),
		idToken: text('id_token'),
		password: text(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
	},
	(table) => [
		index('account_user_id_index').using('btree', table.userId),
		uniqueIndex('account_provider_account_index').on(
			table.providerId,
			table.accountId,
		),
		index('account_provider_index').using(
			'btree',
			table.providerId,
			table.accountId,
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'account_user_id_fk',
		}),
	],
)

export const verification = pgTable(
	'verification',
	{
		id: text().primaryKey().notNull(),
		identifier: text().notNull(),
		value: text().notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
	},
	(table) => [
		index('verification_identifier_index').using('btree', table.identifier),
	],
)
