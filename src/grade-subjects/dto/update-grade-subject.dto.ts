import { PartialType } from '@nestjs/swagger';
import { CreateGradeSubjectDto } from './create-grade-subject.dto';

export class UpdateGradeSubjectDto extends PartialType(CreateGradeSubjectDto) {}
