import { z } from 'zod';



export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6),
    username: z
      .string()
      .min(3, 'Username deve ter no mínimo 3 caracteres')
      .max(20)
      .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e _'),
    display_name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(50),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  display_name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(50),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').nullable().optional(),
  favorite_humor_style: z.string().nullable().optional(),
});

export const videoSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(100),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional().or(z.literal('')),
  category: z.string().min(1, 'Categoria é obrigatória'),
  video_url: z.string().url('URL inválida').optional().or(z.literal('')),
  status: z.enum(['published', 'draft', 'archived']),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comentário não pode estar vazio').max(500),
});

export const messageSchema = z.object({
  content: z.string().min(1, 'Mensagem não pode estar vazia').max(1000),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const newPasswordSchema = z
  .object({
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type VideoFormData = z.infer<typeof videoSchema>;
export type CommentFormData = z.infer<typeof commentSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;
