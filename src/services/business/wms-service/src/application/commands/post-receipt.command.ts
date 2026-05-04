import { Allow } from 'class-validator'

export interface PostReceiptPayload {
  tenantId: string
  receiptId: string
  postComment?: string
}

/** PostReceiptCommand captures one request to convert a draft receipt into immutable inventory truth. */
export class PostReceiptCommand {
  @Allow()
  public readonly payload: PostReceiptPayload

  constructor(payload: PostReceiptPayload) {
    this.payload = payload
  }
}
