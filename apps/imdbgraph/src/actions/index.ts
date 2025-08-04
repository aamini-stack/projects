import { z } from 'astro:schema';
import { fetchSuggestions, getRatings } from '@/lib/db/data';
import { defineAction } from 'astro:actions';

export const server = {
  fetchSuggestions: defineAction({
    input: z.object({
      query: z.string(),
    }),
    handler: fetchSuggestions,
  }),

  fetchRatings: defineAction({
    input: z.object({
      showId: z.string(),
    }),
    handler: getRatings,
  }),
};
