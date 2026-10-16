import assert from "node:assert/strict";
import test from "node:test";
import {
  canManageBiometrics,
  getCameraFailureMessage,
} from "../lib/biometric-policy.ts";

test("only ADMIN and HR may manage biometric enrollment", () => {
  assert.equal(canManageBiometrics("ADMIN"), true);
  assert.equal(canManageBiometrics("HR"), true);
  assert.equal(canManageBiometrics("EMPLOYEE"), false);
  assert.equal(canManageBiometrics("UNKNOWN"), false);
});

test("camera permission failures are reported without treating them as verification", () => {
  assert.match(getCameraFailureMessage("NotAllowedError"), /permission was denied/i);
  assert.match(getCameraFailureMessage("NotFoundError"), /no camera was found/i);
  assert.match(getCameraFailureMessage("NotReadableError"), /busy or unavailable/i);
  assert.match(getCameraFailureMessage("UnexpectedError"), /could not be opened/i);
});
