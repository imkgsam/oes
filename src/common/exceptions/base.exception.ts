export class BaseException extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly messageKey: string,
    public readonly httpStatus: number,
    public readonly module: string,
    public readonly details?: any,
  ) {
    super(message)
  }
}
