import { client, InferProjector, prj } from "@rotorsoft/eventually"
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
      // get current state to make sure we don't miss any required fields
      const state = map.records.get(stream) ??
        (await client().read(Posts, stream)).at(0)?.state ?? {
          id: stream,
          slug: stream,
          siteId: "-",
          userId: "-",
          title: data.title ?? "-",
          published: false,
          createdAt: created,
          updatedAt: created,
        }
      return prj({ ...state, ...data, id: stream, updatedAt: created })
    },
    PostDeleted: ({ stream }) => prj({ id: stream }),
  },
})
