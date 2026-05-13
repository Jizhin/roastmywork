import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/token/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
    }
    return Promise.reject(err)
  }
)

export const roastApi = {
  submit: (formData) =>
    api.post('/roast/submit/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  get: (id) => api.get(`/roast/${id}/`),
  history: (page = 1) => api.get(`/roast/history/?page=${page}`),
}

export const resumeApi = {
  generate: (data) => api.post('/resume/generate/', data),
  get: (id) => api.get(`/resume/${id}/`),
}

export const updaterApi = {
  submit: (formData) =>
    api.post('/resume/update/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  get: (id) => api.get(`/resume/update/${id}/`),
}

export const toolsApi = {
  jdMatch:     { submit: (d) => api.post('/tools/jd-match/', d),          get: (id) => api.get(`/tools/jd-match/${id}/`)    },
  interview:   { create: (d) => api.post('/tools/interview/', d),          get: (id) => api.get(`/tools/interview/${id}/`),  evaluate: (id, d) => api.post(`/tools/interview/${id}/`, d) },
  linkedinDm:  { submit: (d) => api.post('/tools/linkedin-dm/', d),        get: (id) => api.get(`/tools/linkedin-dm/${id}/`) },
  linkedinOpt: { submit: (d) => api.post('/tools/linkedin-opt/', d),       get: (id) => api.get(`/tools/linkedin-opt/${id}/`) },
  salary:      { submit: (d) => api.post('/tools/salary/', d),             get: (id) => api.get(`/tools/salary/${id}/`)      },
}

export const coldEmailApi = {
  generate: (data) => api.post('/tools/cold-email/generate/', data),
  deduct:   ()     => api.post('/tools/cold-email/deduct/'),
}

export const outreachWorkspaceApi = {
  generate: (data) => api.post('/tools/outreach-workspace/generate/', data),
}

export const chatApi = {
  send: (data) => api.post('/tools/chat/', data),
}

export const authApi = {
  register: (data) => api.post('/users/register/', data),
  login: (data) => api.post('/auth/token/', data),
  me: () => api.get('/users/me/'),
  activity: (limit = 40) => api.get(`/users/activity/?limit=${limit}`),
  clearActivity: () => api.delete('/users/activity/'),
}

export default api
