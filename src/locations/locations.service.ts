import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLocationDto } from './dto/create-location.dto';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>
  ) {}

  async create(createLocationDto: CreateLocationDto) {
    const exists = await this.locationRepo
      .createQueryBuilder('location')
      .where('LOWER(location.name) = LOWER(:name)', {
        name: createLocationDto.name,
      })
      .getOne();

    if (exists) {
      throw new ConflictException('Location already exists');
    }

    const location = this.locationRepo.create(createLocationDto);
    return this.locationRepo.save(location);
  }
}
