import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		// Transform string to Date object
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
	}),
});
const test = defineCollection({
	type: 'data',
	schema: z.object({
		categories: z.object({
			accessibility: z.object({
				score: z.number(),
			})
		})
	}),
});

export const collections = { blog, test };
