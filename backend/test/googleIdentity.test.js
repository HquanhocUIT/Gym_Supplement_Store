const assert = require('node:assert/strict');
const { test } = require('node:test');
const { verifyGoogleIdToken } = require('../src/services/googleIdentityService');

test('Google ID token is verified for the configured audience and normalized', async () => {
  let options;
  const identity = await verifyGoogleIdToken('signed-id-token', 'web-client-id', async (value) => {
    options = value;
    return {
      getPayload: () => ({
        sub: 'google-subject-1',
        email: 'Member@Example.com',
        email_verified: true,
        name: 'Gym Member',
      }),
    };
  });

  assert.deepEqual(options, { idToken: 'signed-id-token', audience: 'web-client-id' });
  assert.deepEqual(identity, {
    email: 'member@example.com',
    googleSub: 'google-subject-1',
    fullName: 'Gym Member',
  });
});

test('Google ID token without a verified email is rejected', async () => {
  await assert.rejects(
    verifyGoogleIdToken('signed-id-token', 'web-client-id', async () => ({
      getPayload: () => ({ sub: 'google-subject-1', email: 'member@example.com', email_verified: false }),
    })),
    /verified email/,
  );
});
