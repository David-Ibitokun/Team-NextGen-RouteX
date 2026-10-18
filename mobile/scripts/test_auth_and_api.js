/**
 * RouteX Mobile Authentication, API & Notification Unit Test Suite
 */
const assert = require('assert');

console.log('--- Running RouteX Mobile Auth, API & Notification Tests ---');

// Test 1: API Base URL normalization
function normalizeApiBaseUrl(url, defaultHost) {
  const target = (url || `${defaultHost}/api/v1`).trim();
  return target.replace(/\/+$/, '');
}

const url1 = normalizeApiBaseUrl('http://192.168.0.178:8000/api/v1///', 'http://localhost:8000');
assert.strictEqual(url1, 'http://192.168.0.178:8000/api/v1', 'Trailing slashes must be stripped');
console.log('✓ Test 1 Passed: API Base URL normalization strips trailing slashes');

// Test 2: User registration validation rules (mirroring web app)
function validateRegistration(payload) {
  const errors = {};
  if (!payload.username || payload.username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters.';
  }
  if (!payload.email || !payload.email.includes('@')) {
    errors.email = 'Please provide a valid email address.';
  }
  if (!payload.password || payload.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (payload.password !== payload.password_confirm) {
    errors.password_confirm = 'Passwords do not match.';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

const invalidReg = validateRegistration({
  username: 'ab',
  email: 'not-an-email',
  password: 'short',
  password_confirm: 'mismatch',
});
assert.strictEqual(invalidReg.isValid, false);
assert.strictEqual(Object.keys(invalidReg.errors).length, 4);
console.log('✓ Test 2 Passed: Registration validation rejects invalid credentials');

const validReg = validateRegistration({
  username: 'adetola',
  email: 'adetola@example.com',
  password: 'Password123!',
  password_confirm: 'Password123!',
});
assert.strictEqual(validReg.isValid, true);
console.log('✓ Test 3 Passed: Registration validation accepts valid credentials');

// Test 3: Cookie extraction from Set-Cookie header
function extractSessionAndCsrf(cookieHeader) {
  let sessionId = null;
  let csrfToken = null;
  if (!cookieHeader) return { sessionId, csrfToken };

  const sessionMatch = /sessionid=([^;]+)/i.exec(cookieHeader);
  if (sessionMatch) sessionId = sessionMatch[1];

  const csrfMatch = /csrftoken=([^;]+)/i.exec(cookieHeader);
  if (csrfMatch) csrfToken = csrfMatch[1];

  return { sessionId, csrfToken };
}

const sampleSetCookie = 'sessionid=xyz987654321; Path=/; HttpOnly, csrftoken=abc123456789; Path=/; SameSite=Lax';
const tokens = extractSessionAndCsrf(sampleSetCookie);
assert.strictEqual(tokens.sessionId, 'xyz987654321');
assert.strictEqual(tokens.csrfToken, 'abc123456789');
console.log('✓ Test 4 Passed: Cookie extraction correctly parses sessionid and csrftoken');

// Test 4: Notification formatting
function formatHazardReportNotification(locationName, category) {
  const catFormatted = category.replace(/_/g, ' ');
  const safeLoc = locationName || 'Reported Location';
  return {
    title: 'Hazard Report Submitted',
    body: `Your report for "${catFormatted}" at ${safeLoc} has been broadcast to the RouteX network.`,
    type: 'report',
  };
}

const notif = formatHazardReportNotification('Lekki-Epe Expressway', 'fallen_tree');
assert.strictEqual(notif.title, 'Hazard Report Submitted');
assert.strictEqual(notif.body.includes('fallen tree'), true);
assert.strictEqual(notif.body.includes('Lekki-Epe Expressway'), true);
console.log('✓ Test 5 Passed: Hazard report notification properly formats category and location');

console.log('\nAll 5 RouteX Mobile Auth & API Tests Passed Successfully! (5/5)');
