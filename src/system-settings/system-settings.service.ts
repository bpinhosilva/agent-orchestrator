import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SystemSettings,
  SystemSettingsData,
} from './entities/system-settings.entity';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSettings)
    private readonly repository: Repository<SystemSettings>,
  ) {}

  private readonly defaultSettings: SystemSettingsData = {
    taskScheduler: {
      pollIntervalInMs: 20000,
      maxTaskPerExecution: 5,
    },
    recurrentTasksScheduler: {
      pollIntervalInMs: 15000,
      executionTimeout: 120000,
      maxActiveTasks: 5,
    },
  };

  async getSettings(): Promise<SystemSettings> {
    const settings = await this.repository.findOne({ where: {} });
    if (!settings) {
      return this.repository.create({ data: this.defaultSettings });
    }
    return settings;
  }

  async updateSettings(
    updateDto: UpdateSystemSettingsDto,
  ): Promise<SystemSettings> {
    const settings = await this.repository.findOne({ where: {} });
    if (!settings) {
      const newSettings = this.repository.create({ data: updateDto.data });
      return this.repository.save(newSettings);
    } else {
      settings.data = updateDto.data;
      return this.repository.save(settings);
    }
  }
}
