type ListTasksQuery = {
  archivedOnly?: boolean
  dueAfter?: string
  dueBefore?: string
  includeArchived?: boolean
  keyword?: string
  overdueOnly?: boolean
  page?: number
  pageSize?: number
  priority?: string[]
  scope: string
  status?: string[]
}

/** buildCollaborationTaskListQuery serializes repeatable Task P1 filters with gateway-compatible keys. */
export function buildCollaborationTaskListQuery(params: ListTasksQuery) {
  const query = new URLSearchParams()
  appendScalar(query, 'scope', params.scope)
  appendArray(query, 'status', params.status)
  appendArray(query, 'priority', params.priority)
  appendScalar(query, 'dueBefore', params.dueBefore)
  appendScalar(query, 'dueAfter', params.dueAfter)
  appendScalar(query, 'keyword', params.keyword)
  appendScalar(query, 'overdueOnly', params.overdueOnly)
  appendScalar(query, 'includeArchived', params.includeArchived)
  appendScalar(query, 'archivedOnly', params.archivedOnly)
  appendScalar(query, 'page', params.page)
  appendScalar(query, 'pageSize', params.pageSize)
  return query.toString()
}

/** appendArray writes repeatable query filters without bracket suffixes. */
function appendArray(query: URLSearchParams, key: string, values?: string[]) {
  for (const value of values ?? []) {
    appendScalar(query, key, value)
  }
}

/** appendScalar writes one defined query value using the HTTP contract field name. */
function appendScalar(query: URLSearchParams, key: string, value?: boolean | number | string) {
  if (value === undefined || value === null || value === '') return
  query.append(key, String(value))
}
