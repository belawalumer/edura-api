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
import { Category } from 'src/categories/entities/category.entity';
import { Chapter } from 'src/chapters/entities/chapter.entity';
import { PaginationQueryDto } from 'src/common/dto';
import { Grade } from 'src/grades/entities/grade.entity';
import { Subject } from 'src/subjects/entities/subject.entity';
import { CreateQuestionDto } from './dto/create-question-dto';
import { CreateDivisionDto } from './dto/create-division-dto';
import { AttemptedQuestion } from './entities/attempted_questions.entity';
import { TestAttempt } from './entities/test_attempt.entity';
import { UserAnswer } from './entities/user_answers.entity';
import {
  CategoryName,
  CategoryType,
  EntryType,
  Status,
  TestStatus,
} from 'src/common/enums';
import { TestDetails, TestDetailsBasic } from './dto/get-available-test-dto';

@Injectable()
export class TestsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Test) private readonly testRepo: Repository<Test>,
    @InjectRepository(AttemptedQuestion)
    private readonly attemptedQuestionRepo: Repository<AttemptedQuestion>,
    @InjectRepository(TestAttempt)
    private readonly testAttemptRepo: Repository<TestAttempt>,
    @InjectRepository(UserAnswer)
    private readonly userAnswerRepo: Repository<UserAnswer>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>
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

      const categoryName = category.name.toLowerCase() as CategoryName;
      const isEntryTest = categoryName === CategoryName.ENTRY_TEST;
      const isSubjectTest = categoryName === CategoryName.SUBJECT_TEST;

      // SUBJECT TEST VALIDATION
      if (isSubjectTest) {
        if (!gradeId)
          throw new BadRequestException(
            'gradeId is required for subject tests'
          );
        if (!subjectId)
          throw new BadRequestException(
            'subjectId is required for subject tests'
          );
        if (divisions?.length)
          throw new BadRequestException('Subject tests cannot have divisions');
        if (!questions?.length)
          throw new BadRequestException(
            'Subject tests must have at least one question'
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
              `Chapter with ID ${chapterId} not found`
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
        const createdQuestions = await this.createQuestions(
          manager,
          test,
          questions
        );

        return {
          message: 'Subject test created successfully',
          data: {
            id: test.id,
            title: test.title,
            status: test.status,
            total_questions: test.total_questions,
            total_duration: test.total_duration,
            categoryId: category.id,
            gradeId: grade.id,
            subjectId: subject.id,
            chapterId: chapter?.id ?? null,
            questions: createdQuestions,
          },
        };
      }

      // ENTRY TEST WITHOUT DIVISIONS VALIDATION
      if (isEntryTest && (!divisions || divisions.length === 0)) {
        if (!questions?.length)
          throw new BadRequestException(
            'Entry tests without divisions must have at least one question'
          );
        if (gradeId || subjectId || chapterId)
          throw new BadRequestException(
            'gradeId, subjectId, and chapterId are not allowed for entry tests without divisions'
          );

        const test = manager.create(Test, {
          title,
          total_questions,
          total_duration: duration_minutes,
          category,
        });
        await manager.save(test);
        const createdQuestions = await this.createQuestions(
          manager,
          test,
          questions
        );

        return {
          message: 'Entry test without divisions created successfully',
          data: {
            id: test.id,
            title: test.title,
            status: test.status,
            total_questions: test.total_questions,
            total_duration: test.total_duration,
            categoryId: category.id,
            gradeId: null,
            subjectId: null,
            chapterId: null,
            questions: createdQuestions,
          },
        };
      }

      // ENTRY TEST WITH DIVISIONS VALIDATION
      if (isEntryTest && divisions && divisions.length > 0) {
        if (questions?.length)
          throw new BadRequestException(
            'Parent questions are not allowed for entry tests with divisions'
          );
        if (gradeId || subjectId || chapterId)
          throw new BadRequestException(
            'gradeId, subjectId, and chapterId are not allowed for entry tests with divisions'
          );

        const createdDivisions: CreateDivisionDto[] = [];

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
              'Each division must have a subjectId'
            );
          if (!div.questions?.length)
            throw new BadRequestException(
              'Each division must have at least one question'
            );

          const subject = await manager.findOne(Subject, {
            where: { id: div.subjectId },
          });
          if (!subject)
            throw new NotFoundException(
              `Subject with ID ${div.subjectId} not found`
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
          const createdQuestions = await this.createQuestions(
            manager,
            divisionTest,
            div.questions
          );

          createdDivisions.push({
            id: divisionTest.id,
            title: divisionTest.title,
            total_questions: divisionTest.total_questions,
            duration_minutes: divisionTest.total_duration,
            subjectId: subject.id,
            questions: createdQuestions,
          });
        }

        return {
          message: 'Entry test with divisions created successfully',
          data: {
            id: parentTest.id,
            title: parentTest.title,
            status: parentTest.status,
            total_questions: parentTest.total_questions,
            total_duration: parentTest.total_duration,
            categoryId: category.id,
            divisions: createdDivisions,
          },
        };
      }

      throw new BadRequestException('Invalid request body for test creation');
    });
  }

  private async createQuestions(
    manager: EntityManager,
    test: Test,
    questions: CreateQuestionDto[]
  ) {
    const createdQuestions: CreateQuestionDto[] = [];

    for (const qDto of questions) {
      if (!qDto.options || qDto.options.length < 2) {
        throw new BadRequestException(
          `Question "${qDto.title}" must have at least 2 options`
        );
      }

      const question = manager.create(Question, {
        title: qDto.title,
        test,
        correctOptionId: null,
      });

      await manager.save(question);

      const options = qDto.options.map((opt) =>
        manager.create(Option, {
          value: opt.value,
          isCorrect: opt.isCorrect,
          question,
        })
      );

      await manager.save(options);

      const correctOption = options.find((o) => o.isCorrect);
      if (!correctOption) {
        throw new BadRequestException(
          `Question "${qDto.title}" must have one correct option`
        );
      }

      question.correctOptionId = correctOption.id;
      await manager.save(question);

      createdQuestions.push({
        id: question.id,
        title: question.title,
        options: options.map((o) => ({
          id: o.id,
          value: o.value,
          isCorrect: o.isCorrect,
        })),
      });
    }
    return createdQuestions;
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;

    const qb = this.testRepo
      .createQueryBuilder('test')
      .where('test.parentTest IS NULL')
      .leftJoinAndSelect('test.category', 'category')
      .leftJoinAndSelect('test.grade', 'grade')
      .leftJoinAndSelect('test.subject', 'subject')
      .select([
        'test.id',
        'test.title',
        'test.status',
        'test.total_duration',
        'test.total_questions',
        'category.id',
        'category.name',
        'grade.id',
        'grade.name',
        'subject.id',
        'subject.name',
      ])
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
        status: test.status,
        total_duration: test.total_duration,
        total_questions: test.total_questions,
        category: test.category?.name,
        grade: test.grade?.name ?? null,
        subject: test.subject?.name ?? null,
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

  async remove(id: number) {
    const result = await this.testRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Test with ID ${id} not found`);
    return { message: 'Test deleted successfully' };
  }

  async getAvailableTests(
    filters: {
      type: CategoryType;
      gradeId?: number;
      entryType?: EntryType;
    },
    query: PaginationQueryDto
  ) {
    const { page = 1, limit = 10, search } = query;

    // SUBJECT TESTS
    if (filters.type === CategoryType.SUBJECT_TEST) {
      const qb = this.testRepo
        .createQueryBuilder('test')
        .leftJoinAndSelect('test.subject', 'subject')
        .leftJoinAndSelect('test.chapter', 'chapter')
        .leftJoinAndSelect('test.grade', 'grade')
        .leftJoin('test.category', 'category')
        .where('LOWER(category.name) = :cat', {
          cat: CategoryName.SUBJECT_TEST,
        })
        .andWhere('test.status = :status', { status: Status.ACTIVE })
        .orderBy('test.id', 'ASC')
        .skip((page - 1) * limit)
        .take(limit);

      if (filters.gradeId != null) {
        qb.andWhere('grade.id = :gradeId', { gradeId: filters.gradeId });
      }

      if (search) {
        qb.andWhere('test.title ILIKE :search', { search: `%${search}%` });
      }

      const [rawItems, total] = await qb.getManyAndCount();
      const items = rawItems.map((test) => ({
        id: test.id,
        title: test.title,
        total_questions: test.total_questions,
        total_duration: test.total_duration,
        subject: test.subject?.name ?? null,
        grade: test.grade?.name ?? null,
        chapter: test.chapter?.name ?? null,
      }));

      return {
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

    // ENTRY TESTS
    if (filters.type === CategoryType.ENTRY_TEST) {
      const qb = this.testRepo
        .createQueryBuilder('academic_tests')
        .leftJoinAndSelect('academic_tests.divisions', 'divisions')
        .leftJoin('academic_tests.category', 'category')
        .leftJoin('academic_tests.parentTest', 'parentTest')
        .where('LOWER(category.name) = :cat', { cat: CategoryName.ENTRY_TEST })
        .andWhere('academic_tests.parentTest IS NULL')
        .andWhere('academic_tests.status = :status', { status: Status.ACTIVE })
        .orderBy('academic_tests.id', 'ASC')
        .skip((page - 1) * limit)
        .take(limit);

      if (filters.entryType === EntryType.WITH_DIVISIONS) {
        qb.andWhere(`
        EXISTS (
          SELECT 1 FROM academic_tests child
          WHERE child.parent_test_id = academic_tests.id
        )
      `);
      }

      if (filters.entryType === EntryType.WITHOUT_DIVISIONS) {
        qb.andWhere(`
        NOT EXISTS (
          SELECT 1 FROM academic_tests child
          WHERE child.parent_test_id = academic_tests.id
        )
      `);
      }

      if (search) {
        qb.andWhere('academic_tests.title ILIKE :search', {
          search: `%${search}%`,
        });
      }

      const [rawItems, total] = await qb.getManyAndCount();
      const items = rawItems.map((test) => ({
        id: test.id,
        title: test.title,
        total_questions: test.total_questions,
        total_duration: test.total_duration,
        entry_type:
          test.divisions && test.divisions.length > 0
            ? EntryType.WITH_DIVISIONS
            : EntryType.WITHOUT_DIVISIONS,
      }));

      return {
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
  }

  async getTestById(testId: number): Promise<{ data: TestDetailsBasic }> {
    const test = await this.testRepo.findOne({
      where: { id: testId },
      relations: ['category', 'parentTest', 'divisions'],
    });

    if (!test) throw new NotFoundException('Test not found');

    const testDetails: TestDetailsBasic = {
      id: test.id,
      title: test.title,
      total_questions: test.total_questions,
      total_duration: test.total_duration,
    };

    if (test.divisions && test.divisions.length > 0) {
      testDetails.divisions = test.divisions.map((division) => ({
        id: division.id,
        title: division.title,
        total_questions: division.total_questions,
        total_duration: division.total_duration,
      }));
    }

    return { data: testDetails };
  }

  async getTestByUser(
    testId: number,
    userId?: number
  ): Promise<{ data: TestDetails }> {
    const test = await this.testRepo.findOne({
      where: { id: testId },
      relations: ['category', 'parentTest', 'divisions'],
    });

    if (!test) throw new NotFoundException('Test not found');

    let status: 'active' | 'in_progress' | 'completed' = 'active';

    if (userId) {
      const attempt = await this.testAttemptRepo.findOne({
        where: { test: { id: testId }, user_id: userId },
      });

      if (attempt) {
        if (attempt.status === TestStatus.IN_PROGRESS)
          status = TestStatus.IN_PROGRESS;
        else if (attempt.status === TestStatus.COMPLETED)
          status = TestStatus.COMPLETED;
      }
    }

    const testDetails: TestDetails = {
      id: test.id,
      title: test.title,
      total_questions: test.total_questions,
      total_duration: test.total_duration,
      status,
    };

    // If Entry Test with divisions
    const isEntryTest =
      test.category.name.toLowerCase() ===
      CategoryName.ENTRY_TEST.toLowerCase();

    if (isEntryTest && test.divisions && test.divisions.length > 0) {
      const divisionPromises = test.divisions.map(async (division) => {
        let divStatus: 'active' | 'in_progress' | 'completed' = 'active';

        if (userId) {
          const attempt = await this.testAttemptRepo.findOne({
            where: { test: { id: division.id }, user_id: userId },
          });

          if (attempt) {
            if (attempt.status === TestStatus.IN_PROGRESS)
              divStatus = TestStatus.IN_PROGRESS;
            else if (attempt.status === TestStatus.COMPLETED)
              divStatus = TestStatus.COMPLETED;
          }
        }

        return {
          id: division.id,
          title: division.title,
          total_questions: division.total_questions,
          total_duration: division.total_duration,
          status: divStatus,
        };
      });

      testDetails.divisions = await Promise.all(divisionPromises);
    }

    return { data: testDetails };
  }

  async startTest(authUserId: number, test_id: number, page = 1, limit = 10) {
    const inProgressAttempt = await this.testAttemptRepo.findOne({
      where: {
        user_id: authUserId,
        test: { id: test_id },
        status: TestStatus.IN_PROGRESS,
      },
      relations: [
        'test',
        'attemptedQuestions',
        'attemptedQuestions.question',
        'attemptedQuestions.question.options',
      ],
    });

    if (inProgressAttempt) {
      const remainingDuration = inProgressAttempt.remaining_duration ?? 0;

      const allQuestions = inProgressAttempt.attemptedQuestions
        .sort((a, b) => a.question_order - b.question_order)
        .map((aq) => ({
          id: aq.question.id,
          title: aq.question.title,
          options: aq.question.options.map((opt) => ({
            id: opt.id,
            value: opt.value,
          })),
        }));

      const total = allQuestions.length;
      const start = (page - 1) * limit;
      const end = page * limit;
      const items = allQuestions.slice(start, end);

      return {
        message: 'Test resumed successfully',
        data: {
          test_attempt_id: inProgressAttempt.id,
          resume: true,
          attempt_count: inProgressAttempt.attempt_count,
          duration: remainingDuration,
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

    const test = await this.testRepo.findOne({ where: { id: test_id } });
    if (!test) throw new NotFoundException('Test not found');

    // Find last attempt
    const lastAttempt = await this.testAttemptRepo.findOne({
      where: {
        user_id: authUserId,
        test: { id: test_id },
        status: TestStatus.COMPLETED,
      },
      order: { attempt_count: 'DESC' },
    });

    const attempt_count = lastAttempt ? lastAttempt.attempt_count + 1 : 1;

    // Fetch all questions
    const questions = await this.questionRepo.find({
      where: { test: { id: test_id } },
      relations: ['options'],
      order: { id: 'ASC' },
    });

    if (!questions.length)
      throw new BadRequestException('No questions found for this test');

    const orderedQuestions =
      attempt_count === 1 ? questions : this.shuffleArray(questions);

    // Create new attempt
    const attempt = this.testAttemptRepo.create({
      user_id: authUserId,
      test,
      attempt_count,
      start_time: new Date(),
      status: TestStatus.IN_PROGRESS,
      remaining_duration: test.total_duration * 60,
    });
    await this.testAttemptRepo.save(attempt);

    // Save question order
    const attemptedQuestions = orderedQuestions.map((q, index) =>
      this.attemptedQuestionRepo.create({
        testAttempt: attempt,
        question: q,
        question_order: index + 1,
      })
    );
    await this.attemptedQuestionRepo.save(attemptedQuestions);

    // Paginate questions
    const total = attemptedQuestions.length;
    const start = (page - 1) * limit;
    const end = page * limit;

    const items = attemptedQuestions.slice(start, end).map((aq) => ({
      id: aq.question.id,
      title: aq.question.title,
      options: aq.question.options.map((opt) => ({
        id: opt.id,
        value: opt.value,
      })),
    }));

    // Return paginated response
    return {
      message: 'Test started successfully',
      data: {
        test_attempt_id: attempt.id,
        resume: false,
        attempt_count,
        duration: attempt.remaining_duration,
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

  private shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  async saveTestProgress(
    authUserId: number,
    test_attempt_id: number,
    remaining_duration: number,
    answers: {
      question_id: number;
      selected_option_id: number | null;
    }[]
  ) {
    const attempt = await this.testAttemptRepo.findOne({
      where: {
        id: test_attempt_id,
        user_id: authUserId,
        status: TestStatus.IN_PROGRESS,
      },
      relations: ['test', 'test.questions'],
    });

    if (!attempt) {
      throw new NotFoundException('Active test attempt not found');
    }

    const validQuestionIds = attempt.test.questions.map((q) => q.id);

    // Validate that all submitted questions belong to this test
    const invalidQuestions = answers.filter(
      (ans) => !validQuestionIds.includes(ans.question_id)
    );

    if (invalidQuestions.length > 0) {
      throw new BadRequestException(
        `Some questions do not belong to this test.`
      );
    }

    if (remaining_duration !== undefined) {
      attempt.remaining_duration = remaining_duration;
      await this.testAttemptRepo.save(attempt);
    }

    // Save answers
    for (const ans of answers) {
      const question = attempt.test.questions.find(
        (q) => q.id === ans.question_id
      );

      if (!question) continue;

      const isCorrect =
        ans.selected_option_id !== null &&
        question.correctOptionId === ans.selected_option_id;

      let userAnswer = await this.userAnswerRepo.findOne({
        where: {
          testAttempt: { id: attempt.id },
          question: { id: question.id },
        },
      });

      if (!userAnswer) {
        userAnswer = this.userAnswerRepo.create({
          testAttempt: attempt,
          question,
          selected_option_id: ans.selected_option_id,
          isCorrect,
        });
      } else {
        userAnswer.selected_option_id = ans.selected_option_id;
        userAnswer.isCorrect = isCorrect;
      }

      await this.userAnswerRepo.save(userAnswer);
    }

    return {
      message: 'Progress saved successfully',
      remaining_duration: attempt.remaining_duration,
    };
  }

  async submitTest(
    authUserId: number,
    test_attempt_id: number,
    remaining_duration: number,
    answers: { question_id: number; selected_option_id: number | null }[]
  ) {
    const attempt = await this.testAttemptRepo.findOne({
      where: { id: test_attempt_id, user_id: authUserId },
      relations: [
        'test',
        'test.questions',
        'attemptedQuestions',
        'attemptedQuestions.question',
      ],
    });

    if (!attempt) {
      throw new NotFoundException('Test attempt not found.');
    }

    if (attempt.status === TestStatus.COMPLETED) {
      throw new BadRequestException('Test has already been submitted.');
    }

    // Validate questions belong to test
    const validQuestionIds = new Set(attempt.test.questions.map((q) => q.id));

    const invalidQuestions = answers.filter(
      (ans) => !validQuestionIds.has(ans.question_id)
    );

    if (invalidQuestions.length > 0) {
      throw new BadRequestException(
        'Some questions do not belong to this test.'
      );
    }

    const existingAnswers = await this.userAnswerRepo.find({
      where: { testAttempt: { id: attempt.id } },
      relations: ['question'],
    });

    const alreadyAnsweredQuestionIds = new Set(
      existingAnswers.map((ua) => ua.question.id)
    );

    // Allow ONLY unanswered questions
    const newAnswers = answers
      .filter((ans) => !alreadyAnsweredQuestionIds.has(ans.question_id))
      .map((ans) => {
        const question = attempt.test.questions.find(
          (q) => q.id === ans.question_id
        )!;

        const isCorrect =
          ans.selected_option_id !== null &&
          question.correctOptionId === ans.selected_option_id;

        return this.userAnswerRepo.create({
          testAttempt: attempt,
          question,
          selected_option_id: ans.selected_option_id,
          isCorrect,
        });
      });

    if (newAnswers.length > 0) {
      await this.userAnswerRepo.save(newAnswers);
    }

    if (remaining_duration !== undefined) {
      attempt.remaining_duration = remaining_duration;
    }

    // Calculate result from ALL answers
    const allAnswers = await this.userAnswerRepo.find({
      where: { testAttempt: { id: attempt.id } },
      relations: ['question'],
    });

    const NEGATIVE_MARKS = Number(process.env.NEGATIVE_MARKS ?? 0);

    let marks = 0;
    let total_correct = 0;
    let total_wrong = 0;

    // Count unanswered questions as wrong
    const answeredQuestionIds = new Set(allAnswers.map((a) => a.question.id));
    const unansweredQuestions = attempt.test.questions.filter(
      (q) => !answeredQuestionIds.has(q.id)
    );

    total_wrong += unansweredQuestions.length;
    marks -= unansweredQuestions.length * NEGATIVE_MARKS;

    for (const ua of allAnswers) {
      if (ua.isCorrect) {
        total_correct++;
        marks++;
      } else {
        total_wrong++;
        marks -= NEGATIVE_MARKS;
      }
    }

    if (marks < 0) marks = 0;

    attempt.status = TestStatus.COMPLETED;
    attempt.end_time = new Date();
    attempt.marks = marks;
    attempt.total_correct = total_correct;
    attempt.total_wrong = total_wrong;

    await this.testAttemptRepo.save(attempt);

    return {
      message: 'Test submitted successfully',
      data: {
        attempt_id: attempt.id,
        marks,
        total_correct,
        total_wrong,
        status: attempt.status,
        answered: allAnswers.length,
        remaining_duration: attempt.remaining_duration,
        total_questions: attempt.test.questions.length,
        unanswered: unansweredQuestions.length,
      },
    };
  }
}
