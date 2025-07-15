/**
 * Validation utilities for authentication and security
 */

// Type definitions for validation results
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates JWT token format and security constraints
 * @param token - The JWT token to validate
 * @returns Validation result with success status and error message if invalid
 */
export const validateJWTToken = (token: string): ValidationResult => {
  if (!token || typeof token !== "string") {
    return { isValid: false, error: "Token is required" };
  }

  // Remove any whitespace
  token = token.trim();

  // Basic JWT format validation (header.payload.signature)
  const parts = token.split(".");

  // Check each part is base64url encoded
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  if (!parts.every((part) => part.length > 0 && base64UrlRegex.test(part))) {
    return {
      isValid: false,
      error: "Invalid JWT encoding. Token contains invalid characters.",
    };
  }

  // Security checks
  if (token.length > 8192) {
    return { isValid: false, error: "Token is too long" };
  }

  // Check for suspicious patterns
  if (
    token.includes("<") ||
    token.includes(">") ||
    token.includes('"') ||
    token.includes("'")
  ) {
    return { isValid: false, error: "Token contains invalid characters" };
  }

  return { isValid: true };
};

/**
 * Validates redirect URL for security (prevents open redirect attacks)
 * @param url - The redirect URL to validate
 * @returns Validation result with success status and error message if invalid
 */
export const validateRedirectUrl = (url: string): ValidationResult => {
  if (!url || typeof url !== "string") {
    return { isValid: false, error: "Redirect URL is required" };
  }

  // Only allow relative URLs starting with '/'
  if (!url.startsWith("/")) {
    return { isValid: false, error: "Only relative URLs are allowed" };
  }

  // Prevent double slashes and malicious patterns
  if (
    url.includes("//") ||
    url.includes("javascript:") ||
    url.includes("data:")
  ) {
    return { isValid: false, error: "Invalid redirect URL format" };
  }

  // Check for script injection attempts
  if (
    url.includes("<") ||
    url.includes(">") ||
    url.includes('"') ||
    url.includes("'")
  ) {
    return {
      isValid: false,
      error: "Redirect URL contains invalid characters",
    };
  }

  return { isValid: true };
};

/**
 * Sanitizes a string by trimming whitespace and removing potentially dangerous characters
 * @param input - The string to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (input: string): string => {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input.trim().replace(/[<>"']/g, "");
};

/**
 * Validates that a string is within acceptable length limits
 * @param input - The string to validate
 * @param maxLength - Maximum allowed length (default: 1000)
 * @param minLength - Minimum allowed length (default: 0)
 * @returns Validation result
 */
export const validateStringLength = (
  input: string,
  maxLength: number = 1000,
  minLength: number = 0
): ValidationResult => {
  if (!input || typeof input !== "string") {
    return { isValid: false, error: "Input is required" };
  }

  const length = input.length;

  if (length < minLength) {
    return {
      isValid: false,
      error: `Input must be at least ${minLength} characters long`,
    };
  }

  if (length > maxLength) {
    return {
      isValid: false,
      error: `Input must be no more than ${maxLength} characters long`,
    };
  }

  return { isValid: true };
};
