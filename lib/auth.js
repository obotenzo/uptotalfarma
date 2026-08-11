export const COOKIE_NAME = 'uptf_session';

export function getAuthConfig() {
  return {
    username: process.env.UPTF_USERNAME || 'AdminUpTotalFarma',
    password: process.env.UPTF_PASSWORD || 'UpTotal2026',
  };
}

export function createSessionValue(username) {
  return username;
}

export function verifySessionValue(value) {
  const { username } = getAuthConfig();
  return value === username;
}

export function isAuthenticated(cookieValue) {
  return verifySessionValue(cookieValue);
}

export function sessionMaxAge() {
  return 60 * 60 * 24 * 14;
}
