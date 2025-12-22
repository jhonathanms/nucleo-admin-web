/**
 * Validates password strength requirements
 */
export function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("A senha deve ter no mínimo 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra maiúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra minúscula");
  }

  if (!/\d/.test(password)) {
    errors.push("A senha deve conter pelo menos um número");
  }

  if (!/[@#$%^&+=!*()_-]/.test(password)) {
    errors.push("A senha deve conter pelo menos um caractere especial");
  }

  return errors;
}

/**
 * Checks if password meets all strength requirements
 */
export function isPasswordStrong(password: string): boolean {
  return validatePassword(password).length === 0;
}
