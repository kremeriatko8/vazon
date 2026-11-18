import { Injectable } from '@nestjs/common';
import type { Feedback } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateFeedbackDto } from './dto/create-feedback.dto.js';

/** Longest User-Agent kept (the column is VARCHAR(300)). */
const MAX_USER_AGENT = 300;

export interface FeedbackContext {
  /** The signed-in user, or undefined for an anonymous visitor. */
  userId?: string;
  userAgent?: string;
}

/** Stores feedback about the website. The team reads it from the database. */
@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateFeedbackDto,
    context: FeedbackContext,
  ): Promise<Feedback> {
    const data = {
      category: dto.category,
      message: dto.message,
      page: dto.page ?? null,
      userAgent: context.userAgent?.slice(0, MAX_USER_AGENT) || null,
    };
    try {
      return await this.prisma.feedback.create({
        data: { ...data, userId: context.userId ?? null },
      });
    } catch (error) {
      // P2003: the token's user no longer exists. Feedback is never lost
      // because of that: keep it as anonymous.
      if (context.userId && isPrismaCode(error, 'P2003')) {
        return this.prisma.feedback.create({ data: { ...data, userId: null } });
      }
      throw error;
    }
  }
}

function isPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}
