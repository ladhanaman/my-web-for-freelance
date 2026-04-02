import assert from "node:assert/strict";
import test from "node:test";

import {
  createAdminSessionToken,
  getAdminAuthConfigurationError,
  getAdminPassword,
  isAdminGateEnabled,
  isAdminPasswordMatch,
  isValidAdminCookie,
} from "./admin-auth.ts";

interface AdminEnvOverrides {
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
}

function withAdminEnv(overrides: AdminEnvOverrides): () => void {
  const previousPassword = process.env.ADMIN_PASSWORD;
  const previousSessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (overrides.ADMIN_PASSWORD === undefined) {
    delete process.env.ADMIN_PASSWORD;
  } else {
    process.env.ADMIN_PASSWORD = overrides.ADMIN_PASSWORD;
  }

  if (overrides.ADMIN_SESSION_SECRET === undefined) {
    delete process.env.ADMIN_SESSION_SECRET;
  } else {
    process.env.ADMIN_SESSION_SECRET = overrides.ADMIN_SESSION_SECRET;
  }

  return () => {
    if (previousPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = previousPassword;
    }

    if (previousSessionSecret === undefined) {
      delete process.env.ADMIN_SESSION_SECRET;
    } else {
      process.env.ADMIN_SESSION_SECRET = previousSessionSecret;
    }
  };
}

test("uses unquoted admin env values as-is", async (t) => {
  const restore = withAdminEnv({
    ADMIN_PASSWORD: "12345678",
    ADMIN_SESSION_SECRET: "35527d3f5f22ed5734871676d5264a027ddb5a46148c388e7f01931b33639d2c",
  });
  t.after(restore);

  assert.equal(isAdminGateEnabled(), true);
  assert.equal(getAdminPassword(), "12345678");
  assert.equal(isAdminPasswordMatch("12345678"), true);
  assert.equal(isAdminPasswordMatch("wrong-password"), false);
  assert.equal(getAdminAuthConfigurationError(), null);

  const token = await createAdminSessionToken();
  assert.equal(await isValidAdminCookie(token), true);
});

test("normalizes quoted and whitespace-padded admin env values", async (t) => {
  const restore = withAdminEnv({
    ADMIN_PASSWORD: '  "12345678"  ',
    ADMIN_SESSION_SECRET:
      "  '35527d3f5f22ed5734871676d5264a027ddb5a46148c388e7f01931b33639d2c'  ",
  });
  t.after(restore);

  assert.equal(isAdminGateEnabled(), true);
  assert.equal(getAdminPassword(), "12345678");
  assert.equal(isAdminPasswordMatch("12345678"), true);
  assert.equal(isAdminPasswordMatch('"12345678"'), false);
  assert.equal(getAdminAuthConfigurationError(), null);

  const token = await createAdminSessionToken();
  assert.equal(await isValidAdminCookie(token), true);
});

test("reports a config error after normalizing an undersized session secret", (t) => {
  const restore = withAdminEnv({
    ADMIN_PASSWORD: "12345678",
    ADMIN_SESSION_SECRET: '   "too-short"   ',
  });
  t.after(restore);

  assert.equal(
    getAdminAuthConfigurationError(),
    "ADMIN_SESSION_SECRET must be set to a strong value with at least 32 characters."
  );
});
