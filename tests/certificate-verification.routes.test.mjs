import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import net from "node:net";
import path from "node:path";
import test, { after, before } from "node:test";

const REFERENCE_ID = "AFM-WD-2026-K82L9MDT";
const VALID_PATH = `/verify/${REFERENCE_ID}`;
const CANONICAL_URL = `https://aidformen.com${VALID_PATH}`;
const UNKNOWN_PATH = "/verify/AFM-WD-2026-00000000";
const MALFORMED_PATH = "/verify/not-a-reference";
const INJECTION_VALUE = '<img src=x onerror=alert("certificate-injection")>';
const INJECTION_PATH = `/verify/${encodeURIComponent(INJECTION_VALUE)}`;

const EXPECTED_TEXT = [
  "Record found",
  "Approved",
  "This reference matches an approved certificate record held by Aid For Men Foundation.",
  REFERENCE_ID,
  "Certificate of Website Development",
  "Shawon Ahmed",
  "Designed and developed the website aidformen.com for Aid For Men Foundation",
  "https://aidformen.com",
  "info@aidformen.com",
  "27 Aug 2026",
  "Saiful Islam Nadim, General Secretary, Aid For Men Foundation",
];

const TEST_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const NEXT_CLI = path.join(TEST_ROOT, "node_modules", "next", "dist", "bin", "next");
const SERVER_START_TIMEOUT_MS = 90_000;
const SERVER_STOP_TIMEOUT_MS = 5_000;

let baseUrl;
let nextServer;
let serverOutput = "";

function appendServerOutput(chunk) {
  serverOutput = `${serverOutput}${chunk}`.slice(-40_000);
}

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not reserve a local TCP port for Next.js."));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) reject(error);
        else resolve(port);
      });
    });
  });
}

function requestUrl(routePath) {
  return new URL(routePath, `${baseUrl}/`);
}

async function fetchRoute(routePath) {
  return fetch(requestUrl(routePath), {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
}

async function waitForServer() {
  const deadline = Date.now() + SERVER_START_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (nextServer?.exitCode !== null) {
      throw new Error(
        `Next.js exited before becoming ready (code ${nextServer.exitCode}).\n${serverOutput}`,
      );
    }

    try {
      // Any completed HTTP response means Next is accepting requests. The
      // assertions below remain responsible for reporting a bad route status.
      await fetchRoute(VALID_PATH);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  throw new Error(
    `Timed out waiting for Next.js at ${baseUrl}.\n${serverOutput}`,
  );
}

async function stopServer() {
  if (!nextServer || nextServer.exitCode !== null) return;

  const exited = once(nextServer, "exit");

  try {
    if (process.platform === "win32") nextServer.kill("SIGTERM");
    else nextServer.kill("SIGINT");
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }

  let stopTimeout;
  const stopped = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => {
      stopTimeout = setTimeout(() => resolve(false), SERVER_STOP_TIMEOUT_MS);
    }),
  ]);
  clearTimeout(stopTimeout);

  if (stopped) return;

  try {
    if (process.platform === "win32") nextServer.kill("SIGKILL");
    else process.kill(-nextServer.pid, "SIGKILL");
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }

  await exited;
}

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function getAttribute(tag, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(
    new RegExp(
      `(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
      "i",
    ),
  );

  const value = match?.[1] ?? match?.[2] ?? match?.[3];
  return value === undefined ? undefined : decodeHtml(value);
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
}

function metadataContent(html, attribute, value) {
  const tag = tags(html, "meta").find(
    (candidate) => getAttribute(candidate, attribute)?.toLowerCase() === value,
  );
  return tag ? getAttribute(tag, "content") : undefined;
}

function metadataContents(html, attribute, value) {
  return tags(html, "meta")
    .filter(
      (candidate) => getAttribute(candidate, attribute)?.toLowerCase() === value,
    )
    .map((candidate) => getAttribute(candidate, "content") ?? "");
}

function visibleText(html) {
  return decodeHtml(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function documentTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]).trim() : undefined;
}

function canonicalHref(html) {
  const tag = tags(html, "link").find((candidate) =>
    (getAttribute(candidate, "rel") ?? "")
      .toLowerCase()
      .split(/\s+/)
      .includes("canonical"),
  );
  return tag ? getAttribute(tag, "href") : undefined;
}

function jsonLdDocuments(html) {
  const documents = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(pattern)) {
    const openingTag = `<script${match[1]}>`;
    if (getAttribute(openingTag, "type")?.toLowerCase() !== "application/ld+json") {
      continue;
    }
    documents.push(JSON.parse(decodeHtml(match[2])));
  }

  return documents;
}

function objectTreeContains(value, predicate) {
  if (predicate(value)) return true;
  if (Array.isArray(value)) {
    return value.some((entry) => objectTreeContains(entry, predicate));
  }
  if (value && typeof value === "object") {
    return Object.values(value).some((entry) =>
      objectTreeContains(entry, predicate),
    );
  }
  return false;
}

function assertSecurityHeaders(response) {
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(
    response.headers.get("content-security-policy") ?? "",
    /(?:^|;)\s*frame-ancestors\s+'none'\s*(?:;|$)/i,
  );
}

function assertNoIndexNoFollow(html) {
  const directives = metadataContents(html, "name", "robots")
    .join(",")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);

  assert.ok(directives.includes("noindex"), "robots metadata must include noindex");
  assert.ok(
    directives.includes("nofollow"),
    "robots metadata must include nofollow",
  );
}

async function assertInvalidRoute(routePath, label) {
  const response = await fetchRoute(routePath);
  const html = await response.text();

  assert.equal(response.status, 404, `${label} must return HTTP 404`);
  assert.equal(
    response.headers.get("location"),
    null,
    `${label} must not redirect`,
  );
  assertSecurityHeaders(response);
  // In development, Next serializes a not-found Server Component into the RSC
  // payload rather than duplicating it in the static body markup.
  assert.match(html, /Certificate record not found/i);
  assertNoIndexNoFollow(html);

  return { html, text: visibleText(html) };
}

before(async () => {
  const configuredBaseUrl = process.env.CERTIFICATE_TEST_BASE_URL?.trim();

  if (configuredBaseUrl) {
    const parsed = new URL(configuredBaseUrl);
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    parsed.search = "";
    parsed.hash = "";
    baseUrl = parsed.toString().replace(/\/$/, "");
    return;
  }

  const port = await reservePort();
  baseUrl = `http://127.0.0.1:${port}`;
  nextServer = spawn(
    process.execPath,
    [NEXT_CLI, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: TEST_ROOT,
      detached: process.platform !== "win32",
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  nextServer.stdout.on("data", appendServerOutput);
  nextServer.stderr.on("data", appendServerOutput);

  await waitForServer();
});

after(async () => {
  await stopServer();
});

test("the canonical certificate URL returns the authoritative approved record", async () => {
  const response = await fetchRoute(VALID_PATH);
  const html = await response.text();
  const text = visibleText(html);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
  assert.equal(new URL(response.url).pathname, VALID_PATH);
  assertSecurityHeaders(response);

  for (const expected of EXPECTED_TEXT) {
    assert.ok(text.includes(expected), `page must include: ${expected}`);
  }

  assert.match(text, /Document status\s*Approved/i);
  assert.match(text, /Issue date\s*27 Aug 2026/i);
  assert.match(
    text,
    /Authorized signatory\s*Saiful Islam Nadim, General Secretary, Aid For Men Foundation/i,
  );
  assert.doesNotMatch(text, /Pending completion and authorized signature/i);
  assert.doesNotMatch(
    text,
    /becomes valid only when completed and signed by an authorized representative/i,
  );
  assert.match(html, /href=["']https:\/\/aidformen\.com\/?["']/i);
  assert.match(html, /href=["']mailto:info@aidformen\.com["']/i);

  assert.equal(
    documentTitle(html),
    `Verify Certificate ${REFERENCE_ID} | Aid For Men Foundation`,
  );
  assert.equal(canonicalHref(html), CANONICAL_URL);

  const description = metadataContent(html, "name", "description") ?? "";
  assert.match(description, /Aid For Men Foundation/i);
  assert.match(description, /certificate record/i);
  assert.equal(metadataContent(html, "property", "og:title"), documentTitle(html));
  assert.equal(metadataContent(html, "property", "og:url"), CANONICAL_URL);
  assert.match(
    metadataContent(html, "property", "og:description") ?? "",
    /certificate record/i,
  );

  const creativeWork = jsonLdDocuments(html).find(
    (document) => document?.["@type"] === "CreativeWork",
  );
  assert.ok(creativeWork, "page must contain CreativeWork JSON-LD");
  assert.equal(creativeWork.identifier, REFERENCE_ID);
  assert.ok(
    objectTreeContains(
      creativeWork,
      (value) =>
        value?.["@type"] === "Organization" &&
        value?.name === "Aid For Men Foundation",
    ),
    "JSON-LD must identify Aid For Men Foundation as an Organization",
  );
  assert.equal(creativeWork.dateCreated, "2026-08-27");
  assert.equal("dateIssued" in creativeWork, false);
  assert.equal("datePublished" in creativeWork, false);
});

test("a well-formed but unknown reference returns the branded 404", async () => {
  await assertInvalidRoute(UNKNOWN_PATH, "unknown reference");
});

test("a malformed reference returns the branded 404", async () => {
  await assertInvalidRoute(MALFORMED_PATH, "malformed reference");
});

test("an encoded injection attempt returns 404 without reflecting executable markup", async () => {
  const { html, text } = await assertInvalidRoute(
    INJECTION_PATH,
    "injection attempt",
  );

  assert.equal(text.includes(INJECTION_VALUE), false);
  assert.equal(html.includes(INJECTION_VALUE), false);
  assert.doesNotMatch(
    html,
    /<img\s+src=x\s+onerror=[^>]*certificate-injection[^>]*>/i,
  );
});
