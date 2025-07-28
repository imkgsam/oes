import { LoginMethod } from '../entities/loginmethod.entity'

export interface ILoginMethodRepository {
  findById(id: string): Promise<LoginMethod | null> // 通过id获取LoginMethod
  findAll(): Promise<LoginMethod[]> // 获取所有的loginmethod
  save(newOne: Partial<LoginMethod>): Promise<LoginMethod>
  delete(id: string): Promise<LoginMethod>
}
