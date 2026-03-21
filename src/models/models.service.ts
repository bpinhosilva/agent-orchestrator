import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './entities/model.entity';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
  ) {}

  async create(createModelDto: CreateModelDto): Promise<Model> {
    const { providerId, ...rest } = createModelDto;
    const model = this.modelRepository.create({
      ...rest,
      provider: { id: providerId },
    });
    return this.modelRepository.save(model);
  }

  async findAll(): Promise<Model[]> {
    return this.modelRepository.find();
  }

  async findOne(id: string): Promise<Model> {
    const model = await this.modelRepository.findOne({ where: { id } });
    if (!model) {
      throw new NotFoundException(`Model #${id} not found`);
    }
    return model;
  }

  async update(id: string, updateModelDto: UpdateModelDto): Promise<Model> {
    const { providerId, ...rest } = updateModelDto;
    const updateData: import('typeorm').DeepPartial<Model> = { ...rest };
    if (providerId) {
      updateData.provider = { id: providerId };
    }
    const model = await this.modelRepository.preload({
      id,
      ...updateData,
    });
    if (!model) {
      throw new NotFoundException(`Model #${id} not found`);
    }
    return this.modelRepository.save(model);
  }

  async remove(id: string): Promise<void> {
    const model = await this.findOne(id);
    await this.modelRepository.remove(model);
  }
}
