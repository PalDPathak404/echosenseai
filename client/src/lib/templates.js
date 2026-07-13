// Business Templates Engine
import { Utensils, Stethoscope, Dumbbell, ShoppingBag, Scissors, GraduationCap, Building2 } from 'lucide-react';

export const BUSINESS_TEMPLATES = {
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant & Cafe',
    icon: Utensils,
    defaultWelcome: 'How was your dining experience with us?',
    ratingLabels: {
      1: 'Terrible',
      2: 'Poor',
      3: 'Okay',
      4: 'Good',
      5: 'Excellent'
    },
    followUpQuestions: {
      negative: 'We are so sorry to hear that. Was it the food, service, or wait time?',
      neutral: 'Thank you for visiting. How could we make your next meal better?',
      positive: 'Amazing! What was your favorite dish today?'
    },
    aiContext: 'The customer is reviewing a food and beverage establishment. Focus on food quality, service speed, ambiance, and cleanliness.'
  },
  hospital: {
    id: 'hospital',
    name: 'Hospital & Clinic',
    icon: Stethoscope,
    defaultWelcome: 'How was your visit today?',
    ratingLabels: {
      1: 'Unacceptable',
      2: 'Poor',
      3: 'Adequate',
      4: 'Good',
      5: 'Excellent'
    },
    followUpQuestions: {
      negative: 'We apologize. Was it related to wait time, staff, or facilities?',
      neutral: 'Thank you. How can we improve our patient care?',
      positive: 'Great to hear! Tell us what made your visit comfortable.'
    },
    aiContext: 'The customer is reviewing a healthcare facility. Focus on wait times, doctor/staff bedside manner, facility cleanliness, and overall patient care.'
  },
  gym: {
    id: 'gym',
    name: 'Gym & Fitness Center',
    icon: Dumbbell,
    defaultWelcome: 'How was your workout today?',
    ratingLabels: {
      1: 'Terrible',
      2: 'Poor',
      3: 'Okay',
      4: 'Good',
      5: 'Awesome'
    },
    followUpQuestions: {
      negative: 'Sorry about that. Was it equipment availability, cleanliness, or staff?',
      neutral: 'Thanks. How can we improve your fitness experience?',
      positive: 'Awesome! Keep up the great work. What did you like most?'
    },
    aiContext: 'The customer is reviewing a fitness center. Focus on equipment availability/condition, locker room cleanliness, staff helpfulness, and atmosphere.'
  },
  retail: {
    id: 'retail',
    name: 'Retail Store',
    icon: ShoppingBag,
    defaultWelcome: 'How was your shopping experience?',
    ratingLabels: {
      1: 'Terrible',
      2: 'Poor',
      3: 'Okay',
      4: 'Good',
      5: 'Excellent'
    },
    followUpQuestions: {
      negative: 'We apologize. Was it product availability, pricing, or staff assistance?',
      neutral: 'Thank you. What could we do better next time?',
      positive: 'Fantastic! Did you find everything you were looking for?'
    },
    aiContext: 'The customer is reviewing a retail store. Focus on product availability, store layout, staff assistance, and checkout experience.'
  },
  salon: {
    id: 'salon',
    name: 'Salon & Spa',
    icon: Scissors,
    defaultWelcome: 'How was your pampering session?',
    ratingLabels: {
      1: 'Awful',
      2: 'Poor',
      3: 'Okay',
      4: 'Good',
      5: 'Fabulous'
    },
    followUpQuestions: {
      negative: 'We are sorry. Was it the service, wait time, or environment?',
      neutral: 'Thank you. How can we enhance your next visit?',
      positive: 'Wonderful! What did you love most about your treatment?'
    },
    aiContext: 'The customer is reviewing a salon or spa. Focus on service quality, stylist/therapist skill, ambiance, and cleanliness.'
  },
  school: {
    id: 'school',
    name: 'Education & Training',
    icon: GraduationCap,
    defaultWelcome: 'How was your learning experience?',
    ratingLabels: {
      1: 'Poor',
      2: 'Below Average',
      3: 'Average',
      4: 'Good',
      5: 'Excellent'
    },
    followUpQuestions: {
      negative: 'We apologize. Was it the curriculum, instructor, or facilities?',
      neutral: 'Thank you. How can we improve the course material?',
      positive: 'Great! What was the most valuable part of the session?'
    },
    aiContext: 'The customer is reviewing an educational institution or training program. Focus on instructor quality, curriculum relevance, facilities, and support.'
  },
  generic: {
    id: 'generic',
    name: 'Generic Business',
    icon: Building2,
    defaultWelcome: 'How was your experience with us today?',
    ratingLabels: {
      1: 'Terrible',
      2: 'Poor',
      3: 'Okay',
      4: 'Good',
      5: 'Excellent'
    },
    followUpQuestions: {
      negative: 'We are sorry to hear that. Please tell us what went wrong.',
      neutral: 'Thank you. How can we improve?',
      positive: 'Great! Tell us what you liked the most.'
    },
    aiContext: 'The customer is reviewing a general business. Focus on overall satisfaction, service quality, and areas for improvement.'
  }
};

export const getTemplate = (type) => {
  return BUSINESS_TEMPLATES[type] || BUSINESS_TEMPLATES.generic;
};
