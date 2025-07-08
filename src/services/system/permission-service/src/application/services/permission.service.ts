export class Permission {
  constructor(
    public readonly id: string,
    public code: string,
    public module: string,
    public description?: string,
  ) { }
}
