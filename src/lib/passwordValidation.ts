import { z } from 'zod';

export function createPasswordSchema(tr: (pt: string, en: string) => string) {
  return z
    .string()
    .min(8, tr('A senha deve ter no mínimo 8 caracteres', 'Password must be at least 8 characters'))
    .regex(/[A-Z]/, tr('A senha deve conter pelo menos uma letra maiúscula', 'Password must contain at least one uppercase letter'))
    .regex(/[a-z]/, tr('A senha deve conter pelo menos uma letra minúscula', 'Password must contain at least one lowercase letter'))
    .regex(/[0-9]/, tr('A senha deve conter pelo menos um número', 'Password must contain at least one number'))
    .regex(/[@$!%*?&]/, tr('A senha deve conter pelo menos um caractere especial (@$!%*?&)', 'Password must contain at least one special character (@$!%*?&)'));
}
