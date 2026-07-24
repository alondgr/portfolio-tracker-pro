import { prisma } from './prisma';

type LogLevel = 'ERROR' | 'WARN' | 'INFO';
type LogCategory = 'API' | 'DATABASE' | 'RUNTIME' | 'TYPE_MISMATCH';

/**
 * Safely logs a system error or anomaly to the database.
 * Fails silently so it does not interrupt the main application flow.
 */
export async function logSystemError(
  category: LogCategory,
  message: string,
  metadata?: any,
  level: LogLevel = 'ERROR'
) {
  try {
    // We do this asynchronously without awaiting to avoid blocking the main request cycle.
    // However, if called within a serverless function, ensure it has time to execute or await it if necessary.
    await prisma.systemHealthLog.create({
      data: {
        level,
        category,
        message,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      }
    });
  } catch (error) {
    // Fallback if the database logging itself fails
    console.error('Failed to write to SystemHealthLog:', error);
  }
}
