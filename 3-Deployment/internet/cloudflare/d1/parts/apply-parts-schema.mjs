#!/usr/bin/env node
import { applyPartsDatabaseSchema, readPartsDatabaseConfiguration } from './parts-d1-client.mjs';

const [rangeSlug] = process.argv.slice(2);
if (process.argv.length !== 3) {
  console.error('Usage: node apply-parts-schema.mjs <approved-range-slug>');
  process.exitCode = 1;
} else {
  try {
    const config = await readPartsDatabaseConfiguration(rangeSlug);
    console.log(JSON.stringify(await applyPartsDatabaseSchema(config, process.env.CLOUDFLARE_API_TOKEN), null, 2));
  } catch (error) {
    console.error(`Parts database schema: ${error.message}`);
    process.exitCode = 1;
  }
}

