import { z } from "zod"

export const Site = z.object({
  name: z.string(),
  font: z.string(),
  userId: z.string(),
  description: z.string().optional(),
  logo: z.string().optional(),
  image: z.string().optional(),
  message404: z.string().optional(),
  deleted: z.boolean().optional(),
})
