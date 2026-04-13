import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { EntityService } from './application/services/entity.service'
import { PersonProfileService } from './application/services/person-profile.service'
import { OrganizationProfileService } from './application/services/organization-profile.service'
import { EntityRepository } from './infrastructure/repositories/entity.repository'
import { PersonProfileRepository } from './infrastructure/repositories/person-profile.repository'
import { OrganizationProfileRepository } from './infrastructure/repositories/organization-profile.repository'
import { EntityController } from './interfaces/tcp/controllers/entity.controller'
import { PersonProfileController } from './interfaces/tcp/controllers/person-profile.controller'
import { OrganizationProfileController } from './interfaces/tcp/controllers/organization-profile.controller'
import { LoggingModule } from '@oes/common/logging'
import {
  ENTITY_REPOSITORY,
  PERSON_PROFILE_REPOSITORY,
  ORGANIZATION_PROFILE_REPOSITORY
} from './domain/repositories'

@Module({
  imports: [
    LoggingModule.forRoot({ serviceName: 'entity-service' }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    PrismaModule
  ],
  controllers: [EntityController, PersonProfileController, OrganizationProfileController],
  providers: [
    // Application Services
    EntityService,
    PersonProfileService,
    OrganizationProfileService,

    // Repository Implementations
    { provide: ENTITY_REPOSITORY, useClass: EntityRepository },
    { provide: PERSON_PROFILE_REPOSITORY, useClass: PersonProfileRepository },
    { provide: ORGANIZATION_PROFILE_REPOSITORY, useClass: OrganizationProfileRepository }
  ]
})
/**
 * AppModule wires entity-service infrastructure and enables service-scoped logging metadata.
 */
export class AppModule {}
