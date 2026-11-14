export type UserRole = 'customer' | 'restaurant' | 'delivery_partner' | 'admin';

export interface User {
  id: number;
  full_name: str;
  email: str;
  role: UserRole;
  status: string;
  created_at: string;
  last_login?: string;
  restaurant_id?: number;
  delivery_partner_id?: number;
}

export type str = string;

export interface OrderItem {
  item: string;
  quantity: number;
  ingredients: string[];
  price: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  restaurant_id: number;
  delivery_partner_id?: number;
  items_json: OrderItem[];
  total_amount: number;
  order_date: string;
  status: string;
  restaurant_dispatch_time?: string;
  restaurant_package_image?: string;
  delivery_handover_time?: string;
  delivery_handover_image?: string;
}

export interface BoundingBox {
  label: string;
  confidence: number;
  box: number[]; // [x1, y1, x2, y2]
}

export interface ModelPrediction {
  id: number;
  investigation_id: number;
  model_name: string;
  model_version: string;
  is_custom_weights: boolean;
  input_image_path: string;
  annotated_image_path?: string;
  detected_classes: string[];
  confidence: number;
  bounding_boxes?: BoundingBox[];
  raw_output?: any;
  target_verified?: boolean | null;
  execution_time_ms: number;
  created_at: string;
}

export interface RiskAssessment {
  id: number;
  investigation_id: number;
  risk_score: number;
  priority_level: 'Low' | 'Medium' | 'High' | 'Critical';
  outcome: 'Verified Issue' | 'Requires Manual Investigation' | 'No Issue Detected';
  model_confidence_factor: number;
  evidence_discrepancy_factor: number;
  customer_history_factor: number;
  restaurant_history_factor: number;
  factors_breakdown?: Record<string, any>;
  created_at: string;
}

export interface InvestigationReport {
  id: number;
  investigation_id: number;
  summary_text: string;
  ai_explanation: string;
  uncertainty_notes?: string;
  recommended_action: string;
  generated_by_llm: boolean;
  created_at: string;
}

export interface UploadedEvidence {
  id: number;
  evidence_type: string;
  file_path: string;
  annotated_path?: string;
  uploaded_by: string;
  created_at: string;
}

export interface FeedbackRecord {
  id: number;
  investigation_id: number;
  prediction_id?: number;
  reviewer_id: number;
  is_prediction_correct: boolean;
  corrected_classes?: string[];
  suitable_for_training: boolean;
  dataset_split: string;
  reviewer_notes?: string;
  created_at: string;
}

export interface Investigation {
  id: number;
  investigation_code: string;
  customer_id: number;
  order_id: number;
  complaint_category: string;
  original_query: string;
  target_ingredient?: string;
  selected_model: string;
  status: 'submitted' | 'processing' | 'under_review' | 'resolved' | 'rejected';
  final_verdict: string;
  responsible_party: string;
  risk_score: number;
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  restaurant_response?: string;
  restaurant_response_time?: string;
  courier_statement?: string;
  courier_statement_time?: string;
  
  // Relations for detail view
  customer?: User;
  order?: Order;
  evidence?: UploadedEvidence[];
  predictions?: ModelPrediction[];
  risk_assessment?: RiskAssessment;
  report?: InvestigationReport;
  feedback?: FeedbackRecord[];
}

export interface ModelStatusCard {
  id: string;
  name: string;
  type: string;
  status: 'ready' | 'custom_loaded' | 'missing_weights';
  version: string;
  weights_path: string;
  weights_loaded: boolean;
  weights_size_mb: number;
  classes_count: number;
  classes_sample: string[];
  latency_ms: number;
  accuracy_metric: string;
}

export interface DashboardStats {
  total_investigations: number;
  verified_claims: number;
  claims_requiring_review: number;
  potential_suspicious_activity: number;
  avg_risk_score: number;
  model_usage: Record<string, number>;
  models_status: ModelStatusCard[];
  recent_investigations: Investigation[];
}

export interface LoginActivity {
  id: number;
  user_id: number;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  event_type: string;
  created_at: string;
}
