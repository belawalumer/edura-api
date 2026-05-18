import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In, Not } from 'typeorm';
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
import {
  BasicTestDivision,
  TestDetailsBasic,
} from './dto/get-available-test-dto';
import { User } from 'src/user/entities/user.entity';

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
    private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  private getAttemptRemainingDuration(attempt: {
    status: TestStatus;
    remaining_duration?: number | null;
    end_time?: Date | null;
  }): number | null {
    if (attempt.status !== TestStatus.IN_PROGRESS) {
      return attempt.remaining_duration ?? null;
    }
    if (!attempt.end_time) {
      return attempt.remaining_duration ?? null;
    }
    return Math.max(
      0,
      Math.floor((new Date(attempt.end_time).getTime() - Date.now()) / 1000)
    );
  }

  private formatDuration(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  private async completeAttemptWithScore(attempt: TestAttempt): Promise<{
    marks: number;
    total_correct: number;
    total_wrong: number;
    total_skipped: number;
    answered: number;
    total_questions: number;
    coins_earned: number;
    time_taken: string;
  }> {
    const questions =
      attempt.test?.questions?.length > 0
        ? attempt.test.questions
        : await this.questionRepo.find({
            where: { test: { id: attempt.test.id } },
          });

    const allAnswers = await this.userAnswerRepo.find({
      where: { testAttempt: { id: attempt.id } },
      relations: ['question'],
    });

    const correctMarks = Number(attempt.test.correct_marks ?? 1);
    const negativeMarks = Number(attempt.test.negative_marks ?? 0);
    const skippedMarks = Number(attempt.test.skipped_marks ?? 0);
    const answersByQuestionId = new Map<number, UserAnswer>();

    for (const answer of allAnswers) {
      if (answer.question?.id != null) {
        answersByQuestionId.set(answer.question.id, answer);
      }
    }

    let totalCorrect = 0;
    let totalWrong = 0;
    let totalSkipped = 0;

    for (const question of questions) {
      const answer = answersByQuestionId.get(question.id);
      if (!answer || answer.selected_option_id == null) {
        totalSkipped++;
      } else if (answer.isCorrect === true) {
        totalCorrect++;
      } else {
        totalWrong++;
      }
    }

    const score =
      totalCorrect * correctMarks -
      totalSkipped * skippedMarks -
      totalWrong * negativeMarks;
    const marks = Math.max(0, score);
    const coinsEarned = score;
    const completedTime = new Date();
    const totalDurationSeconds = Number(attempt.test.total_duration ?? 0) * 60;
    const remainingMs = attempt.end_time
      ? new Date(attempt.end_time).getTime() - completedTime.getTime()
      : 0;
    const timeTakenSeconds =
      remainingMs > 0
        ? totalDurationSeconds - Math.floor(remainingMs / 1000)
        : totalDurationSeconds;
    const timeTaken = this.formatDuration(timeTakenSeconds);

    attempt.status = TestStatus.COMPLETED;
    attempt.completed_time = completedTime;
    attempt.marks = marks;
    attempt.total_correct = totalCorrect;
    attempt.total_wrong = totalWrong;
    attempt.total_skipped = totalSkipped;
    attempt.correct_marks = correctMarks;
    attempt.negative_marks = negativeMarks;
    attempt.skipped_marks = skippedMarks;
    attempt.coins_earned = coinsEarned;
    attempt.time_taken = timeTaken;

    await this.testAttemptRepo.save(attempt);

    return {
      marks,
      total_correct: totalCorrect,
      total_wrong: totalWrong,
      total_skipped: totalSkipped,
      answered: allAnswers.filter((answer) => answer.selected_option_id != null)
        .length,
      total_questions: questions.length,
      coins_earned: coinsEarned,
      time_taken: timeTaken,
    };
  }

  private async applyCoinsToUser(
    userId: number,
    coinsEarned: number,
    oldCoins = 0
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;
    user.total_coins = Number(user.total_coins ?? 0) + coinsEarned - oldCoins;
    await this.userRepo.save(user);
  }

  async create(createTestDto: CreateTestDto) {
    const {
      title,
      status,
      total_questions,
      duration_minutes,
      categoryId,
      gradeId,
      subjectId,
      chapterId,
      questions,
      divisions,
      correct_marks: correctMarksIn,
      negative_marks: negativeMarksIn,
      skipped_marks: skippedMarksIn,
    } = createTestDto;

    const correct_marks = correctMarksIn ?? 1;
    const negative_marks = negativeMarksIn ?? 0;
    const skipped_marks = skippedMarksIn ?? 0;

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
          status,
          total_questions,
          total_duration: duration_minutes,
          category,
          grade,
          subject,
          chapter,
          correct_marks,
          negative_marks,
          skipped_marks,
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
            correct_marks: Number(test.correct_marks),
            negative_marks: Number(test.negative_marks),
            skipped_marks: Number(test.skipped_marks),
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
          status,
          total_questions,
          total_duration: duration_minutes,
          category,
          correct_marks,
          negative_marks,
          skipped_marks,
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
            correct_marks: Number(test.correct_marks),
            negative_marks: Number(test.negative_marks),
            skipped_marks: Number(test.skipped_marks),
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
          status,
          total_questions,
          total_duration: duration_minutes,
          category,
          correct_marks,
          negative_marks,
          skipped_marks,
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
            status,
            total_questions: div.total_questions,
            total_duration: div.duration_minutes,
            category,
            subject,
            parentTest,
            correct_marks,
            negative_marks,
            skipped_marks,
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
            correct_marks: Number(parentTest.correct_marks),
            negative_marks: Number(parentTest.negative_marks),
            skipped_marks: Number(parentTest.skipped_marks),
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
    query: PaginationQueryDto,
    userId?: number
  ) {
    const { page = 1, limit = 10, search } = query;

    const getLatestAttemptMap = async (
      testIds: number[]
    ): Promise<
      Map<
        number,
        {
          id: number;
          status: TestStatus;
          remaining_duration: number | null;
          end_time: Date | null;
          attemptedCount: number;
          coins_earned: number;
        }
      >
    > => {
      if (!userId || testIds.length === 0) return new Map();
      const attempts = await this.testAttemptRepo.find({
        where: {
          user_id: userId,
          test: { id: In(testIds) },
        },
        order: { id: 'DESC' },
        relations: ['answers', 'test'],
      });
      const map = new Map<
        number,
        {
          id: number;
          status: TestStatus;
          remaining_duration: number | null;
          end_time: Date | null;
          attemptedCount: number;
          coins_earned: number;
        }
      >();
      for (const attempt of attempts) {
        const testId = attempt.test?.id;
        if (testId == null) continue;
        const existing = map.get(testId);
        if (existing?.status === TestStatus.IN_PROGRESS) {
          continue;
        }
        if (
          existing?.status === TestStatus.COMPLETED &&
          attempt.status === TestStatus.COMPLETED
        ) {
          continue;
        }
        const attemptedCount =
          attempt.answers?.filter((answer) => answer.selected_option_id != null)
            .length ?? 0;
        const remainingDuration = this.getAttemptRemainingDuration(attempt);
        if (
          attempt.status === TestStatus.IN_PROGRESS &&
          remainingDuration === 0
        ) {
          const expiredResult = await this.completeAttemptWithScore(attempt);
          await this.applyCoinsToUser(userId, expiredResult.coins_earned);
        }
        const status =
          attempt.status === TestStatus.IN_PROGRESS && remainingDuration === 0
            ? TestStatus.COMPLETED
            : attempt.status;
        map.set(testId, {
          id: attempt.id,
          status,
          remaining_duration: remainingDuration,
          end_time: attempt.end_time ?? null,
          attemptedCount,
          coins_earned: Number(attempt.coins_earned ?? 0),
        });
      }
      return map;
    };
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
        .orderBy('LOWER(subject.name)', 'ASC')
        .addOrderBy('test.id', 'ASC');

      if (filters.gradeId != null) {
        qb.andWhere('grade.id = :gradeId', { gradeId: filters.gradeId });
      }

      if (search) {
        qb.andWhere(
          '(test.title ILIKE :search OR subject.name ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      const rawItems = await qb.getMany();
      const testIds = rawItems.map((t) => t.id);
      const attemptMap = await getLatestAttemptMap(testIds);

      const subjectGroups = new Map<
        string,
        {
          id: number;
          title: string;
          subject: { id: number | null; value: string };
          grade: { id: number | null; value: string | null };
          total_tests: number;
          total_questions: number;
          total_duration: number;
          completed_tests: number;
          in_progress_tests: number;
          coins_earned: number;
        }
      >();

      for (const test of rawItems) {
        const attempt = attemptMap.get(test.id);
        const subjectName = test.subject?.name ?? 'General';
        const gradeId = test.grade?.id ?? 0;
        const groupKey = `${subjectName.toLowerCase()}::${gradeId}`;
        const group = subjectGroups.get(groupKey) ?? {
          id: test.id,
          title: subjectName,
          subject: { id: test.subject?.id ?? null, value: subjectName },
          grade: {
            id: test.grade?.id ?? null,
            value: test.grade?.name ?? null,
          },
          total_tests: 0,
          total_questions: 0,
          total_duration: 0,
          completed_tests: 0,
          in_progress_tests: 0,
          coins_earned: 0,
        };

        group.total_tests += 1;
        group.total_questions += Number(test.total_questions ?? 0);
        group.total_duration += Number(test.total_duration ?? 0);
        if (attempt?.status === TestStatus.COMPLETED) {
          group.completed_tests += 1;
        }
        if (attempt?.status === TestStatus.IN_PROGRESS) {
          group.in_progress_tests += 1;
        }
        group.coins_earned += Number(attempt?.coins_earned ?? 0);

        subjectGroups.set(groupKey, group);
      }

      const groupedItems = Array.from(subjectGroups.values()).map((group) => {
        const progress_pct =
          group.total_tests > 0
            ? Math.round((group.completed_tests / group.total_tests) * 100)
            : 0;
        const status =
          group.in_progress_tests > 0
            ? 'in_progress'
            : group.total_tests > 0 &&
                group.completed_tests === group.total_tests
              ? 'completed'
              : 'active';

        return {
          id: group.id,
          title: group.title,
          subject: group.subject,
          grade: group.grade,
          total_questions: group.total_questions,
          total_duration: group.total_duration,
          total_tests: group.total_tests,
          completed_tests: group.completed_tests,
          in_progress_tests: group.in_progress_tests,
          progress_pct,
          status,
          coins_earned: group.coins_earned,
        };
      });

      const total = groupedItems.length;
      const start = (page - 1) * limit;
      const items = groupedItems.slice(start, start + limit);

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
      const testIds = rawItems.flatMap((t) =>
        t.divisions && t.divisions.length > 0
          ? t.divisions.map((d) => d.id)
          : [t.id]
      );
      const attemptMap = await getLatestAttemptMap(testIds);

      const items = rawItems.map((test) => {
        const divisions = test.divisions ?? [];
        const hasDivisions = divisions.length > 0;
        const total_tests = hasDivisions ? divisions.length : 1;
        const total_questions = hasDivisions
          ? divisions.reduce((sum, d) => sum + (d.total_questions ?? 0), 0)
          : Number(test.total_questions ?? 0);
        const total_duration = hasDivisions
          ? divisions.reduce((sum, d) => sum + (d.total_duration ?? 0), 0)
          : Number(test.total_duration ?? 0);
        const base = {
          id: test.id,
          title: test.title,
          total_questions,
          total_duration,
          total_tests,
          entry_type: hasDivisions
            ? EntryType.WITH_DIVISIONS
            : EntryType.WITHOUT_DIVISIONS,
        };

        if (hasDivisions) {
          let attempted_questions = 0;
          let coins_earned = 0;
          let remaining_duration_sum_sec = 0;
          let completed_tests = 0;
          let in_progress_tests = 0;

          for (const div of divisions) {
            const divAttempt = attemptMap.get(div.id);
            if (divAttempt) {
              attempted_questions += divAttempt.attemptedCount;
              coins_earned += Number(divAttempt.coins_earned ?? 0);
              if (divAttempt.status === TestStatus.IN_PROGRESS) {
                in_progress_tests += 1;
              }
              if (divAttempt.status === TestStatus.COMPLETED) {
                completed_tests += 1;
              }
              const divRemainingSec =
                divAttempt.remaining_duration ??
                (div.total_duration != null ? div.total_duration * 60 : 0);
              remaining_duration_sum_sec += divRemainingSec;
            } else {
              remaining_duration_sum_sec += (div.total_duration ?? 0) * 60;
            }
          }
          const remaining_duration =
            remaining_duration_sum_sec > 0 ? remaining_duration_sum_sec : null;
          const status =
            in_progress_tests > 0
              ? 'in_progress'
              : completed_tests === total_tests
                ? 'completed'
                : 'active';
          const progress_pct =
            total_tests > 0
              ? Math.round((completed_tests / total_tests) * 100)
              : 0;
          return {
            ...base,
            status,
            remaining_duration: remaining_duration ?? undefined,
            attempted_questions,
            completed_tests,
            in_progress_tests,
            progress_pct,
            coins_earned,
          };
        }

        if (userId != null) {
          const attempt = attemptMap.get(test.id);
          const status =
            attempt?.status === TestStatus.IN_PROGRESS
              ? 'in_progress'
              : attempt?.status === TestStatus.COMPLETED
                ? 'completed'
                : 'active';
          const completed_tests = status === 'completed' ? 1 : 0;
          const in_progress_tests = status === 'in_progress' ? 1 : 0;
          if (attempt) {
            return {
              ...base,
              status,
              remaining_duration: this.getAttemptRemainingDuration(attempt),
              attempted_questions: attempt.attemptedCount,
              completed_tests,
              in_progress_tests,
              progress_pct: completed_tests * 100,
              coins_earned: Number(attempt.coins_earned ?? 0),
            };
          }
          return {
            ...base,
            status,
            completed_tests,
            in_progress_tests,
            progress_pct: 0,
            coins_earned: 0,
          };
        }
        return {
          ...base,
          status: 'active',
          completed_tests: 0,
          in_progress_tests: 0,
          progress_pct: 0,
          coins_earned: 0,
        };
      });

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

  async getSelectableTests(
    filters: {
      type: CategoryType;
      subjectId?: number;
      gradeId?: number;
      testId?: number;
      entryType?: EntryType;
    },
    userId?: number
  ) {
    const getLatestAttemptMap = async (
      testIds: number[]
    ): Promise<
      Map<
        number,
        {
          id: number;
          status: TestStatus;
          remaining_duration: number | null;
          end_time: Date | null;
          attemptedCount: number;
          coins_earned: number;
        }
      >
    > => {
      if (!userId || testIds.length === 0) return new Map();
      const attempts = await this.testAttemptRepo.find({
        where: {
          user_id: userId,
          test: { id: In(testIds) },
        },
        order: { id: 'DESC' },
        relations: ['answers', 'test'],
      });
      const map = new Map<
        number,
        {
          id: number;
          status: TestStatus;
          remaining_duration: number | null;
          end_time: Date | null;
          attemptedCount: number;
          coins_earned: number;
        }
      >();
      for (const attempt of attempts) {
        const testId = attempt.test?.id;
        if (testId == null) continue;
        const existing = map.get(testId);
        if (existing?.status === TestStatus.IN_PROGRESS) {
          continue;
        }
        if (
          existing?.status === TestStatus.COMPLETED &&
          attempt.status === TestStatus.COMPLETED
        ) {
          continue;
        }
        const attemptedCount =
          attempt.answers?.filter((answer) => answer.selected_option_id != null)
            .length ?? 0;
        const remainingDuration = this.getAttemptRemainingDuration(attempt);
        if (
          attempt.status === TestStatus.IN_PROGRESS &&
          remainingDuration === 0
        ) {
          const expiredResult = await this.completeAttemptWithScore(attempt);
          await this.applyCoinsToUser(userId, expiredResult.coins_earned);
        }
        const status =
          attempt.status === TestStatus.IN_PROGRESS && remainingDuration === 0
            ? TestStatus.COMPLETED
            : attempt.status;
        map.set(testId, {
          id: attempt.id,
          status,
          remaining_duration: remainingDuration,
          end_time: attempt.end_time ?? null,
          attemptedCount,
          coins_earned: Number(attempt.coins_earned ?? 0),
        });
      }
      return map;
    };

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
        .orderBy('test.id', 'ASC');

      qb.andWhere('subject.id = :subjectId', { subjectId: filters.subjectId });
      if (filters.gradeId != null) {
        qb.andWhere('grade.id = :gradeId', { gradeId: filters.gradeId });
      }

      const rawItems = await qb.getMany();
      const testIds = rawItems.map((t) => t.id);
      const attemptMap = await getLatestAttemptMap(testIds);

      const items = rawItems.map((test) => {
        const attempt = attemptMap.get(test.id);
        const base = {
          id: test.id,
          title: test.title,
          total_questions: test.total_questions,
          total_duration: test.total_duration,
          subject: test.subject?.name ?? null,
          grade: test.grade?.name ?? null,
        };
        if (userId != null) {
          const status =
            attempt?.status === TestStatus.IN_PROGRESS
              ? 'in_progress'
              : attempt?.status === TestStatus.COMPLETED
                ? 'completed'
                : 'active';
          if (attempt) {
            return {
              ...base,
              status,
              remaining_duration: this.getAttemptRemainingDuration(attempt),
              attempted_questions: attempt.attemptedCount,
              coins_earned: Number(attempt.coins_earned ?? 0),
            };
          }
          return { ...base, status, coins_earned: 0 };
        }
        return base;
      });

      return { data: { items } };
    }

    if (
      filters.type === CategoryType.ENTRY_TEST &&
      (filters.testId != null || filters.entryType != null)
    ) {
      const qb = this.testRepo
        .createQueryBuilder('academic_tests')
        .leftJoinAndSelect('academic_tests.divisions', 'divisions')
        .leftJoinAndSelect('academic_tests.subject', 'entrySubject')
        .leftJoinAndSelect('academic_tests.grade', 'entryGrade')
        .leftJoinAndSelect('divisions.subject', 'divisionSubject')
        .leftJoinAndSelect('divisions.grade', 'divisionGrade')
        .leftJoin('academic_tests.category', 'category')
        .leftJoin('academic_tests.parentTest', 'parentTest')
        .where('LOWER(category.name) = :cat', { cat: CategoryName.ENTRY_TEST })
        .andWhere('academic_tests.parentTest IS NULL')
        .andWhere('academic_tests.status = :status', { status: Status.ACTIVE })
        .orderBy('academic_tests.id', 'ASC');

      if (filters.testId != null) {
        qb.andWhere('academic_tests.id = :testId', { testId: filters.testId });
      } else if (filters.entryType === EntryType.WITH_DIVISIONS) {
        qb.andWhere(`
        EXISTS (
          SELECT 1 FROM academic_tests child
          WHERE child.parent_test_id = academic_tests.id
        )
      `);
      } else if (filters.entryType === EntryType.WITHOUT_DIVISIONS) {
        qb.andWhere(`
        NOT EXISTS (
          SELECT 1 FROM academic_tests child
          WHERE child.parent_test_id = academic_tests.id
        )
      `);
      }

      const rawItems = await qb.getMany();
      const selectableTests: Array<{
        test: Test;
        parent: Test | null;
        entryType: EntryType;
      }> = [];
      for (const test of rawItems) {
        if (test.divisions && test.divisions.length > 0) {
          for (const division of test.divisions) {
            selectableTests.push({
              test: division,
              parent: test,
              entryType: EntryType.WITH_DIVISIONS,
            });
          }
        } else {
          selectableTests.push({
            test,
            parent: null,
            entryType: EntryType.WITHOUT_DIVISIONS,
          });
        }
      }
      const testIds = selectableTests.map((item) => item.test.id);
      const attemptMap = await getLatestAttemptMap(testIds);

      const items = selectableTests.map(({ test, parent, entryType }) => {
        const attempt = attemptMap.get(test.id);
        const base = {
          id: test.id,
          title: test.title,
          total_questions: test.total_questions,
          total_duration: test.total_duration,
          subject: test.subject?.name ?? parent?.subject?.name ?? null,
          grade: test.grade?.name ?? parent?.grade?.name ?? null,
          entry_type: entryType,
          parent_test_id: parent?.id,
        };

        if (userId != null) {
          const status =
            attempt?.status === TestStatus.IN_PROGRESS
              ? 'in_progress'
              : attempt?.status === TestStatus.COMPLETED
                ? 'completed'
                : 'active';
          if (attempt) {
            return {
              ...base,
              status,
              remaining_duration: this.getAttemptRemainingDuration(attempt),
              attempted_questions: attempt.attemptedCount,
              coins_earned: Number(attempt.coins_earned ?? 0),
            };
          }
          return { ...base, status, coins_earned: 0 };
        }
        return base;
      });

      return { data: { items } };
    }

    throw new BadRequestException('Invalid filters for scoped available tests');
  }

  async getTestById(
    testId: number,
    userId?: number
  ): Promise<{ data: TestDetailsBasic }> {
    const test = await this.testRepo.findOne({
      where: { id: testId },
      relations: ['category', 'parentTest', 'divisions'],
    });

    if (!test) throw new NotFoundException('Test not found');

    const testIds =
      test.divisions && test.divisions.length > 0
        ? [test.id, ...test.divisions.map((d) => d.id)]
        : [test.id];

    const attemptMap = new Map<
      number,
      {
        id: number;
        status: TestStatus;
        remaining_duration: number | null;
        end_time: Date | null;
        attemptedCount: number;
        coins_earned: number;
        marks: number;
        total_correct: number;
        total_wrong: number;
        total_skipped: number;
        correct_marks: number;
        negative_marks: number;
        skipped_marks: number;
        completed_time: Date | null;
        time_taken: string | null;
      }
    >();

    if (userId && testIds.length > 0) {
      const attempts = await this.testAttemptRepo.find({
        where: {
          user_id: userId,
          test: { id: In(testIds) },
        },
        order: { id: 'DESC' },
        relations: ['answers', 'test'],
      });
      for (const attempt of attempts) {
        const testId = attempt.test?.id;
        if (testId != null) {
          const existing = attemptMap.get(testId);
          if (existing?.status === TestStatus.IN_PROGRESS) {
            continue;
          }
          if (
            existing?.status === TestStatus.COMPLETED &&
            attempt.status === TestStatus.COMPLETED
          ) {
            continue;
          }
          const attemptedCount =
            attempt.answers?.filter(
              (answer) => answer.selected_option_id != null
            ).length ?? 0;
          const remainingDuration = this.getAttemptRemainingDuration(attempt);
          if (
            attempt.status === TestStatus.IN_PROGRESS &&
            remainingDuration === 0
          ) {
            const expiredResult = await this.completeAttemptWithScore(attempt);
            await this.applyCoinsToUser(userId, expiredResult.coins_earned);
          }
          const status =
            attempt.status === TestStatus.IN_PROGRESS && remainingDuration === 0
              ? TestStatus.COMPLETED
              : attempt.status;
          attemptMap.set(testId, {
            id: attempt.id,
            status,
            remaining_duration: remainingDuration,
            end_time: attempt.end_time ?? null,
            attemptedCount,
            coins_earned: Number(attempt.coins_earned ?? 0),
            marks: Number(attempt.marks ?? 0),
            total_correct: Number(attempt.total_correct ?? 0),
            total_wrong: Number(attempt.total_wrong ?? 0),
            total_skipped: Number(attempt.total_skipped ?? 0),
            correct_marks: Number(attempt.correct_marks ?? 0),
            negative_marks: Number(attempt.negative_marks ?? 0),
            skipped_marks: Number(attempt.skipped_marks ?? 0),
            completed_time: attempt.completed_time ?? null,
            time_taken: attempt.time_taken ?? null,
          });
        }
      }
    }

    const testDetails: TestDetailsBasic = {
      id: test.id,
      title: test.title,
      total_questions: test.total_questions,
      total_duration: test.total_duration,
      correct_marks: Number(test.correct_marks),
      negative_marks: Number(test.negative_marks),
      skipped_marks: Number(test.skipped_marks),
    };

    if (userId != null) {
      const attempt = attemptMap.get(test.id);
      testDetails.status = (
        attempt?.status === TestStatus.IN_PROGRESS
          ? 'in_progress'
          : attempt?.status === TestStatus.COMPLETED
            ? 'completed'
            : 'active'
      ) as TestDetailsBasic['status'];
      if (attempt) {
        testDetails.remaining_duration =
          this.getAttemptRemainingDuration(attempt) ?? 0;
        testDetails.attempted_questions = attempt.attemptedCount;
        testDetails.coins_earned = Number(attempt.coins_earned ?? 0);
        if (attempt.status === TestStatus.COMPLETED) {
          testDetails.marks = attempt.marks;
          testDetails.total_correct = attempt.total_correct;
          testDetails.total_wrong = attempt.total_wrong;
          testDetails.total_skipped = attempt.total_skipped;
          testDetails.correct_marks = attempt.correct_marks;
          testDetails.negative_marks = attempt.negative_marks;
          testDetails.skipped_marks = attempt.skipped_marks;
          testDetails.completed_time = attempt.completed_time ?? undefined;
          testDetails.time_taken = attempt.time_taken ?? undefined;
        }
      }
    }

    if (test.divisions && test.divisions.length > 0) {
      const divisionsOut: BasicTestDivision[] = [];
      for (const division of test.divisions) {
        const divAttempt = attemptMap.get(division.id);
        const base: BasicTestDivision = {
          id: division.id,
          title: division.title,
          total_questions: division.total_questions,
          total_duration: division.total_duration,
          correct_marks: Number(division.correct_marks),
          negative_marks: Number(division.negative_marks),
          skipped_marks: Number(division.skipped_marks),
        };
        if (userId != null) {
          const status = (
            divAttempt?.status === TestStatus.IN_PROGRESS
              ? 'in_progress'
              : divAttempt?.status === TestStatus.COMPLETED
                ? 'completed'
                : 'active'
          ) as TestDetailsBasic['status'];
          if (divAttempt) {
            const row: BasicTestDivision = {
              ...base,
              status,
              remaining_duration: this.getAttemptRemainingDuration(divAttempt),
              attempted_questions: divAttempt.attemptedCount,
              coins_earned: Number(divAttempt.coins_earned ?? 0),
            };
            if (divAttempt.status === TestStatus.COMPLETED) {
              row.marks = divAttempt.marks;
              row.total_correct = divAttempt.total_correct;
              row.total_wrong = divAttempt.total_wrong;
              row.total_skipped = divAttempt.total_skipped;
              row.correct_marks = divAttempt.correct_marks;
              row.negative_marks = divAttempt.negative_marks;
              row.skipped_marks = divAttempt.skipped_marks;
              row.completed_time = divAttempt.completed_time ?? undefined;
              row.time_taken = divAttempt.time_taken ?? undefined;
            }
            divisionsOut.push(row);
          } else {
            divisionsOut.push({ ...base, status });
          }
        } else {
          divisionsOut.push(base);
        }
      }
      testDetails.divisions = divisionsOut;
    }

    const rawCategoryName = test.category?.name?.toLowerCase();
    const isEntryTest = rawCategoryName === CategoryName.ENTRY_TEST;
    if (isEntryTest) {
      if (test.divisions && test.divisions.length > 0) {
        testDetails.entry_total_questions = test.divisions.reduce(
          (s, d) => s + Number(d.total_questions ?? 0),
          0
        );
        testDetails.entry_total_duration = test.divisions.reduce(
          (s, d) => s + Number(d.total_duration ?? 0),
          0
        );
        testDetails.entry_divisions_count = test.divisions.length;
      } else {
        testDetails.entry_total_questions = Number(test.total_questions);
        testDetails.entry_total_duration = Number(test.total_duration);
        testDetails.entry_divisions_count = 1;
      }
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
        'answers',
        'answers.question',
      ],
      order: { id: 'DESC' },
    });

    if (inProgressAttempt) {
      const remainingDuration =
        this.getAttemptRemainingDuration(inProgressAttempt) ?? 0;
      if (remainingDuration <= 0) {
        const expiredResult =
          await this.completeAttemptWithScore(inProgressAttempt);
        await this.applyCoinsToUser(authUserId, expiredResult.coins_earned);
      } else {
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

        const start = (page - 1) * limit;
        const end = page * limit;
        const items = allQuestions.slice(start, end);

        const saved_answers = (inProgressAttempt.answers ?? []).map((ua) => ({
          question_id: ua.question.id,
          selected_option_id: ua.selected_option_id,
        }));

        return {
          message: 'Test resumed successfully',
          data: {
            test_attempt_id: inProgressAttempt.id,
            resume: true,
            duration: remainingDuration,
            items,
            saved_answers,
            meta: {
              total: allQuestions.length,
              page,
              limit,
              totalPages: Math.ceil(allQuestions.length / limit),
              hasMore: page * limit < allQuestions.length,
            },
          },
        };
      }
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

    let orderedQuestions =
      attempt_count === 1 ? questions : this.shuffleArray(questions);

    // For restart attempts, prioritize previously unanswered questions.
    if (lastAttempt) {
      const lastAttemptAnswers = await this.userAnswerRepo.find({
        where: { testAttempt: { id: lastAttempt.id } },
        relations: ['question'],
      });
      const answeredIds = new Set(lastAttemptAnswers.map((a) => a.question.id));
      const unansweredQuestions = questions.filter(
        (q) => !answeredIds.has(q.id)
      );
      if (unansweredQuestions.length > 0) {
        orderedQuestions = this.shuffleArray(unansweredQuestions);
      }
    }

    // Create new attempt
    const startTime = new Date();
    const durationSeconds = Number(test.total_duration ?? 0) * 60;
    const attempt = this.testAttemptRepo.create({
      user_id: authUserId,
      test,
      attempt_count,
      start_time: startTime,
      end_time: new Date(startTime.getTime() + durationSeconds * 1000),
      status: TestStatus.IN_PROGRESS,
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

    return {
      message: 'Test started successfully',
      data: {
        test_attempt_id: attempt.id,
        resume: false,
        duration: this.getAttemptRemainingDuration(attempt),
        items,
        meta: {
          total: attemptedQuestions.length,
          page,
          limit,
          totalPages: Math.ceil(attemptedQuestions.length / limit),
          hasMore: page * limit < attemptedQuestions.length,
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

    const questions = attempt.test?.questions ?? [];
    if (questions.length === 0) {
      throw new BadRequestException('Test has no questions');
    }
    const validQuestionIds = questions.map((q) => q.id);

    // Validate that all submitted questions belong to this test
    const invalidQuestions = answers.filter(
      (ans) => !validQuestionIds.includes(ans.question_id)
    );

    if (invalidQuestions.length > 0) {
      throw new BadRequestException(
        `Some questions do not belong to this test.`
      );
    }

    const remainingDuration = this.getAttemptRemainingDuration(attempt) ?? 0;
    const shouldAutoComplete = remainingDuration <= 0;

    // Save answers
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    for (const ans of answers) {
      const question = questionMap.get(ans.question_id);

      if (!question) continue;

      const isCorrect: boolean | null =
        ans.selected_option_id == null
          ? null
          : question.correctOptionId === ans.selected_option_id;

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

    if (shouldAutoComplete) {
      const expiredResult = await this.completeAttemptWithScore(attempt);
      await this.applyCoinsToUser(authUserId, expiredResult.coins_earned);
    } else {
      attempt.remaining_duration = remainingDuration;
      await this.testAttemptRepo.save(attempt);
    }

    return {
      message: 'Progress saved successfully',
      data: {
        status: attempt.status,
        remaining_duration: this.getAttemptRemainingDuration(attempt) ?? 0,
      },
    };
  }

  async submitTest(
    authUserId: number,
    test_attempt_id: number,
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

    const questionMap = new Map(attempt.test.questions.map((q) => [q.id, q]));
    const existingAnswersByQuestionId = new Map(
      existingAnswers
        .filter((answer) => answer.question?.id != null)
        .map((answer) => [answer.question.id, answer])
    );

    const answersToSave = answers.map((ans) => {
      const question = questionMap.get(ans.question_id)!;
      const isCorrect: boolean | null =
        ans.selected_option_id == null
          ? null
          : question.correctOptionId === ans.selected_option_id;

      const existingAnswer = existingAnswersByQuestionId.get(ans.question_id);
      if (existingAnswer) {
        existingAnswer.selected_option_id = ans.selected_option_id;
        existingAnswer.isCorrect = isCorrect;
        return existingAnswer;
      }

      return this.userAnswerRepo.create({
        testAttempt: attempt,
        question,
        selected_option_id: ans.selected_option_id,
        isCorrect,
      });
    });

    if (answersToSave.length > 0) {
      await this.userAnswerRepo.save(answersToSave);
    }

    const result = await this.completeAttemptWithScore(attempt);

    // Get coins from old completed attempts for this test before deleting them
    // (excludes the current attempt which was just marked COMPLETED)
    const oldCompletedAttempts = await this.testAttemptRepo.find({
      where: {
        user_id: authUserId,
        test: { id: attempt.test.id },
        status: TestStatus.COMPLETED,
        id: Not(attempt.id),
      },
    });
    const oldCoins = oldCompletedAttempts.reduce(
      (sum, a) => sum + Number(a.coins_earned ?? 0),
      0
    );

    await this.testAttemptRepo
      .createQueryBuilder()
      .delete()
      .from(TestAttempt)
      .where('user_id = :userId', { userId: authUserId })
      .andWhere('test_id = :testId', { testId: attempt.test.id })
      .andWhere('status = :status', { status: TestStatus.COMPLETED })
      .andWhere('id <> :currentAttemptId', { currentAttemptId: attempt.id })
      .execute();

    await this.applyCoinsToUser(authUserId, result.coins_earned, oldCoins);

    return {
      message: 'Test submitted successfully',
      data: {
        attempt_id: attempt.id,
        marks: result.marks,
        total_correct: result.total_correct,
        total_wrong: result.total_wrong,
        status: attempt.status,
        answered: result.answered,
        remaining_duration: this.getAttemptRemainingDuration(attempt),
        total_questions: result.total_questions,
        total_skipped: result.total_skipped,
        unanswered: result.total_skipped,
        coins_earned: result.coins_earned,
        time_taken: result.time_taken,
      },
    };
  }
}
