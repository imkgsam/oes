import { SERVICE_CLIENT_TOKENS } from './service-map';
export declare function InjectServiceClient(serviceKey: keyof typeof SERVICE_CLIENT_TOKENS): PropertyDecorator & ParameterDecorator;
