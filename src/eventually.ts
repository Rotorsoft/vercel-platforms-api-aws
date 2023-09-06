import { ArtifactMetadata, decamelize } from "@rotorsoft/eventually"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as cognito from "aws-cdk-lib/aws-cognito"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs"
//import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from "constructs"

interface Props {
  environment: Record<string, string>
  artifacts: ArtifactMetadata[]
}

const lambdaIntegration = (
  scope: Construct,
  handler: string,
  environment: Record<string, string>
): apigw.LambdaIntegration =>
  new apigw.LambdaIntegration(
    new nodejs.NodejsFunction(scope, handler, {
      runtime: lambda.Runtime.NODEJS_18_X,
      environment,
      bundling: {
        externalModules: ["@rotorsoft/*", "zod"],
        nodeModules: [
          "@rotorsoft/eventually",
          "@rotorsoft/eventually-aws",
          "@rotorsoft/eventually-pg",
        ],
      },
    })
  )

export class EventuallyApp extends Construct {
  // public readonly store: dynamodb.Table;

  constructor(scope: Construct, id: string, { environment, artifacts }: Props) {
    super(scope, id)

    // seed from here?
    // this.table = new dynamodb.Table(this, 'EventStore', {
    //     partitionKey: { name: 'path', type: dynamodb.AttributeType.STRING }
    // });

    // api gateway
    const api = new apigw.RestApi(this, "RestApi", {
      restApiName: id,
    })

    // lambdas
    const loadLambda = lambdaIntegration(this, "load", environment)
    const commandLambda = lambdaIntegration(this, "command", environment)
    const queryLambda = lambdaIntegration(this, "query", environment)
    const seedLambda = lambdaIntegration(this, "seed", environment)
    const drainLambda = lambdaIntegration(this, "drain", environment)

    // auth
    const withKey = { apiKeyRequired: true }
    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      signInAliases: { email: true, phone: true },
    })
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(
      this,
      "Authorizer",
      { cognitoUserPools: [userPool] }
    )
    const withAuth = {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    }

    // resources
    artifacts.forEach((art) => {
      switch (art.type) {
        case "aggregate":
        case "system":
          const system = api.root.addResource(decamelize(art.factory.name), {
            defaultCorsPreflightOptions: { allowOrigins: ["*"] },
          })
          const stream = system.addResource("{stream}")
          if (art.type === "aggregate") {
            stream.addMethod("GET", loadLambda, withAuth)
            // TODO: add GET /:id/stream
          }
          art.inputs
            .filter((cmd) => cmd.scope === "public")
            .forEach((cmd) => {
              stream
                .addResource(decamelize(cmd.name))
                .addMethod("POST", commandLambda, withAuth)
            })
          break

        case "projector":
          api.root
            .addResource(decamelize(art.factory.name), {
              defaultCorsPreflightOptions: { allowOrigins: ["*"] },
            })
            .addMethod("GET", queryLambda, withKey)
          break
      }
    })

    // Allows admins to manually seed the stores
    api.root.addResource("seed").addMethod("GET", seedLambda, withKey)

    // Allows admins to manually drain the broker
    // Warning: this is for testing purposes only!
    // A production system should wire the store to a robust messaging service like SQS
    api.root.addResource("drain").addMethod("GET", drainLambda, withKey)
  }
}
