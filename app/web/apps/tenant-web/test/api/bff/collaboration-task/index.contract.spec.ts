/* @vitest-environment happy-dom */

import { describe, expect, it } from 'vitest'

import { buildCollaborationTaskListQuery } from '../../../../src/api/bff/collaboration-task/query'

describe('collaboration task api query serialization', () => {
  it('serializes repeatable task filters with gateway contract keys', () => {
    const query = buildCollaborationTaskListQuery({
      scope: 'CREATED_BY_ME',
      status: ['COMPLETED', 'CANCELLED'],
      priority: ['HIGH'],
      keyword: 'handoff',
      overdueOnly: false,
      includeArchived: true,
      archivedOnly: false,
      page: 2,
      pageSize: 20
    })

    expect(query).toContain('scope=CREATED_BY_ME')
    expect(query).toContain('status=COMPLETED')
    expect(query).toContain('status=CANCELLED')
    expect(query).not.toContain('status%5B%5D')
    expect(query).not.toContain('status%5B')
    expect(query).toContain('priority=HIGH')
    expect(query).toContain('includeArchived=true')
    expect(query).toContain('page=2')
  })
})
