#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SiteStack } from '../lib/site-stack';

const app = new cdk.App();
new SiteStack(app, 'TravelPickerStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1',
  },
});
