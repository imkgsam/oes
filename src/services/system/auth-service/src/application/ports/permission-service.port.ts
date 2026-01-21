import { SomePort } from '@oes/common/contracts/permission-service/index'

//所需的方法
type SomePortSelection = 'getUserPermissions'

//Permission Service 端口接口
export interface IPermissionServicePort extends Pick<SomePort, SomePortSelection> {}
