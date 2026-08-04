import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../prisma';
import { EmailService } from './email.service';
import { AppError } from '../errors';

export class AuthService {
  private jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  private emailService = new EmailService();

  async signup(email: string, password: string, name?: string, businessName: string = 'My Business', referralCode?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        businesses: {
          create: { name: businessName },
        },
      },
      include: { businesses: true },
    });

    // Link referral if a valid code was provided
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer && referrer.id !== user.id) {
        await prisma.referral.create({
          data: { referrerId: referrer.id, refereeId: user.id },
        }).catch(() => {}); // ignore duplicate if somehow re-used
      }
    }

    const token = this.generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;

    this.emailService.sendWelcomeEmail(email, name).catch(() => {});

    return { user: userWithoutPassword, token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { businesses: true },
    });

    if (!user) throw new AppError('Invalid credentials', 401);

    if (!user.password) {
      throw new AppError('This account uses Google sign-in. Please use the Google button.', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new AppError('Invalid credentials', 401);

    const token = this.generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async googleAuth(credential: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AppError('Invalid Google token', 401);
    }

    const { email, name, sub: googleId } = payload;

    // Find existing user or create a new one
    let user = await prisma.user.findUnique({
      where: { email },
      include: { businesses: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          // password left null — Google users sign in via OAuth only
          businesses: {
            create: { name: `${name || email.split('@')[0]}'s Business` },
          },
        },
        include: { businesses: true },
      });
    }

    const token = this.generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  private generateToken(userId: string) {
    return jwt.sign({ userId }, this.jwtSecret, { expiresIn: '7d' });
  }
}
