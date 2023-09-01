# Welcome to Platforms-API

This project demonstrates a CDK serverless stack fronting an eventually app.

The app is a port of the [Vercel Starter Kit](https://vercel.com/templates/next.js/platforms-starter-kit) data store, replacing the Prisma CRUD repository with and eventually model using event sourcing and CQRS.

Using Supabase Postgres until the Dynamo adapter is completed

Warning: This is only for demonstration purposes and far from the best application of event sourcing.

The `cdk.json` file tells the CDK Toolkit how to execute the app.

## Useful commands

- `npm run build` compiles typescript to js under /bin
- `npm run test` perform the jest unit tests
- `npm run diff` builds and compares deployed stack with current state
- `npm run synth` builds and emits the synthesized CloudFormation template
- `npm run deploy` builds and deploy this stack to your default AWS account/region
