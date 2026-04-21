const TEST_USER_AVATARS: Record<string, string> = {
  '7df29e8e-f2f4-4ca3-8c17-bfe3bba0f111': buildTestUserAvatar('#0f766e', 'SP'),
  '93e0b3fa-9e86-4a8d-84f2-40a18bbf1002': buildTestUserAvatar('#b45309', 'JN'),
  '08b688f0-e8c8-4d58-9e97-f8a9d3941003': buildTestUserAvatar('#1d4ed8', 'HQ'),
  'b769bb64-69de-4273-909f-61307a111004': buildTestUserAvatar('#7c3aed', 'SW'),
};

// Builds compact in-memory avatars for the seeded tenant-web demo users.
function buildTestUserAvatar(accent: string, label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="48" fill="${accent}" />
      <circle cx="80" cy="62" r="30" fill="rgba(255,255,255,0.22)" />
      <path d="M32 136c8-27 28-42 48-42s40 15 48 42" fill="rgba(255,255,255,0.22)" />
      <text x="80" y="144" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff">${label}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Resolves a stable avatar for the seeded local test users and otherwise falls back to the configured default.
export function resolveTestUserAvatar(
  fallbackAvatar: string,
  userId?: string,
) {
  if (!userId) {
    return fallbackAvatar;
  }

  return TEST_USER_AVATARS[userId] ?? fallbackAvatar;
}
