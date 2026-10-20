import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// Password is optional on update: omit it to keep the current one
export class UpdateUserDto extends PartialType(CreateUserDto) {}
