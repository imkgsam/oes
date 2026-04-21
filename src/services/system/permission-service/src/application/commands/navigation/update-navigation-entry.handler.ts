import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { NAVIGATION_ENTRY_NOT_FOUND } from '../../../common/constants/exception-enums/navigation.errors'
import { SYMBOLS } from '../../../common/constants/symbols'
import { NavigationEntry } from '../../../domain/aggregates/navigation-entry.aggregate'
import { NavigationRepository } from '../../../domain/repositories/navigation.repository'
import { UpdateNavigationEntryCommand } from './update-navigation-entry.command'

@CommandHandler(UpdateNavigationEntryCommand)
export class UpdateNavigationEntryHandler implements ICommandHandler<UpdateNavigationEntryCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.NAVIGATION)
    private readonly navigationRepo: NavigationRepository
  ) {}

  async execute(command: UpdateNavigationEntryCommand): Promise<NavigationEntry> {
    const entry = await this.navigationRepo.findEntryByKey(command.entryKey)
    if (!entry) {
      throw ExceptionFactory.domain(NAVIGATION_ENTRY_NOT_FOUND)
    }

    entry.updateMetadata({
      name: command.name,
      description: command.description,
      featureKey: command.featureKey,
      supportedTerminals: command.supportedTerminals,
      registryPriority: command.registryPriority,
      enabled: command.enabled,
      entryType: command.entryType
    })

    return this.navigationRepo.saveEntry(entry)
  }
}
