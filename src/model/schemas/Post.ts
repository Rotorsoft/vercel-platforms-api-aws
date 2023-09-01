import { CreatePost } from "./CreatePost.schema"
import { DeletePost } from "./DeletePost.schema"
import { Post } from "./Post.schema"
import { PostCreated } from "./PostCreated.schema"
import { PostDeleted } from "./PostDeleted.schema"
import { PostUpdated } from "./PostUpdated.schema"
import { UpdatePost } from "./UpdatePost.schema"

export const PostSchemas = {
  state: Post,
  commands: {
    CreatePost,
    UpdatePost,
    DeletePost,
  },
  events: {
    PostCreated,
    PostUpdated,
    PostDeleted,
  },
}
