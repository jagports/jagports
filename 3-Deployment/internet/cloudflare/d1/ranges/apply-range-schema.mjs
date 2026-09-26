#!/usr/bin/env node
import { applyRangeSchema, readRangeConfiguration } from './range-d1-client.mjs';

const [rangeSlug] = process.argv.slice(2);
if (process.argv.length !== 3) {
  console.error('Usage: node apply-range-schema.mjs <approved-range-slug>');
  process.exitCode = 1;
} else {
  try {
    const config = await readRangeConfiguration(rangeSlug);
    console.log(JSON.stringify(await applyRangeSchema(config, process.env.CLOUDFLARE_API_TOKEN), null, 2));
  } catch (error) {
    console.error(`Range D1 schema: ${error.message}`);
    process.exitCode = 1;
  }
}
