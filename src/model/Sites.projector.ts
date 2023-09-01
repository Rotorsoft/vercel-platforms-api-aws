import { InferProjector, prj } from "@rotorsoft/eventually"
import { SitesSchemas } from "./schemas/Sites"

export const Sites = (): InferProjector<typeof SitesSchemas> => ({
  description: "Site projection",
  schemas: SitesSchemas,
  on: {
    SiteCreated: ({ created, stream, data }) =>
      prj({
        ...data,
        id: stream,
        font: "",
        createdAt: created,
        updatedAt: created,
      }),
    SiteUpdated: ({ created, stream, data }) =>
      prj({ ...data, id: stream, updatedAt: created }),
    SiteDeleted: ({ stream }) => prj({ id: stream }),
  },
})
