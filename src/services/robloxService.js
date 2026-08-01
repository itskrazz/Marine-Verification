export async function resolveRobloxUsername(username) {
  const response = await fetch(
    "https://users.roblox.com/v1/usernames/users",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: true
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `Roblox username lookup failed with HTTP ${response.status}`
    );
  }

  const payload = await response.json();
  const user = payload.data?.[0];

  if (!user) {
    return null;
  }

  return {
    id: Number(user.id),
    name: user.name,
    displayName: user.displayName
  };
}
