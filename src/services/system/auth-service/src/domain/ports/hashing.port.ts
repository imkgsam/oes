export interface HashingPort {
  hash(input: string): Promise<string>
  compare(input: string, hashcode: string): Promise<boolean>
}
