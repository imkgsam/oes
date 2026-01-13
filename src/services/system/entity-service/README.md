# Entity Service

## Overview

The **Entity Service** is a microservice responsible for managing real-world entities (persons and organizations) in the system. It provides a clean, identity-agnostic representation of entities that can be referenced by other services.

## Key Principles

1. **Identity Agnostic**: Entity does NOT know if it is a user, customer, supplier, employee, etc.
2. **Globally Unique**: Entities are globally unique and reusable across all business modules.
3. **No Business Roles**: No customer/supplier/employee roles are defined in this service.
4. **No Tenant Ownership**: Minimal tenant logic (tenantId is optional and not enforced).
5. **Reference by ID**: Other services reference entities ONLY by `entityId` (string UUID).

## Domain Models

### Entity

The core model representing a real-world subject.

| Field     | Type                   | Description           |
| --------- | ---------------------- | --------------------- |
| id        | UUID                   | Primary key           |
| type      | PERSON \| ORGANIZATION | Entity type           |
| name      | String                 | Entity name           |
| alias     | String?                | Optional alias        |
| isActive  | Boolean                | Active status         |
| notes     | String?                | Optional notes        |
| createdAt | DateTime               | Creation timestamp    |
| updatedAt | DateTime               | Last update timestamp |

### PersonProfile

Extended profile for PERSON type entities (1:1 relationship).

| Field          | Type    | Description                  |
| -------------- | ------- | ---------------------------- |
| id             | UUID    | Primary key                  |
| entityId       | UUID    | Reference to Entity (unique) |
| gender         | String? | Gender                       |
| birthday       | Date?   | Date of birth                |
| idNumber       | String? | ID card number (unique)      |
| passportNumber | String? | Passport number (unique)     |

### OrganizationProfile

Extended profile for ORGANIZATION type entities (1:1 relationship).

| Field              | Type    | Description                           |
| ------------------ | ------- | ------------------------------------- |
| id                 | UUID    | Primary key                           |
| entityId           | UUID    | Reference to Entity (unique)          |
| legalName          | String? | Legal registered name                 |
| registrationNumber | String? | Business registration number (unique) |
| taxId              | String? | Tax identification number (unique)    |
| country            | String? | Country of registration               |
| website            | String? | Company website                       |

## Architecture

```
src/
├── domain/                    # Domain layer
│   ├── entities/              # Domain entities
│   ├── value-objects/         # Value objects (EntityType enum)
│   └── repositories/          # Repository interfaces
├── application/               # Application layer
│   └── services/              # Application services
├── infrastructure/            # Infrastructure layer
│   ├── prisma/                # Prisma ORM setup
│   └── repositories/          # Repository implementations
└── interfaces/                # Interface layer
    └── tcp/                   # TCP/RPC controllers
        └── controllers/
```

## RPC Interface

This service exposes TCP/RPC endpoints for inter-service communication. It does NOT expose REST APIs directly.

### Entity Operations

- `entity.entity.create` - Create a new entity
- `entity.entity.get_by_id` - Get entity by ID
- `entity.entity.list` - List entities with filtering
- `entity.entity.update` - Update entity
- `entity.entity.delete` - Delete entity

### Person Profile Operations

- `entity.person_profile.create` - Create person profile
- `entity.person_profile.get_by_entity_id` - Get person profile by entity ID
- `entity.person_profile.update` - Update person profile
- `entity.person_profile.delete` - Delete person profile

### Organization Profile Operations

- `entity.organization_profile.create` - Create organization profile
- `entity.organization_profile.get_by_entity_id` - Get organization profile by entity ID
- `entity.organization_profile.update` - Update organization profile
- `entity.organization_profile.delete` - Delete organization profile

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/entity_service?schema=entity"

# Server
PORT=9502
NODE_ENV=development
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate:dev

# Start the service
pnpm start:dev
```

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Transport**: TCP (NestJS Microservices)
- **Architecture**: Clean Architecture / DDD-lite

## Important Constraints

- ❌ No authentication or permission logic
- ❌ No tenant / org / account models
- ❌ No business role definitions
- ✅ Pure entity management only
- ✅ RPC interface only (no REST)
