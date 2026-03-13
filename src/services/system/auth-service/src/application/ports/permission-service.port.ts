import { SomePort } from '@oes/common/contracts'

//鎵€闇€鐨勬柟娉?type SomePortSelection = 'getUserPermissions'

//Permission Service 绔彛鎺ュ彛
export interface IPermissionServicePort extends Pick<SomePort, SomePortSelection> {}
