import { Module } from "@nestjs/common";
import { AuthController } from "./auth-local.controller";
import { MicroserviceClientModule } from "src/clients/microservice-client.module";


@Module({
  imports: [MicroserviceClientModule],
  controllers: [AuthController]
})
export class AuthModule {

}