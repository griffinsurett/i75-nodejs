import { useState, useCallback, useMemo } from 'react';

/**
 * Main form state management hook
 */
export function useForm(initialValues = {}, options = {}) {
  const {
    validate,
    onSubmit,
    transformOnSubmit,
    resetOnSuccess = false,
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Handle field change
  const handleChange = useCallback((nameOrEvent, value) => {
    if (typeof nameOrEvent === 'object' && nameOrEvent.target) {
      // Handle event
      const { name, type, checked, value: targetValue } = nameOrEvent.target;
      const newValue = type === 'checkbox' ? checked : targetValue;
      setValues(prev => ({ ...prev, [name]: newValue }));
      
      // Clear field error on change
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
      }
    } else {
      // Handle direct value
      setValues(prev => ({ ...prev, [nameOrEvent]: value }));
      
      // Clear field error on change
      if (errors[nameOrEvent]) {
        setErrors(prev => ({ ...prev, [nameOrEvent]: undefined }));
      }
    }
  }, [errors]);

  // Handle field blur
  const handleBlur = useCallback((nameOrEvent) => {
    const name = typeof nameOrEvent === 'string' 
      ? nameOrEvent 
      : nameOrEvent.target.name;
    
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate single field if validator exists
    if (validate && validate[name]) {
      const error = validate[name](values[name], values);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [values, validate]);

  // Set field value programmatically
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  // Set multiple field values
  const setFieldValues = useCallback((newValues) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // Validate all fields
  const validateForm = useCallback(() => {
    if (!validate) return true;

    const newErrors = {};
    let isValid = true;

    // If validate is a function, call it with all values
    if (typeof validate === 'function') {
      const validationResult = validate(values);
      if (validationResult && typeof validationResult === 'object') {
        Object.assign(newErrors, validationResult);
        isValid = Object.keys(validationResult).length === 0;
      }
    } 
    // If validate is an object with field validators
    else if (typeof validate === 'object') {
      Object.keys(validate).forEach(field => {
        const error = validate[field](values[field], values);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      });
    }

    setErrors(newErrors);
    return isValid;
  }, [values, validate]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validate
    const isValid = validateForm();
    if (!isValid) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Transform values if needed
      const submitValues = transformOnSubmit 
        ? transformOnSubmit(values) 
        : values;

      // Call onSubmit
      if (onSubmit) {
        await onSubmit(submitValues);
      }

      // Reset form if configured
      if (resetOnSuccess) {
        reset();
      }
    } catch (error) {
      setSubmitError(
        error?.response?.data?.message || 
        error?.message || 
        'An error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit, transformOnSubmit, resetOnSuccess]);

  // Reset form
  const reset = useCallback((newValues) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({});
    setSubmitError('');
  }, [initialValues]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).every(key => !errors[key]);
  }, [errors]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  return {
    // State
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    isValid,
    isDirty,
    
    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldValues,
    validateForm,
    reset,
    
    // Utilities
    getFieldProps: (name) => ({
      name,
      value: values[name] || '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched[name] ? errors[name] : undefined,
    }),
  };
}