import * as dotenv from 'dotenv';

dotenv.config();

import { IsNull, Repository } from 'typeorm';
import { AppDataSource } from './src/data-source';
import {
  EmploymentStatus,
  Gender,
  Status,
} from './src/common/enums';
import { Faq } from './src/faqs/entities/faq.entity';
import { Category } from './src/categories/entities/category.entity';
import { Grade } from './src/grades/entities/grade.entity';
import { Subject } from './src/subjects/entities/subject.entity';
import { GradeSubject } from './src/grade-subjects/entities/grade-subject.entity';
import { Chapter } from './src/chapters/entities/chapter.entity';
import { Test } from './src/tests/entities/test.entity';
import { Question } from './src/tests/entities/question.entity';
import { Option } from './src/tests/entities/option.entity';
import { Industry } from './src/industries/entities/industry.entity';
import { Department } from './src/departments/entities/department.entity';
import { Location } from './src/locations/entities/location.entity';
import { CareerLevel } from './src/career-levels/entities/career-level.entity';
import { Job } from './src/jobs/entities/job.entity';
import { JobPreferredCandidate } from './src/jobs/entities/job_preferred_candidates.entity';
import { ExamCategory } from './src/exam-category/entities/exam-category.entity';
import { PastPaper } from './src/past-papers/entities/past-paper.entity';
import { University } from './src/universities/entities/university.entity';
import { UniversityMerit } from './src/universities/entities/university-merit.entity';

type QuestionSeed = {
  title: string;
  options: { value: string; isCorrect: boolean }[];
};

async function ensureByName<T extends { name: string }>(
  repo: Repository<T>,
  name: string
): Promise<T> {
  const existing = await repo
    .createQueryBuilder('item')
    .where('LOWER(item.name) = LOWER(:name)', { name })
    .getOne();

  if (existing) return existing;
  return await repo.save(repo.create({ name } as T));
}

async function ensureFaq(
  repo: Repository<Faq>,
  title: string,
  description: string,
  visibility = true
) {
  const existing = await repo
    .createQueryBuilder('faq')
    .where('LOWER(faq.title) = LOWER(:title)', { title })
    .getOne();

  if (existing) return existing;
  return await repo.save(repo.create({ title, description, visibility }));
}

async function ensureGradeSubject(
  repo: Repository<GradeSubject>,
  grade: Grade,
  subject: Subject
) {
  const existing = await repo.findOne({
    where: { grade: { id: grade.id }, subject: { id: subject.id } },
    relations: ['grade', 'subject'],
  });
  if (existing) return existing;
  return await repo.save(repo.create({ grade, subject }));
}

async function ensureChapter(
  repo: Repository<Chapter>,
  name: string,
  gradeSubject: GradeSubject
) {
  const existing = await repo.findOne({
    where: { name, gradeSubject: { id: gradeSubject.id } },
    relations: ['gradeSubject'],
  });
  if (existing) return existing;
  return await repo.save(repo.create({ name, status: Status.ACTIVE, gradeSubject }));
}

async function ensureQuestions(
  questionRepo: Repository<Question>,
  optionRepo: Repository<Option>,
  test: Test,
  questions: QuestionSeed[]
) {
  for (const seed of questions) {
    const existing = await questionRepo.findOne({
      where: { title: seed.title, test: { id: test.id } },
      relations: ['test'],
    });

    if (existing) continue;

    const question = await questionRepo.save(
      questionRepo.create({
        title: seed.title,
        test,
        correctOptionId: null,
      })
    );

    const options = await optionRepo.save(
      seed.options.map((opt) =>
        optionRepo.create({
          value: opt.value,
          isCorrect: opt.isCorrect,
          question,
        })
      )
    );

    const correct = options.find((o) => o.isCorrect);
    if (correct) {
      question.correctOptionId = correct.id;
      await questionRepo.save(question);
    }
  }
}

async function ensureSubjectTest(
  testRepo: Repository<Test>,
  questionRepo: Repository<Question>,
  optionRepo: Repository<Option>,
  payload: {
    title: string;
    category: Category;
    grade: Grade;
    subject: Subject;
    chapter?: Chapter;
    total_duration: number;
    questions: QuestionSeed[];
  }
) {
  let test = await testRepo.findOne({
    where: { title: payload.title, parentTest: IsNull() },
    relations: ['parentTest'],
  });

  if (!test) {
    test = await testRepo.save(
      testRepo.create({
        title: payload.title,
        status: Status.ACTIVE,
        total_questions: payload.questions.length,
        total_duration: payload.total_duration,
        category: payload.category,
        grade: payload.grade,
        subject: payload.subject,
        chapter: payload.chapter,
      })
    );
  }

  await ensureQuestions(questionRepo, optionRepo, test, payload.questions);
}

async function ensureEntryTestWithoutDivisions(
  testRepo: Repository<Test>,
  questionRepo: Repository<Question>,
  optionRepo: Repository<Option>,
  payload: {
    title: string;
    category: Category;
    total_duration: number;
    questions: QuestionSeed[];
  }
) {
  let test = await testRepo.findOne({
    where: { title: payload.title, parentTest: IsNull() },
    relations: ['parentTest'],
  });

  if (!test) {
    test = await testRepo.save(
      testRepo.create({
        title: payload.title,
        status: Status.ACTIVE,
        total_questions: payload.questions.length,
        total_duration: payload.total_duration,
        category: payload.category,
      })
    );
  }

  await ensureQuestions(questionRepo, optionRepo, test, payload.questions);
}

async function ensureEntryTestWithDivisions(
  testRepo: Repository<Test>,
  questionRepo: Repository<Question>,
  optionRepo: Repository<Option>,
  payload: {
    title: string;
    category: Category;
    total_duration: number;
    divisions: {
      title: string;
      subject: Subject;
      total_duration: number;
      questions: QuestionSeed[];
    }[];
  }
) {
  let parent = await testRepo.findOne({
    where: { title: payload.title, parentTest: IsNull() },
    relations: ['parentTest'],
  });

  if (!parent) {
    parent = await testRepo.save(
      testRepo.create({
        title: payload.title,
        status: Status.ACTIVE,
        total_questions: payload.divisions.reduce(
          (acc, div) => acc + div.questions.length,
          0
        ),
        total_duration: payload.total_duration,
        category: payload.category,
      })
    );
  }

  for (const div of payload.divisions) {
    let division = await testRepo.findOne({
      where: { title: div.title, parentTest: { id: parent.id } },
      relations: ['parentTest'],
    });

    if (!division) {
      division = await testRepo.save(
        testRepo.create({
          title: div.title,
          status: Status.ACTIVE,
          total_questions: div.questions.length,
          total_duration: div.total_duration,
          category: payload.category,
          subject: div.subject,
          parentTest: parent,
        })
      );
    }

    await ensureQuestions(questionRepo, optionRepo, division, div.questions);
  }
}

async function ensureExamCategory(
  repo: Repository<ExamCategory>,
  name: string,
  parent?: ExamCategory
): Promise<ExamCategory> {
  const qb = repo
    .createQueryBuilder('cat')
    .where('LOWER(cat.name) = LOWER(:name)', { name });

  if (parent) {
    qb.andWhere('cat.parentId = :parentId', { parentId: parent.id });
  } else {
    qb.andWhere('cat.parentId IS NULL');
  }

  const existing = await qb.getOne();
  if (existing) return existing;

  const entity = repo.create({
    name,
    ...(parent ? { parent } : {}),
  });

  return await repo.save(entity);
}

async function ensureUniversityWithMerits(
  universityRepo: Repository<University>,
  meritRepo: Repository<UniversityMerit>,
  payload: {
    name: string;
    city: string;
    merits: { degree: string; lastYearClosingMerit: number }[];
  }
) {
  let university = await universityRepo
    .createQueryBuilder('university')
    .where('LOWER(university.name) = LOWER(:name)', { name: payload.name })
    .getOne();

  if (!university) {
    university = await universityRepo.save(
      universityRepo.create({
        name: payload.name,
        city: payload.city,
      })
    );
  } else if (university.city !== payload.city) {
    university.city = payload.city;
    university = await universityRepo.save(university);
  }

  for (const merit of payload.merits) {
    const exists = await meritRepo.findOne({
      where: {
        university: { id: university.id },
        degree: merit.degree,
      },
      relations: ['university'],
    });

    if (exists) continue;

    await meritRepo.save(
      meritRepo.create({
        university,
        degree: merit.degree,
        lastYearClosingMerit: merit.lastYearClosingMerit,
      })
    );
  }
}

async function seed() {
  try {
    await AppDataSource.initialize();

    const faqRepo = AppDataSource.getRepository(Faq);
    const categoryRepo = AppDataSource.getRepository(Category);
    const gradeRepo = AppDataSource.getRepository(Grade);
    const subjectRepo = AppDataSource.getRepository(Subject);
    const gradeSubjectRepo = AppDataSource.getRepository(GradeSubject);
    const chapterRepo = AppDataSource.getRepository(Chapter);
    const testRepo = AppDataSource.getRepository(Test);
    const questionRepo = AppDataSource.getRepository(Question);
    const optionRepo = AppDataSource.getRepository(Option);
    const industryRepo = AppDataSource.getRepository(Industry);
    const departmentRepo = AppDataSource.getRepository(Department);
    const locationRepo = AppDataSource.getRepository(Location);
    const careerLevelRepo = AppDataSource.getRepository(CareerLevel);
    const jobRepo = AppDataSource.getRepository(Job);
    const preferredRepo = AppDataSource.getRepository(JobPreferredCandidate);
    const examCategoryRepo = AppDataSource.getRepository(ExamCategory);
    const pastPaperRepo = AppDataSource.getRepository(PastPaper);
    const universityRepo = AppDataSource.getRepository(University);
    const universityMeritRepo = AppDataSource.getRepository(UniversityMerit);

    // FAQs
    await ensureFaq(
      faqRepo,
      'How do I prepare for MDCAT effectively?',
      'Start with Biology and Chemistry fundamentals, practice timed MCQs daily, and review mistakes weekly using topic-wise tests.'
    );
    await ensureFaq(
      faqRepo,
      'What is the difference between entry tests and subject tests?',
      'Entry tests are university admission-focused mixed tests (like MDCAT/ECAT), while subject tests target a single board/FSc subject.'
    );
    await ensureFaq(
      faqRepo,
      'Can I attempt tests multiple times?',
      'Yes. You can retake tests to improve your score and speed. Each attempt helps identify weak topics.'
    );
    await ensureFaq(
      faqRepo,
      'How are negative marks calculated?',
      'Negative marking follows the app settings. Unattempted or wrong answers can reduce final marks in selected tests.'
    );
    await ensureFaq(
      faqRepo,
      'Which boards are covered in past papers?',
      'Past papers include boards commonly used in Pakistan such as BISE Lahore, BISE Karachi, and FBISE Islamabad.'
    );

    // Base taxonomy for tests
    const subjectTestsCategory = await ensureByName(categoryRepo, 'subject tests');
    const entryTestsCategory = await ensureByName(categoryRepo, 'entry tests');
    subjectTestsCategory.status = Status.ACTIVE;
    entryTestsCategory.status = Status.ACTIVE;
    await categoryRepo.save([subjectTestsCategory, entryTestsCategory]);

    const grade11 = await ensureByName(gradeRepo, 'Grade 11');
    const grade12 = await ensureByName(gradeRepo, 'Grade 12');
    grade11.status = Status.ACTIVE;
    grade12.status = Status.ACTIVE;
    await gradeRepo.save([grade11, grade12]);

    const math = await ensureByName(subjectRepo, 'Mathematics');
    const physics = await ensureByName(subjectRepo, 'Physics');
    const chemistry = await ensureByName(subjectRepo, 'Chemistry');
    const biology = await ensureByName(subjectRepo, 'Biology');
    math.status = Status.ACTIVE;
    physics.status = Status.ACTIVE;
    chemistry.status = Status.ACTIVE;
    biology.status = Status.ACTIVE;
    await subjectRepo.save([math, physics, chemistry, biology]);

    const gs11Math = await ensureGradeSubject(gradeSubjectRepo, grade11, math);
    const gs12Physics = await ensureGradeSubject(gradeSubjectRepo, grade12, physics);

    const trigChapter = await ensureChapter(chapterRepo, 'Trigonometry', gs11Math);
    const electroChapter = await ensureChapter(
      chapterRepo,
      'Electrostatics',
      gs12Physics
    );

    // Subject tests (Pakistan-relevant)
    await ensureSubjectTest(testRepo, questionRepo, optionRepo, {
      title: 'FSc Part-I Mathematics - Trigonometry Drill',
      category: subjectTestsCategory,
      grade: grade11,
      subject: math,
      chapter: trigChapter,
      total_duration: 30,
      questions: [
        {
          title: 'If sin(theta)=3/5 and theta is acute, cos(theta) equals?',
          options: [
            { value: '4/5', isCorrect: true },
            { value: '3/4', isCorrect: false },
            { value: '5/4', isCorrect: false },
            { value: '2/5', isCorrect: false },
          ],
        },
        {
          title: 'The value of tan(45 degrees) is:',
          options: [
            { value: '1', isCorrect: true },
            { value: '0', isCorrect: false },
            { value: 'sqrt(3)', isCorrect: false },
            { value: '1/sqrt(3)', isCorrect: false },
          ],
        },
        {
          title: 'Which identity is correct?',
          options: [
            { value: 'sin^2(theta)+cos^2(theta)=1', isCorrect: true },
            { value: 'sin(theta)+cos(theta)=1', isCorrect: false },
            { value: 'tan(theta)=sin(theta)*cos(theta)', isCorrect: false },
            { value: 'sec(theta)=sin(theta)', isCorrect: false },
          ],
        },
      ],
    });

    await ensureSubjectTest(testRepo, questionRepo, optionRepo, {
      title: 'FSc Part-II Physics - Electrostatics Practice',
      category: subjectTestsCategory,
      grade: grade12,
      subject: physics,
      chapter: electroChapter,
      total_duration: 30,
      questions: [
        {
          title: 'SI unit of electric field intensity is:',
          options: [
            { value: 'N/C', isCorrect: true },
            { value: 'C/N', isCorrect: false },
            { value: 'J/C', isCorrect: false },
            { value: 'V/A', isCorrect: false },
          ],
        },
        {
          title: 'Coulomb law force is directly proportional to:',
          options: [
            { value: 'Product of charges', isCorrect: true },
            { value: 'Sum of charges', isCorrect: false },
            { value: 'Distance between charges', isCorrect: false },
            { value: 'Square of potential', isCorrect: false },
          ],
        },
        {
          title: 'Potential difference is defined as work done per:',
          options: [
            { value: 'Unit charge', isCorrect: true },
            { value: 'Unit mass', isCorrect: false },
            { value: 'Unit time', isCorrect: false },
            { value: 'Unit current', isCorrect: false },
          ],
        },
      ],
    });

    await ensureSubjectTest(testRepo, questionRepo, optionRepo, {
      title: 'FSc Part-II Chemistry - Organic Chemistry Basics',
      category: subjectTestsCategory,
      grade: grade12,
      subject: chemistry,
      total_duration: 30,
      questions: [
        {
          title: 'Functional group of alcohol is:',
          options: [
            { value: '-OH', isCorrect: true },
            { value: '-CHO', isCorrect: false },
            { value: '-COOH', isCorrect: false },
            { value: '-NH2', isCorrect: false },
          ],
        },
        {
          title: 'Ethane belongs to which class?',
          options: [
            { value: 'Alkanes', isCorrect: true },
            { value: 'Alkenes', isCorrect: false },
            { value: 'Alkynes', isCorrect: false },
            { value: 'Aromatics', isCorrect: false },
          ],
        },
        {
          title: 'General formula of alkanes is:',
          options: [
            { value: 'CnH2n+2', isCorrect: true },
            { value: 'CnH2n', isCorrect: false },
            { value: 'CnH2n-2', isCorrect: false },
            { value: 'CnHn', isCorrect: false },
          ],
        },
      ],
    });

    await ensureSubjectTest(testRepo, questionRepo, optionRepo, {
      title: 'FSc Part-II Biology - Human Physiology Quick Test',
      category: subjectTestsCategory,
      grade: grade12,
      subject: biology,
      total_duration: 30,
      questions: [
        {
          title: 'The functional unit of kidney is:',
          options: [
            { value: 'Nephron', isCorrect: true },
            { value: 'Neuron', isCorrect: false },
            { value: 'Alveolus', isCorrect: false },
            { value: 'Sarcomere', isCorrect: false },
          ],
        },
        {
          title: 'Normal human body temperature is:',
          options: [
            { value: '37°C', isCorrect: true },
            { value: '35°C', isCorrect: false },
            { value: '39°C', isCorrect: false },
            { value: '40°C', isCorrect: false },
          ],
        },
        {
          title: 'Insulin is secreted by:',
          options: [
            { value: 'Pancreas', isCorrect: true },
            { value: 'Liver', isCorrect: false },
            { value: 'Kidney', isCorrect: false },
            { value: 'Spleen', isCorrect: false },
          ],
        },
      ],
    });

    // Entry tests
    await ensureEntryTestWithoutDivisions(testRepo, questionRepo, optionRepo, {
      title: 'MDCAT Biology & Chemistry Mini Mock',
      category: entryTestsCategory,
      total_duration: 40,
      questions: [
        {
          title: 'The powerhouse of the cell is:',
          options: [
            { value: 'Mitochondria', isCorrect: true },
            { value: 'Ribosome', isCorrect: false },
            { value: 'Nucleus', isCorrect: false },
            { value: 'Golgi body', isCorrect: false },
          ],
        },
        {
          title: 'pH less than 7 indicates:',
          options: [
            { value: 'Acidic solution', isCorrect: true },
            { value: 'Basic solution', isCorrect: false },
            { value: 'Neutral solution', isCorrect: false },
            { value: 'Salt solution', isCorrect: false },
          ],
        },
        {
          title: 'DNA stands for:',
          options: [
            { value: 'Deoxyribonucleic Acid', isCorrect: true },
            { value: 'Dinitro Acid', isCorrect: false },
            { value: 'Dynamic Nucleic Acid', isCorrect: false },
            { value: 'Double Nitrogen Acid', isCorrect: false },
          ],
        },
      ],
    });

    await ensureEntryTestWithDivisions(testRepo, questionRepo, optionRepo, {
      title: 'ECAT Engineering Prep Mock (With Divisions)',
      category: entryTestsCategory,
      total_duration: 90,
      divisions: [
        {
          title: 'ECAT Mathematics Division',
          subject: math,
          total_duration: 45,
          questions: [
            {
              title: 'Derivative of x^2 is:',
              options: [
                { value: '2x', isCorrect: true },
                { value: 'x', isCorrect: false },
                { value: 'x^3', isCorrect: false },
                { value: '1', isCorrect: false },
              ],
            },
            {
              title: 'Value of log10(1000) is:',
              options: [
                { value: '3', isCorrect: true },
                { value: '2', isCorrect: false },
                { value: '10', isCorrect: false },
                { value: '1', isCorrect: false },
              ],
            },
            {
              title: 'A quadratic equation has degree:',
              options: [
                { value: '2', isCorrect: true },
                { value: '1', isCorrect: false },
                { value: '3', isCorrect: false },
                { value: '4', isCorrect: false },
              ],
            },
          ],
        },
        {
          title: 'ECAT Physics Division',
          subject: physics,
          total_duration: 45,
          questions: [
            {
              title: 'SI unit of force is:',
              options: [
                { value: 'Newton', isCorrect: true },
                { value: 'Joule', isCorrect: false },
                { value: 'Watt', isCorrect: false },
                { value: 'Pascal', isCorrect: false },
              ],
            },
            {
              title: 'Speed of light in vacuum is approximately:',
              options: [
                { value: '3 x 10^8 m/s', isCorrect: true },
                { value: '3 x 10^6 m/s', isCorrect: false },
                { value: '3 x 10^5 km/s', isCorrect: false },
                { value: '1.5 x 10^8 m/s', isCorrect: false },
              ],
            },
            {
              title: 'Work done equals:',
              options: [
                { value: 'Force x displacement', isCorrect: true },
                { value: 'Mass x velocity', isCorrect: false },
                { value: 'Power x time squared', isCorrect: false },
                { value: 'Current x resistance', isCorrect: false },
              ],
            },
          ],
        },
      ],
    });

    await ensureEntryTestWithoutDivisions(testRepo, questionRepo, optionRepo, {
      title: 'NUST NET Basic Quantitative & Analytical Mock',
      category: entryTestsCategory,
      total_duration: 35,
      questions: [
        {
          title: 'If 3x + 5 = 20, x = ?',
          options: [
            { value: '5', isCorrect: true },
            { value: '4', isCorrect: false },
            { value: '6', isCorrect: false },
            { value: '7', isCorrect: false },
          ],
        },
        {
          title: 'Which number is a prime number?',
          options: [
            { value: '29', isCorrect: true },
            { value: '21', isCorrect: false },
            { value: '27', isCorrect: false },
            { value: '39', isCorrect: false },
          ],
        },
        {
          title: 'Average of 10, 20, and 30 is:',
          options: [
            { value: '20', isCorrect: true },
            { value: '15', isCorrect: false },
            { value: '25', isCorrect: false },
            { value: '30', isCorrect: false },
          ],
        },
      ],
    });

    // Jobs metadata
    const educationIndustry = await ensureByName(industryRepo, 'Education');
    const edtechIndustry = await ensureByName(industryRepo, 'EdTech');
    const healthcareIndustry = await ensureByName(industryRepo, 'Healthcare');

    const teachingDept = await ensureByName(departmentRepo, 'Teaching');
    const contentDept = await ensureByName(departmentRepo, 'Content Development');
    const counselingDept = await ensureByName(departmentRepo, 'Career Counseling');

    const lahore = await ensureByName(locationRepo, 'Lahore');
    const karachi = await ensureByName(locationRepo, 'Karachi');
    const islamabad = await ensureByName(locationRepo, 'Islamabad');

    const entryLevel = await ensureByName(careerLevelRepo, 'Entry Level');
    const midLevel = await ensureByName(careerLevelRepo, 'Mid Level');

    const jobsSeed = [
      {
        title: 'Secondary School Mathematics Teacher',
        industry: educationIndustry,
        department: teachingDept,
        location: lahore,
        careerLevel: midLevel,
        division: 'Punjab',
        district: 'Lahore',
        degree_level: 'BS',
        degree_area: 'Mathematics',
        total_positions: 8,
        role: 'Teacher',
        project: 'Matric & FSc Prep Program',
        employment_status: EmploymentStatus.FULL_TIME,
        monthly_salary: 120000,
        job_description:
          'Deliver mathematics classes for Matric/FSc students and conduct weekly assessments aligned with Pakistani board syllabus.',
        notes: 'Preference for candidates with board exam coaching experience.',
        level: 'School',
        status: Status.ACTIVE,
        job_posted: new Date('2026-04-10'),
        last_date_to_apply: new Date('2026-05-15'),
        preferred_candidate: {
          years_of_experience: 3,
          required_division: 'First Division',
          gender: Gender.ANY,
          min_age: 24,
          max_age: 40,
        },
      },
      {
        title: 'Physics Content Developer',
        industry: edtechIndustry,
        department: contentDept,
        location: karachi,
        careerLevel: midLevel,
        division: 'Sindh',
        district: 'Karachi',
        degree_level: 'BS/MS',
        degree_area: 'Physics',
        total_positions: 3,
        role: 'Content Specialist',
        project: 'ECAT and Board Physics Question Bank',
        employment_status: EmploymentStatus.CONTRACT,
        monthly_salary: 180000,
        job_description:
          'Design MCQs, explanations, and chapter-wise test sets for Class 11-12 and ECAT level Physics.',
        notes: 'Strong command over Punjab Board and Federal Board patterns is preferred.',
        level: 'Academic Content',
        status: Status.ACTIVE,
        job_posted: new Date('2026-04-12'),
        last_date_to_apply: new Date('2026-05-20'),
        preferred_candidate: {
          years_of_experience: 2,
          required_division: 'First Division',
          gender: Gender.ANY,
          min_age: 22,
          max_age: 38,
        },
      },
      {
        title: 'Student Career Counselor',
        industry: educationIndustry,
        department: counselingDept,
        location: islamabad,
        careerLevel: entryLevel,
        division: 'Islamabad Capital Territory',
        district: 'Islamabad',
        degree_level: 'BS',
        degree_area: 'Psychology / Education',
        total_positions: 2,
        role: 'Counselor',
        project: 'University Admissions Support',
        employment_status: EmploymentStatus.FULL_TIME,
        monthly_salary: 95000,
        job_description:
          'Guide students regarding MDCAT, ECAT, and university admissions in Pakistan with structured counseling sessions.',
        notes: 'Knowledge of admission timelines of major public universities is required.',
        level: 'Student Services',
        status: Status.ACTIVE,
        job_posted: new Date('2026-04-08'),
        last_date_to_apply: new Date('2026-05-10'),
        preferred_candidate: {
          years_of_experience: 1,
          required_division: 'Second Division',
          gender: Gender.ANY,
          min_age: 22,
          max_age: 35,
        },
      },
      {
        title: 'MDCAT Preparation Coordinator',
        industry: healthcareIndustry,
        department: contentDept,
        location: lahore,
        careerLevel: midLevel,
        division: 'Punjab',
        district: 'Lahore',
        degree_level: 'MBBS / Pharm-D / BS',
        degree_area: 'Medical Sciences',
        total_positions: 2,
        role: 'Academic Coordinator',
        project: 'Medical Entry Test Program',
        employment_status: EmploymentStatus.FULL_TIME,
        monthly_salary: 150000,
        job_description:
          'Coordinate MDCAT preparation schedules, mock tests, and performance tracking for aspirants across Pakistan.',
        notes: 'Prior experience in MDCAT coaching institutes is a strong plus.',
        level: 'Program Management',
        status: Status.ACTIVE,
        job_posted: new Date('2026-04-15'),
        last_date_to_apply: new Date('2026-05-25'),
        preferred_candidate: {
          years_of_experience: 3,
          required_division: 'First Division',
          gender: Gender.ANY,
          min_age: 25,
          max_age: 42,
        },
      },
      {
        title: 'Chemistry Lecturer (Intermediate)',
        industry: educationIndustry,
        department: teachingDept,
        location: karachi,
        careerLevel: midLevel,
        division: 'Sindh',
        district: 'Karachi',
        degree_level: 'MS/BS',
        degree_area: 'Chemistry',
        total_positions: 4,
        role: 'Lecturer',
        project: 'Intermediate Annual Exam Preparation',
        employment_status: EmploymentStatus.FULL_TIME,
        monthly_salary: 110000,
        job_description:
          'Teach Chemistry to HSSC students and conduct board-pattern paper practice sessions.',
        notes: 'Experience with Karachi board pattern preferred.',
        level: 'College',
        status: Status.ACTIVE,
        job_posted: new Date('2026-04-18'),
        last_date_to_apply: new Date('2026-05-28'),
        preferred_candidate: {
          years_of_experience: 2,
          required_division: 'First Division',
          gender: Gender.ANY,
          min_age: 23,
          max_age: 40,
        },
      },
      {
        title: 'Academic QA Specialist (MCQ Validation)',
        industry: edtechIndustry,
        department: contentDept,
        location: islamabad,
        careerLevel: midLevel,
        division: 'Islamabad Capital Territory',
        district: 'Islamabad',
        degree_level: 'BS',
        degree_area: 'Computer Science / Education',
        total_positions: 2,
        role: 'QA Specialist',
        project: 'National-Level Test Bank Quality Initiative',
        employment_status: EmploymentStatus.CONTRACT,
        monthly_salary: 130000,
        job_description:
          'Validate question quality, difficulty level, and correctness for board and entry-test question banks.',
        notes: 'Prior EdTech QA experience is preferred.',
        level: 'Product Quality',
        status: Status.ACTIVE,
        job_posted: new Date('2026-04-20'),
        last_date_to_apply: new Date('2026-05-30'),
        preferred_candidate: {
          years_of_experience: 2,
          required_division: 'First Division',
          gender: Gender.ANY,
          min_age: 24,
          max_age: 38,
        },
      },
    ];

    for (const seed of jobsSeed) {
      let job = await jobRepo.findOne({
        where: {
          title: seed.title,
          location: { id: seed.location.id },
          industry: { id: seed.industry.id },
        },
        relations: ['location', 'industry', 'preferredCandidate'],
      });

      if (!job) {
        job = await jobRepo.save(
          jobRepo.create({
            title: seed.title,
            industry: seed.industry,
            department: seed.department,
            location: seed.location,
            division: seed.division,
            district: seed.district,
            careerLevel: seed.careerLevel,
            degree_level: seed.degree_level,
            degree_area: seed.degree_area,
            total_positions: seed.total_positions,
            role: seed.role,
            project: seed.project,
            employment_status: seed.employment_status,
            monthly_salary: seed.monthly_salary,
            job_description: seed.job_description,
            notes: seed.notes,
            level: seed.level,
            status: seed.status,
            job_posted: seed.job_posted,
            last_date_to_apply: seed.last_date_to_apply,
          })
        );
      }

      if (!job.preferredCandidate) {
        await preferredRepo.save(
          preferredRepo.create({
            ...seed.preferred_candidate,
            job,
          })
        );
      }
    }

    // Universities + merit lists
    const universitySeed = [
      { name: 'National University of Sciences and Technology (NUST)', city: 'Islamabad', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 79.2 }, { degree: 'BS Software Engineering', lastYearClosingMerit: 78.6 }, { degree: 'BS Electrical Engineering', lastYearClosingMerit: 74.4 }] },
      { name: 'Quaid-i-Azam University (QAU)', city: 'Islamabad', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 84.0 }, { degree: 'BS Mathematics', lastYearClosingMerit: 82.3 }, { degree: 'BS Physics', lastYearClosingMerit: 79.1 }] },
      { name: 'COMSATS University Islamabad', city: 'Islamabad', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 86.1 }, { degree: 'BS Software Engineering', lastYearClosingMerit: 84.5 }, { degree: 'BS Electrical Engineering', lastYearClosingMerit: 80.8 }] },
      { name: 'International Islamic University Islamabad (IIUI)', city: 'Islamabad', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 73.2 }, { degree: 'BS Mathematics', lastYearClosingMerit: 70.4 }, { degree: 'BS Economics', lastYearClosingMerit: 68.75 }] },
      { name: 'National University of Modern Languages (NUML)', city: 'Islamabad', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 71.4 }, { degree: 'BS Software Engineering', lastYearClosingMerit: 69.85 }, { degree: 'BBA', lastYearClosingMerit: 67.3 }] },
      { name: 'Air University', city: 'Islamabad', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 82.2 }, { degree: 'BS Cyber Security', lastYearClosingMerit: 80.6 }, { degree: 'BS Aerospace Engineering', lastYearClosingMerit: 76.9 }] },
      { name: 'University of the Punjab', city: 'Lahore', merits: [{ degree: 'BS Information Technology', lastYearClosingMerit: 85.4 }, { degree: 'BS Commerce', lastYearClosingMerit: 78.0 }, { degree: 'BS Economics', lastYearClosingMerit: 81.5 }] },
      { name: 'University of Engineering and Technology (UET Lahore)', city: 'Lahore', merits: [{ degree: 'BSc Civil Engineering', lastYearClosingMerit: 86.9 }, { degree: 'BSc Mechanical Engineering', lastYearClosingMerit: 85.3 }, { degree: 'BSc Computer Engineering', lastYearClosingMerit: 84.1 }] },
      { name: 'Lahore University of Management Sciences (LUMS)', city: 'Lahore', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 89.2 }, { degree: 'BSc Economics', lastYearClosingMerit: 87.4 }, { degree: 'BBA', lastYearClosingMerit: 86.9 }] },
      { name: 'Government College University Lahore', city: 'Lahore', merits: [{ degree: 'BS Chemistry', lastYearClosingMerit: 77.8 }, { degree: 'BS Physics', lastYearClosingMerit: 79.2 }, { degree: 'BS Zoology', lastYearClosingMerit: 74.1 }] },
      { name: 'University of Lahore', city: 'Lahore', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 72.4 }, { degree: 'Doctor of Physical Therapy', lastYearClosingMerit: 75.6 }, { degree: 'BBA', lastYearClosingMerit: 69.5 }] },
      { name: 'University of Central Punjab', city: 'Lahore', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 74.3 }, { degree: 'BS Software Engineering', lastYearClosingMerit: 72.2 }, { degree: 'BBA', lastYearClosingMerit: 70.1 }] },
      { name: 'University of Karachi', city: 'Karachi', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 78.5 }, { degree: 'BS Biotechnology', lastYearClosingMerit: 76.2 }, { degree: 'BBA', lastYearClosingMerit: 73.0 }] },
      { name: 'NED University of Engineering and Technology', city: 'Karachi', merits: [{ degree: 'BE Software Engineering', lastYearClosingMerit: 87.4 }, { degree: 'BE Electrical Engineering', lastYearClosingMerit: 84.9 }, { degree: 'BE Mechanical Engineering', lastYearClosingMerit: 82.6 }] },
      { name: 'Institute of Business Administration (IBA Karachi)', city: 'Karachi', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 83.8 }, { degree: 'BBA', lastYearClosingMerit: 82.4 }, { degree: 'BS Economics and Mathematics', lastYearClosingMerit: 80.7 }] },
      { name: 'Dow University of Health Sciences', city: 'Karachi', merits: [{ degree: 'MBBS', lastYearClosingMerit: 91.5 }, { degree: 'BDS', lastYearClosingMerit: 89.3 }, { degree: 'Doctor of Pharmacy', lastYearClosingMerit: 84.6 }] },
      { name: 'FAST NUCES Karachi', city: 'Karachi', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 84.7 }, { degree: 'BS Software Engineering', lastYearClosingMerit: 83.2 }, { degree: 'BS Artificial Intelligence', lastYearClosingMerit: 82.1 }] },
      { name: 'Sir Syed University of Engineering and Technology', city: 'Karachi', merits: [{ degree: 'BE Civil Engineering', lastYearClosingMerit: 70.9 }, { degree: 'BE Computer Engineering', lastYearClosingMerit: 73.4 }, { degree: 'BE Electrical Engineering', lastYearClosingMerit: 71.6 }] },
      { name: 'University of Peshawar', city: 'Peshawar', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 74.8 }, { degree: 'BS Statistics', lastYearClosingMerit: 72.9 }, { degree: 'BBA', lastYearClosingMerit: 70.5 }] },
      { name: 'University of Engineering and Technology Peshawar', city: 'Peshawar', merits: [{ degree: 'BSc Civil Engineering', lastYearClosingMerit: 81.3 }, { degree: 'BSc Mechanical Engineering', lastYearClosingMerit: 79.7 }, { degree: 'BSc Electrical Engineering', lastYearClosingMerit: 78.2 }] },
      { name: 'Institute of Management Sciences (IMSciences)', city: 'Peshawar', merits: [{ degree: 'BBA', lastYearClosingMerit: 76.1 }, { degree: 'BS Accounting and Finance', lastYearClosingMerit: 74.2 }, { degree: 'BS Computer Science', lastYearClosingMerit: 73.6 }] },
      { name: 'Khyber Medical University', city: 'Peshawar', merits: [{ degree: 'MBBS', lastYearClosingMerit: 90.8 }, { degree: 'BDS', lastYearClosingMerit: 88.2 }, { degree: 'Doctor of Physical Therapy', lastYearClosingMerit: 81.4 }] },
      { name: 'Bahauddin Zakariya University (BZU)', city: 'Multan', merits: [{ degree: 'BS Information Technology', lastYearClosingMerit: 77.4 }, { degree: 'BS Economics', lastYearClosingMerit: 75.8 }, { degree: 'BBA', lastYearClosingMerit: 73.6 }] },
      { name: 'NFC Institute of Engineering and Technology', city: 'Multan', merits: [{ degree: 'BSc Chemical Engineering', lastYearClosingMerit: 74.2 }, { degree: 'BSc Electrical Engineering', lastYearClosingMerit: 72.8 }, { degree: 'BSc Mechanical Engineering', lastYearClosingMerit: 71.1 }] },
      { name: 'The Women University Multan', city: 'Multan', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 71.5 }, { degree: 'BS Psychology', lastYearClosingMerit: 69.8 }, { degree: 'BBA', lastYearClosingMerit: 68.2 }] },
      { name: 'Muhammad Nawaz Shareef University of Agriculture', city: 'Multan', merits: [{ degree: 'BS Agriculture', lastYearClosingMerit: 75.6 }, { degree: 'BS Food Science and Technology', lastYearClosingMerit: 73.2 }, { degree: 'BS Environmental Sciences', lastYearClosingMerit: 71.4 }] },
      { name: 'University of Agriculture Faisalabad', city: 'Faisalabad', merits: [{ degree: 'BSc Agriculture', lastYearClosingMerit: 86.2 }, { degree: 'DVM', lastYearClosingMerit: 88.6 }, { degree: 'BS Food Science and Technology', lastYearClosingMerit: 82.1 }] },
      { name: 'Government College University Faisalabad', city: 'Faisalabad', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 73.9 }, { degree: 'BS Mathematics', lastYearClosingMerit: 72.4 }, { degree: 'BS Physics', lastYearClosingMerit: 71.3 }] },
      { name: 'University of Faisalabad', city: 'Faisalabad', merits: [{ degree: 'MBBS', lastYearClosingMerit: 89.7 }, { degree: 'Doctor of Pharmacy', lastYearClosingMerit: 82.9 }, { degree: 'BS Computer Science', lastYearClosingMerit: 70.8 }] },
      { name: 'Fatima Jinnah Women University', city: 'Rawalpindi', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 74.1 }, { degree: 'BS Psychology', lastYearClosingMerit: 72.2 }, { degree: 'BBA', lastYearClosingMerit: 70.4 }] },
      { name: 'Pir Mehr Ali Shah Arid Agriculture University', city: 'Rawalpindi', merits: [{ degree: 'BS Agriculture', lastYearClosingMerit: 76.8 }, { degree: 'BS Environmental Science', lastYearClosingMerit: 73.6 }, { degree: 'BS Computer Science', lastYearClosingMerit: 72.5 }] },
      { name: 'University of Sindh', city: 'Jamshoro', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 72.2 }, { degree: 'BS English', lastYearClosingMerit: 69.4 }, { degree: 'BBA', lastYearClosingMerit: 68.9 }] },
      { name: 'Mehran University of Engineering and Technology', city: 'Jamshoro', merits: [{ degree: 'BE Software Engineering', lastYearClosingMerit: 82.3 }, { degree: 'BE Civil Engineering', lastYearClosingMerit: 80.4 }, { degree: 'BE Electrical Engineering', lastYearClosingMerit: 79.6 }] },
      { name: 'University of Balochistan', city: 'Quetta', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 67.8 }, { degree: 'BS Management Sciences', lastYearClosingMerit: 65.2 }, { degree: 'BS Physics', lastYearClosingMerit: 64.3 }] },
      { name: 'Balochistan University of Information Technology, Engineering and Management Sciences', city: 'Quetta', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 72.6 }, { degree: 'BSc Electrical Engineering', lastYearClosingMerit: 70.3 }, { degree: 'BBA', lastYearClosingMerit: 68.9 }] },
      { name: 'Sukkur IBA University', city: 'Sukkur', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 80.2 }, { degree: 'BBA', lastYearClosingMerit: 78.4 }, { degree: 'BS Accounting and Finance', lastYearClosingMerit: 77.1 }] },
      { name: 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology', city: 'Swabi', merits: [{ degree: 'BS Computer Engineering', lastYearClosingMerit: 88.9 }, { degree: 'BS Mechanical Engineering', lastYearClosingMerit: 87.1 }, { degree: 'BS Electrical Engineering', lastYearClosingMerit: 86.4 }] },
      { name: 'COMSATS University Abbottabad Campus', city: 'Abbottabad', merits: [{ degree: 'BS Computer Science', lastYearClosingMerit: 78.1 }, { degree: 'BS Software Engineering', lastYearClosingMerit: 76.8 }, { degree: 'BS Civil Engineering', lastYearClosingMerit: 74.9 }] },
    ];

    for (const item of universitySeed) {
      await ensureUniversityWithMerits(universityRepo, universityMeritRepo, item);
    }

    // Past papers and exam categories
    const boardExams = await ensureExamCategory(examCategoryRepo, 'Board Exams');
    const entryExams = await ensureExamCategory(examCategoryRepo, 'Entry Tests');

    const biseLahore = await ensureExamCategory(
      examCategoryRepo,
      'BISE Lahore',
      boardExams
    );
    const biseRawalpindi = await ensureExamCategory(
      examCategoryRepo,
      'BISE Rawalpindi',
      boardExams
    );
    const biseFaisalabad = await ensureExamCategory(
      examCategoryRepo,
      'BISE Faisalabad',
      boardExams
    );
    const biseMultan = await ensureExamCategory(
      examCategoryRepo,
      'BISE Multan',
      boardExams
    );
    const biseKarachi = await ensureExamCategory(
      examCategoryRepo,
      'BISE Karachi',
      boardExams
    );
    const bisePeshawar = await ensureExamCategory(
      examCategoryRepo,
      'BISE Peshawar',
      boardExams
    );
    const biseQuetta = await ensureExamCategory(
      examCategoryRepo,
      'BISE Quetta',
      boardExams
    );
    const fbise = await ensureExamCategory(
      examCategoryRepo,
      'FBISE Islamabad',
      boardExams
    );

    const mdcat = await ensureExamCategory(examCategoryRepo, 'MDCAT', entryExams);
    const ecat = await ensureExamCategory(examCategoryRepo, 'ECAT', entryExams);

    const pastPapersSeed: Array<{
      category: ExamCategory;
      board: ExamCategory | null;
      grade: Grade | null;
      subject: Subject | null;
      year: number;
      file: string;
    }> = [
      {
        category: boardExams,
        board: biseLahore,
        grade: grade11,
        subject: math,
        year: 2023,
        file: 'https://example.com/past-papers/pakistan/bise-lahore-grade11-math-2023.pdf',
      },
      {
        category: boardExams,
        board: biseLahore,
        grade: grade12,
        subject: chemistry,
        year: 2022,
        file: 'https://www.biselahore.com/',
      },
      {
        category: boardExams,
        board: biseRawalpindi,
        grade: grade11,
        subject: physics,
        year: 2023,
        file: 'https://biserawalpindi.edu.pk/',
      },
      {
        category: boardExams,
        board: biseRawalpindi,
        grade: grade12,
        subject: biology,
        year: 2022,
        file: 'https://biserawalpindi.edu.pk/',
      },
      {
        category: boardExams,
        board: biseFaisalabad,
        grade: grade11,
        subject: chemistry,
        year: 2023,
        file: 'https://www.bisefsd.edu.pk/',
      },
      {
        category: boardExams,
        board: biseMultan,
        grade: grade12,
        subject: math,
        year: 2021,
        file: 'https://web.bisemultan.edu.pk/',
      },
      {
        category: boardExams,
        board: fbise,
        grade: grade12,
        subject: physics,
        year: 2022,
        file: 'https://example.com/past-papers/pakistan/fbise-grade12-physics-2022.pdf',
      },
      {
        category: boardExams,
        board: fbise,
        grade: grade11,
        subject: chemistry,
        year: 2023,
        file: 'https://www.fbise.edu.pk/AllOldPapers.php',
      },
      {
        category: boardExams,
        board: fbise,
        grade: grade12,
        subject: biology,
        year: 2024,
        file: 'https://www.fbise.edu.pk/Old%20Question%20Paper.php',
      },
      {
        category: boardExams,
        board: biseKarachi,
        grade: grade12,
        subject: chemistry,
        year: 2021,
        file: 'https://example.com/past-papers/pakistan/bise-karachi-grade12-chemistry-2021.pdf',
      },
      {
        category: boardExams,
        board: biseKarachi,
        grade: grade11,
        subject: math,
        year: 2023,
        file: 'https://www.biek.edu.pk/',
      },
      {
        category: boardExams,
        board: bisePeshawar,
        grade: grade12,
        subject: physics,
        year: 2022,
        file: 'https://www.bisep.edu.pk/',
      },
      {
        category: boardExams,
        board: biseQuetta,
        grade: grade11,
        subject: biology,
        year: 2022,
        file: 'https://bbiseqta.edu.pk/',
      },
      {
        category: mdcat,
        board: null,
        grade: null,
        subject: biology,
        year: 2023,
        file: 'https://www.pmdc.pk/Admissions/MedicalandDentalCollegeAdmissionTestMDCAT.aspx',
      },
      {
        category: ecat,
        board: null,
        grade: null,
        subject: math,
        year: 2022,
        file: 'https://admission.uet.edu.pk/',
      },
      {
        category: ecat,
        board: null,
        grade: null,
        subject: physics,
        year: 2023,
        file: 'https://admission.uet.edu.pk/',
      },
    ];

    for (const seed of pastPapersSeed) {
      const existing = await pastPaperRepo.findOne({
        where: {
          category: { id: seed.category.id },
          board: seed.board ? { id: seed.board.id } : undefined,
          grade: seed.grade ? { id: seed.grade.id } : undefined,
          subject: seed.subject ? { id: seed.subject.id } : undefined,
          year: seed.year,
        },
      });

      if (!existing) {
        await pastPaperRepo.save(
          pastPaperRepo.create({
            category: seed.category,
            board: seed.board ?? null,
            grade: seed.grade ?? null,
            subject: seed.subject ?? null,
            year: seed.year,
            file: seed.file,
            status: Status.ACTIVE,
          })
        );
      }
    }

    console.log('Education seed data inserted/verified successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error while seeding education data:', error);
    process.exit(1);
  }
}

void seed();
