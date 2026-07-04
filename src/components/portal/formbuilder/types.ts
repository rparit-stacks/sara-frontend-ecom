/**
 * Super Dynamic Form Builder — schema types.
 * Everything a form is = this JSON. No hardcoded fields anywhere.
 * Submissions are stored as dynamic key/value (see SubmissionValue).
 */

export type FieldType =
  // basic
  | 'short_text' | 'long_text' | 'number' | 'email' | 'phone' | 'password' | 'url'
  // selection
  | 'dropdown' | 'radio' | 'checkbox' | 'multi_select' | 'toggle'
  // date & time
  | 'date' | 'time' | 'datetime'
  // upload
  | 'file' | 'multi_file' | 'image' | 'camera'
  // advanced
  | 'signature' | 'rating' | 'slider' | 'rich_text' | 'color' | 'qr' | 'barcode'
  | 'country' | 'state' | 'city' | 'pincode' | 'address' | 'map'
  // display
  | 'heading' | 'paragraph' | 'divider' | 'image_display' | 'video' | 'html'
  // layout
  | 'section' | 'columns' | 'tabs' | 'accordion' | 'spacer';

export type FieldWidth = '25' | '50' | '75' | '100';

export interface FieldOption { label: string; value: string }

export type DataSourceKind = 'static' | 'api' | 'db_table' | 'sql' | 'json' | 'csv';
export interface DataSource {
  kind: DataSourceKind;
  options?: FieldOption[];   // static
  endpoint?: string;         // api
  table?: string;            // db_table
  query?: string;            // sql
  dependsOn?: string;        // dependent dropdown — parent field key
}

export interface Validation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  decimal?: boolean;
  regex?: string;
  expression?: string;       // JS expression
  allowedExtensions?: string;
  maxFileSize?: number;      // MB
  maxFiles?: number;
  errorMessage?: string;
}

export type ConditionOp =
  | 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  | 'starts_with' | 'ends_with';

export interface Condition { field: string; op: ConditionOp; value: string }
export interface ConditionalLogic {
  enabled: boolean;
  match: 'AND' | 'OR';
  action: 'show' | 'hide';
  conditions: Condition[];
}

export interface FormField {
  id: string;
  type: FieldType;
  key: string;               // database key
  label: string;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  defaultValue?: string;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  /** System field (name/email/phone) — always present, required, cannot be deleted or made optional. */
  locked?: boolean;
  width: FieldWidth;
  cssClass?: string;
  icon?: string;             // material symbol name
  options?: FieldOption[];
  dataSource?: DataSource;
  validation?: Validation;
  conditional?: ConditionalLogic;
  calculation?: string;      // formula e.g. "{price} * {qty}"
  repeatable?: boolean;      // group can be repeated
  // layout containers hold child fields
  children?: FormField[];
  // display content
  content?: string;
  // step assignment (for multi-step)
  step?: number;
}

export interface FormStep { id: string; title: string }

export type WorkflowStage = { id: string; name: string; color: string };

export interface NotificationChannel {
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'webhook';
  enabled: boolean;
  template?: string;
}

export interface FormPermission {
  role: string;
  view: boolean; fill: boolean; edit: boolean; delete: boolean; approve: boolean;
}

export interface FormSettings {
  description?: string;
  logo?: string;
  banner?: string;
  theme?: string;
  customCss?: string;
  customJs?: string;
  visibility: 'public' | 'private';
  passwordProtected?: boolean;
  loginRequired?: boolean;
  startDate?: string;
  endDate?: string;
  submissionLimit?: number;
  allowMultiple?: boolean;
  redirectUrl?: string;
  successMessage?: string;
  multiStep?: boolean;
  progressBar?: boolean;
}

export interface FormSchema {
  id: string;
  name: string;
  category: string;
  status: 'published' | 'draft' | 'archived';
  version: number;
  fields: FormField[];
  steps: FormStep[];
  settings: FormSettings;
  workflow: WorkflowStage[];
  notifications: NotificationChannel[];
  permissions: FormPermission[];
  // stats
  views?: number; starts?: number; submissions?: number;
  updatedAt: string;
}

export interface FormVersion { version: number; date: string; author: string; note: string }
