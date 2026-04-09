export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  gender: 'Male' | 'Female' | 'Other';
  student_print_id: string;
  is_verified: boolean;
  created_at: string;
}

export interface librarian {
  id: string;
  name: string;
  email: string;
  password: string;
  library_name: string;
  is_active: boolean;
}

export interface FileItem {
  temp_id: string;
  file_name: string;
  file_storage_key: string;
  file_type: 'pdf' | 'word' | 'powerpoint' | 'image' | 'text';
  file_extension: string;
  page_count: number;
  print_type: 'bw' | 'color' | 'mixed';
  color_page_ranges: string;
  copies: number;
  sides: 'single' | 'double';
  paper_size?: 'A4' | 'A3';
  slidesPerPage?: number;
  bw_pages: number;
  color_pages: number;
  file_price: number;
  student_note: string;
  file_size_kb: number;
  base64?: string;
}

export interface ExtraServices {
  spiral_binding: boolean;
  stapling?: boolean;
  capstone_embossing?: 'urgent' | 'non-urgent' | 'black' | 'brown';
  bond_paper_count?: number;
}

export interface Order {
  id?: string;
  order_id: string;
  student_id: string;
  student_print_id: string;
  student_name: string;
  files: FileItem[];
  total_bw_pages: number;
  total_color_pages: number;
  total_pages: number;
  extra_services: ExtraServices;
  service_fee: number;
  subtotal: number;
  total_amount: number;
  payment_status: 'unpaid' | 'paid' | 'failed';
  print_status: 'queued' | 'printing' | 'ready' | 'completed';
  order_type: 'standard' | 'capstone';
  contact_number?: string;
  college?: string;
  department?: string;
  receiving_date?: string;
  qr_code: string;
  created_at: string;
  updated_at: string;
}

export interface Pricing {
  bw_rate: number;
  color_rate: number;
  a3_bw_rate: number;
  a3_color_rate: number;
  spiral_binding_fee: number;
  stapling_fee: number;
  capstone_page_rate: number;
  capstone_urgent_fee: number;
  capstone_non_urgent_fee: number;
}

export interface Session {
  user: User | librarian;
  role: 'student' | 'librarian' | 'admin';
}

export interface PriceResult {
  itemized: Array<{
    file_name: string;
    bw_pages: number;
    color_pages: number;
    copies: number;
    file_price: number;
  }>;
  subtotal: number;
  service_fee: number;
  total_amount: number;
}

export type SubmissionStatus = 'received' | 'under_review' | 'approved' | 'rejected' | 'resubmit';
export type NoticeType = 'acknowledgment' | 'missing' | 'approved' | 'rejected' | 'resubmit';

export interface Notice {
  id: string;
  type: NoticeType;
  message: string;
  created_at: string;
}

export interface Submission {
  submission_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  department: string;
  academic_year: string;
  guide_name: string;
  project_title: string;
  document_type: string;
  remarks: string;
  file_name: string;
  file_storage_key: string;
  validation_status: SubmissionStatus;
  notices: Notice[];
  created_at: string;
  updated_at: string;
}
