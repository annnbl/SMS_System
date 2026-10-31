/**
 * Validates password rules:
 * - more than 8 characters (> 8, i.e. length >= 9)
 * - an uppercase letter
 * - a lowercase letter
 * - a special character
 */
export const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required.',
    };
  }

  if (password.length <= 8) {
    return {
      isValid: false,
      message: 'Password must be more than 8 characters long.',
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  if (!hasUpperCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter.',
    };
  }

  if (!hasLowerCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter.',
    };
  }

  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character.',
    };
  }

  return { isValid: true };
};
