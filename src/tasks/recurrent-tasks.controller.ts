import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RecurrentTasksService } from './recurrent-tasks.service';
import { CreateRecurrentTaskDto } from './dto/create-recurrent-task.dto';
import { UpdateRecurrentTaskDto } from './dto/update-recurrent-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('recurrent-tasks')
export class RecurrentTasksController {
  constructor(private readonly service: RecurrentTasksService) {}

  @Post()
  create(@Body() dto: CreateRecurrentTaskDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRecurrentTaskDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
