import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import net from "node:net";
import path from "node:path";
import test, { after, before } from "node:test";

const TEST_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NEXT_CLI = path.join(TEST_ROOT, "node_modules", "next", "dist", "bin", "next");
const START_TIMEOUT_MS = 90_000;
const STOP_TIMEOUT_MS = 5_000;

let baseUrl;
let nextServer;
let serverOutput = "";

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not reserve a local port."));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function fetchRoute(routePath, init = {}) {
  return fetch(new URL(routePath, `${baseUrl}/`), {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    ...init,
  });
}

async function waitForServer() {
  const deadline = Date.now() + START_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (nextServer?.exitCode !== null) {
      throw new Error(`Next.js stopped before becoming ready.\n${serverOutput}`);
    }

    try {
      await fetchRoute("/en/forgot-password");
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  throw new Error(`Timed out waiting for Next.js.\n${serverOutput}`);
}

async function stopServer() {
  if (!nextServer || nextServer.exitCode !== null) return;
  const exited = once(nextServer, "exit");
  nextServer.kill("SIGINT");

  let timeout;
  const stopped = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => {
      timeout = setTimeout(() => resolve(false), STOP_TIMEOUT_MS);
    }),
  ]);
  clearTimeout(timeout);

  if (!stopped) {
    try {
      process.kill(-nextServer.pid, "SIGKILL");
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
    await exited;
  }
}

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
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

function assertPrivateAuthHeaders(response) {
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
}

function assertNoIndexNoFollow(html) {
  assert.match(html, /<meta[^>]+name=["']robots["'][^>]+noindex[^>]+nofollow/i);
}

before(async () => {
  const configuredBaseUrl = process.env.AUTH_TEST_BASE_URL?.trim();
  if (configuredBaseUrl) {
    baseUrl = configuredBaseUrl.replace(/\/+$/, "");
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
  nextServer.stdout.on("data", (chunk) => {
    serverOutput = `${serverOutput}${chunk}`.slice(-40_000);
  });
  nextServer.stderr.on("data", (chunk) => {
    serverOutput = `${serverOutput}${chunk}`.slice(-40_000);
  });
  await waitForServer();
});

after(stopServer);

for (const [locale, heading, button] of [
  ["en", "Reset your password", "Send reset link"],
  ["bn", "পাসওয়ার্ড রিসেট করুন", "রিসেট লিংক পাঠান"],
]) {
  test(`${locale} forgot-password page is localized and index-safe`, async () => {
    const response = await fetchRoute(`/${locale}/forgot-password`);
    const html = await response.text();
    const text = visibleText(html);

    assert.equal(response.status, 200);
    assertPrivateAuthHeaders(response);
    assertNoIndexNoFollow(html);
    assert.ok(text.includes(heading));
    assert.ok(text.includes(button));
    assert.match(html, /<input[^>]+type=["']email["']/i);
    assert.match(html, new RegExp(`href=["']/${locale}/login["']`, "i"));
  });
}

for (const [locale, heading] of [
  ["en", "This reset link cannot be used"],
  ["bn", "রিসেট লিংকটি ব্যবহার করা যাচ্ছে না"],
]) {
  test(`${locale} reset-password page safely rejects a missing session`, async () => {
    const response = await fetchRoute(`/${locale}/reset-password`);
    const html = await response.text();
    const text = visibleText(html);

    assert.equal(response.status, 200);
    assertPrivateAuthHeaders(response);
    assertNoIndexNoFollow(html);
    assert.ok(text.includes(heading));
    assert.doesNotMatch(html, /name=["']password["']/i);
    assert.match(
      html,
      new RegExp(`href=["']/${locale}/forgot-password["']`, "i"),
    );
  });
}

test("callback without a code returns a localized no-store invalid-link redirect", async () => {
  const response = await fetchRoute("/en/auth/callback");
  const location = new URL(response.headers.get("location"));

  assert.equal(response.status, 307);
  assert.equal(location.port, new URL(baseUrl).port);
  assert.equal(location.pathname, "/en/reset-password");
  assert.equal(location.search, "?error=invalid_link");
  assert.match(response.headers.get("cache-control") ?? "", /no-store/i);
  assertPrivateAuthHeaders(response);
});

test("callback ignores an attacker-controlled next destination", async () => {
  const response = await fetchRoute(
    "/en/auth/callback?next=https%3A%2F%2Fevil.example%2Fsteal",
  );
  const location = new URL(response.headers.get("location"));

  assert.equal(response.status, 307);
  assert.notEqual(location.hostname, "evil.example");
  assert.equal(location.port, new URL(baseUrl).port);
  assert.equal(location.pathname, "/en/reset-password");
  assert.equal(location.search, "?error=invalid_link");
});

test("recovery completion clears the one-time marker", async () => {
  const response = await fetchRoute("/en/auth/recovery-complete", {
    method: "POST",
    headers: { Origin: new URL(baseUrl).origin },
  });

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("set-cookie") ?? "",
    /afm-password-recovery=;[^,]*(?:Max-Age=0|Expires=Thu, 01 Jan 1970)/i,
  );
  assert.match(response.headers.get("cache-control") ?? "", /no-store/i);
  assertPrivateAuthHeaders(response);
});

test("recovery completion rejects cross-origin requests", async () => {
  const response = await fetchRoute("/en/auth/recovery-complete", {
    method: "POST",
    headers: { Origin: "https://evil.example" },
  });

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("set-cookie"), null);
});
