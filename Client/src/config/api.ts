// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4055';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/login',
  LOGOUT: '/logout',
  REGISTER: '/user/register',
  CHANGE_PASSWORD: '/change-password',

  // Members
  MEMBERS: '/members',
  MEMBER_ID_CARD: '/members/generate-id',
  MEMBER_BULK_ID_CARDS: '/members/generate-all-ids',

  // Notices
  NOTICES: '/notices',

  // Users
  USERS: '/users'
} as const;