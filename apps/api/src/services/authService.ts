import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../errors.js';
import { env } from '../env.js';

interface RegisterInput {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string | null;
    displayName: string | null;
    tier: string;
  };
  token: string;
}

const SALT_ROUNDS = 10;

export class AuthService {
  /**
   * Generate JWT token for authenticated user
   */
  private static generateToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: '7d', // Token expires in 7 days
    });
  }

  /**
   * Verify JWT token and return userId
   */
  static verifyToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      throw new ApiError('Invalid or expired token', {
        statusCode: 401,
        code: 'INVALID_TOKEN',
      });
    }
  }

  /**
   * Register new user with email and password
   */
  static async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, username, displayName } = input;

    // Validate password strength (at least 8 characters)
    if (password.length < 8) {
      throw new ApiError('Password must be at least 8 characters long', {
        statusCode: 400,
        code: 'WEAK_PASSWORD',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError('User with this email already exists', {
        statusCode: 409,
        code: 'USER_EXISTS',
      });
    }

    // Check if username is taken (if provided)
    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        throw new ApiError('Username already taken', {
          statusCode: 409,
          code: 'USERNAME_TAKEN',
        });
      }
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail) {
        throw new ApiError('Email already registered', {
          statusCode: 409,
          code: 'EMAIL_REGISTERED',
        });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username,
        displayName,
      },
    });

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        tier: user.tier,
      },
      token,
    };
  }

  /**
   * Login user with email and password
   */
  static async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError('Invalid email or password', {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError('Account is deactivated', {
        statusCode: 403,
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new ApiError('Invalid email or password', {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        tier: user.tier,
      },
      token,
    };
  }

  /**
   * Get user by ID (for authenticated requests)
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        tier: true,
        storageUsedMb: true,
        storageQuotaMb: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new ApiError('User not found', {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      });
    }

    return user;
  }
}
