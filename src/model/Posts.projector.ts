import { InferProjector, prj } from "@rotorsoft/eventually";
import { PostsSchemas } from "./schemas/Posts";

export const Posts = (): InferProjector<typeof PostsSchemas> => ({
  description: "Posts projection",
  schemas: PostsSchemas,
  on: {
    PostCreated: ({ created, stream, data }) =>
      prj({
        id: stream,
        slug: stream,
        userId: data.userId,
        siteId: data.siteId,
        title: data.title,
        published: false,
        createdAt: created,
        updatedAt: created
      }),
    PostUpdated: ({ created, stream, data }) =>
      prj({ ...data, id: stream, updatedAt: created }),
    PostDeleted: ({ stream }) => prj({ id: stream })
  }
});
