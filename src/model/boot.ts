import {
  Builder,
  InMemoryBroker,
  app,
  broker,
  store,
} from "@rotorsoft/eventually"
import { PostgresProjectorStore, PostgresStore } from "@rotorsoft/eventually-pg"
import { Posts } from "./Posts.projector"
import { Site } from "./Site.aggregate"
import { Sites } from "./Sites.projector"
import { Post } from "./Post.aggregate"
import { DeleteSitePosts } from "./DeleteSitePosts.policy"

export const boot = (): Builder => {
  store(PostgresStore("platforms_events"))
  app()
    // commits state every 100 events
    .with(Site, { scope: "public", commit: (snap) => snap.applyCount >= 100 })
    .with(Post, { scope: "public", commit: (snap) => snap.applyCount >= 100 })
    .with(Sites, {
      projector: {
        store: PostgresProjectorStore("Sites"),
        indexes: [{ userId: "asc" }],
      },
    })
    .with(Posts, {
      projector: {
        store: PostgresProjectorStore("Posts"),
        indexes: [{ userId: "asc" }, { siteId: "asc" }],
      },
    })
    .with(DeleteSitePosts)
    .build()

  // TODO: control drain with options
  // unsubscribed broker, commands will drain
  broker(InMemoryBroker({ subscribed: false }))

  return app()
}
