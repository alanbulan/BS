import api from './client';

export type UserReport = {
  id: number;
  report_id?: string;
  user_id: number;
  report_type: string; // disaster | infrastructure | environmental | other
  disaster_type_id?: number | null;
  title: string;
  description: string;
  location?: any; // Point geometry
  longitude?: number;
  latitude?: number;
  address?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical' | number;
  images?: string[] | Array<{ url: string; desc?: string }>;
  videos?: string[];
  status?: 'pending' | 'verified' | 'rejected' | 'processing' | 'approved' | 'under_review';
  verification_notes?: string;
  verified_at?: string;
  verified_by?: number;
  upvotes?: number;
  downvotes?: number;
  view_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type CreateReportData = {
  report_type: string;
  disaster_type_id?: number;
  title: string;
  description: string;
  longitude: number;
  latitude: number;
  address?: string;
  severity?: number; // 1-5的数字
  images?: string[];
  videos?: string[];
  is_emergency?: boolean;
};

export type ListReportsParams = {
  page?: number;
  limit?: number;
  status?: string;
  report_type?: string;
  severity?: string;
  user_id?: number;
};

/**
 * 获取用户报告列表
 * GET /user-reports
 */
export async function listUserReports(params: ListReportsParams = {}) {
  const res = await api.get<{ success: boolean; data: UserReport[]; pagination?: any }>('/user-reports', { params });
  return res.data.data || [];
}

/**
 * 获取单个报告详情
 * GET /user-reports/:id
 */
export async function getUserReport(id: number) {
  const res = await api.get<{ success: boolean; data: UserReport }>(`/user-reports/${id}`);
  return res.data.data;
}

/**
 * 创建用户报告（灾害上报）
 * POST /user-reports
 */
export async function createUserReport(data: CreateReportData) {
  try {
    const res = await api.post<{ success: boolean; data: UserReport }>('/user-reports', data);
    return res.data.data;
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error('创建报告API错误:', {
      status: error.response?.status,
      errorData: JSON.stringify(errorData),
      errorKeys: errorData ? Object.keys(errorData) : [],
      errorMessage: errorData?.error,
      errorMessageType: typeof errorData?.error,
      fullError: errorData,
      requestData: data,
    });
    
    // 提取错误信息
    let errorMsg = '提交失败';
    if (typeof errorData?.error === 'string') {
      errorMsg = errorData.error;
    } else if (typeof errorData?.message === 'string') {
      errorMsg = errorData.message;
    } else if (errorData?.error === true && errorData?.message) {
      errorMsg = errorData.message;
    }
    
    throw new Error(errorMsg);
  }
}

/**
 * 更新报告
 * PUT /user-reports/:id
 */
export async function updateUserReport(id: number, data: Partial<CreateReportData>) {
  const res = await api.put<{ success: boolean; data: UserReport }>(`/user-reports/${id}`, data);
  return res.data.data;
}

/**
 * 删除报告
 * DELETE /user-reports/:id
 */
export async function deleteUserReport(id: number) {
  await api.delete(`/user-reports/${id}`);
}

/**
 * 为报告投票
 * PATCH /user-reports/:id/vote
 */
export async function voteReport(id: number, voteType: 'upvote' | 'downvote') {
  const res = await api.patch<{ success: boolean; data: UserReport }>(`/user-reports/${id}/vote`, { vote_type: voteType });
  return res.data.data;
}

/**
 * 获取我的报告列表
 * GET /user-reports?user_id=xxx
 */
export async function getMyReports(userId: number) {
  return listUserReports({ user_id: userId });
}

/**
 * 上传图片
 * POST /uploads/image
 */
export async function uploadImage(formData: FormData) {
  try {
    const res = await api.post<{ success: boolean; data: { url: string } }>('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data) => data, // 保持FormData原样
    });
    return res.data.data.url;
  } catch (error: any) {
    const errorData = error.response?.data;
    const errorMessage = errorData?.message || errorData?.error || error.message || '上传失败';
    
    console.error('上传图片API错误:', {
      message: error.message,
      responseData: errorData,
      status: error.response?.status,
      errorMessage: errorMessage,
    });
    
    // 抛出更友好的错误信息
    throw new Error(typeof errorMessage === 'string' ? errorMessage : '上传失败');
  }
}






