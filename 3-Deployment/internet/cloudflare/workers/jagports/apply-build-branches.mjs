#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const policyPath = join(here, "cloudflare-build-branches.json");
const mode = process.argv[2] ?? "--check";

if (!new Set(["--check", "--apply"]).has(mode)) {
  fail("Usage: node apply-build-branches.mjs [--check|--apply]");
}

const policy = JSON.parse(await readFile(policyPath, "utf8"));
validatePolicy(policy);

const accountId = requiredEnv("CLOUDFLARE_ACCOUNT_ID");
const apiToken = requiredEnv("CLOUDFLARE_API_TOKEN");
const apiBase = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}`;
const headers = {
  Authorization: `Bearer ${apiToken}`,
  "Content-Type": "application/json",
};

const workerTag = process.env.CLOUDFLARE_WORKER_TAG || await discoverWorkerTag();
let triggers = await listTriggers();
let production = findProductionTrigger(triggers);
let preview = findPreviewTrigger(triggers, production);

if (!production) {
  fail(`No production Workers Builds trigger found for ${policy.worker}. Refusing to create one implicitly.`);
}

if (mode === "--apply") {
  await applyProductionPolicy(production);
  triggers = await listTriggers();
  production = findProductionTrigger(triggers);
  preview = findPreviewTrigger(triggers, production);
  await applyPreviewPolicy(preview, production);
}

triggers = await listTriggers();
production = findProductionTrigger(triggers);
preview = findPreviewTrigger(triggers, production);
verifyRemotePolicy(production, preview);
console.log(`Cloudflare Workers Builds branch policy is compliant for ${policy.worker}.`);

function validatePolicy(value) {
  if (value?.schema_version !== 1) fail("Unsupported cloudflare-build-branches.json schema_version.");
  if (typeof value.worker !== "string" || !value.worker.trim()) fail("policy.worker must be a non-empty string.");
  if (value.production_branch !== "main") fail("production_branch must remain exactly 'main' for Issue #559.");
  if (!Array.isArray(value.preview_branches)) fail("preview_branches must be an array.");

  const branches = value.preview_branches;
  if (branches.some((branch) => typeof branch !== "string" || !branch.trim())) {
    fail("preview_branches may contain only non-empty branch names.");
  }
  if (branches.includes(value.production_branch)) fail("The production branch cannot also be a preview branch.");
  if (branches.some((branch) => branch.includes("*"))) fail("Wildcard preview branches are prohibited; list branches explicitly.");
  if (new Set(branches).size !== branches.length) fail("preview_branches contains duplicates.");
}

async function discoverWorkerTag() {
  const response = await cf("/workers/scripts");
  const worker = response.find((item) => item.id === policy.worker);
  if (!worker?.tag) fail(`Worker '${policy.worker}' was not found or has no tag. Set CLOUDFLARE_WORKER_TAG explicitly if required.`);
  return worker.tag;
}

async function listTriggers() {
  return cf(`/builds/workers/${encodeURIComponent(workerTag)}/triggers`);
}

function findProductionTrigger(items) {
  return items.find((item) =>
    item.deploy_command?.includes("wrangler deploy") &&
    !item.deploy_command?.includes("versions upload")
  ) || items.find((item) => item.branch_includes?.includes(policy.production_branch));
}

function findPreviewTrigger(items, productionTrigger) {
  return items.find((item) => item.trigger_uuid !== productionTrigger?.trigger_uuid && (
    item.deploy_command?.includes("versions upload") ||
    item.branch_excludes?.includes(policy.production_branch)
  ));
}

async function applyProductionPolicy(trigger) {
  if (sameList(trigger.branch_includes, [policy.production_branch]) && sameList(trigger.branch_excludes, [])) return;
  await cf(`/builds/triggers/${encodeURIComponent(trigger.trigger_uuid)}`, {
    method: "PATCH",
    body: JSON.stringify({
      branch_includes: [policy.production_branch],
      branch_excludes: [],
    }),
  });
  console.log(`Updated production trigger ${trigger.trigger_uuid} to main only.`);
}

async function applyPreviewPolicy(trigger, productionTrigger) {
  const wanted = policy.preview_branches;

  if (wanted.length === 0) {
    if (!trigger) return;
    await cf(`/builds/triggers/${encodeURIComponent(trigger.trigger_uuid)}`, { method: "DELETE" });
    console.log(`Deleted preview trigger ${trigger.trigger_uuid}; non-production branch builds are disabled.`);
    return;
  }

  if (trigger) {
    if (sameList(trigger.branch_includes, wanted) && sameList(trigger.branch_excludes, [policy.production_branch])) return;
    await cf(`/builds/triggers/${encodeURIComponent(trigger.trigger_uuid)}`, {
      method: "PATCH",
      body: JSON.stringify({
        branch_includes: wanted,
        branch_excludes: [policy.production_branch],
      }),
    });
    console.log(`Updated preview trigger ${trigger.trigger_uuid} to the explicit branch allow-list.`);
    return;
  }

  const buildTokenUuid = requiredEnv("CLOUDFLARE_BUILD_TOKEN_UUID");
  const repoConnectionUuid = productionTrigger.repo_connection_uuid;
  if (!repoConnectionUuid) fail("Production trigger does not expose repo_connection_uuid; cannot create preview trigger safely.");

  await cf("/builds/triggers", {
    method: "POST",
    body: JSON.stringify({
      external_script_id: workerTag,
      repo_connection_uuid: repoConnectionUuid,
      build_token_uuid: buildTokenUuid,
      trigger_name: "Deploy explicit preview branches",
      build_command: productionTrigger.build_command ?? "",
      deploy_command: "npx wrangler versions upload",
      root_directory: productionTrigger.root_directory ?? "4-Production/internet/cloudflare/workers/jagports/",
      branch_includes: wanted,
      branch_excludes: [policy.production_branch],
      path_includes: productionTrigger.path_includes ?? ["*"],
      path_excludes: productionTrigger.path_excludes ?? [],
      build_caching_enabled: productionTrigger.build_caching_enabled ?? true,
    }),
  });
  console.log(`Created preview trigger for: ${wanted.join(", ")}.`);
}

function verifyRemotePolicy(productionTrigger, previewTrigger) {
  if (!productionTrigger) fail("Verification failed: production trigger is missing.");
  if (!sameList(productionTrigger.branch_includes, [policy.production_branch]) || !sameList(productionTrigger.branch_excludes, [])) {
    fail(`Verification failed: production trigger is not restricted to '${policy.production_branch}'.`);
  }

  if (policy.preview_branches.length === 0) {
    if (previewTrigger) fail("Verification failed: a preview trigger still exists while preview_branches is empty.");
    return;
  }

  if (!previewTrigger) fail("Verification failed: explicit preview branches are configured but no preview trigger exists.");
  if (!sameList(previewTrigger.branch_includes, policy.preview_branches) || !sameList(previewTrigger.branch_excludes, [policy.production_branch])) {
    fail("Verification failed: preview trigger does not match the explicit branch allow-list.");
  }
}

async function cf(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, { ...options, headers: { ...headers, ...(options.headers ?? {}) } });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    fail(`Cloudflare API returned non-JSON response for ${path}: HTTP ${response.status}`);
  }

  if (!response.ok || payload.success === false) {
    const detail = payload.errors?.map((error) => error.message || error.code).filter(Boolean).join("; ") || text || response.statusText;
    fail(`Cloudflare API request failed for ${path}: HTTP ${response.status}: ${detail}`);
  }
  return payload.result;
}

function sameList(left = [], right = []) {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((value, index) => value === b[index]);
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) fail(`Missing required environment variable ${name}.`);
  return value;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
