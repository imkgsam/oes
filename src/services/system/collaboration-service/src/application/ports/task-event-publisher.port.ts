import { TaskFactEvent } from '../events/task.events'

/** TaskEventPublisherPort publishes task fact events after local command success. */
export interface TaskEventPublisherPort {
  publish(event: TaskFactEvent): Promise<void>
}

export const TASK_EVENT_PUBLISHER_PORT = Symbol('TASK_EVENT_PUBLISHER_PORT')
