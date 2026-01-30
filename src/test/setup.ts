import { vi } from "vitest";

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
process.env.RESEND_API_KEY = "re_test_xxx";
process.env.ADMIN_EMAILS = "admin@test.com,staff@test.com";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

// Mock Next.js headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => {
      if (key === "stripe-signature") return "test-signature";
      return null;
    }),
  })),
  cookies: vi.fn(() => ({
    get: vi.fn(),
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));
