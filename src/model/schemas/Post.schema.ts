import { z } from "zod"

export const Post = z.object({
  siteId: z.string(),
  userId: z.string(),
  slug: z.string(),
  title: z.string(),
  published: z.boolean(),
  description: z.string().optional(),
  content: z.string().optional(),
  image: z.string().optional(),
  userImage: z.string().optional(),
  deleted: z.boolean().optional(),
})
