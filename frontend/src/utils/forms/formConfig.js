/**
 * Transform form values for submission
 */
export function transformFormValues(values, transforms = {}) {
  const transformed = { ...values };
  
  Object.keys(transforms).forEach(key => {
    const transform = transforms[key];
    if (transformed[key] !== undefined && transform) {
      transformed[key] = transform(transformed[key]);
    }
  });
  
  return transformed;
}

/**
 * Clean undefined values from form data
 */
export function cleanFormData(data) {
  const cleaned = {};
  
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      cleaned[key] = data[key];
    }
  });
  
  return cleaned;
}

/**
 * Prepare form data for API submission
 */
export function prepareFormData(values, options = {}) {
  const {
    include = [], // Fields to always include
    exclude = [], // Fields to exclude
    transform = {}, // Field transformations
    clean = true, // Remove undefined/null/empty values
  } = options;
  
  let data = { ...values };
  
  // Apply transformations
  data = transformFormValues(data, transform);
  
  // Clean if requested
  if (clean) {
    data = cleanFormData(data);
  }
  
  // Include specific fields
  include.forEach(field => {
    if (values[field] !== undefined) {
      data[field] = values[field];
    }
  });
  
  // Exclude specific fields
  exclude.forEach(field => {
    delete data[field];
  });
  
  return data;
}