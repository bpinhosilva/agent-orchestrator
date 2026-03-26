import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';
import { Model } from '../models/entities/model.entity';

@Injectable()
export class ProvidersService implements OnModuleInit {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
  ) {}

  async onModuleInit() {
    await this.seedProviders();
  }

  private async seedProviders() {
    const defaultProviders = [
      {
        name: 'google',
        description: 'Google Generative AI (Gemini)',
        models: [
          { name: 'gemini-2.5-flash-lite' },
          { name: 'gemini-2.5-flash-image' },
          { name: 'gemini-2.5-pro' },
        ],
      },
      {
        name: 'anthropic',
        description: 'Anthropic Claude AI',
        models: [{ name: 'claude-opus-4-6' }, { name: 'claude-haiku-4-5' }],
      },
    ];

    for (const p of defaultProviders) {
      let provider = await this.providerRepository.findOne({
        where: { name: p.name },
        relations: ['models'],
      });

      if (!provider) {
        provider = this.providerRepository.create(p);
        await this.providerRepository.save(provider);
      } else {
        // Check for missing models
        let changed = false;
        for (const m of p.models) {
          if (!provider.models.some((existing) => existing.name === m.name)) {
            provider.models.push(m as Model);
            changed = true;
          }
        }
        if (changed) {
          await this.providerRepository.save(provider);
        }
      }
    }
  }

  async create(createProviderDto: CreateProviderDto): Promise<Provider> {
    const provider = this.providerRepository.create(createProviderDto);
    return this.providerRepository.save(provider);
  }

  async findAll(): Promise<Provider[]> {
    return this.providerRepository.find();
  }

  async findOne(id: string): Promise<Provider> {
    const provider = await this.providerRepository.findOne({ where: { id } });
    if (!provider) {
      throw new NotFoundException(`Provider #${id} not found`);
    }
    return provider;
  }

  async findProviderModels(id: string): Promise<any[]> {
    const provider = await this.providerRepository.findOne({
      where: { id },
      relations: ['models'],
    });
    if (!provider) {
      throw new NotFoundException(`Provider #${id} not found`);
    }
    return provider.models.map((model) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { provider: _, ...modelWithoutProvider } = model;
      return modelWithoutProvider;
    });
  }

  async update(
    id: string,
    updateProviderDto: UpdateProviderDto,
  ): Promise<Provider> {
    const provider = await this.providerRepository.preload({
      id,
      ...updateProviderDto,
    });
    if (!provider) {
      throw new NotFoundException(`Provider #${id} not found`);
    }
    return this.providerRepository.save(provider);
  }

  async remove(id: string): Promise<void> {
    const provider = await this.findOne(id);
    await this.providerRepository.remove(provider);
  }
}
