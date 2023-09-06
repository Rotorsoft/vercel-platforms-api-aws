import { InferProjector, prj } from "@rotorsoft/eventually"
import { PostsSchemas } from "./schemas/Posts"

export const Posts = (): InferProjector<typeof PostsSchemas> => ({
  description: "Posts projection",
  schemas: PostsSchemas,
  on: {
    PostCreated: ({ created, stream, data, metadata }) =>
      prj({
        id: stream,
        slug: stream,
        userId: metadata.causation.command?.actor?.id,
        siteId: data.siteId,
        title: data.title,
        published: false,
        createdAt: created,
        updatedAt: created,
      }),
    PostUpdated: async ({ created, stream, data }, map) => {
      // bulk update option: sends patches when not found in map!
      const record = map.records.get(stream)
      if (!record)
        return prj({ ...data, updatedAt: created, where: { id: stream } })

      // record was created in this batch, so let's just patch it in place
      return prj({ ...record, ...data, id: stream })
    },
    PostDeleted: ({ stream }) => prj({ id: stream }),
  },
})
