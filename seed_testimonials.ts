import { DataSource } from 'typeorm';
import { Testimonial } from './src/testimonials/entities/testimonial.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'edura',
});

async function seedTestimonials() {
  await dataSource.initialize();
  console.log('Connected to database');

  const testimonials = [
    {
      name: 'Ahmed Khan',
      role: 'Medical Student',
      text: 'Edura helped me crack my medical entrance exam. The practice tests were incredibly similar to the real exam.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      rating: 5,
    },
    {
      name: 'Fatima Ali',
      role: 'Engineering Aspirant',
      text: 'The roadmap feature guided me through every step of my university application. Highly recommended!',
      avatar: 'https://images.unsplash.com/photo-1494790108378-be9c29b29330?w=150&h=150&fit=crop',
      rating: 5,
    },
    {
      name: 'Bilal Hassan',
      role: 'Job Seeker',
      text: 'Found my dream job through Edura job board. The application process was seamless.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-62f6e5a8f9e5?w=150&h=150&fit=crop',
      rating: 5,
    },
    {
      name: 'Ayesha Siddiqui',
      role: 'CS Student',
      text: 'The past papers section saved my semester. Amazing resource for computer science students!',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
      rating: 5,
    },
    {
      name: 'Hassan Raza',
      role: 'Business Administration',
      text: 'Entry test preparation has never been this organized. Edura made my dream of studying abroad come true.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
      rating: 5,
    },
    {
      name: 'Zara Khan',
      role: 'Law Student',
      text: 'The analytics helped me identify weak areas and improve. Now I am studying at my dream law school!',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
      rating: 5,
    },
  ];

  const repo = dataSource.getRepository(Testimonial);

  for (const testimonial of testimonials) {
    const existing = await repo.findOne({ where: { name: testimonial.name } });
    if (!existing) {
      await repo.save(repo.create(testimonial));
      console.log(`Created testimonial: ${testimonial.name}`);
    } else {
      console.log(`Testimonial already exists: ${testimonial.name}`);
    }
  }

  await dataSource.destroy();
  console.log('Seeding completed!');
}

seedTestimonials().catch(console.error);