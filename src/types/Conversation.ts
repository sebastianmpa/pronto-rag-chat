export interface Conversation {
  conversation_id?: string;
  customer_id: string;
  question: string;
  lang: string;
  store_domain: string;
}

export interface CreateConversationDto {
  customer_id: string;
  question: string;
  lang: string;
  store_domain: string;
  conversation_id?: string;
}

export interface ConversationResponse {
  conversation_id: string;
  customer_id: string;
  question: string;
  lang: string;
  store_domain: string;
}

export interface ConversationCustomer {
  id: string;
  name: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ConversationItem {
  id: string;
  customer_id: string;
  lang: string;
  store_domain: string;
  last_detected_model: string | null;
  last_detected_serial: string | null;
  last_detected_part: string | null;
  abstract: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  conversation_customer: ConversationCustomer;
}

export interface ConversationPaginatedResponse {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: ConversationItem[];
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  conversation_id: string;
}

export interface ConversationDetailResponse {
  id: string;
  customer_id: string;
  lang: string;
  store_domain: string;
  last_detected_model: string | null;
  last_detected_serial: string | null;
  last_detected_part: string | null;
  abstract: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  conversation_message: ConversationMessage[];
}
