import * as yup from 'yup';

/**
 * Validation schema for pothole upload form
 */
export const potholeUploadSchema = yup.object({
  // Step 1: Media validation
  media: yup.array()
    .min(1, 'Please upload at least one photo or video')
    .max(5, 'Maximum 5 files allowed')
    .required('Media files are required'),

  // Step 2: Location validation
  locationName: yup.string()
    .trim()
    .min(3, 'Location name must be at least 3 characters')
    .max(200, 'Location name must be less than 200 characters')
    .required('Location name is required'),
  
  latitude: yup.number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude')
    .required('Please select a location on the map'),
  
  longitude: yup.number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude')
    .required('Please select a location on the map'),

  // Step 3: Constituency validation
  state: yup.string()
    .required('Please select a state'),
  
  constituency: yup.string()
    .required('Please select an assembly constituency'),
  
  parliamentaryConstituency: yup.string()
    .required('Please select a parliamentary constituency'),

  // Step 4: Severity and description
  severity: yup.string()
    .oneOf(['low', 'medium', 'high', 'critical'], 'Please select a valid severity level')
    .required('Please select a severity level'),
  
  description: yup.string()
    .max(500, 'Description must be less than 500 characters')
    .nullable(),

  // Optional authority fields
  mla: yup.string().nullable(),
  mp: yup.string().nullable(),
  corporator: yup.string().nullable(),
  contractor: yup.string().nullable(),
  engineer: yup.string().nullable(),
});

/**
 * Validation schema for user profile update
 */
export const profileUpdateSchema = yup.object({
  name: yup.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  
  phone: yup.string()
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number')
    .nullable(),
});

/**
 * Validation schema for login form
 */
export const loginSchema = yup.object({
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  
  password: yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

/**
 * Validation schema for registration form
 */
export const registrationSchema = yup.object({
  name: yup.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .required('Password is required'),
  
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
  
  phone: yup.string()
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number')
    .nullable(),
});

/**
 * Validation schema for contact form
 */
export const contactSchema = yup.object({
  name: yup.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  
  subject: yup.string()
    .trim()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject must be less than 100 characters')
    .required('Subject is required'),
  
  message: yup.string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .required('Message is required'),
});

/**
 * Validation schema for feedback form
 */
export const feedbackSchema = yup.object({
  rating: yup.number()
    .min(1, 'Please select a rating')
    .max(5, 'Rating must be between 1 and 5')
    .required('Rating is required'),
  
  feedback: yup.string()
    .trim()
    .min(10, 'Feedback must be at least 10 characters')
    .max(500, 'Feedback must be less than 500 characters')
    .required('Feedback is required'),
  
  category: yup.string()
    .oneOf(['bug', 'feature', 'improvement', 'other'], 'Please select a valid category')
    .required('Please select a feedback category'),
});