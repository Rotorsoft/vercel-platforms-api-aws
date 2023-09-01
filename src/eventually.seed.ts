import { lambda } from "@rotorsoft/eventually-aws"
import { boot } from "./model/boot"

boot()
export const handler = lambda.seed
