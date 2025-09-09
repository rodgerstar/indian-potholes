import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

/**
 * Custom hook for form validation using Yup schemas and react-hook-form
 * @param {Object} schema - Yup validation schema
 * @param {Object} defaultValues - Default form values
 * @param {Object} options - Additional options for react-hook-form
 * @returns {Object} Form state and validation methods
 */
const useFormValidation = (schema, defaultValues = {}, options = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues,
    mode: 'onChange', // Validate on change
    ...options,
  });

  const { 
    handleSubmit, 
    formState: { errors, isValid, isDirty },
    reset,
    setValue,
    watch,
    trigger,
    clearErrors,
    setError,
  } = form;

  /**
   * Validate a single field
   * @param {string} fieldName - Name of the field to validate
   * @returns {Promise<boolean>} Validation result
   */
  const validateField = useCallback(async (fieldName) => {
    try {
      return await trigger(fieldName);
    } catch (error) {
      console.error('Field validation error:', error);
      return false;
    }
  }, [trigger]);

  /**
   * Validate specific fields
   * @param {string[]} fieldNames - Array of field names to validate
   * @returns {Promise<boolean>} Validation result
   */
  const validateFields = useCallback(async (fieldNames) => {
    try {
      return await trigger(fieldNames);
    } catch (error) {
      console.error('Fields validation error:', error);
      return false;
    }
  }, [trigger]);

  /**
   * Get error message for a specific field
   * @param {string} fieldName - Name of the field
   * @returns {string|undefined} Error message
   */
  const getFieldError = useCallback((fieldName) => {
    return errors[fieldName]?.message;
  }, [errors]);

  /**
   * Check if a specific field has an error
   * @param {string} fieldName - Name of the field
   * @returns {boolean} Whether field has error
   */
  const hasFieldError = useCallback((fieldName) => {
    return !!errors[fieldName];
  }, [errors]);

  /**
   * Set multiple field values at once
   * @param {Object} values - Object with field names as keys and values
   */
  const setMultipleValues = useCallback((values) => {
    Object.entries(values).forEach(([fieldName, value]) => {
      setValue(fieldName, value, { shouldValidate: true, shouldDirty: true });
    });
  }, [setValue]);

  /**
   * Handle form submission with loading state
   * @param {Function} onSubmit - Submit handler function
   * @returns {Function} Form submit handler
   */
  const createSubmitHandler = useCallback((onSubmit) => {
    return handleSubmit(async (data) => {
      setIsSubmitting(true);
      try {
        await onSubmit(data);
      } catch (error) {
        // Handle submission errors
        if (error.fieldErrors) {
          // Set field-specific errors
          Object.entries(error.fieldErrors).forEach(([field, message]) => {
            setError(field, { type: 'server', message });
          });
        }
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    });
  }, [handleSubmit, setError]);

  /**
   * Reset form with new values
   * @param {Object} newValues - New default values
   */
  const resetForm = useCallback((newValues = defaultValues) => {
    reset(newValues);
    setIsSubmitting(false);
  }, [reset, defaultValues]);

  return {
    // React Hook Form methods
    ...form,
    
    // Custom validation methods
    validateField,
    validateFields,
    getFieldError,
    hasFieldError,
    setMultipleValues,
    createSubmitHandler,
    resetForm,
    
    // State
    isSubmitting,
    isValid,
    isDirty,
    errors,
    
    // Utility methods
    watch,
    setValue,
    clearErrors,
    setError,
  };
};

export default useFormValidation;