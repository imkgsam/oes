import { LoginMethod, Credential } from '../entities/loginmethod.entity'

export interface ILoginMethodRepository {
  findById(id: string): Promise<LoginMethod | null> // 通过id获取LoginMethod
  findAll(): Promise<LoginMethod[]> // 获取所有的loginmethod
  save(newOne: Partial<LoginMethod>): Promise<LoginMethod>
  delete(id: string): Promise<LoginMethod | null>
  _Credential: {  //不应该开放对credential的操作，测试用
    findAll(): Promise<Credential>
    delete(id: string): Promise<Credential | null>
    findById(id: string): Promise<Credential | null>
  }
}
