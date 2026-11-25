import "server-only";
import { AwsClient } from "aws4fetch";

/**
 * Cloudflare R2 (S3 API), used for every photo. The keys stay on the server; the browser only
 * gets a short-lived signed link for one upload.
 */
const ENDPOINT = (process.env.R2_ENDPOINT ?? "").replace(/\/+$/, "");
const BUCKET = process.env.R2_BUCKET ?? "";

let client: AwsClient | null = null;
function r2(): AwsClient {
  if (!client) {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!ENDPOINT || !BUCKET || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "R2 is not configured. Set the R2_* values in .env.local (see README).",
      );
    }
    client = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    });
  }
  return client;
}

const objectUrl = (key: string) =>
  `${ENDPOINT}/${BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;

/**
 * A signed PUT link for one file, valid for 5 minutes. Type and exact size are part of the
 * signature, so the browser cannot upload something else or something bigger.
 */
export async function signedUploadUrl(
  key: string,
  contentType: string,
  size: number,
): Promise<string> {
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", "300");
  const signed = await r2().sign(url.toString(), {
    method: "PUT",
    headers: { "content-type": contentType, "content-length": String(size) },
    aws: { signQuery: true, allHeaders: true },
  });
  return signed.url;
}

/** Storage keys are always "<uuid>/<filename>" — reject anything else before use. */
const SAFE_KEY_RE = /^[a-zA-Z0-9_\-./]+$/;

function sanitizeKey(key: string): string {
  return SAFE_KEY_RE.test(key) ? key : "";
}

async function deleteOne(safeKey: string): Promise<void> {
  if (!safeKey) return;
  try {
    const res = await r2().fetch(objectUrl(safeKey), { method: "DELETE" });
    if (!res.ok && res.status !== 404)
      console.error("r2 delete failed", res.status);
  } catch {
    console.error("r2 delete error");
  }
}

/** Deletes files. Never throws: a file left behind only wastes a little space. */
export async function deleteObjects(keys: string[]): Promise<void> {
  await Promise.all(keys.map(sanitizeKey).map(deleteOne));
}
