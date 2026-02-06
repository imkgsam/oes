import { DomainException, ApplicationException, InfrastructureException } from './oes.exception'
import { ExceptionDefinition } from './exception.interface'

export class ExceptionFactory {
  // 创建领域异常
  static domain(definition: ExceptionDefinition, ...args: any[]) {
    return new DomainException(definition, args)
  }

  // 创建应用异常
  static application(definition: ExceptionDefinition, ...args: any[]) {
    return new ApplicationException(definition, args)
  }

  // 创建基础设施异常
  static infrastructure(definition: ExceptionDefinition, ...args: any[]) {
    return new InfrastructureException(definition, args)
  }
}
