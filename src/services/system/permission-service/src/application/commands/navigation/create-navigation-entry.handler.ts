import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { SYMBOLS } from '../../../common/constants/symbols'
import { NavigationEntry } from '../../../domain/aggregates/navigation-entry.aggregate'
import { NavigationRepository } from '../../../domain/repositories/navigation.repository'
import { CreateNavigationEntryCommand } from './create-navigation-entry.command'

@CommandHandler(CreateNavigationEntryCommand)
export class CreateNavigationEntryHandler implements ICommandHandler<CreateNavigationEntryCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.NAVIGATION)
    private readonly navigationRepo: NavigationRepository
  ) {}

  async execute(command: CreateNavigationEntryCommand): Promise<NavigationEntry> {
    return this.navigationRepo.saveEntry(
      new NavigationEntry(
        command.entryKey,
        command.name,
        command.description ?? null,
        command.featureKey ?? null,
        command.supportedTerminals,
        command.registryPriority,
        command.enabled,
        command.entryType
      )
    )
  }
}
