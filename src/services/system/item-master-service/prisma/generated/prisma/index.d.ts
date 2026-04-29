
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Item
 * 
 */
export type Item = $Result.DefaultSelection<Prisma.$ItemPayload>
/**
 * Model ItemCategory
 * 
 */
export type ItemCategory = $Result.DefaultSelection<Prisma.$ItemCategoryPayload>
/**
 * Model ItemComposition
 * 
 */
export type ItemComposition = $Result.DefaultSelection<Prisma.$ItemCompositionPayload>
/**
 * Model SupplierItemMapping
 * 
 */
export type SupplierItemMapping = $Result.DefaultSelection<Prisma.$SupplierItemMappingPayload>
/**
 * Model AuditEvent
 * 
 */
export type AuditEvent = $Result.DefaultSelection<Prisma.$AuditEventPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const ItemStructureType: {
  SINGLE: 'SINGLE',
  BUNDLE: 'BUNDLE'
};

export type ItemStructureType = (typeof ItemStructureType)[keyof typeof ItemStructureType]


export const ItemNatureType: {
  PHYSICAL: 'PHYSICAL',
  VIRTUAL: 'VIRTUAL',
  SERVICE: 'SERVICE'
};

export type ItemNatureType = (typeof ItemNatureType)[keyof typeof ItemNatureType]


export const ItemStatus: {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus]


export const ItemCategoryStatus: {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

export type ItemCategoryStatus = (typeof ItemCategoryStatus)[keyof typeof ItemCategoryStatus]

}

export type ItemStructureType = $Enums.ItemStructureType

export const ItemStructureType: typeof $Enums.ItemStructureType

export type ItemNatureType = $Enums.ItemNatureType

export const ItemNatureType: typeof $Enums.ItemNatureType

export type ItemStatus = $Enums.ItemStatus

export const ItemStatus: typeof $Enums.ItemStatus

export type ItemCategoryStatus = $Enums.ItemCategoryStatus

export const ItemCategoryStatus: typeof $Enums.ItemCategoryStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Items
 * const items = await prisma.item.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Items
   * const items = await prisma.item.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs, $Utils.Call<Prisma.TypeMapCb, {
    extArgs: ExtArgs
  }>, ClientOptions>

      /**
   * `prisma.item`: Exposes CRUD operations for the **Item** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Items
    * const items = await prisma.item.findMany()
    * ```
    */
  get item(): Prisma.ItemDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.itemCategory`: Exposes CRUD operations for the **ItemCategory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ItemCategories
    * const itemCategories = await prisma.itemCategory.findMany()
    * ```
    */
  get itemCategory(): Prisma.ItemCategoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.itemComposition`: Exposes CRUD operations for the **ItemComposition** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ItemCompositions
    * const itemCompositions = await prisma.itemComposition.findMany()
    * ```
    */
  get itemComposition(): Prisma.ItemCompositionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.supplierItemMapping`: Exposes CRUD operations for the **SupplierItemMapping** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SupplierItemMappings
    * const supplierItemMappings = await prisma.supplierItemMapping.findMany()
    * ```
    */
  get supplierItemMapping(): Prisma.SupplierItemMappingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.auditEvent`: Exposes CRUD operations for the **AuditEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AuditEvents
    * const auditEvents = await prisma.auditEvent.findMany()
    * ```
    */
  get auditEvent(): Prisma.AuditEventDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.4.1
   * Query Engine version: a9055b89e58b4b5bfb59600785423b1db3d0e75d
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Item: 'Item',
    ItemCategory: 'ItemCategory',
    ItemComposition: 'ItemComposition',
    SupplierItemMapping: 'SupplierItemMapping',
    AuditEvent: 'AuditEvent'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "item" | "itemCategory" | "itemComposition" | "supplierItemMapping" | "auditEvent"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Item: {
        payload: Prisma.$ItemPayload<ExtArgs>
        fields: Prisma.ItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          findFirst: {
            args: Prisma.ItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          findMany: {
            args: Prisma.ItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>[]
          }
          create: {
            args: Prisma.ItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          createMany: {
            args: Prisma.ItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>[]
          }
          delete: {
            args: Prisma.ItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          update: {
            args: Prisma.ItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          deleteMany: {
            args: Prisma.ItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ItemUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>[]
          }
          upsert: {
            args: Prisma.ItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemPayload>
          }
          aggregate: {
            args: Prisma.ItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateItem>
          }
          groupBy: {
            args: Prisma.ItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<ItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.ItemCountArgs<ExtArgs>
            result: $Utils.Optional<ItemCountAggregateOutputType> | number
          }
        }
      }
      ItemCategory: {
        payload: Prisma.$ItemCategoryPayload<ExtArgs>
        fields: Prisma.ItemCategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ItemCategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ItemCategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCategoryPayload>
          }
          findFirst: {
            args: Prisma.ItemCategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ItemCategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCategoryPayload>
          }
          findMany: {
            args: Prisma.ItemCategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCategoryPayload>[]
          }
          create: {
            args: Prisma.ItemCategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCategoryPayload>
          }
          createMany: {
            args: Prisma.ItemCategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ItemCategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCategoryPayload>[]
          }
          delete: {
            args: Prisma.ItemCategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCategoryPayload>
          }
          update: {
            args: Prisma.ItemCategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCategoryPayload>
          }
          deleteMany: {
            args: Prisma.ItemCategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ItemCategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ItemCategoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCategoryPayload>[]
          }
          upsert: {
            args: Prisma.ItemCategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCategoryPayload>
          }
          aggregate: {
            args: Prisma.ItemCategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateItemCategory>
          }
          groupBy: {
            args: Prisma.ItemCategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<ItemCategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.ItemCategoryCountArgs<ExtArgs>
            result: $Utils.Optional<ItemCategoryCountAggregateOutputType> | number
          }
        }
      }
      ItemComposition: {
        payload: Prisma.$ItemCompositionPayload<ExtArgs>
        fields: Prisma.ItemCompositionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ItemCompositionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCompositionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ItemCompositionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCompositionPayload>
          }
          findFirst: {
            args: Prisma.ItemCompositionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCompositionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ItemCompositionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCompositionPayload>
          }
          findMany: {
            args: Prisma.ItemCompositionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCompositionPayload>[]
          }
          create: {
            args: Prisma.ItemCompositionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCompositionPayload>
          }
          createMany: {
            args: Prisma.ItemCompositionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ItemCompositionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCompositionPayload>[]
          }
          delete: {
            args: Prisma.ItemCompositionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCompositionPayload>
          }
          update: {
            args: Prisma.ItemCompositionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCompositionPayload>
          }
          deleteMany: {
            args: Prisma.ItemCompositionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ItemCompositionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ItemCompositionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCompositionPayload>[]
          }
          upsert: {
            args: Prisma.ItemCompositionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ItemCompositionPayload>
          }
          aggregate: {
            args: Prisma.ItemCompositionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateItemComposition>
          }
          groupBy: {
            args: Prisma.ItemCompositionGroupByArgs<ExtArgs>
            result: $Utils.Optional<ItemCompositionGroupByOutputType>[]
          }
          count: {
            args: Prisma.ItemCompositionCountArgs<ExtArgs>
            result: $Utils.Optional<ItemCompositionCountAggregateOutputType> | number
          }
        }
      }
      SupplierItemMapping: {
        payload: Prisma.$SupplierItemMappingPayload<ExtArgs>
        fields: Prisma.SupplierItemMappingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SupplierItemMappingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierItemMappingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SupplierItemMappingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierItemMappingPayload>
          }
          findFirst: {
            args: Prisma.SupplierItemMappingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierItemMappingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SupplierItemMappingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierItemMappingPayload>
          }
          findMany: {
            args: Prisma.SupplierItemMappingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierItemMappingPayload>[]
          }
          create: {
            args: Prisma.SupplierItemMappingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierItemMappingPayload>
          }
          createMany: {
            args: Prisma.SupplierItemMappingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SupplierItemMappingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierItemMappingPayload>[]
          }
          delete: {
            args: Prisma.SupplierItemMappingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierItemMappingPayload>
          }
          update: {
            args: Prisma.SupplierItemMappingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierItemMappingPayload>
          }
          deleteMany: {
            args: Prisma.SupplierItemMappingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SupplierItemMappingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SupplierItemMappingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierItemMappingPayload>[]
          }
          upsert: {
            args: Prisma.SupplierItemMappingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SupplierItemMappingPayload>
          }
          aggregate: {
            args: Prisma.SupplierItemMappingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSupplierItemMapping>
          }
          groupBy: {
            args: Prisma.SupplierItemMappingGroupByArgs<ExtArgs>
            result: $Utils.Optional<SupplierItemMappingGroupByOutputType>[]
          }
          count: {
            args: Prisma.SupplierItemMappingCountArgs<ExtArgs>
            result: $Utils.Optional<SupplierItemMappingCountAggregateOutputType> | number
          }
        }
      }
      AuditEvent: {
        payload: Prisma.$AuditEventPayload<ExtArgs>
        fields: Prisma.AuditEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AuditEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AuditEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>
          }
          findFirst: {
            args: Prisma.AuditEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AuditEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>
          }
          findMany: {
            args: Prisma.AuditEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>[]
          }
          create: {
            args: Prisma.AuditEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>
          }
          createMany: {
            args: Prisma.AuditEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AuditEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>[]
          }
          delete: {
            args: Prisma.AuditEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>
          }
          update: {
            args: Prisma.AuditEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>
          }
          deleteMany: {
            args: Prisma.AuditEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AuditEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AuditEventUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>[]
          }
          upsert: {
            args: Prisma.AuditEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditEventPayload>
          }
          aggregate: {
            args: Prisma.AuditEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAuditEvent>
          }
          groupBy: {
            args: Prisma.AuditEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<AuditEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.AuditEventCountArgs<ExtArgs>
            result: $Utils.Optional<AuditEventCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    item?: ItemOmit
    itemCategory?: ItemCategoryOmit
    itemComposition?: ItemCompositionOmit
    supplierItemMapping?: SupplierItemMappingOmit
    auditEvent?: AuditEventOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ItemCountOutputType
   */

  export type ItemCountOutputType = {
    parentLinks: number
    componentLinks: number
    supplierMappings: number
  }

  export type ItemCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parentLinks?: boolean | ItemCountOutputTypeCountParentLinksArgs
    componentLinks?: boolean | ItemCountOutputTypeCountComponentLinksArgs
    supplierMappings?: boolean | ItemCountOutputTypeCountSupplierMappingsArgs
  }

  // Custom InputTypes
  /**
   * ItemCountOutputType without action
   */
  export type ItemCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCountOutputType
     */
    select?: ItemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ItemCountOutputType without action
   */
  export type ItemCountOutputTypeCountParentLinksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemCompositionWhereInput
  }

  /**
   * ItemCountOutputType without action
   */
  export type ItemCountOutputTypeCountComponentLinksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemCompositionWhereInput
  }

  /**
   * ItemCountOutputType without action
   */
  export type ItemCountOutputTypeCountSupplierMappingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SupplierItemMappingWhereInput
  }


  /**
   * Count Type ItemCategoryCountOutputType
   */

  export type ItemCategoryCountOutputType = {
    children: number
    items: number
  }

  export type ItemCategoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    children?: boolean | ItemCategoryCountOutputTypeCountChildrenArgs
    items?: boolean | ItemCategoryCountOutputTypeCountItemsArgs
  }

  // Custom InputTypes
  /**
   * ItemCategoryCountOutputType without action
   */
  export type ItemCategoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategoryCountOutputType
     */
    select?: ItemCategoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ItemCategoryCountOutputType without action
   */
  export type ItemCategoryCountOutputTypeCountChildrenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemCategoryWhereInput
  }

  /**
   * ItemCategoryCountOutputType without action
   */
  export type ItemCategoryCountOutputTypeCountItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Item
   */

  export type AggregateItem = {
    _count: ItemCountAggregateOutputType | null
    _min: ItemMinAggregateOutputType | null
    _max: ItemMaxAggregateOutputType | null
  }

  export type ItemMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    itemCode: string | null
    itemName: string | null
    structureType: $Enums.ItemStructureType | null
    natureType: $Enums.ItemNatureType | null
    status: $Enums.ItemStatus | null
    primaryCategoryId: string | null
    sellable: boolean | null
    purchasable: boolean | null
    stockable: boolean | null
    manufacturable: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ItemMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    itemCode: string | null
    itemName: string | null
    structureType: $Enums.ItemStructureType | null
    natureType: $Enums.ItemNatureType | null
    status: $Enums.ItemStatus | null
    primaryCategoryId: string | null
    sellable: boolean | null
    purchasable: boolean | null
    stockable: boolean | null
    manufacturable: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ItemCountAggregateOutputType = {
    id: number
    tenantId: number
    itemCode: number
    itemName: number
    structureType: number
    natureType: number
    status: number
    primaryCategoryId: number
    sellable: number
    purchasable: number
    stockable: number
    manufacturable: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ItemMinAggregateInputType = {
    id?: true
    tenantId?: true
    itemCode?: true
    itemName?: true
    structureType?: true
    natureType?: true
    status?: true
    primaryCategoryId?: true
    sellable?: true
    purchasable?: true
    stockable?: true
    manufacturable?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ItemMaxAggregateInputType = {
    id?: true
    tenantId?: true
    itemCode?: true
    itemName?: true
    structureType?: true
    natureType?: true
    status?: true
    primaryCategoryId?: true
    sellable?: true
    purchasable?: true
    stockable?: true
    manufacturable?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ItemCountAggregateInputType = {
    id?: true
    tenantId?: true
    itemCode?: true
    itemName?: true
    structureType?: true
    natureType?: true
    status?: true
    primaryCategoryId?: true
    sellable?: true
    purchasable?: true
    stockable?: true
    manufacturable?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Item to aggregate.
     */
    where?: ItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Items to fetch.
     */
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Items from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Items.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Items
    **/
    _count?: true | ItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ItemMaxAggregateInputType
  }

  export type GetItemAggregateType<T extends ItemAggregateArgs> = {
        [P in keyof T & keyof AggregateItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateItem[P]>
      : GetScalarType<T[P], AggregateItem[P]>
  }




  export type ItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemWhereInput
    orderBy?: ItemOrderByWithAggregationInput | ItemOrderByWithAggregationInput[]
    by: ItemScalarFieldEnum[] | ItemScalarFieldEnum
    having?: ItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ItemCountAggregateInputType | true
    _min?: ItemMinAggregateInputType
    _max?: ItemMaxAggregateInputType
  }

  export type ItemGroupByOutputType = {
    id: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: $Enums.ItemStructureType
    natureType: $Enums.ItemNatureType
    status: $Enums.ItemStatus
    primaryCategoryId: string | null
    sellable: boolean
    purchasable: boolean
    stockable: boolean
    manufacturable: boolean
    createdAt: Date
    updatedAt: Date
    _count: ItemCountAggregateOutputType | null
    _min: ItemMinAggregateOutputType | null
    _max: ItemMaxAggregateOutputType | null
  }

  type GetItemGroupByPayload<T extends ItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ItemGroupByOutputType[P]>
            : GetScalarType<T[P], ItemGroupByOutputType[P]>
        }
      >
    >


  export type ItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    itemCode?: boolean
    itemName?: boolean
    structureType?: boolean
    natureType?: boolean
    status?: boolean
    primaryCategoryId?: boolean
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    primaryCategory?: boolean | Item$primaryCategoryArgs<ExtArgs>
    parentLinks?: boolean | Item$parentLinksArgs<ExtArgs>
    componentLinks?: boolean | Item$componentLinksArgs<ExtArgs>
    supplierMappings?: boolean | Item$supplierMappingsArgs<ExtArgs>
    _count?: boolean | ItemCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["item"]>

  export type ItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    itemCode?: boolean
    itemName?: boolean
    structureType?: boolean
    natureType?: boolean
    status?: boolean
    primaryCategoryId?: boolean
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    primaryCategory?: boolean | Item$primaryCategoryArgs<ExtArgs>
  }, ExtArgs["result"]["item"]>

  export type ItemSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    itemCode?: boolean
    itemName?: boolean
    structureType?: boolean
    natureType?: boolean
    status?: boolean
    primaryCategoryId?: boolean
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    primaryCategory?: boolean | Item$primaryCategoryArgs<ExtArgs>
  }, ExtArgs["result"]["item"]>

  export type ItemSelectScalar = {
    id?: boolean
    tenantId?: boolean
    itemCode?: boolean
    itemName?: boolean
    structureType?: boolean
    natureType?: boolean
    status?: boolean
    primaryCategoryId?: boolean
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ItemOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "itemCode" | "itemName" | "structureType" | "natureType" | "status" | "primaryCategoryId" | "sellable" | "purchasable" | "stockable" | "manufacturable" | "createdAt" | "updatedAt", ExtArgs["result"]["item"]>
  export type ItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    primaryCategory?: boolean | Item$primaryCategoryArgs<ExtArgs>
    parentLinks?: boolean | Item$parentLinksArgs<ExtArgs>
    componentLinks?: boolean | Item$componentLinksArgs<ExtArgs>
    supplierMappings?: boolean | Item$supplierMappingsArgs<ExtArgs>
    _count?: boolean | ItemCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    primaryCategory?: boolean | Item$primaryCategoryArgs<ExtArgs>
  }
  export type ItemIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    primaryCategory?: boolean | Item$primaryCategoryArgs<ExtArgs>
  }

  export type $ItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Item"
    objects: {
      primaryCategory: Prisma.$ItemCategoryPayload<ExtArgs> | null
      parentLinks: Prisma.$ItemCompositionPayload<ExtArgs>[]
      componentLinks: Prisma.$ItemCompositionPayload<ExtArgs>[]
      supplierMappings: Prisma.$SupplierItemMappingPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      itemCode: string
      itemName: string
      structureType: $Enums.ItemStructureType
      natureType: $Enums.ItemNatureType
      status: $Enums.ItemStatus
      primaryCategoryId: string | null
      sellable: boolean
      purchasable: boolean
      stockable: boolean
      manufacturable: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["item"]>
    composites: {}
  }

  type ItemGetPayload<S extends boolean | null | undefined | ItemDefaultArgs> = $Result.GetResult<Prisma.$ItemPayload, S>

  type ItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ItemFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ItemCountAggregateInputType | true
    }

  export interface ItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Item'], meta: { name: 'Item' } }
    /**
     * Find zero or one Item that matches the filter.
     * @param {ItemFindUniqueArgs} args - Arguments to find a Item
     * @example
     * // Get one Item
     * const item = await prisma.item.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ItemFindUniqueArgs>(args: SelectSubset<T, ItemFindUniqueArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one Item that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ItemFindUniqueOrThrowArgs} args - Arguments to find a Item
     * @example
     * // Get one Item
     * const item = await prisma.item.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ItemFindUniqueOrThrowArgs>(args: SelectSubset<T, ItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first Item that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemFindFirstArgs} args - Arguments to find a Item
     * @example
     * // Get one Item
     * const item = await prisma.item.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ItemFindFirstArgs>(args?: SelectSubset<T, ItemFindFirstArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first Item that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemFindFirstOrThrowArgs} args - Arguments to find a Item
     * @example
     * // Get one Item
     * const item = await prisma.item.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ItemFindFirstOrThrowArgs>(args?: SelectSubset<T, ItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more Items that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Items
     * const items = await prisma.item.findMany()
     * 
     * // Get first 10 Items
     * const items = await prisma.item.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const itemWithIdOnly = await prisma.item.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ItemFindManyArgs>(args?: SelectSubset<T, ItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a Item.
     * @param {ItemCreateArgs} args - Arguments to create a Item.
     * @example
     * // Create one Item
     * const Item = await prisma.item.create({
     *   data: {
     *     // ... data to create a Item
     *   }
     * })
     * 
     */
    create<T extends ItemCreateArgs>(args: SelectSubset<T, ItemCreateArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many Items.
     * @param {ItemCreateManyArgs} args - Arguments to create many Items.
     * @example
     * // Create many Items
     * const item = await prisma.item.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ItemCreateManyArgs>(args?: SelectSubset<T, ItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Items and returns the data saved in the database.
     * @param {ItemCreateManyAndReturnArgs} args - Arguments to create many Items.
     * @example
     * // Create many Items
     * const item = await prisma.item.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Items and only return the `id`
     * const itemWithIdOnly = await prisma.item.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ItemCreateManyAndReturnArgs>(args?: SelectSubset<T, ItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a Item.
     * @param {ItemDeleteArgs} args - Arguments to delete one Item.
     * @example
     * // Delete one Item
     * const Item = await prisma.item.delete({
     *   where: {
     *     // ... filter to delete one Item
     *   }
     * })
     * 
     */
    delete<T extends ItemDeleteArgs>(args: SelectSubset<T, ItemDeleteArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one Item.
     * @param {ItemUpdateArgs} args - Arguments to update one Item.
     * @example
     * // Update one Item
     * const item = await prisma.item.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ItemUpdateArgs>(args: SelectSubset<T, ItemUpdateArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more Items.
     * @param {ItemDeleteManyArgs} args - Arguments to filter Items to delete.
     * @example
     * // Delete a few Items
     * const { count } = await prisma.item.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ItemDeleteManyArgs>(args?: SelectSubset<T, ItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Items.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Items
     * const item = await prisma.item.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ItemUpdateManyArgs>(args: SelectSubset<T, ItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Items and returns the data updated in the database.
     * @param {ItemUpdateManyAndReturnArgs} args - Arguments to update many Items.
     * @example
     * // Update many Items
     * const item = await prisma.item.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Items and only return the `id`
     * const itemWithIdOnly = await prisma.item.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ItemUpdateManyAndReturnArgs>(args: SelectSubset<T, ItemUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one Item.
     * @param {ItemUpsertArgs} args - Arguments to update or create a Item.
     * @example
     * // Update or create a Item
     * const item = await prisma.item.upsert({
     *   create: {
     *     // ... data to create a Item
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Item we want to update
     *   }
     * })
     */
    upsert<T extends ItemUpsertArgs>(args: SelectSubset<T, ItemUpsertArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of Items.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCountArgs} args - Arguments to filter Items to count.
     * @example
     * // Count the number of Items
     * const count = await prisma.item.count({
     *   where: {
     *     // ... the filter for the Items we want to count
     *   }
     * })
    **/
    count<T extends ItemCountArgs>(
      args?: Subset<T, ItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Item.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ItemAggregateArgs>(args: Subset<T, ItemAggregateArgs>): Prisma.PrismaPromise<GetItemAggregateType<T>>

    /**
     * Group by Item.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ItemGroupByArgs['orderBy'] }
        : { orderBy?: ItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Item model
   */
  readonly fields: ItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Item.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    primaryCategory<T extends Item$primaryCategoryArgs<ExtArgs> = {}>(args?: Subset<T, Item$primaryCategoryArgs<ExtArgs>>): Prisma__ItemCategoryClient<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | null, null, ExtArgs, ClientOptions>
    parentLinks<T extends Item$parentLinksArgs<ExtArgs> = {}>(args?: Subset<T, Item$parentLinksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemCompositionPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    componentLinks<T extends Item$componentLinksArgs<ExtArgs> = {}>(args?: Subset<T, Item$componentLinksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemCompositionPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    supplierMappings<T extends Item$supplierMappingsArgs<ExtArgs> = {}>(args?: Subset<T, Item$supplierMappingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierItemMappingPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Item model
   */ 
  interface ItemFieldRefs {
    readonly id: FieldRef<"Item", 'String'>
    readonly tenantId: FieldRef<"Item", 'String'>
    readonly itemCode: FieldRef<"Item", 'String'>
    readonly itemName: FieldRef<"Item", 'String'>
    readonly structureType: FieldRef<"Item", 'ItemStructureType'>
    readonly natureType: FieldRef<"Item", 'ItemNatureType'>
    readonly status: FieldRef<"Item", 'ItemStatus'>
    readonly primaryCategoryId: FieldRef<"Item", 'String'>
    readonly sellable: FieldRef<"Item", 'Boolean'>
    readonly purchasable: FieldRef<"Item", 'Boolean'>
    readonly stockable: FieldRef<"Item", 'Boolean'>
    readonly manufacturable: FieldRef<"Item", 'Boolean'>
    readonly createdAt: FieldRef<"Item", 'DateTime'>
    readonly updatedAt: FieldRef<"Item", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Item findUnique
   */
  export type ItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Item to fetch.
     */
    where: ItemWhereUniqueInput
  }

  /**
   * Item findUniqueOrThrow
   */
  export type ItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Item to fetch.
     */
    where: ItemWhereUniqueInput
  }

  /**
   * Item findFirst
   */
  export type ItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Item to fetch.
     */
    where?: ItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Items to fetch.
     */
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Items.
     */
    cursor?: ItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Items from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Items.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Items.
     */
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * Item findFirstOrThrow
   */
  export type ItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Item to fetch.
     */
    where?: ItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Items to fetch.
     */
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Items.
     */
    cursor?: ItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Items from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Items.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Items.
     */
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * Item findMany
   */
  export type ItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter, which Items to fetch.
     */
    where?: ItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Items to fetch.
     */
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Items.
     */
    cursor?: ItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Items from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Items.
     */
    skip?: number
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * Item create
   */
  export type ItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * The data needed to create a Item.
     */
    data: XOR<ItemCreateInput, ItemUncheckedCreateInput>
  }

  /**
   * Item createMany
   */
  export type ItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Items.
     */
    data: ItemCreateManyInput | ItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Item createManyAndReturn
   */
  export type ItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * The data used to create many Items.
     */
    data: ItemCreateManyInput | ItemCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Item update
   */
  export type ItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * The data needed to update a Item.
     */
    data: XOR<ItemUpdateInput, ItemUncheckedUpdateInput>
    /**
     * Choose, which Item to update.
     */
    where: ItemWhereUniqueInput
  }

  /**
   * Item updateMany
   */
  export type ItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Items.
     */
    data: XOR<ItemUpdateManyMutationInput, ItemUncheckedUpdateManyInput>
    /**
     * Filter which Items to update
     */
    where?: ItemWhereInput
    /**
     * Limit how many Items to update.
     */
    limit?: number
  }

  /**
   * Item updateManyAndReturn
   */
  export type ItemUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * The data used to update Items.
     */
    data: XOR<ItemUpdateManyMutationInput, ItemUncheckedUpdateManyInput>
    /**
     * Filter which Items to update
     */
    where?: ItemWhereInput
    /**
     * Limit how many Items to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Item upsert
   */
  export type ItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * The filter to search for the Item to update in case it exists.
     */
    where: ItemWhereUniqueInput
    /**
     * In case the Item found by the `where` argument doesn't exist, create a new Item with this data.
     */
    create: XOR<ItemCreateInput, ItemUncheckedCreateInput>
    /**
     * In case the Item was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ItemUpdateInput, ItemUncheckedUpdateInput>
  }

  /**
   * Item delete
   */
  export type ItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    /**
     * Filter which Item to delete.
     */
    where: ItemWhereUniqueInput
  }

  /**
   * Item deleteMany
   */
  export type ItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Items to delete
     */
    where?: ItemWhereInput
    /**
     * Limit how many Items to delete.
     */
    limit?: number
  }

  /**
   * Item.primaryCategory
   */
  export type Item$primaryCategoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryInclude<ExtArgs> | null
    where?: ItemCategoryWhereInput
  }

  /**
   * Item.parentLinks
   */
  export type Item$parentLinksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionInclude<ExtArgs> | null
    where?: ItemCompositionWhereInput
    orderBy?: ItemCompositionOrderByWithRelationInput | ItemCompositionOrderByWithRelationInput[]
    cursor?: ItemCompositionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ItemCompositionScalarFieldEnum | ItemCompositionScalarFieldEnum[]
  }

  /**
   * Item.componentLinks
   */
  export type Item$componentLinksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionInclude<ExtArgs> | null
    where?: ItemCompositionWhereInput
    orderBy?: ItemCompositionOrderByWithRelationInput | ItemCompositionOrderByWithRelationInput[]
    cursor?: ItemCompositionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ItemCompositionScalarFieldEnum | ItemCompositionScalarFieldEnum[]
  }

  /**
   * Item.supplierMappings
   */
  export type Item$supplierMappingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierItemMapping
     */
    select?: SupplierItemMappingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierItemMapping
     */
    omit?: SupplierItemMappingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierItemMappingInclude<ExtArgs> | null
    where?: SupplierItemMappingWhereInput
    orderBy?: SupplierItemMappingOrderByWithRelationInput | SupplierItemMappingOrderByWithRelationInput[]
    cursor?: SupplierItemMappingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SupplierItemMappingScalarFieldEnum | SupplierItemMappingScalarFieldEnum[]
  }

  /**
   * Item without action
   */
  export type ItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
  }


  /**
   * Model ItemCategory
   */

  export type AggregateItemCategory = {
    _count: ItemCategoryCountAggregateOutputType | null
    _min: ItemCategoryMinAggregateOutputType | null
    _max: ItemCategoryMaxAggregateOutputType | null
  }

  export type ItemCategoryMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    categoryCode: string | null
    categoryName: string | null
    parentCategoryId: string | null
    status: $Enums.ItemCategoryStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ItemCategoryMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    categoryCode: string | null
    categoryName: string | null
    parentCategoryId: string | null
    status: $Enums.ItemCategoryStatus | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ItemCategoryCountAggregateOutputType = {
    id: number
    tenantId: number
    categoryCode: number
    categoryName: number
    parentCategoryId: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ItemCategoryMinAggregateInputType = {
    id?: true
    tenantId?: true
    categoryCode?: true
    categoryName?: true
    parentCategoryId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ItemCategoryMaxAggregateInputType = {
    id?: true
    tenantId?: true
    categoryCode?: true
    categoryName?: true
    parentCategoryId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ItemCategoryCountAggregateInputType = {
    id?: true
    tenantId?: true
    categoryCode?: true
    categoryName?: true
    parentCategoryId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ItemCategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ItemCategory to aggregate.
     */
    where?: ItemCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ItemCategories to fetch.
     */
    orderBy?: ItemCategoryOrderByWithRelationInput | ItemCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ItemCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ItemCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ItemCategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ItemCategories
    **/
    _count?: true | ItemCategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ItemCategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ItemCategoryMaxAggregateInputType
  }

  export type GetItemCategoryAggregateType<T extends ItemCategoryAggregateArgs> = {
        [P in keyof T & keyof AggregateItemCategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateItemCategory[P]>
      : GetScalarType<T[P], AggregateItemCategory[P]>
  }




  export type ItemCategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemCategoryWhereInput
    orderBy?: ItemCategoryOrderByWithAggregationInput | ItemCategoryOrderByWithAggregationInput[]
    by: ItemCategoryScalarFieldEnum[] | ItemCategoryScalarFieldEnum
    having?: ItemCategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ItemCategoryCountAggregateInputType | true
    _min?: ItemCategoryMinAggregateInputType
    _max?: ItemCategoryMaxAggregateInputType
  }

  export type ItemCategoryGroupByOutputType = {
    id: string
    tenantId: string
    categoryCode: string
    categoryName: string
    parentCategoryId: string | null
    status: $Enums.ItemCategoryStatus
    createdAt: Date
    updatedAt: Date
    _count: ItemCategoryCountAggregateOutputType | null
    _min: ItemCategoryMinAggregateOutputType | null
    _max: ItemCategoryMaxAggregateOutputType | null
  }

  type GetItemCategoryGroupByPayload<T extends ItemCategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ItemCategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ItemCategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ItemCategoryGroupByOutputType[P]>
            : GetScalarType<T[P], ItemCategoryGroupByOutputType[P]>
        }
      >
    >


  export type ItemCategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    categoryCode?: boolean
    categoryName?: boolean
    parentCategoryId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    parent?: boolean | ItemCategory$parentArgs<ExtArgs>
    children?: boolean | ItemCategory$childrenArgs<ExtArgs>
    items?: boolean | ItemCategory$itemsArgs<ExtArgs>
    _count?: boolean | ItemCategoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["itemCategory"]>

  export type ItemCategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    categoryCode?: boolean
    categoryName?: boolean
    parentCategoryId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    parent?: boolean | ItemCategory$parentArgs<ExtArgs>
  }, ExtArgs["result"]["itemCategory"]>

  export type ItemCategorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    categoryCode?: boolean
    categoryName?: boolean
    parentCategoryId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    parent?: boolean | ItemCategory$parentArgs<ExtArgs>
  }, ExtArgs["result"]["itemCategory"]>

  export type ItemCategorySelectScalar = {
    id?: boolean
    tenantId?: boolean
    categoryCode?: boolean
    categoryName?: boolean
    parentCategoryId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ItemCategoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "categoryCode" | "categoryName" | "parentCategoryId" | "status" | "createdAt" | "updatedAt", ExtArgs["result"]["itemCategory"]>
  export type ItemCategoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parent?: boolean | ItemCategory$parentArgs<ExtArgs>
    children?: boolean | ItemCategory$childrenArgs<ExtArgs>
    items?: boolean | ItemCategory$itemsArgs<ExtArgs>
    _count?: boolean | ItemCategoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ItemCategoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parent?: boolean | ItemCategory$parentArgs<ExtArgs>
  }
  export type ItemCategoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parent?: boolean | ItemCategory$parentArgs<ExtArgs>
  }

  export type $ItemCategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ItemCategory"
    objects: {
      parent: Prisma.$ItemCategoryPayload<ExtArgs> | null
      children: Prisma.$ItemCategoryPayload<ExtArgs>[]
      items: Prisma.$ItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      categoryCode: string
      categoryName: string
      parentCategoryId: string | null
      status: $Enums.ItemCategoryStatus
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["itemCategory"]>
    composites: {}
  }

  type ItemCategoryGetPayload<S extends boolean | null | undefined | ItemCategoryDefaultArgs> = $Result.GetResult<Prisma.$ItemCategoryPayload, S>

  type ItemCategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ItemCategoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ItemCategoryCountAggregateInputType | true
    }

  export interface ItemCategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ItemCategory'], meta: { name: 'ItemCategory' } }
    /**
     * Find zero or one ItemCategory that matches the filter.
     * @param {ItemCategoryFindUniqueArgs} args - Arguments to find a ItemCategory
     * @example
     * // Get one ItemCategory
     * const itemCategory = await prisma.itemCategory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ItemCategoryFindUniqueArgs>(args: SelectSubset<T, ItemCategoryFindUniqueArgs<ExtArgs>>): Prisma__ItemCategoryClient<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one ItemCategory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ItemCategoryFindUniqueOrThrowArgs} args - Arguments to find a ItemCategory
     * @example
     * // Get one ItemCategory
     * const itemCategory = await prisma.itemCategory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ItemCategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, ItemCategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ItemCategoryClient<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first ItemCategory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCategoryFindFirstArgs} args - Arguments to find a ItemCategory
     * @example
     * // Get one ItemCategory
     * const itemCategory = await prisma.itemCategory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ItemCategoryFindFirstArgs>(args?: SelectSubset<T, ItemCategoryFindFirstArgs<ExtArgs>>): Prisma__ItemCategoryClient<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first ItemCategory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCategoryFindFirstOrThrowArgs} args - Arguments to find a ItemCategory
     * @example
     * // Get one ItemCategory
     * const itemCategory = await prisma.itemCategory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ItemCategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, ItemCategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__ItemCategoryClient<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more ItemCategories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ItemCategories
     * const itemCategories = await prisma.itemCategory.findMany()
     * 
     * // Get first 10 ItemCategories
     * const itemCategories = await prisma.itemCategory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const itemCategoryWithIdOnly = await prisma.itemCategory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ItemCategoryFindManyArgs>(args?: SelectSubset<T, ItemCategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a ItemCategory.
     * @param {ItemCategoryCreateArgs} args - Arguments to create a ItemCategory.
     * @example
     * // Create one ItemCategory
     * const ItemCategory = await prisma.itemCategory.create({
     *   data: {
     *     // ... data to create a ItemCategory
     *   }
     * })
     * 
     */
    create<T extends ItemCategoryCreateArgs>(args: SelectSubset<T, ItemCategoryCreateArgs<ExtArgs>>): Prisma__ItemCategoryClient<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many ItemCategories.
     * @param {ItemCategoryCreateManyArgs} args - Arguments to create many ItemCategories.
     * @example
     * // Create many ItemCategories
     * const itemCategory = await prisma.itemCategory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ItemCategoryCreateManyArgs>(args?: SelectSubset<T, ItemCategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ItemCategories and returns the data saved in the database.
     * @param {ItemCategoryCreateManyAndReturnArgs} args - Arguments to create many ItemCategories.
     * @example
     * // Create many ItemCategories
     * const itemCategory = await prisma.itemCategory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ItemCategories and only return the `id`
     * const itemCategoryWithIdOnly = await prisma.itemCategory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ItemCategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, ItemCategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a ItemCategory.
     * @param {ItemCategoryDeleteArgs} args - Arguments to delete one ItemCategory.
     * @example
     * // Delete one ItemCategory
     * const ItemCategory = await prisma.itemCategory.delete({
     *   where: {
     *     // ... filter to delete one ItemCategory
     *   }
     * })
     * 
     */
    delete<T extends ItemCategoryDeleteArgs>(args: SelectSubset<T, ItemCategoryDeleteArgs<ExtArgs>>): Prisma__ItemCategoryClient<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one ItemCategory.
     * @param {ItemCategoryUpdateArgs} args - Arguments to update one ItemCategory.
     * @example
     * // Update one ItemCategory
     * const itemCategory = await prisma.itemCategory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ItemCategoryUpdateArgs>(args: SelectSubset<T, ItemCategoryUpdateArgs<ExtArgs>>): Prisma__ItemCategoryClient<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more ItemCategories.
     * @param {ItemCategoryDeleteManyArgs} args - Arguments to filter ItemCategories to delete.
     * @example
     * // Delete a few ItemCategories
     * const { count } = await prisma.itemCategory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ItemCategoryDeleteManyArgs>(args?: SelectSubset<T, ItemCategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ItemCategories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ItemCategories
     * const itemCategory = await prisma.itemCategory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ItemCategoryUpdateManyArgs>(args: SelectSubset<T, ItemCategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ItemCategories and returns the data updated in the database.
     * @param {ItemCategoryUpdateManyAndReturnArgs} args - Arguments to update many ItemCategories.
     * @example
     * // Update many ItemCategories
     * const itemCategory = await prisma.itemCategory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ItemCategories and only return the `id`
     * const itemCategoryWithIdOnly = await prisma.itemCategory.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ItemCategoryUpdateManyAndReturnArgs>(args: SelectSubset<T, ItemCategoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one ItemCategory.
     * @param {ItemCategoryUpsertArgs} args - Arguments to update or create a ItemCategory.
     * @example
     * // Update or create a ItemCategory
     * const itemCategory = await prisma.itemCategory.upsert({
     *   create: {
     *     // ... data to create a ItemCategory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ItemCategory we want to update
     *   }
     * })
     */
    upsert<T extends ItemCategoryUpsertArgs>(args: SelectSubset<T, ItemCategoryUpsertArgs<ExtArgs>>): Prisma__ItemCategoryClient<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of ItemCategories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCategoryCountArgs} args - Arguments to filter ItemCategories to count.
     * @example
     * // Count the number of ItemCategories
     * const count = await prisma.itemCategory.count({
     *   where: {
     *     // ... the filter for the ItemCategories we want to count
     *   }
     * })
    **/
    count<T extends ItemCategoryCountArgs>(
      args?: Subset<T, ItemCategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ItemCategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ItemCategory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ItemCategoryAggregateArgs>(args: Subset<T, ItemCategoryAggregateArgs>): Prisma.PrismaPromise<GetItemCategoryAggregateType<T>>

    /**
     * Group by ItemCategory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCategoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ItemCategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ItemCategoryGroupByArgs['orderBy'] }
        : { orderBy?: ItemCategoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ItemCategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetItemCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ItemCategory model
   */
  readonly fields: ItemCategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ItemCategory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ItemCategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    parent<T extends ItemCategory$parentArgs<ExtArgs> = {}>(args?: Subset<T, ItemCategory$parentArgs<ExtArgs>>): Prisma__ItemCategoryClient<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | null, null, ExtArgs, ClientOptions>
    children<T extends ItemCategory$childrenArgs<ExtArgs> = {}>(args?: Subset<T, ItemCategory$childrenArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemCategoryPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    items<T extends ItemCategory$itemsArgs<ExtArgs> = {}>(args?: Subset<T, ItemCategory$itemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ItemCategory model
   */ 
  interface ItemCategoryFieldRefs {
    readonly id: FieldRef<"ItemCategory", 'String'>
    readonly tenantId: FieldRef<"ItemCategory", 'String'>
    readonly categoryCode: FieldRef<"ItemCategory", 'String'>
    readonly categoryName: FieldRef<"ItemCategory", 'String'>
    readonly parentCategoryId: FieldRef<"ItemCategory", 'String'>
    readonly status: FieldRef<"ItemCategory", 'ItemCategoryStatus'>
    readonly createdAt: FieldRef<"ItemCategory", 'DateTime'>
    readonly updatedAt: FieldRef<"ItemCategory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ItemCategory findUnique
   */
  export type ItemCategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryInclude<ExtArgs> | null
    /**
     * Filter, which ItemCategory to fetch.
     */
    where: ItemCategoryWhereUniqueInput
  }

  /**
   * ItemCategory findUniqueOrThrow
   */
  export type ItemCategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryInclude<ExtArgs> | null
    /**
     * Filter, which ItemCategory to fetch.
     */
    where: ItemCategoryWhereUniqueInput
  }

  /**
   * ItemCategory findFirst
   */
  export type ItemCategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryInclude<ExtArgs> | null
    /**
     * Filter, which ItemCategory to fetch.
     */
    where?: ItemCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ItemCategories to fetch.
     */
    orderBy?: ItemCategoryOrderByWithRelationInput | ItemCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ItemCategories.
     */
    cursor?: ItemCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ItemCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ItemCategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ItemCategories.
     */
    distinct?: ItemCategoryScalarFieldEnum | ItemCategoryScalarFieldEnum[]
  }

  /**
   * ItemCategory findFirstOrThrow
   */
  export type ItemCategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryInclude<ExtArgs> | null
    /**
     * Filter, which ItemCategory to fetch.
     */
    where?: ItemCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ItemCategories to fetch.
     */
    orderBy?: ItemCategoryOrderByWithRelationInput | ItemCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ItemCategories.
     */
    cursor?: ItemCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ItemCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ItemCategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ItemCategories.
     */
    distinct?: ItemCategoryScalarFieldEnum | ItemCategoryScalarFieldEnum[]
  }

  /**
   * ItemCategory findMany
   */
  export type ItemCategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryInclude<ExtArgs> | null
    /**
     * Filter, which ItemCategories to fetch.
     */
    where?: ItemCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ItemCategories to fetch.
     */
    orderBy?: ItemCategoryOrderByWithRelationInput | ItemCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ItemCategories.
     */
    cursor?: ItemCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ItemCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ItemCategories.
     */
    skip?: number
    distinct?: ItemCategoryScalarFieldEnum | ItemCategoryScalarFieldEnum[]
  }

  /**
   * ItemCategory create
   */
  export type ItemCategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryInclude<ExtArgs> | null
    /**
     * The data needed to create a ItemCategory.
     */
    data: XOR<ItemCategoryCreateInput, ItemCategoryUncheckedCreateInput>
  }

  /**
   * ItemCategory createMany
   */
  export type ItemCategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ItemCategories.
     */
    data: ItemCategoryCreateManyInput | ItemCategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ItemCategory createManyAndReturn
   */
  export type ItemCategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * The data used to create many ItemCategories.
     */
    data: ItemCategoryCreateManyInput | ItemCategoryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ItemCategory update
   */
  export type ItemCategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryInclude<ExtArgs> | null
    /**
     * The data needed to update a ItemCategory.
     */
    data: XOR<ItemCategoryUpdateInput, ItemCategoryUncheckedUpdateInput>
    /**
     * Choose, which ItemCategory to update.
     */
    where: ItemCategoryWhereUniqueInput
  }

  /**
   * ItemCategory updateMany
   */
  export type ItemCategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ItemCategories.
     */
    data: XOR<ItemCategoryUpdateManyMutationInput, ItemCategoryUncheckedUpdateManyInput>
    /**
     * Filter which ItemCategories to update
     */
    where?: ItemCategoryWhereInput
    /**
     * Limit how many ItemCategories to update.
     */
    limit?: number
  }

  /**
   * ItemCategory updateManyAndReturn
   */
  export type ItemCategoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * The data used to update ItemCategories.
     */
    data: XOR<ItemCategoryUpdateManyMutationInput, ItemCategoryUncheckedUpdateManyInput>
    /**
     * Filter which ItemCategories to update
     */
    where?: ItemCategoryWhereInput
    /**
     * Limit how many ItemCategories to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ItemCategory upsert
   */
  export type ItemCategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryInclude<ExtArgs> | null
    /**
     * The filter to search for the ItemCategory to update in case it exists.
     */
    where: ItemCategoryWhereUniqueInput
    /**
     * In case the ItemCategory found by the `where` argument doesn't exist, create a new ItemCategory with this data.
     */
    create: XOR<ItemCategoryCreateInput, ItemCategoryUncheckedCreateInput>
    /**
     * In case the ItemCategory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ItemCategoryUpdateInput, ItemCategoryUncheckedUpdateInput>
  }

  /**
   * ItemCategory delete
   */
  export type ItemCategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryInclude<ExtArgs> | null
    /**
     * Filter which ItemCategory to delete.
     */
    where: ItemCategoryWhereUniqueInput
  }

  /**
   * ItemCategory deleteMany
   */
  export type ItemCategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ItemCategories to delete
     */
    where?: ItemCategoryWhereInput
    /**
     * Limit how many ItemCategories to delete.
     */
    limit?: number
  }

  /**
   * ItemCategory.parent
   */
  export type ItemCategory$parentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryInclude<ExtArgs> | null
    where?: ItemCategoryWhereInput
  }

  /**
   * ItemCategory.children
   */
  export type ItemCategory$childrenArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryInclude<ExtArgs> | null
    where?: ItemCategoryWhereInput
    orderBy?: ItemCategoryOrderByWithRelationInput | ItemCategoryOrderByWithRelationInput[]
    cursor?: ItemCategoryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ItemCategoryScalarFieldEnum | ItemCategoryScalarFieldEnum[]
  }

  /**
   * ItemCategory.items
   */
  export type ItemCategory$itemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Item
     */
    select?: ItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Item
     */
    omit?: ItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemInclude<ExtArgs> | null
    where?: ItemWhereInput
    orderBy?: ItemOrderByWithRelationInput | ItemOrderByWithRelationInput[]
    cursor?: ItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ItemScalarFieldEnum | ItemScalarFieldEnum[]
  }

  /**
   * ItemCategory without action
   */
  export type ItemCategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemCategory
     */
    select?: ItemCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemCategory
     */
    omit?: ItemCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCategoryInclude<ExtArgs> | null
  }


  /**
   * Model ItemComposition
   */

  export type AggregateItemComposition = {
    _count: ItemCompositionCountAggregateOutputType | null
    _avg: ItemCompositionAvgAggregateOutputType | null
    _sum: ItemCompositionSumAggregateOutputType | null
    _min: ItemCompositionMinAggregateOutputType | null
    _max: ItemCompositionMaxAggregateOutputType | null
  }

  export type ItemCompositionAvgAggregateOutputType = {
    sortOrder: number | null
  }

  export type ItemCompositionSumAggregateOutputType = {
    sortOrder: number | null
  }

  export type ItemCompositionMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    parentItemId: string | null
    componentItemId: string | null
    sortOrder: number | null
    createdAt: Date | null
  }

  export type ItemCompositionMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    parentItemId: string | null
    componentItemId: string | null
    sortOrder: number | null
    createdAt: Date | null
  }

  export type ItemCompositionCountAggregateOutputType = {
    id: number
    tenantId: number
    parentItemId: number
    componentItemId: number
    sortOrder: number
    createdAt: number
    _all: number
  }


  export type ItemCompositionAvgAggregateInputType = {
    sortOrder?: true
  }

  export type ItemCompositionSumAggregateInputType = {
    sortOrder?: true
  }

  export type ItemCompositionMinAggregateInputType = {
    id?: true
    tenantId?: true
    parentItemId?: true
    componentItemId?: true
    sortOrder?: true
    createdAt?: true
  }

  export type ItemCompositionMaxAggregateInputType = {
    id?: true
    tenantId?: true
    parentItemId?: true
    componentItemId?: true
    sortOrder?: true
    createdAt?: true
  }

  export type ItemCompositionCountAggregateInputType = {
    id?: true
    tenantId?: true
    parentItemId?: true
    componentItemId?: true
    sortOrder?: true
    createdAt?: true
    _all?: true
  }

  export type ItemCompositionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ItemComposition to aggregate.
     */
    where?: ItemCompositionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ItemCompositions to fetch.
     */
    orderBy?: ItemCompositionOrderByWithRelationInput | ItemCompositionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ItemCompositionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ItemCompositions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ItemCompositions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ItemCompositions
    **/
    _count?: true | ItemCompositionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ItemCompositionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ItemCompositionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ItemCompositionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ItemCompositionMaxAggregateInputType
  }

  export type GetItemCompositionAggregateType<T extends ItemCompositionAggregateArgs> = {
        [P in keyof T & keyof AggregateItemComposition]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateItemComposition[P]>
      : GetScalarType<T[P], AggregateItemComposition[P]>
  }




  export type ItemCompositionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ItemCompositionWhereInput
    orderBy?: ItemCompositionOrderByWithAggregationInput | ItemCompositionOrderByWithAggregationInput[]
    by: ItemCompositionScalarFieldEnum[] | ItemCompositionScalarFieldEnum
    having?: ItemCompositionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ItemCompositionCountAggregateInputType | true
    _avg?: ItemCompositionAvgAggregateInputType
    _sum?: ItemCompositionSumAggregateInputType
    _min?: ItemCompositionMinAggregateInputType
    _max?: ItemCompositionMaxAggregateInputType
  }

  export type ItemCompositionGroupByOutputType = {
    id: string
    tenantId: string
    parentItemId: string
    componentItemId: string
    sortOrder: number
    createdAt: Date
    _count: ItemCompositionCountAggregateOutputType | null
    _avg: ItemCompositionAvgAggregateOutputType | null
    _sum: ItemCompositionSumAggregateOutputType | null
    _min: ItemCompositionMinAggregateOutputType | null
    _max: ItemCompositionMaxAggregateOutputType | null
  }

  type GetItemCompositionGroupByPayload<T extends ItemCompositionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ItemCompositionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ItemCompositionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ItemCompositionGroupByOutputType[P]>
            : GetScalarType<T[P], ItemCompositionGroupByOutputType[P]>
        }
      >
    >


  export type ItemCompositionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    parentItemId?: boolean
    componentItemId?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    parentItem?: boolean | ItemDefaultArgs<ExtArgs>
    componentItem?: boolean | ItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["itemComposition"]>

  export type ItemCompositionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    parentItemId?: boolean
    componentItemId?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    parentItem?: boolean | ItemDefaultArgs<ExtArgs>
    componentItem?: boolean | ItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["itemComposition"]>

  export type ItemCompositionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    parentItemId?: boolean
    componentItemId?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    parentItem?: boolean | ItemDefaultArgs<ExtArgs>
    componentItem?: boolean | ItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["itemComposition"]>

  export type ItemCompositionSelectScalar = {
    id?: boolean
    tenantId?: boolean
    parentItemId?: boolean
    componentItemId?: boolean
    sortOrder?: boolean
    createdAt?: boolean
  }

  export type ItemCompositionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "parentItemId" | "componentItemId" | "sortOrder" | "createdAt", ExtArgs["result"]["itemComposition"]>
  export type ItemCompositionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parentItem?: boolean | ItemDefaultArgs<ExtArgs>
    componentItem?: boolean | ItemDefaultArgs<ExtArgs>
  }
  export type ItemCompositionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parentItem?: boolean | ItemDefaultArgs<ExtArgs>
    componentItem?: boolean | ItemDefaultArgs<ExtArgs>
  }
  export type ItemCompositionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    parentItem?: boolean | ItemDefaultArgs<ExtArgs>
    componentItem?: boolean | ItemDefaultArgs<ExtArgs>
  }

  export type $ItemCompositionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ItemComposition"
    objects: {
      parentItem: Prisma.$ItemPayload<ExtArgs>
      componentItem: Prisma.$ItemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      parentItemId: string
      componentItemId: string
      sortOrder: number
      createdAt: Date
    }, ExtArgs["result"]["itemComposition"]>
    composites: {}
  }

  type ItemCompositionGetPayload<S extends boolean | null | undefined | ItemCompositionDefaultArgs> = $Result.GetResult<Prisma.$ItemCompositionPayload, S>

  type ItemCompositionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ItemCompositionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ItemCompositionCountAggregateInputType | true
    }

  export interface ItemCompositionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ItemComposition'], meta: { name: 'ItemComposition' } }
    /**
     * Find zero or one ItemComposition that matches the filter.
     * @param {ItemCompositionFindUniqueArgs} args - Arguments to find a ItemComposition
     * @example
     * // Get one ItemComposition
     * const itemComposition = await prisma.itemComposition.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ItemCompositionFindUniqueArgs>(args: SelectSubset<T, ItemCompositionFindUniqueArgs<ExtArgs>>): Prisma__ItemCompositionClient<$Result.GetResult<Prisma.$ItemCompositionPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one ItemComposition that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ItemCompositionFindUniqueOrThrowArgs} args - Arguments to find a ItemComposition
     * @example
     * // Get one ItemComposition
     * const itemComposition = await prisma.itemComposition.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ItemCompositionFindUniqueOrThrowArgs>(args: SelectSubset<T, ItemCompositionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ItemCompositionClient<$Result.GetResult<Prisma.$ItemCompositionPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first ItemComposition that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCompositionFindFirstArgs} args - Arguments to find a ItemComposition
     * @example
     * // Get one ItemComposition
     * const itemComposition = await prisma.itemComposition.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ItemCompositionFindFirstArgs>(args?: SelectSubset<T, ItemCompositionFindFirstArgs<ExtArgs>>): Prisma__ItemCompositionClient<$Result.GetResult<Prisma.$ItemCompositionPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first ItemComposition that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCompositionFindFirstOrThrowArgs} args - Arguments to find a ItemComposition
     * @example
     * // Get one ItemComposition
     * const itemComposition = await prisma.itemComposition.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ItemCompositionFindFirstOrThrowArgs>(args?: SelectSubset<T, ItemCompositionFindFirstOrThrowArgs<ExtArgs>>): Prisma__ItemCompositionClient<$Result.GetResult<Prisma.$ItemCompositionPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more ItemCompositions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCompositionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ItemCompositions
     * const itemCompositions = await prisma.itemComposition.findMany()
     * 
     * // Get first 10 ItemCompositions
     * const itemCompositions = await prisma.itemComposition.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const itemCompositionWithIdOnly = await prisma.itemComposition.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ItemCompositionFindManyArgs>(args?: SelectSubset<T, ItemCompositionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemCompositionPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a ItemComposition.
     * @param {ItemCompositionCreateArgs} args - Arguments to create a ItemComposition.
     * @example
     * // Create one ItemComposition
     * const ItemComposition = await prisma.itemComposition.create({
     *   data: {
     *     // ... data to create a ItemComposition
     *   }
     * })
     * 
     */
    create<T extends ItemCompositionCreateArgs>(args: SelectSubset<T, ItemCompositionCreateArgs<ExtArgs>>): Prisma__ItemCompositionClient<$Result.GetResult<Prisma.$ItemCompositionPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many ItemCompositions.
     * @param {ItemCompositionCreateManyArgs} args - Arguments to create many ItemCompositions.
     * @example
     * // Create many ItemCompositions
     * const itemComposition = await prisma.itemComposition.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ItemCompositionCreateManyArgs>(args?: SelectSubset<T, ItemCompositionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ItemCompositions and returns the data saved in the database.
     * @param {ItemCompositionCreateManyAndReturnArgs} args - Arguments to create many ItemCompositions.
     * @example
     * // Create many ItemCompositions
     * const itemComposition = await prisma.itemComposition.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ItemCompositions and only return the `id`
     * const itemCompositionWithIdOnly = await prisma.itemComposition.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ItemCompositionCreateManyAndReturnArgs>(args?: SelectSubset<T, ItemCompositionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemCompositionPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a ItemComposition.
     * @param {ItemCompositionDeleteArgs} args - Arguments to delete one ItemComposition.
     * @example
     * // Delete one ItemComposition
     * const ItemComposition = await prisma.itemComposition.delete({
     *   where: {
     *     // ... filter to delete one ItemComposition
     *   }
     * })
     * 
     */
    delete<T extends ItemCompositionDeleteArgs>(args: SelectSubset<T, ItemCompositionDeleteArgs<ExtArgs>>): Prisma__ItemCompositionClient<$Result.GetResult<Prisma.$ItemCompositionPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one ItemComposition.
     * @param {ItemCompositionUpdateArgs} args - Arguments to update one ItemComposition.
     * @example
     * // Update one ItemComposition
     * const itemComposition = await prisma.itemComposition.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ItemCompositionUpdateArgs>(args: SelectSubset<T, ItemCompositionUpdateArgs<ExtArgs>>): Prisma__ItemCompositionClient<$Result.GetResult<Prisma.$ItemCompositionPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more ItemCompositions.
     * @param {ItemCompositionDeleteManyArgs} args - Arguments to filter ItemCompositions to delete.
     * @example
     * // Delete a few ItemCompositions
     * const { count } = await prisma.itemComposition.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ItemCompositionDeleteManyArgs>(args?: SelectSubset<T, ItemCompositionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ItemCompositions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCompositionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ItemCompositions
     * const itemComposition = await prisma.itemComposition.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ItemCompositionUpdateManyArgs>(args: SelectSubset<T, ItemCompositionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ItemCompositions and returns the data updated in the database.
     * @param {ItemCompositionUpdateManyAndReturnArgs} args - Arguments to update many ItemCompositions.
     * @example
     * // Update many ItemCompositions
     * const itemComposition = await prisma.itemComposition.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ItemCompositions and only return the `id`
     * const itemCompositionWithIdOnly = await prisma.itemComposition.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ItemCompositionUpdateManyAndReturnArgs>(args: SelectSubset<T, ItemCompositionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ItemCompositionPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one ItemComposition.
     * @param {ItemCompositionUpsertArgs} args - Arguments to update or create a ItemComposition.
     * @example
     * // Update or create a ItemComposition
     * const itemComposition = await prisma.itemComposition.upsert({
     *   create: {
     *     // ... data to create a ItemComposition
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ItemComposition we want to update
     *   }
     * })
     */
    upsert<T extends ItemCompositionUpsertArgs>(args: SelectSubset<T, ItemCompositionUpsertArgs<ExtArgs>>): Prisma__ItemCompositionClient<$Result.GetResult<Prisma.$ItemCompositionPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of ItemCompositions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCompositionCountArgs} args - Arguments to filter ItemCompositions to count.
     * @example
     * // Count the number of ItemCompositions
     * const count = await prisma.itemComposition.count({
     *   where: {
     *     // ... the filter for the ItemCompositions we want to count
     *   }
     * })
    **/
    count<T extends ItemCompositionCountArgs>(
      args?: Subset<T, ItemCompositionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ItemCompositionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ItemComposition.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCompositionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ItemCompositionAggregateArgs>(args: Subset<T, ItemCompositionAggregateArgs>): Prisma.PrismaPromise<GetItemCompositionAggregateType<T>>

    /**
     * Group by ItemComposition.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ItemCompositionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ItemCompositionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ItemCompositionGroupByArgs['orderBy'] }
        : { orderBy?: ItemCompositionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ItemCompositionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetItemCompositionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ItemComposition model
   */
  readonly fields: ItemCompositionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ItemComposition.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ItemCompositionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    parentItem<T extends ItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ItemDefaultArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    componentItem<T extends ItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ItemDefaultArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ItemComposition model
   */ 
  interface ItemCompositionFieldRefs {
    readonly id: FieldRef<"ItemComposition", 'String'>
    readonly tenantId: FieldRef<"ItemComposition", 'String'>
    readonly parentItemId: FieldRef<"ItemComposition", 'String'>
    readonly componentItemId: FieldRef<"ItemComposition", 'String'>
    readonly sortOrder: FieldRef<"ItemComposition", 'Int'>
    readonly createdAt: FieldRef<"ItemComposition", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ItemComposition findUnique
   */
  export type ItemCompositionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionInclude<ExtArgs> | null
    /**
     * Filter, which ItemComposition to fetch.
     */
    where: ItemCompositionWhereUniqueInput
  }

  /**
   * ItemComposition findUniqueOrThrow
   */
  export type ItemCompositionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionInclude<ExtArgs> | null
    /**
     * Filter, which ItemComposition to fetch.
     */
    where: ItemCompositionWhereUniqueInput
  }

  /**
   * ItemComposition findFirst
   */
  export type ItemCompositionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionInclude<ExtArgs> | null
    /**
     * Filter, which ItemComposition to fetch.
     */
    where?: ItemCompositionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ItemCompositions to fetch.
     */
    orderBy?: ItemCompositionOrderByWithRelationInput | ItemCompositionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ItemCompositions.
     */
    cursor?: ItemCompositionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ItemCompositions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ItemCompositions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ItemCompositions.
     */
    distinct?: ItemCompositionScalarFieldEnum | ItemCompositionScalarFieldEnum[]
  }

  /**
   * ItemComposition findFirstOrThrow
   */
  export type ItemCompositionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionInclude<ExtArgs> | null
    /**
     * Filter, which ItemComposition to fetch.
     */
    where?: ItemCompositionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ItemCompositions to fetch.
     */
    orderBy?: ItemCompositionOrderByWithRelationInput | ItemCompositionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ItemCompositions.
     */
    cursor?: ItemCompositionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ItemCompositions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ItemCompositions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ItemCompositions.
     */
    distinct?: ItemCompositionScalarFieldEnum | ItemCompositionScalarFieldEnum[]
  }

  /**
   * ItemComposition findMany
   */
  export type ItemCompositionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionInclude<ExtArgs> | null
    /**
     * Filter, which ItemCompositions to fetch.
     */
    where?: ItemCompositionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ItemCompositions to fetch.
     */
    orderBy?: ItemCompositionOrderByWithRelationInput | ItemCompositionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ItemCompositions.
     */
    cursor?: ItemCompositionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ItemCompositions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ItemCompositions.
     */
    skip?: number
    distinct?: ItemCompositionScalarFieldEnum | ItemCompositionScalarFieldEnum[]
  }

  /**
   * ItemComposition create
   */
  export type ItemCompositionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionInclude<ExtArgs> | null
    /**
     * The data needed to create a ItemComposition.
     */
    data: XOR<ItemCompositionCreateInput, ItemCompositionUncheckedCreateInput>
  }

  /**
   * ItemComposition createMany
   */
  export type ItemCompositionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ItemCompositions.
     */
    data: ItemCompositionCreateManyInput | ItemCompositionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ItemComposition createManyAndReturn
   */
  export type ItemCompositionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * The data used to create many ItemCompositions.
     */
    data: ItemCompositionCreateManyInput | ItemCompositionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ItemComposition update
   */
  export type ItemCompositionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionInclude<ExtArgs> | null
    /**
     * The data needed to update a ItemComposition.
     */
    data: XOR<ItemCompositionUpdateInput, ItemCompositionUncheckedUpdateInput>
    /**
     * Choose, which ItemComposition to update.
     */
    where: ItemCompositionWhereUniqueInput
  }

  /**
   * ItemComposition updateMany
   */
  export type ItemCompositionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ItemCompositions.
     */
    data: XOR<ItemCompositionUpdateManyMutationInput, ItemCompositionUncheckedUpdateManyInput>
    /**
     * Filter which ItemCompositions to update
     */
    where?: ItemCompositionWhereInput
    /**
     * Limit how many ItemCompositions to update.
     */
    limit?: number
  }

  /**
   * ItemComposition updateManyAndReturn
   */
  export type ItemCompositionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * The data used to update ItemCompositions.
     */
    data: XOR<ItemCompositionUpdateManyMutationInput, ItemCompositionUncheckedUpdateManyInput>
    /**
     * Filter which ItemCompositions to update
     */
    where?: ItemCompositionWhereInput
    /**
     * Limit how many ItemCompositions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ItemComposition upsert
   */
  export type ItemCompositionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionInclude<ExtArgs> | null
    /**
     * The filter to search for the ItemComposition to update in case it exists.
     */
    where: ItemCompositionWhereUniqueInput
    /**
     * In case the ItemComposition found by the `where` argument doesn't exist, create a new ItemComposition with this data.
     */
    create: XOR<ItemCompositionCreateInput, ItemCompositionUncheckedCreateInput>
    /**
     * In case the ItemComposition was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ItemCompositionUpdateInput, ItemCompositionUncheckedUpdateInput>
  }

  /**
   * ItemComposition delete
   */
  export type ItemCompositionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionInclude<ExtArgs> | null
    /**
     * Filter which ItemComposition to delete.
     */
    where: ItemCompositionWhereUniqueInput
  }

  /**
   * ItemComposition deleteMany
   */
  export type ItemCompositionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ItemCompositions to delete
     */
    where?: ItemCompositionWhereInput
    /**
     * Limit how many ItemCompositions to delete.
     */
    limit?: number
  }

  /**
   * ItemComposition without action
   */
  export type ItemCompositionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ItemComposition
     */
    select?: ItemCompositionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ItemComposition
     */
    omit?: ItemCompositionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ItemCompositionInclude<ExtArgs> | null
  }


  /**
   * Model SupplierItemMapping
   */

  export type AggregateSupplierItemMapping = {
    _count: SupplierItemMappingCountAggregateOutputType | null
    _min: SupplierItemMappingMinAggregateOutputType | null
    _max: SupplierItemMappingMaxAggregateOutputType | null
  }

  export type SupplierItemMappingMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    supplierId: string | null
    supplierItemCode: string | null
    supplierItemName: string | null
    supplierItemCodeKey: string | null
    supplierItemNameKey: string | null
    itemId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupplierItemMappingMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    supplierId: string | null
    supplierItemCode: string | null
    supplierItemName: string | null
    supplierItemCodeKey: string | null
    supplierItemNameKey: string | null
    itemId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SupplierItemMappingCountAggregateOutputType = {
    id: number
    tenantId: number
    supplierId: number
    supplierItemCode: number
    supplierItemName: number
    supplierItemCodeKey: number
    supplierItemNameKey: number
    itemId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SupplierItemMappingMinAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    supplierItemCode?: true
    supplierItemName?: true
    supplierItemCodeKey?: true
    supplierItemNameKey?: true
    itemId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupplierItemMappingMaxAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    supplierItemCode?: true
    supplierItemName?: true
    supplierItemCodeKey?: true
    supplierItemNameKey?: true
    itemId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SupplierItemMappingCountAggregateInputType = {
    id?: true
    tenantId?: true
    supplierId?: true
    supplierItemCode?: true
    supplierItemName?: true
    supplierItemCodeKey?: true
    supplierItemNameKey?: true
    itemId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SupplierItemMappingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupplierItemMapping to aggregate.
     */
    where?: SupplierItemMappingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierItemMappings to fetch.
     */
    orderBy?: SupplierItemMappingOrderByWithRelationInput | SupplierItemMappingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SupplierItemMappingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierItemMappings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierItemMappings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SupplierItemMappings
    **/
    _count?: true | SupplierItemMappingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SupplierItemMappingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SupplierItemMappingMaxAggregateInputType
  }

  export type GetSupplierItemMappingAggregateType<T extends SupplierItemMappingAggregateArgs> = {
        [P in keyof T & keyof AggregateSupplierItemMapping]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSupplierItemMapping[P]>
      : GetScalarType<T[P], AggregateSupplierItemMapping[P]>
  }




  export type SupplierItemMappingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SupplierItemMappingWhereInput
    orderBy?: SupplierItemMappingOrderByWithAggregationInput | SupplierItemMappingOrderByWithAggregationInput[]
    by: SupplierItemMappingScalarFieldEnum[] | SupplierItemMappingScalarFieldEnum
    having?: SupplierItemMappingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SupplierItemMappingCountAggregateInputType | true
    _min?: SupplierItemMappingMinAggregateInputType
    _max?: SupplierItemMappingMaxAggregateInputType
  }

  export type SupplierItemMappingGroupByOutputType = {
    id: string
    tenantId: string
    supplierId: string
    supplierItemCode: string | null
    supplierItemName: string | null
    supplierItemCodeKey: string | null
    supplierItemNameKey: string | null
    itemId: string
    createdAt: Date
    updatedAt: Date
    _count: SupplierItemMappingCountAggregateOutputType | null
    _min: SupplierItemMappingMinAggregateOutputType | null
    _max: SupplierItemMappingMaxAggregateOutputType | null
  }

  type GetSupplierItemMappingGroupByPayload<T extends SupplierItemMappingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SupplierItemMappingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SupplierItemMappingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SupplierItemMappingGroupByOutputType[P]>
            : GetScalarType<T[P], SupplierItemMappingGroupByOutputType[P]>
        }
      >
    >


  export type SupplierItemMappingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    supplierItemCode?: boolean
    supplierItemName?: boolean
    supplierItemCodeKey?: boolean
    supplierItemNameKey?: boolean
    itemId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierItemMapping"]>

  export type SupplierItemMappingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    supplierItemCode?: boolean
    supplierItemName?: boolean
    supplierItemCodeKey?: boolean
    supplierItemNameKey?: boolean
    itemId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierItemMapping"]>

  export type SupplierItemMappingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    supplierItemCode?: boolean
    supplierItemName?: boolean
    supplierItemCodeKey?: boolean
    supplierItemNameKey?: boolean
    itemId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["supplierItemMapping"]>

  export type SupplierItemMappingSelectScalar = {
    id?: boolean
    tenantId?: boolean
    supplierId?: boolean
    supplierItemCode?: boolean
    supplierItemName?: boolean
    supplierItemCodeKey?: boolean
    supplierItemNameKey?: boolean
    itemId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SupplierItemMappingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "supplierId" | "supplierItemCode" | "supplierItemName" | "supplierItemCodeKey" | "supplierItemNameKey" | "itemId" | "createdAt" | "updatedAt", ExtArgs["result"]["supplierItemMapping"]>
  export type SupplierItemMappingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }
  export type SupplierItemMappingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }
  export type SupplierItemMappingIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    item?: boolean | ItemDefaultArgs<ExtArgs>
  }

  export type $SupplierItemMappingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SupplierItemMapping"
    objects: {
      item: Prisma.$ItemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      supplierId: string
      supplierItemCode: string | null
      supplierItemName: string | null
      supplierItemCodeKey: string | null
      supplierItemNameKey: string | null
      itemId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["supplierItemMapping"]>
    composites: {}
  }

  type SupplierItemMappingGetPayload<S extends boolean | null | undefined | SupplierItemMappingDefaultArgs> = $Result.GetResult<Prisma.$SupplierItemMappingPayload, S>

  type SupplierItemMappingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SupplierItemMappingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SupplierItemMappingCountAggregateInputType | true
    }

  export interface SupplierItemMappingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SupplierItemMapping'], meta: { name: 'SupplierItemMapping' } }
    /**
     * Find zero or one SupplierItemMapping that matches the filter.
     * @param {SupplierItemMappingFindUniqueArgs} args - Arguments to find a SupplierItemMapping
     * @example
     * // Get one SupplierItemMapping
     * const supplierItemMapping = await prisma.supplierItemMapping.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SupplierItemMappingFindUniqueArgs>(args: SelectSubset<T, SupplierItemMappingFindUniqueArgs<ExtArgs>>): Prisma__SupplierItemMappingClient<$Result.GetResult<Prisma.$SupplierItemMappingPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one SupplierItemMapping that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SupplierItemMappingFindUniqueOrThrowArgs} args - Arguments to find a SupplierItemMapping
     * @example
     * // Get one SupplierItemMapping
     * const supplierItemMapping = await prisma.supplierItemMapping.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SupplierItemMappingFindUniqueOrThrowArgs>(args: SelectSubset<T, SupplierItemMappingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SupplierItemMappingClient<$Result.GetResult<Prisma.$SupplierItemMappingPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first SupplierItemMapping that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierItemMappingFindFirstArgs} args - Arguments to find a SupplierItemMapping
     * @example
     * // Get one SupplierItemMapping
     * const supplierItemMapping = await prisma.supplierItemMapping.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SupplierItemMappingFindFirstArgs>(args?: SelectSubset<T, SupplierItemMappingFindFirstArgs<ExtArgs>>): Prisma__SupplierItemMappingClient<$Result.GetResult<Prisma.$SupplierItemMappingPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first SupplierItemMapping that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierItemMappingFindFirstOrThrowArgs} args - Arguments to find a SupplierItemMapping
     * @example
     * // Get one SupplierItemMapping
     * const supplierItemMapping = await prisma.supplierItemMapping.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SupplierItemMappingFindFirstOrThrowArgs>(args?: SelectSubset<T, SupplierItemMappingFindFirstOrThrowArgs<ExtArgs>>): Prisma__SupplierItemMappingClient<$Result.GetResult<Prisma.$SupplierItemMappingPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more SupplierItemMappings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierItemMappingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SupplierItemMappings
     * const supplierItemMappings = await prisma.supplierItemMapping.findMany()
     * 
     * // Get first 10 SupplierItemMappings
     * const supplierItemMappings = await prisma.supplierItemMapping.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const supplierItemMappingWithIdOnly = await prisma.supplierItemMapping.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SupplierItemMappingFindManyArgs>(args?: SelectSubset<T, SupplierItemMappingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierItemMappingPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a SupplierItemMapping.
     * @param {SupplierItemMappingCreateArgs} args - Arguments to create a SupplierItemMapping.
     * @example
     * // Create one SupplierItemMapping
     * const SupplierItemMapping = await prisma.supplierItemMapping.create({
     *   data: {
     *     // ... data to create a SupplierItemMapping
     *   }
     * })
     * 
     */
    create<T extends SupplierItemMappingCreateArgs>(args: SelectSubset<T, SupplierItemMappingCreateArgs<ExtArgs>>): Prisma__SupplierItemMappingClient<$Result.GetResult<Prisma.$SupplierItemMappingPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many SupplierItemMappings.
     * @param {SupplierItemMappingCreateManyArgs} args - Arguments to create many SupplierItemMappings.
     * @example
     * // Create many SupplierItemMappings
     * const supplierItemMapping = await prisma.supplierItemMapping.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SupplierItemMappingCreateManyArgs>(args?: SelectSubset<T, SupplierItemMappingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SupplierItemMappings and returns the data saved in the database.
     * @param {SupplierItemMappingCreateManyAndReturnArgs} args - Arguments to create many SupplierItemMappings.
     * @example
     * // Create many SupplierItemMappings
     * const supplierItemMapping = await prisma.supplierItemMapping.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SupplierItemMappings and only return the `id`
     * const supplierItemMappingWithIdOnly = await prisma.supplierItemMapping.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SupplierItemMappingCreateManyAndReturnArgs>(args?: SelectSubset<T, SupplierItemMappingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierItemMappingPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a SupplierItemMapping.
     * @param {SupplierItemMappingDeleteArgs} args - Arguments to delete one SupplierItemMapping.
     * @example
     * // Delete one SupplierItemMapping
     * const SupplierItemMapping = await prisma.supplierItemMapping.delete({
     *   where: {
     *     // ... filter to delete one SupplierItemMapping
     *   }
     * })
     * 
     */
    delete<T extends SupplierItemMappingDeleteArgs>(args: SelectSubset<T, SupplierItemMappingDeleteArgs<ExtArgs>>): Prisma__SupplierItemMappingClient<$Result.GetResult<Prisma.$SupplierItemMappingPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one SupplierItemMapping.
     * @param {SupplierItemMappingUpdateArgs} args - Arguments to update one SupplierItemMapping.
     * @example
     * // Update one SupplierItemMapping
     * const supplierItemMapping = await prisma.supplierItemMapping.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SupplierItemMappingUpdateArgs>(args: SelectSubset<T, SupplierItemMappingUpdateArgs<ExtArgs>>): Prisma__SupplierItemMappingClient<$Result.GetResult<Prisma.$SupplierItemMappingPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more SupplierItemMappings.
     * @param {SupplierItemMappingDeleteManyArgs} args - Arguments to filter SupplierItemMappings to delete.
     * @example
     * // Delete a few SupplierItemMappings
     * const { count } = await prisma.supplierItemMapping.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SupplierItemMappingDeleteManyArgs>(args?: SelectSubset<T, SupplierItemMappingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupplierItemMappings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierItemMappingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SupplierItemMappings
     * const supplierItemMapping = await prisma.supplierItemMapping.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SupplierItemMappingUpdateManyArgs>(args: SelectSubset<T, SupplierItemMappingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SupplierItemMappings and returns the data updated in the database.
     * @param {SupplierItemMappingUpdateManyAndReturnArgs} args - Arguments to update many SupplierItemMappings.
     * @example
     * // Update many SupplierItemMappings
     * const supplierItemMapping = await prisma.supplierItemMapping.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SupplierItemMappings and only return the `id`
     * const supplierItemMappingWithIdOnly = await prisma.supplierItemMapping.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SupplierItemMappingUpdateManyAndReturnArgs>(args: SelectSubset<T, SupplierItemMappingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SupplierItemMappingPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one SupplierItemMapping.
     * @param {SupplierItemMappingUpsertArgs} args - Arguments to update or create a SupplierItemMapping.
     * @example
     * // Update or create a SupplierItemMapping
     * const supplierItemMapping = await prisma.supplierItemMapping.upsert({
     *   create: {
     *     // ... data to create a SupplierItemMapping
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SupplierItemMapping we want to update
     *   }
     * })
     */
    upsert<T extends SupplierItemMappingUpsertArgs>(args: SelectSubset<T, SupplierItemMappingUpsertArgs<ExtArgs>>): Prisma__SupplierItemMappingClient<$Result.GetResult<Prisma.$SupplierItemMappingPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of SupplierItemMappings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierItemMappingCountArgs} args - Arguments to filter SupplierItemMappings to count.
     * @example
     * // Count the number of SupplierItemMappings
     * const count = await prisma.supplierItemMapping.count({
     *   where: {
     *     // ... the filter for the SupplierItemMappings we want to count
     *   }
     * })
    **/
    count<T extends SupplierItemMappingCountArgs>(
      args?: Subset<T, SupplierItemMappingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SupplierItemMappingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SupplierItemMapping.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierItemMappingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SupplierItemMappingAggregateArgs>(args: Subset<T, SupplierItemMappingAggregateArgs>): Prisma.PrismaPromise<GetSupplierItemMappingAggregateType<T>>

    /**
     * Group by SupplierItemMapping.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SupplierItemMappingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SupplierItemMappingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SupplierItemMappingGroupByArgs['orderBy'] }
        : { orderBy?: SupplierItemMappingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SupplierItemMappingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSupplierItemMappingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SupplierItemMapping model
   */
  readonly fields: SupplierItemMappingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SupplierItemMapping.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SupplierItemMappingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    item<T extends ItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ItemDefaultArgs<ExtArgs>>): Prisma__ItemClient<$Result.GetResult<Prisma.$ItemPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SupplierItemMapping model
   */ 
  interface SupplierItemMappingFieldRefs {
    readonly id: FieldRef<"SupplierItemMapping", 'String'>
    readonly tenantId: FieldRef<"SupplierItemMapping", 'String'>
    readonly supplierId: FieldRef<"SupplierItemMapping", 'String'>
    readonly supplierItemCode: FieldRef<"SupplierItemMapping", 'String'>
    readonly supplierItemName: FieldRef<"SupplierItemMapping", 'String'>
    readonly supplierItemCodeKey: FieldRef<"SupplierItemMapping", 'String'>
    readonly supplierItemNameKey: FieldRef<"SupplierItemMapping", 'String'>
    readonly itemId: FieldRef<"SupplierItemMapping", 'String'>
    readonly createdAt: FieldRef<"SupplierItemMapping", 'DateTime'>
    readonly updatedAt: FieldRef<"SupplierItemMapping", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SupplierItemMapping findUnique
   */
  export type SupplierItemMappingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierItemMapping
     */
    select?: SupplierItemMappingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierItemMapping
     */
    omit?: SupplierItemMappingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierItemMappingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierItemMapping to fetch.
     */
    where: SupplierItemMappingWhereUniqueInput
  }

  /**
   * SupplierItemMapping findUniqueOrThrow
   */
  export type SupplierItemMappingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierItemMapping
     */
    select?: SupplierItemMappingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierItemMapping
     */
    omit?: SupplierItemMappingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierItemMappingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierItemMapping to fetch.
     */
    where: SupplierItemMappingWhereUniqueInput
  }

  /**
   * SupplierItemMapping findFirst
   */
  export type SupplierItemMappingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierItemMapping
     */
    select?: SupplierItemMappingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierItemMapping
     */
    omit?: SupplierItemMappingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierItemMappingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierItemMapping to fetch.
     */
    where?: SupplierItemMappingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierItemMappings to fetch.
     */
    orderBy?: SupplierItemMappingOrderByWithRelationInput | SupplierItemMappingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupplierItemMappings.
     */
    cursor?: SupplierItemMappingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierItemMappings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierItemMappings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupplierItemMappings.
     */
    distinct?: SupplierItemMappingScalarFieldEnum | SupplierItemMappingScalarFieldEnum[]
  }

  /**
   * SupplierItemMapping findFirstOrThrow
   */
  export type SupplierItemMappingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierItemMapping
     */
    select?: SupplierItemMappingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierItemMapping
     */
    omit?: SupplierItemMappingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierItemMappingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierItemMapping to fetch.
     */
    where?: SupplierItemMappingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierItemMappings to fetch.
     */
    orderBy?: SupplierItemMappingOrderByWithRelationInput | SupplierItemMappingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SupplierItemMappings.
     */
    cursor?: SupplierItemMappingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierItemMappings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierItemMappings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SupplierItemMappings.
     */
    distinct?: SupplierItemMappingScalarFieldEnum | SupplierItemMappingScalarFieldEnum[]
  }

  /**
   * SupplierItemMapping findMany
   */
  export type SupplierItemMappingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierItemMapping
     */
    select?: SupplierItemMappingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierItemMapping
     */
    omit?: SupplierItemMappingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierItemMappingInclude<ExtArgs> | null
    /**
     * Filter, which SupplierItemMappings to fetch.
     */
    where?: SupplierItemMappingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SupplierItemMappings to fetch.
     */
    orderBy?: SupplierItemMappingOrderByWithRelationInput | SupplierItemMappingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SupplierItemMappings.
     */
    cursor?: SupplierItemMappingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SupplierItemMappings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SupplierItemMappings.
     */
    skip?: number
    distinct?: SupplierItemMappingScalarFieldEnum | SupplierItemMappingScalarFieldEnum[]
  }

  /**
   * SupplierItemMapping create
   */
  export type SupplierItemMappingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierItemMapping
     */
    select?: SupplierItemMappingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierItemMapping
     */
    omit?: SupplierItemMappingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierItemMappingInclude<ExtArgs> | null
    /**
     * The data needed to create a SupplierItemMapping.
     */
    data: XOR<SupplierItemMappingCreateInput, SupplierItemMappingUncheckedCreateInput>
  }

  /**
   * SupplierItemMapping createMany
   */
  export type SupplierItemMappingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SupplierItemMappings.
     */
    data: SupplierItemMappingCreateManyInput | SupplierItemMappingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SupplierItemMapping createManyAndReturn
   */
  export type SupplierItemMappingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierItemMapping
     */
    select?: SupplierItemMappingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierItemMapping
     */
    omit?: SupplierItemMappingOmit<ExtArgs> | null
    /**
     * The data used to create many SupplierItemMappings.
     */
    data: SupplierItemMappingCreateManyInput | SupplierItemMappingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierItemMappingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SupplierItemMapping update
   */
  export type SupplierItemMappingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierItemMapping
     */
    select?: SupplierItemMappingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierItemMapping
     */
    omit?: SupplierItemMappingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierItemMappingInclude<ExtArgs> | null
    /**
     * The data needed to update a SupplierItemMapping.
     */
    data: XOR<SupplierItemMappingUpdateInput, SupplierItemMappingUncheckedUpdateInput>
    /**
     * Choose, which SupplierItemMapping to update.
     */
    where: SupplierItemMappingWhereUniqueInput
  }

  /**
   * SupplierItemMapping updateMany
   */
  export type SupplierItemMappingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SupplierItemMappings.
     */
    data: XOR<SupplierItemMappingUpdateManyMutationInput, SupplierItemMappingUncheckedUpdateManyInput>
    /**
     * Filter which SupplierItemMappings to update
     */
    where?: SupplierItemMappingWhereInput
    /**
     * Limit how many SupplierItemMappings to update.
     */
    limit?: number
  }

  /**
   * SupplierItemMapping updateManyAndReturn
   */
  export type SupplierItemMappingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierItemMapping
     */
    select?: SupplierItemMappingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierItemMapping
     */
    omit?: SupplierItemMappingOmit<ExtArgs> | null
    /**
     * The data used to update SupplierItemMappings.
     */
    data: XOR<SupplierItemMappingUpdateManyMutationInput, SupplierItemMappingUncheckedUpdateManyInput>
    /**
     * Filter which SupplierItemMappings to update
     */
    where?: SupplierItemMappingWhereInput
    /**
     * Limit how many SupplierItemMappings to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierItemMappingIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SupplierItemMapping upsert
   */
  export type SupplierItemMappingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierItemMapping
     */
    select?: SupplierItemMappingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierItemMapping
     */
    omit?: SupplierItemMappingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierItemMappingInclude<ExtArgs> | null
    /**
     * The filter to search for the SupplierItemMapping to update in case it exists.
     */
    where: SupplierItemMappingWhereUniqueInput
    /**
     * In case the SupplierItemMapping found by the `where` argument doesn't exist, create a new SupplierItemMapping with this data.
     */
    create: XOR<SupplierItemMappingCreateInput, SupplierItemMappingUncheckedCreateInput>
    /**
     * In case the SupplierItemMapping was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SupplierItemMappingUpdateInput, SupplierItemMappingUncheckedUpdateInput>
  }

  /**
   * SupplierItemMapping delete
   */
  export type SupplierItemMappingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierItemMapping
     */
    select?: SupplierItemMappingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierItemMapping
     */
    omit?: SupplierItemMappingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierItemMappingInclude<ExtArgs> | null
    /**
     * Filter which SupplierItemMapping to delete.
     */
    where: SupplierItemMappingWhereUniqueInput
  }

  /**
   * SupplierItemMapping deleteMany
   */
  export type SupplierItemMappingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SupplierItemMappings to delete
     */
    where?: SupplierItemMappingWhereInput
    /**
     * Limit how many SupplierItemMappings to delete.
     */
    limit?: number
  }

  /**
   * SupplierItemMapping without action
   */
  export type SupplierItemMappingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SupplierItemMapping
     */
    select?: SupplierItemMappingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SupplierItemMapping
     */
    omit?: SupplierItemMappingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SupplierItemMappingInclude<ExtArgs> | null
  }


  /**
   * Model AuditEvent
   */

  export type AggregateAuditEvent = {
    _count: AuditEventCountAggregateOutputType | null
    _min: AuditEventMinAggregateOutputType | null
    _max: AuditEventMaxAggregateOutputType | null
  }

  export type AuditEventMinAggregateOutputType = {
    id: string | null
    service: string | null
    module: string | null
    eventType: string | null
    occurredAt: Date | null
    result: string | null
    operatorId: string | null
    operatorType: string | null
    tenantId: string | null
    orgId: string | null
    traceId: string | null
    resourceType: string | null
    resourceId: string | null
    createdAt: Date | null
  }

  export type AuditEventMaxAggregateOutputType = {
    id: string | null
    service: string | null
    module: string | null
    eventType: string | null
    occurredAt: Date | null
    result: string | null
    operatorId: string | null
    operatorType: string | null
    tenantId: string | null
    orgId: string | null
    traceId: string | null
    resourceType: string | null
    resourceId: string | null
    createdAt: Date | null
  }

  export type AuditEventCountAggregateOutputType = {
    id: number
    service: number
    module: number
    eventType: number
    occurredAt: number
    result: number
    operatorId: number
    operatorType: number
    tenantId: number
    orgId: number
    traceId: number
    resourceType: number
    resourceId: number
    details: number
    createdAt: number
    _all: number
  }


  export type AuditEventMinAggregateInputType = {
    id?: true
    service?: true
    module?: true
    eventType?: true
    occurredAt?: true
    result?: true
    operatorId?: true
    operatorType?: true
    tenantId?: true
    orgId?: true
    traceId?: true
    resourceType?: true
    resourceId?: true
    createdAt?: true
  }

  export type AuditEventMaxAggregateInputType = {
    id?: true
    service?: true
    module?: true
    eventType?: true
    occurredAt?: true
    result?: true
    operatorId?: true
    operatorType?: true
    tenantId?: true
    orgId?: true
    traceId?: true
    resourceType?: true
    resourceId?: true
    createdAt?: true
  }

  export type AuditEventCountAggregateInputType = {
    id?: true
    service?: true
    module?: true
    eventType?: true
    occurredAt?: true
    result?: true
    operatorId?: true
    operatorType?: true
    tenantId?: true
    orgId?: true
    traceId?: true
    resourceType?: true
    resourceId?: true
    details?: true
    createdAt?: true
    _all?: true
  }

  export type AuditEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditEvent to aggregate.
     */
    where?: AuditEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditEvents to fetch.
     */
    orderBy?: AuditEventOrderByWithRelationInput | AuditEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AuditEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AuditEvents
    **/
    _count?: true | AuditEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AuditEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AuditEventMaxAggregateInputType
  }

  export type GetAuditEventAggregateType<T extends AuditEventAggregateArgs> = {
        [P in keyof T & keyof AggregateAuditEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAuditEvent[P]>
      : GetScalarType<T[P], AggregateAuditEvent[P]>
  }




  export type AuditEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AuditEventWhereInput
    orderBy?: AuditEventOrderByWithAggregationInput | AuditEventOrderByWithAggregationInput[]
    by: AuditEventScalarFieldEnum[] | AuditEventScalarFieldEnum
    having?: AuditEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AuditEventCountAggregateInputType | true
    _min?: AuditEventMinAggregateInputType
    _max?: AuditEventMaxAggregateInputType
  }

  export type AuditEventGroupByOutputType = {
    id: string
    service: string
    module: string
    eventType: string
    occurredAt: Date
    result: string
    operatorId: string | null
    operatorType: string
    tenantId: string | null
    orgId: string | null
    traceId: string | null
    resourceType: string
    resourceId: string | null
    details: JsonValue
    createdAt: Date
    _count: AuditEventCountAggregateOutputType | null
    _min: AuditEventMinAggregateOutputType | null
    _max: AuditEventMaxAggregateOutputType | null
  }

  type GetAuditEventGroupByPayload<T extends AuditEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AuditEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AuditEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AuditEventGroupByOutputType[P]>
            : GetScalarType<T[P], AuditEventGroupByOutputType[P]>
        }
      >
    >


  export type AuditEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    service?: boolean
    module?: boolean
    eventType?: boolean
    occurredAt?: boolean
    result?: boolean
    operatorId?: boolean
    operatorType?: boolean
    tenantId?: boolean
    orgId?: boolean
    traceId?: boolean
    resourceType?: boolean
    resourceId?: boolean
    details?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["auditEvent"]>

  export type AuditEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    service?: boolean
    module?: boolean
    eventType?: boolean
    occurredAt?: boolean
    result?: boolean
    operatorId?: boolean
    operatorType?: boolean
    tenantId?: boolean
    orgId?: boolean
    traceId?: boolean
    resourceType?: boolean
    resourceId?: boolean
    details?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["auditEvent"]>

  export type AuditEventSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    service?: boolean
    module?: boolean
    eventType?: boolean
    occurredAt?: boolean
    result?: boolean
    operatorId?: boolean
    operatorType?: boolean
    tenantId?: boolean
    orgId?: boolean
    traceId?: boolean
    resourceType?: boolean
    resourceId?: boolean
    details?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["auditEvent"]>

  export type AuditEventSelectScalar = {
    id?: boolean
    service?: boolean
    module?: boolean
    eventType?: boolean
    occurredAt?: boolean
    result?: boolean
    operatorId?: boolean
    operatorType?: boolean
    tenantId?: boolean
    orgId?: boolean
    traceId?: boolean
    resourceType?: boolean
    resourceId?: boolean
    details?: boolean
    createdAt?: boolean
  }

  export type AuditEventOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "service" | "module" | "eventType" | "occurredAt" | "result" | "operatorId" | "operatorType" | "tenantId" | "orgId" | "traceId" | "resourceType" | "resourceId" | "details" | "createdAt", ExtArgs["result"]["auditEvent"]>

  export type $AuditEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AuditEvent"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      service: string
      module: string
      eventType: string
      occurredAt: Date
      result: string
      operatorId: string | null
      operatorType: string
      tenantId: string | null
      orgId: string | null
      traceId: string | null
      resourceType: string
      resourceId: string | null
      details: Prisma.JsonValue
      createdAt: Date
    }, ExtArgs["result"]["auditEvent"]>
    composites: {}
  }

  type AuditEventGetPayload<S extends boolean | null | undefined | AuditEventDefaultArgs> = $Result.GetResult<Prisma.$AuditEventPayload, S>

  type AuditEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AuditEventFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AuditEventCountAggregateInputType | true
    }

  export interface AuditEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AuditEvent'], meta: { name: 'AuditEvent' } }
    /**
     * Find zero or one AuditEvent that matches the filter.
     * @param {AuditEventFindUniqueArgs} args - Arguments to find a AuditEvent
     * @example
     * // Get one AuditEvent
     * const auditEvent = await prisma.auditEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AuditEventFindUniqueArgs>(args: SelectSubset<T, AuditEventFindUniqueArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one AuditEvent that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AuditEventFindUniqueOrThrowArgs} args - Arguments to find a AuditEvent
     * @example
     * // Get one AuditEvent
     * const auditEvent = await prisma.auditEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AuditEventFindUniqueOrThrowArgs>(args: SelectSubset<T, AuditEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first AuditEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventFindFirstArgs} args - Arguments to find a AuditEvent
     * @example
     * // Get one AuditEvent
     * const auditEvent = await prisma.auditEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AuditEventFindFirstArgs>(args?: SelectSubset<T, AuditEventFindFirstArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first AuditEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventFindFirstOrThrowArgs} args - Arguments to find a AuditEvent
     * @example
     * // Get one AuditEvent
     * const auditEvent = await prisma.auditEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AuditEventFindFirstOrThrowArgs>(args?: SelectSubset<T, AuditEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more AuditEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AuditEvents
     * const auditEvents = await prisma.auditEvent.findMany()
     * 
     * // Get first 10 AuditEvents
     * const auditEvents = await prisma.auditEvent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const auditEventWithIdOnly = await prisma.auditEvent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AuditEventFindManyArgs>(args?: SelectSubset<T, AuditEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a AuditEvent.
     * @param {AuditEventCreateArgs} args - Arguments to create a AuditEvent.
     * @example
     * // Create one AuditEvent
     * const AuditEvent = await prisma.auditEvent.create({
     *   data: {
     *     // ... data to create a AuditEvent
     *   }
     * })
     * 
     */
    create<T extends AuditEventCreateArgs>(args: SelectSubset<T, AuditEventCreateArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many AuditEvents.
     * @param {AuditEventCreateManyArgs} args - Arguments to create many AuditEvents.
     * @example
     * // Create many AuditEvents
     * const auditEvent = await prisma.auditEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AuditEventCreateManyArgs>(args?: SelectSubset<T, AuditEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AuditEvents and returns the data saved in the database.
     * @param {AuditEventCreateManyAndReturnArgs} args - Arguments to create many AuditEvents.
     * @example
     * // Create many AuditEvents
     * const auditEvent = await prisma.auditEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AuditEvents and only return the `id`
     * const auditEventWithIdOnly = await prisma.auditEvent.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AuditEventCreateManyAndReturnArgs>(args?: SelectSubset<T, AuditEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a AuditEvent.
     * @param {AuditEventDeleteArgs} args - Arguments to delete one AuditEvent.
     * @example
     * // Delete one AuditEvent
     * const AuditEvent = await prisma.auditEvent.delete({
     *   where: {
     *     // ... filter to delete one AuditEvent
     *   }
     * })
     * 
     */
    delete<T extends AuditEventDeleteArgs>(args: SelectSubset<T, AuditEventDeleteArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one AuditEvent.
     * @param {AuditEventUpdateArgs} args - Arguments to update one AuditEvent.
     * @example
     * // Update one AuditEvent
     * const auditEvent = await prisma.auditEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AuditEventUpdateArgs>(args: SelectSubset<T, AuditEventUpdateArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more AuditEvents.
     * @param {AuditEventDeleteManyArgs} args - Arguments to filter AuditEvents to delete.
     * @example
     * // Delete a few AuditEvents
     * const { count } = await prisma.auditEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AuditEventDeleteManyArgs>(args?: SelectSubset<T, AuditEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AuditEvents
     * const auditEvent = await prisma.auditEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AuditEventUpdateManyArgs>(args: SelectSubset<T, AuditEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditEvents and returns the data updated in the database.
     * @param {AuditEventUpdateManyAndReturnArgs} args - Arguments to update many AuditEvents.
     * @example
     * // Update many AuditEvents
     * const auditEvent = await prisma.auditEvent.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AuditEvents and only return the `id`
     * const auditEventWithIdOnly = await prisma.auditEvent.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AuditEventUpdateManyAndReturnArgs>(args: SelectSubset<T, AuditEventUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one AuditEvent.
     * @param {AuditEventUpsertArgs} args - Arguments to update or create a AuditEvent.
     * @example
     * // Update or create a AuditEvent
     * const auditEvent = await prisma.auditEvent.upsert({
     *   create: {
     *     // ... data to create a AuditEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AuditEvent we want to update
     *   }
     * })
     */
    upsert<T extends AuditEventUpsertArgs>(args: SelectSubset<T, AuditEventUpsertArgs<ExtArgs>>): Prisma__AuditEventClient<$Result.GetResult<Prisma.$AuditEventPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of AuditEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventCountArgs} args - Arguments to filter AuditEvents to count.
     * @example
     * // Count the number of AuditEvents
     * const count = await prisma.auditEvent.count({
     *   where: {
     *     // ... the filter for the AuditEvents we want to count
     *   }
     * })
    **/
    count<T extends AuditEventCountArgs>(
      args?: Subset<T, AuditEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AuditEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AuditEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AuditEventAggregateArgs>(args: Subset<T, AuditEventAggregateArgs>): Prisma.PrismaPromise<GetAuditEventAggregateType<T>>

    /**
     * Group by AuditEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditEventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AuditEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AuditEventGroupByArgs['orderBy'] }
        : { orderBy?: AuditEventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AuditEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAuditEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AuditEvent model
   */
  readonly fields: AuditEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AuditEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AuditEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AuditEvent model
   */ 
  interface AuditEventFieldRefs {
    readonly id: FieldRef<"AuditEvent", 'String'>
    readonly service: FieldRef<"AuditEvent", 'String'>
    readonly module: FieldRef<"AuditEvent", 'String'>
    readonly eventType: FieldRef<"AuditEvent", 'String'>
    readonly occurredAt: FieldRef<"AuditEvent", 'DateTime'>
    readonly result: FieldRef<"AuditEvent", 'String'>
    readonly operatorId: FieldRef<"AuditEvent", 'String'>
    readonly operatorType: FieldRef<"AuditEvent", 'String'>
    readonly tenantId: FieldRef<"AuditEvent", 'String'>
    readonly orgId: FieldRef<"AuditEvent", 'String'>
    readonly traceId: FieldRef<"AuditEvent", 'String'>
    readonly resourceType: FieldRef<"AuditEvent", 'String'>
    readonly resourceId: FieldRef<"AuditEvent", 'String'>
    readonly details: FieldRef<"AuditEvent", 'Json'>
    readonly createdAt: FieldRef<"AuditEvent", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AuditEvent findUnique
   */
  export type AuditEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AuditEvent to fetch.
     */
    where: AuditEventWhereUniqueInput
  }

  /**
   * AuditEvent findUniqueOrThrow
   */
  export type AuditEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AuditEvent to fetch.
     */
    where: AuditEventWhereUniqueInput
  }

  /**
   * AuditEvent findFirst
   */
  export type AuditEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AuditEvent to fetch.
     */
    where?: AuditEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditEvents to fetch.
     */
    orderBy?: AuditEventOrderByWithRelationInput | AuditEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditEvents.
     */
    cursor?: AuditEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditEvents.
     */
    distinct?: AuditEventScalarFieldEnum | AuditEventScalarFieldEnum[]
  }

  /**
   * AuditEvent findFirstOrThrow
   */
  export type AuditEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AuditEvent to fetch.
     */
    where?: AuditEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditEvents to fetch.
     */
    orderBy?: AuditEventOrderByWithRelationInput | AuditEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditEvents.
     */
    cursor?: AuditEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditEvents.
     */
    distinct?: AuditEventScalarFieldEnum | AuditEventScalarFieldEnum[]
  }

  /**
   * AuditEvent findMany
   */
  export type AuditEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * Filter, which AuditEvents to fetch.
     */
    where?: AuditEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditEvents to fetch.
     */
    orderBy?: AuditEventOrderByWithRelationInput | AuditEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AuditEvents.
     */
    cursor?: AuditEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditEvents.
     */
    skip?: number
    distinct?: AuditEventScalarFieldEnum | AuditEventScalarFieldEnum[]
  }

  /**
   * AuditEvent create
   */
  export type AuditEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * The data needed to create a AuditEvent.
     */
    data: XOR<AuditEventCreateInput, AuditEventUncheckedCreateInput>
  }

  /**
   * AuditEvent createMany
   */
  export type AuditEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AuditEvents.
     */
    data: AuditEventCreateManyInput | AuditEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AuditEvent createManyAndReturn
   */
  export type AuditEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * The data used to create many AuditEvents.
     */
    data: AuditEventCreateManyInput | AuditEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AuditEvent update
   */
  export type AuditEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * The data needed to update a AuditEvent.
     */
    data: XOR<AuditEventUpdateInput, AuditEventUncheckedUpdateInput>
    /**
     * Choose, which AuditEvent to update.
     */
    where: AuditEventWhereUniqueInput
  }

  /**
   * AuditEvent updateMany
   */
  export type AuditEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AuditEvents.
     */
    data: XOR<AuditEventUpdateManyMutationInput, AuditEventUncheckedUpdateManyInput>
    /**
     * Filter which AuditEvents to update
     */
    where?: AuditEventWhereInput
    /**
     * Limit how many AuditEvents to update.
     */
    limit?: number
  }

  /**
   * AuditEvent updateManyAndReturn
   */
  export type AuditEventUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * The data used to update AuditEvents.
     */
    data: XOR<AuditEventUpdateManyMutationInput, AuditEventUncheckedUpdateManyInput>
    /**
     * Filter which AuditEvents to update
     */
    where?: AuditEventWhereInput
    /**
     * Limit how many AuditEvents to update.
     */
    limit?: number
  }

  /**
   * AuditEvent upsert
   */
  export type AuditEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * The filter to search for the AuditEvent to update in case it exists.
     */
    where: AuditEventWhereUniqueInput
    /**
     * In case the AuditEvent found by the `where` argument doesn't exist, create a new AuditEvent with this data.
     */
    create: XOR<AuditEventCreateInput, AuditEventUncheckedCreateInput>
    /**
     * In case the AuditEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AuditEventUpdateInput, AuditEventUncheckedUpdateInput>
  }

  /**
   * AuditEvent delete
   */
  export type AuditEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
    /**
     * Filter which AuditEvent to delete.
     */
    where: AuditEventWhereUniqueInput
  }

  /**
   * AuditEvent deleteMany
   */
  export type AuditEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditEvents to delete
     */
    where?: AuditEventWhereInput
    /**
     * Limit how many AuditEvents to delete.
     */
    limit?: number
  }

  /**
   * AuditEvent without action
   */
  export type AuditEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditEvent
     */
    select?: AuditEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditEvent
     */
    omit?: AuditEventOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ItemScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    itemCode: 'itemCode',
    itemName: 'itemName',
    structureType: 'structureType',
    natureType: 'natureType',
    status: 'status',
    primaryCategoryId: 'primaryCategoryId',
    sellable: 'sellable',
    purchasable: 'purchasable',
    stockable: 'stockable',
    manufacturable: 'manufacturable',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ItemScalarFieldEnum = (typeof ItemScalarFieldEnum)[keyof typeof ItemScalarFieldEnum]


  export const ItemCategoryScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    categoryCode: 'categoryCode',
    categoryName: 'categoryName',
    parentCategoryId: 'parentCategoryId',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ItemCategoryScalarFieldEnum = (typeof ItemCategoryScalarFieldEnum)[keyof typeof ItemCategoryScalarFieldEnum]


  export const ItemCompositionScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    parentItemId: 'parentItemId',
    componentItemId: 'componentItemId',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt'
  };

  export type ItemCompositionScalarFieldEnum = (typeof ItemCompositionScalarFieldEnum)[keyof typeof ItemCompositionScalarFieldEnum]


  export const SupplierItemMappingScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    supplierId: 'supplierId',
    supplierItemCode: 'supplierItemCode',
    supplierItemName: 'supplierItemName',
    supplierItemCodeKey: 'supplierItemCodeKey',
    supplierItemNameKey: 'supplierItemNameKey',
    itemId: 'itemId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SupplierItemMappingScalarFieldEnum = (typeof SupplierItemMappingScalarFieldEnum)[keyof typeof SupplierItemMappingScalarFieldEnum]


  export const AuditEventScalarFieldEnum: {
    id: 'id',
    service: 'service',
    module: 'module',
    eventType: 'eventType',
    occurredAt: 'occurredAt',
    result: 'result',
    operatorId: 'operatorId',
    operatorType: 'operatorType',
    tenantId: 'tenantId',
    orgId: 'orgId',
    traceId: 'traceId',
    resourceType: 'resourceType',
    resourceId: 'resourceId',
    details: 'details',
    createdAt: 'createdAt'
  };

  export type AuditEventScalarFieldEnum = (typeof AuditEventScalarFieldEnum)[keyof typeof AuditEventScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'ItemStructureType'
   */
  export type EnumItemStructureTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ItemStructureType'>
    


  /**
   * Reference to a field of type 'ItemStructureType[]'
   */
  export type ListEnumItemStructureTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ItemStructureType[]'>
    


  /**
   * Reference to a field of type 'ItemNatureType'
   */
  export type EnumItemNatureTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ItemNatureType'>
    


  /**
   * Reference to a field of type 'ItemNatureType[]'
   */
  export type ListEnumItemNatureTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ItemNatureType[]'>
    


  /**
   * Reference to a field of type 'ItemStatus'
   */
  export type EnumItemStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ItemStatus'>
    


  /**
   * Reference to a field of type 'ItemStatus[]'
   */
  export type ListEnumItemStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ItemStatus[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'ItemCategoryStatus'
   */
  export type EnumItemCategoryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ItemCategoryStatus'>
    


  /**
   * Reference to a field of type 'ItemCategoryStatus[]'
   */
  export type ListEnumItemCategoryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ItemCategoryStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type ItemWhereInput = {
    AND?: ItemWhereInput | ItemWhereInput[]
    OR?: ItemWhereInput[]
    NOT?: ItemWhereInput | ItemWhereInput[]
    id?: UuidFilter<"Item"> | string
    tenantId?: StringFilter<"Item"> | string
    itemCode?: StringFilter<"Item"> | string
    itemName?: StringFilter<"Item"> | string
    structureType?: EnumItemStructureTypeFilter<"Item"> | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFilter<"Item"> | $Enums.ItemNatureType
    status?: EnumItemStatusFilter<"Item"> | $Enums.ItemStatus
    primaryCategoryId?: UuidNullableFilter<"Item"> | string | null
    sellable?: BoolFilter<"Item"> | boolean
    purchasable?: BoolFilter<"Item"> | boolean
    stockable?: BoolFilter<"Item"> | boolean
    manufacturable?: BoolFilter<"Item"> | boolean
    createdAt?: DateTimeFilter<"Item"> | Date | string
    updatedAt?: DateTimeFilter<"Item"> | Date | string
    primaryCategory?: XOR<ItemCategoryNullableScalarRelationFilter, ItemCategoryWhereInput> | null
    parentLinks?: ItemCompositionListRelationFilter
    componentLinks?: ItemCompositionListRelationFilter
    supplierMappings?: SupplierItemMappingListRelationFilter
  }

  export type ItemOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    structureType?: SortOrder
    natureType?: SortOrder
    status?: SortOrder
    primaryCategoryId?: SortOrderInput | SortOrder
    sellable?: SortOrder
    purchasable?: SortOrder
    stockable?: SortOrder
    manufacturable?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    primaryCategory?: ItemCategoryOrderByWithRelationInput
    parentLinks?: ItemCompositionOrderByRelationAggregateInput
    componentLinks?: ItemCompositionOrderByRelationAggregateInput
    supplierMappings?: SupplierItemMappingOrderByRelationAggregateInput
  }

  export type ItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId_itemCode?: ItemTenantIdItemCodeCompoundUniqueInput
    AND?: ItemWhereInput | ItemWhereInput[]
    OR?: ItemWhereInput[]
    NOT?: ItemWhereInput | ItemWhereInput[]
    tenantId?: StringFilter<"Item"> | string
    itemCode?: StringFilter<"Item"> | string
    itemName?: StringFilter<"Item"> | string
    structureType?: EnumItemStructureTypeFilter<"Item"> | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFilter<"Item"> | $Enums.ItemNatureType
    status?: EnumItemStatusFilter<"Item"> | $Enums.ItemStatus
    primaryCategoryId?: UuidNullableFilter<"Item"> | string | null
    sellable?: BoolFilter<"Item"> | boolean
    purchasable?: BoolFilter<"Item"> | boolean
    stockable?: BoolFilter<"Item"> | boolean
    manufacturable?: BoolFilter<"Item"> | boolean
    createdAt?: DateTimeFilter<"Item"> | Date | string
    updatedAt?: DateTimeFilter<"Item"> | Date | string
    primaryCategory?: XOR<ItemCategoryNullableScalarRelationFilter, ItemCategoryWhereInput> | null
    parentLinks?: ItemCompositionListRelationFilter
    componentLinks?: ItemCompositionListRelationFilter
    supplierMappings?: SupplierItemMappingListRelationFilter
  }, "id" | "tenantId_itemCode">

  export type ItemOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    structureType?: SortOrder
    natureType?: SortOrder
    status?: SortOrder
    primaryCategoryId?: SortOrderInput | SortOrder
    sellable?: SortOrder
    purchasable?: SortOrder
    stockable?: SortOrder
    manufacturable?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ItemCountOrderByAggregateInput
    _max?: ItemMaxOrderByAggregateInput
    _min?: ItemMinOrderByAggregateInput
  }

  export type ItemScalarWhereWithAggregatesInput = {
    AND?: ItemScalarWhereWithAggregatesInput | ItemScalarWhereWithAggregatesInput[]
    OR?: ItemScalarWhereWithAggregatesInput[]
    NOT?: ItemScalarWhereWithAggregatesInput | ItemScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"Item"> | string
    tenantId?: StringWithAggregatesFilter<"Item"> | string
    itemCode?: StringWithAggregatesFilter<"Item"> | string
    itemName?: StringWithAggregatesFilter<"Item"> | string
    structureType?: EnumItemStructureTypeWithAggregatesFilter<"Item"> | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeWithAggregatesFilter<"Item"> | $Enums.ItemNatureType
    status?: EnumItemStatusWithAggregatesFilter<"Item"> | $Enums.ItemStatus
    primaryCategoryId?: UuidNullableWithAggregatesFilter<"Item"> | string | null
    sellable?: BoolWithAggregatesFilter<"Item"> | boolean
    purchasable?: BoolWithAggregatesFilter<"Item"> | boolean
    stockable?: BoolWithAggregatesFilter<"Item"> | boolean
    manufacturable?: BoolWithAggregatesFilter<"Item"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Item"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Item"> | Date | string
  }

  export type ItemCategoryWhereInput = {
    AND?: ItemCategoryWhereInput | ItemCategoryWhereInput[]
    OR?: ItemCategoryWhereInput[]
    NOT?: ItemCategoryWhereInput | ItemCategoryWhereInput[]
    id?: UuidFilter<"ItemCategory"> | string
    tenantId?: StringFilter<"ItemCategory"> | string
    categoryCode?: StringFilter<"ItemCategory"> | string
    categoryName?: StringFilter<"ItemCategory"> | string
    parentCategoryId?: UuidNullableFilter<"ItemCategory"> | string | null
    status?: EnumItemCategoryStatusFilter<"ItemCategory"> | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFilter<"ItemCategory"> | Date | string
    updatedAt?: DateTimeFilter<"ItemCategory"> | Date | string
    parent?: XOR<ItemCategoryNullableScalarRelationFilter, ItemCategoryWhereInput> | null
    children?: ItemCategoryListRelationFilter
    items?: ItemListRelationFilter
  }

  export type ItemCategoryOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    categoryCode?: SortOrder
    categoryName?: SortOrder
    parentCategoryId?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    parent?: ItemCategoryOrderByWithRelationInput
    children?: ItemCategoryOrderByRelationAggregateInput
    items?: ItemOrderByRelationAggregateInput
  }

  export type ItemCategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId_categoryCode?: ItemCategoryTenantIdCategoryCodeCompoundUniqueInput
    AND?: ItemCategoryWhereInput | ItemCategoryWhereInput[]
    OR?: ItemCategoryWhereInput[]
    NOT?: ItemCategoryWhereInput | ItemCategoryWhereInput[]
    tenantId?: StringFilter<"ItemCategory"> | string
    categoryCode?: StringFilter<"ItemCategory"> | string
    categoryName?: StringFilter<"ItemCategory"> | string
    parentCategoryId?: UuidNullableFilter<"ItemCategory"> | string | null
    status?: EnumItemCategoryStatusFilter<"ItemCategory"> | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFilter<"ItemCategory"> | Date | string
    updatedAt?: DateTimeFilter<"ItemCategory"> | Date | string
    parent?: XOR<ItemCategoryNullableScalarRelationFilter, ItemCategoryWhereInput> | null
    children?: ItemCategoryListRelationFilter
    items?: ItemListRelationFilter
  }, "id" | "tenantId_categoryCode">

  export type ItemCategoryOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    categoryCode?: SortOrder
    categoryName?: SortOrder
    parentCategoryId?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ItemCategoryCountOrderByAggregateInput
    _max?: ItemCategoryMaxOrderByAggregateInput
    _min?: ItemCategoryMinOrderByAggregateInput
  }

  export type ItemCategoryScalarWhereWithAggregatesInput = {
    AND?: ItemCategoryScalarWhereWithAggregatesInput | ItemCategoryScalarWhereWithAggregatesInput[]
    OR?: ItemCategoryScalarWhereWithAggregatesInput[]
    NOT?: ItemCategoryScalarWhereWithAggregatesInput | ItemCategoryScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"ItemCategory"> | string
    tenantId?: StringWithAggregatesFilter<"ItemCategory"> | string
    categoryCode?: StringWithAggregatesFilter<"ItemCategory"> | string
    categoryName?: StringWithAggregatesFilter<"ItemCategory"> | string
    parentCategoryId?: UuidNullableWithAggregatesFilter<"ItemCategory"> | string | null
    status?: EnumItemCategoryStatusWithAggregatesFilter<"ItemCategory"> | $Enums.ItemCategoryStatus
    createdAt?: DateTimeWithAggregatesFilter<"ItemCategory"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ItemCategory"> | Date | string
  }

  export type ItemCompositionWhereInput = {
    AND?: ItemCompositionWhereInput | ItemCompositionWhereInput[]
    OR?: ItemCompositionWhereInput[]
    NOT?: ItemCompositionWhereInput | ItemCompositionWhereInput[]
    id?: UuidFilter<"ItemComposition"> | string
    tenantId?: StringFilter<"ItemComposition"> | string
    parentItemId?: UuidFilter<"ItemComposition"> | string
    componentItemId?: UuidFilter<"ItemComposition"> | string
    sortOrder?: IntFilter<"ItemComposition"> | number
    createdAt?: DateTimeFilter<"ItemComposition"> | Date | string
    parentItem?: XOR<ItemScalarRelationFilter, ItemWhereInput>
    componentItem?: XOR<ItemScalarRelationFilter, ItemWhereInput>
  }

  export type ItemCompositionOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    parentItemId?: SortOrder
    componentItemId?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    parentItem?: ItemOrderByWithRelationInput
    componentItem?: ItemOrderByWithRelationInput
  }

  export type ItemCompositionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId_parentItemId_componentItemId?: ItemCompositionTenantIdParentItemIdComponentItemIdCompoundUniqueInput
    AND?: ItemCompositionWhereInput | ItemCompositionWhereInput[]
    OR?: ItemCompositionWhereInput[]
    NOT?: ItemCompositionWhereInput | ItemCompositionWhereInput[]
    tenantId?: StringFilter<"ItemComposition"> | string
    parentItemId?: UuidFilter<"ItemComposition"> | string
    componentItemId?: UuidFilter<"ItemComposition"> | string
    sortOrder?: IntFilter<"ItemComposition"> | number
    createdAt?: DateTimeFilter<"ItemComposition"> | Date | string
    parentItem?: XOR<ItemScalarRelationFilter, ItemWhereInput>
    componentItem?: XOR<ItemScalarRelationFilter, ItemWhereInput>
  }, "id" | "tenantId_parentItemId_componentItemId">

  export type ItemCompositionOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    parentItemId?: SortOrder
    componentItemId?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    _count?: ItemCompositionCountOrderByAggregateInput
    _avg?: ItemCompositionAvgOrderByAggregateInput
    _max?: ItemCompositionMaxOrderByAggregateInput
    _min?: ItemCompositionMinOrderByAggregateInput
    _sum?: ItemCompositionSumOrderByAggregateInput
  }

  export type ItemCompositionScalarWhereWithAggregatesInput = {
    AND?: ItemCompositionScalarWhereWithAggregatesInput | ItemCompositionScalarWhereWithAggregatesInput[]
    OR?: ItemCompositionScalarWhereWithAggregatesInput[]
    NOT?: ItemCompositionScalarWhereWithAggregatesInput | ItemCompositionScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"ItemComposition"> | string
    tenantId?: StringWithAggregatesFilter<"ItemComposition"> | string
    parentItemId?: UuidWithAggregatesFilter<"ItemComposition"> | string
    componentItemId?: UuidWithAggregatesFilter<"ItemComposition"> | string
    sortOrder?: IntWithAggregatesFilter<"ItemComposition"> | number
    createdAt?: DateTimeWithAggregatesFilter<"ItemComposition"> | Date | string
  }

  export type SupplierItemMappingWhereInput = {
    AND?: SupplierItemMappingWhereInput | SupplierItemMappingWhereInput[]
    OR?: SupplierItemMappingWhereInput[]
    NOT?: SupplierItemMappingWhereInput | SupplierItemMappingWhereInput[]
    id?: UuidFilter<"SupplierItemMapping"> | string
    tenantId?: StringFilter<"SupplierItemMapping"> | string
    supplierId?: StringFilter<"SupplierItemMapping"> | string
    supplierItemCode?: StringNullableFilter<"SupplierItemMapping"> | string | null
    supplierItemName?: StringNullableFilter<"SupplierItemMapping"> | string | null
    supplierItemCodeKey?: StringNullableFilter<"SupplierItemMapping"> | string | null
    supplierItemNameKey?: StringNullableFilter<"SupplierItemMapping"> | string | null
    itemId?: UuidFilter<"SupplierItemMapping"> | string
    createdAt?: DateTimeFilter<"SupplierItemMapping"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierItemMapping"> | Date | string
    item?: XOR<ItemScalarRelationFilter, ItemWhereInput>
  }

  export type SupplierItemMappingOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    supplierItemCode?: SortOrderInput | SortOrder
    supplierItemName?: SortOrderInput | SortOrder
    supplierItemCodeKey?: SortOrderInput | SortOrder
    supplierItemNameKey?: SortOrderInput | SortOrder
    itemId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    item?: ItemOrderByWithRelationInput
  }

  export type SupplierItemMappingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenantId_supplierId_supplierItemCodeKey?: SupplierItemMappingTenantIdSupplierIdSupplierItemCodeKeyCompoundUniqueInput
    tenantId_supplierId_supplierItemNameKey?: SupplierItemMappingTenantIdSupplierIdSupplierItemNameKeyCompoundUniqueInput
    AND?: SupplierItemMappingWhereInput | SupplierItemMappingWhereInput[]
    OR?: SupplierItemMappingWhereInput[]
    NOT?: SupplierItemMappingWhereInput | SupplierItemMappingWhereInput[]
    tenantId?: StringFilter<"SupplierItemMapping"> | string
    supplierId?: StringFilter<"SupplierItemMapping"> | string
    supplierItemCode?: StringNullableFilter<"SupplierItemMapping"> | string | null
    supplierItemName?: StringNullableFilter<"SupplierItemMapping"> | string | null
    supplierItemCodeKey?: StringNullableFilter<"SupplierItemMapping"> | string | null
    supplierItemNameKey?: StringNullableFilter<"SupplierItemMapping"> | string | null
    itemId?: UuidFilter<"SupplierItemMapping"> | string
    createdAt?: DateTimeFilter<"SupplierItemMapping"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierItemMapping"> | Date | string
    item?: XOR<ItemScalarRelationFilter, ItemWhereInput>
  }, "id" | "tenantId_supplierId_supplierItemCodeKey" | "tenantId_supplierId_supplierItemNameKey">

  export type SupplierItemMappingOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    supplierItemCode?: SortOrderInput | SortOrder
    supplierItemName?: SortOrderInput | SortOrder
    supplierItemCodeKey?: SortOrderInput | SortOrder
    supplierItemNameKey?: SortOrderInput | SortOrder
    itemId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SupplierItemMappingCountOrderByAggregateInput
    _max?: SupplierItemMappingMaxOrderByAggregateInput
    _min?: SupplierItemMappingMinOrderByAggregateInput
  }

  export type SupplierItemMappingScalarWhereWithAggregatesInput = {
    AND?: SupplierItemMappingScalarWhereWithAggregatesInput | SupplierItemMappingScalarWhereWithAggregatesInput[]
    OR?: SupplierItemMappingScalarWhereWithAggregatesInput[]
    NOT?: SupplierItemMappingScalarWhereWithAggregatesInput | SupplierItemMappingScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"SupplierItemMapping"> | string
    tenantId?: StringWithAggregatesFilter<"SupplierItemMapping"> | string
    supplierId?: StringWithAggregatesFilter<"SupplierItemMapping"> | string
    supplierItemCode?: StringNullableWithAggregatesFilter<"SupplierItemMapping"> | string | null
    supplierItemName?: StringNullableWithAggregatesFilter<"SupplierItemMapping"> | string | null
    supplierItemCodeKey?: StringNullableWithAggregatesFilter<"SupplierItemMapping"> | string | null
    supplierItemNameKey?: StringNullableWithAggregatesFilter<"SupplierItemMapping"> | string | null
    itemId?: UuidWithAggregatesFilter<"SupplierItemMapping"> | string
    createdAt?: DateTimeWithAggregatesFilter<"SupplierItemMapping"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"SupplierItemMapping"> | Date | string
  }

  export type AuditEventWhereInput = {
    AND?: AuditEventWhereInput | AuditEventWhereInput[]
    OR?: AuditEventWhereInput[]
    NOT?: AuditEventWhereInput | AuditEventWhereInput[]
    id?: StringFilter<"AuditEvent"> | string
    service?: StringFilter<"AuditEvent"> | string
    module?: StringFilter<"AuditEvent"> | string
    eventType?: StringFilter<"AuditEvent"> | string
    occurredAt?: DateTimeFilter<"AuditEvent"> | Date | string
    result?: StringFilter<"AuditEvent"> | string
    operatorId?: StringNullableFilter<"AuditEvent"> | string | null
    operatorType?: StringFilter<"AuditEvent"> | string
    tenantId?: StringNullableFilter<"AuditEvent"> | string | null
    orgId?: StringNullableFilter<"AuditEvent"> | string | null
    traceId?: StringNullableFilter<"AuditEvent"> | string | null
    resourceType?: StringFilter<"AuditEvent"> | string
    resourceId?: StringNullableFilter<"AuditEvent"> | string | null
    details?: JsonFilter<"AuditEvent">
    createdAt?: DateTimeFilter<"AuditEvent"> | Date | string
  }

  export type AuditEventOrderByWithRelationInput = {
    id?: SortOrder
    service?: SortOrder
    module?: SortOrder
    eventType?: SortOrder
    occurredAt?: SortOrder
    result?: SortOrder
    operatorId?: SortOrderInput | SortOrder
    operatorType?: SortOrder
    tenantId?: SortOrderInput | SortOrder
    orgId?: SortOrderInput | SortOrder
    traceId?: SortOrderInput | SortOrder
    resourceType?: SortOrder
    resourceId?: SortOrderInput | SortOrder
    details?: SortOrder
    createdAt?: SortOrder
  }

  export type AuditEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AuditEventWhereInput | AuditEventWhereInput[]
    OR?: AuditEventWhereInput[]
    NOT?: AuditEventWhereInput | AuditEventWhereInput[]
    service?: StringFilter<"AuditEvent"> | string
    module?: StringFilter<"AuditEvent"> | string
    eventType?: StringFilter<"AuditEvent"> | string
    occurredAt?: DateTimeFilter<"AuditEvent"> | Date | string
    result?: StringFilter<"AuditEvent"> | string
    operatorId?: StringNullableFilter<"AuditEvent"> | string | null
    operatorType?: StringFilter<"AuditEvent"> | string
    tenantId?: StringNullableFilter<"AuditEvent"> | string | null
    orgId?: StringNullableFilter<"AuditEvent"> | string | null
    traceId?: StringNullableFilter<"AuditEvent"> | string | null
    resourceType?: StringFilter<"AuditEvent"> | string
    resourceId?: StringNullableFilter<"AuditEvent"> | string | null
    details?: JsonFilter<"AuditEvent">
    createdAt?: DateTimeFilter<"AuditEvent"> | Date | string
  }, "id">

  export type AuditEventOrderByWithAggregationInput = {
    id?: SortOrder
    service?: SortOrder
    module?: SortOrder
    eventType?: SortOrder
    occurredAt?: SortOrder
    result?: SortOrder
    operatorId?: SortOrderInput | SortOrder
    operatorType?: SortOrder
    tenantId?: SortOrderInput | SortOrder
    orgId?: SortOrderInput | SortOrder
    traceId?: SortOrderInput | SortOrder
    resourceType?: SortOrder
    resourceId?: SortOrderInput | SortOrder
    details?: SortOrder
    createdAt?: SortOrder
    _count?: AuditEventCountOrderByAggregateInput
    _max?: AuditEventMaxOrderByAggregateInput
    _min?: AuditEventMinOrderByAggregateInput
  }

  export type AuditEventScalarWhereWithAggregatesInput = {
    AND?: AuditEventScalarWhereWithAggregatesInput | AuditEventScalarWhereWithAggregatesInput[]
    OR?: AuditEventScalarWhereWithAggregatesInput[]
    NOT?: AuditEventScalarWhereWithAggregatesInput | AuditEventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AuditEvent"> | string
    service?: StringWithAggregatesFilter<"AuditEvent"> | string
    module?: StringWithAggregatesFilter<"AuditEvent"> | string
    eventType?: StringWithAggregatesFilter<"AuditEvent"> | string
    occurredAt?: DateTimeWithAggregatesFilter<"AuditEvent"> | Date | string
    result?: StringWithAggregatesFilter<"AuditEvent"> | string
    operatorId?: StringNullableWithAggregatesFilter<"AuditEvent"> | string | null
    operatorType?: StringWithAggregatesFilter<"AuditEvent"> | string
    tenantId?: StringNullableWithAggregatesFilter<"AuditEvent"> | string | null
    orgId?: StringNullableWithAggregatesFilter<"AuditEvent"> | string | null
    traceId?: StringNullableWithAggregatesFilter<"AuditEvent"> | string | null
    resourceType?: StringWithAggregatesFilter<"AuditEvent"> | string
    resourceId?: StringNullableWithAggregatesFilter<"AuditEvent"> | string | null
    details?: JsonWithAggregatesFilter<"AuditEvent">
    createdAt?: DateTimeWithAggregatesFilter<"AuditEvent"> | Date | string
  }

  export type ItemCreateInput = {
    id?: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: $Enums.ItemStructureType
    natureType: $Enums.ItemNatureType
    status?: $Enums.ItemStatus
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    primaryCategory?: ItemCategoryCreateNestedOneWithoutItemsInput
    parentLinks?: ItemCompositionCreateNestedManyWithoutParentItemInput
    componentLinks?: ItemCompositionCreateNestedManyWithoutComponentItemInput
    supplierMappings?: SupplierItemMappingCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateInput = {
    id?: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: $Enums.ItemStructureType
    natureType: $Enums.ItemNatureType
    status?: $Enums.ItemStatus
    primaryCategoryId?: string | null
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    parentLinks?: ItemCompositionUncheckedCreateNestedManyWithoutParentItemInput
    componentLinks?: ItemCompositionUncheckedCreateNestedManyWithoutComponentItemInput
    supplierMappings?: SupplierItemMappingUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    structureType?: EnumItemStructureTypeFieldUpdateOperationsInput | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFieldUpdateOperationsInput | $Enums.ItemNatureType
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    sellable?: BoolFieldUpdateOperationsInput | boolean
    purchasable?: BoolFieldUpdateOperationsInput | boolean
    stockable?: BoolFieldUpdateOperationsInput | boolean
    manufacturable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    primaryCategory?: ItemCategoryUpdateOneWithoutItemsNestedInput
    parentLinks?: ItemCompositionUpdateManyWithoutParentItemNestedInput
    componentLinks?: ItemCompositionUpdateManyWithoutComponentItemNestedInput
    supplierMappings?: SupplierItemMappingUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    structureType?: EnumItemStructureTypeFieldUpdateOperationsInput | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFieldUpdateOperationsInput | $Enums.ItemNatureType
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    primaryCategoryId?: NullableStringFieldUpdateOperationsInput | string | null
    sellable?: BoolFieldUpdateOperationsInput | boolean
    purchasable?: BoolFieldUpdateOperationsInput | boolean
    stockable?: BoolFieldUpdateOperationsInput | boolean
    manufacturable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parentLinks?: ItemCompositionUncheckedUpdateManyWithoutParentItemNestedInput
    componentLinks?: ItemCompositionUncheckedUpdateManyWithoutComponentItemNestedInput
    supplierMappings?: SupplierItemMappingUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemCreateManyInput = {
    id?: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: $Enums.ItemStructureType
    natureType: $Enums.ItemNatureType
    status?: $Enums.ItemStatus
    primaryCategoryId?: string | null
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    structureType?: EnumItemStructureTypeFieldUpdateOperationsInput | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFieldUpdateOperationsInput | $Enums.ItemNatureType
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    sellable?: BoolFieldUpdateOperationsInput | boolean
    purchasable?: BoolFieldUpdateOperationsInput | boolean
    stockable?: BoolFieldUpdateOperationsInput | boolean
    manufacturable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    structureType?: EnumItemStructureTypeFieldUpdateOperationsInput | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFieldUpdateOperationsInput | $Enums.ItemNatureType
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    primaryCategoryId?: NullableStringFieldUpdateOperationsInput | string | null
    sellable?: BoolFieldUpdateOperationsInput | boolean
    purchasable?: BoolFieldUpdateOperationsInput | boolean
    stockable?: BoolFieldUpdateOperationsInput | boolean
    manufacturable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCategoryCreateInput = {
    id?: string
    tenantId: string
    categoryCode: string
    categoryName: string
    status?: $Enums.ItemCategoryStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    parent?: ItemCategoryCreateNestedOneWithoutChildrenInput
    children?: ItemCategoryCreateNestedManyWithoutParentInput
    items?: ItemCreateNestedManyWithoutPrimaryCategoryInput
  }

  export type ItemCategoryUncheckedCreateInput = {
    id?: string
    tenantId: string
    categoryCode: string
    categoryName: string
    parentCategoryId?: string | null
    status?: $Enums.ItemCategoryStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ItemCategoryUncheckedCreateNestedManyWithoutParentInput
    items?: ItemUncheckedCreateNestedManyWithoutPrimaryCategoryInput
  }

  export type ItemCategoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    categoryCode?: StringFieldUpdateOperationsInput | string
    categoryName?: StringFieldUpdateOperationsInput | string
    status?: EnumItemCategoryStatusFieldUpdateOperationsInput | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parent?: ItemCategoryUpdateOneWithoutChildrenNestedInput
    children?: ItemCategoryUpdateManyWithoutParentNestedInput
    items?: ItemUpdateManyWithoutPrimaryCategoryNestedInput
  }

  export type ItemCategoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    categoryCode?: StringFieldUpdateOperationsInput | string
    categoryName?: StringFieldUpdateOperationsInput | string
    parentCategoryId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumItemCategoryStatusFieldUpdateOperationsInput | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ItemCategoryUncheckedUpdateManyWithoutParentNestedInput
    items?: ItemUncheckedUpdateManyWithoutPrimaryCategoryNestedInput
  }

  export type ItemCategoryCreateManyInput = {
    id?: string
    tenantId: string
    categoryCode: string
    categoryName: string
    parentCategoryId?: string | null
    status?: $Enums.ItemCategoryStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ItemCategoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    categoryCode?: StringFieldUpdateOperationsInput | string
    categoryName?: StringFieldUpdateOperationsInput | string
    status?: EnumItemCategoryStatusFieldUpdateOperationsInput | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCategoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    categoryCode?: StringFieldUpdateOperationsInput | string
    categoryName?: StringFieldUpdateOperationsInput | string
    parentCategoryId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumItemCategoryStatusFieldUpdateOperationsInput | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCompositionCreateInput = {
    id?: string
    tenantId: string
    sortOrder: number
    createdAt?: Date | string
    parentItem: ItemCreateNestedOneWithoutParentLinksInput
    componentItem: ItemCreateNestedOneWithoutComponentLinksInput
  }

  export type ItemCompositionUncheckedCreateInput = {
    id?: string
    tenantId: string
    parentItemId: string
    componentItemId: string
    sortOrder: number
    createdAt?: Date | string
  }

  export type ItemCompositionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parentItem?: ItemUpdateOneRequiredWithoutParentLinksNestedInput
    componentItem?: ItemUpdateOneRequiredWithoutComponentLinksNestedInput
  }

  export type ItemCompositionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    parentItemId?: StringFieldUpdateOperationsInput | string
    componentItemId?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCompositionCreateManyInput = {
    id?: string
    tenantId: string
    parentItemId: string
    componentItemId: string
    sortOrder: number
    createdAt?: Date | string
  }

  export type ItemCompositionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCompositionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    parentItemId?: StringFieldUpdateOperationsInput | string
    componentItemId?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierItemMappingCreateInput = {
    id?: string
    tenantId: string
    supplierId: string
    supplierItemCode?: string | null
    supplierItemName?: string | null
    supplierItemCodeKey?: string | null
    supplierItemNameKey?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    item: ItemCreateNestedOneWithoutSupplierMappingsInput
  }

  export type SupplierItemMappingUncheckedCreateInput = {
    id?: string
    tenantId: string
    supplierId: string
    supplierItemCode?: string | null
    supplierItemName?: string | null
    supplierItemCodeKey?: string | null
    supplierItemNameKey?: string | null
    itemId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierItemMappingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierItemCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemName?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemCodeKey?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemNameKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    item?: ItemUpdateOneRequiredWithoutSupplierMappingsNestedInput
  }

  export type SupplierItemMappingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierItemCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemName?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemCodeKey?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemNameKey?: NullableStringFieldUpdateOperationsInput | string | null
    itemId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierItemMappingCreateManyInput = {
    id?: string
    tenantId: string
    supplierId: string
    supplierItemCode?: string | null
    supplierItemName?: string | null
    supplierItemCodeKey?: string | null
    supplierItemNameKey?: string | null
    itemId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierItemMappingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierItemCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemName?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemCodeKey?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemNameKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierItemMappingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierItemCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemName?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemCodeKey?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemNameKey?: NullableStringFieldUpdateOperationsInput | string | null
    itemId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditEventCreateInput = {
    id: string
    service: string
    module: string
    eventType: string
    occurredAt: Date | string
    result: string
    operatorId?: string | null
    operatorType: string
    tenantId?: string | null
    orgId?: string | null
    traceId?: string | null
    resourceType: string
    resourceId?: string | null
    details: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type AuditEventUncheckedCreateInput = {
    id: string
    service: string
    module: string
    eventType: string
    occurredAt: Date | string
    result: string
    operatorId?: string | null
    operatorType: string
    tenantId?: string | null
    orgId?: string | null
    traceId?: string | null
    resourceType: string
    resourceId?: string | null
    details: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type AuditEventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    module?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    result?: StringFieldUpdateOperationsInput | string
    operatorId?: NullableStringFieldUpdateOperationsInput | string | null
    operatorType?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    resourceType?: StringFieldUpdateOperationsInput | string
    resourceId?: NullableStringFieldUpdateOperationsInput | string | null
    details?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditEventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    module?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    result?: StringFieldUpdateOperationsInput | string
    operatorId?: NullableStringFieldUpdateOperationsInput | string | null
    operatorType?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    resourceType?: StringFieldUpdateOperationsInput | string
    resourceId?: NullableStringFieldUpdateOperationsInput | string | null
    details?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditEventCreateManyInput = {
    id: string
    service: string
    module: string
    eventType: string
    occurredAt: Date | string
    result: string
    operatorId?: string | null
    operatorType: string
    tenantId?: string | null
    orgId?: string | null
    traceId?: string | null
    resourceType: string
    resourceId?: string | null
    details: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type AuditEventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    module?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    result?: StringFieldUpdateOperationsInput | string
    operatorId?: NullableStringFieldUpdateOperationsInput | string | null
    operatorType?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    resourceType?: StringFieldUpdateOperationsInput | string
    resourceId?: NullableStringFieldUpdateOperationsInput | string | null
    details?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditEventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    module?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    result?: StringFieldUpdateOperationsInput | string
    operatorId?: NullableStringFieldUpdateOperationsInput | string | null
    operatorType?: StringFieldUpdateOperationsInput | string
    tenantId?: NullableStringFieldUpdateOperationsInput | string | null
    orgId?: NullableStringFieldUpdateOperationsInput | string | null
    traceId?: NullableStringFieldUpdateOperationsInput | string | null
    resourceType?: StringFieldUpdateOperationsInput | string
    resourceId?: NullableStringFieldUpdateOperationsInput | string | null
    details?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumItemStructureTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemStructureType | EnumItemStructureTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ItemStructureType[] | ListEnumItemStructureTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemStructureType[] | ListEnumItemStructureTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumItemStructureTypeFilter<$PrismaModel> | $Enums.ItemStructureType
  }

  export type EnumItemNatureTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemNatureType | EnumItemNatureTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ItemNatureType[] | ListEnumItemNatureTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemNatureType[] | ListEnumItemNatureTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumItemNatureTypeFilter<$PrismaModel> | $Enums.ItemNatureType
  }

  export type EnumItemStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemStatus | EnumItemStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumItemStatusFilter<$PrismaModel> | $Enums.ItemStatus
  }

  export type UuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ItemCategoryNullableScalarRelationFilter = {
    is?: ItemCategoryWhereInput | null
    isNot?: ItemCategoryWhereInput | null
  }

  export type ItemCompositionListRelationFilter = {
    every?: ItemCompositionWhereInput
    some?: ItemCompositionWhereInput
    none?: ItemCompositionWhereInput
  }

  export type SupplierItemMappingListRelationFilter = {
    every?: SupplierItemMappingWhereInput
    some?: SupplierItemMappingWhereInput
    none?: SupplierItemMappingWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ItemCompositionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SupplierItemMappingOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ItemTenantIdItemCodeCompoundUniqueInput = {
    tenantId: string
    itemCode: string
  }

  export type ItemCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    structureType?: SortOrder
    natureType?: SortOrder
    status?: SortOrder
    primaryCategoryId?: SortOrder
    sellable?: SortOrder
    purchasable?: SortOrder
    stockable?: SortOrder
    manufacturable?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ItemMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    structureType?: SortOrder
    natureType?: SortOrder
    status?: SortOrder
    primaryCategoryId?: SortOrder
    sellable?: SortOrder
    purchasable?: SortOrder
    stockable?: SortOrder
    manufacturable?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ItemMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    itemCode?: SortOrder
    itemName?: SortOrder
    structureType?: SortOrder
    natureType?: SortOrder
    status?: SortOrder
    primaryCategoryId?: SortOrder
    sellable?: SortOrder
    purchasable?: SortOrder
    stockable?: SortOrder
    manufacturable?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumItemStructureTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemStructureType | EnumItemStructureTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ItemStructureType[] | ListEnumItemStructureTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemStructureType[] | ListEnumItemStructureTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumItemStructureTypeWithAggregatesFilter<$PrismaModel> | $Enums.ItemStructureType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumItemStructureTypeFilter<$PrismaModel>
    _max?: NestedEnumItemStructureTypeFilter<$PrismaModel>
  }

  export type EnumItemNatureTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemNatureType | EnumItemNatureTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ItemNatureType[] | ListEnumItemNatureTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemNatureType[] | ListEnumItemNatureTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumItemNatureTypeWithAggregatesFilter<$PrismaModel> | $Enums.ItemNatureType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumItemNatureTypeFilter<$PrismaModel>
    _max?: NestedEnumItemNatureTypeFilter<$PrismaModel>
  }

  export type EnumItemStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemStatus | EnumItemStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumItemStatusWithAggregatesFilter<$PrismaModel> | $Enums.ItemStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumItemStatusFilter<$PrismaModel>
    _max?: NestedEnumItemStatusFilter<$PrismaModel>
  }

  export type UuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumItemCategoryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemCategoryStatus | EnumItemCategoryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ItemCategoryStatus[] | ListEnumItemCategoryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemCategoryStatus[] | ListEnumItemCategoryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumItemCategoryStatusFilter<$PrismaModel> | $Enums.ItemCategoryStatus
  }

  export type ItemCategoryListRelationFilter = {
    every?: ItemCategoryWhereInput
    some?: ItemCategoryWhereInput
    none?: ItemCategoryWhereInput
  }

  export type ItemListRelationFilter = {
    every?: ItemWhereInput
    some?: ItemWhereInput
    none?: ItemWhereInput
  }

  export type ItemCategoryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ItemCategoryTenantIdCategoryCodeCompoundUniqueInput = {
    tenantId: string
    categoryCode: string
  }

  export type ItemCategoryCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    categoryCode?: SortOrder
    categoryName?: SortOrder
    parentCategoryId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ItemCategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    categoryCode?: SortOrder
    categoryName?: SortOrder
    parentCategoryId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ItemCategoryMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    categoryCode?: SortOrder
    categoryName?: SortOrder
    parentCategoryId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumItemCategoryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemCategoryStatus | EnumItemCategoryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ItemCategoryStatus[] | ListEnumItemCategoryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemCategoryStatus[] | ListEnumItemCategoryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumItemCategoryStatusWithAggregatesFilter<$PrismaModel> | $Enums.ItemCategoryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumItemCategoryStatusFilter<$PrismaModel>
    _max?: NestedEnumItemCategoryStatusFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type ItemScalarRelationFilter = {
    is?: ItemWhereInput
    isNot?: ItemWhereInput
  }

  export type ItemCompositionTenantIdParentItemIdComponentItemIdCompoundUniqueInput = {
    tenantId: string
    parentItemId: string
    componentItemId: string
  }

  export type ItemCompositionCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    parentItemId?: SortOrder
    componentItemId?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
  }

  export type ItemCompositionAvgOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type ItemCompositionMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    parentItemId?: SortOrder
    componentItemId?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
  }

  export type ItemCompositionMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    parentItemId?: SortOrder
    componentItemId?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
  }

  export type ItemCompositionSumOrderByAggregateInput = {
    sortOrder?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type SupplierItemMappingTenantIdSupplierIdSupplierItemCodeKeyCompoundUniqueInput = {
    tenantId: string
    supplierId: string
    supplierItemCodeKey: string
  }

  export type SupplierItemMappingTenantIdSupplierIdSupplierItemNameKeyCompoundUniqueInput = {
    tenantId: string
    supplierId: string
    supplierItemNameKey: string
  }

  export type SupplierItemMappingCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    supplierItemCode?: SortOrder
    supplierItemName?: SortOrder
    supplierItemCodeKey?: SortOrder
    supplierItemNameKey?: SortOrder
    itemId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupplierItemMappingMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    supplierItemCode?: SortOrder
    supplierItemName?: SortOrder
    supplierItemCodeKey?: SortOrder
    supplierItemNameKey?: SortOrder
    itemId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SupplierItemMappingMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    supplierId?: SortOrder
    supplierItemCode?: SortOrder
    supplierItemName?: SortOrder
    supplierItemCodeKey?: SortOrder
    supplierItemNameKey?: SortOrder
    itemId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type AuditEventCountOrderByAggregateInput = {
    id?: SortOrder
    service?: SortOrder
    module?: SortOrder
    eventType?: SortOrder
    occurredAt?: SortOrder
    result?: SortOrder
    operatorId?: SortOrder
    operatorType?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    traceId?: SortOrder
    resourceType?: SortOrder
    resourceId?: SortOrder
    details?: SortOrder
    createdAt?: SortOrder
  }

  export type AuditEventMaxOrderByAggregateInput = {
    id?: SortOrder
    service?: SortOrder
    module?: SortOrder
    eventType?: SortOrder
    occurredAt?: SortOrder
    result?: SortOrder
    operatorId?: SortOrder
    operatorType?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    traceId?: SortOrder
    resourceType?: SortOrder
    resourceId?: SortOrder
    createdAt?: SortOrder
  }

  export type AuditEventMinOrderByAggregateInput = {
    id?: SortOrder
    service?: SortOrder
    module?: SortOrder
    eventType?: SortOrder
    occurredAt?: SortOrder
    result?: SortOrder
    operatorId?: SortOrder
    operatorType?: SortOrder
    tenantId?: SortOrder
    orgId?: SortOrder
    traceId?: SortOrder
    resourceType?: SortOrder
    resourceId?: SortOrder
    createdAt?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type ItemCategoryCreateNestedOneWithoutItemsInput = {
    create?: XOR<ItemCategoryCreateWithoutItemsInput, ItemCategoryUncheckedCreateWithoutItemsInput>
    connectOrCreate?: ItemCategoryCreateOrConnectWithoutItemsInput
    connect?: ItemCategoryWhereUniqueInput
  }

  export type ItemCompositionCreateNestedManyWithoutParentItemInput = {
    create?: XOR<ItemCompositionCreateWithoutParentItemInput, ItemCompositionUncheckedCreateWithoutParentItemInput> | ItemCompositionCreateWithoutParentItemInput[] | ItemCompositionUncheckedCreateWithoutParentItemInput[]
    connectOrCreate?: ItemCompositionCreateOrConnectWithoutParentItemInput | ItemCompositionCreateOrConnectWithoutParentItemInput[]
    createMany?: ItemCompositionCreateManyParentItemInputEnvelope
    connect?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
  }

  export type ItemCompositionCreateNestedManyWithoutComponentItemInput = {
    create?: XOR<ItemCompositionCreateWithoutComponentItemInput, ItemCompositionUncheckedCreateWithoutComponentItemInput> | ItemCompositionCreateWithoutComponentItemInput[] | ItemCompositionUncheckedCreateWithoutComponentItemInput[]
    connectOrCreate?: ItemCompositionCreateOrConnectWithoutComponentItemInput | ItemCompositionCreateOrConnectWithoutComponentItemInput[]
    createMany?: ItemCompositionCreateManyComponentItemInputEnvelope
    connect?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
  }

  export type SupplierItemMappingCreateNestedManyWithoutItemInput = {
    create?: XOR<SupplierItemMappingCreateWithoutItemInput, SupplierItemMappingUncheckedCreateWithoutItemInput> | SupplierItemMappingCreateWithoutItemInput[] | SupplierItemMappingUncheckedCreateWithoutItemInput[]
    connectOrCreate?: SupplierItemMappingCreateOrConnectWithoutItemInput | SupplierItemMappingCreateOrConnectWithoutItemInput[]
    createMany?: SupplierItemMappingCreateManyItemInputEnvelope
    connect?: SupplierItemMappingWhereUniqueInput | SupplierItemMappingWhereUniqueInput[]
  }

  export type ItemCompositionUncheckedCreateNestedManyWithoutParentItemInput = {
    create?: XOR<ItemCompositionCreateWithoutParentItemInput, ItemCompositionUncheckedCreateWithoutParentItemInput> | ItemCompositionCreateWithoutParentItemInput[] | ItemCompositionUncheckedCreateWithoutParentItemInput[]
    connectOrCreate?: ItemCompositionCreateOrConnectWithoutParentItemInput | ItemCompositionCreateOrConnectWithoutParentItemInput[]
    createMany?: ItemCompositionCreateManyParentItemInputEnvelope
    connect?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
  }

  export type ItemCompositionUncheckedCreateNestedManyWithoutComponentItemInput = {
    create?: XOR<ItemCompositionCreateWithoutComponentItemInput, ItemCompositionUncheckedCreateWithoutComponentItemInput> | ItemCompositionCreateWithoutComponentItemInput[] | ItemCompositionUncheckedCreateWithoutComponentItemInput[]
    connectOrCreate?: ItemCompositionCreateOrConnectWithoutComponentItemInput | ItemCompositionCreateOrConnectWithoutComponentItemInput[]
    createMany?: ItemCompositionCreateManyComponentItemInputEnvelope
    connect?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
  }

  export type SupplierItemMappingUncheckedCreateNestedManyWithoutItemInput = {
    create?: XOR<SupplierItemMappingCreateWithoutItemInput, SupplierItemMappingUncheckedCreateWithoutItemInput> | SupplierItemMappingCreateWithoutItemInput[] | SupplierItemMappingUncheckedCreateWithoutItemInput[]
    connectOrCreate?: SupplierItemMappingCreateOrConnectWithoutItemInput | SupplierItemMappingCreateOrConnectWithoutItemInput[]
    createMany?: SupplierItemMappingCreateManyItemInputEnvelope
    connect?: SupplierItemMappingWhereUniqueInput | SupplierItemMappingWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumItemStructureTypeFieldUpdateOperationsInput = {
    set?: $Enums.ItemStructureType
  }

  export type EnumItemNatureTypeFieldUpdateOperationsInput = {
    set?: $Enums.ItemNatureType
  }

  export type EnumItemStatusFieldUpdateOperationsInput = {
    set?: $Enums.ItemStatus
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ItemCategoryUpdateOneWithoutItemsNestedInput = {
    create?: XOR<ItemCategoryCreateWithoutItemsInput, ItemCategoryUncheckedCreateWithoutItemsInput>
    connectOrCreate?: ItemCategoryCreateOrConnectWithoutItemsInput
    upsert?: ItemCategoryUpsertWithoutItemsInput
    disconnect?: ItemCategoryWhereInput | boolean
    delete?: ItemCategoryWhereInput | boolean
    connect?: ItemCategoryWhereUniqueInput
    update?: XOR<XOR<ItemCategoryUpdateToOneWithWhereWithoutItemsInput, ItemCategoryUpdateWithoutItemsInput>, ItemCategoryUncheckedUpdateWithoutItemsInput>
  }

  export type ItemCompositionUpdateManyWithoutParentItemNestedInput = {
    create?: XOR<ItemCompositionCreateWithoutParentItemInput, ItemCompositionUncheckedCreateWithoutParentItemInput> | ItemCompositionCreateWithoutParentItemInput[] | ItemCompositionUncheckedCreateWithoutParentItemInput[]
    connectOrCreate?: ItemCompositionCreateOrConnectWithoutParentItemInput | ItemCompositionCreateOrConnectWithoutParentItemInput[]
    upsert?: ItemCompositionUpsertWithWhereUniqueWithoutParentItemInput | ItemCompositionUpsertWithWhereUniqueWithoutParentItemInput[]
    createMany?: ItemCompositionCreateManyParentItemInputEnvelope
    set?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    disconnect?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    delete?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    connect?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    update?: ItemCompositionUpdateWithWhereUniqueWithoutParentItemInput | ItemCompositionUpdateWithWhereUniqueWithoutParentItemInput[]
    updateMany?: ItemCompositionUpdateManyWithWhereWithoutParentItemInput | ItemCompositionUpdateManyWithWhereWithoutParentItemInput[]
    deleteMany?: ItemCompositionScalarWhereInput | ItemCompositionScalarWhereInput[]
  }

  export type ItemCompositionUpdateManyWithoutComponentItemNestedInput = {
    create?: XOR<ItemCompositionCreateWithoutComponentItemInput, ItemCompositionUncheckedCreateWithoutComponentItemInput> | ItemCompositionCreateWithoutComponentItemInput[] | ItemCompositionUncheckedCreateWithoutComponentItemInput[]
    connectOrCreate?: ItemCompositionCreateOrConnectWithoutComponentItemInput | ItemCompositionCreateOrConnectWithoutComponentItemInput[]
    upsert?: ItemCompositionUpsertWithWhereUniqueWithoutComponentItemInput | ItemCompositionUpsertWithWhereUniqueWithoutComponentItemInput[]
    createMany?: ItemCompositionCreateManyComponentItemInputEnvelope
    set?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    disconnect?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    delete?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    connect?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    update?: ItemCompositionUpdateWithWhereUniqueWithoutComponentItemInput | ItemCompositionUpdateWithWhereUniqueWithoutComponentItemInput[]
    updateMany?: ItemCompositionUpdateManyWithWhereWithoutComponentItemInput | ItemCompositionUpdateManyWithWhereWithoutComponentItemInput[]
    deleteMany?: ItemCompositionScalarWhereInput | ItemCompositionScalarWhereInput[]
  }

  export type SupplierItemMappingUpdateManyWithoutItemNestedInput = {
    create?: XOR<SupplierItemMappingCreateWithoutItemInput, SupplierItemMappingUncheckedCreateWithoutItemInput> | SupplierItemMappingCreateWithoutItemInput[] | SupplierItemMappingUncheckedCreateWithoutItemInput[]
    connectOrCreate?: SupplierItemMappingCreateOrConnectWithoutItemInput | SupplierItemMappingCreateOrConnectWithoutItemInput[]
    upsert?: SupplierItemMappingUpsertWithWhereUniqueWithoutItemInput | SupplierItemMappingUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: SupplierItemMappingCreateManyItemInputEnvelope
    set?: SupplierItemMappingWhereUniqueInput | SupplierItemMappingWhereUniqueInput[]
    disconnect?: SupplierItemMappingWhereUniqueInput | SupplierItemMappingWhereUniqueInput[]
    delete?: SupplierItemMappingWhereUniqueInput | SupplierItemMappingWhereUniqueInput[]
    connect?: SupplierItemMappingWhereUniqueInput | SupplierItemMappingWhereUniqueInput[]
    update?: SupplierItemMappingUpdateWithWhereUniqueWithoutItemInput | SupplierItemMappingUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: SupplierItemMappingUpdateManyWithWhereWithoutItemInput | SupplierItemMappingUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: SupplierItemMappingScalarWhereInput | SupplierItemMappingScalarWhereInput[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type ItemCompositionUncheckedUpdateManyWithoutParentItemNestedInput = {
    create?: XOR<ItemCompositionCreateWithoutParentItemInput, ItemCompositionUncheckedCreateWithoutParentItemInput> | ItemCompositionCreateWithoutParentItemInput[] | ItemCompositionUncheckedCreateWithoutParentItemInput[]
    connectOrCreate?: ItemCompositionCreateOrConnectWithoutParentItemInput | ItemCompositionCreateOrConnectWithoutParentItemInput[]
    upsert?: ItemCompositionUpsertWithWhereUniqueWithoutParentItemInput | ItemCompositionUpsertWithWhereUniqueWithoutParentItemInput[]
    createMany?: ItemCompositionCreateManyParentItemInputEnvelope
    set?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    disconnect?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    delete?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    connect?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    update?: ItemCompositionUpdateWithWhereUniqueWithoutParentItemInput | ItemCompositionUpdateWithWhereUniqueWithoutParentItemInput[]
    updateMany?: ItemCompositionUpdateManyWithWhereWithoutParentItemInput | ItemCompositionUpdateManyWithWhereWithoutParentItemInput[]
    deleteMany?: ItemCompositionScalarWhereInput | ItemCompositionScalarWhereInput[]
  }

  export type ItemCompositionUncheckedUpdateManyWithoutComponentItemNestedInput = {
    create?: XOR<ItemCompositionCreateWithoutComponentItemInput, ItemCompositionUncheckedCreateWithoutComponentItemInput> | ItemCompositionCreateWithoutComponentItemInput[] | ItemCompositionUncheckedCreateWithoutComponentItemInput[]
    connectOrCreate?: ItemCompositionCreateOrConnectWithoutComponentItemInput | ItemCompositionCreateOrConnectWithoutComponentItemInput[]
    upsert?: ItemCompositionUpsertWithWhereUniqueWithoutComponentItemInput | ItemCompositionUpsertWithWhereUniqueWithoutComponentItemInput[]
    createMany?: ItemCompositionCreateManyComponentItemInputEnvelope
    set?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    disconnect?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    delete?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    connect?: ItemCompositionWhereUniqueInput | ItemCompositionWhereUniqueInput[]
    update?: ItemCompositionUpdateWithWhereUniqueWithoutComponentItemInput | ItemCompositionUpdateWithWhereUniqueWithoutComponentItemInput[]
    updateMany?: ItemCompositionUpdateManyWithWhereWithoutComponentItemInput | ItemCompositionUpdateManyWithWhereWithoutComponentItemInput[]
    deleteMany?: ItemCompositionScalarWhereInput | ItemCompositionScalarWhereInput[]
  }

  export type SupplierItemMappingUncheckedUpdateManyWithoutItemNestedInput = {
    create?: XOR<SupplierItemMappingCreateWithoutItemInput, SupplierItemMappingUncheckedCreateWithoutItemInput> | SupplierItemMappingCreateWithoutItemInput[] | SupplierItemMappingUncheckedCreateWithoutItemInput[]
    connectOrCreate?: SupplierItemMappingCreateOrConnectWithoutItemInput | SupplierItemMappingCreateOrConnectWithoutItemInput[]
    upsert?: SupplierItemMappingUpsertWithWhereUniqueWithoutItemInput | SupplierItemMappingUpsertWithWhereUniqueWithoutItemInput[]
    createMany?: SupplierItemMappingCreateManyItemInputEnvelope
    set?: SupplierItemMappingWhereUniqueInput | SupplierItemMappingWhereUniqueInput[]
    disconnect?: SupplierItemMappingWhereUniqueInput | SupplierItemMappingWhereUniqueInput[]
    delete?: SupplierItemMappingWhereUniqueInput | SupplierItemMappingWhereUniqueInput[]
    connect?: SupplierItemMappingWhereUniqueInput | SupplierItemMappingWhereUniqueInput[]
    update?: SupplierItemMappingUpdateWithWhereUniqueWithoutItemInput | SupplierItemMappingUpdateWithWhereUniqueWithoutItemInput[]
    updateMany?: SupplierItemMappingUpdateManyWithWhereWithoutItemInput | SupplierItemMappingUpdateManyWithWhereWithoutItemInput[]
    deleteMany?: SupplierItemMappingScalarWhereInput | SupplierItemMappingScalarWhereInput[]
  }

  export type ItemCategoryCreateNestedOneWithoutChildrenInput = {
    create?: XOR<ItemCategoryCreateWithoutChildrenInput, ItemCategoryUncheckedCreateWithoutChildrenInput>
    connectOrCreate?: ItemCategoryCreateOrConnectWithoutChildrenInput
    connect?: ItemCategoryWhereUniqueInput
  }

  export type ItemCategoryCreateNestedManyWithoutParentInput = {
    create?: XOR<ItemCategoryCreateWithoutParentInput, ItemCategoryUncheckedCreateWithoutParentInput> | ItemCategoryCreateWithoutParentInput[] | ItemCategoryUncheckedCreateWithoutParentInput[]
    connectOrCreate?: ItemCategoryCreateOrConnectWithoutParentInput | ItemCategoryCreateOrConnectWithoutParentInput[]
    createMany?: ItemCategoryCreateManyParentInputEnvelope
    connect?: ItemCategoryWhereUniqueInput | ItemCategoryWhereUniqueInput[]
  }

  export type ItemCreateNestedManyWithoutPrimaryCategoryInput = {
    create?: XOR<ItemCreateWithoutPrimaryCategoryInput, ItemUncheckedCreateWithoutPrimaryCategoryInput> | ItemCreateWithoutPrimaryCategoryInput[] | ItemUncheckedCreateWithoutPrimaryCategoryInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutPrimaryCategoryInput | ItemCreateOrConnectWithoutPrimaryCategoryInput[]
    createMany?: ItemCreateManyPrimaryCategoryInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type ItemCategoryUncheckedCreateNestedManyWithoutParentInput = {
    create?: XOR<ItemCategoryCreateWithoutParentInput, ItemCategoryUncheckedCreateWithoutParentInput> | ItemCategoryCreateWithoutParentInput[] | ItemCategoryUncheckedCreateWithoutParentInput[]
    connectOrCreate?: ItemCategoryCreateOrConnectWithoutParentInput | ItemCategoryCreateOrConnectWithoutParentInput[]
    createMany?: ItemCategoryCreateManyParentInputEnvelope
    connect?: ItemCategoryWhereUniqueInput | ItemCategoryWhereUniqueInput[]
  }

  export type ItemUncheckedCreateNestedManyWithoutPrimaryCategoryInput = {
    create?: XOR<ItemCreateWithoutPrimaryCategoryInput, ItemUncheckedCreateWithoutPrimaryCategoryInput> | ItemCreateWithoutPrimaryCategoryInput[] | ItemUncheckedCreateWithoutPrimaryCategoryInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutPrimaryCategoryInput | ItemCreateOrConnectWithoutPrimaryCategoryInput[]
    createMany?: ItemCreateManyPrimaryCategoryInputEnvelope
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
  }

  export type EnumItemCategoryStatusFieldUpdateOperationsInput = {
    set?: $Enums.ItemCategoryStatus
  }

  export type ItemCategoryUpdateOneWithoutChildrenNestedInput = {
    create?: XOR<ItemCategoryCreateWithoutChildrenInput, ItemCategoryUncheckedCreateWithoutChildrenInput>
    connectOrCreate?: ItemCategoryCreateOrConnectWithoutChildrenInput
    upsert?: ItemCategoryUpsertWithoutChildrenInput
    disconnect?: ItemCategoryWhereInput | boolean
    delete?: ItemCategoryWhereInput | boolean
    connect?: ItemCategoryWhereUniqueInput
    update?: XOR<XOR<ItemCategoryUpdateToOneWithWhereWithoutChildrenInput, ItemCategoryUpdateWithoutChildrenInput>, ItemCategoryUncheckedUpdateWithoutChildrenInput>
  }

  export type ItemCategoryUpdateManyWithoutParentNestedInput = {
    create?: XOR<ItemCategoryCreateWithoutParentInput, ItemCategoryUncheckedCreateWithoutParentInput> | ItemCategoryCreateWithoutParentInput[] | ItemCategoryUncheckedCreateWithoutParentInput[]
    connectOrCreate?: ItemCategoryCreateOrConnectWithoutParentInput | ItemCategoryCreateOrConnectWithoutParentInput[]
    upsert?: ItemCategoryUpsertWithWhereUniqueWithoutParentInput | ItemCategoryUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: ItemCategoryCreateManyParentInputEnvelope
    set?: ItemCategoryWhereUniqueInput | ItemCategoryWhereUniqueInput[]
    disconnect?: ItemCategoryWhereUniqueInput | ItemCategoryWhereUniqueInput[]
    delete?: ItemCategoryWhereUniqueInput | ItemCategoryWhereUniqueInput[]
    connect?: ItemCategoryWhereUniqueInput | ItemCategoryWhereUniqueInput[]
    update?: ItemCategoryUpdateWithWhereUniqueWithoutParentInput | ItemCategoryUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: ItemCategoryUpdateManyWithWhereWithoutParentInput | ItemCategoryUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: ItemCategoryScalarWhereInput | ItemCategoryScalarWhereInput[]
  }

  export type ItemUpdateManyWithoutPrimaryCategoryNestedInput = {
    create?: XOR<ItemCreateWithoutPrimaryCategoryInput, ItemUncheckedCreateWithoutPrimaryCategoryInput> | ItemCreateWithoutPrimaryCategoryInput[] | ItemUncheckedCreateWithoutPrimaryCategoryInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutPrimaryCategoryInput | ItemCreateOrConnectWithoutPrimaryCategoryInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutPrimaryCategoryInput | ItemUpsertWithWhereUniqueWithoutPrimaryCategoryInput[]
    createMany?: ItemCreateManyPrimaryCategoryInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutPrimaryCategoryInput | ItemUpdateWithWhereUniqueWithoutPrimaryCategoryInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutPrimaryCategoryInput | ItemUpdateManyWithWhereWithoutPrimaryCategoryInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type ItemCategoryUncheckedUpdateManyWithoutParentNestedInput = {
    create?: XOR<ItemCategoryCreateWithoutParentInput, ItemCategoryUncheckedCreateWithoutParentInput> | ItemCategoryCreateWithoutParentInput[] | ItemCategoryUncheckedCreateWithoutParentInput[]
    connectOrCreate?: ItemCategoryCreateOrConnectWithoutParentInput | ItemCategoryCreateOrConnectWithoutParentInput[]
    upsert?: ItemCategoryUpsertWithWhereUniqueWithoutParentInput | ItemCategoryUpsertWithWhereUniqueWithoutParentInput[]
    createMany?: ItemCategoryCreateManyParentInputEnvelope
    set?: ItemCategoryWhereUniqueInput | ItemCategoryWhereUniqueInput[]
    disconnect?: ItemCategoryWhereUniqueInput | ItemCategoryWhereUniqueInput[]
    delete?: ItemCategoryWhereUniqueInput | ItemCategoryWhereUniqueInput[]
    connect?: ItemCategoryWhereUniqueInput | ItemCategoryWhereUniqueInput[]
    update?: ItemCategoryUpdateWithWhereUniqueWithoutParentInput | ItemCategoryUpdateWithWhereUniqueWithoutParentInput[]
    updateMany?: ItemCategoryUpdateManyWithWhereWithoutParentInput | ItemCategoryUpdateManyWithWhereWithoutParentInput[]
    deleteMany?: ItemCategoryScalarWhereInput | ItemCategoryScalarWhereInput[]
  }

  export type ItemUncheckedUpdateManyWithoutPrimaryCategoryNestedInput = {
    create?: XOR<ItemCreateWithoutPrimaryCategoryInput, ItemUncheckedCreateWithoutPrimaryCategoryInput> | ItemCreateWithoutPrimaryCategoryInput[] | ItemUncheckedCreateWithoutPrimaryCategoryInput[]
    connectOrCreate?: ItemCreateOrConnectWithoutPrimaryCategoryInput | ItemCreateOrConnectWithoutPrimaryCategoryInput[]
    upsert?: ItemUpsertWithWhereUniqueWithoutPrimaryCategoryInput | ItemUpsertWithWhereUniqueWithoutPrimaryCategoryInput[]
    createMany?: ItemCreateManyPrimaryCategoryInputEnvelope
    set?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    disconnect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    delete?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    connect?: ItemWhereUniqueInput | ItemWhereUniqueInput[]
    update?: ItemUpdateWithWhereUniqueWithoutPrimaryCategoryInput | ItemUpdateWithWhereUniqueWithoutPrimaryCategoryInput[]
    updateMany?: ItemUpdateManyWithWhereWithoutPrimaryCategoryInput | ItemUpdateManyWithWhereWithoutPrimaryCategoryInput[]
    deleteMany?: ItemScalarWhereInput | ItemScalarWhereInput[]
  }

  export type ItemCreateNestedOneWithoutParentLinksInput = {
    create?: XOR<ItemCreateWithoutParentLinksInput, ItemUncheckedCreateWithoutParentLinksInput>
    connectOrCreate?: ItemCreateOrConnectWithoutParentLinksInput
    connect?: ItemWhereUniqueInput
  }

  export type ItemCreateNestedOneWithoutComponentLinksInput = {
    create?: XOR<ItemCreateWithoutComponentLinksInput, ItemUncheckedCreateWithoutComponentLinksInput>
    connectOrCreate?: ItemCreateOrConnectWithoutComponentLinksInput
    connect?: ItemWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ItemUpdateOneRequiredWithoutParentLinksNestedInput = {
    create?: XOR<ItemCreateWithoutParentLinksInput, ItemUncheckedCreateWithoutParentLinksInput>
    connectOrCreate?: ItemCreateOrConnectWithoutParentLinksInput
    upsert?: ItemUpsertWithoutParentLinksInput
    connect?: ItemWhereUniqueInput
    update?: XOR<XOR<ItemUpdateToOneWithWhereWithoutParentLinksInput, ItemUpdateWithoutParentLinksInput>, ItemUncheckedUpdateWithoutParentLinksInput>
  }

  export type ItemUpdateOneRequiredWithoutComponentLinksNestedInput = {
    create?: XOR<ItemCreateWithoutComponentLinksInput, ItemUncheckedCreateWithoutComponentLinksInput>
    connectOrCreate?: ItemCreateOrConnectWithoutComponentLinksInput
    upsert?: ItemUpsertWithoutComponentLinksInput
    connect?: ItemWhereUniqueInput
    update?: XOR<XOR<ItemUpdateToOneWithWhereWithoutComponentLinksInput, ItemUpdateWithoutComponentLinksInput>, ItemUncheckedUpdateWithoutComponentLinksInput>
  }

  export type ItemCreateNestedOneWithoutSupplierMappingsInput = {
    create?: XOR<ItemCreateWithoutSupplierMappingsInput, ItemUncheckedCreateWithoutSupplierMappingsInput>
    connectOrCreate?: ItemCreateOrConnectWithoutSupplierMappingsInput
    connect?: ItemWhereUniqueInput
  }

  export type ItemUpdateOneRequiredWithoutSupplierMappingsNestedInput = {
    create?: XOR<ItemCreateWithoutSupplierMappingsInput, ItemUncheckedCreateWithoutSupplierMappingsInput>
    connectOrCreate?: ItemCreateOrConnectWithoutSupplierMappingsInput
    upsert?: ItemUpsertWithoutSupplierMappingsInput
    connect?: ItemWhereUniqueInput
    update?: XOR<XOR<ItemUpdateToOneWithWhereWithoutSupplierMappingsInput, ItemUpdateWithoutSupplierMappingsInput>, ItemUncheckedUpdateWithoutSupplierMappingsInput>
  }

  export type NestedUuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumItemStructureTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemStructureType | EnumItemStructureTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ItemStructureType[] | ListEnumItemStructureTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemStructureType[] | ListEnumItemStructureTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumItemStructureTypeFilter<$PrismaModel> | $Enums.ItemStructureType
  }

  export type NestedEnumItemNatureTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemNatureType | EnumItemNatureTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ItemNatureType[] | ListEnumItemNatureTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemNatureType[] | ListEnumItemNatureTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumItemNatureTypeFilter<$PrismaModel> | $Enums.ItemNatureType
  }

  export type NestedEnumItemStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemStatus | EnumItemStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumItemStatusFilter<$PrismaModel> | $Enums.ItemStatus
  }

  export type NestedUuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedUuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedEnumItemStructureTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemStructureType | EnumItemStructureTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ItemStructureType[] | ListEnumItemStructureTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemStructureType[] | ListEnumItemStructureTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumItemStructureTypeWithAggregatesFilter<$PrismaModel> | $Enums.ItemStructureType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumItemStructureTypeFilter<$PrismaModel>
    _max?: NestedEnumItemStructureTypeFilter<$PrismaModel>
  }

  export type NestedEnumItemNatureTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemNatureType | EnumItemNatureTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ItemNatureType[] | ListEnumItemNatureTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemNatureType[] | ListEnumItemNatureTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumItemNatureTypeWithAggregatesFilter<$PrismaModel> | $Enums.ItemNatureType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumItemNatureTypeFilter<$PrismaModel>
    _max?: NestedEnumItemNatureTypeFilter<$PrismaModel>
  }

  export type NestedEnumItemStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemStatus | EnumItemStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemStatus[] | ListEnumItemStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumItemStatusWithAggregatesFilter<$PrismaModel> | $Enums.ItemStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumItemStatusFilter<$PrismaModel>
    _max?: NestedEnumItemStatusFilter<$PrismaModel>
  }

  export type NestedUuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumItemCategoryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemCategoryStatus | EnumItemCategoryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ItemCategoryStatus[] | ListEnumItemCategoryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemCategoryStatus[] | ListEnumItemCategoryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumItemCategoryStatusFilter<$PrismaModel> | $Enums.ItemCategoryStatus
  }

  export type NestedEnumItemCategoryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ItemCategoryStatus | EnumItemCategoryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ItemCategoryStatus[] | ListEnumItemCategoryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.ItemCategoryStatus[] | ListEnumItemCategoryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumItemCategoryStatusWithAggregatesFilter<$PrismaModel> | $Enums.ItemCategoryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumItemCategoryStatusFilter<$PrismaModel>
    _max?: NestedEnumItemCategoryStatusFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ItemCategoryCreateWithoutItemsInput = {
    id?: string
    tenantId: string
    categoryCode: string
    categoryName: string
    status?: $Enums.ItemCategoryStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    parent?: ItemCategoryCreateNestedOneWithoutChildrenInput
    children?: ItemCategoryCreateNestedManyWithoutParentInput
  }

  export type ItemCategoryUncheckedCreateWithoutItemsInput = {
    id?: string
    tenantId: string
    categoryCode: string
    categoryName: string
    parentCategoryId?: string | null
    status?: $Enums.ItemCategoryStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ItemCategoryUncheckedCreateNestedManyWithoutParentInput
  }

  export type ItemCategoryCreateOrConnectWithoutItemsInput = {
    where: ItemCategoryWhereUniqueInput
    create: XOR<ItemCategoryCreateWithoutItemsInput, ItemCategoryUncheckedCreateWithoutItemsInput>
  }

  export type ItemCompositionCreateWithoutParentItemInput = {
    id?: string
    tenantId: string
    sortOrder: number
    createdAt?: Date | string
    componentItem: ItemCreateNestedOneWithoutComponentLinksInput
  }

  export type ItemCompositionUncheckedCreateWithoutParentItemInput = {
    id?: string
    tenantId: string
    componentItemId: string
    sortOrder: number
    createdAt?: Date | string
  }

  export type ItemCompositionCreateOrConnectWithoutParentItemInput = {
    where: ItemCompositionWhereUniqueInput
    create: XOR<ItemCompositionCreateWithoutParentItemInput, ItemCompositionUncheckedCreateWithoutParentItemInput>
  }

  export type ItemCompositionCreateManyParentItemInputEnvelope = {
    data: ItemCompositionCreateManyParentItemInput | ItemCompositionCreateManyParentItemInput[]
    skipDuplicates?: boolean
  }

  export type ItemCompositionCreateWithoutComponentItemInput = {
    id?: string
    tenantId: string
    sortOrder: number
    createdAt?: Date | string
    parentItem: ItemCreateNestedOneWithoutParentLinksInput
  }

  export type ItemCompositionUncheckedCreateWithoutComponentItemInput = {
    id?: string
    tenantId: string
    parentItemId: string
    sortOrder: number
    createdAt?: Date | string
  }

  export type ItemCompositionCreateOrConnectWithoutComponentItemInput = {
    where: ItemCompositionWhereUniqueInput
    create: XOR<ItemCompositionCreateWithoutComponentItemInput, ItemCompositionUncheckedCreateWithoutComponentItemInput>
  }

  export type ItemCompositionCreateManyComponentItemInputEnvelope = {
    data: ItemCompositionCreateManyComponentItemInput | ItemCompositionCreateManyComponentItemInput[]
    skipDuplicates?: boolean
  }

  export type SupplierItemMappingCreateWithoutItemInput = {
    id?: string
    tenantId: string
    supplierId: string
    supplierItemCode?: string | null
    supplierItemName?: string | null
    supplierItemCodeKey?: string | null
    supplierItemNameKey?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierItemMappingUncheckedCreateWithoutItemInput = {
    id?: string
    tenantId: string
    supplierId: string
    supplierItemCode?: string | null
    supplierItemName?: string | null
    supplierItemCodeKey?: string | null
    supplierItemNameKey?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SupplierItemMappingCreateOrConnectWithoutItemInput = {
    where: SupplierItemMappingWhereUniqueInput
    create: XOR<SupplierItemMappingCreateWithoutItemInput, SupplierItemMappingUncheckedCreateWithoutItemInput>
  }

  export type SupplierItemMappingCreateManyItemInputEnvelope = {
    data: SupplierItemMappingCreateManyItemInput | SupplierItemMappingCreateManyItemInput[]
    skipDuplicates?: boolean
  }

  export type ItemCategoryUpsertWithoutItemsInput = {
    update: XOR<ItemCategoryUpdateWithoutItemsInput, ItemCategoryUncheckedUpdateWithoutItemsInput>
    create: XOR<ItemCategoryCreateWithoutItemsInput, ItemCategoryUncheckedCreateWithoutItemsInput>
    where?: ItemCategoryWhereInput
  }

  export type ItemCategoryUpdateToOneWithWhereWithoutItemsInput = {
    where?: ItemCategoryWhereInput
    data: XOR<ItemCategoryUpdateWithoutItemsInput, ItemCategoryUncheckedUpdateWithoutItemsInput>
  }

  export type ItemCategoryUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    categoryCode?: StringFieldUpdateOperationsInput | string
    categoryName?: StringFieldUpdateOperationsInput | string
    status?: EnumItemCategoryStatusFieldUpdateOperationsInput | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parent?: ItemCategoryUpdateOneWithoutChildrenNestedInput
    children?: ItemCategoryUpdateManyWithoutParentNestedInput
  }

  export type ItemCategoryUncheckedUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    categoryCode?: StringFieldUpdateOperationsInput | string
    categoryName?: StringFieldUpdateOperationsInput | string
    parentCategoryId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumItemCategoryStatusFieldUpdateOperationsInput | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ItemCategoryUncheckedUpdateManyWithoutParentNestedInput
  }

  export type ItemCompositionUpsertWithWhereUniqueWithoutParentItemInput = {
    where: ItemCompositionWhereUniqueInput
    update: XOR<ItemCompositionUpdateWithoutParentItemInput, ItemCompositionUncheckedUpdateWithoutParentItemInput>
    create: XOR<ItemCompositionCreateWithoutParentItemInput, ItemCompositionUncheckedCreateWithoutParentItemInput>
  }

  export type ItemCompositionUpdateWithWhereUniqueWithoutParentItemInput = {
    where: ItemCompositionWhereUniqueInput
    data: XOR<ItemCompositionUpdateWithoutParentItemInput, ItemCompositionUncheckedUpdateWithoutParentItemInput>
  }

  export type ItemCompositionUpdateManyWithWhereWithoutParentItemInput = {
    where: ItemCompositionScalarWhereInput
    data: XOR<ItemCompositionUpdateManyMutationInput, ItemCompositionUncheckedUpdateManyWithoutParentItemInput>
  }

  export type ItemCompositionScalarWhereInput = {
    AND?: ItemCompositionScalarWhereInput | ItemCompositionScalarWhereInput[]
    OR?: ItemCompositionScalarWhereInput[]
    NOT?: ItemCompositionScalarWhereInput | ItemCompositionScalarWhereInput[]
    id?: UuidFilter<"ItemComposition"> | string
    tenantId?: StringFilter<"ItemComposition"> | string
    parentItemId?: UuidFilter<"ItemComposition"> | string
    componentItemId?: UuidFilter<"ItemComposition"> | string
    sortOrder?: IntFilter<"ItemComposition"> | number
    createdAt?: DateTimeFilter<"ItemComposition"> | Date | string
  }

  export type ItemCompositionUpsertWithWhereUniqueWithoutComponentItemInput = {
    where: ItemCompositionWhereUniqueInput
    update: XOR<ItemCompositionUpdateWithoutComponentItemInput, ItemCompositionUncheckedUpdateWithoutComponentItemInput>
    create: XOR<ItemCompositionCreateWithoutComponentItemInput, ItemCompositionUncheckedCreateWithoutComponentItemInput>
  }

  export type ItemCompositionUpdateWithWhereUniqueWithoutComponentItemInput = {
    where: ItemCompositionWhereUniqueInput
    data: XOR<ItemCompositionUpdateWithoutComponentItemInput, ItemCompositionUncheckedUpdateWithoutComponentItemInput>
  }

  export type ItemCompositionUpdateManyWithWhereWithoutComponentItemInput = {
    where: ItemCompositionScalarWhereInput
    data: XOR<ItemCompositionUpdateManyMutationInput, ItemCompositionUncheckedUpdateManyWithoutComponentItemInput>
  }

  export type SupplierItemMappingUpsertWithWhereUniqueWithoutItemInput = {
    where: SupplierItemMappingWhereUniqueInput
    update: XOR<SupplierItemMappingUpdateWithoutItemInput, SupplierItemMappingUncheckedUpdateWithoutItemInput>
    create: XOR<SupplierItemMappingCreateWithoutItemInput, SupplierItemMappingUncheckedCreateWithoutItemInput>
  }

  export type SupplierItemMappingUpdateWithWhereUniqueWithoutItemInput = {
    where: SupplierItemMappingWhereUniqueInput
    data: XOR<SupplierItemMappingUpdateWithoutItemInput, SupplierItemMappingUncheckedUpdateWithoutItemInput>
  }

  export type SupplierItemMappingUpdateManyWithWhereWithoutItemInput = {
    where: SupplierItemMappingScalarWhereInput
    data: XOR<SupplierItemMappingUpdateManyMutationInput, SupplierItemMappingUncheckedUpdateManyWithoutItemInput>
  }

  export type SupplierItemMappingScalarWhereInput = {
    AND?: SupplierItemMappingScalarWhereInput | SupplierItemMappingScalarWhereInput[]
    OR?: SupplierItemMappingScalarWhereInput[]
    NOT?: SupplierItemMappingScalarWhereInput | SupplierItemMappingScalarWhereInput[]
    id?: UuidFilter<"SupplierItemMapping"> | string
    tenantId?: StringFilter<"SupplierItemMapping"> | string
    supplierId?: StringFilter<"SupplierItemMapping"> | string
    supplierItemCode?: StringNullableFilter<"SupplierItemMapping"> | string | null
    supplierItemName?: StringNullableFilter<"SupplierItemMapping"> | string | null
    supplierItemCodeKey?: StringNullableFilter<"SupplierItemMapping"> | string | null
    supplierItemNameKey?: StringNullableFilter<"SupplierItemMapping"> | string | null
    itemId?: UuidFilter<"SupplierItemMapping"> | string
    createdAt?: DateTimeFilter<"SupplierItemMapping"> | Date | string
    updatedAt?: DateTimeFilter<"SupplierItemMapping"> | Date | string
  }

  export type ItemCategoryCreateWithoutChildrenInput = {
    id?: string
    tenantId: string
    categoryCode: string
    categoryName: string
    status?: $Enums.ItemCategoryStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    parent?: ItemCategoryCreateNestedOneWithoutChildrenInput
    items?: ItemCreateNestedManyWithoutPrimaryCategoryInput
  }

  export type ItemCategoryUncheckedCreateWithoutChildrenInput = {
    id?: string
    tenantId: string
    categoryCode: string
    categoryName: string
    parentCategoryId?: string | null
    status?: $Enums.ItemCategoryStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    items?: ItemUncheckedCreateNestedManyWithoutPrimaryCategoryInput
  }

  export type ItemCategoryCreateOrConnectWithoutChildrenInput = {
    where: ItemCategoryWhereUniqueInput
    create: XOR<ItemCategoryCreateWithoutChildrenInput, ItemCategoryUncheckedCreateWithoutChildrenInput>
  }

  export type ItemCategoryCreateWithoutParentInput = {
    id?: string
    tenantId: string
    categoryCode: string
    categoryName: string
    status?: $Enums.ItemCategoryStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ItemCategoryCreateNestedManyWithoutParentInput
    items?: ItemCreateNestedManyWithoutPrimaryCategoryInput
  }

  export type ItemCategoryUncheckedCreateWithoutParentInput = {
    id?: string
    tenantId: string
    categoryCode: string
    categoryName: string
    status?: $Enums.ItemCategoryStatus
    createdAt?: Date | string
    updatedAt?: Date | string
    children?: ItemCategoryUncheckedCreateNestedManyWithoutParentInput
    items?: ItemUncheckedCreateNestedManyWithoutPrimaryCategoryInput
  }

  export type ItemCategoryCreateOrConnectWithoutParentInput = {
    where: ItemCategoryWhereUniqueInput
    create: XOR<ItemCategoryCreateWithoutParentInput, ItemCategoryUncheckedCreateWithoutParentInput>
  }

  export type ItemCategoryCreateManyParentInputEnvelope = {
    data: ItemCategoryCreateManyParentInput | ItemCategoryCreateManyParentInput[]
    skipDuplicates?: boolean
  }

  export type ItemCreateWithoutPrimaryCategoryInput = {
    id?: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: $Enums.ItemStructureType
    natureType: $Enums.ItemNatureType
    status?: $Enums.ItemStatus
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    parentLinks?: ItemCompositionCreateNestedManyWithoutParentItemInput
    componentLinks?: ItemCompositionCreateNestedManyWithoutComponentItemInput
    supplierMappings?: SupplierItemMappingCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutPrimaryCategoryInput = {
    id?: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: $Enums.ItemStructureType
    natureType: $Enums.ItemNatureType
    status?: $Enums.ItemStatus
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    parentLinks?: ItemCompositionUncheckedCreateNestedManyWithoutParentItemInput
    componentLinks?: ItemCompositionUncheckedCreateNestedManyWithoutComponentItemInput
    supplierMappings?: SupplierItemMappingUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutPrimaryCategoryInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutPrimaryCategoryInput, ItemUncheckedCreateWithoutPrimaryCategoryInput>
  }

  export type ItemCreateManyPrimaryCategoryInputEnvelope = {
    data: ItemCreateManyPrimaryCategoryInput | ItemCreateManyPrimaryCategoryInput[]
    skipDuplicates?: boolean
  }

  export type ItemCategoryUpsertWithoutChildrenInput = {
    update: XOR<ItemCategoryUpdateWithoutChildrenInput, ItemCategoryUncheckedUpdateWithoutChildrenInput>
    create: XOR<ItemCategoryCreateWithoutChildrenInput, ItemCategoryUncheckedCreateWithoutChildrenInput>
    where?: ItemCategoryWhereInput
  }

  export type ItemCategoryUpdateToOneWithWhereWithoutChildrenInput = {
    where?: ItemCategoryWhereInput
    data: XOR<ItemCategoryUpdateWithoutChildrenInput, ItemCategoryUncheckedUpdateWithoutChildrenInput>
  }

  export type ItemCategoryUpdateWithoutChildrenInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    categoryCode?: StringFieldUpdateOperationsInput | string
    categoryName?: StringFieldUpdateOperationsInput | string
    status?: EnumItemCategoryStatusFieldUpdateOperationsInput | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parent?: ItemCategoryUpdateOneWithoutChildrenNestedInput
    items?: ItemUpdateManyWithoutPrimaryCategoryNestedInput
  }

  export type ItemCategoryUncheckedUpdateWithoutChildrenInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    categoryCode?: StringFieldUpdateOperationsInput | string
    categoryName?: StringFieldUpdateOperationsInput | string
    parentCategoryId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumItemCategoryStatusFieldUpdateOperationsInput | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: ItemUncheckedUpdateManyWithoutPrimaryCategoryNestedInput
  }

  export type ItemCategoryUpsertWithWhereUniqueWithoutParentInput = {
    where: ItemCategoryWhereUniqueInput
    update: XOR<ItemCategoryUpdateWithoutParentInput, ItemCategoryUncheckedUpdateWithoutParentInput>
    create: XOR<ItemCategoryCreateWithoutParentInput, ItemCategoryUncheckedCreateWithoutParentInput>
  }

  export type ItemCategoryUpdateWithWhereUniqueWithoutParentInput = {
    where: ItemCategoryWhereUniqueInput
    data: XOR<ItemCategoryUpdateWithoutParentInput, ItemCategoryUncheckedUpdateWithoutParentInput>
  }

  export type ItemCategoryUpdateManyWithWhereWithoutParentInput = {
    where: ItemCategoryScalarWhereInput
    data: XOR<ItemCategoryUpdateManyMutationInput, ItemCategoryUncheckedUpdateManyWithoutParentInput>
  }

  export type ItemCategoryScalarWhereInput = {
    AND?: ItemCategoryScalarWhereInput | ItemCategoryScalarWhereInput[]
    OR?: ItemCategoryScalarWhereInput[]
    NOT?: ItemCategoryScalarWhereInput | ItemCategoryScalarWhereInput[]
    id?: UuidFilter<"ItemCategory"> | string
    tenantId?: StringFilter<"ItemCategory"> | string
    categoryCode?: StringFilter<"ItemCategory"> | string
    categoryName?: StringFilter<"ItemCategory"> | string
    parentCategoryId?: UuidNullableFilter<"ItemCategory"> | string | null
    status?: EnumItemCategoryStatusFilter<"ItemCategory"> | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFilter<"ItemCategory"> | Date | string
    updatedAt?: DateTimeFilter<"ItemCategory"> | Date | string
  }

  export type ItemUpsertWithWhereUniqueWithoutPrimaryCategoryInput = {
    where: ItemWhereUniqueInput
    update: XOR<ItemUpdateWithoutPrimaryCategoryInput, ItemUncheckedUpdateWithoutPrimaryCategoryInput>
    create: XOR<ItemCreateWithoutPrimaryCategoryInput, ItemUncheckedCreateWithoutPrimaryCategoryInput>
  }

  export type ItemUpdateWithWhereUniqueWithoutPrimaryCategoryInput = {
    where: ItemWhereUniqueInput
    data: XOR<ItemUpdateWithoutPrimaryCategoryInput, ItemUncheckedUpdateWithoutPrimaryCategoryInput>
  }

  export type ItemUpdateManyWithWhereWithoutPrimaryCategoryInput = {
    where: ItemScalarWhereInput
    data: XOR<ItemUpdateManyMutationInput, ItemUncheckedUpdateManyWithoutPrimaryCategoryInput>
  }

  export type ItemScalarWhereInput = {
    AND?: ItemScalarWhereInput | ItemScalarWhereInput[]
    OR?: ItemScalarWhereInput[]
    NOT?: ItemScalarWhereInput | ItemScalarWhereInput[]
    id?: UuidFilter<"Item"> | string
    tenantId?: StringFilter<"Item"> | string
    itemCode?: StringFilter<"Item"> | string
    itemName?: StringFilter<"Item"> | string
    structureType?: EnumItemStructureTypeFilter<"Item"> | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFilter<"Item"> | $Enums.ItemNatureType
    status?: EnumItemStatusFilter<"Item"> | $Enums.ItemStatus
    primaryCategoryId?: UuidNullableFilter<"Item"> | string | null
    sellable?: BoolFilter<"Item"> | boolean
    purchasable?: BoolFilter<"Item"> | boolean
    stockable?: BoolFilter<"Item"> | boolean
    manufacturable?: BoolFilter<"Item"> | boolean
    createdAt?: DateTimeFilter<"Item"> | Date | string
    updatedAt?: DateTimeFilter<"Item"> | Date | string
  }

  export type ItemCreateWithoutParentLinksInput = {
    id?: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: $Enums.ItemStructureType
    natureType: $Enums.ItemNatureType
    status?: $Enums.ItemStatus
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    primaryCategory?: ItemCategoryCreateNestedOneWithoutItemsInput
    componentLinks?: ItemCompositionCreateNestedManyWithoutComponentItemInput
    supplierMappings?: SupplierItemMappingCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutParentLinksInput = {
    id?: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: $Enums.ItemStructureType
    natureType: $Enums.ItemNatureType
    status?: $Enums.ItemStatus
    primaryCategoryId?: string | null
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    componentLinks?: ItemCompositionUncheckedCreateNestedManyWithoutComponentItemInput
    supplierMappings?: SupplierItemMappingUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutParentLinksInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutParentLinksInput, ItemUncheckedCreateWithoutParentLinksInput>
  }

  export type ItemCreateWithoutComponentLinksInput = {
    id?: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: $Enums.ItemStructureType
    natureType: $Enums.ItemNatureType
    status?: $Enums.ItemStatus
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    primaryCategory?: ItemCategoryCreateNestedOneWithoutItemsInput
    parentLinks?: ItemCompositionCreateNestedManyWithoutParentItemInput
    supplierMappings?: SupplierItemMappingCreateNestedManyWithoutItemInput
  }

  export type ItemUncheckedCreateWithoutComponentLinksInput = {
    id?: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: $Enums.ItemStructureType
    natureType: $Enums.ItemNatureType
    status?: $Enums.ItemStatus
    primaryCategoryId?: string | null
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    parentLinks?: ItemCompositionUncheckedCreateNestedManyWithoutParentItemInput
    supplierMappings?: SupplierItemMappingUncheckedCreateNestedManyWithoutItemInput
  }

  export type ItemCreateOrConnectWithoutComponentLinksInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutComponentLinksInput, ItemUncheckedCreateWithoutComponentLinksInput>
  }

  export type ItemUpsertWithoutParentLinksInput = {
    update: XOR<ItemUpdateWithoutParentLinksInput, ItemUncheckedUpdateWithoutParentLinksInput>
    create: XOR<ItemCreateWithoutParentLinksInput, ItemUncheckedCreateWithoutParentLinksInput>
    where?: ItemWhereInput
  }

  export type ItemUpdateToOneWithWhereWithoutParentLinksInput = {
    where?: ItemWhereInput
    data: XOR<ItemUpdateWithoutParentLinksInput, ItemUncheckedUpdateWithoutParentLinksInput>
  }

  export type ItemUpdateWithoutParentLinksInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    structureType?: EnumItemStructureTypeFieldUpdateOperationsInput | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFieldUpdateOperationsInput | $Enums.ItemNatureType
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    sellable?: BoolFieldUpdateOperationsInput | boolean
    purchasable?: BoolFieldUpdateOperationsInput | boolean
    stockable?: BoolFieldUpdateOperationsInput | boolean
    manufacturable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    primaryCategory?: ItemCategoryUpdateOneWithoutItemsNestedInput
    componentLinks?: ItemCompositionUpdateManyWithoutComponentItemNestedInput
    supplierMappings?: SupplierItemMappingUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutParentLinksInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    structureType?: EnumItemStructureTypeFieldUpdateOperationsInput | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFieldUpdateOperationsInput | $Enums.ItemNatureType
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    primaryCategoryId?: NullableStringFieldUpdateOperationsInput | string | null
    sellable?: BoolFieldUpdateOperationsInput | boolean
    purchasable?: BoolFieldUpdateOperationsInput | boolean
    stockable?: BoolFieldUpdateOperationsInput | boolean
    manufacturable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    componentLinks?: ItemCompositionUncheckedUpdateManyWithoutComponentItemNestedInput
    supplierMappings?: SupplierItemMappingUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemUpsertWithoutComponentLinksInput = {
    update: XOR<ItemUpdateWithoutComponentLinksInput, ItemUncheckedUpdateWithoutComponentLinksInput>
    create: XOR<ItemCreateWithoutComponentLinksInput, ItemUncheckedCreateWithoutComponentLinksInput>
    where?: ItemWhereInput
  }

  export type ItemUpdateToOneWithWhereWithoutComponentLinksInput = {
    where?: ItemWhereInput
    data: XOR<ItemUpdateWithoutComponentLinksInput, ItemUncheckedUpdateWithoutComponentLinksInput>
  }

  export type ItemUpdateWithoutComponentLinksInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    structureType?: EnumItemStructureTypeFieldUpdateOperationsInput | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFieldUpdateOperationsInput | $Enums.ItemNatureType
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    sellable?: BoolFieldUpdateOperationsInput | boolean
    purchasable?: BoolFieldUpdateOperationsInput | boolean
    stockable?: BoolFieldUpdateOperationsInput | boolean
    manufacturable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    primaryCategory?: ItemCategoryUpdateOneWithoutItemsNestedInput
    parentLinks?: ItemCompositionUpdateManyWithoutParentItemNestedInput
    supplierMappings?: SupplierItemMappingUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutComponentLinksInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    structureType?: EnumItemStructureTypeFieldUpdateOperationsInput | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFieldUpdateOperationsInput | $Enums.ItemNatureType
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    primaryCategoryId?: NullableStringFieldUpdateOperationsInput | string | null
    sellable?: BoolFieldUpdateOperationsInput | boolean
    purchasable?: BoolFieldUpdateOperationsInput | boolean
    stockable?: BoolFieldUpdateOperationsInput | boolean
    manufacturable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parentLinks?: ItemCompositionUncheckedUpdateManyWithoutParentItemNestedInput
    supplierMappings?: SupplierItemMappingUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemCreateWithoutSupplierMappingsInput = {
    id?: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: $Enums.ItemStructureType
    natureType: $Enums.ItemNatureType
    status?: $Enums.ItemStatus
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    primaryCategory?: ItemCategoryCreateNestedOneWithoutItemsInput
    parentLinks?: ItemCompositionCreateNestedManyWithoutParentItemInput
    componentLinks?: ItemCompositionCreateNestedManyWithoutComponentItemInput
  }

  export type ItemUncheckedCreateWithoutSupplierMappingsInput = {
    id?: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: $Enums.ItemStructureType
    natureType: $Enums.ItemNatureType
    status?: $Enums.ItemStatus
    primaryCategoryId?: string | null
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    parentLinks?: ItemCompositionUncheckedCreateNestedManyWithoutParentItemInput
    componentLinks?: ItemCompositionUncheckedCreateNestedManyWithoutComponentItemInput
  }

  export type ItemCreateOrConnectWithoutSupplierMappingsInput = {
    where: ItemWhereUniqueInput
    create: XOR<ItemCreateWithoutSupplierMappingsInput, ItemUncheckedCreateWithoutSupplierMappingsInput>
  }

  export type ItemUpsertWithoutSupplierMappingsInput = {
    update: XOR<ItemUpdateWithoutSupplierMappingsInput, ItemUncheckedUpdateWithoutSupplierMappingsInput>
    create: XOR<ItemCreateWithoutSupplierMappingsInput, ItemUncheckedCreateWithoutSupplierMappingsInput>
    where?: ItemWhereInput
  }

  export type ItemUpdateToOneWithWhereWithoutSupplierMappingsInput = {
    where?: ItemWhereInput
    data: XOR<ItemUpdateWithoutSupplierMappingsInput, ItemUncheckedUpdateWithoutSupplierMappingsInput>
  }

  export type ItemUpdateWithoutSupplierMappingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    structureType?: EnumItemStructureTypeFieldUpdateOperationsInput | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFieldUpdateOperationsInput | $Enums.ItemNatureType
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    sellable?: BoolFieldUpdateOperationsInput | boolean
    purchasable?: BoolFieldUpdateOperationsInput | boolean
    stockable?: BoolFieldUpdateOperationsInput | boolean
    manufacturable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    primaryCategory?: ItemCategoryUpdateOneWithoutItemsNestedInput
    parentLinks?: ItemCompositionUpdateManyWithoutParentItemNestedInput
    componentLinks?: ItemCompositionUpdateManyWithoutComponentItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutSupplierMappingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    structureType?: EnumItemStructureTypeFieldUpdateOperationsInput | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFieldUpdateOperationsInput | $Enums.ItemNatureType
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    primaryCategoryId?: NullableStringFieldUpdateOperationsInput | string | null
    sellable?: BoolFieldUpdateOperationsInput | boolean
    purchasable?: BoolFieldUpdateOperationsInput | boolean
    stockable?: BoolFieldUpdateOperationsInput | boolean
    manufacturable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parentLinks?: ItemCompositionUncheckedUpdateManyWithoutParentItemNestedInput
    componentLinks?: ItemCompositionUncheckedUpdateManyWithoutComponentItemNestedInput
  }

  export type ItemCompositionCreateManyParentItemInput = {
    id?: string
    tenantId: string
    componentItemId: string
    sortOrder: number
    createdAt?: Date | string
  }

  export type ItemCompositionCreateManyComponentItemInput = {
    id?: string
    tenantId: string
    parentItemId: string
    sortOrder: number
    createdAt?: Date | string
  }

  export type SupplierItemMappingCreateManyItemInput = {
    id?: string
    tenantId: string
    supplierId: string
    supplierItemCode?: string | null
    supplierItemName?: string | null
    supplierItemCodeKey?: string | null
    supplierItemNameKey?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ItemCompositionUpdateWithoutParentItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    componentItem?: ItemUpdateOneRequiredWithoutComponentLinksNestedInput
  }

  export type ItemCompositionUncheckedUpdateWithoutParentItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    componentItemId?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCompositionUncheckedUpdateManyWithoutParentItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    componentItemId?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCompositionUpdateWithoutComponentItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parentItem?: ItemUpdateOneRequiredWithoutParentLinksNestedInput
  }

  export type ItemCompositionUncheckedUpdateWithoutComponentItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    parentItemId?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCompositionUncheckedUpdateManyWithoutComponentItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    parentItemId?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierItemMappingUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierItemCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemName?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemCodeKey?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemNameKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierItemMappingUncheckedUpdateWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierItemCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemName?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemCodeKey?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemNameKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SupplierItemMappingUncheckedUpdateManyWithoutItemInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    supplierId?: StringFieldUpdateOperationsInput | string
    supplierItemCode?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemName?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemCodeKey?: NullableStringFieldUpdateOperationsInput | string | null
    supplierItemNameKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemCategoryCreateManyParentInput = {
    id?: string
    tenantId: string
    categoryCode: string
    categoryName: string
    status?: $Enums.ItemCategoryStatus
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ItemCreateManyPrimaryCategoryInput = {
    id?: string
    tenantId: string
    itemCode: string
    itemName: string
    structureType: $Enums.ItemStructureType
    natureType: $Enums.ItemNatureType
    status?: $Enums.ItemStatus
    sellable?: boolean
    purchasable?: boolean
    stockable?: boolean
    manufacturable?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ItemCategoryUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    categoryCode?: StringFieldUpdateOperationsInput | string
    categoryName?: StringFieldUpdateOperationsInput | string
    status?: EnumItemCategoryStatusFieldUpdateOperationsInput | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ItemCategoryUpdateManyWithoutParentNestedInput
    items?: ItemUpdateManyWithoutPrimaryCategoryNestedInput
  }

  export type ItemCategoryUncheckedUpdateWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    categoryCode?: StringFieldUpdateOperationsInput | string
    categoryName?: StringFieldUpdateOperationsInput | string
    status?: EnumItemCategoryStatusFieldUpdateOperationsInput | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    children?: ItemCategoryUncheckedUpdateManyWithoutParentNestedInput
    items?: ItemUncheckedUpdateManyWithoutPrimaryCategoryNestedInput
  }

  export type ItemCategoryUncheckedUpdateManyWithoutParentInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    categoryCode?: StringFieldUpdateOperationsInput | string
    categoryName?: StringFieldUpdateOperationsInput | string
    status?: EnumItemCategoryStatusFieldUpdateOperationsInput | $Enums.ItemCategoryStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ItemUpdateWithoutPrimaryCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    structureType?: EnumItemStructureTypeFieldUpdateOperationsInput | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFieldUpdateOperationsInput | $Enums.ItemNatureType
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    sellable?: BoolFieldUpdateOperationsInput | boolean
    purchasable?: BoolFieldUpdateOperationsInput | boolean
    stockable?: BoolFieldUpdateOperationsInput | boolean
    manufacturable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parentLinks?: ItemCompositionUpdateManyWithoutParentItemNestedInput
    componentLinks?: ItemCompositionUpdateManyWithoutComponentItemNestedInput
    supplierMappings?: SupplierItemMappingUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateWithoutPrimaryCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    structureType?: EnumItemStructureTypeFieldUpdateOperationsInput | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFieldUpdateOperationsInput | $Enums.ItemNatureType
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    sellable?: BoolFieldUpdateOperationsInput | boolean
    purchasable?: BoolFieldUpdateOperationsInput | boolean
    stockable?: BoolFieldUpdateOperationsInput | boolean
    manufacturable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    parentLinks?: ItemCompositionUncheckedUpdateManyWithoutParentItemNestedInput
    componentLinks?: ItemCompositionUncheckedUpdateManyWithoutComponentItemNestedInput
    supplierMappings?: SupplierItemMappingUncheckedUpdateManyWithoutItemNestedInput
  }

  export type ItemUncheckedUpdateManyWithoutPrimaryCategoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    itemCode?: StringFieldUpdateOperationsInput | string
    itemName?: StringFieldUpdateOperationsInput | string
    structureType?: EnumItemStructureTypeFieldUpdateOperationsInput | $Enums.ItemStructureType
    natureType?: EnumItemNatureTypeFieldUpdateOperationsInput | $Enums.ItemNatureType
    status?: EnumItemStatusFieldUpdateOperationsInput | $Enums.ItemStatus
    sellable?: BoolFieldUpdateOperationsInput | boolean
    purchasable?: BoolFieldUpdateOperationsInput | boolean
    stockable?: BoolFieldUpdateOperationsInput | boolean
    manufacturable?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}