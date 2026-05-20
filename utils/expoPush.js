/**
 * Minimal Expo push helper. Posts to https://exp.host/--/api/v2/push/send
 * using built-in fetch (Node 18+) — no extra dependency.
 *
 * Tokens that look like ExponentPushToken[...] / ExpoPushToken[...] are sent;
 * others are ignored (a real device might not have registered yet).
 */
const EXPO_URL = 'https://exp.host/--/api/v2/push/send';

const isExpoToken = (t) =>
  typeof t === 'string' &&
  (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['));

exports.sendPushMessages = async (tokens, { title, body, data }) => {
  if (typeof fetch !== 'function') return { skipped: true };
  const valid = (tokens || []).filter(isExpoToken);
  if (!valid.length) return { skipped: true };

  const messages = valid.map((to) => ({
    to,
    sound: 'default',
    title,
    body,
    data: data || {},
  }));

  try {
    const res = await fetch(EXPO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error('[expoPush] send failed:', err.message);
    return { error: err.message };
  }
};
