import { z } from 'zod'

const schema = z.object({})

export const env = schema.parse(process.env)
