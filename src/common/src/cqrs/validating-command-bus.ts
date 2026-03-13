import { Injectable } from '@nestjs/common'
import { CommandBus, ICommand } from '@nestjs/cqrs'
import { validate, ValidationError } from 'class-validator'
import { VALIDATION_FAILED } from '../core/exceptions/exception-enums/application-exception.enum'
import { ExceptionFactory } from '../core/exceptions/exception.factory'

@Injectable()
export class ValidatingCommandBus {
  constructor(private readonly commandBus: CommandBus) {}

  async execute<T extends ICommand, R = any>(command: T): Promise<R> {
    await this.validateCommand(command)
    return this.commandBus.execute(command)
  }

  private async validateCommand(command: ICommand): Promise<void> {
    const errors = await validate(command as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false,
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
