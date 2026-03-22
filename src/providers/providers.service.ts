import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from './entities/provider.entity';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
  ) {}

  async create(createProviderDto: CreateProviderDto): Promise<Provider> {
    const provider = this.providerRepository.create(createProviderDto);
    return this.providerRepository.save(provider);
  }

  async findAll(): Promise<Provider[]> {
    return this.providerRepository.find({ relations: ['models'] });
  }

  async findOne(id: string): Promise<Provider> {
    const provider = await this.providerRepository.findOne({ where: { id } });
    if (!provider) {
      throw new NotFoundException(`Provider #${id} not found`);
    }
    return provider;
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
