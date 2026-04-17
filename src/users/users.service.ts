import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { serializeUser, type SerializedUser } from './avatar.constants';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

const DEFAULT_USERS_PAGE = 1;
const DEFAULT_USERS_LIMIT = 15;
const MAX_USERS_LIMIT = 100;

function normalizePage(page?: number): number {
  if (!page || Number.isNaN(page)) {
    return DEFAULT_USERS_PAGE;
  }

  return Math.max(DEFAULT_USERS_PAGE, Math.trunc(page));
}

function normalizeLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_USERS_LIMIT;
  }

  return Math.min(MAX_USERS_LIMIT, Math.max(1, Math.trunc(limit)));
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(
    options: ListUsersQueryDto = {},
  ): Promise<{ items: User[]; total: number; page: number; limit: number }> {
    const page = normalizePage(options.page);
    const limit = normalizeLimit(options.limit);
    const search = options.search?.trim();

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .addOrderBy('user.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      const normalizedSearch = `%${escapeLikePattern(search.toLowerCase())}%`;

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where("LOWER(user.name) LIKE :search ESCAPE '\\'", {
            search: normalizedSearch,
          })
            .orWhere("LOWER(user.lastName) LIKE :search ESCAPE '\\'", {
              search: normalizedSearch,
            })
            .orWhere("LOWER(user.email) LIKE :search ESCAPE '\\'", {
              search: normalizedSearch,
            });
        }),
      );
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'name',
        'lastName',
        'password',
        'role',
        'avatar',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    const updatedUser = await this.userRepository.save({
      ...user,
      ...updateUserDto,
    });
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  serializeUser(user: Omit<User, 'password'>): SerializedUser {
    return serializeUser(user);
  }

  serializeUsers(users: Omit<User, 'password'>[]): SerializedUser[] {
    return users.map((user) => this.serializeUser(user));
  }
}
