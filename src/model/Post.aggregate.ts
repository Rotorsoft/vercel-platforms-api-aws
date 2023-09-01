import { Infer, InferAggregate, Invariant, emit } from "@rotorsoft/eventually"
import { PostSchemas } from "./schemas/Post"

const found: Invariant<Infer<typeof PostSchemas.state>> = {
  description: "Post exists",
  valid: (state) => !!state.slug,
}
const notFound: Invariant<Infer<typeof PostSchemas.state>> = {
  description: "Post does not exists",
  valid: (state) => !state.slug,
}
const notDeleted: Invariant<Infer<typeof PostSchemas.state>> = {
  description: "Post is not deleted",
  valid: (state) => !!state.slug && !state.deleted,
}

export const Post = (stream: string): InferAggregate<typeof PostSchemas> => ({
  description: "A web site where the stream id is the subdomain",
  stream,
  schemas: PostSchemas,
  init: () => ({
    siteId: "",
    userId: "",
    slug: "",
    title: "",
    published: false,
  }),
  reduce: {
    PostCreated: (_, { stream, data }) => ({ ...data, slug: stream }),
    PostUpdated: (_, { data }) => data,
    PostDeleted: () => ({ deleted: true }),
  },
  given: {
    CreatePost: [notFound],
    UpdatePost: [found, notDeleted],
    DeletePost: [found],
  },
  on: {
    CreatePost: async (data) => emit("PostCreated", data),
    UpdatePost: async (data) => emit("PostUpdated", data),
    DeletePost: async (data, { deleted }) =>
      deleted ? [] : emit("PostDeleted", data),
  },
})
