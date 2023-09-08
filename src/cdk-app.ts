#!/usr/bin/env node
import { App, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib"
import {
  IpAddresses,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2"
import * as rds from "aws-cdk-lib/aws-rds"
import { Secret } from "aws-cdk-lib/aws-secretsmanager"
//import * as ssm from "aws-cdk-lib/aws-ssm"
import { EventuallyApp } from "./eventually"
import { boot } from "./model/boot"

class MyStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props)

    // DB Config
    const port = 5432
    const databaseName = "eventually"
    const username = "postgres"
    const pgPassword = new Secret(this, "pg-password", {
      secretName: "pg-password",
      description: "PG postgres user password",
      generateSecretString: {
        passwordLength: 16,
        excludePunctuation: true,
      },
    })

    // VPC
    const vpc = new Vpc(this, "VPC", {
      ipAddresses: IpAddresses.cidr("10.0.0.0/16"),
      subnetConfiguration: [
        {
          name: "egress",
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 0, // disable NAT gateways
    })
    const dbSecurityGroup = new SecurityGroup(this, "DbSecurityGroup", {
      vpc,
      allowAllOutbound: false,
    })
    dbSecurityGroup.addIngressRule(
      Peer.ipv4(vpc.vpcCidrBlock),
      Port.tcp(port),
      `Allow inbound traffic from ${vpc.vpcId} to port ${port}`
    )

    // DB Cluster
    const dbCluster = new rds.DatabaseCluster(this, "DbCluster", {
      vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3,
      }),
      securityGroups: [dbSecurityGroup],
      defaultDatabaseName: databaseName,
      port,
      credentials: rds.Credentials.fromUsername(username, {
        password: pgPassword.secretValue,
      }),
      writer: rds.ClusterInstance.serverlessV2("eventually"),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const environment = {
      LOG_LEVEL: "trace",
      PG_HOST: dbCluster.clusterEndpoint.hostname,
      PG_PORT: port.toString(),
      PG_USER: username,
      PG_PASSWORD: pgPassword.secretValue.unsafeUnwrap(),
      PG_DATABASE: databaseName,
    }

    // load environment vars from SSM (TODO: use secrets manager)
    // const environment = {
    //   LOG_LEVEL: "trace",
    //   PG_USER: "postgres",
    //   PG_HOST: ssm.StringParameter.valueForStringParameter(
    //     this,
    //     "/platforms/dev/pg-host"
    //   ),
    //   PG_DATABASE: ssm.StringParameter.valueForStringParameter(
    //     this,
    //     "/platforms/dev/pg-database"
    //   ),
    //   PG_PASSWORD: ssm.StringParameter.valueForStringParameter(
    //     this,
    //     "/platforms/dev/pg-password"
    //   ),
    // }

    // Eventually lambdas and API gateway
    const app = boot()
    new EventuallyApp(this, "Eventually", {
      vpc,
      environment,
      artifacts: [...app.artifacts.values()],
    })
  }
}

const cdkApp = new App()
new MyStack(cdkApp, "PlatformsApiCdkStack")
