import { CreateSite } from "./CreateSite.schema"
import { DeleteSite } from "./DeleteSite.schema"
import { Site } from "./Site.schema"
import { SiteCreated } from "./SiteCreated.schema"
import { SiteDeleted } from "./SiteDeleted.schema"
import { SiteUpdated } from "./SiteUpdated.schema"
import { UpdateSite } from "./UpdateSite.schema"

export const SiteSchemas = {
  state: Site,
  commands: {
    CreateSite,
    UpdateSite,
    DeleteSite,
  },
  events: {
    SiteCreated,
    SiteUpdated,
    SiteDeleted,
  },
}
