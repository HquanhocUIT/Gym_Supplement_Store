const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function verifyGoogleIdToken(idToken, audience, verifyToken = (options) => googleClient.verifyIdToken(options)) {
  const ticket = await verifyToken({ idToken, audience });
  const payload = ticket?.getPayload?.();
  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const googleSub = typeof payload?.sub === 'string' ? payload.sub.trim() : '';

  if (payload?.email_verified !== true || !EMAIL_PATTERN.test(email) || !googleSub) {
    throw new Error('Google account did not provide a verified email address.');
  }

  const fullName = typeof payload.name === 'string' && payload.name.trim()
    ? payload.name.trim().slice(0, 255)
    : email.split('@')[0].slice(0, 255);

  return { email, googleSub, fullName };
}

module.exports = { verifyGoogleIdToken };
