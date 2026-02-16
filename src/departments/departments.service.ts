import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { Department } from './entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const exists = await this.departmentRepo
      .createQueryBuilder('department')
      .where('LOWER(department.name) = LOWER(:name)', {
        name: createDepartmentDto.name,
      })
      .getOne();

    if (exists) {
      throw new ConflictException('Department already exists');
    }

    const department = this.departmentRepo.create(createDepartmentDto);
    return this.departmentRepo.save(department);
  }
}
