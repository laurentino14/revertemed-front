// API types, mirroring the Swagger contract (back/docs/swagger.json).
export type ID = string

export interface ApiErrorBody {
  code: string
  message: string
}
export interface List<T> {
  items: T[]
  total: number
}

export interface User {
  id: ID
  organization_id: ID
  name: string
  email: string
  role: 'owner' | 'admin' | 'biller' | 'viewer'
  email_verified_at: string | null
  mfa_enabled: boolean
  active: boolean
  last_login_at: string | null
  created_at: string
}
export interface Organization {
  id: ID
  name: string
  cnpj: string
  kind: 'clinic' | 'billing_company'
  created_at: string
}
export interface Me {
  user: User
  organization: Organization
}

export interface Operator {
  id: ID
  ans_registry: string
  name: string
  appeal_deadline_days: number
  payment_term_days: number
  auth_response_days: number
}
export interface Provider {
  id: ID
  name: string
  cnpj: string
  cnes: string
}

export type RuleKind =
  'value' | 'authorization' | 'appeal' | 'quantity' | 'document' | 'code'
export interface ContractSummary {
  id: ID
  operator_id: ID
  operator_name: string
  valid_from: string
  valid_to: string | null
  file_name: string
  notes: string
  rules_count: number
  pending_rules: number
}
export interface Rule {
  id: ID
  contract_id: ID
  kind: RuleKind
  procedure_code: string
  value_cents: number | null
  limit_qty: number | null
  limit_period: string
  requirement: string
  deadline_days: number | null
  source_excerpt: string
  confirmed_at: string | null
}

// ---- Glosas ----
export type ItemStatus = 'pending' | 'paid' | 'partial' | 'total'
export interface GlosasDashboard {
  billed_cents: number
  glossed_cents: number
  glossed_items: number
  recovered_cents: number
  in_appeal_cents: number
  in_appeal_count: number
  to_prescribe_cents: number
  to_prescribe_items: number
  gloss_rate_pct: number
  series: { month: string; glossed_cents: number; recovered_cents: number }[]
  by_operator: {
    operator_id: ID
    operator_name: string
    billed_cents: number
    glossed_cents: number
    recovered_cents: number
  }[]
  top_reasons: { reason: string; glossed_cents: number; items: number }[]
}
export interface TissFile {
  id: ID
  kind: string
  file_name: string
  operator_name: string | null
  batch_number: string | null
  status: 'processing' | 'processed' | 'error'
  error_message: string
  error_line: number
  items_count: number
  uploaded_by: string | null
  created_at: string
}
export interface ImportResult {
  kind: string
  batch_number: string
  guides: number
  items: number
  glossed_items: number
  glossed_cents: number
  paid_cents: number
  appeals: number
  recovered_cents: number
  unmatched_items: number
}
export interface BatchView {
  id: ID
  operator_id: ID
  operator_name: string
  number: string
  protocol: string
  sent_on: string
  guides: number
  billed_cents: number
  glossed_cents: number
}
export interface ItemRow {
  id: ID
  guide_id: ID
  guide_number: string
  batch_id: ID
  batch_number: string
  operator_id: ID
  operator_name: string
  patient_pseudonym: string
  tuss_code: string
  description: string
  quantity: number
  billed_cents: number
  paid_cents: number | null
  glossed_cents: number
  gloss_code: string
  gloss_reason: string
  status: ItemStatus
  appeal_due_on: string | null
  appeal_status: string | null
  days_left: number | null
}
export type AppealStatus =
  | 'draft'
  | 'awaiting_approval'
  | 'approved'
  | 'submitted'
  | 'recovered'
  | 'partially_recovered'
  | 'denied'
  | 'discarded'
export interface AppealView {
  id: ID
  item_id: ID
  status: AppealStatus
  classification: string
  guide_number: string
  operator_name: string
  tuss_code: string
  description: string
  glossed_cents: number
  gloss_reason: string
  due_on: string | null
  protocol: string
  recovered_cents: number
  ai_generated: boolean
  updated_at: string
}
export interface Appeal {
  id: ID
  item_id: ID
  status: AppealStatus
  classification: string
  argument: string
  evidence: { kind: string; title: string; detail: string }[] | null
  ai_generated: boolean
  ai_model: string
  protocol: string
  sent_on: string | null
  recovered_cents: number
  approved_at: string | null
}
export interface AppealDetail {
  appeal: Appeal
  item: ItemRow
  matching_rules: Rule[]
  days_left: number | null
}
export interface Tracking {
  summary: {
    recovered_cents: number
    success_rate_pct: number
    avg_days_to_appeal: number
    prescribed_items: number
    prescribed_cents: number
  }
  drafts: AppealView[]
  approved: AppealView[]
  sent: AppealView[]
  results: AppealView[]
  second_appeal_suggestions: AppealView[]
}
export interface PreventionAlert {
  id: ID
  guide_id: ID
  guide_number: string
  tuss_code: string | null
  description: string | null
  severity: 'high' | 'medium' | 'low'
  rule_kind: string
  message: string
  at_risk_cents: number
  resolved_at: string | null
}
export interface PreventionReport {
  run: {
    id: ID
    guides_analyzed: number
    at_risk_cents: number
    created_at: string
  }
  alerts: PreventionAlert[]
  high: number
  medium: number
  guides_with_alerts: number
}

// ---- Autorizações ----
export type Complexity = 'normal' | 'high' | 'elective_admission' | 'urgent'
export type RequestStatus =
  'draft' | 'sent' | 'in_review' | 'returned' | 'authorized' | 'denied'
export interface AuthRequestView {
  id: ID
  number: number
  patient_pseudonym: string
  operator_id: ID
  operator_name: string
  procedure_code: string
  procedure_desc: string
  quantity: number
  complexity: Complexity
  status: RequestStatus
  protocol: string
  sent_on: string | null
  due_on: string | null
  docs_total: number
  docs_delivered: number
}
export interface AuthRequest {
  id: ID
  number: number
  patient_pseudonym: string
  operator_id: ID
  guide_kind: string
  complexity: Complexity
  procedure_code: string
  procedure_desc: string
  quantity: number
  cid: string
  doctor_name: string
  doctor_crm: string
  justification: string
  status: RequestStatus
  channel: string
  protocol: string
  sent_on: string | null
  due_on: string | null
}
export interface AuthDocument {
  id: ID
  request_id: ID
  kind: string
  required: boolean
  file_name: string
  delivered: boolean
}
export interface AuthRequestDetail {
  request: AuthRequest
  documents: AuthDocument[]
  missing_documents: string[]
  overdue: boolean
  business_days_left: number | null
}
export interface AuthDashboard {
  avg_response_days: number
  returned_pct: number
  expiring_passwords_7d: number
  authorized_not_scheduled: number
  open_requests: number
  by_operator: {
    operator_id: ID
    operator_name: string
    avg_response_days: number
    requests: number
  }[]
  deadlines_at_risk: AuthRequestView[]
}
export interface PasswordView {
  id: ID
  request_id: ID
  request_number: number
  password: string
  patient_pseudonym: string
  procedure_desc: string
  operator_name: string
  valid_from: string
  valid_until: string
  qty_authorized: number
  qty_used: number
  last_used_on: string | null
}
export interface DenialView {
  id: ID
  request_id: ID
  reason: string
  clause: string
  received_on: string
  complex: boolean
  reanalysis_text: string
  reanalysis_status: 'none' | 'draft' | 'sent' | 'reverted' | 'upheld'
  request_number: number
  operator_name: string
  procedure_desc: string
}
export interface PatientView {
  pseudonym: string
  name: string
  has_phone: boolean
  whatsapp_consent_at: string | null
  created_at: string
}
export interface PatientMessage {
  id: ID
  patient_pseudonym: string
  channel: string
  template: string
  content: string
  status: string
  created_at: string
}
export interface Requirements {
  authorization_required: boolean
  documents: string[]
  quantity_limit: number | null
  limit_period: string
  sources: string[]
}

// ---- Recebíveis ----
export type ReceivableStatus =
  'in_review' | 'with_statement' | 'paid' | 'partial' | 'overdue'
export interface ReceivableView {
  id: ID
  batch_id: ID
  batch_number: string
  operator_id: ID
  operator_name: string
  billed_cents: number
  term_days: number
  sent_on: string
  expected_on: string
  expected_cents: number
  paid_cents: number
  paid_on: string | null
  status: ReceivableStatus
  days_overdue: number
}
export interface RecvDashboard {
  forecast_30d_cents: number
  margin_pct: number
  overdue_cents: number
  overdue_operators: number
  avg_real_lag_days: number
  avg_contract_term_days: number
  advanceable_cents: number
  weeks: {
    week_start: string
    expected_cents: number
    low_cents: number
    high_cents: number
  }[]
  overdue_by_operator: {
    operator_id: ID
    operator_name: string
    overdue_cents: number
    max_days_late: number
    term_days: number
    avg_real_lag_days: number
  }[]
}
export interface BankAccount {
  id: ID
  name: string
  bank: string
  agency: string
  account: string
}
export interface BankEntry {
  id: ID
  account_id: ID
  posted_on: string
  amount_cents: number
  description: string
  status: 'unmatched' | 'matched' | 'underpaid' | 'unidentified'
  receivable_id: ID | null
  operator_name: string | null
  batch_number: string | null
  expected_cents: number | null
}
export interface BankImportSummary {
  read: number
  new: number
  duplicates: number
  matched: number
  underpaid: number
  unidentified: number
  matched_cents: number
}
export interface CollectionView {
  id: ID
  receivable_id: ID
  channel: string
  protocol: string
  message: string
  sent_at: string | null
  response: string
  responded_at: string | null
  operator_name: string
  batch_number: string
  created_at: string
}
export interface Quote {
  partner: {
    id: ID
    name: string
    kind: string
    monthly_rate_bp: number
    settlement_days: number
  }
  gross_cents: number
  fee_cents: number
  net_cents: number
  days: number
  eligible: boolean
  reasons: string[]
  best_net: boolean
}
export interface Simulation {
  gross_cents: number
  receivables: ReceivableView[]
  quotes: Quote[]
  notice: string
}
export interface Advance {
  id: ID
  partner_id: ID
  status: 'proposed' | 'accepted' | 'paid' | 'settled' | 'cancelled'
  gross_cents: number
  fee_cents: number
  net_cents: number
  receivable_ids: ID[]
  created_at: string
}
