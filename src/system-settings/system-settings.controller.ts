import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('system-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SystemSettingsController {
  constructor(private readonly service: SystemSettingsService) {}

  @Get()
  getSettings() {
    return this.service.getSettings();
  }

  @Patch()
  updateSettings(@Body() updateDto: UpdateSystemSettingsDto) {
    return this.service.updateSettings(updateDto);
  }
}
