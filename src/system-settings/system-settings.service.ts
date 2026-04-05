import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from './entities/system-settings.entity';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

export interface SystemSettingsData {
  scheduler: {
    pollInterval: number;
    watchdogTimeout: number;
    queueFlushFrequency: number;
    heartbeatPeriod: number;
    retryBackoffMultiplier: string;
    maxExecutionWindow: number;
  };
  cluster: {
    broadcastFrequency: number;
    defaultLlmProvider: string;
    systemAliasId: string;
  };
  persistence: {
    retentionDays: number;
  };
  ui: {
    darkModeEnabled: boolean;
    primaryHexAccent: string;
  };
  [key: string]: any;
}

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectRepository(SystemSettings)
    private readonly repository: Repository<SystemSettings>,
  ) {}

  private readonly defaultSettings: SystemSettingsData = {
    scheduler: {
      pollInterval: 500,
      watchdogTimeout: 3000,
      queueFlushFrequency: 1500,
      heartbeatPeriod: 10,
      retryBackoffMultiplier: '1.5x',
      maxExecutionWindow: 45000,
    },
    cluster: {
      broadcastFrequency: 500,
      defaultLlmProvider: 'Gemini Pro',
      systemAliasId: 'Aetheric Orchestrator',
    },
    persistence: {
      retentionDays: 30,
    },
    ui: {
      darkModeEnabled: true,
      primaryHexAccent: '#adc6ff',
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
      const data = updateDto.data as SystemSettingsData;
      const newSettings = this.repository.create({ data });
      return this.repository.save(newSettings);
    } else {
      settings.data = updateDto.data as SystemSettingsData;
      return this.repository.save(settings);
    }
  }
}
