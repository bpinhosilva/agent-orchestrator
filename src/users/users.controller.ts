import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Body,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@ApiTags('users')
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query() query: ListUsersQueryDto) {
    const result = await this.usersService.findAll(query);

    return {
      ...result,
      items: this.usersService.serializeUsers(result.items),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.serializeUser(await this.usersService.findOne(id));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.serializeUser(
      await this.usersService.update(id, updateUserDto),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
