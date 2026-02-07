import { Injectable } from '@nestjs/common'
import { QueryBus, IQuery } from '@nestjs/cqrs'
import { validate, ValidationError } from 'class-validator'
import { ExceptionFactory } from '../core/exceptions/exception.factory'
import { VALIDATION_FAILED } from '../core/exceptions/exception-enums/index'

@Injectable()
export class ValidatingQueryBus {
  constructor(private readonly queryBus: QueryBus) {}

  async execute<T extends IQuery, R = any>(query: T): Promise<R> {
    await this.validateQuery(query)
    return this.queryBus.execute(query)
  }

  private async validateQuery(query: IQuery): Promise<void> {
    const errors = await validate(query as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false
    })

    if (errors.length > 0) {
      const messages = this.formatErrors(errors)
      throw ExceptionFactory.domain(VALIDATION_FAILED, messages)
    }
  }

  private formatErrors(errors: ValidationError[]): string[] {
    return errors.flatMap((error) => this.extractConstraints(error))
  }

  private extractConstraints(error: ValidationError, parentPath = ''): string[] {
    const propertyPath = parentPath ? `${parentPath}.${error.property}` : error.property
    const messages: string[] = []

    if (error.constraints) {
      messages.push(...Object.values(error.constraints).map((msg) => `${propertyPath}: ${msg}`))
    }

    if (error.children && error.children.length > 0) {
      for (const child of error.children) {
        messages.push(...this.extractConstraints(child, propertyPath))
      }
    }

    return messages
  }
}
