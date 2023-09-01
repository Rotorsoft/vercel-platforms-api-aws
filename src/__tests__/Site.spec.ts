import {
  CommittedEvent,
  broker,
  client,
  dispose,
  log,
  seed,
  sleep,
} from "@rotorsoft/eventually"
import { config } from "@rotorsoft/eventually-pg"
import { randomUUID } from "node:crypto"
import { Pool } from "pg"
import { Posts } from "../model/Posts.projector"
import { Site } from "../model/Site.aggregate"
import { Sites } from "../model/Sites.projector"
import { boot } from "../model/boot"
import { Post } from "../model/Post.aggregate"

describe("Site aggregate with projections", () => {
  const pool = new Pool(config.pg)

  beforeAll(async () => {
    boot()
    await pool.query(`DROP TABLE IF EXISTS "platforms_events";`)
    await pool.query(`DROP TABLE IF EXISTS "platforms_events_subscriptions";`)
    await pool.query(`DROP TABLE IF EXISTS "Sites";`)
    await pool.query(`DROP TABLE IF EXISTS "Posts";`)
    await seed()
  })

  afterAll(async () => {
    await pool.end()
    await dispose()()
  })

  it("should handle commands", async () => {
    const userId = randomUUID()
    const targetSite = {
      stream: randomUUID(),
      actor: { id: userId, name: "actor", roles: [] },
    }
    const targetPost1 = {
      stream: randomUUID(),
      actor: { id: userId, name: "actor", roles: [] },
    }
    const targetPost2 = {
      stream: randomUUID(),
      actor: { id: userId, name: "actor", roles: [] },
    }
    await client().command(
      Site,
      "CreateSite",
      {
        name: "TestSite",
        userId: targetSite.actor.id,
        description: "TestSiteDesc",
      },
      targetSite
    )
    await client().command(
      Site,
      "UpdateSite",
      {
        description: "Just a new description",
      },
      targetSite
    )
    await client().command(
      Post,
      "CreatePost",
      {
        siteId: targetSite.stream,
        userId,
        title: "First Post",
        published: false,
      },
      targetPost1
    )
    await client().command(
      Post,
      "CreatePost",
      {
        siteId: targetSite.stream,
        userId,
        title: "Second Post",
        published: false,
      },
      targetPost2
    )
    await client().command(
      Post,
      "UpdatePost",
      {
        title: "Better title",
      },
      targetPost1
    )
    await client().command(
      Post,
      "UpdatePost",
      {
        description: "Describes my first post",
        content: "Some content",
      },
      targetPost1
    )
    await client().command(
      Post,
      "UpdatePost",
      {
        slug: "just-change-the-slug",
        description: "Slug changed",
      },
      targetPost2
    )
    await broker().drain()

    // test aggregate states
    const siteSnap = await client().load(Site, targetSite.stream)
    const postSnap1 = await client().load(Post, targetPost1.stream)
    const postSnap2 = await client().load(Post, targetPost2.stream)

    expect(siteSnap.state).toEqual({
      description: "Just a new description",
      font: "",
      name: "TestSite",
      userId,
    })
    expect(postSnap1.state).toEqual({
      slug: targetPost1.stream,
      content: "Some content",
      description: "Describes my first post",
      published: false,
      title: "Better title",
      userId,
      siteId: targetSite.stream,
    })
    expect(postSnap2.state).toEqual({
      slug: "just-change-the-slug",
      description: "Slug changed",
      published: false,
      title: "Second Post",
      userId,
      siteId: targetSite.stream,
    })

    // test projections
    const site = await client().read(Sites, targetSite.stream)
    expect(site.at(0)?.state).toMatchObject({
      id: targetSite.stream,
      description: "Just a new description",
      font: "",
      image: null,
      logo: null,
      message404: null,
      name: "TestSite",
      userId,
      userImage: null,
    })

    const p1 = await client().read(Posts, targetPost1.stream)
    const p2 = await client().read(Posts, targetPost2.stream)

    expect(p1.at(0)?.state).toMatchObject({
      description: "Describes my first post",
      id: targetPost1.stream,
      siteId: targetSite.stream,
      title: "Better title",
      content: "Some content",
      published: false,
      image: null,
      userId,
      userImage: null,
    })
    expect(p2.at(0)?.state).toMatchObject({
      description: "Slug changed",
      id: targetPost2.stream,
      siteId: targetSite.stream,
      title: "Second Post",
      content: null,
      published: false,
      image: null,
      userId,
      userImage: null,
    })

    // test deletes and policy
    await client().command(Post, "DeletePost", {}, targetPost1)
    await broker().drain()

    const d1 = await client().read(Posts, targetPost1.stream)
    expect(d1.length).toBe(0)

    await client().command(Site, "DeleteSite", {}, targetSite)
    await broker().drain()

    // let the policy complete the job
    await sleep(100)
    await broker().drain()

    const d2 = await client().read(Posts, targetPost2.stream)
    expect(d2.length).toBe(0)

    const dpostSnap1 = await client().load(Post, targetPost1.stream)
    const dpostSnap2 = await client().load(Post, targetPost2.stream)
    expect(dpostSnap1.state.deleted).toBeTruthy()
    expect(dpostSnap2.state.deleted).toBeTruthy()

    // show events
    const events: CommittedEvent[] = []
    await client().query({ limit: 100 }, (e) => events.push(e))
    log().events(events)
  })
})
