import { getRpcAuthorizationModeDeclaration } from '@oes/common/authorization'
import { AnnotationCommandGrpcController } from '../../src/interfaces/grpc/annotation-command.grpc.controller'
import { AnnotationQueryGrpcController } from '../../src/interfaces/grpc/annotation-query.grpc.controller'
import { TaskCommandGrpcController } from '../../src/interfaces/grpc/task-command.grpc.controller'
import { TaskQueryGrpcController } from '../../src/interfaces/grpc/task-query.grpc.controller'

describe('Collaboration trusted gRPC declarations', () => {
  it('declares one exact HUMAN WEB mode for all 16 RPCs', () => {
    const groups = [
      [
        TaskCommandGrpcController,
        [
          'createTask',
          'updateTask',
          'startTask',
          'completeTask',
          'cancelTask',
          'reopenTask',
          'archiveTask',
          'unarchiveTask'
        ]
      ],
      [TaskQueryGrpcController, ['listTasks', 'getTask']],
      [
        AnnotationCommandGrpcController,
        ['createAnnotation', 'updateAnnotation', 'deleteAnnotation', 'setAnnotationPinned']
      ],
      [AnnotationQueryGrpcController, ['listAnnotationsForObject', 'getAnnotation']]
    ] as const
    expect(
      groups.flatMap(([type, methods]) =>
        methods.map((method) => getRpcAuthorizationModeDeclaration(type.prototype, method))
      )
    ).toHaveLength(16)
    expect(
      getRpcAuthorizationModeDeclaration(TaskCommandGrpcController.prototype, 'createTask')
    ).toEqual(
      expect.objectContaining({
        mode: 'BUSINESS',
        permissions: { all: ['collaboration.task.create'] },
        principalType: 'HUMAN',
        sessionTerminals: ['WEB']
      })
    )
    expect(
      getRpcAuthorizationModeDeclaration(
        AnnotationCommandGrpcController.prototype,
        'setAnnotationPinned'
      )
    ).toEqual(
      expect.objectContaining({
        mode: 'BUSINESS',
        permissions: { all: ['collaboration.annotation.manage'] },
        principalType: 'HUMAN',
        sessionTerminals: ['WEB']
      })
    )
  })
})
