import { describe, expect, it } from 'vitest';

import { resolveTestUserAvatar } from './test-user-avatar';

describe('resolveTestUserAvatar', () => {
  it('returns distinct seeded avatars for the managed demo users', () => {
    const fallback = 'https://example.com/default-avatar.png';

    const avatars = [
      resolveTestUserAvatar(fallback, '7df29e8e-f2f4-4ca3-8c17-bfe3bba0f111'),
      resolveTestUserAvatar(fallback, '93e0b3fa-9e86-4a8d-84f2-40a18bbf1002'),
      resolveTestUserAvatar(fallback, '08b688f0-e8c8-4d58-9e97-f8a9d3941003'),
      resolveTestUserAvatar(fallback, 'b769bb64-69de-4273-909f-61307a111004'),
    ];

    expect(new Set(avatars).size).toBe(4);
    expect(avatars.every((avatar) => avatar.startsWith('data:image/svg+xml'))).toBe(true);
  });

  it('falls back to the default avatar for unknown users', () => {
    const fallback = 'https://example.com/default-avatar.png';

    expect(resolveTestUserAvatar(fallback, 'unknown-user')).toBe(fallback);
    expect(resolveTestUserAvatar(fallback)).toBe(fallback);
  });
});
