# Welcome to Platforms-API

This project demonstrates a CDK serverless stack fronting an eventually app.

The app is a port of the [Vercel Starter Kit](https://vercel.com/templates/next.js/platforms-starter-kit) data store, replacing the Prisma CRUD repository with and eventually model using event sourcing and CQRS.

Using Supabase Postgres until the Dynamo adapter is completed

Warning: This is only for demonstration purposes and far from the best application of event sourcing.

The `cdk.json` file tells the CDK Toolkit how to execute the app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
