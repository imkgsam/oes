import { DomainException, ApplicationException, InfrastructureException } from './oes.exception'
import { ExceptionDefinition } from './exception.interface'

export class ExceptionFactory {
  // 创建领域异常
  static domain(definition: ExceptionDefinition, internalDetails?: any) {
    return new DomainException(definition, internalDetails)
  }

  // 创建应用异常
  static application(definition: ExceptionDefinition, internalDetails?: any) {
    return new ApplicationException(definition, internalDetails)
  }

  // 创建基础设施异常
  static infrastructure(definition: ExceptionDefinition, internalDetails?: any) {
    return new InfrastructureException(definition, internalDetails)
  }
}
