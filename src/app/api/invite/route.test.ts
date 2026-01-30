import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import {
  mockUser,
  mockProfile,
  mockTicket,
  mockInvitedTicket,
} from "@/test/mocks";

// Mock Supabase
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock email
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, id: "email-123" }),
  inviteEmail: vi.fn().mockReturnValue({
    subject: "Test Subject",
    html: "<p>Test</p>",
    text: "Test",
  }),
}));

describe("POST /api/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const request = new NextRequest("http://localhost:3000/api/invite", {
      method: "POST",
      body: JSON.stringify({ ticketId: "ticket-123", email: "test@example.com" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("ログインが必要です");
  });

  it("should return 400 if ticketId or email is missing", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/api/invite", {
      method: "POST",
      body: JSON.stringify({ ticketId: "ticket-123" }), // Missing email
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("チケットIDとメールアドレスが必要です");
  });

  it("should return 400 for invalid email format", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/api/invite", {
      method: "POST",
      body: JSON.stringify({ ticketId: "ticket-123", email: "invalid-email" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("有効なメールアドレスを入力してください");
  });

  it("should return 404 if ticket is not found", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      }),
    });
    mockSupabaseClient.from = mockFrom;

    const request = new NextRequest("http://localhost:3000/api/invite", {
      method: "POST",
      body: JSON.stringify({
        ticketId: "non-existent",
        email: "test@example.com",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("チケットが見つかりません");
  });

  it("should return 400 if ticket is already invited", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // First call for ticket, second for profile
    let callCount = 0;
    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "tickets") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockInvitedTicket,
            error: null,
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });
    mockSupabaseClient.from = mockFrom;

    const request = new NextRequest("http://localhost:3000/api/invite", {
      method: "POST",
      body: JSON.stringify({
        ticketId: "ticket-123",
        email: "test@example.com",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("このチケットは既に招待済みまたは割当済みです");
  });

  it("should successfully send invitation for unassigned ticket", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const mockFrom = vi.fn().mockImplementation((table) => {
      if (table === "tickets") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockTicket,
            error: null,
          }),
          update: vi.fn().mockReturnThis(),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnThis(),
      };
    });

    // Create a more specific mock for update
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockSupabaseClient.from = vi.fn().mockImplementation((table) => {
      if (table === "tickets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockTicket,
                  error: null,
                }),
              }),
            }),
          }),
          update: updateMock,
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const request = new NextRequest("http://localhost:3000/api/invite", {
      method: "POST",
      body: JSON.stringify({
        ticketId: "ticket-123",
        email: "invitee@example.com",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("招待を送信しました");
  });
});
