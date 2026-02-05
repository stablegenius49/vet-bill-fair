#!/usr/bin/env node
/** Set Cloudflare R2 bucket CORS using the S3-compatible API (PutBucketCors). */

import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

function arg(name) {
  const ix = process.argv.indexOf(`--${name}`);
  if (ix === -1) return null;
  return process.argv[ix + 1] ?? null;
}

function argsMulti(name) {
  const out = [];
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === `--${name}` && process.argv[i + 1]) out.push(process.argv[i + 1]);
  }
  return out;
}

const bucket = arg("bucket") || process.env.R2_BUCKET_NAME;
const origins = argsMulti("origin");
const methods = (arg("methods") || "PUT,GET,HEAD,OPTIONS")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedHeaders = (arg("allowed-headers") || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const exposeHeaders = (arg("expose-headers") || "ETag")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const maxAgeSeconds = Number(arg("max-age") || "3600");

const accountId = process.env.R2_ACCOUNT_ID;
const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : null);
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!bucket) {
  console.error("Missing --bucket or R2_BUCKET_NAME");
  process.exit(2);
}
if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error(
    "Missing R2 creds/endpoint. Need R2_ENDPOINT (or R2_ACCOUNT_ID) + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY"
  );
  process.exit(2);
}
if (origins.length === 0) {
  console.error("At least one --origin is required");
  process.exit(2);
}

const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

const rule = {
  AllowedOrigins: origins,
  AllowedMethods: methods,
  AllowedHeaders: allowedHeaders,
  ExposeHeaders: exposeHeaders,
  MaxAgeSeconds: maxAgeSeconds,
};

await client.send(
  new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: { CORSRules: [rule] },
  })
);

console.log("OK: PutBucketCors applied", { bucket, rule });
