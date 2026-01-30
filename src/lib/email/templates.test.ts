import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  inviteEmail,
  purchaseConfirmationEmail,
  welcomeEmail,
  inviteAcceptedEmail,
} from "./templates";

describe("Email Templates", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://test.jtf.jp");
  });

  describe("inviteEmail", () => {
    it("should generate invite email with all fields", () => {
      const params = {
        inviteeName: "田中太郎",
        purchaserName: "山田花子",
        ticketTypeName: "Full Package",
        inviteToken: "abc123token",
      };

      const result = inviteEmail(params);

      expect(result.subject).toContain("山田花子");
      expect(result.subject).toContain("招待");
      expect(result.html).toContain("田中太郎様");
      expect(result.html).toContain("山田花子");
      expect(result.html).toContain("Full Package");
      expect(result.html).toContain("/invite/abc123token");
      expect(result.text).toContain("田中太郎様");
      expect(result.text).toContain("/invite/abc123token");
    });

    it("should handle missing inviteeName", () => {
      const params = {
        purchaserName: "山田花子",
        ticketTypeName: "Full Package",
        inviteToken: "abc123token",
      };

      const result = inviteEmail(params);

      expect(result.html).toContain("こんにちは");
      expect(result.text).toContain("こんにちは");
    });
  });

  describe("purchaseConfirmationEmail", () => {
    it("should generate purchase confirmation with items", () => {
      const params = {
        purchaserName: "山田花子",
        orderNumber: "ORD-2026-00001",
        items: [
          { name: "Full Package", quantity: 2, unitPrice: 30000 },
          { name: "交流パーティー", quantity: 1, unitPrice: 5000 },
        ],
        subtotal: 59091,
        tax: 5909,
        total: 65000,
        paymentMethod: "card",
      };

      const result = purchaseConfirmationEmail(params);

      expect(result.subject).toContain("ORD-2026-00001");
      expect(result.subject).toContain("ご購入ありがとうございます");
      expect(result.html).toContain("山田花子様");
      expect(result.html).toContain("Full Package");
      expect(result.html).toContain("交流パーティー");
      expect(result.html).toContain("¥65,000");
      expect(result.html).toContain("クレジットカード");
      expect(result.text).toContain("ORD-2026-00001");
      expect(result.text).toContain("Full Package x 2");
    });

    it("should handle bank transfer payment method", () => {
      const params = {
        purchaserName: "山田花子",
        orderNumber: "ORD-2026-00002",
        items: [{ name: "オンデマンド視聴", quantity: 1, unitPrice: 10000 }],
        subtotal: 9091,
        tax: 909,
        total: 10000,
        paymentMethod: "bank_transfer",
      };

      const result = purchaseConfirmationEmail(params);

      expect(result.html).toContain("銀行振込");
    });
  });

  describe("welcomeEmail", () => {
    it("should generate welcome email", () => {
      const params = {
        name: "田中太郎",
      };

      const result = welcomeEmail(params);

      expect(result.subject).toContain("ご登録ありがとうございます");
      expect(result.html).toContain("田中太郎様");
      expect(result.html).toContain("ようこそ");
      expect(result.html).toContain("/ticket");
      expect(result.text).toContain("田中太郎様");
    });
  });

  describe("inviteAcceptedEmail", () => {
    it("should generate invite accepted notification", () => {
      const params = {
        purchaserName: "山田花子",
        attendeeName: "田中太郎",
        attendeeEmail: "tanaka@example.com",
        ticketTypeName: "Full Package",
      };

      const result = inviteAcceptedEmail(params);

      expect(result.subject).toContain("田中太郎");
      expect(result.subject).toContain("受け取りました");
      expect(result.html).toContain("山田花子様");
      expect(result.html).toContain("田中太郎");
      expect(result.html).toContain("tanaka@example.com");
      expect(result.html).toContain("Full Package");
      expect(result.text).toContain("tanaka@example.com");
    });
  });

  describe("HTML structure", () => {
    it("should include proper HTML structure", () => {
      const result = inviteEmail({
        purchaserName: "Test",
        ticketTypeName: "Test Ticket",
        inviteToken: "token",
      });

      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain('<html lang="ja">');
      expect(result.html).toContain("JTF翻訳祭2026");
      expect(result.html).toContain("一般社団法人日本翻訳連盟");
    });
  });
});
