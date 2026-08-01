const ROBLOX_USERS_API = 'https://users.roblox.com';

export async function findRobloxUserByUsername(username) {
  const response = await fetch(`${ROBLOX_USERS_API}/v1/usernames/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    throw new Error(`Roblox lookup failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  return payload.data?.[0] ?? null;
}
