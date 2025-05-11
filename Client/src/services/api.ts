import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Types
export interface Member {
  _id: string;
  memberId: string;
  fullname: string;
  email: string;
  phone: string;
  aadhaar: string;
  dob: string;
  address: string;
  state: string;
  district: string;
  pinCode: string;
  parliamentConstituency: string;
  assemblyConstituency: string;
  panchayat: string;
  membershipStatus: string;
  membershipType: string;
  photo?: string;
  idCard?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  status?: string;
  membershipType?: string;
  state?: string;
  district?: string;
  parliamentConstituency?: string;
}

export interface CreateMemberPayload {
  fullname: string;
  email: string;
  phone: string;
  aadhaar: string;
  dob: string;
  address: string;
  state: string;
  district: string;
  pinCode: string;
  parliamentConstituency: string;
  assemblyConstituency: string;
  panchayat: string;
  membershipType: string;
  photo?: File;
}

interface LocationOptions {
  states: string[];
  districts: string[];
  parliamentConstituencies: string[];
}

interface ApiResponse<T> {
  statusCode: number;
  data: string;
  message: {
    members?: T[];
    data?: T;
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalMembers: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    locationOptions?: LocationOptions;
  };
  success: boolean;
}

// API Service
export const memberService = {
  getMembers: async (filters: MemberFilters = {}): Promise<ApiResponse<Member>> => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      
      // Add all filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get(`${API_BASE_URL}/member?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  },

  createMember: async (data: CreateMemberPayload): Promise<ApiResponse<Member>> => {
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      const response = await axios.post(`${API_BASE_URL}/member`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  },

  updateMember: async (memberId: string, data: Partial<CreateMemberPayload>): Promise<ApiResponse<Member>> => {
    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      const response = await axios.put(`${API_BASE_URL}/member/${memberId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  },

  deleteMember: async (memberId: string): Promise<ApiResponse<null>> => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(`${API_BASE_URL}/member/${memberId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  },

  checkMembership: async (email: string, phone: string): Promise<ApiResponse<string>> => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/member/check-memberships`,
        { email, phone },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error checking membership:', error);
      throw error;
    }
  },

  generateIdCard: async (memberId: string): Promise<ApiResponse<string>> => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/member/generate-id-card/${memberId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error generating ID card:', error);
      throw error;
    }
  }
};