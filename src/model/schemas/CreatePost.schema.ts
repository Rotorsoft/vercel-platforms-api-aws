import { z } from "zod"

export const CreatePost = z.object({
  siteId: z.string(),
  title: z.string(),
  published: z.boolean(),
})
