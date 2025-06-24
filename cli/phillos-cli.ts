#!/usr/bin/env node
import { PhillosCLI } from './sdk.ts';

const cli = new PhillosCLI();
cli.run(process.argv).catch(err => {
  console.error(err);
  process.exit(1);
});
