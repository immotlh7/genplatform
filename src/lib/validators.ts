import { z } from 'zod';

// Login schema
export const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

// Idea schema
export const ideaSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z
    .string()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Priority must be low, medium, or high' }),
  }),
  category: z.enum(['feature', 'improvement', 'bug', 'research'], {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
});

// Task schema
export const taskSchema = z.object({
  name: z
    .string()
    .min(3, 'Task name must be at least 3 characters')
    .max(200, 'Task name must not exceed 200 characters'),
  description: z
    .string()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  assignedRole: z.string().optional(),
});

// Chat message schema
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message must not exceed 4000 characters'),
  projectId: z.string().optional(),
});

// Memory file schema
export const memoryFileSchema = z.object({
  path: z
    .string()
    .min(1, 'Path is required')
    .max(500, 'Path must not exceed 500 characters')
    .refine((path) => !path.includes('..'), {
      message: 'Path cannot contain ".." (directory traversal)',
    }),
  content: z
    .string()
    .max(500000, 'Content must not exceed 500KB'),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type IdeaInput = z.infer<typeof ideaSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type MemoryFileInput = z.infer<typeof memoryFileSchema>;