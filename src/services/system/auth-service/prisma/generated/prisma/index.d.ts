
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
 * Model LoginMethod
 * 
 */
export type LoginMethod = $Result.DefaultSelection<Prisma.$LoginMethodPayload>
/**
 * Model Credential
 * 
 */
export type Credential = $Result.DefaultSelection<Prisma.$CredentialPayload>
/**
 * Model OneTimeToken
 * 
 */
export type OneTimeToken = $Result.DefaultSelection<Prisma.$OneTimeTokenPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const LoginMethodType: {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  OAUTH_OPENID: 'OAUTH_OPENID'
};

export type LoginMethodType = (typeof LoginMethodType)[keyof typeof LoginMethodType]


export const CredentialType: {
  PASSWORD: 'PASSWORD',
  EMAIL_OTP: 'EMAIL_OTP',
  PHONE_OTP: 'PHONE_OTP',
  OAUTH: 'OAUTH'
};

export type CredentialType = (typeof CredentialType)[keyof typeof CredentialType]


export const OtpType: {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  TOTP: 'TOTP',
  BACKUP_CODE: 'BACKUP_CODE'
};

export type OtpType = (typeof OtpType)[keyof typeof OtpType]


export const OtpUsage: {
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  RESET_PASSWORD: 'RESET_PASSWORD',
  MFA_VERIFY: 'MFA_VERIFY'
};

export type OtpUsage = (typeof OtpUsage)[keyof typeof OtpUsage]

}

export type LoginMethodType = $Enums.LoginMethodType

export const LoginMethodType: typeof $Enums.LoginMethodType

export type CredentialType = $Enums.CredentialType

export const CredentialType: typeof $Enums.CredentialType

export type OtpType = $Enums.OtpType

export const OtpType: typeof $Enums.OtpType

export type OtpUsage = $Enums.OtpUsage

export const OtpUsage: typeof $Enums.OtpUsage

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more LoginMethods
 * const loginMethods = await prisma.loginMethod.findMany()
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
   * // Fetch zero or more LoginMethods
   * const loginMethods = await prisma.loginMethod.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

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


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.loginMethod`: Exposes CRUD operations for the **LoginMethod** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LoginMethods
    * const loginMethods = await prisma.loginMethod.findMany()
    * ```
    */
  get loginMethod(): Prisma.LoginMethodDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.credential`: Exposes CRUD operations for the **Credential** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Credentials
    * const credentials = await prisma.credential.findMany()
    * ```
    */
  get credential(): Prisma.CredentialDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.oneTimeToken`: Exposes CRUD operations for the **OneTimeToken** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more OneTimeTokens
    * const oneTimeTokens = await prisma.oneTimeToken.findMany()
    * ```
    */
  get oneTimeToken(): Prisma.OneTimeTokenDelegate<ExtArgs, ClientOptions>;
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
   * Prisma Client JS version: 6.11.1
   * Query Engine version: f40f79ec31188888a2e33acda0ecc8fd10a853a9
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
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
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
    LoginMethod: 'LoginMethod',
    Credential: 'Credential',
    OneTimeToken: 'OneTimeToken'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "loginMethod" | "credential" | "oneTimeToken"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      LoginMethod: {
        payload: Prisma.$LoginMethodPayload<ExtArgs>
        fields: Prisma.LoginMethodFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LoginMethodFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginMethodPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LoginMethodFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginMethodPayload>
          }
          findFirst: {
            args: Prisma.LoginMethodFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginMethodPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LoginMethodFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginMethodPayload>
          }
          findMany: {
            args: Prisma.LoginMethodFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginMethodPayload>[]
          }
          create: {
            args: Prisma.LoginMethodCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginMethodPayload>
          }
          createMany: {
            args: Prisma.LoginMethodCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LoginMethodCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginMethodPayload>[]
          }
          delete: {
            args: Prisma.LoginMethodDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginMethodPayload>
          }
          update: {
            args: Prisma.LoginMethodUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginMethodPayload>
          }
          deleteMany: {
            args: Prisma.LoginMethodDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LoginMethodUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LoginMethodUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginMethodPayload>[]
          }
          upsert: {
            args: Prisma.LoginMethodUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginMethodPayload>
          }
          aggregate: {
            args: Prisma.LoginMethodAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLoginMethod>
          }
          groupBy: {
            args: Prisma.LoginMethodGroupByArgs<ExtArgs>
            result: $Utils.Optional<LoginMethodGroupByOutputType>[]
          }
          count: {
            args: Prisma.LoginMethodCountArgs<ExtArgs>
            result: $Utils.Optional<LoginMethodCountAggregateOutputType> | number
          }
        }
      }
      Credential: {
        payload: Prisma.$CredentialPayload<ExtArgs>
        fields: Prisma.CredentialFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CredentialFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CredentialFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>
          }
          findFirst: {
            args: Prisma.CredentialFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CredentialFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>
          }
          findMany: {
            args: Prisma.CredentialFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>[]
          }
          create: {
            args: Prisma.CredentialCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>
          }
          createMany: {
            args: Prisma.CredentialCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CredentialCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>[]
          }
          delete: {
            args: Prisma.CredentialDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>
          }
          update: {
            args: Prisma.CredentialUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>
          }
          deleteMany: {
            args: Prisma.CredentialDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CredentialUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CredentialUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>[]
          }
          upsert: {
            args: Prisma.CredentialUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CredentialPayload>
          }
          aggregate: {
            args: Prisma.CredentialAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCredential>
          }
          groupBy: {
            args: Prisma.CredentialGroupByArgs<ExtArgs>
            result: $Utils.Optional<CredentialGroupByOutputType>[]
          }
          count: {
            args: Prisma.CredentialCountArgs<ExtArgs>
            result: $Utils.Optional<CredentialCountAggregateOutputType> | number
          }
        }
      }
      OneTimeToken: {
        payload: Prisma.$OneTimeTokenPayload<ExtArgs>
        fields: Prisma.OneTimeTokenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OneTimeTokenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OneTimeTokenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OneTimeTokenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OneTimeTokenPayload>
          }
          findFirst: {
            args: Prisma.OneTimeTokenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OneTimeTokenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OneTimeTokenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OneTimeTokenPayload>
          }
          findMany: {
            args: Prisma.OneTimeTokenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OneTimeTokenPayload>[]
          }
          create: {
            args: Prisma.OneTimeTokenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OneTimeTokenPayload>
          }
          createMany: {
            args: Prisma.OneTimeTokenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OneTimeTokenCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OneTimeTokenPayload>[]
          }
          delete: {
            args: Prisma.OneTimeTokenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OneTimeTokenPayload>
          }
          update: {
            args: Prisma.OneTimeTokenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OneTimeTokenPayload>
          }
          deleteMany: {
            args: Prisma.OneTimeTokenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OneTimeTokenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.OneTimeTokenUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OneTimeTokenPayload>[]
          }
          upsert: {
            args: Prisma.OneTimeTokenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OneTimeTokenPayload>
          }
          aggregate: {
            args: Prisma.OneTimeTokenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOneTimeToken>
          }
          groupBy: {
            args: Prisma.OneTimeTokenGroupByArgs<ExtArgs>
            result: $Utils.Optional<OneTimeTokenGroupByOutputType>[]
          }
          count: {
            args: Prisma.OneTimeTokenCountArgs<ExtArgs>
            result: $Utils.Optional<OneTimeTokenCountAggregateOutputType> | number
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
    loginMethod?: LoginMethodOmit
    credential?: CredentialOmit
    oneTimeToken?: OneTimeTokenOmit
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
   * Count Type LoginMethodCountOutputType
   */

  export type LoginMethodCountOutputType = {
    credentials: number
  }

  export type LoginMethodCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    credentials?: boolean | LoginMethodCountOutputTypeCountCredentialsArgs
  }

  // Custom InputTypes
  /**
   * LoginMethodCountOutputType without action
   */
  export type LoginMethodCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginMethodCountOutputType
     */
    select?: LoginMethodCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * LoginMethodCountOutputType without action
   */
  export type LoginMethodCountOutputTypeCountCredentialsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CredentialWhereInput
  }


  /**
   * Models
   */

  /**
   * Model LoginMethod
   */

  export type AggregateLoginMethod = {
    _count: LoginMethodCountAggregateOutputType | null
    _min: LoginMethodMinAggregateOutputType | null
    _max: LoginMethodMaxAggregateOutputType | null
  }

  export type LoginMethodMinAggregateOutputType = {
    id: string | null
    userId: string | null
    type: $Enums.LoginMethodType | null
    identifier: string | null
    verified: boolean | null
    enabled: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LoginMethodMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    type: $Enums.LoginMethodType | null
    identifier: string | null
    verified: boolean | null
    enabled: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LoginMethodCountAggregateOutputType = {
    id: number
    userId: number
    type: number
    identifier: number
    verified: number
    enabled: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LoginMethodMinAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    identifier?: true
    verified?: true
    enabled?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LoginMethodMaxAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    identifier?: true
    verified?: true
    enabled?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LoginMethodCountAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    identifier?: true
    verified?: true
    enabled?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LoginMethodAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LoginMethod to aggregate.
     */
    where?: LoginMethodWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoginMethods to fetch.
     */
    orderBy?: LoginMethodOrderByWithRelationInput | LoginMethodOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LoginMethodWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoginMethods from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoginMethods.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LoginMethods
    **/
    _count?: true | LoginMethodCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LoginMethodMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LoginMethodMaxAggregateInputType
  }

  export type GetLoginMethodAggregateType<T extends LoginMethodAggregateArgs> = {
        [P in keyof T & keyof AggregateLoginMethod]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLoginMethod[P]>
      : GetScalarType<T[P], AggregateLoginMethod[P]>
  }




  export type LoginMethodGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LoginMethodWhereInput
    orderBy?: LoginMethodOrderByWithAggregationInput | LoginMethodOrderByWithAggregationInput[]
    by: LoginMethodScalarFieldEnum[] | LoginMethodScalarFieldEnum
    having?: LoginMethodScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LoginMethodCountAggregateInputType | true
    _min?: LoginMethodMinAggregateInputType
    _max?: LoginMethodMaxAggregateInputType
  }

  export type LoginMethodGroupByOutputType = {
    id: string
    userId: string
    type: $Enums.LoginMethodType
    identifier: string
    verified: boolean
    enabled: boolean
    createdAt: Date
    updatedAt: Date
    _count: LoginMethodCountAggregateOutputType | null
    _min: LoginMethodMinAggregateOutputType | null
    _max: LoginMethodMaxAggregateOutputType | null
  }

  type GetLoginMethodGroupByPayload<T extends LoginMethodGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LoginMethodGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LoginMethodGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LoginMethodGroupByOutputType[P]>
            : GetScalarType<T[P], LoginMethodGroupByOutputType[P]>
        }
      >
    >


  export type LoginMethodSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    identifier?: boolean
    verified?: boolean
    enabled?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    credentials?: boolean | LoginMethod$credentialsArgs<ExtArgs>
    _count?: boolean | LoginMethodCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["loginMethod"]>

  export type LoginMethodSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    identifier?: boolean
    verified?: boolean
    enabled?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["loginMethod"]>

  export type LoginMethodSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    identifier?: boolean
    verified?: boolean
    enabled?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["loginMethod"]>

  export type LoginMethodSelectScalar = {
    id?: boolean
    userId?: boolean
    type?: boolean
    identifier?: boolean
    verified?: boolean
    enabled?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LoginMethodOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "type" | "identifier" | "verified" | "enabled" | "createdAt" | "updatedAt", ExtArgs["result"]["loginMethod"]>
  export type LoginMethodInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    credentials?: boolean | LoginMethod$credentialsArgs<ExtArgs>
    _count?: boolean | LoginMethodCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type LoginMethodIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type LoginMethodIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $LoginMethodPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LoginMethod"
    objects: {
      credentials: Prisma.$CredentialPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      type: $Enums.LoginMethodType
      identifier: string
      verified: boolean
      enabled: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["loginMethod"]>
    composites: {}
  }

  type LoginMethodGetPayload<S extends boolean | null | undefined | LoginMethodDefaultArgs> = $Result.GetResult<Prisma.$LoginMethodPayload, S>

  type LoginMethodCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LoginMethodFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LoginMethodCountAggregateInputType | true
    }

  export interface LoginMethodDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LoginMethod'], meta: { name: 'LoginMethod' } }
    /**
     * Find zero or one LoginMethod that matches the filter.
     * @param {LoginMethodFindUniqueArgs} args - Arguments to find a LoginMethod
     * @example
     * // Get one LoginMethod
     * const loginMethod = await prisma.loginMethod.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LoginMethodFindUniqueArgs>(args: SelectSubset<T, LoginMethodFindUniqueArgs<ExtArgs>>): Prisma__LoginMethodClient<$Result.GetResult<Prisma.$LoginMethodPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one LoginMethod that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LoginMethodFindUniqueOrThrowArgs} args - Arguments to find a LoginMethod
     * @example
     * // Get one LoginMethod
     * const loginMethod = await prisma.loginMethod.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LoginMethodFindUniqueOrThrowArgs>(args: SelectSubset<T, LoginMethodFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LoginMethodClient<$Result.GetResult<Prisma.$LoginMethodPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LoginMethod that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginMethodFindFirstArgs} args - Arguments to find a LoginMethod
     * @example
     * // Get one LoginMethod
     * const loginMethod = await prisma.loginMethod.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LoginMethodFindFirstArgs>(args?: SelectSubset<T, LoginMethodFindFirstArgs<ExtArgs>>): Prisma__LoginMethodClient<$Result.GetResult<Prisma.$LoginMethodPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LoginMethod that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginMethodFindFirstOrThrowArgs} args - Arguments to find a LoginMethod
     * @example
     * // Get one LoginMethod
     * const loginMethod = await prisma.loginMethod.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LoginMethodFindFirstOrThrowArgs>(args?: SelectSubset<T, LoginMethodFindFirstOrThrowArgs<ExtArgs>>): Prisma__LoginMethodClient<$Result.GetResult<Prisma.$LoginMethodPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more LoginMethods that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginMethodFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LoginMethods
     * const loginMethods = await prisma.loginMethod.findMany()
     * 
     * // Get first 10 LoginMethods
     * const loginMethods = await prisma.loginMethod.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const loginMethodWithIdOnly = await prisma.loginMethod.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LoginMethodFindManyArgs>(args?: SelectSubset<T, LoginMethodFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LoginMethodPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a LoginMethod.
     * @param {LoginMethodCreateArgs} args - Arguments to create a LoginMethod.
     * @example
     * // Create one LoginMethod
     * const LoginMethod = await prisma.loginMethod.create({
     *   data: {
     *     // ... data to create a LoginMethod
     *   }
     * })
     * 
     */
    create<T extends LoginMethodCreateArgs>(args: SelectSubset<T, LoginMethodCreateArgs<ExtArgs>>): Prisma__LoginMethodClient<$Result.GetResult<Prisma.$LoginMethodPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many LoginMethods.
     * @param {LoginMethodCreateManyArgs} args - Arguments to create many LoginMethods.
     * @example
     * // Create many LoginMethods
     * const loginMethod = await prisma.loginMethod.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LoginMethodCreateManyArgs>(args?: SelectSubset<T, LoginMethodCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LoginMethods and returns the data saved in the database.
     * @param {LoginMethodCreateManyAndReturnArgs} args - Arguments to create many LoginMethods.
     * @example
     * // Create many LoginMethods
     * const loginMethod = await prisma.loginMethod.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LoginMethods and only return the `id`
     * const loginMethodWithIdOnly = await prisma.loginMethod.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LoginMethodCreateManyAndReturnArgs>(args?: SelectSubset<T, LoginMethodCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LoginMethodPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a LoginMethod.
     * @param {LoginMethodDeleteArgs} args - Arguments to delete one LoginMethod.
     * @example
     * // Delete one LoginMethod
     * const LoginMethod = await prisma.loginMethod.delete({
     *   where: {
     *     // ... filter to delete one LoginMethod
     *   }
     * })
     * 
     */
    delete<T extends LoginMethodDeleteArgs>(args: SelectSubset<T, LoginMethodDeleteArgs<ExtArgs>>): Prisma__LoginMethodClient<$Result.GetResult<Prisma.$LoginMethodPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one LoginMethod.
     * @param {LoginMethodUpdateArgs} args - Arguments to update one LoginMethod.
     * @example
     * // Update one LoginMethod
     * const loginMethod = await prisma.loginMethod.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LoginMethodUpdateArgs>(args: SelectSubset<T, LoginMethodUpdateArgs<ExtArgs>>): Prisma__LoginMethodClient<$Result.GetResult<Prisma.$LoginMethodPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more LoginMethods.
     * @param {LoginMethodDeleteManyArgs} args - Arguments to filter LoginMethods to delete.
     * @example
     * // Delete a few LoginMethods
     * const { count } = await prisma.loginMethod.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LoginMethodDeleteManyArgs>(args?: SelectSubset<T, LoginMethodDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LoginMethods.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginMethodUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LoginMethods
     * const loginMethod = await prisma.loginMethod.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LoginMethodUpdateManyArgs>(args: SelectSubset<T, LoginMethodUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LoginMethods and returns the data updated in the database.
     * @param {LoginMethodUpdateManyAndReturnArgs} args - Arguments to update many LoginMethods.
     * @example
     * // Update many LoginMethods
     * const loginMethod = await prisma.loginMethod.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more LoginMethods and only return the `id`
     * const loginMethodWithIdOnly = await prisma.loginMethod.updateManyAndReturn({
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
    updateManyAndReturn<T extends LoginMethodUpdateManyAndReturnArgs>(args: SelectSubset<T, LoginMethodUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LoginMethodPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one LoginMethod.
     * @param {LoginMethodUpsertArgs} args - Arguments to update or create a LoginMethod.
     * @example
     * // Update or create a LoginMethod
     * const loginMethod = await prisma.loginMethod.upsert({
     *   create: {
     *     // ... data to create a LoginMethod
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LoginMethod we want to update
     *   }
     * })
     */
    upsert<T extends LoginMethodUpsertArgs>(args: SelectSubset<T, LoginMethodUpsertArgs<ExtArgs>>): Prisma__LoginMethodClient<$Result.GetResult<Prisma.$LoginMethodPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of LoginMethods.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginMethodCountArgs} args - Arguments to filter LoginMethods to count.
     * @example
     * // Count the number of LoginMethods
     * const count = await prisma.loginMethod.count({
     *   where: {
     *     // ... the filter for the LoginMethods we want to count
     *   }
     * })
    **/
    count<T extends LoginMethodCountArgs>(
      args?: Subset<T, LoginMethodCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LoginMethodCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LoginMethod.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginMethodAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends LoginMethodAggregateArgs>(args: Subset<T, LoginMethodAggregateArgs>): Prisma.PrismaPromise<GetLoginMethodAggregateType<T>>

    /**
     * Group by LoginMethod.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginMethodGroupByArgs} args - Group by arguments.
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
      T extends LoginMethodGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LoginMethodGroupByArgs['orderBy'] }
        : { orderBy?: LoginMethodGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, LoginMethodGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLoginMethodGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LoginMethod model
   */
  readonly fields: LoginMethodFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LoginMethod.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LoginMethodClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    credentials<T extends LoginMethod$credentialsArgs<ExtArgs> = {}>(args?: Subset<T, LoginMethod$credentialsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
   * Fields of the LoginMethod model
   */
  interface LoginMethodFieldRefs {
    readonly id: FieldRef<"LoginMethod", 'String'>
    readonly userId: FieldRef<"LoginMethod", 'String'>
    readonly type: FieldRef<"LoginMethod", 'LoginMethodType'>
    readonly identifier: FieldRef<"LoginMethod", 'String'>
    readonly verified: FieldRef<"LoginMethod", 'Boolean'>
    readonly enabled: FieldRef<"LoginMethod", 'Boolean'>
    readonly createdAt: FieldRef<"LoginMethod", 'DateTime'>
    readonly updatedAt: FieldRef<"LoginMethod", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * LoginMethod findUnique
   */
  export type LoginMethodFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginMethod
     */
    select?: LoginMethodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginMethod
     */
    omit?: LoginMethodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginMethodInclude<ExtArgs> | null
    /**
     * Filter, which LoginMethod to fetch.
     */
    where: LoginMethodWhereUniqueInput
  }

  /**
   * LoginMethod findUniqueOrThrow
   */
  export type LoginMethodFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginMethod
     */
    select?: LoginMethodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginMethod
     */
    omit?: LoginMethodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginMethodInclude<ExtArgs> | null
    /**
     * Filter, which LoginMethod to fetch.
     */
    where: LoginMethodWhereUniqueInput
  }

  /**
   * LoginMethod findFirst
   */
  export type LoginMethodFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginMethod
     */
    select?: LoginMethodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginMethod
     */
    omit?: LoginMethodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginMethodInclude<ExtArgs> | null
    /**
     * Filter, which LoginMethod to fetch.
     */
    where?: LoginMethodWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoginMethods to fetch.
     */
    orderBy?: LoginMethodOrderByWithRelationInput | LoginMethodOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LoginMethods.
     */
    cursor?: LoginMethodWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoginMethods from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoginMethods.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LoginMethods.
     */
    distinct?: LoginMethodScalarFieldEnum | LoginMethodScalarFieldEnum[]
  }

  /**
   * LoginMethod findFirstOrThrow
   */
  export type LoginMethodFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginMethod
     */
    select?: LoginMethodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginMethod
     */
    omit?: LoginMethodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginMethodInclude<ExtArgs> | null
    /**
     * Filter, which LoginMethod to fetch.
     */
    where?: LoginMethodWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoginMethods to fetch.
     */
    orderBy?: LoginMethodOrderByWithRelationInput | LoginMethodOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LoginMethods.
     */
    cursor?: LoginMethodWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoginMethods from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoginMethods.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LoginMethods.
     */
    distinct?: LoginMethodScalarFieldEnum | LoginMethodScalarFieldEnum[]
  }

  /**
   * LoginMethod findMany
   */
  export type LoginMethodFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginMethod
     */
    select?: LoginMethodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginMethod
     */
    omit?: LoginMethodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginMethodInclude<ExtArgs> | null
    /**
     * Filter, which LoginMethods to fetch.
     */
    where?: LoginMethodWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoginMethods to fetch.
     */
    orderBy?: LoginMethodOrderByWithRelationInput | LoginMethodOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LoginMethods.
     */
    cursor?: LoginMethodWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoginMethods from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoginMethods.
     */
    skip?: number
    distinct?: LoginMethodScalarFieldEnum | LoginMethodScalarFieldEnum[]
  }

  /**
   * LoginMethod create
   */
  export type LoginMethodCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginMethod
     */
    select?: LoginMethodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginMethod
     */
    omit?: LoginMethodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginMethodInclude<ExtArgs> | null
    /**
     * The data needed to create a LoginMethod.
     */
    data: XOR<LoginMethodCreateInput, LoginMethodUncheckedCreateInput>
  }

  /**
   * LoginMethod createMany
   */
  export type LoginMethodCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LoginMethods.
     */
    data: LoginMethodCreateManyInput | LoginMethodCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LoginMethod createManyAndReturn
   */
  export type LoginMethodCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginMethod
     */
    select?: LoginMethodSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LoginMethod
     */
    omit?: LoginMethodOmit<ExtArgs> | null
    /**
     * The data used to create many LoginMethods.
     */
    data: LoginMethodCreateManyInput | LoginMethodCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LoginMethod update
   */
  export type LoginMethodUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginMethod
     */
    select?: LoginMethodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginMethod
     */
    omit?: LoginMethodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginMethodInclude<ExtArgs> | null
    /**
     * The data needed to update a LoginMethod.
     */
    data: XOR<LoginMethodUpdateInput, LoginMethodUncheckedUpdateInput>
    /**
     * Choose, which LoginMethod to update.
     */
    where: LoginMethodWhereUniqueInput
  }

  /**
   * LoginMethod updateMany
   */
  export type LoginMethodUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LoginMethods.
     */
    data: XOR<LoginMethodUpdateManyMutationInput, LoginMethodUncheckedUpdateManyInput>
    /**
     * Filter which LoginMethods to update
     */
    where?: LoginMethodWhereInput
    /**
     * Limit how many LoginMethods to update.
     */
    limit?: number
  }

  /**
   * LoginMethod updateManyAndReturn
   */
  export type LoginMethodUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginMethod
     */
    select?: LoginMethodSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LoginMethod
     */
    omit?: LoginMethodOmit<ExtArgs> | null
    /**
     * The data used to update LoginMethods.
     */
    data: XOR<LoginMethodUpdateManyMutationInput, LoginMethodUncheckedUpdateManyInput>
    /**
     * Filter which LoginMethods to update
     */
    where?: LoginMethodWhereInput
    /**
     * Limit how many LoginMethods to update.
     */
    limit?: number
  }

  /**
   * LoginMethod upsert
   */
  export type LoginMethodUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginMethod
     */
    select?: LoginMethodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginMethod
     */
    omit?: LoginMethodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginMethodInclude<ExtArgs> | null
    /**
     * The filter to search for the LoginMethod to update in case it exists.
     */
    where: LoginMethodWhereUniqueInput
    /**
     * In case the LoginMethod found by the `where` argument doesn't exist, create a new LoginMethod with this data.
     */
    create: XOR<LoginMethodCreateInput, LoginMethodUncheckedCreateInput>
    /**
     * In case the LoginMethod was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LoginMethodUpdateInput, LoginMethodUncheckedUpdateInput>
  }

  /**
   * LoginMethod delete
   */
  export type LoginMethodDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginMethod
     */
    select?: LoginMethodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginMethod
     */
    omit?: LoginMethodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginMethodInclude<ExtArgs> | null
    /**
     * Filter which LoginMethod to delete.
     */
    where: LoginMethodWhereUniqueInput
  }

  /**
   * LoginMethod deleteMany
   */
  export type LoginMethodDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LoginMethods to delete
     */
    where?: LoginMethodWhereInput
    /**
     * Limit how many LoginMethods to delete.
     */
    limit?: number
  }

  /**
   * LoginMethod.credentials
   */
  export type LoginMethod$credentialsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    where?: CredentialWhereInput
    orderBy?: CredentialOrderByWithRelationInput | CredentialOrderByWithRelationInput[]
    cursor?: CredentialWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CredentialScalarFieldEnum | CredentialScalarFieldEnum[]
  }

  /**
   * LoginMethod without action
   */
  export type LoginMethodDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginMethod
     */
    select?: LoginMethodSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginMethod
     */
    omit?: LoginMethodOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginMethodInclude<ExtArgs> | null
  }


  /**
   * Model Credential
   */

  export type AggregateCredential = {
    _count: CredentialCountAggregateOutputType | null
    _min: CredentialMinAggregateOutputType | null
    _max: CredentialMaxAggregateOutputType | null
  }

  export type CredentialMinAggregateOutputType = {
    id: string | null
    loginMethodId: string | null
    secretType: $Enums.CredentialType | null
    secretValue: string | null
    provider: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CredentialMaxAggregateOutputType = {
    id: string | null
    loginMethodId: string | null
    secretType: $Enums.CredentialType | null
    secretValue: string | null
    provider: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CredentialCountAggregateOutputType = {
    id: number
    loginMethodId: number
    secretType: number
    secretValue: number
    provider: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CredentialMinAggregateInputType = {
    id?: true
    loginMethodId?: true
    secretType?: true
    secretValue?: true
    provider?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CredentialMaxAggregateInputType = {
    id?: true
    loginMethodId?: true
    secretType?: true
    secretValue?: true
    provider?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CredentialCountAggregateInputType = {
    id?: true
    loginMethodId?: true
    secretType?: true
    secretValue?: true
    provider?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CredentialAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Credential to aggregate.
     */
    where?: CredentialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Credentials to fetch.
     */
    orderBy?: CredentialOrderByWithRelationInput | CredentialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CredentialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Credentials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Credentials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Credentials
    **/
    _count?: true | CredentialCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CredentialMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CredentialMaxAggregateInputType
  }

  export type GetCredentialAggregateType<T extends CredentialAggregateArgs> = {
        [P in keyof T & keyof AggregateCredential]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCredential[P]>
      : GetScalarType<T[P], AggregateCredential[P]>
  }




  export type CredentialGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CredentialWhereInput
    orderBy?: CredentialOrderByWithAggregationInput | CredentialOrderByWithAggregationInput[]
    by: CredentialScalarFieldEnum[] | CredentialScalarFieldEnum
    having?: CredentialScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CredentialCountAggregateInputType | true
    _min?: CredentialMinAggregateInputType
    _max?: CredentialMaxAggregateInputType
  }

  export type CredentialGroupByOutputType = {
    id: string
    loginMethodId: string
    secretType: $Enums.CredentialType
    secretValue: string | null
    provider: string | null
    createdAt: Date
    updatedAt: Date
    _count: CredentialCountAggregateOutputType | null
    _min: CredentialMinAggregateOutputType | null
    _max: CredentialMaxAggregateOutputType | null
  }

  type GetCredentialGroupByPayload<T extends CredentialGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CredentialGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CredentialGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CredentialGroupByOutputType[P]>
            : GetScalarType<T[P], CredentialGroupByOutputType[P]>
        }
      >
    >


  export type CredentialSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    loginMethodId?: boolean
    secretType?: boolean
    secretValue?: boolean
    provider?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    LoginMethods?: boolean | LoginMethodDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["credential"]>

  export type CredentialSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    loginMethodId?: boolean
    secretType?: boolean
    secretValue?: boolean
    provider?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    LoginMethods?: boolean | LoginMethodDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["credential"]>

  export type CredentialSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    loginMethodId?: boolean
    secretType?: boolean
    secretValue?: boolean
    provider?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    LoginMethods?: boolean | LoginMethodDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["credential"]>

  export type CredentialSelectScalar = {
    id?: boolean
    loginMethodId?: boolean
    secretType?: boolean
    secretValue?: boolean
    provider?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CredentialOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "loginMethodId" | "secretType" | "secretValue" | "provider" | "createdAt" | "updatedAt", ExtArgs["result"]["credential"]>
  export type CredentialInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    LoginMethods?: boolean | LoginMethodDefaultArgs<ExtArgs>
  }
  export type CredentialIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    LoginMethods?: boolean | LoginMethodDefaultArgs<ExtArgs>
  }
  export type CredentialIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    LoginMethods?: boolean | LoginMethodDefaultArgs<ExtArgs>
  }

  export type $CredentialPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Credential"
    objects: {
      LoginMethods: Prisma.$LoginMethodPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      loginMethodId: string
      secretType: $Enums.CredentialType
      secretValue: string | null
      provider: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["credential"]>
    composites: {}
  }

  type CredentialGetPayload<S extends boolean | null | undefined | CredentialDefaultArgs> = $Result.GetResult<Prisma.$CredentialPayload, S>

  type CredentialCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CredentialFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CredentialCountAggregateInputType | true
    }

  export interface CredentialDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Credential'], meta: { name: 'Credential' } }
    /**
     * Find zero or one Credential that matches the filter.
     * @param {CredentialFindUniqueArgs} args - Arguments to find a Credential
     * @example
     * // Get one Credential
     * const credential = await prisma.credential.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CredentialFindUniqueArgs>(args: SelectSubset<T, CredentialFindUniqueArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Credential that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CredentialFindUniqueOrThrowArgs} args - Arguments to find a Credential
     * @example
     * // Get one Credential
     * const credential = await prisma.credential.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CredentialFindUniqueOrThrowArgs>(args: SelectSubset<T, CredentialFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Credential that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialFindFirstArgs} args - Arguments to find a Credential
     * @example
     * // Get one Credential
     * const credential = await prisma.credential.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CredentialFindFirstArgs>(args?: SelectSubset<T, CredentialFindFirstArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Credential that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialFindFirstOrThrowArgs} args - Arguments to find a Credential
     * @example
     * // Get one Credential
     * const credential = await prisma.credential.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CredentialFindFirstOrThrowArgs>(args?: SelectSubset<T, CredentialFindFirstOrThrowArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Credentials that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Credentials
     * const credentials = await prisma.credential.findMany()
     * 
     * // Get first 10 Credentials
     * const credentials = await prisma.credential.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const credentialWithIdOnly = await prisma.credential.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CredentialFindManyArgs>(args?: SelectSubset<T, CredentialFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Credential.
     * @param {CredentialCreateArgs} args - Arguments to create a Credential.
     * @example
     * // Create one Credential
     * const Credential = await prisma.credential.create({
     *   data: {
     *     // ... data to create a Credential
     *   }
     * })
     * 
     */
    create<T extends CredentialCreateArgs>(args: SelectSubset<T, CredentialCreateArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Credentials.
     * @param {CredentialCreateManyArgs} args - Arguments to create many Credentials.
     * @example
     * // Create many Credentials
     * const credential = await prisma.credential.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CredentialCreateManyArgs>(args?: SelectSubset<T, CredentialCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Credentials and returns the data saved in the database.
     * @param {CredentialCreateManyAndReturnArgs} args - Arguments to create many Credentials.
     * @example
     * // Create many Credentials
     * const credential = await prisma.credential.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Credentials and only return the `id`
     * const credentialWithIdOnly = await prisma.credential.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CredentialCreateManyAndReturnArgs>(args?: SelectSubset<T, CredentialCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Credential.
     * @param {CredentialDeleteArgs} args - Arguments to delete one Credential.
     * @example
     * // Delete one Credential
     * const Credential = await prisma.credential.delete({
     *   where: {
     *     // ... filter to delete one Credential
     *   }
     * })
     * 
     */
    delete<T extends CredentialDeleteArgs>(args: SelectSubset<T, CredentialDeleteArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Credential.
     * @param {CredentialUpdateArgs} args - Arguments to update one Credential.
     * @example
     * // Update one Credential
     * const credential = await prisma.credential.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CredentialUpdateArgs>(args: SelectSubset<T, CredentialUpdateArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Credentials.
     * @param {CredentialDeleteManyArgs} args - Arguments to filter Credentials to delete.
     * @example
     * // Delete a few Credentials
     * const { count } = await prisma.credential.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CredentialDeleteManyArgs>(args?: SelectSubset<T, CredentialDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Credentials.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Credentials
     * const credential = await prisma.credential.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CredentialUpdateManyArgs>(args: SelectSubset<T, CredentialUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Credentials and returns the data updated in the database.
     * @param {CredentialUpdateManyAndReturnArgs} args - Arguments to update many Credentials.
     * @example
     * // Update many Credentials
     * const credential = await prisma.credential.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Credentials and only return the `id`
     * const credentialWithIdOnly = await prisma.credential.updateManyAndReturn({
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
    updateManyAndReturn<T extends CredentialUpdateManyAndReturnArgs>(args: SelectSubset<T, CredentialUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Credential.
     * @param {CredentialUpsertArgs} args - Arguments to update or create a Credential.
     * @example
     * // Update or create a Credential
     * const credential = await prisma.credential.upsert({
     *   create: {
     *     // ... data to create a Credential
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Credential we want to update
     *   }
     * })
     */
    upsert<T extends CredentialUpsertArgs>(args: SelectSubset<T, CredentialUpsertArgs<ExtArgs>>): Prisma__CredentialClient<$Result.GetResult<Prisma.$CredentialPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Credentials.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialCountArgs} args - Arguments to filter Credentials to count.
     * @example
     * // Count the number of Credentials
     * const count = await prisma.credential.count({
     *   where: {
     *     // ... the filter for the Credentials we want to count
     *   }
     * })
    **/
    count<T extends CredentialCountArgs>(
      args?: Subset<T, CredentialCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CredentialCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Credential.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends CredentialAggregateArgs>(args: Subset<T, CredentialAggregateArgs>): Prisma.PrismaPromise<GetCredentialAggregateType<T>>

    /**
     * Group by Credential.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CredentialGroupByArgs} args - Group by arguments.
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
      T extends CredentialGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CredentialGroupByArgs['orderBy'] }
        : { orderBy?: CredentialGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, CredentialGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCredentialGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Credential model
   */
  readonly fields: CredentialFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Credential.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CredentialClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    LoginMethods<T extends LoginMethodDefaultArgs<ExtArgs> = {}>(args?: Subset<T, LoginMethodDefaultArgs<ExtArgs>>): Prisma__LoginMethodClient<$Result.GetResult<Prisma.$LoginMethodPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the Credential model
   */
  interface CredentialFieldRefs {
    readonly id: FieldRef<"Credential", 'String'>
    readonly loginMethodId: FieldRef<"Credential", 'String'>
    readonly secretType: FieldRef<"Credential", 'CredentialType'>
    readonly secretValue: FieldRef<"Credential", 'String'>
    readonly provider: FieldRef<"Credential", 'String'>
    readonly createdAt: FieldRef<"Credential", 'DateTime'>
    readonly updatedAt: FieldRef<"Credential", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Credential findUnique
   */
  export type CredentialFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * Filter, which Credential to fetch.
     */
    where: CredentialWhereUniqueInput
  }

  /**
   * Credential findUniqueOrThrow
   */
  export type CredentialFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * Filter, which Credential to fetch.
     */
    where: CredentialWhereUniqueInput
  }

  /**
   * Credential findFirst
   */
  export type CredentialFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * Filter, which Credential to fetch.
     */
    where?: CredentialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Credentials to fetch.
     */
    orderBy?: CredentialOrderByWithRelationInput | CredentialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Credentials.
     */
    cursor?: CredentialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Credentials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Credentials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Credentials.
     */
    distinct?: CredentialScalarFieldEnum | CredentialScalarFieldEnum[]
  }

  /**
   * Credential findFirstOrThrow
   */
  export type CredentialFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * Filter, which Credential to fetch.
     */
    where?: CredentialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Credentials to fetch.
     */
    orderBy?: CredentialOrderByWithRelationInput | CredentialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Credentials.
     */
    cursor?: CredentialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Credentials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Credentials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Credentials.
     */
    distinct?: CredentialScalarFieldEnum | CredentialScalarFieldEnum[]
  }

  /**
   * Credential findMany
   */
  export type CredentialFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * Filter, which Credentials to fetch.
     */
    where?: CredentialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Credentials to fetch.
     */
    orderBy?: CredentialOrderByWithRelationInput | CredentialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Credentials.
     */
    cursor?: CredentialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Credentials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Credentials.
     */
    skip?: number
    distinct?: CredentialScalarFieldEnum | CredentialScalarFieldEnum[]
  }

  /**
   * Credential create
   */
  export type CredentialCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * The data needed to create a Credential.
     */
    data: XOR<CredentialCreateInput, CredentialUncheckedCreateInput>
  }

  /**
   * Credential createMany
   */
  export type CredentialCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Credentials.
     */
    data: CredentialCreateManyInput | CredentialCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Credential createManyAndReturn
   */
  export type CredentialCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * The data used to create many Credentials.
     */
    data: CredentialCreateManyInput | CredentialCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Credential update
   */
  export type CredentialUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * The data needed to update a Credential.
     */
    data: XOR<CredentialUpdateInput, CredentialUncheckedUpdateInput>
    /**
     * Choose, which Credential to update.
     */
    where: CredentialWhereUniqueInput
  }

  /**
   * Credential updateMany
   */
  export type CredentialUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Credentials.
     */
    data: XOR<CredentialUpdateManyMutationInput, CredentialUncheckedUpdateManyInput>
    /**
     * Filter which Credentials to update
     */
    where?: CredentialWhereInput
    /**
     * Limit how many Credentials to update.
     */
    limit?: number
  }

  /**
   * Credential updateManyAndReturn
   */
  export type CredentialUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * The data used to update Credentials.
     */
    data: XOR<CredentialUpdateManyMutationInput, CredentialUncheckedUpdateManyInput>
    /**
     * Filter which Credentials to update
     */
    where?: CredentialWhereInput
    /**
     * Limit how many Credentials to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Credential upsert
   */
  export type CredentialUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * The filter to search for the Credential to update in case it exists.
     */
    where: CredentialWhereUniqueInput
    /**
     * In case the Credential found by the `where` argument doesn't exist, create a new Credential with this data.
     */
    create: XOR<CredentialCreateInput, CredentialUncheckedCreateInput>
    /**
     * In case the Credential was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CredentialUpdateInput, CredentialUncheckedUpdateInput>
  }

  /**
   * Credential delete
   */
  export type CredentialDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
    /**
     * Filter which Credential to delete.
     */
    where: CredentialWhereUniqueInput
  }

  /**
   * Credential deleteMany
   */
  export type CredentialDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Credentials to delete
     */
    where?: CredentialWhereInput
    /**
     * Limit how many Credentials to delete.
     */
    limit?: number
  }

  /**
   * Credential without action
   */
  export type CredentialDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Credential
     */
    select?: CredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Credential
     */
    omit?: CredentialOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CredentialInclude<ExtArgs> | null
  }


  /**
   * Model OneTimeToken
   */

  export type AggregateOneTimeToken = {
    _count: OneTimeTokenCountAggregateOutputType | null
    _avg: OneTimeTokenAvgAggregateOutputType | null
    _sum: OneTimeTokenSumAggregateOutputType | null
    _min: OneTimeTokenMinAggregateOutputType | null
    _max: OneTimeTokenMaxAggregateOutputType | null
  }

  export type OneTimeTokenAvgAggregateOutputType = {
    attemptCount: number | null
  }

  export type OneTimeTokenSumAggregateOutputType = {
    attemptCount: number | null
  }

  export type OneTimeTokenMinAggregateOutputType = {
    id: string | null
    type: $Enums.OtpType | null
    usage: $Enums.OtpUsage | null
    identifier: string | null
    code: string | null
    expiredAt: Date | null
    consumed: boolean | null
    attemptCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type OneTimeTokenMaxAggregateOutputType = {
    id: string | null
    type: $Enums.OtpType | null
    usage: $Enums.OtpUsage | null
    identifier: string | null
    code: string | null
    expiredAt: Date | null
    consumed: boolean | null
    attemptCount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type OneTimeTokenCountAggregateOutputType = {
    id: number
    type: number
    usage: number
    identifier: number
    code: number
    expiredAt: number
    consumed: number
    attemptCount: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type OneTimeTokenAvgAggregateInputType = {
    attemptCount?: true
  }

  export type OneTimeTokenSumAggregateInputType = {
    attemptCount?: true
  }

  export type OneTimeTokenMinAggregateInputType = {
    id?: true
    type?: true
    usage?: true
    identifier?: true
    code?: true
    expiredAt?: true
    consumed?: true
    attemptCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type OneTimeTokenMaxAggregateInputType = {
    id?: true
    type?: true
    usage?: true
    identifier?: true
    code?: true
    expiredAt?: true
    consumed?: true
    attemptCount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type OneTimeTokenCountAggregateInputType = {
    id?: true
    type?: true
    usage?: true
    identifier?: true
    code?: true
    expiredAt?: true
    consumed?: true
    attemptCount?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type OneTimeTokenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OneTimeToken to aggregate.
     */
    where?: OneTimeTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OneTimeTokens to fetch.
     */
    orderBy?: OneTimeTokenOrderByWithRelationInput | OneTimeTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OneTimeTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OneTimeTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OneTimeTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned OneTimeTokens
    **/
    _count?: true | OneTimeTokenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: OneTimeTokenAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: OneTimeTokenSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OneTimeTokenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OneTimeTokenMaxAggregateInputType
  }

  export type GetOneTimeTokenAggregateType<T extends OneTimeTokenAggregateArgs> = {
        [P in keyof T & keyof AggregateOneTimeToken]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOneTimeToken[P]>
      : GetScalarType<T[P], AggregateOneTimeToken[P]>
  }




  export type OneTimeTokenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OneTimeTokenWhereInput
    orderBy?: OneTimeTokenOrderByWithAggregationInput | OneTimeTokenOrderByWithAggregationInput[]
    by: OneTimeTokenScalarFieldEnum[] | OneTimeTokenScalarFieldEnum
    having?: OneTimeTokenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OneTimeTokenCountAggregateInputType | true
    _avg?: OneTimeTokenAvgAggregateInputType
    _sum?: OneTimeTokenSumAggregateInputType
    _min?: OneTimeTokenMinAggregateInputType
    _max?: OneTimeTokenMaxAggregateInputType
  }

  export type OneTimeTokenGroupByOutputType = {
    id: string
    type: $Enums.OtpType
    usage: $Enums.OtpUsage
    identifier: string
    code: string
    expiredAt: Date
    consumed: boolean
    attemptCount: number
    createdAt: Date
    updatedAt: Date
    _count: OneTimeTokenCountAggregateOutputType | null
    _avg: OneTimeTokenAvgAggregateOutputType | null
    _sum: OneTimeTokenSumAggregateOutputType | null
    _min: OneTimeTokenMinAggregateOutputType | null
    _max: OneTimeTokenMaxAggregateOutputType | null
  }

  type GetOneTimeTokenGroupByPayload<T extends OneTimeTokenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OneTimeTokenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OneTimeTokenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OneTimeTokenGroupByOutputType[P]>
            : GetScalarType<T[P], OneTimeTokenGroupByOutputType[P]>
        }
      >
    >


  export type OneTimeTokenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    usage?: boolean
    identifier?: boolean
    code?: boolean
    expiredAt?: boolean
    consumed?: boolean
    attemptCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["oneTimeToken"]>

  export type OneTimeTokenSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    usage?: boolean
    identifier?: boolean
    code?: boolean
    expiredAt?: boolean
    consumed?: boolean
    attemptCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["oneTimeToken"]>

  export type OneTimeTokenSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    usage?: boolean
    identifier?: boolean
    code?: boolean
    expiredAt?: boolean
    consumed?: boolean
    attemptCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["oneTimeToken"]>

  export type OneTimeTokenSelectScalar = {
    id?: boolean
    type?: boolean
    usage?: boolean
    identifier?: boolean
    code?: boolean
    expiredAt?: boolean
    consumed?: boolean
    attemptCount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type OneTimeTokenOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "type" | "usage" | "identifier" | "code" | "expiredAt" | "consumed" | "attemptCount" | "createdAt" | "updatedAt", ExtArgs["result"]["oneTimeToken"]>

  export type $OneTimeTokenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "OneTimeToken"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      type: $Enums.OtpType
      usage: $Enums.OtpUsage
      identifier: string
      code: string
      expiredAt: Date
      consumed: boolean
      attemptCount: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["oneTimeToken"]>
    composites: {}
  }

  type OneTimeTokenGetPayload<S extends boolean | null | undefined | OneTimeTokenDefaultArgs> = $Result.GetResult<Prisma.$OneTimeTokenPayload, S>

  type OneTimeTokenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<OneTimeTokenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OneTimeTokenCountAggregateInputType | true
    }

  export interface OneTimeTokenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['OneTimeToken'], meta: { name: 'OneTimeToken' } }
    /**
     * Find zero or one OneTimeToken that matches the filter.
     * @param {OneTimeTokenFindUniqueArgs} args - Arguments to find a OneTimeToken
     * @example
     * // Get one OneTimeToken
     * const oneTimeToken = await prisma.oneTimeToken.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OneTimeTokenFindUniqueArgs>(args: SelectSubset<T, OneTimeTokenFindUniqueArgs<ExtArgs>>): Prisma__OneTimeTokenClient<$Result.GetResult<Prisma.$OneTimeTokenPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one OneTimeToken that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OneTimeTokenFindUniqueOrThrowArgs} args - Arguments to find a OneTimeToken
     * @example
     * // Get one OneTimeToken
     * const oneTimeToken = await prisma.oneTimeToken.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OneTimeTokenFindUniqueOrThrowArgs>(args: SelectSubset<T, OneTimeTokenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OneTimeTokenClient<$Result.GetResult<Prisma.$OneTimeTokenPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OneTimeToken that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OneTimeTokenFindFirstArgs} args - Arguments to find a OneTimeToken
     * @example
     * // Get one OneTimeToken
     * const oneTimeToken = await prisma.oneTimeToken.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OneTimeTokenFindFirstArgs>(args?: SelectSubset<T, OneTimeTokenFindFirstArgs<ExtArgs>>): Prisma__OneTimeTokenClient<$Result.GetResult<Prisma.$OneTimeTokenPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OneTimeToken that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OneTimeTokenFindFirstOrThrowArgs} args - Arguments to find a OneTimeToken
     * @example
     * // Get one OneTimeToken
     * const oneTimeToken = await prisma.oneTimeToken.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OneTimeTokenFindFirstOrThrowArgs>(args?: SelectSubset<T, OneTimeTokenFindFirstOrThrowArgs<ExtArgs>>): Prisma__OneTimeTokenClient<$Result.GetResult<Prisma.$OneTimeTokenPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more OneTimeTokens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OneTimeTokenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all OneTimeTokens
     * const oneTimeTokens = await prisma.oneTimeToken.findMany()
     * 
     * // Get first 10 OneTimeTokens
     * const oneTimeTokens = await prisma.oneTimeToken.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const oneTimeTokenWithIdOnly = await prisma.oneTimeToken.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OneTimeTokenFindManyArgs>(args?: SelectSubset<T, OneTimeTokenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OneTimeTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a OneTimeToken.
     * @param {OneTimeTokenCreateArgs} args - Arguments to create a OneTimeToken.
     * @example
     * // Create one OneTimeToken
     * const OneTimeToken = await prisma.oneTimeToken.create({
     *   data: {
     *     // ... data to create a OneTimeToken
     *   }
     * })
     * 
     */
    create<T extends OneTimeTokenCreateArgs>(args: SelectSubset<T, OneTimeTokenCreateArgs<ExtArgs>>): Prisma__OneTimeTokenClient<$Result.GetResult<Prisma.$OneTimeTokenPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many OneTimeTokens.
     * @param {OneTimeTokenCreateManyArgs} args - Arguments to create many OneTimeTokens.
     * @example
     * // Create many OneTimeTokens
     * const oneTimeToken = await prisma.oneTimeToken.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OneTimeTokenCreateManyArgs>(args?: SelectSubset<T, OneTimeTokenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many OneTimeTokens and returns the data saved in the database.
     * @param {OneTimeTokenCreateManyAndReturnArgs} args - Arguments to create many OneTimeTokens.
     * @example
     * // Create many OneTimeTokens
     * const oneTimeToken = await prisma.oneTimeToken.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many OneTimeTokens and only return the `id`
     * const oneTimeTokenWithIdOnly = await prisma.oneTimeToken.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OneTimeTokenCreateManyAndReturnArgs>(args?: SelectSubset<T, OneTimeTokenCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OneTimeTokenPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a OneTimeToken.
     * @param {OneTimeTokenDeleteArgs} args - Arguments to delete one OneTimeToken.
     * @example
     * // Delete one OneTimeToken
     * const OneTimeToken = await prisma.oneTimeToken.delete({
     *   where: {
     *     // ... filter to delete one OneTimeToken
     *   }
     * })
     * 
     */
    delete<T extends OneTimeTokenDeleteArgs>(args: SelectSubset<T, OneTimeTokenDeleteArgs<ExtArgs>>): Prisma__OneTimeTokenClient<$Result.GetResult<Prisma.$OneTimeTokenPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one OneTimeToken.
     * @param {OneTimeTokenUpdateArgs} args - Arguments to update one OneTimeToken.
     * @example
     * // Update one OneTimeToken
     * const oneTimeToken = await prisma.oneTimeToken.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OneTimeTokenUpdateArgs>(args: SelectSubset<T, OneTimeTokenUpdateArgs<ExtArgs>>): Prisma__OneTimeTokenClient<$Result.GetResult<Prisma.$OneTimeTokenPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more OneTimeTokens.
     * @param {OneTimeTokenDeleteManyArgs} args - Arguments to filter OneTimeTokens to delete.
     * @example
     * // Delete a few OneTimeTokens
     * const { count } = await prisma.oneTimeToken.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OneTimeTokenDeleteManyArgs>(args?: SelectSubset<T, OneTimeTokenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OneTimeTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OneTimeTokenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many OneTimeTokens
     * const oneTimeToken = await prisma.oneTimeToken.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OneTimeTokenUpdateManyArgs>(args: SelectSubset<T, OneTimeTokenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OneTimeTokens and returns the data updated in the database.
     * @param {OneTimeTokenUpdateManyAndReturnArgs} args - Arguments to update many OneTimeTokens.
     * @example
     * // Update many OneTimeTokens
     * const oneTimeToken = await prisma.oneTimeToken.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more OneTimeTokens and only return the `id`
     * const oneTimeTokenWithIdOnly = await prisma.oneTimeToken.updateManyAndReturn({
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
    updateManyAndReturn<T extends OneTimeTokenUpdateManyAndReturnArgs>(args: SelectSubset<T, OneTimeTokenUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OneTimeTokenPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one OneTimeToken.
     * @param {OneTimeTokenUpsertArgs} args - Arguments to update or create a OneTimeToken.
     * @example
     * // Update or create a OneTimeToken
     * const oneTimeToken = await prisma.oneTimeToken.upsert({
     *   create: {
     *     // ... data to create a OneTimeToken
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the OneTimeToken we want to update
     *   }
     * })
     */
    upsert<T extends OneTimeTokenUpsertArgs>(args: SelectSubset<T, OneTimeTokenUpsertArgs<ExtArgs>>): Prisma__OneTimeTokenClient<$Result.GetResult<Prisma.$OneTimeTokenPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of OneTimeTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OneTimeTokenCountArgs} args - Arguments to filter OneTimeTokens to count.
     * @example
     * // Count the number of OneTimeTokens
     * const count = await prisma.oneTimeToken.count({
     *   where: {
     *     // ... the filter for the OneTimeTokens we want to count
     *   }
     * })
    **/
    count<T extends OneTimeTokenCountArgs>(
      args?: Subset<T, OneTimeTokenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OneTimeTokenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a OneTimeToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OneTimeTokenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends OneTimeTokenAggregateArgs>(args: Subset<T, OneTimeTokenAggregateArgs>): Prisma.PrismaPromise<GetOneTimeTokenAggregateType<T>>

    /**
     * Group by OneTimeToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OneTimeTokenGroupByArgs} args - Group by arguments.
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
      T extends OneTimeTokenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OneTimeTokenGroupByArgs['orderBy'] }
        : { orderBy?: OneTimeTokenGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, OneTimeTokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOneTimeTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the OneTimeToken model
   */
  readonly fields: OneTimeTokenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for OneTimeToken.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OneTimeTokenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the OneTimeToken model
   */
  interface OneTimeTokenFieldRefs {
    readonly id: FieldRef<"OneTimeToken", 'String'>
    readonly type: FieldRef<"OneTimeToken", 'OtpType'>
    readonly usage: FieldRef<"OneTimeToken", 'OtpUsage'>
    readonly identifier: FieldRef<"OneTimeToken", 'String'>
    readonly code: FieldRef<"OneTimeToken", 'String'>
    readonly expiredAt: FieldRef<"OneTimeToken", 'DateTime'>
    readonly consumed: FieldRef<"OneTimeToken", 'Boolean'>
    readonly attemptCount: FieldRef<"OneTimeToken", 'Int'>
    readonly createdAt: FieldRef<"OneTimeToken", 'DateTime'>
    readonly updatedAt: FieldRef<"OneTimeToken", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * OneTimeToken findUnique
   */
  export type OneTimeTokenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OneTimeToken
     */
    select?: OneTimeTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OneTimeToken
     */
    omit?: OneTimeTokenOmit<ExtArgs> | null
    /**
     * Filter, which OneTimeToken to fetch.
     */
    where: OneTimeTokenWhereUniqueInput
  }

  /**
   * OneTimeToken findUniqueOrThrow
   */
  export type OneTimeTokenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OneTimeToken
     */
    select?: OneTimeTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OneTimeToken
     */
    omit?: OneTimeTokenOmit<ExtArgs> | null
    /**
     * Filter, which OneTimeToken to fetch.
     */
    where: OneTimeTokenWhereUniqueInput
  }

  /**
   * OneTimeToken findFirst
   */
  export type OneTimeTokenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OneTimeToken
     */
    select?: OneTimeTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OneTimeToken
     */
    omit?: OneTimeTokenOmit<ExtArgs> | null
    /**
     * Filter, which OneTimeToken to fetch.
     */
    where?: OneTimeTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OneTimeTokens to fetch.
     */
    orderBy?: OneTimeTokenOrderByWithRelationInput | OneTimeTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OneTimeTokens.
     */
    cursor?: OneTimeTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OneTimeTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OneTimeTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OneTimeTokens.
     */
    distinct?: OneTimeTokenScalarFieldEnum | OneTimeTokenScalarFieldEnum[]
  }

  /**
   * OneTimeToken findFirstOrThrow
   */
  export type OneTimeTokenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OneTimeToken
     */
    select?: OneTimeTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OneTimeToken
     */
    omit?: OneTimeTokenOmit<ExtArgs> | null
    /**
     * Filter, which OneTimeToken to fetch.
     */
    where?: OneTimeTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OneTimeTokens to fetch.
     */
    orderBy?: OneTimeTokenOrderByWithRelationInput | OneTimeTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OneTimeTokens.
     */
    cursor?: OneTimeTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OneTimeTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OneTimeTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OneTimeTokens.
     */
    distinct?: OneTimeTokenScalarFieldEnum | OneTimeTokenScalarFieldEnum[]
  }

  /**
   * OneTimeToken findMany
   */
  export type OneTimeTokenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OneTimeToken
     */
    select?: OneTimeTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OneTimeToken
     */
    omit?: OneTimeTokenOmit<ExtArgs> | null
    /**
     * Filter, which OneTimeTokens to fetch.
     */
    where?: OneTimeTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OneTimeTokens to fetch.
     */
    orderBy?: OneTimeTokenOrderByWithRelationInput | OneTimeTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing OneTimeTokens.
     */
    cursor?: OneTimeTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OneTimeTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OneTimeTokens.
     */
    skip?: number
    distinct?: OneTimeTokenScalarFieldEnum | OneTimeTokenScalarFieldEnum[]
  }

  /**
   * OneTimeToken create
   */
  export type OneTimeTokenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OneTimeToken
     */
    select?: OneTimeTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OneTimeToken
     */
    omit?: OneTimeTokenOmit<ExtArgs> | null
    /**
     * The data needed to create a OneTimeToken.
     */
    data: XOR<OneTimeTokenCreateInput, OneTimeTokenUncheckedCreateInput>
  }

  /**
   * OneTimeToken createMany
   */
  export type OneTimeTokenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many OneTimeTokens.
     */
    data: OneTimeTokenCreateManyInput | OneTimeTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OneTimeToken createManyAndReturn
   */
  export type OneTimeTokenCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OneTimeToken
     */
    select?: OneTimeTokenSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the OneTimeToken
     */
    omit?: OneTimeTokenOmit<ExtArgs> | null
    /**
     * The data used to create many OneTimeTokens.
     */
    data: OneTimeTokenCreateManyInput | OneTimeTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OneTimeToken update
   */
  export type OneTimeTokenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OneTimeToken
     */
    select?: OneTimeTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OneTimeToken
     */
    omit?: OneTimeTokenOmit<ExtArgs> | null
    /**
     * The data needed to update a OneTimeToken.
     */
    data: XOR<OneTimeTokenUpdateInput, OneTimeTokenUncheckedUpdateInput>
    /**
     * Choose, which OneTimeToken to update.
     */
    where: OneTimeTokenWhereUniqueInput
  }

  /**
   * OneTimeToken updateMany
   */
  export type OneTimeTokenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update OneTimeTokens.
     */
    data: XOR<OneTimeTokenUpdateManyMutationInput, OneTimeTokenUncheckedUpdateManyInput>
    /**
     * Filter which OneTimeTokens to update
     */
    where?: OneTimeTokenWhereInput
    /**
     * Limit how many OneTimeTokens to update.
     */
    limit?: number
  }

  /**
   * OneTimeToken updateManyAndReturn
   */
  export type OneTimeTokenUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OneTimeToken
     */
    select?: OneTimeTokenSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the OneTimeToken
     */
    omit?: OneTimeTokenOmit<ExtArgs> | null
    /**
     * The data used to update OneTimeTokens.
     */
    data: XOR<OneTimeTokenUpdateManyMutationInput, OneTimeTokenUncheckedUpdateManyInput>
    /**
     * Filter which OneTimeTokens to update
     */
    where?: OneTimeTokenWhereInput
    /**
     * Limit how many OneTimeTokens to update.
     */
    limit?: number
  }

  /**
   * OneTimeToken upsert
   */
  export type OneTimeTokenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OneTimeToken
     */
    select?: OneTimeTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OneTimeToken
     */
    omit?: OneTimeTokenOmit<ExtArgs> | null
    /**
     * The filter to search for the OneTimeToken to update in case it exists.
     */
    where: OneTimeTokenWhereUniqueInput
    /**
     * In case the OneTimeToken found by the `where` argument doesn't exist, create a new OneTimeToken with this data.
     */
    create: XOR<OneTimeTokenCreateInput, OneTimeTokenUncheckedCreateInput>
    /**
     * In case the OneTimeToken was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OneTimeTokenUpdateInput, OneTimeTokenUncheckedUpdateInput>
  }

  /**
   * OneTimeToken delete
   */
  export type OneTimeTokenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OneTimeToken
     */
    select?: OneTimeTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OneTimeToken
     */
    omit?: OneTimeTokenOmit<ExtArgs> | null
    /**
     * Filter which OneTimeToken to delete.
     */
    where: OneTimeTokenWhereUniqueInput
  }

  /**
   * OneTimeToken deleteMany
   */
  export type OneTimeTokenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OneTimeTokens to delete
     */
    where?: OneTimeTokenWhereInput
    /**
     * Limit how many OneTimeTokens to delete.
     */
    limit?: number
  }

  /**
   * OneTimeToken without action
   */
  export type OneTimeTokenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OneTimeToken
     */
    select?: OneTimeTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OneTimeToken
     */
    omit?: OneTimeTokenOmit<ExtArgs> | null
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


  export const LoginMethodScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    type: 'type',
    identifier: 'identifier',
    verified: 'verified',
    enabled: 'enabled',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LoginMethodScalarFieldEnum = (typeof LoginMethodScalarFieldEnum)[keyof typeof LoginMethodScalarFieldEnum]


  export const CredentialScalarFieldEnum: {
    id: 'id',
    loginMethodId: 'loginMethodId',
    secretType: 'secretType',
    secretValue: 'secretValue',
    provider: 'provider',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CredentialScalarFieldEnum = (typeof CredentialScalarFieldEnum)[keyof typeof CredentialScalarFieldEnum]


  export const OneTimeTokenScalarFieldEnum: {
    id: 'id',
    type: 'type',
    usage: 'usage',
    identifier: 'identifier',
    code: 'code',
    expiredAt: 'expiredAt',
    consumed: 'consumed',
    attemptCount: 'attemptCount',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type OneTimeTokenScalarFieldEnum = (typeof OneTimeTokenScalarFieldEnum)[keyof typeof OneTimeTokenScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


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
   * Reference to a field of type 'LoginMethodType'
   */
  export type EnumLoginMethodTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LoginMethodType'>
    


  /**
   * Reference to a field of type 'LoginMethodType[]'
   */
  export type ListEnumLoginMethodTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LoginMethodType[]'>
    


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
   * Reference to a field of type 'CredentialType'
   */
  export type EnumCredentialTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CredentialType'>
    


  /**
   * Reference to a field of type 'CredentialType[]'
   */
  export type ListEnumCredentialTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CredentialType[]'>
    


  /**
   * Reference to a field of type 'OtpType'
   */
  export type EnumOtpTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'OtpType'>
    


  /**
   * Reference to a field of type 'OtpType[]'
   */
  export type ListEnumOtpTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'OtpType[]'>
    


  /**
   * Reference to a field of type 'OtpUsage'
   */
  export type EnumOtpUsageFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'OtpUsage'>
    


  /**
   * Reference to a field of type 'OtpUsage[]'
   */
  export type ListEnumOtpUsageFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'OtpUsage[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


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


  export type LoginMethodWhereInput = {
    AND?: LoginMethodWhereInput | LoginMethodWhereInput[]
    OR?: LoginMethodWhereInput[]
    NOT?: LoginMethodWhereInput | LoginMethodWhereInput[]
    id?: StringFilter<"LoginMethod"> | string
    userId?: StringFilter<"LoginMethod"> | string
    type?: EnumLoginMethodTypeFilter<"LoginMethod"> | $Enums.LoginMethodType
    identifier?: StringFilter<"LoginMethod"> | string
    verified?: BoolFilter<"LoginMethod"> | boolean
    enabled?: BoolFilter<"LoginMethod"> | boolean
    createdAt?: DateTimeFilter<"LoginMethod"> | Date | string
    updatedAt?: DateTimeFilter<"LoginMethod"> | Date | string
    credentials?: CredentialListRelationFilter
  }

  export type LoginMethodOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    identifier?: SortOrder
    verified?: SortOrder
    enabled?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    credentials?: CredentialOrderByRelationAggregateInput
  }

  export type LoginMethodWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    type_identifier?: LoginMethodTypeIdentifierCompoundUniqueInput
    AND?: LoginMethodWhereInput | LoginMethodWhereInput[]
    OR?: LoginMethodWhereInput[]
    NOT?: LoginMethodWhereInput | LoginMethodWhereInput[]
    userId?: StringFilter<"LoginMethod"> | string
    type?: EnumLoginMethodTypeFilter<"LoginMethod"> | $Enums.LoginMethodType
    identifier?: StringFilter<"LoginMethod"> | string
    verified?: BoolFilter<"LoginMethod"> | boolean
    enabled?: BoolFilter<"LoginMethod"> | boolean
    createdAt?: DateTimeFilter<"LoginMethod"> | Date | string
    updatedAt?: DateTimeFilter<"LoginMethod"> | Date | string
    credentials?: CredentialListRelationFilter
  }, "id" | "type_identifier">

  export type LoginMethodOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    identifier?: SortOrder
    verified?: SortOrder
    enabled?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LoginMethodCountOrderByAggregateInput
    _max?: LoginMethodMaxOrderByAggregateInput
    _min?: LoginMethodMinOrderByAggregateInput
  }

  export type LoginMethodScalarWhereWithAggregatesInput = {
    AND?: LoginMethodScalarWhereWithAggregatesInput | LoginMethodScalarWhereWithAggregatesInput[]
    OR?: LoginMethodScalarWhereWithAggregatesInput[]
    NOT?: LoginMethodScalarWhereWithAggregatesInput | LoginMethodScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"LoginMethod"> | string
    userId?: StringWithAggregatesFilter<"LoginMethod"> | string
    type?: EnumLoginMethodTypeWithAggregatesFilter<"LoginMethod"> | $Enums.LoginMethodType
    identifier?: StringWithAggregatesFilter<"LoginMethod"> | string
    verified?: BoolWithAggregatesFilter<"LoginMethod"> | boolean
    enabled?: BoolWithAggregatesFilter<"LoginMethod"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"LoginMethod"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"LoginMethod"> | Date | string
  }

  export type CredentialWhereInput = {
    AND?: CredentialWhereInput | CredentialWhereInput[]
    OR?: CredentialWhereInput[]
    NOT?: CredentialWhereInput | CredentialWhereInput[]
    id?: StringFilter<"Credential"> | string
    loginMethodId?: StringFilter<"Credential"> | string
    secretType?: EnumCredentialTypeFilter<"Credential"> | $Enums.CredentialType
    secretValue?: StringNullableFilter<"Credential"> | string | null
    provider?: StringNullableFilter<"Credential"> | string | null
    createdAt?: DateTimeFilter<"Credential"> | Date | string
    updatedAt?: DateTimeFilter<"Credential"> | Date | string
    LoginMethods?: XOR<LoginMethodScalarRelationFilter, LoginMethodWhereInput>
  }

  export type CredentialOrderByWithRelationInput = {
    id?: SortOrder
    loginMethodId?: SortOrder
    secretType?: SortOrder
    secretValue?: SortOrderInput | SortOrder
    provider?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    LoginMethods?: LoginMethodOrderByWithRelationInput
  }

  export type CredentialWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CredentialWhereInput | CredentialWhereInput[]
    OR?: CredentialWhereInput[]
    NOT?: CredentialWhereInput | CredentialWhereInput[]
    loginMethodId?: StringFilter<"Credential"> | string
    secretType?: EnumCredentialTypeFilter<"Credential"> | $Enums.CredentialType
    secretValue?: StringNullableFilter<"Credential"> | string | null
    provider?: StringNullableFilter<"Credential"> | string | null
    createdAt?: DateTimeFilter<"Credential"> | Date | string
    updatedAt?: DateTimeFilter<"Credential"> | Date | string
    LoginMethods?: XOR<LoginMethodScalarRelationFilter, LoginMethodWhereInput>
  }, "id">

  export type CredentialOrderByWithAggregationInput = {
    id?: SortOrder
    loginMethodId?: SortOrder
    secretType?: SortOrder
    secretValue?: SortOrderInput | SortOrder
    provider?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CredentialCountOrderByAggregateInput
    _max?: CredentialMaxOrderByAggregateInput
    _min?: CredentialMinOrderByAggregateInput
  }

  export type CredentialScalarWhereWithAggregatesInput = {
    AND?: CredentialScalarWhereWithAggregatesInput | CredentialScalarWhereWithAggregatesInput[]
    OR?: CredentialScalarWhereWithAggregatesInput[]
    NOT?: CredentialScalarWhereWithAggregatesInput | CredentialScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Credential"> | string
    loginMethodId?: StringWithAggregatesFilter<"Credential"> | string
    secretType?: EnumCredentialTypeWithAggregatesFilter<"Credential"> | $Enums.CredentialType
    secretValue?: StringNullableWithAggregatesFilter<"Credential"> | string | null
    provider?: StringNullableWithAggregatesFilter<"Credential"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Credential"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Credential"> | Date | string
  }

  export type OneTimeTokenWhereInput = {
    AND?: OneTimeTokenWhereInput | OneTimeTokenWhereInput[]
    OR?: OneTimeTokenWhereInput[]
    NOT?: OneTimeTokenWhereInput | OneTimeTokenWhereInput[]
    id?: StringFilter<"OneTimeToken"> | string
    type?: EnumOtpTypeFilter<"OneTimeToken"> | $Enums.OtpType
    usage?: EnumOtpUsageFilter<"OneTimeToken"> | $Enums.OtpUsage
    identifier?: StringFilter<"OneTimeToken"> | string
    code?: StringFilter<"OneTimeToken"> | string
    expiredAt?: DateTimeFilter<"OneTimeToken"> | Date | string
    consumed?: BoolFilter<"OneTimeToken"> | boolean
    attemptCount?: IntFilter<"OneTimeToken"> | number
    createdAt?: DateTimeFilter<"OneTimeToken"> | Date | string
    updatedAt?: DateTimeFilter<"OneTimeToken"> | Date | string
  }

  export type OneTimeTokenOrderByWithRelationInput = {
    id?: SortOrder
    type?: SortOrder
    usage?: SortOrder
    identifier?: SortOrder
    code?: SortOrder
    expiredAt?: SortOrder
    consumed?: SortOrder
    attemptCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OneTimeTokenWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    identifier_usage?: OneTimeTokenIdentifierUsageCompoundUniqueInput
    AND?: OneTimeTokenWhereInput | OneTimeTokenWhereInput[]
    OR?: OneTimeTokenWhereInput[]
    NOT?: OneTimeTokenWhereInput | OneTimeTokenWhereInput[]
    type?: EnumOtpTypeFilter<"OneTimeToken"> | $Enums.OtpType
    usage?: EnumOtpUsageFilter<"OneTimeToken"> | $Enums.OtpUsage
    identifier?: StringFilter<"OneTimeToken"> | string
    code?: StringFilter<"OneTimeToken"> | string
    expiredAt?: DateTimeFilter<"OneTimeToken"> | Date | string
    consumed?: BoolFilter<"OneTimeToken"> | boolean
    attemptCount?: IntFilter<"OneTimeToken"> | number
    createdAt?: DateTimeFilter<"OneTimeToken"> | Date | string
    updatedAt?: DateTimeFilter<"OneTimeToken"> | Date | string
  }, "id" | "identifier_usage">

  export type OneTimeTokenOrderByWithAggregationInput = {
    id?: SortOrder
    type?: SortOrder
    usage?: SortOrder
    identifier?: SortOrder
    code?: SortOrder
    expiredAt?: SortOrder
    consumed?: SortOrder
    attemptCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: OneTimeTokenCountOrderByAggregateInput
    _avg?: OneTimeTokenAvgOrderByAggregateInput
    _max?: OneTimeTokenMaxOrderByAggregateInput
    _min?: OneTimeTokenMinOrderByAggregateInput
    _sum?: OneTimeTokenSumOrderByAggregateInput
  }

  export type OneTimeTokenScalarWhereWithAggregatesInput = {
    AND?: OneTimeTokenScalarWhereWithAggregatesInput | OneTimeTokenScalarWhereWithAggregatesInput[]
    OR?: OneTimeTokenScalarWhereWithAggregatesInput[]
    NOT?: OneTimeTokenScalarWhereWithAggregatesInput | OneTimeTokenScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"OneTimeToken"> | string
    type?: EnumOtpTypeWithAggregatesFilter<"OneTimeToken"> | $Enums.OtpType
    usage?: EnumOtpUsageWithAggregatesFilter<"OneTimeToken"> | $Enums.OtpUsage
    identifier?: StringWithAggregatesFilter<"OneTimeToken"> | string
    code?: StringWithAggregatesFilter<"OneTimeToken"> | string
    expiredAt?: DateTimeWithAggregatesFilter<"OneTimeToken"> | Date | string
    consumed?: BoolWithAggregatesFilter<"OneTimeToken"> | boolean
    attemptCount?: IntWithAggregatesFilter<"OneTimeToken"> | number
    createdAt?: DateTimeWithAggregatesFilter<"OneTimeToken"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"OneTimeToken"> | Date | string
  }

  export type LoginMethodCreateInput = {
    id?: string
    userId: string
    type: $Enums.LoginMethodType
    identifier: string
    verified?: boolean
    enabled?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    credentials?: CredentialCreateNestedManyWithoutLoginMethodsInput
  }

  export type LoginMethodUncheckedCreateInput = {
    id?: string
    userId: string
    type: $Enums.LoginMethodType
    identifier: string
    verified?: boolean
    enabled?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    credentials?: CredentialUncheckedCreateNestedManyWithoutLoginMethodsInput
  }

  export type LoginMethodUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumLoginMethodTypeFieldUpdateOperationsInput | $Enums.LoginMethodType
    identifier?: StringFieldUpdateOperationsInput | string
    verified?: BoolFieldUpdateOperationsInput | boolean
    enabled?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credentials?: CredentialUpdateManyWithoutLoginMethodsNestedInput
  }

  export type LoginMethodUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumLoginMethodTypeFieldUpdateOperationsInput | $Enums.LoginMethodType
    identifier?: StringFieldUpdateOperationsInput | string
    verified?: BoolFieldUpdateOperationsInput | boolean
    enabled?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    credentials?: CredentialUncheckedUpdateManyWithoutLoginMethodsNestedInput
  }

  export type LoginMethodCreateManyInput = {
    id?: string
    userId: string
    type: $Enums.LoginMethodType
    identifier: string
    verified?: boolean
    enabled?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LoginMethodUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumLoginMethodTypeFieldUpdateOperationsInput | $Enums.LoginMethodType
    identifier?: StringFieldUpdateOperationsInput | string
    verified?: BoolFieldUpdateOperationsInput | boolean
    enabled?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoginMethodUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumLoginMethodTypeFieldUpdateOperationsInput | $Enums.LoginMethodType
    identifier?: StringFieldUpdateOperationsInput | string
    verified?: BoolFieldUpdateOperationsInput | boolean
    enabled?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CredentialCreateInput = {
    id?: string
    secretType: $Enums.CredentialType
    secretValue?: string | null
    provider?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    LoginMethods: LoginMethodCreateNestedOneWithoutCredentialsInput
  }

  export type CredentialUncheckedCreateInput = {
    id?: string
    loginMethodId: string
    secretType: $Enums.CredentialType
    secretValue?: string | null
    provider?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CredentialUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    secretType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    secretValue?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    LoginMethods?: LoginMethodUpdateOneRequiredWithoutCredentialsNestedInput
  }

  export type CredentialUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    loginMethodId?: StringFieldUpdateOperationsInput | string
    secretType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    secretValue?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CredentialCreateManyInput = {
    id?: string
    loginMethodId: string
    secretType: $Enums.CredentialType
    secretValue?: string | null
    provider?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CredentialUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    secretType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    secretValue?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CredentialUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    loginMethodId?: StringFieldUpdateOperationsInput | string
    secretType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    secretValue?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OneTimeTokenCreateInput = {
    id?: string
    type: $Enums.OtpType
    usage: $Enums.OtpUsage
    identifier: string
    code: string
    expiredAt: Date | string
    consumed?: boolean
    attemptCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OneTimeTokenUncheckedCreateInput = {
    id?: string
    type: $Enums.OtpType
    usage: $Enums.OtpUsage
    identifier: string
    code: string
    expiredAt: Date | string
    consumed?: boolean
    attemptCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OneTimeTokenUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumOtpTypeFieldUpdateOperationsInput | $Enums.OtpType
    usage?: EnumOtpUsageFieldUpdateOperationsInput | $Enums.OtpUsage
    identifier?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    expiredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    consumed?: BoolFieldUpdateOperationsInput | boolean
    attemptCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OneTimeTokenUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumOtpTypeFieldUpdateOperationsInput | $Enums.OtpType
    usage?: EnumOtpUsageFieldUpdateOperationsInput | $Enums.OtpUsage
    identifier?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    expiredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    consumed?: BoolFieldUpdateOperationsInput | boolean
    attemptCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OneTimeTokenCreateManyInput = {
    id?: string
    type: $Enums.OtpType
    usage: $Enums.OtpUsage
    identifier: string
    code: string
    expiredAt: Date | string
    consumed?: boolean
    attemptCount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type OneTimeTokenUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumOtpTypeFieldUpdateOperationsInput | $Enums.OtpType
    usage?: EnumOtpUsageFieldUpdateOperationsInput | $Enums.OtpUsage
    identifier?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    expiredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    consumed?: BoolFieldUpdateOperationsInput | boolean
    attemptCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OneTimeTokenUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumOtpTypeFieldUpdateOperationsInput | $Enums.OtpType
    usage?: EnumOtpUsageFieldUpdateOperationsInput | $Enums.OtpUsage
    identifier?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    expiredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    consumed?: BoolFieldUpdateOperationsInput | boolean
    attemptCount?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
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

  export type EnumLoginMethodTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.LoginMethodType | EnumLoginMethodTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LoginMethodType[] | ListEnumLoginMethodTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LoginMethodType[] | ListEnumLoginMethodTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLoginMethodTypeFilter<$PrismaModel> | $Enums.LoginMethodType
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

  export type CredentialListRelationFilter = {
    every?: CredentialWhereInput
    some?: CredentialWhereInput
    none?: CredentialWhereInput
  }

  export type CredentialOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LoginMethodTypeIdentifierCompoundUniqueInput = {
    type: $Enums.LoginMethodType
    identifier: string
  }

  export type LoginMethodCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    identifier?: SortOrder
    verified?: SortOrder
    enabled?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LoginMethodMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    identifier?: SortOrder
    verified?: SortOrder
    enabled?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LoginMethodMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    identifier?: SortOrder
    verified?: SortOrder
    enabled?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
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

  export type EnumLoginMethodTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LoginMethodType | EnumLoginMethodTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LoginMethodType[] | ListEnumLoginMethodTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LoginMethodType[] | ListEnumLoginMethodTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLoginMethodTypeWithAggregatesFilter<$PrismaModel> | $Enums.LoginMethodType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLoginMethodTypeFilter<$PrismaModel>
    _max?: NestedEnumLoginMethodTypeFilter<$PrismaModel>
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

  export type EnumCredentialTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.CredentialType | EnumCredentialTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCredentialTypeFilter<$PrismaModel> | $Enums.CredentialType
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

  export type LoginMethodScalarRelationFilter = {
    is?: LoginMethodWhereInput
    isNot?: LoginMethodWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CredentialCountOrderByAggregateInput = {
    id?: SortOrder
    loginMethodId?: SortOrder
    secretType?: SortOrder
    secretValue?: SortOrder
    provider?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CredentialMaxOrderByAggregateInput = {
    id?: SortOrder
    loginMethodId?: SortOrder
    secretType?: SortOrder
    secretValue?: SortOrder
    provider?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CredentialMinOrderByAggregateInput = {
    id?: SortOrder
    loginMethodId?: SortOrder
    secretType?: SortOrder
    secretValue?: SortOrder
    provider?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumCredentialTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CredentialType | EnumCredentialTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCredentialTypeWithAggregatesFilter<$PrismaModel> | $Enums.CredentialType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCredentialTypeFilter<$PrismaModel>
    _max?: NestedEnumCredentialTypeFilter<$PrismaModel>
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

  export type EnumOtpTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.OtpType | EnumOtpTypeFieldRefInput<$PrismaModel>
    in?: $Enums.OtpType[] | ListEnumOtpTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.OtpType[] | ListEnumOtpTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumOtpTypeFilter<$PrismaModel> | $Enums.OtpType
  }

  export type EnumOtpUsageFilter<$PrismaModel = never> = {
    equals?: $Enums.OtpUsage | EnumOtpUsageFieldRefInput<$PrismaModel>
    in?: $Enums.OtpUsage[] | ListEnumOtpUsageFieldRefInput<$PrismaModel>
    notIn?: $Enums.OtpUsage[] | ListEnumOtpUsageFieldRefInput<$PrismaModel>
    not?: NestedEnumOtpUsageFilter<$PrismaModel> | $Enums.OtpUsage
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

  export type OneTimeTokenIdentifierUsageCompoundUniqueInput = {
    identifier: string
    usage: $Enums.OtpUsage
  }

  export type OneTimeTokenCountOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    usage?: SortOrder
    identifier?: SortOrder
    code?: SortOrder
    expiredAt?: SortOrder
    consumed?: SortOrder
    attemptCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OneTimeTokenAvgOrderByAggregateInput = {
    attemptCount?: SortOrder
  }

  export type OneTimeTokenMaxOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    usage?: SortOrder
    identifier?: SortOrder
    code?: SortOrder
    expiredAt?: SortOrder
    consumed?: SortOrder
    attemptCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OneTimeTokenMinOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    usage?: SortOrder
    identifier?: SortOrder
    code?: SortOrder
    expiredAt?: SortOrder
    consumed?: SortOrder
    attemptCount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type OneTimeTokenSumOrderByAggregateInput = {
    attemptCount?: SortOrder
  }

  export type EnumOtpTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OtpType | EnumOtpTypeFieldRefInput<$PrismaModel>
    in?: $Enums.OtpType[] | ListEnumOtpTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.OtpType[] | ListEnumOtpTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumOtpTypeWithAggregatesFilter<$PrismaModel> | $Enums.OtpType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumOtpTypeFilter<$PrismaModel>
    _max?: NestedEnumOtpTypeFilter<$PrismaModel>
  }

  export type EnumOtpUsageWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OtpUsage | EnumOtpUsageFieldRefInput<$PrismaModel>
    in?: $Enums.OtpUsage[] | ListEnumOtpUsageFieldRefInput<$PrismaModel>
    notIn?: $Enums.OtpUsage[] | ListEnumOtpUsageFieldRefInput<$PrismaModel>
    not?: NestedEnumOtpUsageWithAggregatesFilter<$PrismaModel> | $Enums.OtpUsage
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumOtpUsageFilter<$PrismaModel>
    _max?: NestedEnumOtpUsageFilter<$PrismaModel>
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

  export type CredentialCreateNestedManyWithoutLoginMethodsInput = {
    create?: XOR<CredentialCreateWithoutLoginMethodsInput, CredentialUncheckedCreateWithoutLoginMethodsInput> | CredentialCreateWithoutLoginMethodsInput[] | CredentialUncheckedCreateWithoutLoginMethodsInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutLoginMethodsInput | CredentialCreateOrConnectWithoutLoginMethodsInput[]
    createMany?: CredentialCreateManyLoginMethodsInputEnvelope
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
  }

  export type CredentialUncheckedCreateNestedManyWithoutLoginMethodsInput = {
    create?: XOR<CredentialCreateWithoutLoginMethodsInput, CredentialUncheckedCreateWithoutLoginMethodsInput> | CredentialCreateWithoutLoginMethodsInput[] | CredentialUncheckedCreateWithoutLoginMethodsInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutLoginMethodsInput | CredentialCreateOrConnectWithoutLoginMethodsInput[]
    createMany?: CredentialCreateManyLoginMethodsInputEnvelope
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumLoginMethodTypeFieldUpdateOperationsInput = {
    set?: $Enums.LoginMethodType
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type CredentialUpdateManyWithoutLoginMethodsNestedInput = {
    create?: XOR<CredentialCreateWithoutLoginMethodsInput, CredentialUncheckedCreateWithoutLoginMethodsInput> | CredentialCreateWithoutLoginMethodsInput[] | CredentialUncheckedCreateWithoutLoginMethodsInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutLoginMethodsInput | CredentialCreateOrConnectWithoutLoginMethodsInput[]
    upsert?: CredentialUpsertWithWhereUniqueWithoutLoginMethodsInput | CredentialUpsertWithWhereUniqueWithoutLoginMethodsInput[]
    createMany?: CredentialCreateManyLoginMethodsInputEnvelope
    set?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    disconnect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    delete?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    update?: CredentialUpdateWithWhereUniqueWithoutLoginMethodsInput | CredentialUpdateWithWhereUniqueWithoutLoginMethodsInput[]
    updateMany?: CredentialUpdateManyWithWhereWithoutLoginMethodsInput | CredentialUpdateManyWithWhereWithoutLoginMethodsInput[]
    deleteMany?: CredentialScalarWhereInput | CredentialScalarWhereInput[]
  }

  export type CredentialUncheckedUpdateManyWithoutLoginMethodsNestedInput = {
    create?: XOR<CredentialCreateWithoutLoginMethodsInput, CredentialUncheckedCreateWithoutLoginMethodsInput> | CredentialCreateWithoutLoginMethodsInput[] | CredentialUncheckedCreateWithoutLoginMethodsInput[]
    connectOrCreate?: CredentialCreateOrConnectWithoutLoginMethodsInput | CredentialCreateOrConnectWithoutLoginMethodsInput[]
    upsert?: CredentialUpsertWithWhereUniqueWithoutLoginMethodsInput | CredentialUpsertWithWhereUniqueWithoutLoginMethodsInput[]
    createMany?: CredentialCreateManyLoginMethodsInputEnvelope
    set?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    disconnect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    delete?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    connect?: CredentialWhereUniqueInput | CredentialWhereUniqueInput[]
    update?: CredentialUpdateWithWhereUniqueWithoutLoginMethodsInput | CredentialUpdateWithWhereUniqueWithoutLoginMethodsInput[]
    updateMany?: CredentialUpdateManyWithWhereWithoutLoginMethodsInput | CredentialUpdateManyWithWhereWithoutLoginMethodsInput[]
    deleteMany?: CredentialScalarWhereInput | CredentialScalarWhereInput[]
  }

  export type LoginMethodCreateNestedOneWithoutCredentialsInput = {
    create?: XOR<LoginMethodCreateWithoutCredentialsInput, LoginMethodUncheckedCreateWithoutCredentialsInput>
    connectOrCreate?: LoginMethodCreateOrConnectWithoutCredentialsInput
    connect?: LoginMethodWhereUniqueInput
  }

  export type EnumCredentialTypeFieldUpdateOperationsInput = {
    set?: $Enums.CredentialType
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type LoginMethodUpdateOneRequiredWithoutCredentialsNestedInput = {
    create?: XOR<LoginMethodCreateWithoutCredentialsInput, LoginMethodUncheckedCreateWithoutCredentialsInput>
    connectOrCreate?: LoginMethodCreateOrConnectWithoutCredentialsInput
    upsert?: LoginMethodUpsertWithoutCredentialsInput
    connect?: LoginMethodWhereUniqueInput
    update?: XOR<XOR<LoginMethodUpdateToOneWithWhereWithoutCredentialsInput, LoginMethodUpdateWithoutCredentialsInput>, LoginMethodUncheckedUpdateWithoutCredentialsInput>
  }

  export type EnumOtpTypeFieldUpdateOperationsInput = {
    set?: $Enums.OtpType
  }

  export type EnumOtpUsageFieldUpdateOperationsInput = {
    set?: $Enums.OtpUsage
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
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

  export type NestedEnumLoginMethodTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.LoginMethodType | EnumLoginMethodTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LoginMethodType[] | ListEnumLoginMethodTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LoginMethodType[] | ListEnumLoginMethodTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLoginMethodTypeFilter<$PrismaModel> | $Enums.LoginMethodType
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

  export type NestedEnumLoginMethodTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LoginMethodType | EnumLoginMethodTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LoginMethodType[] | ListEnumLoginMethodTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LoginMethodType[] | ListEnumLoginMethodTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLoginMethodTypeWithAggregatesFilter<$PrismaModel> | $Enums.LoginMethodType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLoginMethodTypeFilter<$PrismaModel>
    _max?: NestedEnumLoginMethodTypeFilter<$PrismaModel>
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

  export type NestedEnumCredentialTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.CredentialType | EnumCredentialTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCredentialTypeFilter<$PrismaModel> | $Enums.CredentialType
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

  export type NestedEnumCredentialTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CredentialType | EnumCredentialTypeFieldRefInput<$PrismaModel>
    in?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.CredentialType[] | ListEnumCredentialTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumCredentialTypeWithAggregatesFilter<$PrismaModel> | $Enums.CredentialType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCredentialTypeFilter<$PrismaModel>
    _max?: NestedEnumCredentialTypeFilter<$PrismaModel>
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

  export type NestedEnumOtpTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.OtpType | EnumOtpTypeFieldRefInput<$PrismaModel>
    in?: $Enums.OtpType[] | ListEnumOtpTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.OtpType[] | ListEnumOtpTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumOtpTypeFilter<$PrismaModel> | $Enums.OtpType
  }

  export type NestedEnumOtpUsageFilter<$PrismaModel = never> = {
    equals?: $Enums.OtpUsage | EnumOtpUsageFieldRefInput<$PrismaModel>
    in?: $Enums.OtpUsage[] | ListEnumOtpUsageFieldRefInput<$PrismaModel>
    notIn?: $Enums.OtpUsage[] | ListEnumOtpUsageFieldRefInput<$PrismaModel>
    not?: NestedEnumOtpUsageFilter<$PrismaModel> | $Enums.OtpUsage
  }

  export type NestedEnumOtpTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OtpType | EnumOtpTypeFieldRefInput<$PrismaModel>
    in?: $Enums.OtpType[] | ListEnumOtpTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.OtpType[] | ListEnumOtpTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumOtpTypeWithAggregatesFilter<$PrismaModel> | $Enums.OtpType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumOtpTypeFilter<$PrismaModel>
    _max?: NestedEnumOtpTypeFilter<$PrismaModel>
  }

  export type NestedEnumOtpUsageWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.OtpUsage | EnumOtpUsageFieldRefInput<$PrismaModel>
    in?: $Enums.OtpUsage[] | ListEnumOtpUsageFieldRefInput<$PrismaModel>
    notIn?: $Enums.OtpUsage[] | ListEnumOtpUsageFieldRefInput<$PrismaModel>
    not?: NestedEnumOtpUsageWithAggregatesFilter<$PrismaModel> | $Enums.OtpUsage
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumOtpUsageFilter<$PrismaModel>
    _max?: NestedEnumOtpUsageFilter<$PrismaModel>
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

  export type CredentialCreateWithoutLoginMethodsInput = {
    id?: string
    secretType: $Enums.CredentialType
    secretValue?: string | null
    provider?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CredentialUncheckedCreateWithoutLoginMethodsInput = {
    id?: string
    secretType: $Enums.CredentialType
    secretValue?: string | null
    provider?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CredentialCreateOrConnectWithoutLoginMethodsInput = {
    where: CredentialWhereUniqueInput
    create: XOR<CredentialCreateWithoutLoginMethodsInput, CredentialUncheckedCreateWithoutLoginMethodsInput>
  }

  export type CredentialCreateManyLoginMethodsInputEnvelope = {
    data: CredentialCreateManyLoginMethodsInput | CredentialCreateManyLoginMethodsInput[]
    skipDuplicates?: boolean
  }

  export type CredentialUpsertWithWhereUniqueWithoutLoginMethodsInput = {
    where: CredentialWhereUniqueInput
    update: XOR<CredentialUpdateWithoutLoginMethodsInput, CredentialUncheckedUpdateWithoutLoginMethodsInput>
    create: XOR<CredentialCreateWithoutLoginMethodsInput, CredentialUncheckedCreateWithoutLoginMethodsInput>
  }

  export type CredentialUpdateWithWhereUniqueWithoutLoginMethodsInput = {
    where: CredentialWhereUniqueInput
    data: XOR<CredentialUpdateWithoutLoginMethodsInput, CredentialUncheckedUpdateWithoutLoginMethodsInput>
  }

  export type CredentialUpdateManyWithWhereWithoutLoginMethodsInput = {
    where: CredentialScalarWhereInput
    data: XOR<CredentialUpdateManyMutationInput, CredentialUncheckedUpdateManyWithoutLoginMethodsInput>
  }

  export type CredentialScalarWhereInput = {
    AND?: CredentialScalarWhereInput | CredentialScalarWhereInput[]
    OR?: CredentialScalarWhereInput[]
    NOT?: CredentialScalarWhereInput | CredentialScalarWhereInput[]
    id?: StringFilter<"Credential"> | string
    loginMethodId?: StringFilter<"Credential"> | string
    secretType?: EnumCredentialTypeFilter<"Credential"> | $Enums.CredentialType
    secretValue?: StringNullableFilter<"Credential"> | string | null
    provider?: StringNullableFilter<"Credential"> | string | null
    createdAt?: DateTimeFilter<"Credential"> | Date | string
    updatedAt?: DateTimeFilter<"Credential"> | Date | string
  }

  export type LoginMethodCreateWithoutCredentialsInput = {
    id?: string
    userId: string
    type: $Enums.LoginMethodType
    identifier: string
    verified?: boolean
    enabled?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LoginMethodUncheckedCreateWithoutCredentialsInput = {
    id?: string
    userId: string
    type: $Enums.LoginMethodType
    identifier: string
    verified?: boolean
    enabled?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LoginMethodCreateOrConnectWithoutCredentialsInput = {
    where: LoginMethodWhereUniqueInput
    create: XOR<LoginMethodCreateWithoutCredentialsInput, LoginMethodUncheckedCreateWithoutCredentialsInput>
  }

  export type LoginMethodUpsertWithoutCredentialsInput = {
    update: XOR<LoginMethodUpdateWithoutCredentialsInput, LoginMethodUncheckedUpdateWithoutCredentialsInput>
    create: XOR<LoginMethodCreateWithoutCredentialsInput, LoginMethodUncheckedCreateWithoutCredentialsInput>
    where?: LoginMethodWhereInput
  }

  export type LoginMethodUpdateToOneWithWhereWithoutCredentialsInput = {
    where?: LoginMethodWhereInput
    data: XOR<LoginMethodUpdateWithoutCredentialsInput, LoginMethodUncheckedUpdateWithoutCredentialsInput>
  }

  export type LoginMethodUpdateWithoutCredentialsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumLoginMethodTypeFieldUpdateOperationsInput | $Enums.LoginMethodType
    identifier?: StringFieldUpdateOperationsInput | string
    verified?: BoolFieldUpdateOperationsInput | boolean
    enabled?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoginMethodUncheckedUpdateWithoutCredentialsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumLoginMethodTypeFieldUpdateOperationsInput | $Enums.LoginMethodType
    identifier?: StringFieldUpdateOperationsInput | string
    verified?: BoolFieldUpdateOperationsInput | boolean
    enabled?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CredentialCreateManyLoginMethodsInput = {
    id?: string
    secretType: $Enums.CredentialType
    secretValue?: string | null
    provider?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CredentialUpdateWithoutLoginMethodsInput = {
    id?: StringFieldUpdateOperationsInput | string
    secretType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    secretValue?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CredentialUncheckedUpdateWithoutLoginMethodsInput = {
    id?: StringFieldUpdateOperationsInput | string
    secretType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    secretValue?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CredentialUncheckedUpdateManyWithoutLoginMethodsInput = {
    id?: StringFieldUpdateOperationsInput | string
    secretType?: EnumCredentialTypeFieldUpdateOperationsInput | $Enums.CredentialType
    secretValue?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
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