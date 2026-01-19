import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Test } from './entities/test.entity';
import { Question } from './entities/question.entity';
import { Option } from './entities/option.entity';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { Category } from 'src/categories/entities/category.entity';
import { Chapter } from 'src/chapters/entities/chapter.entity';
import { PaginationQueryDto } from 'src/common/dto';
import { Grade } from 'src/grades/entities/grade.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { CreateQuestionDto } from './dto/create-question-dto';

@Injectable()
export class TestsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Test) private readonly testRepo: Repository<Test>,
  ) {}

  async create(createTestDto: CreateTestDto) {
    const {
      title,
      total_questions,
      duration_minutes,
      categoryId,
      gradeId,
      subjectId,
      chapterId,
      questions,
      divisions,
    } = createTestDto;

    return await this.dataSource.transaction(async (manager) => {
      // Validate category
      const category = await manager.findOne(Category, {
        where: { id: categoryId },
      });
      if (!category)
        throw new NotFoundException(`Category with ID ${categoryId} not found`);

      // Determine test type
      const isEntryTest = category.title.toLowerCase().includes('entry tests');
      const isSubjectTest = !isEntryTest;

      // SUBJECT TEST VALIDATION
      if (isSubjectTest) {
        if (!gradeId)
          throw new BadRequestException(
            'gradeId is required for subject tests',
          );
        if (!subjectId)
          throw new BadRequestException(
            'subjectId is required for subject tests',
          );
        if (divisions?.length)
          throw new BadRequestException('Subject tests cannot have divisions');
        if (!questions?.length)
          throw new BadRequestException(
            'Subject tests must have at least one question',
          );

        const grade = await manager.findOne(Grade, { where: { id: gradeId } });
        if (!grade)
          throw new NotFoundException(`Grade with ID ${gradeId} not found`);

        const subject = await manager.findOne(Subject, {
          where: { id: subjectId },
        });
        if (!subject)
          throw new NotFoundException(`Subject with ID ${subjectId} not found`);

        let chapter: Chapter | undefined;
        if (chapterId) {
          const foundChapter = await manager.findOne(Chapter, {
            where: { id: chapterId },
          });
          if (!foundChapter)
            throw new NotFoundException(
              `Chapter with ID ${chapterId} not found`,
            );
          chapter = foundChapter;
        }

        const test = manager.create(Test, {
          title,
          total_questions,
          total_duration: duration_minutes,
          category,
          grade,
          subject,
          chapter,
        });
        await manager.save(test);
        await this.createQuestions(manager, test, questions);

        return { message: 'Subject test created successfully', data: test };
      }

      // ENTRY TEST WITHOUT DIVISIONS VALIDATION
      if (isEntryTest && (!divisions || divisions.length === 0)) {
        if (!questions?.length)
          throw new BadRequestException(
            'Entry tests without divisions must have at least one question',
          );
        if (gradeId)
          throw new BadRequestException(
            'gradeId is not allowed for entry tests without divisions',
          );
        if (subjectId)
          throw new BadRequestException(
            'subjectId is not allowed for entry tests without divisions',
          );

        const test = manager.create(Test, {
          title,
          total_questions,
          total_duration: duration_minutes,
          category,
        });
        await manager.save(test);
        await this.createQuestions(manager, test, questions);

        return {
          message: 'Entry test (without divisions) created successfully',
          data: test,
        };
      }

      // ENTRY TEST WITH DIVISIONS VALIDATION
      if (isEntryTest && divisions && divisions.length > 0) {
        if (questions?.length)
          throw new BadRequestException(
            'Parent questions are not allowed for entry tests with divisions',
          );
        if (gradeId)
          throw new BadRequestException(
            'gradeId is not allowed for entry tests with divisions',
          );
        if (subjectId)
          throw new BadRequestException(
            'subjectId is not allowed for entry tests with divisions',
          );

        const parentTest = manager.create(Test, {
          title,
          total_questions,
          total_duration: duration_minutes,
          category,
        });
        await manager.save(parentTest);

        for (const div of divisions) {
          if (!div.subjectId)
            throw new BadRequestException(
              'Each division must have a subjectId',
            );
          if (!div.questions?.length)
            throw new BadRequestException(
              'Each division must have at least one question',
            );

          const subject = await manager.findOne(Subject, {
            where: { id: div.subjectId },
          });
          if (!subject)
            throw new NotFoundException(
              `Subject with ID ${div.subjectId} not found`,
            );

          const divisionTest = manager.create(Test, {
            title: div.title,
            total_questions: div.total_questions,
            total_duration: div.duration_minutes,
            category,
            subject,
            parentTest,
          });

          await manager.save(divisionTest);
          await this.createQuestions(manager, divisionTest, div.questions);
        }

        return {
          message: 'Entry test (with divisions) created successfully',
          data: parentTest,
        };
      }

      throw new BadRequestException('Invalid request body for test creation');
    });
  }

  private async createQuestions(
    manager: EntityManager,
    test: Test,
    questions: CreateQuestionDto[],
  ) {
    for (const qDto of questions) {
      if (!qDto.options || qDto.options.length < 2) {
        throw new BadRequestException(
          `Question "${qDto.title}" must have at least 2 options`,
        );
      }

      const question = manager.create(Question, {
        title: qDto.title,
        test,
        correctOptionId: null,
      });
      console.log(question);

      await manager.save(question);

      const options = qDto.options.map((opt) =>
        manager.create(Option, {
          value: opt.value,
          isCorrect: opt.isCorrect,
          question,
        }),
      );
      console.log(options);

      await manager.save(options);

      const correctOption = options.find((o) => o.isCorrect);
      if (!correctOption) {
        throw new BadRequestException(
          `Question "${qDto.title}" must have one correct option`,
        );
      }

      question.correctOptionId = correctOption.id;
      await manager.save(question);
    }
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const qb = this.testRepo
      .createQueryBuilder('test')
      .where('test.parentTest IS NULL')
      .leftJoinAndSelect('test.category', 'category')
      .leftJoinAndSelect('test.grade', 'grade')
      .leftJoinAndSelect('test.subject', 'subject')
      .leftJoinAndSelect('test.chapter', 'chapter')
      .leftJoinAndSelect('test.divisions', 'divisions')
      .leftJoinAndSelect('divisions.questions', 'divisionQuestions')
      .leftJoinAndSelect('divisionQuestions.options', 'divisionOptions')
      .leftJoinAndSelect('test.questions', 'questions')
      .leftJoinAndSelect('questions.options', 'options')
      .orderBy('test.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('test.title ILIKE :search', { search: `%${search}%` });
    }

    const [items, total] = await qb.getManyAndCount();

    const itemsClean = items.map((test) => {
      return {
        id: test.id,
        title: test.title,
        total_questions: test.total_questions,
        total_duration: test.total_duration,
        category: test.category,
        grade: test.grade ?? undefined,
        subject: test.subject ?? undefined,
        chapter: test.chapter ?? undefined,
        questions: test.questions?.length
          ? test.questions.map((q) => ({
              id: q.id,
              title: q.title,
              correctOptionId: q.correctOptionId,
              options: q.options?.map((o) => ({
                id: o.id,
                value: o.value,
                isCorrect: o.isCorrect,
              })),
            }))
          : undefined,
        divisions: test.divisions?.length
          ? test.divisions.map((div) => ({
              id: div.id,
              title: div.title,
              total_questions: div.total_questions,
              total_duration: div.total_duration,
              questions: div.questions?.length
                ? div.questions.map((q) => ({
                    id: q.id,
                    title: q.title,
                    correctOptionId: q.correctOptionId,
                    options: q.options?.map((o) => ({
                      id: o.id,
                      value: o.value,
                      isCorrect: o.isCorrect,
                    })),
                  }))
                : undefined,
            }))
          : undefined,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt,
      };
    });

    return {
      message: 'Tests retrieved successfully',
      data: {
        items: itemsClean,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      },
    };
  }

  async findOne(id: number) {
    const test = await this.testRepo.findOne({
      where: { id },
      relations: [
        'category',
        'grade',
        'subject',
        'chapter',
        'divisions',
        'divisions.questions',
        'divisions.questions.options',
        'questions',
        'questions.options',
      ],
    });

    if (!test) throw new NotFoundException(`Test with ID ${id} not found`);

    const testClean = {
      id: test.id,
      title: test.title,
      total_questions: test.total_questions,
      total_duration: test.total_duration,
      category: test.category,
      grade: test.grade ?? undefined,
      subject: test.subject ?? undefined,
      chapter: test.chapter ?? undefined,
      questions: test.questions?.length
        ? test.questions.map((q) => ({
            id: q.id,
            title: q.title,
            correctOptionId: q.correctOptionId,
            options: q.options?.map((o) => ({
              id: o.id,
              value: o.value,
              isCorrect: o.isCorrect,
            })),
          }))
        : undefined,
      divisions: test.divisions?.length
        ? test.divisions.map((div) => ({
            id: div.id,
            title: div.title,
            total_questions: div.total_questions,
            total_duration: div.total_duration,
            questions: div.questions?.length
              ? div.questions.map((q) => ({
                  id: q.id,
                  title: q.title,
                  correctOptionId: q.correctOptionId,
                  options: q.options?.map((o) => ({
                    id: o.id,
                    value: o.value,
                    isCorrect: o.isCorrect,
                  })),
                }))
              : undefined,
          }))
        : undefined,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt,
    };

    return { message: 'Test retrieved successfully', data: testClean };
  }

  async update(id: number, updateTestDto: UpdateTestDto) {
    return await this.dataSource.transaction(async (manager) => {
      const test = await manager.findOne(Test, {
        where: { id },
        relations: [
          'category',
          'grade',
          'subject',
          'chapter',
          'questions',
          'questions.options',
          'divisions',
          'divisions.questions',
          'divisions.questions.options',
        ],
      });

      if (!test) {
        throw new NotFoundException(`Test with ID ${id} not found`);
      }

      const {
        title,
        total_questions,
        duration_minutes,
        categoryId,
        gradeId,
        subjectId,
        chapterId,
        questions,
        divisions,
      } = updateTestDto;

      // BASIC FIELDS
      if (title !== undefined) test.title = title;
      if (total_questions !== undefined) test.total_questions = total_questions;
      if (duration_minutes !== undefined)
        test.total_duration = duration_minutes;

      // CATEGORY
      const category = categoryId
        ? await manager.findOne(Category, { where: { id: categoryId } })
        : test.category;

      if (!category) {
        throw new NotFoundException(`Category not found`);
      }

      test.category = category;

      const isEntryTest = category.title.toLowerCase().includes('entry tests');
      const isSubjectTest = !isEntryTest;

      // SUBJECT TEST UPDATE
      if (isSubjectTest) {
        if (!gradeId)
          throw new BadRequestException(
            'gradeId is required for subject tests',
          );
        if (!subjectId)
          throw new BadRequestException(
            'subjectId is required for subject tests',
          );
        if (divisions?.length)
          throw new BadRequestException('Subject tests cannot have divisions');
        if (!questions?.length)
          throw new BadRequestException(
            'Subject tests must have at least one question',
          );

        const grade = await manager.findOne(Grade, {
          where: { id: gradeId },
        });
        if (!grade)
          throw new NotFoundException(`Grade with ID ${gradeId} not found`);

        const subject = await manager.findOne(Subject, {
          where: { id: subjectId },
        });
        if (!subject)
          throw new NotFoundException(`Subject with ID ${subjectId} not found`);

        let chapter: Chapter | undefined;
        if (chapterId !== undefined) {
          if (chapterId === null) {
            chapter = undefined;
          } else {
            const foundChapter = await manager.findOne(Chapter, {
              where: { id: chapterId },
            });
            if (!foundChapter)
              throw new NotFoundException(
                `Chapter with ID ${chapterId} not found`,
              );
            chapter = foundChapter;
          }
        }

        test.grade = grade;
        test.subject = subject;
        test.chapter = chapter;

        //  Questions: soft delete + recreate
        await this.softDeleteQuestions(manager, test.questions);
        await this.createQuestions(manager, test, questions);

        await manager.save(test);

        return {
          message: 'Subject test updated successfully',
          data: test,
        };
      }

      // ENTRY TEST WITHOUT DIVISIONS
      if (isEntryTest && (!divisions || divisions.length === 0)) {
        if (!questions?.length)
          throw new BadRequestException(
            'Entry tests without divisions must have at least one question',
          );
        if (gradeId || subjectId)
          throw new BadRequestException(
            'gradeId and subjectId are not allowed for entry tests',
          );

        test.grade = undefined;
        test.subject = undefined;
        test.chapter = undefined;

        await this.softDeleteQuestions(manager, test.questions);
        await this.createQuestions(manager, test, questions);

        await manager.save(test);

        return {
          message: 'Entry test (without divisions) updated successfully',
          data: test,
        };
      }

      // ENTRY TEST WITH DIVISIONS
      if (isEntryTest && divisions && divisions.length > 0) {
        if (questions?.length)
          throw new BadRequestException(
            'Parent questions are not allowed for entry tests with divisions',
          );
        if (gradeId || subjectId)
          throw new BadRequestException(
            'gradeId and subjectId are not allowed for entry tests with divisions',
          );

        test.grade = undefined;
        test.subject = undefined;
        test.chapter = undefined;

        // Soft-delete parent questions
        await this.softDeleteQuestions(manager, test.questions);

        for (const divDto of divisions) {
          if (!divDto.id)
            throw new BadRequestException('Division id is required for update');

          const existingDivision = test.divisions?.find(
            (d) => d.id === divDto.id,
          );

          if (!existingDivision) {
            throw new NotFoundException(
              `Division with ID ${divDto.id} not found`,
            );
          }

          // UPDATE DIVISION FIELDS
          if (divDto.title !== undefined) existingDivision.title = divDto.title;

          if (divDto.total_questions !== undefined)
            existingDivision.total_questions = divDto.total_questions;

          if (divDto.duration_minutes !== undefined)
            existingDivision.total_duration = divDto.duration_minutes;

          // SUBJECT
          if (!divDto.subjectId)
            throw new BadRequestException(
              'Each division must have a subjectId',
            );

          const subject = await manager.findOne(Subject, {
            where: { id: divDto.subjectId },
          });

          if (!subject)
            throw new NotFoundException(
              `Subject with ID ${divDto.subjectId} not found`,
            );

          existingDivision.subject = subject;

          // QUESTIONS: SOFT DELETE + RECREATE
          await this.softDeleteQuestions(manager, existingDivision.questions);

          if (!divDto.questions?.length)
            throw new BadRequestException(
              'Each division must have at least one question',
            );

          await this.createQuestions(
            manager,
            existingDivision,
            divDto.questions,
          );

          await manager.save(existingDivision);
        }

        await manager.save(test);

        return {
          message: 'Entry test (with divisions) updated successfully',
          data: test,
        };
      }

      throw new BadRequestException('Invalid request body for test update');
    });
  }

  private async softDeleteQuestions(
    manager: EntityManager,
    questions?: Question[],
  ) {
    if (!questions?.length) return;

    for (const q of questions) {
      if (q.options?.length) {
        for (const opt of q.options) {
          opt.deletedAt = new Date();
          await manager.save(opt);
        }
      }
      q.deletedAt = new Date();
      await manager.save(q);
    }
  }

  async remove(id: number) {
    const result = await this.testRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Test with ID ${id} not found`);
    return { message: 'Test deleted successfully' };
  }
}
