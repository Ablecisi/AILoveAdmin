import http from './http'

export const types = {
  list: () => http.get('/admin/api/v1/types'),
  get: (id) => http.get(`/admin/api/v1/types/${id}`),
  /** @param {{ name: string, promptStyle?: string }} body */
  create: (body) => http.post('/admin/api/v1/types', body),
  /** @param {{ name: string, promptStyle?: string }} body */
  update: (id, body) => http.put(`/admin/api/v1/types/${id}`, body),
  del: (id) => http.delete(`/admin/api/v1/types/${id}`),
}

export const posts = {
  page: (p) => http.get('/admin/api/v1/posts', { params: p }),
  get: (id) => http.get(`/admin/api/v1/posts/${id}`),
  create: (body) => http.post('/admin/api/v1/posts', body),
  update: (id, body) => http.put(`/admin/api/v1/posts/${id}`, body),
  del: (id) => http.delete(`/admin/api/v1/posts/${id}`),
}

export const profiles = {
  page: (p) => http.get('/admin/api/v1/user-profiles', { params: p }),
  get: (userId) => http.get(`/admin/api/v1/user-profiles/${userId}`),
  save: (body) => http.post('/admin/api/v1/user-profiles', body),
  savePut: (userId, body) => http.put(`/admin/api/v1/user-profiles/${userId}`, body),
  del: (userId) => http.delete(`/admin/api/v1/user-profiles/${userId}`),
}

export const conversations = {
  page: (p) => http.get('/admin/api/v1/conversations', { params: p }),
  get: (id) => http.get(`/admin/api/v1/conversations/${id}`),
  create: (body) => http.post('/admin/api/v1/conversations', body),
  update: (id, body) => http.put(`/admin/api/v1/conversations/${id}`, body),
  del: (id) => http.delete(`/admin/api/v1/conversations/${id}`),
}

export const messages = {
  page: (p) => http.get('/admin/api/v1/messages', { params: p }),
  get: (id) => http.get(`/admin/api/v1/messages/${id}`),
  create: (body) => http.post('/admin/api/v1/messages', body),
  update: (id, body) => http.put(`/admin/api/v1/messages/${id}`, body),
  del: (id) => http.delete(`/admin/api/v1/messages/${id}`),
}

export const emotionLogs = {
  page: (p) => http.get('/admin/api/v1/emotion-logs', { params: p }),
  get: (id) => http.get(`/admin/api/v1/emotion-logs/${id}`),
  create: (body) => http.post('/admin/api/v1/emotion-logs', body),
  update: (id, body) => http.put(`/admin/api/v1/emotion-logs/${id}`, body),
  del: (id) => http.delete(`/admin/api/v1/emotion-logs/${id}`),
}

export const follows = {
  page: (p) => http.get('/admin/api/v1/follow-relations', { params: p }),
  get: (id) => http.get(`/admin/api/v1/follow-relations/${id}`),
  create: (body) => http.post('/admin/api/v1/follow-relations', body),
  update: (id, body) => http.put(`/admin/api/v1/follow-relations/${id}`, body),
  del: (id) => http.delete(`/admin/api/v1/follow-relations/${id}`),
}

export const rel = {
  articleLikes: {
    page: (p) => http.get('/admin/api/v1/relations/article-likes', { params: p }),
    get: (id) => http.get(`/admin/api/v1/relations/article-likes/${id}`),
    create: (body) => http.post('/admin/api/v1/relations/article-likes', body),
    update: (id, body) => http.put(`/admin/api/v1/relations/article-likes/${id}`, body),
    del: (id) => http.delete(`/admin/api/v1/relations/article-likes/${id}`),
  },
  articleCollects: {
    page: (p) => http.get('/admin/api/v1/relations/article-collects', { params: p }),
    get: (id) => http.get(`/admin/api/v1/relations/article-collects/${id}`),
    create: (body) => http.post('/admin/api/v1/relations/article-collects', body),
    update: (id, body) => http.put(`/admin/api/v1/relations/article-collects/${id}`, body),
    del: (id) => http.delete(`/admin/api/v1/relations/article-collects/${id}`),
  },
  commentLikes: {
    page: (p) => http.get('/admin/api/v1/relations/comment-likes', { params: p }),
    get: (id) => http.get(`/admin/api/v1/relations/comment-likes/${id}`),
    create: (body) => http.post('/admin/api/v1/relations/comment-likes', body),
    update: (id, body) => http.put(`/admin/api/v1/relations/comment-likes/${id}`, body),
    del: (id) => http.delete(`/admin/api/v1/relations/comment-likes/${id}`),
  },
  postLikes: {
    page: (p) => http.get('/admin/api/v1/relations/post-likes', { params: p }),
    get: (id) => http.get(`/admin/api/v1/relations/post-likes/${id}`),
    create: (body) => http.post('/admin/api/v1/relations/post-likes', body),
    update: (id, body) => http.put(`/admin/api/v1/relations/post-likes/${id}`, body),
    del: (id) => http.delete(`/admin/api/v1/relations/post-likes/${id}`),
  },
}

export const opsAccounts = {
  list: () => http.get('/admin/api/v1/ops-accounts'),
  get: (id) => http.get(`/admin/api/v1/ops-accounts/${id}`),
  create: (body) => http.post('/admin/api/v1/ops-accounts', body),
  update: (id, body) => http.put(`/admin/api/v1/ops-accounts/${id}`, body),
  del: (id) => http.delete(`/admin/api/v1/ops-accounts/${id}`),
}

export const articles = {
  get: (id) => http.get(`/admin/api/v1/articles/${id}`),
  create: (body) => http.post('/admin/api/v1/articles', body),
  update: (id, body) => http.put(`/admin/api/v1/articles/${id}`, body),
  del: (id) => http.delete(`/admin/api/v1/articles/${id}`),
}
