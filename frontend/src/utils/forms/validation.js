/**
 * Common validation functions
 */

export const validators = {
  required: (message = 'This field is required') => 
    (value) => {
      if (value === undefined || value === null || value === '') {
        return message;
      }
      if (Array.isArray(value) && value.length === 0) {
        return message;
      }
      if (typeof value === 'string' && !value.trim()) {
        return message;
      }
      return undefined;
    },

  minLength: (min, message) => 
    (value) => {
      const msg = message || `Must be at least ${min} characters`;
      if (!value) return undefined;
      return value.length < min ? msg : undefined;
    },

  maxLength: (max, message) => 
    (value) => {
      const msg = message || `Must be at most ${max} characters`;
      if (!value) return undefined;
      return value.length > max ? msg : undefined;
    },

  email: (message = 'Invalid email address') => 
    (value) => {
      if (!value) return undefined;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? undefined : message;
    },

  pattern: (regex, message = 'Invalid format') => 
    (value) => {
      if (!value) return undefined;
      return regex.test(value) ? undefined : message;
    },

  compose: (...validators) => 
    (value, allValues) => {
      for (const validator of validators) {
        const error = validator(value, allValues);
        if (error) return error;
      }
      return undefined;
    },
};

/**
 * Create a validation schema for a form
 */
export function createValidationSchema(schema) {
  return (values) => {
    const errors = {};
    
    Object.keys(schema).forEach(field => {
      const validator = schema[field];
      if (validator) {
        const error = validator(values[field], values);
        if (error) {
          errors[field] = error;
        }
      }
    });
    
    return errors;
  };
}