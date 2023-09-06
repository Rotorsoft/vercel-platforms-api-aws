import { client, InferProjector, prj } from "@rotorsoft/eventually"
import { SitesSchemas } from "./schemas/Sites"

export const Sites = (): InferProjector<typeof SitesSchemas> => ({
  description: "Site projection",
  schemas: SitesSchemas,
  on: {
    SiteCreated: ({ created, stream, data, metadata }) =>
      prj({
        ...data,
        id: stream,
        userId: metadata.causation.command?.actor?.id,
        font: "",
        createdAt: created,
        updatedAt: created,
      }),
    SiteUpdated: async ({ created, stream, data }, map) => {
      // record upsert option: needs current state to make sure all required fields are included
      const state = map.records.get(stream) ??
        (await client().read(Sites, stream)).at(0)?.state ?? {
          id: stream,
          userId: "-",
          font: "",
          createdAt: created,
          updatedAt: created,
        }
      return prj({ ...state, ...data, id: stream, updatedAt: created })
    },
    SiteDeleted: ({ stream }) => prj({ id: stream }),
  },
})
