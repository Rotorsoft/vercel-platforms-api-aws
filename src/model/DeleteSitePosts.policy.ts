import { InferPolicy, client } from "@rotorsoft/eventually";
import { DeletePost } from "./schemas/DeletePost.schema";
import { SiteDeleted } from "./schemas/SiteDeleted.schema";
import { Posts } from "./Posts.projector";
import { Post } from "./Post.aggregate";

const schemas = {
  commands: {
    DeletePost
  },
  events: {
    SiteDeleted
  }
};

export const DeleteSitePosts = (): InferPolicy<typeof schemas> => ({
  description: "Deletes all posts when site is deleted",
  schemas,
  on: {
    SiteDeleted: async ({ stream }) => {
      const posts = await client().read(Posts, {
        where: { siteId: stream }
      });
      // delete any remaining posts
      for (const post of posts) {
        await client().command(
          Post,
          "DeletePost",
          {},
          { stream: post.state.id, actor: { id: "DeleteSitePosts", name: "" } }
        );
      }
      return undefined;
    }
  }
});
