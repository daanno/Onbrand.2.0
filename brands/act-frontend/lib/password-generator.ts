/**
 * Password Generator Utility
 * Generates strong, secure random passwords
 */

export interface PasswordConfig {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Generate a strong random password
 * 
 * @param config - Password configuration options
 * @returns A randomly generated password
 */
export function generatePassword(config: PasswordConfig = {}): string {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = config;

  let charset = '';
  let password = '';

  // Build character set
  if (includeUppercase) charset += UPPERCASE;
  if (includeLowercase) charset += LOWERCASE;
  if (includeNumbers) charset += NUMBERS;
  if (includeSymbols) charset += SYMBOLS;

  if (charset.length === 0) {
    throw new Error('At least one character type must be included');
  }

  // Generate password
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  // Ensure password meets requirements (at least one of each selected type)
  if (includeUppercase && !/[A-Z]/.test(password)) {
    password = replaceRandomChar(password, UPPERCASE);
  }
  if (includeLowercase && !/[a-z]/.test(password)) {
    password = replaceRandomChar(password, LOWERCASE);
  }
  if (includeNumbers && !/[0-9]/.test(password)) {
    password = replaceRandomChar(password, NUMBERS);
  }
  if (includeSymbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    password = replaceRandomChar(password, SYMBOLS);
  }

  return password;
}

/**
 * Replace a random character in a string with a character from the given set
 */
function replaceRandomChar(str: string, charset: string): string {
  const index = Math.floor(Math.random() * str.length);
  const char = charset[Math.floor(Math.random() * charset.length)];
  return str.substring(0, index) + char + str.substring(index + 1);
}

/**
 * Calculate password strength (0-100)
 * 
 * @param password - Password to evaluate
 * @returns Strength score from 0 (weak) to 100 (very strong)
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
} {
  let score = 0;

  // Length score (up to 40 points)
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;

  // Character variety (up to 60 points)
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 15;

  // Determine label and color
  let label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  let color: string;

  if (score < 20) {
    label = 'Very Weak';
    color = '#EF4444'; // red
  } else if (score < 40) {
    label = 'Weak';
    color = '#F59E0B'; // orange
  } else if (score < 60) {
    label = 'Fair';
    color = '#EAB308'; // yellow
  } else if (score < 80) {
    label = 'Strong';
    color = '#10B981'; // green
  } else {
    label = 'Very Strong';
    color = '#059669'; // dark green
  }

  return { score, label, color };
}
