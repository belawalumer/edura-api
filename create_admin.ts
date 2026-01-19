import { AppDataSource } from './src/data-source';
import { UserRole } from './src/common/enums';
import { User } from 'src/user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { generateRefreshToken } from 'src/auth/helpers/token.helper';

async function createAdmin() {
  try {
    await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(User);

    const adminPhone = process.env.ADMIN_PHONE;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminPhone || !adminPassword) {
      console.error(
        'ADMIN_PHONE and ADMIN_PASSWORD must be set in environment variables'
      );
      process.exit(1);
    }

    // Check if admin already exists by phone
    const existingAdmin = await userRepo.findOne({
      where: { phone: adminPhone },
    });

    if (existingAdmin) {
      console.log(' Admin already exists with this phone');
      process.exit(0);
    }

    // Hash password
    const hashedPassword: string = await bcrypt.hash(adminPassword, 10);

    const refreshToken = generateRefreshToken();

    const admin = userRepo.create({
      name: 'Admin',
      phone: adminPhone,
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      image: null,
      refreshToken,
    });

    await userRepo.save(admin);

    console.log('Admin created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

void createAdmin();
