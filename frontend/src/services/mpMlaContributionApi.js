import api, { handleApiError } from './api.js';

// Submit MP/MLA contribution
export const submitContribution = async (contributionData) => {
  try {
    const response = await api.post('/contribute-mp-mla', contributionData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get pending contributions (admin only)
export const getPendingContributions = async (params = {}) => {
  try {
    const response = await api.get('/contribute-mp-mla/pending', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Moderate contribution (admin only)
export const moderateContribution = async (id, action, notes = '') => {
  try {
    const response = await api.post(`/contribute-mp-mla/moderate/${id}`, {
      action,
      notes
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get all contributions (admin only, with status filter)
export const getAllContributions = async (params = {}) => {
  try {
    const response = await api.get('/contribute-mp-mla/all', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Edit a rejected contribution (admin only)
export const editRejectedContribution = async (id, updateData) => {
  try {
    const response = await api.patch(`/contribute-mp-mla/${id}`, updateData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Delete a contribution (admin only)
export const deleteContribution = async (id) => {
  try {
    const response = await api.delete(`/contribute-mp-mla/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get public MP/MLA contribution stats
export const getContributionStats = async () => {
  try {
    const response = await api.get('/contribute-mp-mla/stats');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const mpMlaContributionAPI = {
  submitContribution,
  getPendingContributions,
  moderateContribution,
  getAllContributions,
  editRejectedContribution,
  deleteContribution,
  getContributionStats
};