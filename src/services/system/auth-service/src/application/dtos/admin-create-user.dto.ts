import { IsEmail, Length, IsPhoneNumber, IsNotEmpty, IsOptional, } from 'class-validator';


//admin 创建新用户
export class AdminCreateUserDto {

  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsOptional()
  @Length(6, 30)
  readonly password: string;

  @IsOptional()
  @IsPhoneNumber()
  readonly phone: string;

}