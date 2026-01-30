import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { mockUser, mockAdminUser, mockOrder, mockTicket } from "@/test/mocks";

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
};

// Mock admin client
const mockAdminClient = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}));

describe("GET /api/admin/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 403 if user is not an admin", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser }, // Regular user, not admin
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should return stats for admin user", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockAdminUser },
      error: null,
    });

    // Mock orders
    const mockOrders = [
      { status: "paid", total: 30000 },
      { status: "paid", total: 15000 },
      { status: "pending", total: 10000 },
    ];

    // Mock tickets
    const mockTickets = [
      { status: "unassigned" },
      { status: "invited" },
      { status: "assigned" },
      { status: "assigned" },
    ];

    mockAdminClient.from.mockImplementation((table: string) => {
      if (table === "orders") {
        return {
          select: vi.fn().mockResolvedValue({ data: mockOrders, error: null }),
        };
      }
      if (table === "tickets") {
        return {
          select: vi.fn().mockResolvedValue({ data: mockTickets, error: null }),
        };
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalOrders).toBe(3);
    expect(data.paidOrders).toBe(2);
    expect(data.totalRevenue).toBe(45000); // 30000 + 15000
    expect(data.totalAttendees).toBe(4);
    expect(data.ticketsByStatus).toEqual({
      unassigned: 1,
      invited: 1,
      assigned: 2,
    });
  });

  it("should handle empty data", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockAdminUser },
      error: null,
    });

    mockAdminClient.from.mockImplementation(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalOrders).toBe(0);
    expect(data.paidOrders).toBe(0);
    expect(data.totalRevenue).toBe(0);
    expect(data.totalAttendees).toBe(0);
  });
});
