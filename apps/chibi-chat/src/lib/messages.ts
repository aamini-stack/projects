import allMessages from '@/lib/data/chat.json'
import emotes from '@/lib/data/emotes.json'
import { binarySearch } from '@/lib/search'

export interface Message {
	index: number
	offsetMilli: number
	from: string
	message: string
}

interface Emote {
	kind: 'emote'
	emoteUrl: string
	emote: string
}

interface Text {
	kind: 'text'
	message: string
}

/** When the video was recorded. */
const recordedAtMilli = new Date('2014-06-25T13:42:43.000').getTime()

export function parseMessage(message: string): (Emote | Text)[] {
	const findMatches = (message: string) => {
		interface Match {
			start: number
			end: number
			emote: string
			id: string
		}

		const matchingEmotes: Match[] = []
		for (const [emote, id] of Object.entries(emotes)) {
			// https://stackoverflow.com/a/6969486/6310030
			const escapeRegex = (input: string) =>
				input.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
			const regex = new RegExp(`\\b${escapeRegex(emote)}\\b`, 'g')

			for (const match of message.matchAll(regex)) {
				matchingEmotes.push({
					start: match.index,
					end: match.index + emote.length,
					id: id,
					emote: emote,
				})
			}
		}

		return matchingEmotes.sort((x, y) => x.start - y.start)
	}

	const children: (Emote | Text)[] = []
	let i = 0
	for (const match of findMatches(message)) {
		if (i < match.start) {
			children.push({
				kind: 'text',
				message: message.substring(i, match.start),
			})
		}
		children.push({
			kind: 'emote',
			emote: match.emote,
			emoteUrl: `https://static-cdn.jtvnw.net/emoticons/v2/${match.id}/static/dark/3.0`,
		})
		i = match.end
	}
	if (i < message.length) {
		children.push({
			kind: 'text',
			message: message.substring(i, message.length),
		})
	}
	return children
}

export function getMessage(i: number): Message {
	const message = allMessages[i]
	if (!message) {
		throw new Error(`Invalid index: ${i.toString()}`)
	}

	const timestamp = new Date(message.date)
	return {
		index: i,
		offsetMilli: timestamp.getTime() - recordedAtMilli,
		from: message.from,
		message: message.message,
	}
}

export function findNextMessage(offsetMilli: number) {
	interface MessageJson {
		date: string
		from: string
		message: string
	}
	const cmpFunction = (message: MessageJson, targetOffsetMilli: number) => {
		const offsetMilli = new Date(message.date).getTime() - recordedAtMilli
		return offsetMilli - targetOffsetMilli
	}

	return binarySearch(allMessages, offsetMilli, cmpFunction)
}

export function printTimestamp(offsetMilli: number) {
	let s = offsetMilli
	const ms = s % 1000
	s = (s - ms) / 1000
	const seconds = s % 60
	s = (s - seconds) / 60
	const minutes = s % 60
	const hours = (s - minutes) / 60

	let timestamp = ''
	if (hours > 0) {
		timestamp += `${hours.toString()}:`
	}
	timestamp += minutes.toString().padStart(2, '0')
	timestamp += ':'
	timestamp += seconds.toString().padStart(2, '0')
	return timestamp
}

export function stringToColour(username: string) {
	const colors: `rgb(${number}, ${number}, ${number})`[] = [
		'rgb(255, 0, 0)',
		'rgb(0, 0, 255)',
		'rgb(0, 128, 0)',
		'rgb(178, 34, 34)',
		'rgb(255, 127, 80)',
		'rgb(154, 205, 50)',
		'rgb(255, 69, 0)',
		'rgb(46, 139, 87)',
		'rgb(218, 165, 32)',
		'rgb(210, 105, 30)',
		'rgb(95, 158, 160)',
		'rgb(30, 144, 255)',
		'rgb(255, 105, 180)',
		'rgb(138, 43, 226)',
		'rgb(0, 255, 127)',
	]

	let hash = 0
	for (let i = 0; i < username.length; i++) {
		hash = username.charCodeAt(i) + ((hash << 5) - hash)
	}

	// biome-ignore lint/style/noNonNullAssertion: Guarenteed to never happen
	return colors[((hash % colors.length) + colors.length) % colors.length]!
}
