import { http } from './client'
import type {
  Article, ArticleVersion, AuditEntry, Journal, Occupation, Review,
  TimelineItem, TokenResponse, Topic, UploadResponse, User,
} from './types'

export const api = {
  // auth
  login: (email: string, password: string) =>
    http.post<TokenResponse>('/auth/login', { email, password }),
  register: (body: {
    user_name: string; email: string; password: string
    occupation_name: string; institution_name?: string | null; phone_number?: string | null
  }) => http.post<{ id_user: string; user_name: string; email: string; role: string }>('/auth/register', body),

  // uploads
  uploadPdf: (file: File) => http.upload<UploadResponse>('/uploads', file),

  // articles
  listArticles: (includeDeleted = false) =>
    http.get<Article[]>(`/articles${includeDeleted ? '?include_deleted=true' : ''}`),
  getArticle: (id: string) => http.get<Article>(`/articles/${id}`),
  createArticle: (body: {
    title: string; authors: string; abstract: string; keywords?: string | null
    abstract_file_path: string; id_topic?: string | null
  }) => http.post<Article>('/articles', body),
  updateArticle: (id: string, body: Record<string, unknown>) =>
    http.patch<Article>(`/articles/${id}`, body),
  deleteArticle: (id: string) => http.del<void>(`/articles/${id}`),
  restoreArticle: (id: string) => http.post<Article>(`/articles/${id}/restore`),
  listVersions: (id: string) => http.get<ArticleVersion[]>(`/articles/${id}/versions`),
  listReviews: (id: string) => http.get<Review[]>(`/articles/${id}/reviews`),
  submitFullPaper: (id: string, full_paper_file_path: string) =>
    http.post<Article>(`/articles/${id}/full-paper`, { full_paper_file_path }),
  submitRevision: (id: string, full_paper_file_path: string) =>
    http.post<Article>(`/articles/${id}/revision`, { full_paper_file_path }),
  assignReviewers: (id: string, id_reviewers: string[], override_coi = false) =>
    http.post<Article>(`/articles/${id}/reviewers`, { id_reviewers, override_coi }),
  unassignReviewer: (id: string, idReviewer: string) =>
    http.del<Article>(`/articles/${id}/reviewers/${idReviewer}`),
  reviewAbstract: (id: string, accept: boolean, notes?: string) =>
    http.post<Article>(`/articles/${id}/review`, { accept, notes: notes || null }),
  reviewFullPaper: (id: string, decision: 'accept' | 'revision', notes?: string) =>
    http.post<Article>(`/articles/${id}/review`, { decision, notes: notes || null }),
  announceAbstract: (id: string, decision: 'accept' | 'reject') =>
    http.post<Article>(`/articles/${id}/announce`, { decision }),
  announceFullPaper: (id: string, decision: 'accept' | 'revision', id_recommended_journal?: string) =>
    http.post<Article>(`/articles/${id}/announce`, {
      decision,
      id_recommended_journal: id_recommended_journal ?? null,
    }),

  // users
  listUsers: (includeDeleted = false) =>
    http.get<User[]>(`/users${includeDeleted ? '?include_deleted=true' : ''}`),
  getUser: (id: string) => http.get<User>(`/users/${id}`),
  createUser: (body: {
    user_name: string; email: string; password: string; name_role: string
    institution_name?: string | null; phone_number?: string | null; occupation_name?: string | null
  }) => http.post<User>('/users', body),
  updateUser: (id: string, body: Record<string, unknown>) => http.patch<User>(`/users/${id}`, body),
  deleteUser: (id: string) => http.del<void>(`/users/${id}`),
  restoreUser: (id: string) => http.post<User>(`/users/${id}/restore`),

  // reference data
  listTopics: () => http.get<Topic[]>('/topics'),
  createTopic: (topic_name: string) => http.post<Topic>('/topics', { topic_name }),
  updateTopic: (id: string, topic_name: string) => http.patch<Topic>(`/topics/${id}`, { topic_name }),
  deleteTopic: (id: string) => http.del<void>(`/topics/${id}`),
  createSubTopic: (kind: 'stem' | 'humanity' | 'interdisciplinary', id_topic: string, name: string) =>
    http.post<unknown>(`/sub-topics/${kind}`, { id_topic, name }),
  deleteSubTopic: (kind: string, subId: string) => http.del<void>(`/sub-topics/${kind}/${subId}`),

  listJournals: () => http.get<Journal[]>('/journals'),
  createJournal: (journal_name: string) => http.post<Journal>('/journals', { journal_name }),
  updateJournal: (id: string, journal_name: string) => http.patch<Journal>(`/journals/${id}`, { journal_name }),
  deleteJournal: (id: string) => http.del<void>(`/journals/${id}`),

  listOccupations: () => http.get<Occupation[]>('/occupations'),
  createOccupation: (occupation_name: string) => http.post<Occupation>('/occupations', { occupation_name }),
  updateOccupation: (id: string, occupation_name: string) =>
    http.patch<Occupation>(`/occupations/${id}`, { occupation_name }),
  deleteOccupation: (id: string) => http.del<void>(`/occupations/${id}`),

  listTimeline: () => http.get<TimelineItem[]>('/timeline'),
  createTimeline: (body: { title: string; description?: string | null; start_date: string; end_date: string }) =>
    http.post<TimelineItem>('/timeline', body),
  updateTimeline: (id: string, body: Record<string, unknown>) =>
    http.patch<TimelineItem>(`/timeline/${id}`, body),
  deleteTimeline: (id: string) => http.del<void>(`/timeline/${id}`),

  // audit
  listAudit: (params: {
    entity_type?: string; entity_id?: string; action?: string; id_actor?: string
    limit?: number; offset?: number
  } = {}) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') q.set(k, String(v))
    })
    const qs = q.toString()
    return http.get<AuditEntry[]>(`/audit-log${qs ? `?${qs}` : ''}`)
  },
}
