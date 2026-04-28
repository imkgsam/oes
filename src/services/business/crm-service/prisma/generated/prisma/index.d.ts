
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
 * Model CrmSequenceCounter
 * 
 */
export type CrmSequenceCounter = $Result.DefaultSelection<Prisma.$CrmSequenceCounterPayload>
/**
 * Model CustomerAccount
 * 
 */
export type CustomerAccount = $Result.DefaultSelection<Prisma.$CustomerAccountPayload>
/**
 * Model CustomerPartyBinding
 * 
 */
export type CustomerPartyBinding = $Result.DefaultSelection<Prisma.$CustomerPartyBindingPayload>
/**
 * Model CustomerContact
 * 
 */
export type CustomerContact = $Result.DefaultSelection<Prisma.$CustomerContactPayload>
/**
 * Model CustomerAddress
 * 
 */
export type CustomerAddress = $Result.DefaultSelection<Prisma.$CustomerAddressPayload>
/**
 * Model CrmAuditEnvelope
 * 
 */
export type CrmAuditEnvelope = $Result.DefaultSelection<Prisma.$CrmAuditEnvelopePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const CrmCustomerStatus: {
  ACTIVE_CUSTOMER: 'ACTIVE_CUSTOMER',
  BLOCKED: 'BLOCKED',
  ARCHIVED: 'ARCHIVED'
};

export type CrmCustomerStatus = (typeof CrmCustomerStatus)[keyof typeof CrmCustomerStatus]


export const CrmCustomerPartyBindingStatus: {
  ACTIVE_PRIMARY: 'ACTIVE_PRIMARY'
};

export type CrmCustomerPartyBindingStatus = (typeof CrmCustomerPartyBindingStatus)[keyof typeof CrmCustomerPartyBindingStatus]

}

export type CrmCustomerStatus = $Enums.CrmCustomerStatus

export const CrmCustomerStatus: typeof $Enums.CrmCustomerStatus

export type CrmCustomerPartyBindingStatus = $Enums.CrmCustomerPartyBindingStatus

export const CrmCustomerPartyBindingStatus: typeof $Enums.CrmCustomerPartyBindingStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more CrmSequenceCounters
 * const crmSequenceCounters = await prisma.crmSequenceCounter.findMany()
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
   * // Fetch zero or more CrmSequenceCounters
   * const crmSequenceCounters = await prisma.crmSequenceCounter.findMany()
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
   * `prisma.crmSequenceCounter`: Exposes CRUD operations for the **CrmSequenceCounter** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CrmSequenceCounters
    * const crmSequenceCounters = await prisma.crmSequenceCounter.findMany()
    * ```
    */
  get crmSequenceCounter(): Prisma.CrmSequenceCounterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.customerAccount`: Exposes CRUD operations for the **CustomerAccount** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CustomerAccounts
    * const customerAccounts = await prisma.customerAccount.findMany()
    * ```
    */
  get customerAccount(): Prisma.CustomerAccountDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.customerPartyBinding`: Exposes CRUD operations for the **CustomerPartyBinding** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CustomerPartyBindings
    * const customerPartyBindings = await prisma.customerPartyBinding.findMany()
    * ```
    */
  get customerPartyBinding(): Prisma.CustomerPartyBindingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.customerContact`: Exposes CRUD operations for the **CustomerContact** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CustomerContacts
    * const customerContacts = await prisma.customerContact.findMany()
    * ```
    */
  get customerContact(): Prisma.CustomerContactDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.customerAddress`: Exposes CRUD operations for the **CustomerAddress** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CustomerAddresses
    * const customerAddresses = await prisma.customerAddress.findMany()
    * ```
    */
  get customerAddress(): Prisma.CustomerAddressDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.crmAuditEnvelope`: Exposes CRUD operations for the **CrmAuditEnvelope** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CrmAuditEnvelopes
    * const crmAuditEnvelopes = await prisma.crmAuditEnvelope.findMany()
    * ```
    */
  get crmAuditEnvelope(): Prisma.CrmAuditEnvelopeDelegate<ExtArgs, ClientOptions>;
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
    CrmSequenceCounter: 'CrmSequenceCounter',
    CustomerAccount: 'CustomerAccount',
    CustomerPartyBinding: 'CustomerPartyBinding',
    CustomerContact: 'CustomerContact',
    CustomerAddress: 'CustomerAddress',
    CrmAuditEnvelope: 'CrmAuditEnvelope'
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
      modelProps: "crmSequenceCounter" | "customerAccount" | "customerPartyBinding" | "customerContact" | "customerAddress" | "crmAuditEnvelope"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      CrmSequenceCounter: {
        payload: Prisma.$CrmSequenceCounterPayload<ExtArgs>
        fields: Prisma.CrmSequenceCounterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CrmSequenceCounterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmSequenceCounterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CrmSequenceCounterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmSequenceCounterPayload>
          }
          findFirst: {
            args: Prisma.CrmSequenceCounterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmSequenceCounterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CrmSequenceCounterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmSequenceCounterPayload>
          }
          findMany: {
            args: Prisma.CrmSequenceCounterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmSequenceCounterPayload>[]
          }
          create: {
            args: Prisma.CrmSequenceCounterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmSequenceCounterPayload>
          }
          createMany: {
            args: Prisma.CrmSequenceCounterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CrmSequenceCounterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmSequenceCounterPayload>[]
          }
          delete: {
            args: Prisma.CrmSequenceCounterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmSequenceCounterPayload>
          }
          update: {
            args: Prisma.CrmSequenceCounterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmSequenceCounterPayload>
          }
          deleteMany: {
            args: Prisma.CrmSequenceCounterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CrmSequenceCounterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CrmSequenceCounterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmSequenceCounterPayload>[]
          }
          upsert: {
            args: Prisma.CrmSequenceCounterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmSequenceCounterPayload>
          }
          aggregate: {
            args: Prisma.CrmSequenceCounterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCrmSequenceCounter>
          }
          groupBy: {
            args: Prisma.CrmSequenceCounterGroupByArgs<ExtArgs>
            result: $Utils.Optional<CrmSequenceCounterGroupByOutputType>[]
          }
          count: {
            args: Prisma.CrmSequenceCounterCountArgs<ExtArgs>
            result: $Utils.Optional<CrmSequenceCounterCountAggregateOutputType> | number
          }
        }
      }
      CustomerAccount: {
        payload: Prisma.$CustomerAccountPayload<ExtArgs>
        fields: Prisma.CustomerAccountFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CustomerAccountFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAccountPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CustomerAccountFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAccountPayload>
          }
          findFirst: {
            args: Prisma.CustomerAccountFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAccountPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CustomerAccountFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAccountPayload>
          }
          findMany: {
            args: Prisma.CustomerAccountFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAccountPayload>[]
          }
          create: {
            args: Prisma.CustomerAccountCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAccountPayload>
          }
          createMany: {
            args: Prisma.CustomerAccountCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CustomerAccountCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAccountPayload>[]
          }
          delete: {
            args: Prisma.CustomerAccountDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAccountPayload>
          }
          update: {
            args: Prisma.CustomerAccountUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAccountPayload>
          }
          deleteMany: {
            args: Prisma.CustomerAccountDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CustomerAccountUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CustomerAccountUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAccountPayload>[]
          }
          upsert: {
            args: Prisma.CustomerAccountUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAccountPayload>
          }
          aggregate: {
            args: Prisma.CustomerAccountAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCustomerAccount>
          }
          groupBy: {
            args: Prisma.CustomerAccountGroupByArgs<ExtArgs>
            result: $Utils.Optional<CustomerAccountGroupByOutputType>[]
          }
          count: {
            args: Prisma.CustomerAccountCountArgs<ExtArgs>
            result: $Utils.Optional<CustomerAccountCountAggregateOutputType> | number
          }
        }
      }
      CustomerPartyBinding: {
        payload: Prisma.$CustomerPartyBindingPayload<ExtArgs>
        fields: Prisma.CustomerPartyBindingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CustomerPartyBindingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPartyBindingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CustomerPartyBindingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPartyBindingPayload>
          }
          findFirst: {
            args: Prisma.CustomerPartyBindingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPartyBindingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CustomerPartyBindingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPartyBindingPayload>
          }
          findMany: {
            args: Prisma.CustomerPartyBindingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPartyBindingPayload>[]
          }
          create: {
            args: Prisma.CustomerPartyBindingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPartyBindingPayload>
          }
          createMany: {
            args: Prisma.CustomerPartyBindingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CustomerPartyBindingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPartyBindingPayload>[]
          }
          delete: {
            args: Prisma.CustomerPartyBindingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPartyBindingPayload>
          }
          update: {
            args: Prisma.CustomerPartyBindingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPartyBindingPayload>
          }
          deleteMany: {
            args: Prisma.CustomerPartyBindingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CustomerPartyBindingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CustomerPartyBindingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPartyBindingPayload>[]
          }
          upsert: {
            args: Prisma.CustomerPartyBindingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPartyBindingPayload>
          }
          aggregate: {
            args: Prisma.CustomerPartyBindingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCustomerPartyBinding>
          }
          groupBy: {
            args: Prisma.CustomerPartyBindingGroupByArgs<ExtArgs>
            result: $Utils.Optional<CustomerPartyBindingGroupByOutputType>[]
          }
          count: {
            args: Prisma.CustomerPartyBindingCountArgs<ExtArgs>
            result: $Utils.Optional<CustomerPartyBindingCountAggregateOutputType> | number
          }
        }
      }
      CustomerContact: {
        payload: Prisma.$CustomerContactPayload<ExtArgs>
        fields: Prisma.CustomerContactFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CustomerContactFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerContactPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CustomerContactFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerContactPayload>
          }
          findFirst: {
            args: Prisma.CustomerContactFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerContactPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CustomerContactFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerContactPayload>
          }
          findMany: {
            args: Prisma.CustomerContactFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerContactPayload>[]
          }
          create: {
            args: Prisma.CustomerContactCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerContactPayload>
          }
          createMany: {
            args: Prisma.CustomerContactCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CustomerContactCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerContactPayload>[]
          }
          delete: {
            args: Prisma.CustomerContactDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerContactPayload>
          }
          update: {
            args: Prisma.CustomerContactUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerContactPayload>
          }
          deleteMany: {
            args: Prisma.CustomerContactDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CustomerContactUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CustomerContactUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerContactPayload>[]
          }
          upsert: {
            args: Prisma.CustomerContactUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerContactPayload>
          }
          aggregate: {
            args: Prisma.CustomerContactAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCustomerContact>
          }
          groupBy: {
            args: Prisma.CustomerContactGroupByArgs<ExtArgs>
            result: $Utils.Optional<CustomerContactGroupByOutputType>[]
          }
          count: {
            args: Prisma.CustomerContactCountArgs<ExtArgs>
            result: $Utils.Optional<CustomerContactCountAggregateOutputType> | number
          }
        }
      }
      CustomerAddress: {
        payload: Prisma.$CustomerAddressPayload<ExtArgs>
        fields: Prisma.CustomerAddressFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CustomerAddressFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAddressPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CustomerAddressFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAddressPayload>
          }
          findFirst: {
            args: Prisma.CustomerAddressFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAddressPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CustomerAddressFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAddressPayload>
          }
          findMany: {
            args: Prisma.CustomerAddressFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAddressPayload>[]
          }
          create: {
            args: Prisma.CustomerAddressCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAddressPayload>
          }
          createMany: {
            args: Prisma.CustomerAddressCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CustomerAddressCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAddressPayload>[]
          }
          delete: {
            args: Prisma.CustomerAddressDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAddressPayload>
          }
          update: {
            args: Prisma.CustomerAddressUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAddressPayload>
          }
          deleteMany: {
            args: Prisma.CustomerAddressDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CustomerAddressUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CustomerAddressUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAddressPayload>[]
          }
          upsert: {
            args: Prisma.CustomerAddressUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerAddressPayload>
          }
          aggregate: {
            args: Prisma.CustomerAddressAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCustomerAddress>
          }
          groupBy: {
            args: Prisma.CustomerAddressGroupByArgs<ExtArgs>
            result: $Utils.Optional<CustomerAddressGroupByOutputType>[]
          }
          count: {
            args: Prisma.CustomerAddressCountArgs<ExtArgs>
            result: $Utils.Optional<CustomerAddressCountAggregateOutputType> | number
          }
        }
      }
      CrmAuditEnvelope: {
        payload: Prisma.$CrmAuditEnvelopePayload<ExtArgs>
        fields: Prisma.CrmAuditEnvelopeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CrmAuditEnvelopeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmAuditEnvelopePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CrmAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmAuditEnvelopePayload>
          }
          findFirst: {
            args: Prisma.CrmAuditEnvelopeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmAuditEnvelopePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CrmAuditEnvelopeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmAuditEnvelopePayload>
          }
          findMany: {
            args: Prisma.CrmAuditEnvelopeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmAuditEnvelopePayload>[]
          }
          create: {
            args: Prisma.CrmAuditEnvelopeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmAuditEnvelopePayload>
          }
          createMany: {
            args: Prisma.CrmAuditEnvelopeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CrmAuditEnvelopeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmAuditEnvelopePayload>[]
          }
          delete: {
            args: Prisma.CrmAuditEnvelopeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmAuditEnvelopePayload>
          }
          update: {
            args: Prisma.CrmAuditEnvelopeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmAuditEnvelopePayload>
          }
          deleteMany: {
            args: Prisma.CrmAuditEnvelopeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CrmAuditEnvelopeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CrmAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmAuditEnvelopePayload>[]
          }
          upsert: {
            args: Prisma.CrmAuditEnvelopeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CrmAuditEnvelopePayload>
          }
          aggregate: {
            args: Prisma.CrmAuditEnvelopeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCrmAuditEnvelope>
          }
          groupBy: {
            args: Prisma.CrmAuditEnvelopeGroupByArgs<ExtArgs>
            result: $Utils.Optional<CrmAuditEnvelopeGroupByOutputType>[]
          }
          count: {
            args: Prisma.CrmAuditEnvelopeCountArgs<ExtArgs>
            result: $Utils.Optional<CrmAuditEnvelopeCountAggregateOutputType> | number
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
    crmSequenceCounter?: CrmSequenceCounterOmit
    customerAccount?: CustomerAccountOmit
    customerPartyBinding?: CustomerPartyBindingOmit
    customerContact?: CustomerContactOmit
    customerAddress?: CustomerAddressOmit
    crmAuditEnvelope?: CrmAuditEnvelopeOmit
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
   * Count Type CustomerAccountCountOutputType
   */

  export type CustomerAccountCountOutputType = {
    contacts: number
    addresses: number
  }

  export type CustomerAccountCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    contacts?: boolean | CustomerAccountCountOutputTypeCountContactsArgs
    addresses?: boolean | CustomerAccountCountOutputTypeCountAddressesArgs
  }

  // Custom InputTypes
  /**
   * CustomerAccountCountOutputType without action
   */
  export type CustomerAccountCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAccountCountOutputType
     */
    select?: CustomerAccountCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CustomerAccountCountOutputType without action
   */
  export type CustomerAccountCountOutputTypeCountContactsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CustomerContactWhereInput
  }

  /**
   * CustomerAccountCountOutputType without action
   */
  export type CustomerAccountCountOutputTypeCountAddressesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CustomerAddressWhereInput
  }


  /**
   * Models
   */

  /**
   * Model CrmSequenceCounter
   */

  export type AggregateCrmSequenceCounter = {
    _count: CrmSequenceCounterCountAggregateOutputType | null
    _avg: CrmSequenceCounterAvgAggregateOutputType | null
    _sum: CrmSequenceCounterSumAggregateOutputType | null
    _min: CrmSequenceCounterMinAggregateOutputType | null
    _max: CrmSequenceCounterMaxAggregateOutputType | null
  }

  export type CrmSequenceCounterAvgAggregateOutputType = {
    nextCustomerAccountNo: number | null
  }

  export type CrmSequenceCounterSumAggregateOutputType = {
    nextCustomerAccountNo: number | null
  }

  export type CrmSequenceCounterMinAggregateOutputType = {
    tenantId: string | null
    nextCustomerAccountNo: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CrmSequenceCounterMaxAggregateOutputType = {
    tenantId: string | null
    nextCustomerAccountNo: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CrmSequenceCounterCountAggregateOutputType = {
    tenantId: number
    nextCustomerAccountNo: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CrmSequenceCounterAvgAggregateInputType = {
    nextCustomerAccountNo?: true
  }

  export type CrmSequenceCounterSumAggregateInputType = {
    nextCustomerAccountNo?: true
  }

  export type CrmSequenceCounterMinAggregateInputType = {
    tenantId?: true
    nextCustomerAccountNo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CrmSequenceCounterMaxAggregateInputType = {
    tenantId?: true
    nextCustomerAccountNo?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CrmSequenceCounterCountAggregateInputType = {
    tenantId?: true
    nextCustomerAccountNo?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CrmSequenceCounterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CrmSequenceCounter to aggregate.
     */
    where?: CrmSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrmSequenceCounters to fetch.
     */
    orderBy?: CrmSequenceCounterOrderByWithRelationInput | CrmSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CrmSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrmSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrmSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CrmSequenceCounters
    **/
    _count?: true | CrmSequenceCounterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CrmSequenceCounterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CrmSequenceCounterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CrmSequenceCounterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CrmSequenceCounterMaxAggregateInputType
  }

  export type GetCrmSequenceCounterAggregateType<T extends CrmSequenceCounterAggregateArgs> = {
        [P in keyof T & keyof AggregateCrmSequenceCounter]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCrmSequenceCounter[P]>
      : GetScalarType<T[P], AggregateCrmSequenceCounter[P]>
  }




  export type CrmSequenceCounterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CrmSequenceCounterWhereInput
    orderBy?: CrmSequenceCounterOrderByWithAggregationInput | CrmSequenceCounterOrderByWithAggregationInput[]
    by: CrmSequenceCounterScalarFieldEnum[] | CrmSequenceCounterScalarFieldEnum
    having?: CrmSequenceCounterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CrmSequenceCounterCountAggregateInputType | true
    _avg?: CrmSequenceCounterAvgAggregateInputType
    _sum?: CrmSequenceCounterSumAggregateInputType
    _min?: CrmSequenceCounterMinAggregateInputType
    _max?: CrmSequenceCounterMaxAggregateInputType
  }

  export type CrmSequenceCounterGroupByOutputType = {
    tenantId: string
    nextCustomerAccountNo: number
    createdAt: Date
    updatedAt: Date
    _count: CrmSequenceCounterCountAggregateOutputType | null
    _avg: CrmSequenceCounterAvgAggregateOutputType | null
    _sum: CrmSequenceCounterSumAggregateOutputType | null
    _min: CrmSequenceCounterMinAggregateOutputType | null
    _max: CrmSequenceCounterMaxAggregateOutputType | null
  }

  type GetCrmSequenceCounterGroupByPayload<T extends CrmSequenceCounterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CrmSequenceCounterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CrmSequenceCounterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CrmSequenceCounterGroupByOutputType[P]>
            : GetScalarType<T[P], CrmSequenceCounterGroupByOutputType[P]>
        }
      >
    >


  export type CrmSequenceCounterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextCustomerAccountNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["crmSequenceCounter"]>

  export type CrmSequenceCounterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextCustomerAccountNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["crmSequenceCounter"]>

  export type CrmSequenceCounterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    tenantId?: boolean
    nextCustomerAccountNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["crmSequenceCounter"]>

  export type CrmSequenceCounterSelectScalar = {
    tenantId?: boolean
    nextCustomerAccountNo?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CrmSequenceCounterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"tenantId" | "nextCustomerAccountNo" | "createdAt" | "updatedAt", ExtArgs["result"]["crmSequenceCounter"]>

  export type $CrmSequenceCounterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CrmSequenceCounter"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      tenantId: string
      nextCustomerAccountNo: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["crmSequenceCounter"]>
    composites: {}
  }

  type CrmSequenceCounterGetPayload<S extends boolean | null | undefined | CrmSequenceCounterDefaultArgs> = $Result.GetResult<Prisma.$CrmSequenceCounterPayload, S>

  type CrmSequenceCounterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CrmSequenceCounterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CrmSequenceCounterCountAggregateInputType | true
    }

  export interface CrmSequenceCounterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CrmSequenceCounter'], meta: { name: 'CrmSequenceCounter' } }
    /**
     * Find zero or one CrmSequenceCounter that matches the filter.
     * @param {CrmSequenceCounterFindUniqueArgs} args - Arguments to find a CrmSequenceCounter
     * @example
     * // Get one CrmSequenceCounter
     * const crmSequenceCounter = await prisma.crmSequenceCounter.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CrmSequenceCounterFindUniqueArgs>(args: SelectSubset<T, CrmSequenceCounterFindUniqueArgs<ExtArgs>>): Prisma__CrmSequenceCounterClient<$Result.GetResult<Prisma.$CrmSequenceCounterPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one CrmSequenceCounter that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CrmSequenceCounterFindUniqueOrThrowArgs} args - Arguments to find a CrmSequenceCounter
     * @example
     * // Get one CrmSequenceCounter
     * const crmSequenceCounter = await prisma.crmSequenceCounter.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CrmSequenceCounterFindUniqueOrThrowArgs>(args: SelectSubset<T, CrmSequenceCounterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CrmSequenceCounterClient<$Result.GetResult<Prisma.$CrmSequenceCounterPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first CrmSequenceCounter that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmSequenceCounterFindFirstArgs} args - Arguments to find a CrmSequenceCounter
     * @example
     * // Get one CrmSequenceCounter
     * const crmSequenceCounter = await prisma.crmSequenceCounter.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CrmSequenceCounterFindFirstArgs>(args?: SelectSubset<T, CrmSequenceCounterFindFirstArgs<ExtArgs>>): Prisma__CrmSequenceCounterClient<$Result.GetResult<Prisma.$CrmSequenceCounterPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first CrmSequenceCounter that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmSequenceCounterFindFirstOrThrowArgs} args - Arguments to find a CrmSequenceCounter
     * @example
     * // Get one CrmSequenceCounter
     * const crmSequenceCounter = await prisma.crmSequenceCounter.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CrmSequenceCounterFindFirstOrThrowArgs>(args?: SelectSubset<T, CrmSequenceCounterFindFirstOrThrowArgs<ExtArgs>>): Prisma__CrmSequenceCounterClient<$Result.GetResult<Prisma.$CrmSequenceCounterPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more CrmSequenceCounters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmSequenceCounterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CrmSequenceCounters
     * const crmSequenceCounters = await prisma.crmSequenceCounter.findMany()
     * 
     * // Get first 10 CrmSequenceCounters
     * const crmSequenceCounters = await prisma.crmSequenceCounter.findMany({ take: 10 })
     * 
     * // Only select the `tenantId`
     * const crmSequenceCounterWithTenantIdOnly = await prisma.crmSequenceCounter.findMany({ select: { tenantId: true } })
     * 
     */
    findMany<T extends CrmSequenceCounterFindManyArgs>(args?: SelectSubset<T, CrmSequenceCounterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrmSequenceCounterPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a CrmSequenceCounter.
     * @param {CrmSequenceCounterCreateArgs} args - Arguments to create a CrmSequenceCounter.
     * @example
     * // Create one CrmSequenceCounter
     * const CrmSequenceCounter = await prisma.crmSequenceCounter.create({
     *   data: {
     *     // ... data to create a CrmSequenceCounter
     *   }
     * })
     * 
     */
    create<T extends CrmSequenceCounterCreateArgs>(args: SelectSubset<T, CrmSequenceCounterCreateArgs<ExtArgs>>): Prisma__CrmSequenceCounterClient<$Result.GetResult<Prisma.$CrmSequenceCounterPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many CrmSequenceCounters.
     * @param {CrmSequenceCounterCreateManyArgs} args - Arguments to create many CrmSequenceCounters.
     * @example
     * // Create many CrmSequenceCounters
     * const crmSequenceCounter = await prisma.crmSequenceCounter.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CrmSequenceCounterCreateManyArgs>(args?: SelectSubset<T, CrmSequenceCounterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CrmSequenceCounters and returns the data saved in the database.
     * @param {CrmSequenceCounterCreateManyAndReturnArgs} args - Arguments to create many CrmSequenceCounters.
     * @example
     * // Create many CrmSequenceCounters
     * const crmSequenceCounter = await prisma.crmSequenceCounter.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CrmSequenceCounters and only return the `tenantId`
     * const crmSequenceCounterWithTenantIdOnly = await prisma.crmSequenceCounter.createManyAndReturn({
     *   select: { tenantId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CrmSequenceCounterCreateManyAndReturnArgs>(args?: SelectSubset<T, CrmSequenceCounterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrmSequenceCounterPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a CrmSequenceCounter.
     * @param {CrmSequenceCounterDeleteArgs} args - Arguments to delete one CrmSequenceCounter.
     * @example
     * // Delete one CrmSequenceCounter
     * const CrmSequenceCounter = await prisma.crmSequenceCounter.delete({
     *   where: {
     *     // ... filter to delete one CrmSequenceCounter
     *   }
     * })
     * 
     */
    delete<T extends CrmSequenceCounterDeleteArgs>(args: SelectSubset<T, CrmSequenceCounterDeleteArgs<ExtArgs>>): Prisma__CrmSequenceCounterClient<$Result.GetResult<Prisma.$CrmSequenceCounterPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one CrmSequenceCounter.
     * @param {CrmSequenceCounterUpdateArgs} args - Arguments to update one CrmSequenceCounter.
     * @example
     * // Update one CrmSequenceCounter
     * const crmSequenceCounter = await prisma.crmSequenceCounter.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CrmSequenceCounterUpdateArgs>(args: SelectSubset<T, CrmSequenceCounterUpdateArgs<ExtArgs>>): Prisma__CrmSequenceCounterClient<$Result.GetResult<Prisma.$CrmSequenceCounterPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more CrmSequenceCounters.
     * @param {CrmSequenceCounterDeleteManyArgs} args - Arguments to filter CrmSequenceCounters to delete.
     * @example
     * // Delete a few CrmSequenceCounters
     * const { count } = await prisma.crmSequenceCounter.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CrmSequenceCounterDeleteManyArgs>(args?: SelectSubset<T, CrmSequenceCounterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CrmSequenceCounters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmSequenceCounterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CrmSequenceCounters
     * const crmSequenceCounter = await prisma.crmSequenceCounter.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CrmSequenceCounterUpdateManyArgs>(args: SelectSubset<T, CrmSequenceCounterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CrmSequenceCounters and returns the data updated in the database.
     * @param {CrmSequenceCounterUpdateManyAndReturnArgs} args - Arguments to update many CrmSequenceCounters.
     * @example
     * // Update many CrmSequenceCounters
     * const crmSequenceCounter = await prisma.crmSequenceCounter.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CrmSequenceCounters and only return the `tenantId`
     * const crmSequenceCounterWithTenantIdOnly = await prisma.crmSequenceCounter.updateManyAndReturn({
     *   select: { tenantId: true },
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
    updateManyAndReturn<T extends CrmSequenceCounterUpdateManyAndReturnArgs>(args: SelectSubset<T, CrmSequenceCounterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrmSequenceCounterPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one CrmSequenceCounter.
     * @param {CrmSequenceCounterUpsertArgs} args - Arguments to update or create a CrmSequenceCounter.
     * @example
     * // Update or create a CrmSequenceCounter
     * const crmSequenceCounter = await prisma.crmSequenceCounter.upsert({
     *   create: {
     *     // ... data to create a CrmSequenceCounter
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CrmSequenceCounter we want to update
     *   }
     * })
     */
    upsert<T extends CrmSequenceCounterUpsertArgs>(args: SelectSubset<T, CrmSequenceCounterUpsertArgs<ExtArgs>>): Prisma__CrmSequenceCounterClient<$Result.GetResult<Prisma.$CrmSequenceCounterPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of CrmSequenceCounters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmSequenceCounterCountArgs} args - Arguments to filter CrmSequenceCounters to count.
     * @example
     * // Count the number of CrmSequenceCounters
     * const count = await prisma.crmSequenceCounter.count({
     *   where: {
     *     // ... the filter for the CrmSequenceCounters we want to count
     *   }
     * })
    **/
    count<T extends CrmSequenceCounterCountArgs>(
      args?: Subset<T, CrmSequenceCounterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CrmSequenceCounterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CrmSequenceCounter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmSequenceCounterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CrmSequenceCounterAggregateArgs>(args: Subset<T, CrmSequenceCounterAggregateArgs>): Prisma.PrismaPromise<GetCrmSequenceCounterAggregateType<T>>

    /**
     * Group by CrmSequenceCounter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmSequenceCounterGroupByArgs} args - Group by arguments.
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
      T extends CrmSequenceCounterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CrmSequenceCounterGroupByArgs['orderBy'] }
        : { orderBy?: CrmSequenceCounterGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CrmSequenceCounterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCrmSequenceCounterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CrmSequenceCounter model
   */
  readonly fields: CrmSequenceCounterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CrmSequenceCounter.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CrmSequenceCounterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the CrmSequenceCounter model
   */ 
  interface CrmSequenceCounterFieldRefs {
    readonly tenantId: FieldRef<"CrmSequenceCounter", 'String'>
    readonly nextCustomerAccountNo: FieldRef<"CrmSequenceCounter", 'Int'>
    readonly createdAt: FieldRef<"CrmSequenceCounter", 'DateTime'>
    readonly updatedAt: FieldRef<"CrmSequenceCounter", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CrmSequenceCounter findUnique
   */
  export type CrmSequenceCounterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmSequenceCounter
     */
    select?: CrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmSequenceCounter
     */
    omit?: CrmSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which CrmSequenceCounter to fetch.
     */
    where: CrmSequenceCounterWhereUniqueInput
  }

  /**
   * CrmSequenceCounter findUniqueOrThrow
   */
  export type CrmSequenceCounterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmSequenceCounter
     */
    select?: CrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmSequenceCounter
     */
    omit?: CrmSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which CrmSequenceCounter to fetch.
     */
    where: CrmSequenceCounterWhereUniqueInput
  }

  /**
   * CrmSequenceCounter findFirst
   */
  export type CrmSequenceCounterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmSequenceCounter
     */
    select?: CrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmSequenceCounter
     */
    omit?: CrmSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which CrmSequenceCounter to fetch.
     */
    where?: CrmSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrmSequenceCounters to fetch.
     */
    orderBy?: CrmSequenceCounterOrderByWithRelationInput | CrmSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CrmSequenceCounters.
     */
    cursor?: CrmSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrmSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrmSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CrmSequenceCounters.
     */
    distinct?: CrmSequenceCounterScalarFieldEnum | CrmSequenceCounterScalarFieldEnum[]
  }

  /**
   * CrmSequenceCounter findFirstOrThrow
   */
  export type CrmSequenceCounterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmSequenceCounter
     */
    select?: CrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmSequenceCounter
     */
    omit?: CrmSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which CrmSequenceCounter to fetch.
     */
    where?: CrmSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrmSequenceCounters to fetch.
     */
    orderBy?: CrmSequenceCounterOrderByWithRelationInput | CrmSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CrmSequenceCounters.
     */
    cursor?: CrmSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrmSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrmSequenceCounters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CrmSequenceCounters.
     */
    distinct?: CrmSequenceCounterScalarFieldEnum | CrmSequenceCounterScalarFieldEnum[]
  }

  /**
   * CrmSequenceCounter findMany
   */
  export type CrmSequenceCounterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmSequenceCounter
     */
    select?: CrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmSequenceCounter
     */
    omit?: CrmSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter, which CrmSequenceCounters to fetch.
     */
    where?: CrmSequenceCounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrmSequenceCounters to fetch.
     */
    orderBy?: CrmSequenceCounterOrderByWithRelationInput | CrmSequenceCounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CrmSequenceCounters.
     */
    cursor?: CrmSequenceCounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrmSequenceCounters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrmSequenceCounters.
     */
    skip?: number
    distinct?: CrmSequenceCounterScalarFieldEnum | CrmSequenceCounterScalarFieldEnum[]
  }

  /**
   * CrmSequenceCounter create
   */
  export type CrmSequenceCounterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmSequenceCounter
     */
    select?: CrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmSequenceCounter
     */
    omit?: CrmSequenceCounterOmit<ExtArgs> | null
    /**
     * The data needed to create a CrmSequenceCounter.
     */
    data: XOR<CrmSequenceCounterCreateInput, CrmSequenceCounterUncheckedCreateInput>
  }

  /**
   * CrmSequenceCounter createMany
   */
  export type CrmSequenceCounterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CrmSequenceCounters.
     */
    data: CrmSequenceCounterCreateManyInput | CrmSequenceCounterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CrmSequenceCounter createManyAndReturn
   */
  export type CrmSequenceCounterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmSequenceCounter
     */
    select?: CrmSequenceCounterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CrmSequenceCounter
     */
    omit?: CrmSequenceCounterOmit<ExtArgs> | null
    /**
     * The data used to create many CrmSequenceCounters.
     */
    data: CrmSequenceCounterCreateManyInput | CrmSequenceCounterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CrmSequenceCounter update
   */
  export type CrmSequenceCounterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmSequenceCounter
     */
    select?: CrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmSequenceCounter
     */
    omit?: CrmSequenceCounterOmit<ExtArgs> | null
    /**
     * The data needed to update a CrmSequenceCounter.
     */
    data: XOR<CrmSequenceCounterUpdateInput, CrmSequenceCounterUncheckedUpdateInput>
    /**
     * Choose, which CrmSequenceCounter to update.
     */
    where: CrmSequenceCounterWhereUniqueInput
  }

  /**
   * CrmSequenceCounter updateMany
   */
  export type CrmSequenceCounterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CrmSequenceCounters.
     */
    data: XOR<CrmSequenceCounterUpdateManyMutationInput, CrmSequenceCounterUncheckedUpdateManyInput>
    /**
     * Filter which CrmSequenceCounters to update
     */
    where?: CrmSequenceCounterWhereInput
    /**
     * Limit how many CrmSequenceCounters to update.
     */
    limit?: number
  }

  /**
   * CrmSequenceCounter updateManyAndReturn
   */
  export type CrmSequenceCounterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmSequenceCounter
     */
    select?: CrmSequenceCounterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CrmSequenceCounter
     */
    omit?: CrmSequenceCounterOmit<ExtArgs> | null
    /**
     * The data used to update CrmSequenceCounters.
     */
    data: XOR<CrmSequenceCounterUpdateManyMutationInput, CrmSequenceCounterUncheckedUpdateManyInput>
    /**
     * Filter which CrmSequenceCounters to update
     */
    where?: CrmSequenceCounterWhereInput
    /**
     * Limit how many CrmSequenceCounters to update.
     */
    limit?: number
  }

  /**
   * CrmSequenceCounter upsert
   */
  export type CrmSequenceCounterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmSequenceCounter
     */
    select?: CrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmSequenceCounter
     */
    omit?: CrmSequenceCounterOmit<ExtArgs> | null
    /**
     * The filter to search for the CrmSequenceCounter to update in case it exists.
     */
    where: CrmSequenceCounterWhereUniqueInput
    /**
     * In case the CrmSequenceCounter found by the `where` argument doesn't exist, create a new CrmSequenceCounter with this data.
     */
    create: XOR<CrmSequenceCounterCreateInput, CrmSequenceCounterUncheckedCreateInput>
    /**
     * In case the CrmSequenceCounter was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CrmSequenceCounterUpdateInput, CrmSequenceCounterUncheckedUpdateInput>
  }

  /**
   * CrmSequenceCounter delete
   */
  export type CrmSequenceCounterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmSequenceCounter
     */
    select?: CrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmSequenceCounter
     */
    omit?: CrmSequenceCounterOmit<ExtArgs> | null
    /**
     * Filter which CrmSequenceCounter to delete.
     */
    where: CrmSequenceCounterWhereUniqueInput
  }

  /**
   * CrmSequenceCounter deleteMany
   */
  export type CrmSequenceCounterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CrmSequenceCounters to delete
     */
    where?: CrmSequenceCounterWhereInput
    /**
     * Limit how many CrmSequenceCounters to delete.
     */
    limit?: number
  }

  /**
   * CrmSequenceCounter without action
   */
  export type CrmSequenceCounterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmSequenceCounter
     */
    select?: CrmSequenceCounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmSequenceCounter
     */
    omit?: CrmSequenceCounterOmit<ExtArgs> | null
  }


  /**
   * Model CustomerAccount
   */

  export type AggregateCustomerAccount = {
    _count: CustomerAccountCountAggregateOutputType | null
    _min: CustomerAccountMinAggregateOutputType | null
    _max: CustomerAccountMaxAggregateOutputType | null
  }

  export type CustomerAccountMinAggregateOutputType = {
    id: string | null
    customerAccountNo: string | null
    tenantId: string | null
    displayName: string | null
    status: $Enums.CrmCustomerStatus | null
    customerCategory: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CustomerAccountMaxAggregateOutputType = {
    id: string | null
    customerAccountNo: string | null
    tenantId: string | null
    displayName: string | null
    status: $Enums.CrmCustomerStatus | null
    customerCategory: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CustomerAccountCountAggregateOutputType = {
    id: number
    customerAccountNo: number
    tenantId: number
    displayName: number
    status: number
    customerCategory: number
    tags: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CustomerAccountMinAggregateInputType = {
    id?: true
    customerAccountNo?: true
    tenantId?: true
    displayName?: true
    status?: true
    customerCategory?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CustomerAccountMaxAggregateInputType = {
    id?: true
    customerAccountNo?: true
    tenantId?: true
    displayName?: true
    status?: true
    customerCategory?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CustomerAccountCountAggregateInputType = {
    id?: true
    customerAccountNo?: true
    tenantId?: true
    displayName?: true
    status?: true
    customerCategory?: true
    tags?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CustomerAccountAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CustomerAccount to aggregate.
     */
    where?: CustomerAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerAccounts to fetch.
     */
    orderBy?: CustomerAccountOrderByWithRelationInput | CustomerAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CustomerAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CustomerAccounts
    **/
    _count?: true | CustomerAccountCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CustomerAccountMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CustomerAccountMaxAggregateInputType
  }

  export type GetCustomerAccountAggregateType<T extends CustomerAccountAggregateArgs> = {
        [P in keyof T & keyof AggregateCustomerAccount]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCustomerAccount[P]>
      : GetScalarType<T[P], AggregateCustomerAccount[P]>
  }




  export type CustomerAccountGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CustomerAccountWhereInput
    orderBy?: CustomerAccountOrderByWithAggregationInput | CustomerAccountOrderByWithAggregationInput[]
    by: CustomerAccountScalarFieldEnum[] | CustomerAccountScalarFieldEnum
    having?: CustomerAccountScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CustomerAccountCountAggregateInputType | true
    _min?: CustomerAccountMinAggregateInputType
    _max?: CustomerAccountMaxAggregateInputType
  }

  export type CustomerAccountGroupByOutputType = {
    id: string
    customerAccountNo: string
    tenantId: string
    displayName: string
    status: $Enums.CrmCustomerStatus
    customerCategory: string | null
    tags: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: CustomerAccountCountAggregateOutputType | null
    _min: CustomerAccountMinAggregateOutputType | null
    _max: CustomerAccountMaxAggregateOutputType | null
  }

  type GetCustomerAccountGroupByPayload<T extends CustomerAccountGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CustomerAccountGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CustomerAccountGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CustomerAccountGroupByOutputType[P]>
            : GetScalarType<T[P], CustomerAccountGroupByOutputType[P]>
        }
      >
    >


  export type CustomerAccountSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    customerAccountNo?: boolean
    tenantId?: boolean
    displayName?: boolean
    status?: boolean
    customerCategory?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    primaryBinding?: boolean | CustomerAccount$primaryBindingArgs<ExtArgs>
    contacts?: boolean | CustomerAccount$contactsArgs<ExtArgs>
    addresses?: boolean | CustomerAccount$addressesArgs<ExtArgs>
    _count?: boolean | CustomerAccountCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["customerAccount"]>

  export type CustomerAccountSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    customerAccountNo?: boolean
    tenantId?: boolean
    displayName?: boolean
    status?: boolean
    customerCategory?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["customerAccount"]>

  export type CustomerAccountSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    customerAccountNo?: boolean
    tenantId?: boolean
    displayName?: boolean
    status?: boolean
    customerCategory?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["customerAccount"]>

  export type CustomerAccountSelectScalar = {
    id?: boolean
    customerAccountNo?: boolean
    tenantId?: boolean
    displayName?: boolean
    status?: boolean
    customerCategory?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CustomerAccountOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "customerAccountNo" | "tenantId" | "displayName" | "status" | "customerCategory" | "tags" | "createdAt" | "updatedAt", ExtArgs["result"]["customerAccount"]>
  export type CustomerAccountInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    primaryBinding?: boolean | CustomerAccount$primaryBindingArgs<ExtArgs>
    contacts?: boolean | CustomerAccount$contactsArgs<ExtArgs>
    addresses?: boolean | CustomerAccount$addressesArgs<ExtArgs>
    _count?: boolean | CustomerAccountCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CustomerAccountIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type CustomerAccountIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CustomerAccountPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CustomerAccount"
    objects: {
      primaryBinding: Prisma.$CustomerPartyBindingPayload<ExtArgs> | null
      contacts: Prisma.$CustomerContactPayload<ExtArgs>[]
      addresses: Prisma.$CustomerAddressPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      customerAccountNo: string
      tenantId: string
      displayName: string
      status: $Enums.CrmCustomerStatus
      customerCategory: string | null
      tags: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["customerAccount"]>
    composites: {}
  }

  type CustomerAccountGetPayload<S extends boolean | null | undefined | CustomerAccountDefaultArgs> = $Result.GetResult<Prisma.$CustomerAccountPayload, S>

  type CustomerAccountCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CustomerAccountFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CustomerAccountCountAggregateInputType | true
    }

  export interface CustomerAccountDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CustomerAccount'], meta: { name: 'CustomerAccount' } }
    /**
     * Find zero or one CustomerAccount that matches the filter.
     * @param {CustomerAccountFindUniqueArgs} args - Arguments to find a CustomerAccount
     * @example
     * // Get one CustomerAccount
     * const customerAccount = await prisma.customerAccount.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CustomerAccountFindUniqueArgs>(args: SelectSubset<T, CustomerAccountFindUniqueArgs<ExtArgs>>): Prisma__CustomerAccountClient<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one CustomerAccount that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CustomerAccountFindUniqueOrThrowArgs} args - Arguments to find a CustomerAccount
     * @example
     * // Get one CustomerAccount
     * const customerAccount = await prisma.customerAccount.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CustomerAccountFindUniqueOrThrowArgs>(args: SelectSubset<T, CustomerAccountFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CustomerAccountClient<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first CustomerAccount that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAccountFindFirstArgs} args - Arguments to find a CustomerAccount
     * @example
     * // Get one CustomerAccount
     * const customerAccount = await prisma.customerAccount.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CustomerAccountFindFirstArgs>(args?: SelectSubset<T, CustomerAccountFindFirstArgs<ExtArgs>>): Prisma__CustomerAccountClient<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first CustomerAccount that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAccountFindFirstOrThrowArgs} args - Arguments to find a CustomerAccount
     * @example
     * // Get one CustomerAccount
     * const customerAccount = await prisma.customerAccount.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CustomerAccountFindFirstOrThrowArgs>(args?: SelectSubset<T, CustomerAccountFindFirstOrThrowArgs<ExtArgs>>): Prisma__CustomerAccountClient<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more CustomerAccounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAccountFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CustomerAccounts
     * const customerAccounts = await prisma.customerAccount.findMany()
     * 
     * // Get first 10 CustomerAccounts
     * const customerAccounts = await prisma.customerAccount.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const customerAccountWithIdOnly = await prisma.customerAccount.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CustomerAccountFindManyArgs>(args?: SelectSubset<T, CustomerAccountFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a CustomerAccount.
     * @param {CustomerAccountCreateArgs} args - Arguments to create a CustomerAccount.
     * @example
     * // Create one CustomerAccount
     * const CustomerAccount = await prisma.customerAccount.create({
     *   data: {
     *     // ... data to create a CustomerAccount
     *   }
     * })
     * 
     */
    create<T extends CustomerAccountCreateArgs>(args: SelectSubset<T, CustomerAccountCreateArgs<ExtArgs>>): Prisma__CustomerAccountClient<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many CustomerAccounts.
     * @param {CustomerAccountCreateManyArgs} args - Arguments to create many CustomerAccounts.
     * @example
     * // Create many CustomerAccounts
     * const customerAccount = await prisma.customerAccount.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CustomerAccountCreateManyArgs>(args?: SelectSubset<T, CustomerAccountCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CustomerAccounts and returns the data saved in the database.
     * @param {CustomerAccountCreateManyAndReturnArgs} args - Arguments to create many CustomerAccounts.
     * @example
     * // Create many CustomerAccounts
     * const customerAccount = await prisma.customerAccount.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CustomerAccounts and only return the `id`
     * const customerAccountWithIdOnly = await prisma.customerAccount.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CustomerAccountCreateManyAndReturnArgs>(args?: SelectSubset<T, CustomerAccountCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a CustomerAccount.
     * @param {CustomerAccountDeleteArgs} args - Arguments to delete one CustomerAccount.
     * @example
     * // Delete one CustomerAccount
     * const CustomerAccount = await prisma.customerAccount.delete({
     *   where: {
     *     // ... filter to delete one CustomerAccount
     *   }
     * })
     * 
     */
    delete<T extends CustomerAccountDeleteArgs>(args: SelectSubset<T, CustomerAccountDeleteArgs<ExtArgs>>): Prisma__CustomerAccountClient<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one CustomerAccount.
     * @param {CustomerAccountUpdateArgs} args - Arguments to update one CustomerAccount.
     * @example
     * // Update one CustomerAccount
     * const customerAccount = await prisma.customerAccount.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CustomerAccountUpdateArgs>(args: SelectSubset<T, CustomerAccountUpdateArgs<ExtArgs>>): Prisma__CustomerAccountClient<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more CustomerAccounts.
     * @param {CustomerAccountDeleteManyArgs} args - Arguments to filter CustomerAccounts to delete.
     * @example
     * // Delete a few CustomerAccounts
     * const { count } = await prisma.customerAccount.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CustomerAccountDeleteManyArgs>(args?: SelectSubset<T, CustomerAccountDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CustomerAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAccountUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CustomerAccounts
     * const customerAccount = await prisma.customerAccount.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CustomerAccountUpdateManyArgs>(args: SelectSubset<T, CustomerAccountUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CustomerAccounts and returns the data updated in the database.
     * @param {CustomerAccountUpdateManyAndReturnArgs} args - Arguments to update many CustomerAccounts.
     * @example
     * // Update many CustomerAccounts
     * const customerAccount = await prisma.customerAccount.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CustomerAccounts and only return the `id`
     * const customerAccountWithIdOnly = await prisma.customerAccount.updateManyAndReturn({
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
    updateManyAndReturn<T extends CustomerAccountUpdateManyAndReturnArgs>(args: SelectSubset<T, CustomerAccountUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one CustomerAccount.
     * @param {CustomerAccountUpsertArgs} args - Arguments to update or create a CustomerAccount.
     * @example
     * // Update or create a CustomerAccount
     * const customerAccount = await prisma.customerAccount.upsert({
     *   create: {
     *     // ... data to create a CustomerAccount
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CustomerAccount we want to update
     *   }
     * })
     */
    upsert<T extends CustomerAccountUpsertArgs>(args: SelectSubset<T, CustomerAccountUpsertArgs<ExtArgs>>): Prisma__CustomerAccountClient<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of CustomerAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAccountCountArgs} args - Arguments to filter CustomerAccounts to count.
     * @example
     * // Count the number of CustomerAccounts
     * const count = await prisma.customerAccount.count({
     *   where: {
     *     // ... the filter for the CustomerAccounts we want to count
     *   }
     * })
    **/
    count<T extends CustomerAccountCountArgs>(
      args?: Subset<T, CustomerAccountCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CustomerAccountCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CustomerAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAccountAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CustomerAccountAggregateArgs>(args: Subset<T, CustomerAccountAggregateArgs>): Prisma.PrismaPromise<GetCustomerAccountAggregateType<T>>

    /**
     * Group by CustomerAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAccountGroupByArgs} args - Group by arguments.
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
      T extends CustomerAccountGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CustomerAccountGroupByArgs['orderBy'] }
        : { orderBy?: CustomerAccountGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CustomerAccountGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCustomerAccountGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CustomerAccount model
   */
  readonly fields: CustomerAccountFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CustomerAccount.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CustomerAccountClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    primaryBinding<T extends CustomerAccount$primaryBindingArgs<ExtArgs> = {}>(args?: Subset<T, CustomerAccount$primaryBindingArgs<ExtArgs>>): Prisma__CustomerPartyBindingClient<$Result.GetResult<Prisma.$CustomerPartyBindingPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | null, null, ExtArgs, ClientOptions>
    contacts<T extends CustomerAccount$contactsArgs<ExtArgs> = {}>(args?: Subset<T, CustomerAccount$contactsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerContactPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
    addresses<T extends CustomerAccount$addressesArgs<ExtArgs> = {}>(args?: Subset<T, CustomerAccount$addressesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerAddressPayload<ExtArgs>, T, "findMany", ClientOptions> | Null>
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
   * Fields of the CustomerAccount model
   */ 
  interface CustomerAccountFieldRefs {
    readonly id: FieldRef<"CustomerAccount", 'String'>
    readonly customerAccountNo: FieldRef<"CustomerAccount", 'String'>
    readonly tenantId: FieldRef<"CustomerAccount", 'String'>
    readonly displayName: FieldRef<"CustomerAccount", 'String'>
    readonly status: FieldRef<"CustomerAccount", 'CrmCustomerStatus'>
    readonly customerCategory: FieldRef<"CustomerAccount", 'String'>
    readonly tags: FieldRef<"CustomerAccount", 'Json'>
    readonly createdAt: FieldRef<"CustomerAccount", 'DateTime'>
    readonly updatedAt: FieldRef<"CustomerAccount", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CustomerAccount findUnique
   */
  export type CustomerAccountFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAccount
     */
    select?: CustomerAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAccount
     */
    omit?: CustomerAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAccountInclude<ExtArgs> | null
    /**
     * Filter, which CustomerAccount to fetch.
     */
    where: CustomerAccountWhereUniqueInput
  }

  /**
   * CustomerAccount findUniqueOrThrow
   */
  export type CustomerAccountFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAccount
     */
    select?: CustomerAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAccount
     */
    omit?: CustomerAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAccountInclude<ExtArgs> | null
    /**
     * Filter, which CustomerAccount to fetch.
     */
    where: CustomerAccountWhereUniqueInput
  }

  /**
   * CustomerAccount findFirst
   */
  export type CustomerAccountFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAccount
     */
    select?: CustomerAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAccount
     */
    omit?: CustomerAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAccountInclude<ExtArgs> | null
    /**
     * Filter, which CustomerAccount to fetch.
     */
    where?: CustomerAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerAccounts to fetch.
     */
    orderBy?: CustomerAccountOrderByWithRelationInput | CustomerAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CustomerAccounts.
     */
    cursor?: CustomerAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CustomerAccounts.
     */
    distinct?: CustomerAccountScalarFieldEnum | CustomerAccountScalarFieldEnum[]
  }

  /**
   * CustomerAccount findFirstOrThrow
   */
  export type CustomerAccountFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAccount
     */
    select?: CustomerAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAccount
     */
    omit?: CustomerAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAccountInclude<ExtArgs> | null
    /**
     * Filter, which CustomerAccount to fetch.
     */
    where?: CustomerAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerAccounts to fetch.
     */
    orderBy?: CustomerAccountOrderByWithRelationInput | CustomerAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CustomerAccounts.
     */
    cursor?: CustomerAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CustomerAccounts.
     */
    distinct?: CustomerAccountScalarFieldEnum | CustomerAccountScalarFieldEnum[]
  }

  /**
   * CustomerAccount findMany
   */
  export type CustomerAccountFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAccount
     */
    select?: CustomerAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAccount
     */
    omit?: CustomerAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAccountInclude<ExtArgs> | null
    /**
     * Filter, which CustomerAccounts to fetch.
     */
    where?: CustomerAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerAccounts to fetch.
     */
    orderBy?: CustomerAccountOrderByWithRelationInput | CustomerAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CustomerAccounts.
     */
    cursor?: CustomerAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerAccounts.
     */
    skip?: number
    distinct?: CustomerAccountScalarFieldEnum | CustomerAccountScalarFieldEnum[]
  }

  /**
   * CustomerAccount create
   */
  export type CustomerAccountCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAccount
     */
    select?: CustomerAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAccount
     */
    omit?: CustomerAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAccountInclude<ExtArgs> | null
    /**
     * The data needed to create a CustomerAccount.
     */
    data: XOR<CustomerAccountCreateInput, CustomerAccountUncheckedCreateInput>
  }

  /**
   * CustomerAccount createMany
   */
  export type CustomerAccountCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CustomerAccounts.
     */
    data: CustomerAccountCreateManyInput | CustomerAccountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CustomerAccount createManyAndReturn
   */
  export type CustomerAccountCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAccount
     */
    select?: CustomerAccountSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAccount
     */
    omit?: CustomerAccountOmit<ExtArgs> | null
    /**
     * The data used to create many CustomerAccounts.
     */
    data: CustomerAccountCreateManyInput | CustomerAccountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CustomerAccount update
   */
  export type CustomerAccountUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAccount
     */
    select?: CustomerAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAccount
     */
    omit?: CustomerAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAccountInclude<ExtArgs> | null
    /**
     * The data needed to update a CustomerAccount.
     */
    data: XOR<CustomerAccountUpdateInput, CustomerAccountUncheckedUpdateInput>
    /**
     * Choose, which CustomerAccount to update.
     */
    where: CustomerAccountWhereUniqueInput
  }

  /**
   * CustomerAccount updateMany
   */
  export type CustomerAccountUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CustomerAccounts.
     */
    data: XOR<CustomerAccountUpdateManyMutationInput, CustomerAccountUncheckedUpdateManyInput>
    /**
     * Filter which CustomerAccounts to update
     */
    where?: CustomerAccountWhereInput
    /**
     * Limit how many CustomerAccounts to update.
     */
    limit?: number
  }

  /**
   * CustomerAccount updateManyAndReturn
   */
  export type CustomerAccountUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAccount
     */
    select?: CustomerAccountSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAccount
     */
    omit?: CustomerAccountOmit<ExtArgs> | null
    /**
     * The data used to update CustomerAccounts.
     */
    data: XOR<CustomerAccountUpdateManyMutationInput, CustomerAccountUncheckedUpdateManyInput>
    /**
     * Filter which CustomerAccounts to update
     */
    where?: CustomerAccountWhereInput
    /**
     * Limit how many CustomerAccounts to update.
     */
    limit?: number
  }

  /**
   * CustomerAccount upsert
   */
  export type CustomerAccountUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAccount
     */
    select?: CustomerAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAccount
     */
    omit?: CustomerAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAccountInclude<ExtArgs> | null
    /**
     * The filter to search for the CustomerAccount to update in case it exists.
     */
    where: CustomerAccountWhereUniqueInput
    /**
     * In case the CustomerAccount found by the `where` argument doesn't exist, create a new CustomerAccount with this data.
     */
    create: XOR<CustomerAccountCreateInput, CustomerAccountUncheckedCreateInput>
    /**
     * In case the CustomerAccount was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CustomerAccountUpdateInput, CustomerAccountUncheckedUpdateInput>
  }

  /**
   * CustomerAccount delete
   */
  export type CustomerAccountDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAccount
     */
    select?: CustomerAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAccount
     */
    omit?: CustomerAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAccountInclude<ExtArgs> | null
    /**
     * Filter which CustomerAccount to delete.
     */
    where: CustomerAccountWhereUniqueInput
  }

  /**
   * CustomerAccount deleteMany
   */
  export type CustomerAccountDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CustomerAccounts to delete
     */
    where?: CustomerAccountWhereInput
    /**
     * Limit how many CustomerAccounts to delete.
     */
    limit?: number
  }

  /**
   * CustomerAccount.primaryBinding
   */
  export type CustomerAccount$primaryBindingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerPartyBinding
     */
    select?: CustomerPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerPartyBinding
     */
    omit?: CustomerPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerPartyBindingInclude<ExtArgs> | null
    where?: CustomerPartyBindingWhereInput
  }

  /**
   * CustomerAccount.contacts
   */
  export type CustomerAccount$contactsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerContact
     */
    select?: CustomerContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerContact
     */
    omit?: CustomerContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerContactInclude<ExtArgs> | null
    where?: CustomerContactWhereInput
    orderBy?: CustomerContactOrderByWithRelationInput | CustomerContactOrderByWithRelationInput[]
    cursor?: CustomerContactWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CustomerContactScalarFieldEnum | CustomerContactScalarFieldEnum[]
  }

  /**
   * CustomerAccount.addresses
   */
  export type CustomerAccount$addressesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAddress
     */
    select?: CustomerAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAddress
     */
    omit?: CustomerAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAddressInclude<ExtArgs> | null
    where?: CustomerAddressWhereInput
    orderBy?: CustomerAddressOrderByWithRelationInput | CustomerAddressOrderByWithRelationInput[]
    cursor?: CustomerAddressWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CustomerAddressScalarFieldEnum | CustomerAddressScalarFieldEnum[]
  }

  /**
   * CustomerAccount without action
   */
  export type CustomerAccountDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAccount
     */
    select?: CustomerAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAccount
     */
    omit?: CustomerAccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAccountInclude<ExtArgs> | null
  }


  /**
   * Model CustomerPartyBinding
   */

  export type AggregateCustomerPartyBinding = {
    _count: CustomerPartyBindingCountAggregateOutputType | null
    _min: CustomerPartyBindingMinAggregateOutputType | null
    _max: CustomerPartyBindingMaxAggregateOutputType | null
  }

  export type CustomerPartyBindingMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    customerAccountId: string | null
    tenantPartyId: string | null
    bindingStatus: $Enums.CrmCustomerPartyBindingStatus | null
    partyDisplayName: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CustomerPartyBindingMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    customerAccountId: string | null
    tenantPartyId: string | null
    bindingStatus: $Enums.CrmCustomerPartyBindingStatus | null
    partyDisplayName: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CustomerPartyBindingCountAggregateOutputType = {
    id: number
    tenantId: number
    customerAccountId: number
    tenantPartyId: number
    bindingStatus: number
    partyDisplayName: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CustomerPartyBindingMinAggregateInputType = {
    id?: true
    tenantId?: true
    customerAccountId?: true
    tenantPartyId?: true
    bindingStatus?: true
    partyDisplayName?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CustomerPartyBindingMaxAggregateInputType = {
    id?: true
    tenantId?: true
    customerAccountId?: true
    tenantPartyId?: true
    bindingStatus?: true
    partyDisplayName?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CustomerPartyBindingCountAggregateInputType = {
    id?: true
    tenantId?: true
    customerAccountId?: true
    tenantPartyId?: true
    bindingStatus?: true
    partyDisplayName?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CustomerPartyBindingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CustomerPartyBinding to aggregate.
     */
    where?: CustomerPartyBindingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerPartyBindings to fetch.
     */
    orderBy?: CustomerPartyBindingOrderByWithRelationInput | CustomerPartyBindingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CustomerPartyBindingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerPartyBindings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerPartyBindings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CustomerPartyBindings
    **/
    _count?: true | CustomerPartyBindingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CustomerPartyBindingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CustomerPartyBindingMaxAggregateInputType
  }

  export type GetCustomerPartyBindingAggregateType<T extends CustomerPartyBindingAggregateArgs> = {
        [P in keyof T & keyof AggregateCustomerPartyBinding]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCustomerPartyBinding[P]>
      : GetScalarType<T[P], AggregateCustomerPartyBinding[P]>
  }




  export type CustomerPartyBindingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CustomerPartyBindingWhereInput
    orderBy?: CustomerPartyBindingOrderByWithAggregationInput | CustomerPartyBindingOrderByWithAggregationInput[]
    by: CustomerPartyBindingScalarFieldEnum[] | CustomerPartyBindingScalarFieldEnum
    having?: CustomerPartyBindingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CustomerPartyBindingCountAggregateInputType | true
    _min?: CustomerPartyBindingMinAggregateInputType
    _max?: CustomerPartyBindingMaxAggregateInputType
  }

  export type CustomerPartyBindingGroupByOutputType = {
    id: string
    tenantId: string
    customerAccountId: string
    tenantPartyId: string
    bindingStatus: $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName: string | null
    createdAt: Date
    updatedAt: Date
    _count: CustomerPartyBindingCountAggregateOutputType | null
    _min: CustomerPartyBindingMinAggregateOutputType | null
    _max: CustomerPartyBindingMaxAggregateOutputType | null
  }

  type GetCustomerPartyBindingGroupByPayload<T extends CustomerPartyBindingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CustomerPartyBindingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CustomerPartyBindingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CustomerPartyBindingGroupByOutputType[P]>
            : GetScalarType<T[P], CustomerPartyBindingGroupByOutputType[P]>
        }
      >
    >


  export type CustomerPartyBindingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    customerAccountId?: boolean
    tenantPartyId?: boolean
    bindingStatus?: boolean
    partyDisplayName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["customerPartyBinding"]>

  export type CustomerPartyBindingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    customerAccountId?: boolean
    tenantPartyId?: boolean
    bindingStatus?: boolean
    partyDisplayName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["customerPartyBinding"]>

  export type CustomerPartyBindingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    customerAccountId?: boolean
    tenantPartyId?: boolean
    bindingStatus?: boolean
    partyDisplayName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["customerPartyBinding"]>

  export type CustomerPartyBindingSelectScalar = {
    id?: boolean
    tenantId?: boolean
    customerAccountId?: boolean
    tenantPartyId?: boolean
    bindingStatus?: boolean
    partyDisplayName?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CustomerPartyBindingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "customerAccountId" | "tenantPartyId" | "bindingStatus" | "partyDisplayName" | "createdAt" | "updatedAt", ExtArgs["result"]["customerPartyBinding"]>
  export type CustomerPartyBindingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }
  export type CustomerPartyBindingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }
  export type CustomerPartyBindingIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }

  export type $CustomerPartyBindingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CustomerPartyBinding"
    objects: {
      customerAccount: Prisma.$CustomerAccountPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      customerAccountId: string
      tenantPartyId: string
      bindingStatus: $Enums.CrmCustomerPartyBindingStatus
      partyDisplayName: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["customerPartyBinding"]>
    composites: {}
  }

  type CustomerPartyBindingGetPayload<S extends boolean | null | undefined | CustomerPartyBindingDefaultArgs> = $Result.GetResult<Prisma.$CustomerPartyBindingPayload, S>

  type CustomerPartyBindingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CustomerPartyBindingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CustomerPartyBindingCountAggregateInputType | true
    }

  export interface CustomerPartyBindingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CustomerPartyBinding'], meta: { name: 'CustomerPartyBinding' } }
    /**
     * Find zero or one CustomerPartyBinding that matches the filter.
     * @param {CustomerPartyBindingFindUniqueArgs} args - Arguments to find a CustomerPartyBinding
     * @example
     * // Get one CustomerPartyBinding
     * const customerPartyBinding = await prisma.customerPartyBinding.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CustomerPartyBindingFindUniqueArgs>(args: SelectSubset<T, CustomerPartyBindingFindUniqueArgs<ExtArgs>>): Prisma__CustomerPartyBindingClient<$Result.GetResult<Prisma.$CustomerPartyBindingPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one CustomerPartyBinding that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CustomerPartyBindingFindUniqueOrThrowArgs} args - Arguments to find a CustomerPartyBinding
     * @example
     * // Get one CustomerPartyBinding
     * const customerPartyBinding = await prisma.customerPartyBinding.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CustomerPartyBindingFindUniqueOrThrowArgs>(args: SelectSubset<T, CustomerPartyBindingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CustomerPartyBindingClient<$Result.GetResult<Prisma.$CustomerPartyBindingPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first CustomerPartyBinding that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerPartyBindingFindFirstArgs} args - Arguments to find a CustomerPartyBinding
     * @example
     * // Get one CustomerPartyBinding
     * const customerPartyBinding = await prisma.customerPartyBinding.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CustomerPartyBindingFindFirstArgs>(args?: SelectSubset<T, CustomerPartyBindingFindFirstArgs<ExtArgs>>): Prisma__CustomerPartyBindingClient<$Result.GetResult<Prisma.$CustomerPartyBindingPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first CustomerPartyBinding that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerPartyBindingFindFirstOrThrowArgs} args - Arguments to find a CustomerPartyBinding
     * @example
     * // Get one CustomerPartyBinding
     * const customerPartyBinding = await prisma.customerPartyBinding.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CustomerPartyBindingFindFirstOrThrowArgs>(args?: SelectSubset<T, CustomerPartyBindingFindFirstOrThrowArgs<ExtArgs>>): Prisma__CustomerPartyBindingClient<$Result.GetResult<Prisma.$CustomerPartyBindingPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more CustomerPartyBindings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerPartyBindingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CustomerPartyBindings
     * const customerPartyBindings = await prisma.customerPartyBinding.findMany()
     * 
     * // Get first 10 CustomerPartyBindings
     * const customerPartyBindings = await prisma.customerPartyBinding.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const customerPartyBindingWithIdOnly = await prisma.customerPartyBinding.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CustomerPartyBindingFindManyArgs>(args?: SelectSubset<T, CustomerPartyBindingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerPartyBindingPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a CustomerPartyBinding.
     * @param {CustomerPartyBindingCreateArgs} args - Arguments to create a CustomerPartyBinding.
     * @example
     * // Create one CustomerPartyBinding
     * const CustomerPartyBinding = await prisma.customerPartyBinding.create({
     *   data: {
     *     // ... data to create a CustomerPartyBinding
     *   }
     * })
     * 
     */
    create<T extends CustomerPartyBindingCreateArgs>(args: SelectSubset<T, CustomerPartyBindingCreateArgs<ExtArgs>>): Prisma__CustomerPartyBindingClient<$Result.GetResult<Prisma.$CustomerPartyBindingPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many CustomerPartyBindings.
     * @param {CustomerPartyBindingCreateManyArgs} args - Arguments to create many CustomerPartyBindings.
     * @example
     * // Create many CustomerPartyBindings
     * const customerPartyBinding = await prisma.customerPartyBinding.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CustomerPartyBindingCreateManyArgs>(args?: SelectSubset<T, CustomerPartyBindingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CustomerPartyBindings and returns the data saved in the database.
     * @param {CustomerPartyBindingCreateManyAndReturnArgs} args - Arguments to create many CustomerPartyBindings.
     * @example
     * // Create many CustomerPartyBindings
     * const customerPartyBinding = await prisma.customerPartyBinding.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CustomerPartyBindings and only return the `id`
     * const customerPartyBindingWithIdOnly = await prisma.customerPartyBinding.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CustomerPartyBindingCreateManyAndReturnArgs>(args?: SelectSubset<T, CustomerPartyBindingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerPartyBindingPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a CustomerPartyBinding.
     * @param {CustomerPartyBindingDeleteArgs} args - Arguments to delete one CustomerPartyBinding.
     * @example
     * // Delete one CustomerPartyBinding
     * const CustomerPartyBinding = await prisma.customerPartyBinding.delete({
     *   where: {
     *     // ... filter to delete one CustomerPartyBinding
     *   }
     * })
     * 
     */
    delete<T extends CustomerPartyBindingDeleteArgs>(args: SelectSubset<T, CustomerPartyBindingDeleteArgs<ExtArgs>>): Prisma__CustomerPartyBindingClient<$Result.GetResult<Prisma.$CustomerPartyBindingPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one CustomerPartyBinding.
     * @param {CustomerPartyBindingUpdateArgs} args - Arguments to update one CustomerPartyBinding.
     * @example
     * // Update one CustomerPartyBinding
     * const customerPartyBinding = await prisma.customerPartyBinding.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CustomerPartyBindingUpdateArgs>(args: SelectSubset<T, CustomerPartyBindingUpdateArgs<ExtArgs>>): Prisma__CustomerPartyBindingClient<$Result.GetResult<Prisma.$CustomerPartyBindingPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more CustomerPartyBindings.
     * @param {CustomerPartyBindingDeleteManyArgs} args - Arguments to filter CustomerPartyBindings to delete.
     * @example
     * // Delete a few CustomerPartyBindings
     * const { count } = await prisma.customerPartyBinding.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CustomerPartyBindingDeleteManyArgs>(args?: SelectSubset<T, CustomerPartyBindingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CustomerPartyBindings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerPartyBindingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CustomerPartyBindings
     * const customerPartyBinding = await prisma.customerPartyBinding.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CustomerPartyBindingUpdateManyArgs>(args: SelectSubset<T, CustomerPartyBindingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CustomerPartyBindings and returns the data updated in the database.
     * @param {CustomerPartyBindingUpdateManyAndReturnArgs} args - Arguments to update many CustomerPartyBindings.
     * @example
     * // Update many CustomerPartyBindings
     * const customerPartyBinding = await prisma.customerPartyBinding.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CustomerPartyBindings and only return the `id`
     * const customerPartyBindingWithIdOnly = await prisma.customerPartyBinding.updateManyAndReturn({
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
    updateManyAndReturn<T extends CustomerPartyBindingUpdateManyAndReturnArgs>(args: SelectSubset<T, CustomerPartyBindingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerPartyBindingPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one CustomerPartyBinding.
     * @param {CustomerPartyBindingUpsertArgs} args - Arguments to update or create a CustomerPartyBinding.
     * @example
     * // Update or create a CustomerPartyBinding
     * const customerPartyBinding = await prisma.customerPartyBinding.upsert({
     *   create: {
     *     // ... data to create a CustomerPartyBinding
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CustomerPartyBinding we want to update
     *   }
     * })
     */
    upsert<T extends CustomerPartyBindingUpsertArgs>(args: SelectSubset<T, CustomerPartyBindingUpsertArgs<ExtArgs>>): Prisma__CustomerPartyBindingClient<$Result.GetResult<Prisma.$CustomerPartyBindingPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of CustomerPartyBindings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerPartyBindingCountArgs} args - Arguments to filter CustomerPartyBindings to count.
     * @example
     * // Count the number of CustomerPartyBindings
     * const count = await prisma.customerPartyBinding.count({
     *   where: {
     *     // ... the filter for the CustomerPartyBindings we want to count
     *   }
     * })
    **/
    count<T extends CustomerPartyBindingCountArgs>(
      args?: Subset<T, CustomerPartyBindingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CustomerPartyBindingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CustomerPartyBinding.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerPartyBindingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CustomerPartyBindingAggregateArgs>(args: Subset<T, CustomerPartyBindingAggregateArgs>): Prisma.PrismaPromise<GetCustomerPartyBindingAggregateType<T>>

    /**
     * Group by CustomerPartyBinding.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerPartyBindingGroupByArgs} args - Group by arguments.
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
      T extends CustomerPartyBindingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CustomerPartyBindingGroupByArgs['orderBy'] }
        : { orderBy?: CustomerPartyBindingGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CustomerPartyBindingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCustomerPartyBindingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CustomerPartyBinding model
   */
  readonly fields: CustomerPartyBindingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CustomerPartyBinding.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CustomerPartyBindingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    customerAccount<T extends CustomerAccountDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CustomerAccountDefaultArgs<ExtArgs>>): Prisma__CustomerAccountClient<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the CustomerPartyBinding model
   */ 
  interface CustomerPartyBindingFieldRefs {
    readonly id: FieldRef<"CustomerPartyBinding", 'String'>
    readonly tenantId: FieldRef<"CustomerPartyBinding", 'String'>
    readonly customerAccountId: FieldRef<"CustomerPartyBinding", 'String'>
    readonly tenantPartyId: FieldRef<"CustomerPartyBinding", 'String'>
    readonly bindingStatus: FieldRef<"CustomerPartyBinding", 'CrmCustomerPartyBindingStatus'>
    readonly partyDisplayName: FieldRef<"CustomerPartyBinding", 'String'>
    readonly createdAt: FieldRef<"CustomerPartyBinding", 'DateTime'>
    readonly updatedAt: FieldRef<"CustomerPartyBinding", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CustomerPartyBinding findUnique
   */
  export type CustomerPartyBindingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerPartyBinding
     */
    select?: CustomerPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerPartyBinding
     */
    omit?: CustomerPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerPartyBindingInclude<ExtArgs> | null
    /**
     * Filter, which CustomerPartyBinding to fetch.
     */
    where: CustomerPartyBindingWhereUniqueInput
  }

  /**
   * CustomerPartyBinding findUniqueOrThrow
   */
  export type CustomerPartyBindingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerPartyBinding
     */
    select?: CustomerPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerPartyBinding
     */
    omit?: CustomerPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerPartyBindingInclude<ExtArgs> | null
    /**
     * Filter, which CustomerPartyBinding to fetch.
     */
    where: CustomerPartyBindingWhereUniqueInput
  }

  /**
   * CustomerPartyBinding findFirst
   */
  export type CustomerPartyBindingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerPartyBinding
     */
    select?: CustomerPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerPartyBinding
     */
    omit?: CustomerPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerPartyBindingInclude<ExtArgs> | null
    /**
     * Filter, which CustomerPartyBinding to fetch.
     */
    where?: CustomerPartyBindingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerPartyBindings to fetch.
     */
    orderBy?: CustomerPartyBindingOrderByWithRelationInput | CustomerPartyBindingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CustomerPartyBindings.
     */
    cursor?: CustomerPartyBindingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerPartyBindings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerPartyBindings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CustomerPartyBindings.
     */
    distinct?: CustomerPartyBindingScalarFieldEnum | CustomerPartyBindingScalarFieldEnum[]
  }

  /**
   * CustomerPartyBinding findFirstOrThrow
   */
  export type CustomerPartyBindingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerPartyBinding
     */
    select?: CustomerPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerPartyBinding
     */
    omit?: CustomerPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerPartyBindingInclude<ExtArgs> | null
    /**
     * Filter, which CustomerPartyBinding to fetch.
     */
    where?: CustomerPartyBindingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerPartyBindings to fetch.
     */
    orderBy?: CustomerPartyBindingOrderByWithRelationInput | CustomerPartyBindingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CustomerPartyBindings.
     */
    cursor?: CustomerPartyBindingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerPartyBindings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerPartyBindings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CustomerPartyBindings.
     */
    distinct?: CustomerPartyBindingScalarFieldEnum | CustomerPartyBindingScalarFieldEnum[]
  }

  /**
   * CustomerPartyBinding findMany
   */
  export type CustomerPartyBindingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerPartyBinding
     */
    select?: CustomerPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerPartyBinding
     */
    omit?: CustomerPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerPartyBindingInclude<ExtArgs> | null
    /**
     * Filter, which CustomerPartyBindings to fetch.
     */
    where?: CustomerPartyBindingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerPartyBindings to fetch.
     */
    orderBy?: CustomerPartyBindingOrderByWithRelationInput | CustomerPartyBindingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CustomerPartyBindings.
     */
    cursor?: CustomerPartyBindingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerPartyBindings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerPartyBindings.
     */
    skip?: number
    distinct?: CustomerPartyBindingScalarFieldEnum | CustomerPartyBindingScalarFieldEnum[]
  }

  /**
   * CustomerPartyBinding create
   */
  export type CustomerPartyBindingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerPartyBinding
     */
    select?: CustomerPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerPartyBinding
     */
    omit?: CustomerPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerPartyBindingInclude<ExtArgs> | null
    /**
     * The data needed to create a CustomerPartyBinding.
     */
    data: XOR<CustomerPartyBindingCreateInput, CustomerPartyBindingUncheckedCreateInput>
  }

  /**
   * CustomerPartyBinding createMany
   */
  export type CustomerPartyBindingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CustomerPartyBindings.
     */
    data: CustomerPartyBindingCreateManyInput | CustomerPartyBindingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CustomerPartyBinding createManyAndReturn
   */
  export type CustomerPartyBindingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerPartyBinding
     */
    select?: CustomerPartyBindingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerPartyBinding
     */
    omit?: CustomerPartyBindingOmit<ExtArgs> | null
    /**
     * The data used to create many CustomerPartyBindings.
     */
    data: CustomerPartyBindingCreateManyInput | CustomerPartyBindingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerPartyBindingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CustomerPartyBinding update
   */
  export type CustomerPartyBindingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerPartyBinding
     */
    select?: CustomerPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerPartyBinding
     */
    omit?: CustomerPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerPartyBindingInclude<ExtArgs> | null
    /**
     * The data needed to update a CustomerPartyBinding.
     */
    data: XOR<CustomerPartyBindingUpdateInput, CustomerPartyBindingUncheckedUpdateInput>
    /**
     * Choose, which CustomerPartyBinding to update.
     */
    where: CustomerPartyBindingWhereUniqueInput
  }

  /**
   * CustomerPartyBinding updateMany
   */
  export type CustomerPartyBindingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CustomerPartyBindings.
     */
    data: XOR<CustomerPartyBindingUpdateManyMutationInput, CustomerPartyBindingUncheckedUpdateManyInput>
    /**
     * Filter which CustomerPartyBindings to update
     */
    where?: CustomerPartyBindingWhereInput
    /**
     * Limit how many CustomerPartyBindings to update.
     */
    limit?: number
  }

  /**
   * CustomerPartyBinding updateManyAndReturn
   */
  export type CustomerPartyBindingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerPartyBinding
     */
    select?: CustomerPartyBindingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerPartyBinding
     */
    omit?: CustomerPartyBindingOmit<ExtArgs> | null
    /**
     * The data used to update CustomerPartyBindings.
     */
    data: XOR<CustomerPartyBindingUpdateManyMutationInput, CustomerPartyBindingUncheckedUpdateManyInput>
    /**
     * Filter which CustomerPartyBindings to update
     */
    where?: CustomerPartyBindingWhereInput
    /**
     * Limit how many CustomerPartyBindings to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerPartyBindingIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CustomerPartyBinding upsert
   */
  export type CustomerPartyBindingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerPartyBinding
     */
    select?: CustomerPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerPartyBinding
     */
    omit?: CustomerPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerPartyBindingInclude<ExtArgs> | null
    /**
     * The filter to search for the CustomerPartyBinding to update in case it exists.
     */
    where: CustomerPartyBindingWhereUniqueInput
    /**
     * In case the CustomerPartyBinding found by the `where` argument doesn't exist, create a new CustomerPartyBinding with this data.
     */
    create: XOR<CustomerPartyBindingCreateInput, CustomerPartyBindingUncheckedCreateInput>
    /**
     * In case the CustomerPartyBinding was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CustomerPartyBindingUpdateInput, CustomerPartyBindingUncheckedUpdateInput>
  }

  /**
   * CustomerPartyBinding delete
   */
  export type CustomerPartyBindingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerPartyBinding
     */
    select?: CustomerPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerPartyBinding
     */
    omit?: CustomerPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerPartyBindingInclude<ExtArgs> | null
    /**
     * Filter which CustomerPartyBinding to delete.
     */
    where: CustomerPartyBindingWhereUniqueInput
  }

  /**
   * CustomerPartyBinding deleteMany
   */
  export type CustomerPartyBindingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CustomerPartyBindings to delete
     */
    where?: CustomerPartyBindingWhereInput
    /**
     * Limit how many CustomerPartyBindings to delete.
     */
    limit?: number
  }

  /**
   * CustomerPartyBinding without action
   */
  export type CustomerPartyBindingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerPartyBinding
     */
    select?: CustomerPartyBindingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerPartyBinding
     */
    omit?: CustomerPartyBindingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerPartyBindingInclude<ExtArgs> | null
  }


  /**
   * Model CustomerContact
   */

  export type AggregateCustomerContact = {
    _count: CustomerContactCountAggregateOutputType | null
    _min: CustomerContactMinAggregateOutputType | null
    _max: CustomerContactMaxAggregateOutputType | null
  }

  export type CustomerContactMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    customerAccountId: string | null
    displayName: string | null
    roleTitle: string | null
    email: string | null
    phone: string | null
    isPrimaryContact: boolean | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CustomerContactMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    customerAccountId: string | null
    displayName: string | null
    roleTitle: string | null
    email: string | null
    phone: string | null
    isPrimaryContact: boolean | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CustomerContactCountAggregateOutputType = {
    id: number
    tenantId: number
    customerAccountId: number
    displayName: number
    roleTitle: number
    email: number
    phone: number
    isPrimaryContact: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CustomerContactMinAggregateInputType = {
    id?: true
    tenantId?: true
    customerAccountId?: true
    displayName?: true
    roleTitle?: true
    email?: true
    phone?: true
    isPrimaryContact?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CustomerContactMaxAggregateInputType = {
    id?: true
    tenantId?: true
    customerAccountId?: true
    displayName?: true
    roleTitle?: true
    email?: true
    phone?: true
    isPrimaryContact?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CustomerContactCountAggregateInputType = {
    id?: true
    tenantId?: true
    customerAccountId?: true
    displayName?: true
    roleTitle?: true
    email?: true
    phone?: true
    isPrimaryContact?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CustomerContactAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CustomerContact to aggregate.
     */
    where?: CustomerContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerContacts to fetch.
     */
    orderBy?: CustomerContactOrderByWithRelationInput | CustomerContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CustomerContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerContacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerContacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CustomerContacts
    **/
    _count?: true | CustomerContactCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CustomerContactMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CustomerContactMaxAggregateInputType
  }

  export type GetCustomerContactAggregateType<T extends CustomerContactAggregateArgs> = {
        [P in keyof T & keyof AggregateCustomerContact]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCustomerContact[P]>
      : GetScalarType<T[P], AggregateCustomerContact[P]>
  }




  export type CustomerContactGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CustomerContactWhereInput
    orderBy?: CustomerContactOrderByWithAggregationInput | CustomerContactOrderByWithAggregationInput[]
    by: CustomerContactScalarFieldEnum[] | CustomerContactScalarFieldEnum
    having?: CustomerContactScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CustomerContactCountAggregateInputType | true
    _min?: CustomerContactMinAggregateInputType
    _max?: CustomerContactMaxAggregateInputType
  }

  export type CustomerContactGroupByOutputType = {
    id: string
    tenantId: string
    customerAccountId: string
    displayName: string
    roleTitle: string | null
    email: string | null
    phone: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: CustomerContactCountAggregateOutputType | null
    _min: CustomerContactMinAggregateOutputType | null
    _max: CustomerContactMaxAggregateOutputType | null
  }

  type GetCustomerContactGroupByPayload<T extends CustomerContactGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CustomerContactGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CustomerContactGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CustomerContactGroupByOutputType[P]>
            : GetScalarType<T[P], CustomerContactGroupByOutputType[P]>
        }
      >
    >


  export type CustomerContactSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    customerAccountId?: boolean
    displayName?: boolean
    roleTitle?: boolean
    email?: boolean
    phone?: boolean
    isPrimaryContact?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["customerContact"]>

  export type CustomerContactSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    customerAccountId?: boolean
    displayName?: boolean
    roleTitle?: boolean
    email?: boolean
    phone?: boolean
    isPrimaryContact?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["customerContact"]>

  export type CustomerContactSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    customerAccountId?: boolean
    displayName?: boolean
    roleTitle?: boolean
    email?: boolean
    phone?: boolean
    isPrimaryContact?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["customerContact"]>

  export type CustomerContactSelectScalar = {
    id?: boolean
    tenantId?: boolean
    customerAccountId?: boolean
    displayName?: boolean
    roleTitle?: boolean
    email?: boolean
    phone?: boolean
    isPrimaryContact?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CustomerContactOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "customerAccountId" | "displayName" | "roleTitle" | "email" | "phone" | "isPrimaryContact" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["customerContact"]>
  export type CustomerContactInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }
  export type CustomerContactIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }
  export type CustomerContactIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }

  export type $CustomerContactPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CustomerContact"
    objects: {
      customerAccount: Prisma.$CustomerAccountPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      customerAccountId: string
      displayName: string
      roleTitle: string | null
      email: string | null
      phone: string | null
      isPrimaryContact: boolean
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["customerContact"]>
    composites: {}
  }

  type CustomerContactGetPayload<S extends boolean | null | undefined | CustomerContactDefaultArgs> = $Result.GetResult<Prisma.$CustomerContactPayload, S>

  type CustomerContactCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CustomerContactFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CustomerContactCountAggregateInputType | true
    }

  export interface CustomerContactDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CustomerContact'], meta: { name: 'CustomerContact' } }
    /**
     * Find zero or one CustomerContact that matches the filter.
     * @param {CustomerContactFindUniqueArgs} args - Arguments to find a CustomerContact
     * @example
     * // Get one CustomerContact
     * const customerContact = await prisma.customerContact.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CustomerContactFindUniqueArgs>(args: SelectSubset<T, CustomerContactFindUniqueArgs<ExtArgs>>): Prisma__CustomerContactClient<$Result.GetResult<Prisma.$CustomerContactPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one CustomerContact that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CustomerContactFindUniqueOrThrowArgs} args - Arguments to find a CustomerContact
     * @example
     * // Get one CustomerContact
     * const customerContact = await prisma.customerContact.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CustomerContactFindUniqueOrThrowArgs>(args: SelectSubset<T, CustomerContactFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CustomerContactClient<$Result.GetResult<Prisma.$CustomerContactPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first CustomerContact that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerContactFindFirstArgs} args - Arguments to find a CustomerContact
     * @example
     * // Get one CustomerContact
     * const customerContact = await prisma.customerContact.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CustomerContactFindFirstArgs>(args?: SelectSubset<T, CustomerContactFindFirstArgs<ExtArgs>>): Prisma__CustomerContactClient<$Result.GetResult<Prisma.$CustomerContactPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first CustomerContact that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerContactFindFirstOrThrowArgs} args - Arguments to find a CustomerContact
     * @example
     * // Get one CustomerContact
     * const customerContact = await prisma.customerContact.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CustomerContactFindFirstOrThrowArgs>(args?: SelectSubset<T, CustomerContactFindFirstOrThrowArgs<ExtArgs>>): Prisma__CustomerContactClient<$Result.GetResult<Prisma.$CustomerContactPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more CustomerContacts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerContactFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CustomerContacts
     * const customerContacts = await prisma.customerContact.findMany()
     * 
     * // Get first 10 CustomerContacts
     * const customerContacts = await prisma.customerContact.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const customerContactWithIdOnly = await prisma.customerContact.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CustomerContactFindManyArgs>(args?: SelectSubset<T, CustomerContactFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerContactPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a CustomerContact.
     * @param {CustomerContactCreateArgs} args - Arguments to create a CustomerContact.
     * @example
     * // Create one CustomerContact
     * const CustomerContact = await prisma.customerContact.create({
     *   data: {
     *     // ... data to create a CustomerContact
     *   }
     * })
     * 
     */
    create<T extends CustomerContactCreateArgs>(args: SelectSubset<T, CustomerContactCreateArgs<ExtArgs>>): Prisma__CustomerContactClient<$Result.GetResult<Prisma.$CustomerContactPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many CustomerContacts.
     * @param {CustomerContactCreateManyArgs} args - Arguments to create many CustomerContacts.
     * @example
     * // Create many CustomerContacts
     * const customerContact = await prisma.customerContact.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CustomerContactCreateManyArgs>(args?: SelectSubset<T, CustomerContactCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CustomerContacts and returns the data saved in the database.
     * @param {CustomerContactCreateManyAndReturnArgs} args - Arguments to create many CustomerContacts.
     * @example
     * // Create many CustomerContacts
     * const customerContact = await prisma.customerContact.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CustomerContacts and only return the `id`
     * const customerContactWithIdOnly = await prisma.customerContact.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CustomerContactCreateManyAndReturnArgs>(args?: SelectSubset<T, CustomerContactCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerContactPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a CustomerContact.
     * @param {CustomerContactDeleteArgs} args - Arguments to delete one CustomerContact.
     * @example
     * // Delete one CustomerContact
     * const CustomerContact = await prisma.customerContact.delete({
     *   where: {
     *     // ... filter to delete one CustomerContact
     *   }
     * })
     * 
     */
    delete<T extends CustomerContactDeleteArgs>(args: SelectSubset<T, CustomerContactDeleteArgs<ExtArgs>>): Prisma__CustomerContactClient<$Result.GetResult<Prisma.$CustomerContactPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one CustomerContact.
     * @param {CustomerContactUpdateArgs} args - Arguments to update one CustomerContact.
     * @example
     * // Update one CustomerContact
     * const customerContact = await prisma.customerContact.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CustomerContactUpdateArgs>(args: SelectSubset<T, CustomerContactUpdateArgs<ExtArgs>>): Prisma__CustomerContactClient<$Result.GetResult<Prisma.$CustomerContactPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more CustomerContacts.
     * @param {CustomerContactDeleteManyArgs} args - Arguments to filter CustomerContacts to delete.
     * @example
     * // Delete a few CustomerContacts
     * const { count } = await prisma.customerContact.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CustomerContactDeleteManyArgs>(args?: SelectSubset<T, CustomerContactDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CustomerContacts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerContactUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CustomerContacts
     * const customerContact = await prisma.customerContact.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CustomerContactUpdateManyArgs>(args: SelectSubset<T, CustomerContactUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CustomerContacts and returns the data updated in the database.
     * @param {CustomerContactUpdateManyAndReturnArgs} args - Arguments to update many CustomerContacts.
     * @example
     * // Update many CustomerContacts
     * const customerContact = await prisma.customerContact.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CustomerContacts and only return the `id`
     * const customerContactWithIdOnly = await prisma.customerContact.updateManyAndReturn({
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
    updateManyAndReturn<T extends CustomerContactUpdateManyAndReturnArgs>(args: SelectSubset<T, CustomerContactUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerContactPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one CustomerContact.
     * @param {CustomerContactUpsertArgs} args - Arguments to update or create a CustomerContact.
     * @example
     * // Update or create a CustomerContact
     * const customerContact = await prisma.customerContact.upsert({
     *   create: {
     *     // ... data to create a CustomerContact
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CustomerContact we want to update
     *   }
     * })
     */
    upsert<T extends CustomerContactUpsertArgs>(args: SelectSubset<T, CustomerContactUpsertArgs<ExtArgs>>): Prisma__CustomerContactClient<$Result.GetResult<Prisma.$CustomerContactPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of CustomerContacts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerContactCountArgs} args - Arguments to filter CustomerContacts to count.
     * @example
     * // Count the number of CustomerContacts
     * const count = await prisma.customerContact.count({
     *   where: {
     *     // ... the filter for the CustomerContacts we want to count
     *   }
     * })
    **/
    count<T extends CustomerContactCountArgs>(
      args?: Subset<T, CustomerContactCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CustomerContactCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CustomerContact.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerContactAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CustomerContactAggregateArgs>(args: Subset<T, CustomerContactAggregateArgs>): Prisma.PrismaPromise<GetCustomerContactAggregateType<T>>

    /**
     * Group by CustomerContact.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerContactGroupByArgs} args - Group by arguments.
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
      T extends CustomerContactGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CustomerContactGroupByArgs['orderBy'] }
        : { orderBy?: CustomerContactGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CustomerContactGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCustomerContactGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CustomerContact model
   */
  readonly fields: CustomerContactFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CustomerContact.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CustomerContactClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    customerAccount<T extends CustomerAccountDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CustomerAccountDefaultArgs<ExtArgs>>): Prisma__CustomerAccountClient<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the CustomerContact model
   */ 
  interface CustomerContactFieldRefs {
    readonly id: FieldRef<"CustomerContact", 'String'>
    readonly tenantId: FieldRef<"CustomerContact", 'String'>
    readonly customerAccountId: FieldRef<"CustomerContact", 'String'>
    readonly displayName: FieldRef<"CustomerContact", 'String'>
    readonly roleTitle: FieldRef<"CustomerContact", 'String'>
    readonly email: FieldRef<"CustomerContact", 'String'>
    readonly phone: FieldRef<"CustomerContact", 'String'>
    readonly isPrimaryContact: FieldRef<"CustomerContact", 'Boolean'>
    readonly isActive: FieldRef<"CustomerContact", 'Boolean'>
    readonly createdAt: FieldRef<"CustomerContact", 'DateTime'>
    readonly updatedAt: FieldRef<"CustomerContact", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CustomerContact findUnique
   */
  export type CustomerContactFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerContact
     */
    select?: CustomerContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerContact
     */
    omit?: CustomerContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerContactInclude<ExtArgs> | null
    /**
     * Filter, which CustomerContact to fetch.
     */
    where: CustomerContactWhereUniqueInput
  }

  /**
   * CustomerContact findUniqueOrThrow
   */
  export type CustomerContactFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerContact
     */
    select?: CustomerContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerContact
     */
    omit?: CustomerContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerContactInclude<ExtArgs> | null
    /**
     * Filter, which CustomerContact to fetch.
     */
    where: CustomerContactWhereUniqueInput
  }

  /**
   * CustomerContact findFirst
   */
  export type CustomerContactFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerContact
     */
    select?: CustomerContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerContact
     */
    omit?: CustomerContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerContactInclude<ExtArgs> | null
    /**
     * Filter, which CustomerContact to fetch.
     */
    where?: CustomerContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerContacts to fetch.
     */
    orderBy?: CustomerContactOrderByWithRelationInput | CustomerContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CustomerContacts.
     */
    cursor?: CustomerContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerContacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerContacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CustomerContacts.
     */
    distinct?: CustomerContactScalarFieldEnum | CustomerContactScalarFieldEnum[]
  }

  /**
   * CustomerContact findFirstOrThrow
   */
  export type CustomerContactFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerContact
     */
    select?: CustomerContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerContact
     */
    omit?: CustomerContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerContactInclude<ExtArgs> | null
    /**
     * Filter, which CustomerContact to fetch.
     */
    where?: CustomerContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerContacts to fetch.
     */
    orderBy?: CustomerContactOrderByWithRelationInput | CustomerContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CustomerContacts.
     */
    cursor?: CustomerContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerContacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerContacts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CustomerContacts.
     */
    distinct?: CustomerContactScalarFieldEnum | CustomerContactScalarFieldEnum[]
  }

  /**
   * CustomerContact findMany
   */
  export type CustomerContactFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerContact
     */
    select?: CustomerContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerContact
     */
    omit?: CustomerContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerContactInclude<ExtArgs> | null
    /**
     * Filter, which CustomerContacts to fetch.
     */
    where?: CustomerContactWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerContacts to fetch.
     */
    orderBy?: CustomerContactOrderByWithRelationInput | CustomerContactOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CustomerContacts.
     */
    cursor?: CustomerContactWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerContacts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerContacts.
     */
    skip?: number
    distinct?: CustomerContactScalarFieldEnum | CustomerContactScalarFieldEnum[]
  }

  /**
   * CustomerContact create
   */
  export type CustomerContactCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerContact
     */
    select?: CustomerContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerContact
     */
    omit?: CustomerContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerContactInclude<ExtArgs> | null
    /**
     * The data needed to create a CustomerContact.
     */
    data: XOR<CustomerContactCreateInput, CustomerContactUncheckedCreateInput>
  }

  /**
   * CustomerContact createMany
   */
  export type CustomerContactCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CustomerContacts.
     */
    data: CustomerContactCreateManyInput | CustomerContactCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CustomerContact createManyAndReturn
   */
  export type CustomerContactCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerContact
     */
    select?: CustomerContactSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerContact
     */
    omit?: CustomerContactOmit<ExtArgs> | null
    /**
     * The data used to create many CustomerContacts.
     */
    data: CustomerContactCreateManyInput | CustomerContactCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerContactIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CustomerContact update
   */
  export type CustomerContactUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerContact
     */
    select?: CustomerContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerContact
     */
    omit?: CustomerContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerContactInclude<ExtArgs> | null
    /**
     * The data needed to update a CustomerContact.
     */
    data: XOR<CustomerContactUpdateInput, CustomerContactUncheckedUpdateInput>
    /**
     * Choose, which CustomerContact to update.
     */
    where: CustomerContactWhereUniqueInput
  }

  /**
   * CustomerContact updateMany
   */
  export type CustomerContactUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CustomerContacts.
     */
    data: XOR<CustomerContactUpdateManyMutationInput, CustomerContactUncheckedUpdateManyInput>
    /**
     * Filter which CustomerContacts to update
     */
    where?: CustomerContactWhereInput
    /**
     * Limit how many CustomerContacts to update.
     */
    limit?: number
  }

  /**
   * CustomerContact updateManyAndReturn
   */
  export type CustomerContactUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerContact
     */
    select?: CustomerContactSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerContact
     */
    omit?: CustomerContactOmit<ExtArgs> | null
    /**
     * The data used to update CustomerContacts.
     */
    data: XOR<CustomerContactUpdateManyMutationInput, CustomerContactUncheckedUpdateManyInput>
    /**
     * Filter which CustomerContacts to update
     */
    where?: CustomerContactWhereInput
    /**
     * Limit how many CustomerContacts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerContactIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CustomerContact upsert
   */
  export type CustomerContactUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerContact
     */
    select?: CustomerContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerContact
     */
    omit?: CustomerContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerContactInclude<ExtArgs> | null
    /**
     * The filter to search for the CustomerContact to update in case it exists.
     */
    where: CustomerContactWhereUniqueInput
    /**
     * In case the CustomerContact found by the `where` argument doesn't exist, create a new CustomerContact with this data.
     */
    create: XOR<CustomerContactCreateInput, CustomerContactUncheckedCreateInput>
    /**
     * In case the CustomerContact was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CustomerContactUpdateInput, CustomerContactUncheckedUpdateInput>
  }

  /**
   * CustomerContact delete
   */
  export type CustomerContactDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerContact
     */
    select?: CustomerContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerContact
     */
    omit?: CustomerContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerContactInclude<ExtArgs> | null
    /**
     * Filter which CustomerContact to delete.
     */
    where: CustomerContactWhereUniqueInput
  }

  /**
   * CustomerContact deleteMany
   */
  export type CustomerContactDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CustomerContacts to delete
     */
    where?: CustomerContactWhereInput
    /**
     * Limit how many CustomerContacts to delete.
     */
    limit?: number
  }

  /**
   * CustomerContact without action
   */
  export type CustomerContactDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerContact
     */
    select?: CustomerContactSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerContact
     */
    omit?: CustomerContactOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerContactInclude<ExtArgs> | null
  }


  /**
   * Model CustomerAddress
   */

  export type AggregateCustomerAddress = {
    _count: CustomerAddressCountAggregateOutputType | null
    _min: CustomerAddressMinAggregateOutputType | null
    _max: CustomerAddressMaxAggregateOutputType | null
  }

  export type CustomerAddressMinAggregateOutputType = {
    id: string | null
    tenantId: string | null
    customerAccountId: string | null
    label: string | null
    countryCode: string | null
    region: string | null
    locality: string | null
    addressLine1: string | null
    addressLine2: string | null
    postalCode: string | null
    isPrimaryAddress: boolean | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CustomerAddressMaxAggregateOutputType = {
    id: string | null
    tenantId: string | null
    customerAccountId: string | null
    label: string | null
    countryCode: string | null
    region: string | null
    locality: string | null
    addressLine1: string | null
    addressLine2: string | null
    postalCode: string | null
    isPrimaryAddress: boolean | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CustomerAddressCountAggregateOutputType = {
    id: number
    tenantId: number
    customerAccountId: number
    label: number
    countryCode: number
    region: number
    locality: number
    addressLine1: number
    addressLine2: number
    postalCode: number
    isPrimaryAddress: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CustomerAddressMinAggregateInputType = {
    id?: true
    tenantId?: true
    customerAccountId?: true
    label?: true
    countryCode?: true
    region?: true
    locality?: true
    addressLine1?: true
    addressLine2?: true
    postalCode?: true
    isPrimaryAddress?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CustomerAddressMaxAggregateInputType = {
    id?: true
    tenantId?: true
    customerAccountId?: true
    label?: true
    countryCode?: true
    region?: true
    locality?: true
    addressLine1?: true
    addressLine2?: true
    postalCode?: true
    isPrimaryAddress?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CustomerAddressCountAggregateInputType = {
    id?: true
    tenantId?: true
    customerAccountId?: true
    label?: true
    countryCode?: true
    region?: true
    locality?: true
    addressLine1?: true
    addressLine2?: true
    postalCode?: true
    isPrimaryAddress?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CustomerAddressAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CustomerAddress to aggregate.
     */
    where?: CustomerAddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerAddresses to fetch.
     */
    orderBy?: CustomerAddressOrderByWithRelationInput | CustomerAddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CustomerAddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerAddresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerAddresses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CustomerAddresses
    **/
    _count?: true | CustomerAddressCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CustomerAddressMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CustomerAddressMaxAggregateInputType
  }

  export type GetCustomerAddressAggregateType<T extends CustomerAddressAggregateArgs> = {
        [P in keyof T & keyof AggregateCustomerAddress]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCustomerAddress[P]>
      : GetScalarType<T[P], AggregateCustomerAddress[P]>
  }




  export type CustomerAddressGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CustomerAddressWhereInput
    orderBy?: CustomerAddressOrderByWithAggregationInput | CustomerAddressOrderByWithAggregationInput[]
    by: CustomerAddressScalarFieldEnum[] | CustomerAddressScalarFieldEnum
    having?: CustomerAddressScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CustomerAddressCountAggregateInputType | true
    _min?: CustomerAddressMinAggregateInputType
    _max?: CustomerAddressMaxAggregateInputType
  }

  export type CustomerAddressGroupByOutputType = {
    id: string
    tenantId: string
    customerAccountId: string
    label: string
    countryCode: string
    region: string | null
    locality: string | null
    addressLine1: string
    addressLine2: string | null
    postalCode: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: CustomerAddressCountAggregateOutputType | null
    _min: CustomerAddressMinAggregateOutputType | null
    _max: CustomerAddressMaxAggregateOutputType | null
  }

  type GetCustomerAddressGroupByPayload<T extends CustomerAddressGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CustomerAddressGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CustomerAddressGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CustomerAddressGroupByOutputType[P]>
            : GetScalarType<T[P], CustomerAddressGroupByOutputType[P]>
        }
      >
    >


  export type CustomerAddressSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    customerAccountId?: boolean
    label?: boolean
    countryCode?: boolean
    region?: boolean
    locality?: boolean
    addressLine1?: boolean
    addressLine2?: boolean
    postalCode?: boolean
    isPrimaryAddress?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["customerAddress"]>

  export type CustomerAddressSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    customerAccountId?: boolean
    label?: boolean
    countryCode?: boolean
    region?: boolean
    locality?: boolean
    addressLine1?: boolean
    addressLine2?: boolean
    postalCode?: boolean
    isPrimaryAddress?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["customerAddress"]>

  export type CustomerAddressSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenantId?: boolean
    customerAccountId?: boolean
    label?: boolean
    countryCode?: boolean
    region?: boolean
    locality?: boolean
    addressLine1?: boolean
    addressLine2?: boolean
    postalCode?: boolean
    isPrimaryAddress?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["customerAddress"]>

  export type CustomerAddressSelectScalar = {
    id?: boolean
    tenantId?: boolean
    customerAccountId?: boolean
    label?: boolean
    countryCode?: boolean
    region?: boolean
    locality?: boolean
    addressLine1?: boolean
    addressLine2?: boolean
    postalCode?: boolean
    isPrimaryAddress?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CustomerAddressOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenantId" | "customerAccountId" | "label" | "countryCode" | "region" | "locality" | "addressLine1" | "addressLine2" | "postalCode" | "isPrimaryAddress" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["customerAddress"]>
  export type CustomerAddressInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }
  export type CustomerAddressIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }
  export type CustomerAddressIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    customerAccount?: boolean | CustomerAccountDefaultArgs<ExtArgs>
  }

  export type $CustomerAddressPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CustomerAddress"
    objects: {
      customerAccount: Prisma.$CustomerAccountPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenantId: string
      customerAccountId: string
      label: string
      countryCode: string
      region: string | null
      locality: string | null
      addressLine1: string
      addressLine2: string | null
      postalCode: string | null
      isPrimaryAddress: boolean
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["customerAddress"]>
    composites: {}
  }

  type CustomerAddressGetPayload<S extends boolean | null | undefined | CustomerAddressDefaultArgs> = $Result.GetResult<Prisma.$CustomerAddressPayload, S>

  type CustomerAddressCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CustomerAddressFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CustomerAddressCountAggregateInputType | true
    }

  export interface CustomerAddressDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CustomerAddress'], meta: { name: 'CustomerAddress' } }
    /**
     * Find zero or one CustomerAddress that matches the filter.
     * @param {CustomerAddressFindUniqueArgs} args - Arguments to find a CustomerAddress
     * @example
     * // Get one CustomerAddress
     * const customerAddress = await prisma.customerAddress.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CustomerAddressFindUniqueArgs>(args: SelectSubset<T, CustomerAddressFindUniqueArgs<ExtArgs>>): Prisma__CustomerAddressClient<$Result.GetResult<Prisma.$CustomerAddressPayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one CustomerAddress that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CustomerAddressFindUniqueOrThrowArgs} args - Arguments to find a CustomerAddress
     * @example
     * // Get one CustomerAddress
     * const customerAddress = await prisma.customerAddress.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CustomerAddressFindUniqueOrThrowArgs>(args: SelectSubset<T, CustomerAddressFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CustomerAddressClient<$Result.GetResult<Prisma.$CustomerAddressPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first CustomerAddress that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAddressFindFirstArgs} args - Arguments to find a CustomerAddress
     * @example
     * // Get one CustomerAddress
     * const customerAddress = await prisma.customerAddress.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CustomerAddressFindFirstArgs>(args?: SelectSubset<T, CustomerAddressFindFirstArgs<ExtArgs>>): Prisma__CustomerAddressClient<$Result.GetResult<Prisma.$CustomerAddressPayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first CustomerAddress that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAddressFindFirstOrThrowArgs} args - Arguments to find a CustomerAddress
     * @example
     * // Get one CustomerAddress
     * const customerAddress = await prisma.customerAddress.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CustomerAddressFindFirstOrThrowArgs>(args?: SelectSubset<T, CustomerAddressFindFirstOrThrowArgs<ExtArgs>>): Prisma__CustomerAddressClient<$Result.GetResult<Prisma.$CustomerAddressPayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more CustomerAddresses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAddressFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CustomerAddresses
     * const customerAddresses = await prisma.customerAddress.findMany()
     * 
     * // Get first 10 CustomerAddresses
     * const customerAddresses = await prisma.customerAddress.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const customerAddressWithIdOnly = await prisma.customerAddress.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CustomerAddressFindManyArgs>(args?: SelectSubset<T, CustomerAddressFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerAddressPayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a CustomerAddress.
     * @param {CustomerAddressCreateArgs} args - Arguments to create a CustomerAddress.
     * @example
     * // Create one CustomerAddress
     * const CustomerAddress = await prisma.customerAddress.create({
     *   data: {
     *     // ... data to create a CustomerAddress
     *   }
     * })
     * 
     */
    create<T extends CustomerAddressCreateArgs>(args: SelectSubset<T, CustomerAddressCreateArgs<ExtArgs>>): Prisma__CustomerAddressClient<$Result.GetResult<Prisma.$CustomerAddressPayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many CustomerAddresses.
     * @param {CustomerAddressCreateManyArgs} args - Arguments to create many CustomerAddresses.
     * @example
     * // Create many CustomerAddresses
     * const customerAddress = await prisma.customerAddress.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CustomerAddressCreateManyArgs>(args?: SelectSubset<T, CustomerAddressCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CustomerAddresses and returns the data saved in the database.
     * @param {CustomerAddressCreateManyAndReturnArgs} args - Arguments to create many CustomerAddresses.
     * @example
     * // Create many CustomerAddresses
     * const customerAddress = await prisma.customerAddress.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CustomerAddresses and only return the `id`
     * const customerAddressWithIdOnly = await prisma.customerAddress.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CustomerAddressCreateManyAndReturnArgs>(args?: SelectSubset<T, CustomerAddressCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerAddressPayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a CustomerAddress.
     * @param {CustomerAddressDeleteArgs} args - Arguments to delete one CustomerAddress.
     * @example
     * // Delete one CustomerAddress
     * const CustomerAddress = await prisma.customerAddress.delete({
     *   where: {
     *     // ... filter to delete one CustomerAddress
     *   }
     * })
     * 
     */
    delete<T extends CustomerAddressDeleteArgs>(args: SelectSubset<T, CustomerAddressDeleteArgs<ExtArgs>>): Prisma__CustomerAddressClient<$Result.GetResult<Prisma.$CustomerAddressPayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one CustomerAddress.
     * @param {CustomerAddressUpdateArgs} args - Arguments to update one CustomerAddress.
     * @example
     * // Update one CustomerAddress
     * const customerAddress = await prisma.customerAddress.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CustomerAddressUpdateArgs>(args: SelectSubset<T, CustomerAddressUpdateArgs<ExtArgs>>): Prisma__CustomerAddressClient<$Result.GetResult<Prisma.$CustomerAddressPayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more CustomerAddresses.
     * @param {CustomerAddressDeleteManyArgs} args - Arguments to filter CustomerAddresses to delete.
     * @example
     * // Delete a few CustomerAddresses
     * const { count } = await prisma.customerAddress.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CustomerAddressDeleteManyArgs>(args?: SelectSubset<T, CustomerAddressDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CustomerAddresses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAddressUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CustomerAddresses
     * const customerAddress = await prisma.customerAddress.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CustomerAddressUpdateManyArgs>(args: SelectSubset<T, CustomerAddressUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CustomerAddresses and returns the data updated in the database.
     * @param {CustomerAddressUpdateManyAndReturnArgs} args - Arguments to update many CustomerAddresses.
     * @example
     * // Update many CustomerAddresses
     * const customerAddress = await prisma.customerAddress.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CustomerAddresses and only return the `id`
     * const customerAddressWithIdOnly = await prisma.customerAddress.updateManyAndReturn({
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
    updateManyAndReturn<T extends CustomerAddressUpdateManyAndReturnArgs>(args: SelectSubset<T, CustomerAddressUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerAddressPayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one CustomerAddress.
     * @param {CustomerAddressUpsertArgs} args - Arguments to update or create a CustomerAddress.
     * @example
     * // Update or create a CustomerAddress
     * const customerAddress = await prisma.customerAddress.upsert({
     *   create: {
     *     // ... data to create a CustomerAddress
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CustomerAddress we want to update
     *   }
     * })
     */
    upsert<T extends CustomerAddressUpsertArgs>(args: SelectSubset<T, CustomerAddressUpsertArgs<ExtArgs>>): Prisma__CustomerAddressClient<$Result.GetResult<Prisma.$CustomerAddressPayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of CustomerAddresses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAddressCountArgs} args - Arguments to filter CustomerAddresses to count.
     * @example
     * // Count the number of CustomerAddresses
     * const count = await prisma.customerAddress.count({
     *   where: {
     *     // ... the filter for the CustomerAddresses we want to count
     *   }
     * })
    **/
    count<T extends CustomerAddressCountArgs>(
      args?: Subset<T, CustomerAddressCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CustomerAddressCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CustomerAddress.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAddressAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CustomerAddressAggregateArgs>(args: Subset<T, CustomerAddressAggregateArgs>): Prisma.PrismaPromise<GetCustomerAddressAggregateType<T>>

    /**
     * Group by CustomerAddress.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAddressGroupByArgs} args - Group by arguments.
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
      T extends CustomerAddressGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CustomerAddressGroupByArgs['orderBy'] }
        : { orderBy?: CustomerAddressGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CustomerAddressGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCustomerAddressGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CustomerAddress model
   */
  readonly fields: CustomerAddressFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CustomerAddress.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CustomerAddressClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    customerAccount<T extends CustomerAccountDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CustomerAccountDefaultArgs<ExtArgs>>): Prisma__CustomerAccountClient<$Result.GetResult<Prisma.$CustomerAccountPayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions> | Null, Null, ExtArgs, ClientOptions>
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
   * Fields of the CustomerAddress model
   */ 
  interface CustomerAddressFieldRefs {
    readonly id: FieldRef<"CustomerAddress", 'String'>
    readonly tenantId: FieldRef<"CustomerAddress", 'String'>
    readonly customerAccountId: FieldRef<"CustomerAddress", 'String'>
    readonly label: FieldRef<"CustomerAddress", 'String'>
    readonly countryCode: FieldRef<"CustomerAddress", 'String'>
    readonly region: FieldRef<"CustomerAddress", 'String'>
    readonly locality: FieldRef<"CustomerAddress", 'String'>
    readonly addressLine1: FieldRef<"CustomerAddress", 'String'>
    readonly addressLine2: FieldRef<"CustomerAddress", 'String'>
    readonly postalCode: FieldRef<"CustomerAddress", 'String'>
    readonly isPrimaryAddress: FieldRef<"CustomerAddress", 'Boolean'>
    readonly isActive: FieldRef<"CustomerAddress", 'Boolean'>
    readonly createdAt: FieldRef<"CustomerAddress", 'DateTime'>
    readonly updatedAt: FieldRef<"CustomerAddress", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CustomerAddress findUnique
   */
  export type CustomerAddressFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAddress
     */
    select?: CustomerAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAddress
     */
    omit?: CustomerAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAddressInclude<ExtArgs> | null
    /**
     * Filter, which CustomerAddress to fetch.
     */
    where: CustomerAddressWhereUniqueInput
  }

  /**
   * CustomerAddress findUniqueOrThrow
   */
  export type CustomerAddressFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAddress
     */
    select?: CustomerAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAddress
     */
    omit?: CustomerAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAddressInclude<ExtArgs> | null
    /**
     * Filter, which CustomerAddress to fetch.
     */
    where: CustomerAddressWhereUniqueInput
  }

  /**
   * CustomerAddress findFirst
   */
  export type CustomerAddressFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAddress
     */
    select?: CustomerAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAddress
     */
    omit?: CustomerAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAddressInclude<ExtArgs> | null
    /**
     * Filter, which CustomerAddress to fetch.
     */
    where?: CustomerAddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerAddresses to fetch.
     */
    orderBy?: CustomerAddressOrderByWithRelationInput | CustomerAddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CustomerAddresses.
     */
    cursor?: CustomerAddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerAddresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerAddresses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CustomerAddresses.
     */
    distinct?: CustomerAddressScalarFieldEnum | CustomerAddressScalarFieldEnum[]
  }

  /**
   * CustomerAddress findFirstOrThrow
   */
  export type CustomerAddressFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAddress
     */
    select?: CustomerAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAddress
     */
    omit?: CustomerAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAddressInclude<ExtArgs> | null
    /**
     * Filter, which CustomerAddress to fetch.
     */
    where?: CustomerAddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerAddresses to fetch.
     */
    orderBy?: CustomerAddressOrderByWithRelationInput | CustomerAddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CustomerAddresses.
     */
    cursor?: CustomerAddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerAddresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerAddresses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CustomerAddresses.
     */
    distinct?: CustomerAddressScalarFieldEnum | CustomerAddressScalarFieldEnum[]
  }

  /**
   * CustomerAddress findMany
   */
  export type CustomerAddressFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAddress
     */
    select?: CustomerAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAddress
     */
    omit?: CustomerAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAddressInclude<ExtArgs> | null
    /**
     * Filter, which CustomerAddresses to fetch.
     */
    where?: CustomerAddressWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerAddresses to fetch.
     */
    orderBy?: CustomerAddressOrderByWithRelationInput | CustomerAddressOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CustomerAddresses.
     */
    cursor?: CustomerAddressWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerAddresses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerAddresses.
     */
    skip?: number
    distinct?: CustomerAddressScalarFieldEnum | CustomerAddressScalarFieldEnum[]
  }

  /**
   * CustomerAddress create
   */
  export type CustomerAddressCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAddress
     */
    select?: CustomerAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAddress
     */
    omit?: CustomerAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAddressInclude<ExtArgs> | null
    /**
     * The data needed to create a CustomerAddress.
     */
    data: XOR<CustomerAddressCreateInput, CustomerAddressUncheckedCreateInput>
  }

  /**
   * CustomerAddress createMany
   */
  export type CustomerAddressCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CustomerAddresses.
     */
    data: CustomerAddressCreateManyInput | CustomerAddressCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CustomerAddress createManyAndReturn
   */
  export type CustomerAddressCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAddress
     */
    select?: CustomerAddressSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAddress
     */
    omit?: CustomerAddressOmit<ExtArgs> | null
    /**
     * The data used to create many CustomerAddresses.
     */
    data: CustomerAddressCreateManyInput | CustomerAddressCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAddressIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CustomerAddress update
   */
  export type CustomerAddressUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAddress
     */
    select?: CustomerAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAddress
     */
    omit?: CustomerAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAddressInclude<ExtArgs> | null
    /**
     * The data needed to update a CustomerAddress.
     */
    data: XOR<CustomerAddressUpdateInput, CustomerAddressUncheckedUpdateInput>
    /**
     * Choose, which CustomerAddress to update.
     */
    where: CustomerAddressWhereUniqueInput
  }

  /**
   * CustomerAddress updateMany
   */
  export type CustomerAddressUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CustomerAddresses.
     */
    data: XOR<CustomerAddressUpdateManyMutationInput, CustomerAddressUncheckedUpdateManyInput>
    /**
     * Filter which CustomerAddresses to update
     */
    where?: CustomerAddressWhereInput
    /**
     * Limit how many CustomerAddresses to update.
     */
    limit?: number
  }

  /**
   * CustomerAddress updateManyAndReturn
   */
  export type CustomerAddressUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAddress
     */
    select?: CustomerAddressSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAddress
     */
    omit?: CustomerAddressOmit<ExtArgs> | null
    /**
     * The data used to update CustomerAddresses.
     */
    data: XOR<CustomerAddressUpdateManyMutationInput, CustomerAddressUncheckedUpdateManyInput>
    /**
     * Filter which CustomerAddresses to update
     */
    where?: CustomerAddressWhereInput
    /**
     * Limit how many CustomerAddresses to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAddressIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CustomerAddress upsert
   */
  export type CustomerAddressUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAddress
     */
    select?: CustomerAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAddress
     */
    omit?: CustomerAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAddressInclude<ExtArgs> | null
    /**
     * The filter to search for the CustomerAddress to update in case it exists.
     */
    where: CustomerAddressWhereUniqueInput
    /**
     * In case the CustomerAddress found by the `where` argument doesn't exist, create a new CustomerAddress with this data.
     */
    create: XOR<CustomerAddressCreateInput, CustomerAddressUncheckedCreateInput>
    /**
     * In case the CustomerAddress was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CustomerAddressUpdateInput, CustomerAddressUncheckedUpdateInput>
  }

  /**
   * CustomerAddress delete
   */
  export type CustomerAddressDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAddress
     */
    select?: CustomerAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAddress
     */
    omit?: CustomerAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAddressInclude<ExtArgs> | null
    /**
     * Filter which CustomerAddress to delete.
     */
    where: CustomerAddressWhereUniqueInput
  }

  /**
   * CustomerAddress deleteMany
   */
  export type CustomerAddressDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CustomerAddresses to delete
     */
    where?: CustomerAddressWhereInput
    /**
     * Limit how many CustomerAddresses to delete.
     */
    limit?: number
  }

  /**
   * CustomerAddress without action
   */
  export type CustomerAddressDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerAddress
     */
    select?: CustomerAddressSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerAddress
     */
    omit?: CustomerAddressOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CustomerAddressInclude<ExtArgs> | null
  }


  /**
   * Model CrmAuditEnvelope
   */

  export type AggregateCrmAuditEnvelope = {
    _count: CrmAuditEnvelopeCountAggregateOutputType | null
    _min: CrmAuditEnvelopeMinAggregateOutputType | null
    _max: CrmAuditEnvelopeMaxAggregateOutputType | null
  }

  export type CrmAuditEnvelopeMinAggregateOutputType = {
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

  export type CrmAuditEnvelopeMaxAggregateOutputType = {
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

  export type CrmAuditEnvelopeCountAggregateOutputType = {
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


  export type CrmAuditEnvelopeMinAggregateInputType = {
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

  export type CrmAuditEnvelopeMaxAggregateInputType = {
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

  export type CrmAuditEnvelopeCountAggregateInputType = {
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

  export type CrmAuditEnvelopeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CrmAuditEnvelope to aggregate.
     */
    where?: CrmAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrmAuditEnvelopes to fetch.
     */
    orderBy?: CrmAuditEnvelopeOrderByWithRelationInput | CrmAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CrmAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrmAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrmAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CrmAuditEnvelopes
    **/
    _count?: true | CrmAuditEnvelopeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CrmAuditEnvelopeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CrmAuditEnvelopeMaxAggregateInputType
  }

  export type GetCrmAuditEnvelopeAggregateType<T extends CrmAuditEnvelopeAggregateArgs> = {
        [P in keyof T & keyof AggregateCrmAuditEnvelope]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCrmAuditEnvelope[P]>
      : GetScalarType<T[P], AggregateCrmAuditEnvelope[P]>
  }




  export type CrmAuditEnvelopeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CrmAuditEnvelopeWhereInput
    orderBy?: CrmAuditEnvelopeOrderByWithAggregationInput | CrmAuditEnvelopeOrderByWithAggregationInput[]
    by: CrmAuditEnvelopeScalarFieldEnum[] | CrmAuditEnvelopeScalarFieldEnum
    having?: CrmAuditEnvelopeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CrmAuditEnvelopeCountAggregateInputType | true
    _min?: CrmAuditEnvelopeMinAggregateInputType
    _max?: CrmAuditEnvelopeMaxAggregateInputType
  }

  export type CrmAuditEnvelopeGroupByOutputType = {
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
    _count: CrmAuditEnvelopeCountAggregateOutputType | null
    _min: CrmAuditEnvelopeMinAggregateOutputType | null
    _max: CrmAuditEnvelopeMaxAggregateOutputType | null
  }

  type GetCrmAuditEnvelopeGroupByPayload<T extends CrmAuditEnvelopeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CrmAuditEnvelopeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CrmAuditEnvelopeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CrmAuditEnvelopeGroupByOutputType[P]>
            : GetScalarType<T[P], CrmAuditEnvelopeGroupByOutputType[P]>
        }
      >
    >


  export type CrmAuditEnvelopeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["crmAuditEnvelope"]>

  export type CrmAuditEnvelopeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["crmAuditEnvelope"]>

  export type CrmAuditEnvelopeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
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
  }, ExtArgs["result"]["crmAuditEnvelope"]>

  export type CrmAuditEnvelopeSelectScalar = {
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

  export type CrmAuditEnvelopeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "service" | "module" | "eventType" | "occurredAt" | "result" | "operatorId" | "operatorType" | "tenantId" | "orgId" | "traceId" | "resourceType" | "resourceId" | "details" | "createdAt", ExtArgs["result"]["crmAuditEnvelope"]>

  export type $CrmAuditEnvelopePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CrmAuditEnvelope"
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
    }, ExtArgs["result"]["crmAuditEnvelope"]>
    composites: {}
  }

  type CrmAuditEnvelopeGetPayload<S extends boolean | null | undefined | CrmAuditEnvelopeDefaultArgs> = $Result.GetResult<Prisma.$CrmAuditEnvelopePayload, S>

  type CrmAuditEnvelopeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CrmAuditEnvelopeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CrmAuditEnvelopeCountAggregateInputType | true
    }

  export interface CrmAuditEnvelopeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CrmAuditEnvelope'], meta: { name: 'CrmAuditEnvelope' } }
    /**
     * Find zero or one CrmAuditEnvelope that matches the filter.
     * @param {CrmAuditEnvelopeFindUniqueArgs} args - Arguments to find a CrmAuditEnvelope
     * @example
     * // Get one CrmAuditEnvelope
     * const crmAuditEnvelope = await prisma.crmAuditEnvelope.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CrmAuditEnvelopeFindUniqueArgs>(args: SelectSubset<T, CrmAuditEnvelopeFindUniqueArgs<ExtArgs>>): Prisma__CrmAuditEnvelopeClient<$Result.GetResult<Prisma.$CrmAuditEnvelopePayload<ExtArgs>, T, "findUnique", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find one CrmAuditEnvelope that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CrmAuditEnvelopeFindUniqueOrThrowArgs} args - Arguments to find a CrmAuditEnvelope
     * @example
     * // Get one CrmAuditEnvelope
     * const crmAuditEnvelope = await prisma.crmAuditEnvelope.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CrmAuditEnvelopeFindUniqueOrThrowArgs>(args: SelectSubset<T, CrmAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CrmAuditEnvelopeClient<$Result.GetResult<Prisma.$CrmAuditEnvelopePayload<ExtArgs>, T, "findUniqueOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find the first CrmAuditEnvelope that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmAuditEnvelopeFindFirstArgs} args - Arguments to find a CrmAuditEnvelope
     * @example
     * // Get one CrmAuditEnvelope
     * const crmAuditEnvelope = await prisma.crmAuditEnvelope.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CrmAuditEnvelopeFindFirstArgs>(args?: SelectSubset<T, CrmAuditEnvelopeFindFirstArgs<ExtArgs>>): Prisma__CrmAuditEnvelopeClient<$Result.GetResult<Prisma.$CrmAuditEnvelopePayload<ExtArgs>, T, "findFirst", ClientOptions> | null, null, ExtArgs, ClientOptions>

    /**
     * Find the first CrmAuditEnvelope that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmAuditEnvelopeFindFirstOrThrowArgs} args - Arguments to find a CrmAuditEnvelope
     * @example
     * // Get one CrmAuditEnvelope
     * const crmAuditEnvelope = await prisma.crmAuditEnvelope.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CrmAuditEnvelopeFindFirstOrThrowArgs>(args?: SelectSubset<T, CrmAuditEnvelopeFindFirstOrThrowArgs<ExtArgs>>): Prisma__CrmAuditEnvelopeClient<$Result.GetResult<Prisma.$CrmAuditEnvelopePayload<ExtArgs>, T, "findFirstOrThrow", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Find zero or more CrmAuditEnvelopes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmAuditEnvelopeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CrmAuditEnvelopes
     * const crmAuditEnvelopes = await prisma.crmAuditEnvelope.findMany()
     * 
     * // Get first 10 CrmAuditEnvelopes
     * const crmAuditEnvelopes = await prisma.crmAuditEnvelope.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const crmAuditEnvelopeWithIdOnly = await prisma.crmAuditEnvelope.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CrmAuditEnvelopeFindManyArgs>(args?: SelectSubset<T, CrmAuditEnvelopeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrmAuditEnvelopePayload<ExtArgs>, T, "findMany", ClientOptions>>

    /**
     * Create a CrmAuditEnvelope.
     * @param {CrmAuditEnvelopeCreateArgs} args - Arguments to create a CrmAuditEnvelope.
     * @example
     * // Create one CrmAuditEnvelope
     * const CrmAuditEnvelope = await prisma.crmAuditEnvelope.create({
     *   data: {
     *     // ... data to create a CrmAuditEnvelope
     *   }
     * })
     * 
     */
    create<T extends CrmAuditEnvelopeCreateArgs>(args: SelectSubset<T, CrmAuditEnvelopeCreateArgs<ExtArgs>>): Prisma__CrmAuditEnvelopeClient<$Result.GetResult<Prisma.$CrmAuditEnvelopePayload<ExtArgs>, T, "create", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Create many CrmAuditEnvelopes.
     * @param {CrmAuditEnvelopeCreateManyArgs} args - Arguments to create many CrmAuditEnvelopes.
     * @example
     * // Create many CrmAuditEnvelopes
     * const crmAuditEnvelope = await prisma.crmAuditEnvelope.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CrmAuditEnvelopeCreateManyArgs>(args?: SelectSubset<T, CrmAuditEnvelopeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CrmAuditEnvelopes and returns the data saved in the database.
     * @param {CrmAuditEnvelopeCreateManyAndReturnArgs} args - Arguments to create many CrmAuditEnvelopes.
     * @example
     * // Create many CrmAuditEnvelopes
     * const crmAuditEnvelope = await prisma.crmAuditEnvelope.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CrmAuditEnvelopes and only return the `id`
     * const crmAuditEnvelopeWithIdOnly = await prisma.crmAuditEnvelope.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CrmAuditEnvelopeCreateManyAndReturnArgs>(args?: SelectSubset<T, CrmAuditEnvelopeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrmAuditEnvelopePayload<ExtArgs>, T, "createManyAndReturn", ClientOptions>>

    /**
     * Delete a CrmAuditEnvelope.
     * @param {CrmAuditEnvelopeDeleteArgs} args - Arguments to delete one CrmAuditEnvelope.
     * @example
     * // Delete one CrmAuditEnvelope
     * const CrmAuditEnvelope = await prisma.crmAuditEnvelope.delete({
     *   where: {
     *     // ... filter to delete one CrmAuditEnvelope
     *   }
     * })
     * 
     */
    delete<T extends CrmAuditEnvelopeDeleteArgs>(args: SelectSubset<T, CrmAuditEnvelopeDeleteArgs<ExtArgs>>): Prisma__CrmAuditEnvelopeClient<$Result.GetResult<Prisma.$CrmAuditEnvelopePayload<ExtArgs>, T, "delete", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Update one CrmAuditEnvelope.
     * @param {CrmAuditEnvelopeUpdateArgs} args - Arguments to update one CrmAuditEnvelope.
     * @example
     * // Update one CrmAuditEnvelope
     * const crmAuditEnvelope = await prisma.crmAuditEnvelope.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CrmAuditEnvelopeUpdateArgs>(args: SelectSubset<T, CrmAuditEnvelopeUpdateArgs<ExtArgs>>): Prisma__CrmAuditEnvelopeClient<$Result.GetResult<Prisma.$CrmAuditEnvelopePayload<ExtArgs>, T, "update", ClientOptions>, never, ExtArgs, ClientOptions>

    /**
     * Delete zero or more CrmAuditEnvelopes.
     * @param {CrmAuditEnvelopeDeleteManyArgs} args - Arguments to filter CrmAuditEnvelopes to delete.
     * @example
     * // Delete a few CrmAuditEnvelopes
     * const { count } = await prisma.crmAuditEnvelope.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CrmAuditEnvelopeDeleteManyArgs>(args?: SelectSubset<T, CrmAuditEnvelopeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CrmAuditEnvelopes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmAuditEnvelopeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CrmAuditEnvelopes
     * const crmAuditEnvelope = await prisma.crmAuditEnvelope.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CrmAuditEnvelopeUpdateManyArgs>(args: SelectSubset<T, CrmAuditEnvelopeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CrmAuditEnvelopes and returns the data updated in the database.
     * @param {CrmAuditEnvelopeUpdateManyAndReturnArgs} args - Arguments to update many CrmAuditEnvelopes.
     * @example
     * // Update many CrmAuditEnvelopes
     * const crmAuditEnvelope = await prisma.crmAuditEnvelope.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CrmAuditEnvelopes and only return the `id`
     * const crmAuditEnvelopeWithIdOnly = await prisma.crmAuditEnvelope.updateManyAndReturn({
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
    updateManyAndReturn<T extends CrmAuditEnvelopeUpdateManyAndReturnArgs>(args: SelectSubset<T, CrmAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CrmAuditEnvelopePayload<ExtArgs>, T, "updateManyAndReturn", ClientOptions>>

    /**
     * Create or update one CrmAuditEnvelope.
     * @param {CrmAuditEnvelopeUpsertArgs} args - Arguments to update or create a CrmAuditEnvelope.
     * @example
     * // Update or create a CrmAuditEnvelope
     * const crmAuditEnvelope = await prisma.crmAuditEnvelope.upsert({
     *   create: {
     *     // ... data to create a CrmAuditEnvelope
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CrmAuditEnvelope we want to update
     *   }
     * })
     */
    upsert<T extends CrmAuditEnvelopeUpsertArgs>(args: SelectSubset<T, CrmAuditEnvelopeUpsertArgs<ExtArgs>>): Prisma__CrmAuditEnvelopeClient<$Result.GetResult<Prisma.$CrmAuditEnvelopePayload<ExtArgs>, T, "upsert", ClientOptions>, never, ExtArgs, ClientOptions>


    /**
     * Count the number of CrmAuditEnvelopes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmAuditEnvelopeCountArgs} args - Arguments to filter CrmAuditEnvelopes to count.
     * @example
     * // Count the number of CrmAuditEnvelopes
     * const count = await prisma.crmAuditEnvelope.count({
     *   where: {
     *     // ... the filter for the CrmAuditEnvelopes we want to count
     *   }
     * })
    **/
    count<T extends CrmAuditEnvelopeCountArgs>(
      args?: Subset<T, CrmAuditEnvelopeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CrmAuditEnvelopeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CrmAuditEnvelope.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmAuditEnvelopeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CrmAuditEnvelopeAggregateArgs>(args: Subset<T, CrmAuditEnvelopeAggregateArgs>): Prisma.PrismaPromise<GetCrmAuditEnvelopeAggregateType<T>>

    /**
     * Group by CrmAuditEnvelope.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CrmAuditEnvelopeGroupByArgs} args - Group by arguments.
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
      T extends CrmAuditEnvelopeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CrmAuditEnvelopeGroupByArgs['orderBy'] }
        : { orderBy?: CrmAuditEnvelopeGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CrmAuditEnvelopeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCrmAuditEnvelopeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CrmAuditEnvelope model
   */
  readonly fields: CrmAuditEnvelopeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CrmAuditEnvelope.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CrmAuditEnvelopeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the CrmAuditEnvelope model
   */ 
  interface CrmAuditEnvelopeFieldRefs {
    readonly id: FieldRef<"CrmAuditEnvelope", 'String'>
    readonly service: FieldRef<"CrmAuditEnvelope", 'String'>
    readonly module: FieldRef<"CrmAuditEnvelope", 'String'>
    readonly eventType: FieldRef<"CrmAuditEnvelope", 'String'>
    readonly occurredAt: FieldRef<"CrmAuditEnvelope", 'DateTime'>
    readonly result: FieldRef<"CrmAuditEnvelope", 'String'>
    readonly operatorId: FieldRef<"CrmAuditEnvelope", 'String'>
    readonly operatorType: FieldRef<"CrmAuditEnvelope", 'String'>
    readonly tenantId: FieldRef<"CrmAuditEnvelope", 'String'>
    readonly orgId: FieldRef<"CrmAuditEnvelope", 'String'>
    readonly traceId: FieldRef<"CrmAuditEnvelope", 'String'>
    readonly resourceType: FieldRef<"CrmAuditEnvelope", 'String'>
    readonly resourceId: FieldRef<"CrmAuditEnvelope", 'String'>
    readonly details: FieldRef<"CrmAuditEnvelope", 'Json'>
    readonly createdAt: FieldRef<"CrmAuditEnvelope", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CrmAuditEnvelope findUnique
   */
  export type CrmAuditEnvelopeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmAuditEnvelope
     */
    select?: CrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmAuditEnvelope
     */
    omit?: CrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which CrmAuditEnvelope to fetch.
     */
    where: CrmAuditEnvelopeWhereUniqueInput
  }

  /**
   * CrmAuditEnvelope findUniqueOrThrow
   */
  export type CrmAuditEnvelopeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmAuditEnvelope
     */
    select?: CrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmAuditEnvelope
     */
    omit?: CrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which CrmAuditEnvelope to fetch.
     */
    where: CrmAuditEnvelopeWhereUniqueInput
  }

  /**
   * CrmAuditEnvelope findFirst
   */
  export type CrmAuditEnvelopeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmAuditEnvelope
     */
    select?: CrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmAuditEnvelope
     */
    omit?: CrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which CrmAuditEnvelope to fetch.
     */
    where?: CrmAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrmAuditEnvelopes to fetch.
     */
    orderBy?: CrmAuditEnvelopeOrderByWithRelationInput | CrmAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CrmAuditEnvelopes.
     */
    cursor?: CrmAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrmAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrmAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CrmAuditEnvelopes.
     */
    distinct?: CrmAuditEnvelopeScalarFieldEnum | CrmAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * CrmAuditEnvelope findFirstOrThrow
   */
  export type CrmAuditEnvelopeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmAuditEnvelope
     */
    select?: CrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmAuditEnvelope
     */
    omit?: CrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which CrmAuditEnvelope to fetch.
     */
    where?: CrmAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrmAuditEnvelopes to fetch.
     */
    orderBy?: CrmAuditEnvelopeOrderByWithRelationInput | CrmAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CrmAuditEnvelopes.
     */
    cursor?: CrmAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrmAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrmAuditEnvelopes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CrmAuditEnvelopes.
     */
    distinct?: CrmAuditEnvelopeScalarFieldEnum | CrmAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * CrmAuditEnvelope findMany
   */
  export type CrmAuditEnvelopeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmAuditEnvelope
     */
    select?: CrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmAuditEnvelope
     */
    omit?: CrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter, which CrmAuditEnvelopes to fetch.
     */
    where?: CrmAuditEnvelopeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CrmAuditEnvelopes to fetch.
     */
    orderBy?: CrmAuditEnvelopeOrderByWithRelationInput | CrmAuditEnvelopeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CrmAuditEnvelopes.
     */
    cursor?: CrmAuditEnvelopeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CrmAuditEnvelopes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CrmAuditEnvelopes.
     */
    skip?: number
    distinct?: CrmAuditEnvelopeScalarFieldEnum | CrmAuditEnvelopeScalarFieldEnum[]
  }

  /**
   * CrmAuditEnvelope create
   */
  export type CrmAuditEnvelopeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmAuditEnvelope
     */
    select?: CrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmAuditEnvelope
     */
    omit?: CrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data needed to create a CrmAuditEnvelope.
     */
    data: XOR<CrmAuditEnvelopeCreateInput, CrmAuditEnvelopeUncheckedCreateInput>
  }

  /**
   * CrmAuditEnvelope createMany
   */
  export type CrmAuditEnvelopeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CrmAuditEnvelopes.
     */
    data: CrmAuditEnvelopeCreateManyInput | CrmAuditEnvelopeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CrmAuditEnvelope createManyAndReturn
   */
  export type CrmAuditEnvelopeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmAuditEnvelope
     */
    select?: CrmAuditEnvelopeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CrmAuditEnvelope
     */
    omit?: CrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data used to create many CrmAuditEnvelopes.
     */
    data: CrmAuditEnvelopeCreateManyInput | CrmAuditEnvelopeCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CrmAuditEnvelope update
   */
  export type CrmAuditEnvelopeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmAuditEnvelope
     */
    select?: CrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmAuditEnvelope
     */
    omit?: CrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data needed to update a CrmAuditEnvelope.
     */
    data: XOR<CrmAuditEnvelopeUpdateInput, CrmAuditEnvelopeUncheckedUpdateInput>
    /**
     * Choose, which CrmAuditEnvelope to update.
     */
    where: CrmAuditEnvelopeWhereUniqueInput
  }

  /**
   * CrmAuditEnvelope updateMany
   */
  export type CrmAuditEnvelopeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CrmAuditEnvelopes.
     */
    data: XOR<CrmAuditEnvelopeUpdateManyMutationInput, CrmAuditEnvelopeUncheckedUpdateManyInput>
    /**
     * Filter which CrmAuditEnvelopes to update
     */
    where?: CrmAuditEnvelopeWhereInput
    /**
     * Limit how many CrmAuditEnvelopes to update.
     */
    limit?: number
  }

  /**
   * CrmAuditEnvelope updateManyAndReturn
   */
  export type CrmAuditEnvelopeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmAuditEnvelope
     */
    select?: CrmAuditEnvelopeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CrmAuditEnvelope
     */
    omit?: CrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The data used to update CrmAuditEnvelopes.
     */
    data: XOR<CrmAuditEnvelopeUpdateManyMutationInput, CrmAuditEnvelopeUncheckedUpdateManyInput>
    /**
     * Filter which CrmAuditEnvelopes to update
     */
    where?: CrmAuditEnvelopeWhereInput
    /**
     * Limit how many CrmAuditEnvelopes to update.
     */
    limit?: number
  }

  /**
   * CrmAuditEnvelope upsert
   */
  export type CrmAuditEnvelopeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmAuditEnvelope
     */
    select?: CrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmAuditEnvelope
     */
    omit?: CrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * The filter to search for the CrmAuditEnvelope to update in case it exists.
     */
    where: CrmAuditEnvelopeWhereUniqueInput
    /**
     * In case the CrmAuditEnvelope found by the `where` argument doesn't exist, create a new CrmAuditEnvelope with this data.
     */
    create: XOR<CrmAuditEnvelopeCreateInput, CrmAuditEnvelopeUncheckedCreateInput>
    /**
     * In case the CrmAuditEnvelope was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CrmAuditEnvelopeUpdateInput, CrmAuditEnvelopeUncheckedUpdateInput>
  }

  /**
   * CrmAuditEnvelope delete
   */
  export type CrmAuditEnvelopeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmAuditEnvelope
     */
    select?: CrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmAuditEnvelope
     */
    omit?: CrmAuditEnvelopeOmit<ExtArgs> | null
    /**
     * Filter which CrmAuditEnvelope to delete.
     */
    where: CrmAuditEnvelopeWhereUniqueInput
  }

  /**
   * CrmAuditEnvelope deleteMany
   */
  export type CrmAuditEnvelopeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CrmAuditEnvelopes to delete
     */
    where?: CrmAuditEnvelopeWhereInput
    /**
     * Limit how many CrmAuditEnvelopes to delete.
     */
    limit?: number
  }

  /**
   * CrmAuditEnvelope without action
   */
  export type CrmAuditEnvelopeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CrmAuditEnvelope
     */
    select?: CrmAuditEnvelopeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CrmAuditEnvelope
     */
    omit?: CrmAuditEnvelopeOmit<ExtArgs> | null
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


  export const CrmSequenceCounterScalarFieldEnum: {
    tenantId: 'tenantId',
    nextCustomerAccountNo: 'nextCustomerAccountNo',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CrmSequenceCounterScalarFieldEnum = (typeof CrmSequenceCounterScalarFieldEnum)[keyof typeof CrmSequenceCounterScalarFieldEnum]


  export const CustomerAccountScalarFieldEnum: {
    id: 'id',
    customerAccountNo: 'customerAccountNo',
    tenantId: 'tenantId',
    displayName: 'displayName',
    status: 'status',
    customerCategory: 'customerCategory',
    tags: 'tags',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CustomerAccountScalarFieldEnum = (typeof CustomerAccountScalarFieldEnum)[keyof typeof CustomerAccountScalarFieldEnum]


  export const CustomerPartyBindingScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    customerAccountId: 'customerAccountId',
    tenantPartyId: 'tenantPartyId',
    bindingStatus: 'bindingStatus',
    partyDisplayName: 'partyDisplayName',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CustomerPartyBindingScalarFieldEnum = (typeof CustomerPartyBindingScalarFieldEnum)[keyof typeof CustomerPartyBindingScalarFieldEnum]


  export const CustomerContactScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    customerAccountId: 'customerAccountId',
    displayName: 'displayName',
    roleTitle: 'roleTitle',
    email: 'email',
    phone: 'phone',
    isPrimaryContact: 'isPrimaryContact',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CustomerContactScalarFieldEnum = (typeof CustomerContactScalarFieldEnum)[keyof typeof CustomerContactScalarFieldEnum]


  export const CustomerAddressScalarFieldEnum: {
    id: 'id',
    tenantId: 'tenantId',
    customerAccountId: 'customerAccountId',
    label: 'label',
    countryCode: 'countryCode',
    region: 'region',
    locality: 'locality',
    addressLine1: 'addressLine1',
    addressLine2: 'addressLine2',
    postalCode: 'postalCode',
    isPrimaryAddress: 'isPrimaryAddress',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CustomerAddressScalarFieldEnum = (typeof CustomerAddressScalarFieldEnum)[keyof typeof CustomerAddressScalarFieldEnum]


  export const CrmAuditEnvelopeScalarFieldEnum: {
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

  export type CrmAuditEnvelopeScalarFieldEnum = (typeof CrmAuditEnvelopeScalarFieldEnum)[keyof typeof CrmAuditEnvelopeScalarFieldEnum]


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


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


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
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'CrmCustomerStatus'
   */
  export type EnumCrmCustomerStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CrmCustomerStatus'>
    


  /**
   * Reference to a field of type 'CrmCustomerStatus[]'
   */
  export type ListEnumCrmCustomerStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CrmCustomerStatus[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'CrmCustomerPartyBindingStatus'
   */
  export type EnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CrmCustomerPartyBindingStatus'>
    


  /**
   * Reference to a field of type 'CrmCustomerPartyBindingStatus[]'
   */
  export type ListEnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CrmCustomerPartyBindingStatus[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


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


  export type CrmSequenceCounterWhereInput = {
    AND?: CrmSequenceCounterWhereInput | CrmSequenceCounterWhereInput[]
    OR?: CrmSequenceCounterWhereInput[]
    NOT?: CrmSequenceCounterWhereInput | CrmSequenceCounterWhereInput[]
    tenantId?: StringFilter<"CrmSequenceCounter"> | string
    nextCustomerAccountNo?: IntFilter<"CrmSequenceCounter"> | number
    createdAt?: DateTimeFilter<"CrmSequenceCounter"> | Date | string
    updatedAt?: DateTimeFilter<"CrmSequenceCounter"> | Date | string
  }

  export type CrmSequenceCounterOrderByWithRelationInput = {
    tenantId?: SortOrder
    nextCustomerAccountNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CrmSequenceCounterWhereUniqueInput = Prisma.AtLeast<{
    tenantId?: string
    AND?: CrmSequenceCounterWhereInput | CrmSequenceCounterWhereInput[]
    OR?: CrmSequenceCounterWhereInput[]
    NOT?: CrmSequenceCounterWhereInput | CrmSequenceCounterWhereInput[]
    nextCustomerAccountNo?: IntFilter<"CrmSequenceCounter"> | number
    createdAt?: DateTimeFilter<"CrmSequenceCounter"> | Date | string
    updatedAt?: DateTimeFilter<"CrmSequenceCounter"> | Date | string
  }, "tenantId">

  export type CrmSequenceCounterOrderByWithAggregationInput = {
    tenantId?: SortOrder
    nextCustomerAccountNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CrmSequenceCounterCountOrderByAggregateInput
    _avg?: CrmSequenceCounterAvgOrderByAggregateInput
    _max?: CrmSequenceCounterMaxOrderByAggregateInput
    _min?: CrmSequenceCounterMinOrderByAggregateInput
    _sum?: CrmSequenceCounterSumOrderByAggregateInput
  }

  export type CrmSequenceCounterScalarWhereWithAggregatesInput = {
    AND?: CrmSequenceCounterScalarWhereWithAggregatesInput | CrmSequenceCounterScalarWhereWithAggregatesInput[]
    OR?: CrmSequenceCounterScalarWhereWithAggregatesInput[]
    NOT?: CrmSequenceCounterScalarWhereWithAggregatesInput | CrmSequenceCounterScalarWhereWithAggregatesInput[]
    tenantId?: StringWithAggregatesFilter<"CrmSequenceCounter"> | string
    nextCustomerAccountNo?: IntWithAggregatesFilter<"CrmSequenceCounter"> | number
    createdAt?: DateTimeWithAggregatesFilter<"CrmSequenceCounter"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CrmSequenceCounter"> | Date | string
  }

  export type CustomerAccountWhereInput = {
    AND?: CustomerAccountWhereInput | CustomerAccountWhereInput[]
    OR?: CustomerAccountWhereInput[]
    NOT?: CustomerAccountWhereInput | CustomerAccountWhereInput[]
    id?: UuidFilter<"CustomerAccount"> | string
    customerAccountNo?: StringFilter<"CustomerAccount"> | string
    tenantId?: StringFilter<"CustomerAccount"> | string
    displayName?: StringFilter<"CustomerAccount"> | string
    status?: EnumCrmCustomerStatusFilter<"CustomerAccount"> | $Enums.CrmCustomerStatus
    customerCategory?: StringNullableFilter<"CustomerAccount"> | string | null
    tags?: JsonFilter<"CustomerAccount">
    createdAt?: DateTimeFilter<"CustomerAccount"> | Date | string
    updatedAt?: DateTimeFilter<"CustomerAccount"> | Date | string
    primaryBinding?: XOR<CustomerPartyBindingNullableScalarRelationFilter, CustomerPartyBindingWhereInput> | null
    contacts?: CustomerContactListRelationFilter
    addresses?: CustomerAddressListRelationFilter
  }

  export type CustomerAccountOrderByWithRelationInput = {
    id?: SortOrder
    customerAccountNo?: SortOrder
    tenantId?: SortOrder
    displayName?: SortOrder
    status?: SortOrder
    customerCategory?: SortOrderInput | SortOrder
    tags?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    primaryBinding?: CustomerPartyBindingOrderByWithRelationInput
    contacts?: CustomerContactOrderByRelationAggregateInput
    addresses?: CustomerAddressOrderByRelationAggregateInput
  }

  export type CustomerAccountWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    customerAccountNo?: string
    AND?: CustomerAccountWhereInput | CustomerAccountWhereInput[]
    OR?: CustomerAccountWhereInput[]
    NOT?: CustomerAccountWhereInput | CustomerAccountWhereInput[]
    tenantId?: StringFilter<"CustomerAccount"> | string
    displayName?: StringFilter<"CustomerAccount"> | string
    status?: EnumCrmCustomerStatusFilter<"CustomerAccount"> | $Enums.CrmCustomerStatus
    customerCategory?: StringNullableFilter<"CustomerAccount"> | string | null
    tags?: JsonFilter<"CustomerAccount">
    createdAt?: DateTimeFilter<"CustomerAccount"> | Date | string
    updatedAt?: DateTimeFilter<"CustomerAccount"> | Date | string
    primaryBinding?: XOR<CustomerPartyBindingNullableScalarRelationFilter, CustomerPartyBindingWhereInput> | null
    contacts?: CustomerContactListRelationFilter
    addresses?: CustomerAddressListRelationFilter
  }, "id" | "customerAccountNo">

  export type CustomerAccountOrderByWithAggregationInput = {
    id?: SortOrder
    customerAccountNo?: SortOrder
    tenantId?: SortOrder
    displayName?: SortOrder
    status?: SortOrder
    customerCategory?: SortOrderInput | SortOrder
    tags?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CustomerAccountCountOrderByAggregateInput
    _max?: CustomerAccountMaxOrderByAggregateInput
    _min?: CustomerAccountMinOrderByAggregateInput
  }

  export type CustomerAccountScalarWhereWithAggregatesInput = {
    AND?: CustomerAccountScalarWhereWithAggregatesInput | CustomerAccountScalarWhereWithAggregatesInput[]
    OR?: CustomerAccountScalarWhereWithAggregatesInput[]
    NOT?: CustomerAccountScalarWhereWithAggregatesInput | CustomerAccountScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"CustomerAccount"> | string
    customerAccountNo?: StringWithAggregatesFilter<"CustomerAccount"> | string
    tenantId?: StringWithAggregatesFilter<"CustomerAccount"> | string
    displayName?: StringWithAggregatesFilter<"CustomerAccount"> | string
    status?: EnumCrmCustomerStatusWithAggregatesFilter<"CustomerAccount"> | $Enums.CrmCustomerStatus
    customerCategory?: StringNullableWithAggregatesFilter<"CustomerAccount"> | string | null
    tags?: JsonWithAggregatesFilter<"CustomerAccount">
    createdAt?: DateTimeWithAggregatesFilter<"CustomerAccount"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CustomerAccount"> | Date | string
  }

  export type CustomerPartyBindingWhereInput = {
    AND?: CustomerPartyBindingWhereInput | CustomerPartyBindingWhereInput[]
    OR?: CustomerPartyBindingWhereInput[]
    NOT?: CustomerPartyBindingWhereInput | CustomerPartyBindingWhereInput[]
    id?: UuidFilter<"CustomerPartyBinding"> | string
    tenantId?: StringFilter<"CustomerPartyBinding"> | string
    customerAccountId?: UuidFilter<"CustomerPartyBinding"> | string
    tenantPartyId?: StringFilter<"CustomerPartyBinding"> | string
    bindingStatus?: EnumCrmCustomerPartyBindingStatusFilter<"CustomerPartyBinding"> | $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: StringNullableFilter<"CustomerPartyBinding"> | string | null
    createdAt?: DateTimeFilter<"CustomerPartyBinding"> | Date | string
    updatedAt?: DateTimeFilter<"CustomerPartyBinding"> | Date | string
    customerAccount?: XOR<CustomerAccountScalarRelationFilter, CustomerAccountWhereInput>
  }

  export type CustomerPartyBindingOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    tenantPartyId?: SortOrder
    bindingStatus?: SortOrder
    partyDisplayName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    customerAccount?: CustomerAccountOrderByWithRelationInput
  }

  export type CustomerPartyBindingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    customerAccountId?: string
    tenantId_tenantPartyId?: CustomerPartyBindingTenantIdTenantPartyIdCompoundUniqueInput
    AND?: CustomerPartyBindingWhereInput | CustomerPartyBindingWhereInput[]
    OR?: CustomerPartyBindingWhereInput[]
    NOT?: CustomerPartyBindingWhereInput | CustomerPartyBindingWhereInput[]
    tenantId?: StringFilter<"CustomerPartyBinding"> | string
    tenantPartyId?: StringFilter<"CustomerPartyBinding"> | string
    bindingStatus?: EnumCrmCustomerPartyBindingStatusFilter<"CustomerPartyBinding"> | $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: StringNullableFilter<"CustomerPartyBinding"> | string | null
    createdAt?: DateTimeFilter<"CustomerPartyBinding"> | Date | string
    updatedAt?: DateTimeFilter<"CustomerPartyBinding"> | Date | string
    customerAccount?: XOR<CustomerAccountScalarRelationFilter, CustomerAccountWhereInput>
  }, "id" | "customerAccountId" | "tenantId_tenantPartyId">

  export type CustomerPartyBindingOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    tenantPartyId?: SortOrder
    bindingStatus?: SortOrder
    partyDisplayName?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CustomerPartyBindingCountOrderByAggregateInput
    _max?: CustomerPartyBindingMaxOrderByAggregateInput
    _min?: CustomerPartyBindingMinOrderByAggregateInput
  }

  export type CustomerPartyBindingScalarWhereWithAggregatesInput = {
    AND?: CustomerPartyBindingScalarWhereWithAggregatesInput | CustomerPartyBindingScalarWhereWithAggregatesInput[]
    OR?: CustomerPartyBindingScalarWhereWithAggregatesInput[]
    NOT?: CustomerPartyBindingScalarWhereWithAggregatesInput | CustomerPartyBindingScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"CustomerPartyBinding"> | string
    tenantId?: StringWithAggregatesFilter<"CustomerPartyBinding"> | string
    customerAccountId?: UuidWithAggregatesFilter<"CustomerPartyBinding"> | string
    tenantPartyId?: StringWithAggregatesFilter<"CustomerPartyBinding"> | string
    bindingStatus?: EnumCrmCustomerPartyBindingStatusWithAggregatesFilter<"CustomerPartyBinding"> | $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: StringNullableWithAggregatesFilter<"CustomerPartyBinding"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"CustomerPartyBinding"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CustomerPartyBinding"> | Date | string
  }

  export type CustomerContactWhereInput = {
    AND?: CustomerContactWhereInput | CustomerContactWhereInput[]
    OR?: CustomerContactWhereInput[]
    NOT?: CustomerContactWhereInput | CustomerContactWhereInput[]
    id?: UuidFilter<"CustomerContact"> | string
    tenantId?: StringFilter<"CustomerContact"> | string
    customerAccountId?: UuidFilter<"CustomerContact"> | string
    displayName?: StringFilter<"CustomerContact"> | string
    roleTitle?: StringNullableFilter<"CustomerContact"> | string | null
    email?: StringNullableFilter<"CustomerContact"> | string | null
    phone?: StringNullableFilter<"CustomerContact"> | string | null
    isPrimaryContact?: BoolFilter<"CustomerContact"> | boolean
    isActive?: BoolFilter<"CustomerContact"> | boolean
    createdAt?: DateTimeFilter<"CustomerContact"> | Date | string
    updatedAt?: DateTimeFilter<"CustomerContact"> | Date | string
    customerAccount?: XOR<CustomerAccountScalarRelationFilter, CustomerAccountWhereInput>
  }

  export type CustomerContactOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    displayName?: SortOrder
    roleTitle?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    isPrimaryContact?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    customerAccount?: CustomerAccountOrderByWithRelationInput
  }

  export type CustomerContactWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CustomerContactWhereInput | CustomerContactWhereInput[]
    OR?: CustomerContactWhereInput[]
    NOT?: CustomerContactWhereInput | CustomerContactWhereInput[]
    tenantId?: StringFilter<"CustomerContact"> | string
    customerAccountId?: UuidFilter<"CustomerContact"> | string
    displayName?: StringFilter<"CustomerContact"> | string
    roleTitle?: StringNullableFilter<"CustomerContact"> | string | null
    email?: StringNullableFilter<"CustomerContact"> | string | null
    phone?: StringNullableFilter<"CustomerContact"> | string | null
    isPrimaryContact?: BoolFilter<"CustomerContact"> | boolean
    isActive?: BoolFilter<"CustomerContact"> | boolean
    createdAt?: DateTimeFilter<"CustomerContact"> | Date | string
    updatedAt?: DateTimeFilter<"CustomerContact"> | Date | string
    customerAccount?: XOR<CustomerAccountScalarRelationFilter, CustomerAccountWhereInput>
  }, "id">

  export type CustomerContactOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    displayName?: SortOrder
    roleTitle?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    isPrimaryContact?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CustomerContactCountOrderByAggregateInput
    _max?: CustomerContactMaxOrderByAggregateInput
    _min?: CustomerContactMinOrderByAggregateInput
  }

  export type CustomerContactScalarWhereWithAggregatesInput = {
    AND?: CustomerContactScalarWhereWithAggregatesInput | CustomerContactScalarWhereWithAggregatesInput[]
    OR?: CustomerContactScalarWhereWithAggregatesInput[]
    NOT?: CustomerContactScalarWhereWithAggregatesInput | CustomerContactScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"CustomerContact"> | string
    tenantId?: StringWithAggregatesFilter<"CustomerContact"> | string
    customerAccountId?: UuidWithAggregatesFilter<"CustomerContact"> | string
    displayName?: StringWithAggregatesFilter<"CustomerContact"> | string
    roleTitle?: StringNullableWithAggregatesFilter<"CustomerContact"> | string | null
    email?: StringNullableWithAggregatesFilter<"CustomerContact"> | string | null
    phone?: StringNullableWithAggregatesFilter<"CustomerContact"> | string | null
    isPrimaryContact?: BoolWithAggregatesFilter<"CustomerContact"> | boolean
    isActive?: BoolWithAggregatesFilter<"CustomerContact"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"CustomerContact"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CustomerContact"> | Date | string
  }

  export type CustomerAddressWhereInput = {
    AND?: CustomerAddressWhereInput | CustomerAddressWhereInput[]
    OR?: CustomerAddressWhereInput[]
    NOT?: CustomerAddressWhereInput | CustomerAddressWhereInput[]
    id?: UuidFilter<"CustomerAddress"> | string
    tenantId?: StringFilter<"CustomerAddress"> | string
    customerAccountId?: UuidFilter<"CustomerAddress"> | string
    label?: StringFilter<"CustomerAddress"> | string
    countryCode?: StringFilter<"CustomerAddress"> | string
    region?: StringNullableFilter<"CustomerAddress"> | string | null
    locality?: StringNullableFilter<"CustomerAddress"> | string | null
    addressLine1?: StringFilter<"CustomerAddress"> | string
    addressLine2?: StringNullableFilter<"CustomerAddress"> | string | null
    postalCode?: StringNullableFilter<"CustomerAddress"> | string | null
    isPrimaryAddress?: BoolFilter<"CustomerAddress"> | boolean
    isActive?: BoolFilter<"CustomerAddress"> | boolean
    createdAt?: DateTimeFilter<"CustomerAddress"> | Date | string
    updatedAt?: DateTimeFilter<"CustomerAddress"> | Date | string
    customerAccount?: XOR<CustomerAccountScalarRelationFilter, CustomerAccountWhereInput>
  }

  export type CustomerAddressOrderByWithRelationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    label?: SortOrder
    countryCode?: SortOrder
    region?: SortOrderInput | SortOrder
    locality?: SortOrderInput | SortOrder
    addressLine1?: SortOrder
    addressLine2?: SortOrderInput | SortOrder
    postalCode?: SortOrderInput | SortOrder
    isPrimaryAddress?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    customerAccount?: CustomerAccountOrderByWithRelationInput
  }

  export type CustomerAddressWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CustomerAddressWhereInput | CustomerAddressWhereInput[]
    OR?: CustomerAddressWhereInput[]
    NOT?: CustomerAddressWhereInput | CustomerAddressWhereInput[]
    tenantId?: StringFilter<"CustomerAddress"> | string
    customerAccountId?: UuidFilter<"CustomerAddress"> | string
    label?: StringFilter<"CustomerAddress"> | string
    countryCode?: StringFilter<"CustomerAddress"> | string
    region?: StringNullableFilter<"CustomerAddress"> | string | null
    locality?: StringNullableFilter<"CustomerAddress"> | string | null
    addressLine1?: StringFilter<"CustomerAddress"> | string
    addressLine2?: StringNullableFilter<"CustomerAddress"> | string | null
    postalCode?: StringNullableFilter<"CustomerAddress"> | string | null
    isPrimaryAddress?: BoolFilter<"CustomerAddress"> | boolean
    isActive?: BoolFilter<"CustomerAddress"> | boolean
    createdAt?: DateTimeFilter<"CustomerAddress"> | Date | string
    updatedAt?: DateTimeFilter<"CustomerAddress"> | Date | string
    customerAccount?: XOR<CustomerAccountScalarRelationFilter, CustomerAccountWhereInput>
  }, "id">

  export type CustomerAddressOrderByWithAggregationInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    label?: SortOrder
    countryCode?: SortOrder
    region?: SortOrderInput | SortOrder
    locality?: SortOrderInput | SortOrder
    addressLine1?: SortOrder
    addressLine2?: SortOrderInput | SortOrder
    postalCode?: SortOrderInput | SortOrder
    isPrimaryAddress?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CustomerAddressCountOrderByAggregateInput
    _max?: CustomerAddressMaxOrderByAggregateInput
    _min?: CustomerAddressMinOrderByAggregateInput
  }

  export type CustomerAddressScalarWhereWithAggregatesInput = {
    AND?: CustomerAddressScalarWhereWithAggregatesInput | CustomerAddressScalarWhereWithAggregatesInput[]
    OR?: CustomerAddressScalarWhereWithAggregatesInput[]
    NOT?: CustomerAddressScalarWhereWithAggregatesInput | CustomerAddressScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"CustomerAddress"> | string
    tenantId?: StringWithAggregatesFilter<"CustomerAddress"> | string
    customerAccountId?: UuidWithAggregatesFilter<"CustomerAddress"> | string
    label?: StringWithAggregatesFilter<"CustomerAddress"> | string
    countryCode?: StringWithAggregatesFilter<"CustomerAddress"> | string
    region?: StringNullableWithAggregatesFilter<"CustomerAddress"> | string | null
    locality?: StringNullableWithAggregatesFilter<"CustomerAddress"> | string | null
    addressLine1?: StringWithAggregatesFilter<"CustomerAddress"> | string
    addressLine2?: StringNullableWithAggregatesFilter<"CustomerAddress"> | string | null
    postalCode?: StringNullableWithAggregatesFilter<"CustomerAddress"> | string | null
    isPrimaryAddress?: BoolWithAggregatesFilter<"CustomerAddress"> | boolean
    isActive?: BoolWithAggregatesFilter<"CustomerAddress"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"CustomerAddress"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CustomerAddress"> | Date | string
  }

  export type CrmAuditEnvelopeWhereInput = {
    AND?: CrmAuditEnvelopeWhereInput | CrmAuditEnvelopeWhereInput[]
    OR?: CrmAuditEnvelopeWhereInput[]
    NOT?: CrmAuditEnvelopeWhereInput | CrmAuditEnvelopeWhereInput[]
    id?: StringFilter<"CrmAuditEnvelope"> | string
    service?: StringFilter<"CrmAuditEnvelope"> | string
    module?: StringFilter<"CrmAuditEnvelope"> | string
    eventType?: StringFilter<"CrmAuditEnvelope"> | string
    occurredAt?: DateTimeFilter<"CrmAuditEnvelope"> | Date | string
    result?: StringFilter<"CrmAuditEnvelope"> | string
    operatorId?: StringNullableFilter<"CrmAuditEnvelope"> | string | null
    operatorType?: StringFilter<"CrmAuditEnvelope"> | string
    tenantId?: StringNullableFilter<"CrmAuditEnvelope"> | string | null
    orgId?: StringNullableFilter<"CrmAuditEnvelope"> | string | null
    traceId?: StringNullableFilter<"CrmAuditEnvelope"> | string | null
    resourceType?: StringFilter<"CrmAuditEnvelope"> | string
    resourceId?: StringNullableFilter<"CrmAuditEnvelope"> | string | null
    details?: JsonFilter<"CrmAuditEnvelope">
    createdAt?: DateTimeFilter<"CrmAuditEnvelope"> | Date | string
  }

  export type CrmAuditEnvelopeOrderByWithRelationInput = {
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

  export type CrmAuditEnvelopeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CrmAuditEnvelopeWhereInput | CrmAuditEnvelopeWhereInput[]
    OR?: CrmAuditEnvelopeWhereInput[]
    NOT?: CrmAuditEnvelopeWhereInput | CrmAuditEnvelopeWhereInput[]
    service?: StringFilter<"CrmAuditEnvelope"> | string
    module?: StringFilter<"CrmAuditEnvelope"> | string
    eventType?: StringFilter<"CrmAuditEnvelope"> | string
    occurredAt?: DateTimeFilter<"CrmAuditEnvelope"> | Date | string
    result?: StringFilter<"CrmAuditEnvelope"> | string
    operatorId?: StringNullableFilter<"CrmAuditEnvelope"> | string | null
    operatorType?: StringFilter<"CrmAuditEnvelope"> | string
    tenantId?: StringNullableFilter<"CrmAuditEnvelope"> | string | null
    orgId?: StringNullableFilter<"CrmAuditEnvelope"> | string | null
    traceId?: StringNullableFilter<"CrmAuditEnvelope"> | string | null
    resourceType?: StringFilter<"CrmAuditEnvelope"> | string
    resourceId?: StringNullableFilter<"CrmAuditEnvelope"> | string | null
    details?: JsonFilter<"CrmAuditEnvelope">
    createdAt?: DateTimeFilter<"CrmAuditEnvelope"> | Date | string
  }, "id">

  export type CrmAuditEnvelopeOrderByWithAggregationInput = {
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
    _count?: CrmAuditEnvelopeCountOrderByAggregateInput
    _max?: CrmAuditEnvelopeMaxOrderByAggregateInput
    _min?: CrmAuditEnvelopeMinOrderByAggregateInput
  }

  export type CrmAuditEnvelopeScalarWhereWithAggregatesInput = {
    AND?: CrmAuditEnvelopeScalarWhereWithAggregatesInput | CrmAuditEnvelopeScalarWhereWithAggregatesInput[]
    OR?: CrmAuditEnvelopeScalarWhereWithAggregatesInput[]
    NOT?: CrmAuditEnvelopeScalarWhereWithAggregatesInput | CrmAuditEnvelopeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CrmAuditEnvelope"> | string
    service?: StringWithAggregatesFilter<"CrmAuditEnvelope"> | string
    module?: StringWithAggregatesFilter<"CrmAuditEnvelope"> | string
    eventType?: StringWithAggregatesFilter<"CrmAuditEnvelope"> | string
    occurredAt?: DateTimeWithAggregatesFilter<"CrmAuditEnvelope"> | Date | string
    result?: StringWithAggregatesFilter<"CrmAuditEnvelope"> | string
    operatorId?: StringNullableWithAggregatesFilter<"CrmAuditEnvelope"> | string | null
    operatorType?: StringWithAggregatesFilter<"CrmAuditEnvelope"> | string
    tenantId?: StringNullableWithAggregatesFilter<"CrmAuditEnvelope"> | string | null
    orgId?: StringNullableWithAggregatesFilter<"CrmAuditEnvelope"> | string | null
    traceId?: StringNullableWithAggregatesFilter<"CrmAuditEnvelope"> | string | null
    resourceType?: StringWithAggregatesFilter<"CrmAuditEnvelope"> | string
    resourceId?: StringNullableWithAggregatesFilter<"CrmAuditEnvelope"> | string | null
    details?: JsonWithAggregatesFilter<"CrmAuditEnvelope">
    createdAt?: DateTimeWithAggregatesFilter<"CrmAuditEnvelope"> | Date | string
  }

  export type CrmSequenceCounterCreateInput = {
    tenantId: string
    nextCustomerAccountNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CrmSequenceCounterUncheckedCreateInput = {
    tenantId: string
    nextCustomerAccountNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CrmSequenceCounterUpdateInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextCustomerAccountNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrmSequenceCounterUncheckedUpdateInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextCustomerAccountNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrmSequenceCounterCreateManyInput = {
    tenantId: string
    nextCustomerAccountNo?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CrmSequenceCounterUpdateManyMutationInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextCustomerAccountNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrmSequenceCounterUncheckedUpdateManyInput = {
    tenantId?: StringFieldUpdateOperationsInput | string
    nextCustomerAccountNo?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerAccountCreateInput = {
    id: string
    customerAccountNo: string
    tenantId: string
    displayName: string
    status: $Enums.CrmCustomerStatus
    customerCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    primaryBinding?: CustomerPartyBindingCreateNestedOneWithoutCustomerAccountInput
    contacts?: CustomerContactCreateNestedManyWithoutCustomerAccountInput
    addresses?: CustomerAddressCreateNestedManyWithoutCustomerAccountInput
  }

  export type CustomerAccountUncheckedCreateInput = {
    id: string
    customerAccountNo: string
    tenantId: string
    displayName: string
    status: $Enums.CrmCustomerStatus
    customerCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    primaryBinding?: CustomerPartyBindingUncheckedCreateNestedOneWithoutCustomerAccountInput
    contacts?: CustomerContactUncheckedCreateNestedManyWithoutCustomerAccountInput
    addresses?: CustomerAddressUncheckedCreateNestedManyWithoutCustomerAccountInput
  }

  export type CustomerAccountUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerAccountNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumCrmCustomerStatusFieldUpdateOperationsInput | $Enums.CrmCustomerStatus
    customerCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    primaryBinding?: CustomerPartyBindingUpdateOneWithoutCustomerAccountNestedInput
    contacts?: CustomerContactUpdateManyWithoutCustomerAccountNestedInput
    addresses?: CustomerAddressUpdateManyWithoutCustomerAccountNestedInput
  }

  export type CustomerAccountUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerAccountNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumCrmCustomerStatusFieldUpdateOperationsInput | $Enums.CrmCustomerStatus
    customerCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    primaryBinding?: CustomerPartyBindingUncheckedUpdateOneWithoutCustomerAccountNestedInput
    contacts?: CustomerContactUncheckedUpdateManyWithoutCustomerAccountNestedInput
    addresses?: CustomerAddressUncheckedUpdateManyWithoutCustomerAccountNestedInput
  }

  export type CustomerAccountCreateManyInput = {
    id: string
    customerAccountNo: string
    tenantId: string
    displayName: string
    status: $Enums.CrmCustomerStatus
    customerCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerAccountUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerAccountNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumCrmCustomerStatusFieldUpdateOperationsInput | $Enums.CrmCustomerStatus
    customerCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerAccountUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerAccountNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumCrmCustomerStatusFieldUpdateOperationsInput | $Enums.CrmCustomerStatus
    customerCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerPartyBindingCreateInput = {
    id: string
    tenantId: string
    tenantPartyId: string
    bindingStatus: $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    customerAccount: CustomerAccountCreateNestedOneWithoutPrimaryBindingInput
  }

  export type CustomerPartyBindingUncheckedCreateInput = {
    id: string
    tenantId: string
    customerAccountId: string
    tenantPartyId: string
    bindingStatus: $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerPartyBindingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    tenantPartyId?: StringFieldUpdateOperationsInput | string
    bindingStatus?: EnumCrmCustomerPartyBindingStatusFieldUpdateOperationsInput | $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    customerAccount?: CustomerAccountUpdateOneRequiredWithoutPrimaryBindingNestedInput
  }

  export type CustomerPartyBindingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerAccountId?: StringFieldUpdateOperationsInput | string
    tenantPartyId?: StringFieldUpdateOperationsInput | string
    bindingStatus?: EnumCrmCustomerPartyBindingStatusFieldUpdateOperationsInput | $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerPartyBindingCreateManyInput = {
    id: string
    tenantId: string
    customerAccountId: string
    tenantPartyId: string
    bindingStatus: $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerPartyBindingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    tenantPartyId?: StringFieldUpdateOperationsInput | string
    bindingStatus?: EnumCrmCustomerPartyBindingStatusFieldUpdateOperationsInput | $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerPartyBindingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerAccountId?: StringFieldUpdateOperationsInput | string
    tenantPartyId?: StringFieldUpdateOperationsInput | string
    bindingStatus?: EnumCrmCustomerPartyBindingStatusFieldUpdateOperationsInput | $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerContactCreateInput = {
    id: string
    tenantId: string
    displayName: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    customerAccount: CustomerAccountCreateNestedOneWithoutContactsInput
  }

  export type CustomerContactUncheckedCreateInput = {
    id: string
    tenantId: string
    customerAccountId: string
    displayName: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerContactUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    customerAccount?: CustomerAccountUpdateOneRequiredWithoutContactsNestedInput
  }

  export type CustomerContactUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerAccountId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerContactCreateManyInput = {
    id: string
    tenantId: string
    customerAccountId: string
    displayName: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerContactUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerContactUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerAccountId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerAddressCreateInput = {
    id: string
    tenantId: string
    label: string
    countryCode: string
    region?: string | null
    locality?: string | null
    addressLine1: string
    addressLine2?: string | null
    postalCode?: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    customerAccount: CustomerAccountCreateNestedOneWithoutAddressesInput
  }

  export type CustomerAddressUncheckedCreateInput = {
    id: string
    tenantId: string
    customerAccountId: string
    label: string
    countryCode: string
    region?: string | null
    locality?: string | null
    addressLine1: string
    addressLine2?: string | null
    postalCode?: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerAddressUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    customerAccount?: CustomerAccountUpdateOneRequiredWithoutAddressesNestedInput
  }

  export type CustomerAddressUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerAccountId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerAddressCreateManyInput = {
    id: string
    tenantId: string
    customerAccountId: string
    label: string
    countryCode: string
    region?: string | null
    locality?: string | null
    addressLine1: string
    addressLine2?: string | null
    postalCode?: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerAddressUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerAddressUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    customerAccountId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CrmAuditEnvelopeCreateInput = {
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

  export type CrmAuditEnvelopeUncheckedCreateInput = {
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

  export type CrmAuditEnvelopeUpdateInput = {
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

  export type CrmAuditEnvelopeUncheckedUpdateInput = {
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

  export type CrmAuditEnvelopeCreateManyInput = {
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

  export type CrmAuditEnvelopeUpdateManyMutationInput = {
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

  export type CrmAuditEnvelopeUncheckedUpdateManyInput = {
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

  export type CrmSequenceCounterCountOrderByAggregateInput = {
    tenantId?: SortOrder
    nextCustomerAccountNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CrmSequenceCounterAvgOrderByAggregateInput = {
    nextCustomerAccountNo?: SortOrder
  }

  export type CrmSequenceCounterMaxOrderByAggregateInput = {
    tenantId?: SortOrder
    nextCustomerAccountNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CrmSequenceCounterMinOrderByAggregateInput = {
    tenantId?: SortOrder
    nextCustomerAccountNo?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CrmSequenceCounterSumOrderByAggregateInput = {
    nextCustomerAccountNo?: SortOrder
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

  export type EnumCrmCustomerStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CrmCustomerStatus | EnumCrmCustomerStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CrmCustomerStatus[] | ListEnumCrmCustomerStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrmCustomerStatus[] | ListEnumCrmCustomerStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCrmCustomerStatusFilter<$PrismaModel> | $Enums.CrmCustomerStatus
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

  export type CustomerPartyBindingNullableScalarRelationFilter = {
    is?: CustomerPartyBindingWhereInput | null
    isNot?: CustomerPartyBindingWhereInput | null
  }

  export type CustomerContactListRelationFilter = {
    every?: CustomerContactWhereInput
    some?: CustomerContactWhereInput
    none?: CustomerContactWhereInput
  }

  export type CustomerAddressListRelationFilter = {
    every?: CustomerAddressWhereInput
    some?: CustomerAddressWhereInput
    none?: CustomerAddressWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CustomerContactOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CustomerAddressOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CustomerAccountCountOrderByAggregateInput = {
    id?: SortOrder
    customerAccountNo?: SortOrder
    tenantId?: SortOrder
    displayName?: SortOrder
    status?: SortOrder
    customerCategory?: SortOrder
    tags?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CustomerAccountMaxOrderByAggregateInput = {
    id?: SortOrder
    customerAccountNo?: SortOrder
    tenantId?: SortOrder
    displayName?: SortOrder
    status?: SortOrder
    customerCategory?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CustomerAccountMinOrderByAggregateInput = {
    id?: SortOrder
    customerAccountNo?: SortOrder
    tenantId?: SortOrder
    displayName?: SortOrder
    status?: SortOrder
    customerCategory?: SortOrder
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

  export type EnumCrmCustomerStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CrmCustomerStatus | EnumCrmCustomerStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CrmCustomerStatus[] | ListEnumCrmCustomerStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrmCustomerStatus[] | ListEnumCrmCustomerStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCrmCustomerStatusWithAggregatesFilter<$PrismaModel> | $Enums.CrmCustomerStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCrmCustomerStatusFilter<$PrismaModel>
    _max?: NestedEnumCrmCustomerStatusFilter<$PrismaModel>
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

  export type EnumCrmCustomerPartyBindingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CrmCustomerPartyBindingStatus | EnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CrmCustomerPartyBindingStatus[] | ListEnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrmCustomerPartyBindingStatus[] | ListEnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCrmCustomerPartyBindingStatusFilter<$PrismaModel> | $Enums.CrmCustomerPartyBindingStatus
  }

  export type CustomerAccountScalarRelationFilter = {
    is?: CustomerAccountWhereInput
    isNot?: CustomerAccountWhereInput
  }

  export type CustomerPartyBindingTenantIdTenantPartyIdCompoundUniqueInput = {
    tenantId: string
    tenantPartyId: string
  }

  export type CustomerPartyBindingCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    tenantPartyId?: SortOrder
    bindingStatus?: SortOrder
    partyDisplayName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CustomerPartyBindingMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    tenantPartyId?: SortOrder
    bindingStatus?: SortOrder
    partyDisplayName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CustomerPartyBindingMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    tenantPartyId?: SortOrder
    bindingStatus?: SortOrder
    partyDisplayName?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumCrmCustomerPartyBindingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CrmCustomerPartyBindingStatus | EnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CrmCustomerPartyBindingStatus[] | ListEnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrmCustomerPartyBindingStatus[] | ListEnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCrmCustomerPartyBindingStatusWithAggregatesFilter<$PrismaModel> | $Enums.CrmCustomerPartyBindingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCrmCustomerPartyBindingStatusFilter<$PrismaModel>
    _max?: NestedEnumCrmCustomerPartyBindingStatusFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type CustomerContactCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    displayName?: SortOrder
    roleTitle?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    isPrimaryContact?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CustomerContactMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    displayName?: SortOrder
    roleTitle?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    isPrimaryContact?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CustomerContactMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    displayName?: SortOrder
    roleTitle?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    isPrimaryContact?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type CustomerAddressCountOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    label?: SortOrder
    countryCode?: SortOrder
    region?: SortOrder
    locality?: SortOrder
    addressLine1?: SortOrder
    addressLine2?: SortOrder
    postalCode?: SortOrder
    isPrimaryAddress?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CustomerAddressMaxOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    label?: SortOrder
    countryCode?: SortOrder
    region?: SortOrder
    locality?: SortOrder
    addressLine1?: SortOrder
    addressLine2?: SortOrder
    postalCode?: SortOrder
    isPrimaryAddress?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CustomerAddressMinOrderByAggregateInput = {
    id?: SortOrder
    tenantId?: SortOrder
    customerAccountId?: SortOrder
    label?: SortOrder
    countryCode?: SortOrder
    region?: SortOrder
    locality?: SortOrder
    addressLine1?: SortOrder
    addressLine2?: SortOrder
    postalCode?: SortOrder
    isPrimaryAddress?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CrmAuditEnvelopeCountOrderByAggregateInput = {
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

  export type CrmAuditEnvelopeMaxOrderByAggregateInput = {
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

  export type CrmAuditEnvelopeMinOrderByAggregateInput = {
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

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type CustomerPartyBindingCreateNestedOneWithoutCustomerAccountInput = {
    create?: XOR<CustomerPartyBindingCreateWithoutCustomerAccountInput, CustomerPartyBindingUncheckedCreateWithoutCustomerAccountInput>
    connectOrCreate?: CustomerPartyBindingCreateOrConnectWithoutCustomerAccountInput
    connect?: CustomerPartyBindingWhereUniqueInput
  }

  export type CustomerContactCreateNestedManyWithoutCustomerAccountInput = {
    create?: XOR<CustomerContactCreateWithoutCustomerAccountInput, CustomerContactUncheckedCreateWithoutCustomerAccountInput> | CustomerContactCreateWithoutCustomerAccountInput[] | CustomerContactUncheckedCreateWithoutCustomerAccountInput[]
    connectOrCreate?: CustomerContactCreateOrConnectWithoutCustomerAccountInput | CustomerContactCreateOrConnectWithoutCustomerAccountInput[]
    createMany?: CustomerContactCreateManyCustomerAccountInputEnvelope
    connect?: CustomerContactWhereUniqueInput | CustomerContactWhereUniqueInput[]
  }

  export type CustomerAddressCreateNestedManyWithoutCustomerAccountInput = {
    create?: XOR<CustomerAddressCreateWithoutCustomerAccountInput, CustomerAddressUncheckedCreateWithoutCustomerAccountInput> | CustomerAddressCreateWithoutCustomerAccountInput[] | CustomerAddressUncheckedCreateWithoutCustomerAccountInput[]
    connectOrCreate?: CustomerAddressCreateOrConnectWithoutCustomerAccountInput | CustomerAddressCreateOrConnectWithoutCustomerAccountInput[]
    createMany?: CustomerAddressCreateManyCustomerAccountInputEnvelope
    connect?: CustomerAddressWhereUniqueInput | CustomerAddressWhereUniqueInput[]
  }

  export type CustomerPartyBindingUncheckedCreateNestedOneWithoutCustomerAccountInput = {
    create?: XOR<CustomerPartyBindingCreateWithoutCustomerAccountInput, CustomerPartyBindingUncheckedCreateWithoutCustomerAccountInput>
    connectOrCreate?: CustomerPartyBindingCreateOrConnectWithoutCustomerAccountInput
    connect?: CustomerPartyBindingWhereUniqueInput
  }

  export type CustomerContactUncheckedCreateNestedManyWithoutCustomerAccountInput = {
    create?: XOR<CustomerContactCreateWithoutCustomerAccountInput, CustomerContactUncheckedCreateWithoutCustomerAccountInput> | CustomerContactCreateWithoutCustomerAccountInput[] | CustomerContactUncheckedCreateWithoutCustomerAccountInput[]
    connectOrCreate?: CustomerContactCreateOrConnectWithoutCustomerAccountInput | CustomerContactCreateOrConnectWithoutCustomerAccountInput[]
    createMany?: CustomerContactCreateManyCustomerAccountInputEnvelope
    connect?: CustomerContactWhereUniqueInput | CustomerContactWhereUniqueInput[]
  }

  export type CustomerAddressUncheckedCreateNestedManyWithoutCustomerAccountInput = {
    create?: XOR<CustomerAddressCreateWithoutCustomerAccountInput, CustomerAddressUncheckedCreateWithoutCustomerAccountInput> | CustomerAddressCreateWithoutCustomerAccountInput[] | CustomerAddressUncheckedCreateWithoutCustomerAccountInput[]
    connectOrCreate?: CustomerAddressCreateOrConnectWithoutCustomerAccountInput | CustomerAddressCreateOrConnectWithoutCustomerAccountInput[]
    createMany?: CustomerAddressCreateManyCustomerAccountInputEnvelope
    connect?: CustomerAddressWhereUniqueInput | CustomerAddressWhereUniqueInput[]
  }

  export type EnumCrmCustomerStatusFieldUpdateOperationsInput = {
    set?: $Enums.CrmCustomerStatus
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type CustomerPartyBindingUpdateOneWithoutCustomerAccountNestedInput = {
    create?: XOR<CustomerPartyBindingCreateWithoutCustomerAccountInput, CustomerPartyBindingUncheckedCreateWithoutCustomerAccountInput>
    connectOrCreate?: CustomerPartyBindingCreateOrConnectWithoutCustomerAccountInput
    upsert?: CustomerPartyBindingUpsertWithoutCustomerAccountInput
    disconnect?: CustomerPartyBindingWhereInput | boolean
    delete?: CustomerPartyBindingWhereInput | boolean
    connect?: CustomerPartyBindingWhereUniqueInput
    update?: XOR<XOR<CustomerPartyBindingUpdateToOneWithWhereWithoutCustomerAccountInput, CustomerPartyBindingUpdateWithoutCustomerAccountInput>, CustomerPartyBindingUncheckedUpdateWithoutCustomerAccountInput>
  }

  export type CustomerContactUpdateManyWithoutCustomerAccountNestedInput = {
    create?: XOR<CustomerContactCreateWithoutCustomerAccountInput, CustomerContactUncheckedCreateWithoutCustomerAccountInput> | CustomerContactCreateWithoutCustomerAccountInput[] | CustomerContactUncheckedCreateWithoutCustomerAccountInput[]
    connectOrCreate?: CustomerContactCreateOrConnectWithoutCustomerAccountInput | CustomerContactCreateOrConnectWithoutCustomerAccountInput[]
    upsert?: CustomerContactUpsertWithWhereUniqueWithoutCustomerAccountInput | CustomerContactUpsertWithWhereUniqueWithoutCustomerAccountInput[]
    createMany?: CustomerContactCreateManyCustomerAccountInputEnvelope
    set?: CustomerContactWhereUniqueInput | CustomerContactWhereUniqueInput[]
    disconnect?: CustomerContactWhereUniqueInput | CustomerContactWhereUniqueInput[]
    delete?: CustomerContactWhereUniqueInput | CustomerContactWhereUniqueInput[]
    connect?: CustomerContactWhereUniqueInput | CustomerContactWhereUniqueInput[]
    update?: CustomerContactUpdateWithWhereUniqueWithoutCustomerAccountInput | CustomerContactUpdateWithWhereUniqueWithoutCustomerAccountInput[]
    updateMany?: CustomerContactUpdateManyWithWhereWithoutCustomerAccountInput | CustomerContactUpdateManyWithWhereWithoutCustomerAccountInput[]
    deleteMany?: CustomerContactScalarWhereInput | CustomerContactScalarWhereInput[]
  }

  export type CustomerAddressUpdateManyWithoutCustomerAccountNestedInput = {
    create?: XOR<CustomerAddressCreateWithoutCustomerAccountInput, CustomerAddressUncheckedCreateWithoutCustomerAccountInput> | CustomerAddressCreateWithoutCustomerAccountInput[] | CustomerAddressUncheckedCreateWithoutCustomerAccountInput[]
    connectOrCreate?: CustomerAddressCreateOrConnectWithoutCustomerAccountInput | CustomerAddressCreateOrConnectWithoutCustomerAccountInput[]
    upsert?: CustomerAddressUpsertWithWhereUniqueWithoutCustomerAccountInput | CustomerAddressUpsertWithWhereUniqueWithoutCustomerAccountInput[]
    createMany?: CustomerAddressCreateManyCustomerAccountInputEnvelope
    set?: CustomerAddressWhereUniqueInput | CustomerAddressWhereUniqueInput[]
    disconnect?: CustomerAddressWhereUniqueInput | CustomerAddressWhereUniqueInput[]
    delete?: CustomerAddressWhereUniqueInput | CustomerAddressWhereUniqueInput[]
    connect?: CustomerAddressWhereUniqueInput | CustomerAddressWhereUniqueInput[]
    update?: CustomerAddressUpdateWithWhereUniqueWithoutCustomerAccountInput | CustomerAddressUpdateWithWhereUniqueWithoutCustomerAccountInput[]
    updateMany?: CustomerAddressUpdateManyWithWhereWithoutCustomerAccountInput | CustomerAddressUpdateManyWithWhereWithoutCustomerAccountInput[]
    deleteMany?: CustomerAddressScalarWhereInput | CustomerAddressScalarWhereInput[]
  }

  export type CustomerPartyBindingUncheckedUpdateOneWithoutCustomerAccountNestedInput = {
    create?: XOR<CustomerPartyBindingCreateWithoutCustomerAccountInput, CustomerPartyBindingUncheckedCreateWithoutCustomerAccountInput>
    connectOrCreate?: CustomerPartyBindingCreateOrConnectWithoutCustomerAccountInput
    upsert?: CustomerPartyBindingUpsertWithoutCustomerAccountInput
    disconnect?: CustomerPartyBindingWhereInput | boolean
    delete?: CustomerPartyBindingWhereInput | boolean
    connect?: CustomerPartyBindingWhereUniqueInput
    update?: XOR<XOR<CustomerPartyBindingUpdateToOneWithWhereWithoutCustomerAccountInput, CustomerPartyBindingUpdateWithoutCustomerAccountInput>, CustomerPartyBindingUncheckedUpdateWithoutCustomerAccountInput>
  }

  export type CustomerContactUncheckedUpdateManyWithoutCustomerAccountNestedInput = {
    create?: XOR<CustomerContactCreateWithoutCustomerAccountInput, CustomerContactUncheckedCreateWithoutCustomerAccountInput> | CustomerContactCreateWithoutCustomerAccountInput[] | CustomerContactUncheckedCreateWithoutCustomerAccountInput[]
    connectOrCreate?: CustomerContactCreateOrConnectWithoutCustomerAccountInput | CustomerContactCreateOrConnectWithoutCustomerAccountInput[]
    upsert?: CustomerContactUpsertWithWhereUniqueWithoutCustomerAccountInput | CustomerContactUpsertWithWhereUniqueWithoutCustomerAccountInput[]
    createMany?: CustomerContactCreateManyCustomerAccountInputEnvelope
    set?: CustomerContactWhereUniqueInput | CustomerContactWhereUniqueInput[]
    disconnect?: CustomerContactWhereUniqueInput | CustomerContactWhereUniqueInput[]
    delete?: CustomerContactWhereUniqueInput | CustomerContactWhereUniqueInput[]
    connect?: CustomerContactWhereUniqueInput | CustomerContactWhereUniqueInput[]
    update?: CustomerContactUpdateWithWhereUniqueWithoutCustomerAccountInput | CustomerContactUpdateWithWhereUniqueWithoutCustomerAccountInput[]
    updateMany?: CustomerContactUpdateManyWithWhereWithoutCustomerAccountInput | CustomerContactUpdateManyWithWhereWithoutCustomerAccountInput[]
    deleteMany?: CustomerContactScalarWhereInput | CustomerContactScalarWhereInput[]
  }

  export type CustomerAddressUncheckedUpdateManyWithoutCustomerAccountNestedInput = {
    create?: XOR<CustomerAddressCreateWithoutCustomerAccountInput, CustomerAddressUncheckedCreateWithoutCustomerAccountInput> | CustomerAddressCreateWithoutCustomerAccountInput[] | CustomerAddressUncheckedCreateWithoutCustomerAccountInput[]
    connectOrCreate?: CustomerAddressCreateOrConnectWithoutCustomerAccountInput | CustomerAddressCreateOrConnectWithoutCustomerAccountInput[]
    upsert?: CustomerAddressUpsertWithWhereUniqueWithoutCustomerAccountInput | CustomerAddressUpsertWithWhereUniqueWithoutCustomerAccountInput[]
    createMany?: CustomerAddressCreateManyCustomerAccountInputEnvelope
    set?: CustomerAddressWhereUniqueInput | CustomerAddressWhereUniqueInput[]
    disconnect?: CustomerAddressWhereUniqueInput | CustomerAddressWhereUniqueInput[]
    delete?: CustomerAddressWhereUniqueInput | CustomerAddressWhereUniqueInput[]
    connect?: CustomerAddressWhereUniqueInput | CustomerAddressWhereUniqueInput[]
    update?: CustomerAddressUpdateWithWhereUniqueWithoutCustomerAccountInput | CustomerAddressUpdateWithWhereUniqueWithoutCustomerAccountInput[]
    updateMany?: CustomerAddressUpdateManyWithWhereWithoutCustomerAccountInput | CustomerAddressUpdateManyWithWhereWithoutCustomerAccountInput[]
    deleteMany?: CustomerAddressScalarWhereInput | CustomerAddressScalarWhereInput[]
  }

  export type CustomerAccountCreateNestedOneWithoutPrimaryBindingInput = {
    create?: XOR<CustomerAccountCreateWithoutPrimaryBindingInput, CustomerAccountUncheckedCreateWithoutPrimaryBindingInput>
    connectOrCreate?: CustomerAccountCreateOrConnectWithoutPrimaryBindingInput
    connect?: CustomerAccountWhereUniqueInput
  }

  export type EnumCrmCustomerPartyBindingStatusFieldUpdateOperationsInput = {
    set?: $Enums.CrmCustomerPartyBindingStatus
  }

  export type CustomerAccountUpdateOneRequiredWithoutPrimaryBindingNestedInput = {
    create?: XOR<CustomerAccountCreateWithoutPrimaryBindingInput, CustomerAccountUncheckedCreateWithoutPrimaryBindingInput>
    connectOrCreate?: CustomerAccountCreateOrConnectWithoutPrimaryBindingInput
    upsert?: CustomerAccountUpsertWithoutPrimaryBindingInput
    connect?: CustomerAccountWhereUniqueInput
    update?: XOR<XOR<CustomerAccountUpdateToOneWithWhereWithoutPrimaryBindingInput, CustomerAccountUpdateWithoutPrimaryBindingInput>, CustomerAccountUncheckedUpdateWithoutPrimaryBindingInput>
  }

  export type CustomerAccountCreateNestedOneWithoutContactsInput = {
    create?: XOR<CustomerAccountCreateWithoutContactsInput, CustomerAccountUncheckedCreateWithoutContactsInput>
    connectOrCreate?: CustomerAccountCreateOrConnectWithoutContactsInput
    connect?: CustomerAccountWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type CustomerAccountUpdateOneRequiredWithoutContactsNestedInput = {
    create?: XOR<CustomerAccountCreateWithoutContactsInput, CustomerAccountUncheckedCreateWithoutContactsInput>
    connectOrCreate?: CustomerAccountCreateOrConnectWithoutContactsInput
    upsert?: CustomerAccountUpsertWithoutContactsInput
    connect?: CustomerAccountWhereUniqueInput
    update?: XOR<XOR<CustomerAccountUpdateToOneWithWhereWithoutContactsInput, CustomerAccountUpdateWithoutContactsInput>, CustomerAccountUncheckedUpdateWithoutContactsInput>
  }

  export type CustomerAccountCreateNestedOneWithoutAddressesInput = {
    create?: XOR<CustomerAccountCreateWithoutAddressesInput, CustomerAccountUncheckedCreateWithoutAddressesInput>
    connectOrCreate?: CustomerAccountCreateOrConnectWithoutAddressesInput
    connect?: CustomerAccountWhereUniqueInput
  }

  export type CustomerAccountUpdateOneRequiredWithoutAddressesNestedInput = {
    create?: XOR<CustomerAccountCreateWithoutAddressesInput, CustomerAccountUncheckedCreateWithoutAddressesInput>
    connectOrCreate?: CustomerAccountCreateOrConnectWithoutAddressesInput
    upsert?: CustomerAccountUpsertWithoutAddressesInput
    connect?: CustomerAccountWhereUniqueInput
    update?: XOR<XOR<CustomerAccountUpdateToOneWithWhereWithoutAddressesInput, CustomerAccountUpdateWithoutAddressesInput>, CustomerAccountUncheckedUpdateWithoutAddressesInput>
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

  export type NestedEnumCrmCustomerStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CrmCustomerStatus | EnumCrmCustomerStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CrmCustomerStatus[] | ListEnumCrmCustomerStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrmCustomerStatus[] | ListEnumCrmCustomerStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCrmCustomerStatusFilter<$PrismaModel> | $Enums.CrmCustomerStatus
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

  export type NestedEnumCrmCustomerStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CrmCustomerStatus | EnumCrmCustomerStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CrmCustomerStatus[] | ListEnumCrmCustomerStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrmCustomerStatus[] | ListEnumCrmCustomerStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCrmCustomerStatusWithAggregatesFilter<$PrismaModel> | $Enums.CrmCustomerStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCrmCustomerStatusFilter<$PrismaModel>
    _max?: NestedEnumCrmCustomerStatusFilter<$PrismaModel>
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

  export type NestedEnumCrmCustomerPartyBindingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CrmCustomerPartyBindingStatus | EnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CrmCustomerPartyBindingStatus[] | ListEnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrmCustomerPartyBindingStatus[] | ListEnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCrmCustomerPartyBindingStatusFilter<$PrismaModel> | $Enums.CrmCustomerPartyBindingStatus
  }

  export type NestedEnumCrmCustomerPartyBindingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CrmCustomerPartyBindingStatus | EnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CrmCustomerPartyBindingStatus[] | ListEnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CrmCustomerPartyBindingStatus[] | ListEnumCrmCustomerPartyBindingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCrmCustomerPartyBindingStatusWithAggregatesFilter<$PrismaModel> | $Enums.CrmCustomerPartyBindingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCrmCustomerPartyBindingStatusFilter<$PrismaModel>
    _max?: NestedEnumCrmCustomerPartyBindingStatusFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type CustomerPartyBindingCreateWithoutCustomerAccountInput = {
    id: string
    tenantId: string
    tenantPartyId: string
    bindingStatus: $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerPartyBindingUncheckedCreateWithoutCustomerAccountInput = {
    id: string
    tenantId: string
    tenantPartyId: string
    bindingStatus: $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerPartyBindingCreateOrConnectWithoutCustomerAccountInput = {
    where: CustomerPartyBindingWhereUniqueInput
    create: XOR<CustomerPartyBindingCreateWithoutCustomerAccountInput, CustomerPartyBindingUncheckedCreateWithoutCustomerAccountInput>
  }

  export type CustomerContactCreateWithoutCustomerAccountInput = {
    id: string
    tenantId: string
    displayName: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerContactUncheckedCreateWithoutCustomerAccountInput = {
    id: string
    tenantId: string
    displayName: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerContactCreateOrConnectWithoutCustomerAccountInput = {
    where: CustomerContactWhereUniqueInput
    create: XOR<CustomerContactCreateWithoutCustomerAccountInput, CustomerContactUncheckedCreateWithoutCustomerAccountInput>
  }

  export type CustomerContactCreateManyCustomerAccountInputEnvelope = {
    data: CustomerContactCreateManyCustomerAccountInput | CustomerContactCreateManyCustomerAccountInput[]
    skipDuplicates?: boolean
  }

  export type CustomerAddressCreateWithoutCustomerAccountInput = {
    id: string
    tenantId: string
    label: string
    countryCode: string
    region?: string | null
    locality?: string | null
    addressLine1: string
    addressLine2?: string | null
    postalCode?: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerAddressUncheckedCreateWithoutCustomerAccountInput = {
    id: string
    tenantId: string
    label: string
    countryCode: string
    region?: string | null
    locality?: string | null
    addressLine1: string
    addressLine2?: string | null
    postalCode?: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerAddressCreateOrConnectWithoutCustomerAccountInput = {
    where: CustomerAddressWhereUniqueInput
    create: XOR<CustomerAddressCreateWithoutCustomerAccountInput, CustomerAddressUncheckedCreateWithoutCustomerAccountInput>
  }

  export type CustomerAddressCreateManyCustomerAccountInputEnvelope = {
    data: CustomerAddressCreateManyCustomerAccountInput | CustomerAddressCreateManyCustomerAccountInput[]
    skipDuplicates?: boolean
  }

  export type CustomerPartyBindingUpsertWithoutCustomerAccountInput = {
    update: XOR<CustomerPartyBindingUpdateWithoutCustomerAccountInput, CustomerPartyBindingUncheckedUpdateWithoutCustomerAccountInput>
    create: XOR<CustomerPartyBindingCreateWithoutCustomerAccountInput, CustomerPartyBindingUncheckedCreateWithoutCustomerAccountInput>
    where?: CustomerPartyBindingWhereInput
  }

  export type CustomerPartyBindingUpdateToOneWithWhereWithoutCustomerAccountInput = {
    where?: CustomerPartyBindingWhereInput
    data: XOR<CustomerPartyBindingUpdateWithoutCustomerAccountInput, CustomerPartyBindingUncheckedUpdateWithoutCustomerAccountInput>
  }

  export type CustomerPartyBindingUpdateWithoutCustomerAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    tenantPartyId?: StringFieldUpdateOperationsInput | string
    bindingStatus?: EnumCrmCustomerPartyBindingStatusFieldUpdateOperationsInput | $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerPartyBindingUncheckedUpdateWithoutCustomerAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    tenantPartyId?: StringFieldUpdateOperationsInput | string
    bindingStatus?: EnumCrmCustomerPartyBindingStatusFieldUpdateOperationsInput | $Enums.CrmCustomerPartyBindingStatus
    partyDisplayName?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerContactUpsertWithWhereUniqueWithoutCustomerAccountInput = {
    where: CustomerContactWhereUniqueInput
    update: XOR<CustomerContactUpdateWithoutCustomerAccountInput, CustomerContactUncheckedUpdateWithoutCustomerAccountInput>
    create: XOR<CustomerContactCreateWithoutCustomerAccountInput, CustomerContactUncheckedCreateWithoutCustomerAccountInput>
  }

  export type CustomerContactUpdateWithWhereUniqueWithoutCustomerAccountInput = {
    where: CustomerContactWhereUniqueInput
    data: XOR<CustomerContactUpdateWithoutCustomerAccountInput, CustomerContactUncheckedUpdateWithoutCustomerAccountInput>
  }

  export type CustomerContactUpdateManyWithWhereWithoutCustomerAccountInput = {
    where: CustomerContactScalarWhereInput
    data: XOR<CustomerContactUpdateManyMutationInput, CustomerContactUncheckedUpdateManyWithoutCustomerAccountInput>
  }

  export type CustomerContactScalarWhereInput = {
    AND?: CustomerContactScalarWhereInput | CustomerContactScalarWhereInput[]
    OR?: CustomerContactScalarWhereInput[]
    NOT?: CustomerContactScalarWhereInput | CustomerContactScalarWhereInput[]
    id?: UuidFilter<"CustomerContact"> | string
    tenantId?: StringFilter<"CustomerContact"> | string
    customerAccountId?: UuidFilter<"CustomerContact"> | string
    displayName?: StringFilter<"CustomerContact"> | string
    roleTitle?: StringNullableFilter<"CustomerContact"> | string | null
    email?: StringNullableFilter<"CustomerContact"> | string | null
    phone?: StringNullableFilter<"CustomerContact"> | string | null
    isPrimaryContact?: BoolFilter<"CustomerContact"> | boolean
    isActive?: BoolFilter<"CustomerContact"> | boolean
    createdAt?: DateTimeFilter<"CustomerContact"> | Date | string
    updatedAt?: DateTimeFilter<"CustomerContact"> | Date | string
  }

  export type CustomerAddressUpsertWithWhereUniqueWithoutCustomerAccountInput = {
    where: CustomerAddressWhereUniqueInput
    update: XOR<CustomerAddressUpdateWithoutCustomerAccountInput, CustomerAddressUncheckedUpdateWithoutCustomerAccountInput>
    create: XOR<CustomerAddressCreateWithoutCustomerAccountInput, CustomerAddressUncheckedCreateWithoutCustomerAccountInput>
  }

  export type CustomerAddressUpdateWithWhereUniqueWithoutCustomerAccountInput = {
    where: CustomerAddressWhereUniqueInput
    data: XOR<CustomerAddressUpdateWithoutCustomerAccountInput, CustomerAddressUncheckedUpdateWithoutCustomerAccountInput>
  }

  export type CustomerAddressUpdateManyWithWhereWithoutCustomerAccountInput = {
    where: CustomerAddressScalarWhereInput
    data: XOR<CustomerAddressUpdateManyMutationInput, CustomerAddressUncheckedUpdateManyWithoutCustomerAccountInput>
  }

  export type CustomerAddressScalarWhereInput = {
    AND?: CustomerAddressScalarWhereInput | CustomerAddressScalarWhereInput[]
    OR?: CustomerAddressScalarWhereInput[]
    NOT?: CustomerAddressScalarWhereInput | CustomerAddressScalarWhereInput[]
    id?: UuidFilter<"CustomerAddress"> | string
    tenantId?: StringFilter<"CustomerAddress"> | string
    customerAccountId?: UuidFilter<"CustomerAddress"> | string
    label?: StringFilter<"CustomerAddress"> | string
    countryCode?: StringFilter<"CustomerAddress"> | string
    region?: StringNullableFilter<"CustomerAddress"> | string | null
    locality?: StringNullableFilter<"CustomerAddress"> | string | null
    addressLine1?: StringFilter<"CustomerAddress"> | string
    addressLine2?: StringNullableFilter<"CustomerAddress"> | string | null
    postalCode?: StringNullableFilter<"CustomerAddress"> | string | null
    isPrimaryAddress?: BoolFilter<"CustomerAddress"> | boolean
    isActive?: BoolFilter<"CustomerAddress"> | boolean
    createdAt?: DateTimeFilter<"CustomerAddress"> | Date | string
    updatedAt?: DateTimeFilter<"CustomerAddress"> | Date | string
  }

  export type CustomerAccountCreateWithoutPrimaryBindingInput = {
    id: string
    customerAccountNo: string
    tenantId: string
    displayName: string
    status: $Enums.CrmCustomerStatus
    customerCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    contacts?: CustomerContactCreateNestedManyWithoutCustomerAccountInput
    addresses?: CustomerAddressCreateNestedManyWithoutCustomerAccountInput
  }

  export type CustomerAccountUncheckedCreateWithoutPrimaryBindingInput = {
    id: string
    customerAccountNo: string
    tenantId: string
    displayName: string
    status: $Enums.CrmCustomerStatus
    customerCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    contacts?: CustomerContactUncheckedCreateNestedManyWithoutCustomerAccountInput
    addresses?: CustomerAddressUncheckedCreateNestedManyWithoutCustomerAccountInput
  }

  export type CustomerAccountCreateOrConnectWithoutPrimaryBindingInput = {
    where: CustomerAccountWhereUniqueInput
    create: XOR<CustomerAccountCreateWithoutPrimaryBindingInput, CustomerAccountUncheckedCreateWithoutPrimaryBindingInput>
  }

  export type CustomerAccountUpsertWithoutPrimaryBindingInput = {
    update: XOR<CustomerAccountUpdateWithoutPrimaryBindingInput, CustomerAccountUncheckedUpdateWithoutPrimaryBindingInput>
    create: XOR<CustomerAccountCreateWithoutPrimaryBindingInput, CustomerAccountUncheckedCreateWithoutPrimaryBindingInput>
    where?: CustomerAccountWhereInput
  }

  export type CustomerAccountUpdateToOneWithWhereWithoutPrimaryBindingInput = {
    where?: CustomerAccountWhereInput
    data: XOR<CustomerAccountUpdateWithoutPrimaryBindingInput, CustomerAccountUncheckedUpdateWithoutPrimaryBindingInput>
  }

  export type CustomerAccountUpdateWithoutPrimaryBindingInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerAccountNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumCrmCustomerStatusFieldUpdateOperationsInput | $Enums.CrmCustomerStatus
    customerCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contacts?: CustomerContactUpdateManyWithoutCustomerAccountNestedInput
    addresses?: CustomerAddressUpdateManyWithoutCustomerAccountNestedInput
  }

  export type CustomerAccountUncheckedUpdateWithoutPrimaryBindingInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerAccountNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumCrmCustomerStatusFieldUpdateOperationsInput | $Enums.CrmCustomerStatus
    customerCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    contacts?: CustomerContactUncheckedUpdateManyWithoutCustomerAccountNestedInput
    addresses?: CustomerAddressUncheckedUpdateManyWithoutCustomerAccountNestedInput
  }

  export type CustomerAccountCreateWithoutContactsInput = {
    id: string
    customerAccountNo: string
    tenantId: string
    displayName: string
    status: $Enums.CrmCustomerStatus
    customerCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    primaryBinding?: CustomerPartyBindingCreateNestedOneWithoutCustomerAccountInput
    addresses?: CustomerAddressCreateNestedManyWithoutCustomerAccountInput
  }

  export type CustomerAccountUncheckedCreateWithoutContactsInput = {
    id: string
    customerAccountNo: string
    tenantId: string
    displayName: string
    status: $Enums.CrmCustomerStatus
    customerCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    primaryBinding?: CustomerPartyBindingUncheckedCreateNestedOneWithoutCustomerAccountInput
    addresses?: CustomerAddressUncheckedCreateNestedManyWithoutCustomerAccountInput
  }

  export type CustomerAccountCreateOrConnectWithoutContactsInput = {
    where: CustomerAccountWhereUniqueInput
    create: XOR<CustomerAccountCreateWithoutContactsInput, CustomerAccountUncheckedCreateWithoutContactsInput>
  }

  export type CustomerAccountUpsertWithoutContactsInput = {
    update: XOR<CustomerAccountUpdateWithoutContactsInput, CustomerAccountUncheckedUpdateWithoutContactsInput>
    create: XOR<CustomerAccountCreateWithoutContactsInput, CustomerAccountUncheckedCreateWithoutContactsInput>
    where?: CustomerAccountWhereInput
  }

  export type CustomerAccountUpdateToOneWithWhereWithoutContactsInput = {
    where?: CustomerAccountWhereInput
    data: XOR<CustomerAccountUpdateWithoutContactsInput, CustomerAccountUncheckedUpdateWithoutContactsInput>
  }

  export type CustomerAccountUpdateWithoutContactsInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerAccountNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumCrmCustomerStatusFieldUpdateOperationsInput | $Enums.CrmCustomerStatus
    customerCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    primaryBinding?: CustomerPartyBindingUpdateOneWithoutCustomerAccountNestedInput
    addresses?: CustomerAddressUpdateManyWithoutCustomerAccountNestedInput
  }

  export type CustomerAccountUncheckedUpdateWithoutContactsInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerAccountNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumCrmCustomerStatusFieldUpdateOperationsInput | $Enums.CrmCustomerStatus
    customerCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    primaryBinding?: CustomerPartyBindingUncheckedUpdateOneWithoutCustomerAccountNestedInput
    addresses?: CustomerAddressUncheckedUpdateManyWithoutCustomerAccountNestedInput
  }

  export type CustomerAccountCreateWithoutAddressesInput = {
    id: string
    customerAccountNo: string
    tenantId: string
    displayName: string
    status: $Enums.CrmCustomerStatus
    customerCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    primaryBinding?: CustomerPartyBindingCreateNestedOneWithoutCustomerAccountInput
    contacts?: CustomerContactCreateNestedManyWithoutCustomerAccountInput
  }

  export type CustomerAccountUncheckedCreateWithoutAddressesInput = {
    id: string
    customerAccountNo: string
    tenantId: string
    displayName: string
    status: $Enums.CrmCustomerStatus
    customerCategory?: string | null
    tags: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    primaryBinding?: CustomerPartyBindingUncheckedCreateNestedOneWithoutCustomerAccountInput
    contacts?: CustomerContactUncheckedCreateNestedManyWithoutCustomerAccountInput
  }

  export type CustomerAccountCreateOrConnectWithoutAddressesInput = {
    where: CustomerAccountWhereUniqueInput
    create: XOR<CustomerAccountCreateWithoutAddressesInput, CustomerAccountUncheckedCreateWithoutAddressesInput>
  }

  export type CustomerAccountUpsertWithoutAddressesInput = {
    update: XOR<CustomerAccountUpdateWithoutAddressesInput, CustomerAccountUncheckedUpdateWithoutAddressesInput>
    create: XOR<CustomerAccountCreateWithoutAddressesInput, CustomerAccountUncheckedCreateWithoutAddressesInput>
    where?: CustomerAccountWhereInput
  }

  export type CustomerAccountUpdateToOneWithWhereWithoutAddressesInput = {
    where?: CustomerAccountWhereInput
    data: XOR<CustomerAccountUpdateWithoutAddressesInput, CustomerAccountUncheckedUpdateWithoutAddressesInput>
  }

  export type CustomerAccountUpdateWithoutAddressesInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerAccountNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumCrmCustomerStatusFieldUpdateOperationsInput | $Enums.CrmCustomerStatus
    customerCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    primaryBinding?: CustomerPartyBindingUpdateOneWithoutCustomerAccountNestedInput
    contacts?: CustomerContactUpdateManyWithoutCustomerAccountNestedInput
  }

  export type CustomerAccountUncheckedUpdateWithoutAddressesInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerAccountNo?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    status?: EnumCrmCustomerStatusFieldUpdateOperationsInput | $Enums.CrmCustomerStatus
    customerCategory?: NullableStringFieldUpdateOperationsInput | string | null
    tags?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    primaryBinding?: CustomerPartyBindingUncheckedUpdateOneWithoutCustomerAccountNestedInput
    contacts?: CustomerContactUncheckedUpdateManyWithoutCustomerAccountNestedInput
  }

  export type CustomerContactCreateManyCustomerAccountInput = {
    id: string
    tenantId: string
    displayName: string
    roleTitle?: string | null
    email?: string | null
    phone?: string | null
    isPrimaryContact: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerAddressCreateManyCustomerAccountInput = {
    id: string
    tenantId: string
    label: string
    countryCode: string
    region?: string | null
    locality?: string | null
    addressLine1: string
    addressLine2?: string | null
    postalCode?: string | null
    isPrimaryAddress: boolean
    isActive: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CustomerContactUpdateWithoutCustomerAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerContactUncheckedUpdateWithoutCustomerAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerContactUncheckedUpdateManyWithoutCustomerAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    roleTitle?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryContact?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerAddressUpdateWithoutCustomerAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerAddressUncheckedUpdateWithoutCustomerAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerAddressUncheckedUpdateManyWithoutCustomerAccountInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenantId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    countryCode?: StringFieldUpdateOperationsInput | string
    region?: NullableStringFieldUpdateOperationsInput | string | null
    locality?: NullableStringFieldUpdateOperationsInput | string | null
    addressLine1?: StringFieldUpdateOperationsInput | string
    addressLine2?: NullableStringFieldUpdateOperationsInput | string | null
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    isPrimaryAddress?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
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