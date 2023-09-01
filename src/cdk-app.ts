#!/usr/bin/env node
import { App, Stack, StackProps } from "aws-cdk-lib"
import * as ssm from "aws-cdk-lib/aws-ssm"
import { boot } from "./model/boot"
import { EventuallyApp } from "./eventually"

class MyStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props)

    const environment = {
      LOG_LEVEL: "trace",
      PG_USER: "postgres",
      PG_HOST: ssm.StringParameter.valueForStringParameter(
        this,
        "/platforms/dev/pg-host"
      ),
      PG_DATABASE: ssm.StringParameter.valueForStringParameter(
        this,
        "/platforms/dev/pg-database"
      ),
      PG_PASSWORD: ssm.StringParameter.valueForStringParameter(
        this,
        "/platforms/dev/pg-password"
      ),
    }

    const app = boot()
    new EventuallyApp(this, "Eventually", {
      environment,
      artifacts: [...app.artifacts.values()],
    })
  }
}

const cdkApp = new App()
new MyStack(cdkApp, "PlatformsApiCdkStack")
