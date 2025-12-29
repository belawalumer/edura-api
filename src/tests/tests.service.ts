import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Test } from './entities/test.entity';
import { Question } from './entities/question.entity';
import { Option } from './entities/option.entity';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { Category } from 'src/categories/entities/category.entity';
import { Chapter } from 'src/chapters/entities/chapter.entity';
import { GradeSubject } from 'src/grade-subjects/entities/grade-subject.entity';
import { PaginationQueryDto } from 'src/common/dto';
import { Grade } from 'src/grades/entities/grade.entity';
import { Subject } from 'src/subjects/entities/subject.entity';

@Injectable()
export class TestsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Test) private readonly testRepo: Repository<Test>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Option) private readonly optionRepo: Repository<Option>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(GradeSubject)
    private readonly gradeSubjectRepo: Repository<GradeSubject>,
    @InjectRepository(Chapter)
    private readonly chapterRepo: Repository<Chapter>,
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
    } = createTestDto;

    return await this.dataSource.transaction(async (manager) => {
      // Validate category
      const category = await manager.findOne(Category, {
        where: { id: categoryId },
      });
      if (!category)
        throw new NotFoundException(`Category with ID ${categoryId} not found`);

      // VALIDATE GRADE
      let grade: Grade | undefined = undefined;
      if (gradeId) {
        grade = await manager.findOne(Grade, { where: { id: gradeId } });
        if (!grade)
          throw new NotFoundException(`Grade with ID ${gradeId} not found`);
      }

      // VALIDATE SUBJECT
      let subject: Subject | undefined = undefined;
      if (subjectId) {
        subject = await manager.findOne(Subject, { where: { id: subjectId } });
        if (!subject)
          throw new NotFoundException(`Subject with ID ${subjectId} not found`);
      }

      // Validate chapter
      let chapter: Chapter | undefined = undefined;
      if (chapterId) {
        const foundChapter = await this.chapterRepo.findOne({
          where: { id: chapterId },
        });
        if (!foundChapter)
          throw new NotFoundException(`Chapter with ID ${chapterId} not found`);
        chapter = foundChapter;
      }

      // Create test
      const test = manager.create(Test, {
        title,
        total_questions,
        total_duration: duration_minutes,
        category,
        gradeSubject,
        chapter,
      });
      await manager.save(test);

      for (const qDto of questions) {
        if (!qDto.options || qDto.options.length < 2)
          throw new BadRequestException(
            `Question "${qDto.title}" must have at least 2 options`,
          );

        // 1️⃣ Save question FIRST
        const question = manager.create(Question, {
          title: qDto.title,
          test,
          correctOptionId: null,
        });
        await manager.save(question);

        // 2️⃣ Create & save options
        const options = qDto.options.map((optDto) =>
          manager.create(Option, {
            value: optDto.value,
            isCorrect: optDto.isCorrect,
            question, // question.id now exists ✅
          }),
        );

        await manager.save(options);

        // 3️⃣ Set correctOptionId
        const correctOption = options.find((o) => o.isCorrect);
        if (!correctOption)
          throw new BadRequestException(
            `Question "${qDto.title}" must have a correct option`,
          );

        question.correctOptionId = correctOption.id;
        await manager.save(question);
      }

      return { message: 'Test created successfully', data: test };
    });
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const qb = this.testRepo
      .createQueryBuilder('test')
      .leftJoinAndSelect('test.category', 'category')
      .leftJoinAndSelect('test.gradeSubject', 'gradeSubject')
      .leftJoinAndSelect('gradeSubject.grade', 'grade')
      .leftJoinAndSelect('gradeSubject.subject', 'subject')
      .leftJoinAndSelect('test.chapter', 'chapter')
      .leftJoinAndSelect('test.questions', 'questions')
      .leftJoinAndSelect('questions.options', 'options')
      .orderBy('test.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) qb.where('test.title ILIKE :search', { search: `%${search}%` });

    const [items, total] = await qb.getManyAndCount();

    return {
      message: 'Tests retrieved successfully',
      data: {
        items,
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
        'gradeSubject',
        'gradeSubject.grade',
        'gradeSubject.subject',
        'chapter',
        'questions',
        'questions.options',
      ],
    });
    if (!test) throw new NotFoundException(`Test with ID ${id} not found`);
    return { message: 'Test retrieved successfully', data: test };
  }

  async update(id: number, updateTestDto: UpdateTestDto) {
    return await this.dataSource.transaction(async (manager) => {
      const test = await manager.findOne(Test, {
        where: { id },
        relations: [
          'category',
          'gradeSubject',
          'gradeSubject.grade',
          'gradeSubject.subject',
          'chapter',
          'questions',
          'questions.options',
        ],
      });

      if (!test) throw new NotFoundException(`Test with ID ${id} not found`);

      const {
        title,
        total_questions,
        duration_minutes,
        categoryId,
        gradeId,
        subjectId,
        chapterId,
        questions,
      } = updateTestDto;

      // BASIC FIELDS
      if (title !== undefined) test.title = title;
      if (total_questions !== undefined) test.total_questions = total_questions;
      if (duration_minutes !== undefined)
        test.total_duration = duration_minutes;

      // CATEGORY
      if (categoryId) {
        const category = await manager.findOne(Category, {
          where: { id: categoryId },
        });
        if (!category)
          throw new NotFoundException(
            `Category with ID ${categoryId} not found`,
          );
        test.category = category;
      }

      // GRADE SUBJECT
      if (gradeId && subjectId) {
        const gradeSubject = await manager.findOne(GradeSubject, {
          where: { grade: { id: gradeId }, subject: { id: subjectId } },
          relations: ['grade', 'subject'],
        });
        if (!gradeSubject)
          throw new NotFoundException(
            `GradeSubject not found for gradeId ${gradeId} and subjectId ${subjectId}`,
          );
        test.gradeSubject = gradeSubject;
      }

      // CHAPTER
      if (chapterId !== undefined) {
        if (chapterId === null) {
          test.chapter = undefined;
        } else {
          const chapter = await manager.findOne(Chapter, {
            where: { id: chapterId },
          });
          if (!chapter)
            throw new NotFoundException(
              `Chapter with ID ${chapterId} not found`,
            );
          test.chapter = chapter;
        }
      }

      // QUESTIONS & OPTIONS
      if (questions && questions.length > 0) {
        const existingQuestionsMap = new Map<number, Question>();
        test.questions.forEach((q) => existingQuestionsMap.set(q.id, q));

        const finalQuestions: Question[] = [];

        for (const qDto of questions) {
          let question: Question;

          if (qDto.id && existingQuestionsMap.has(qDto.id)) {
            // Existing question
            question = existingQuestionsMap.get(qDto.id)!;
            question.title = qDto.title;
            question = await manager.save(question);
          } else {
            // New question
            question = manager.create(Question, { title: qDto.title, test });
            question = await manager.save(question);
          }

          // Existing options
          const existingOptions = await manager.find(Option, {
            where: { question: { id: question.id } },
            relations: ['question'],
          });
          const existingOptionsMap = new Map<number, Option>();
          existingOptions.forEach((o) => existingOptionsMap.set(o.id, o));

          const savedOptions: Option[] = [];

          for (const optDto of qDto.options) {
            let option: Option;

            if (optDto.id && existingOptionsMap.has(optDto.id)) {
              // Update existing option
              option = existingOptionsMap.get(optDto.id)!;
              option.value = optDto.value;
              option.isCorrect = optDto.isCorrect;
              option.question = question;
              await manager.save(option);
            } else {
              // New option
              option = manager.create(Option, {
                value: optDto.value,
                isCorrect: optDto.isCorrect,
                question,
              });
              option = await manager.save(option);
            }

            savedOptions.push(option);
          }

          // Validate exactly one correct option
          const correctOptions = savedOptions.filter((o) => o.isCorrect);
          if (correctOptions.length !== 1)
            throw new BadRequestException(
              `Question "${question.title}" must have exactly one correct option`,
            );

          // Update question.correctOptionId
          question.correctOptionId = correctOptions[0].id;
          question.options = savedOptions;
          await manager.save(question);

          // Remove old options not in DTO
          const dtoOptionIds = qDto.options
            .map((o) => o.id)
            .filter(Boolean) as number[];
          const optionsToRemove = existingOptions.filter(
            (o) =>
              !dtoOptionIds.includes(o.id) && o.id !== question.correctOptionId,
          );
          if (optionsToRemove.length > 0) await manager.remove(optionsToRemove);

          finalQuestions.push(question);
        }

        test.questions = finalQuestions;
      }

      await manager.save(test);

      // Return updated test with relations
      const updatedTest = await manager.findOne(Test, {
        where: { id: test.id },
        relations: [
          'category',
          'gradeSubject',
          'gradeSubject.grade',
          'gradeSubject.subject',
          'chapter',
          'questions',
          'questions.options',
        ],
      });

      return {
        message: 'Test updated successfully',
        data: updatedTest,
      };
    });
  }

  async remove(id: number) {
    const result = await this.testRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Test with ID ${id} not found`);
    return { message: 'Test deleted successfully' };
  }
}
