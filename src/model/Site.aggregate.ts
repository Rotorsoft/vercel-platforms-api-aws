import { Infer, InferAggregate, Invariant, emit } from "@rotorsoft/eventually"
import { SiteSchemas } from "./schemas/Site"

const found: Invariant<Infer<typeof SiteSchemas.state>> = {
  description: "Site exists",
  valid: (state) => !!state.name,
}
const notFound: Invariant<Infer<typeof SiteSchemas.state>> = {
  description: "Site does not exists",
  valid: (state) => !state.name,
}
const notDeleted: Invariant<Infer<typeof SiteSchemas.state>> = {
  description: "Site is not deleted",
  valid: (state) => !!state.name && !state.deleted,
}

export const Site = (stream: string): InferAggregate<typeof SiteSchemas> => ({
  description: "A web site where the stream id is the subdomain",
  stream,
  schemas: SiteSchemas,
  init: () => ({
    name: "",
    font: "",
    userId: "",
  }),
  reduce: {
    SiteCreated: (_, { data, metadata }) => ({
      ...data,
      userId: metadata.causation.command?.actor?.id,
    }),
    SiteUpdated: (_, { data }) => data,
    SiteDeleted: () => ({ deleted: true }),
  },
  given: {
    CreateSite: [notFound],
    UpdateSite: [found, notDeleted],
    DeleteSite: [found, notDeleted],
  },
  on: {
    CreateSite: async (data) => emit("SiteCreated", data),
    UpdateSite: async (data) => emit("SiteUpdated", data),
    DeleteSite: async (data) => emit("SiteDeleted", data),
  },
})
