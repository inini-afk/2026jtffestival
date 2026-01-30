import { vi } from "vitest";

// =============================================
// Mock User Data
// =============================================
export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  user_metadata: {
    name: "Test User",
    company: "Test Company",
  },
};

export const mockProfile = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  company: "Test Company",
  roles: ["purchaser"],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockAdminUser = {
  id: "admin-123",
  email: "admin@test.com",
  user_metadata: {
    name: "Admin User",
  },
};

// =============================================
// Mock Ticket Data
// =============================================
export const mockTicketType = {
  id: "full",
  name: "Full Package",
  description: "会場参加＋オンデマンド視聴＋交流パーティー",
  price: 30000,
  includes_onsite: true,
  includes_online: true,
  includes_party: true,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
};

export const mockTicket = {
  id: "ticket-123",
  ticket_number: "TKT-2026-00001",
  order_id: "order-123",
  order_item_id: "item-123",
  ticket_type_id: "full",
  purchaser_id: "user-123",
  attendee_id: null,
  status: "unassigned",
  invite_email: null,
  invite_token: null,
  invite_sent_at: null,
  assigned_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ticket_type: mockTicketType,
};

export const mockInvitedTicket = {
  ...mockTicket,
  status: "invited",
  invite_email: "invitee@example.com",
  invite_token: "test-token-123",
  invite_sent_at: "2024-01-02T00:00:00Z",
};

// =============================================
// Mock Order Data
// =============================================
export const mockOrder = {
  id: "order-123",
  order_number: "ORD-2026-00001",
  purchaser_id: "user-123",
  status: "paid",
  payment_method: "card",
  subtotal: 27273,
  tax: 2727,
  total: 30000,
  stripe_payment_intent_id: "pi_test123",
  stripe_checkout_session_id: "cs_test123",
  paid_at: "2024-01-01T00:00:00Z",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockOrderItem = {
  id: "item-123",
  order_id: "order-123",
  ticket_type_id: "full",
  quantity: 1,
  unit_price: 30000,
  created_at: "2024-01-01T00:00:00Z",
  ticket_type: mockTicketType,
};

// =============================================
// Mock Supabase Client
// =============================================
export function createMockSupabaseClient(overrides: Record<string, unknown> = {}) {
  const mockSelect = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      ...overrides.auth,
    },
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      single: mockSingle,
      ...overrides.from,
    })),
    _mocks: {
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
      insert: mockInsert,
      update: mockUpdate,
    },
  };
}

// =============================================
// Mock Email Service
// =============================================
export const mockSendEmail = vi.fn().mockResolvedValue({
  success: true,
  id: "email-123",
});

// =============================================
// Mock Stripe
// =============================================
export const mockStripeCheckoutSession = {
  id: "cs_test123",
  payment_intent: "pi_test123",
  metadata: {
    order_id: "order-123",
    user_id: "user-123",
  },
};

export const mockStripeWebhookEvent = {
  type: "checkout.session.completed",
  data: {
    object: mockStripeCheckoutSession,
  },
};
