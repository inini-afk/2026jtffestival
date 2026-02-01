// Database types for JTF Translation Festival 2026

export type UserRole = "purchaser" | "attendee" | "admin";
export type OrderStatus = "pending" | "paid" | "cancelled" | "refunded";
export type PaymentMethod = "card" | "bank_transfer" | "invoice";
export type TicketStatus = "unassigned" | "invited" | "assigned";
export type AccountType = "individual" | "company";
export type DiscountType = "free_all" | "member_price" | "free_venue" | "free_ondemand" | "exclude_party" | "fixed_price";
export type PromoCategory = "member" | "sponsor" | "speaker" | "partner" | "school" | "staff" | "test";

// =============================================
// Profiles
// =============================================
export interface Profile {
  id: string;
  email: string;
  name: string;
  company: string | null;
  roles: string[];
  stripe_customer_id: string | null;
  account_type: AccountType;
  company_country: string | null;
  company_postal_code: string | null;
  company_address: string | null;
  company_phone: string | null;
  company_registration_number: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// Ticket Types
// =============================================
export interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  includes_onsite: boolean;
  includes_online: boolean;
  includes_party: boolean;
  is_active: boolean;
  created_at: string;
}

// =============================================
// Orders
// =============================================
export interface Order {
  id: string;
  order_number: string;
  purchaser_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  subtotal: number;
  tax: number;
  total: number;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_invoice_id: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  promo_code_id: string | null;
  discount_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  purchaser: Profile;
}

// =============================================
// Order Items
// =============================================
export interface OrderItem {
  id: string;
  order_id: string;
  ticket_type_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface OrderItemWithType extends OrderItem {
  ticket_type: TicketType;
}

// =============================================
// Tickets
// =============================================
export interface Ticket {
  id: string;
  ticket_number: string;
  order_id: string;
  order_item_id: string;
  ticket_type_id: string;
  purchaser_id: string;
  attendee_id: string | null;
  status: TicketStatus;
  invite_email: string | null;
  invite_token: string | null;
  invite_sent_at: string | null;
  assigned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketWithDetails extends Ticket {
  ticket_type: TicketType;
  purchaser: Profile;
  attendee: Profile | null;
}

// =============================================
// Promo Codes
// =============================================
export interface PromoCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: DiscountType;
  fixed_price: number | null;
  member_price_discount: number;
  max_total_uses: number | null;
  max_uses_per_user: number | null;
  current_uses: number;
  applicable_ticket_types: string[] | null;
  valid_from: string | null;
  valid_until: string | null;
  category: PromoCategory | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromoCodeUse {
  id: string;
  promo_code_id: string;
  user_id: string;
  order_id: string | null;
  used_at: string;
}

// =============================================
// Database schema for Supabase client
// =============================================
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          company: string | null;
          roles: string[];
          stripe_customer_id: string | null;
          account_type: AccountType;
          company_country: string | null;
          company_postal_code: string | null;
          company_address: string | null;
          company_phone: string | null;
          company_registration_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          company?: string | null;
          roles?: string[];
          stripe_customer_id?: string | null;
          account_type?: AccountType;
          company_country?: string | null;
          company_postal_code?: string | null;
          company_address?: string | null;
          company_phone?: string | null;
          company_registration_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          company?: string | null;
          roles?: string[];
          stripe_customer_id?: string | null;
          account_type?: AccountType;
          company_country?: string | null;
          company_postal_code?: string | null;
          company_address?: string | null;
          company_phone?: string | null;
          company_registration_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ticket_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          includes_onsite: boolean;
          includes_online: boolean;
          includes_party: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          price: number;
          includes_onsite?: boolean;
          includes_online?: boolean;
          includes_party?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          includes_onsite?: boolean;
          includes_online?: boolean;
          includes_party?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          purchaser_id: string;
          status: OrderStatus;
          payment_method: PaymentMethod | null;
          subtotal: number;
          tax: number;
          total: number;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          stripe_invoice_id: string | null;
          paid_at: string | null;
          cancelled_at: string | null;
          promo_code_id: string | null;
          discount_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          purchaser_id: string;
          status?: OrderStatus;
          payment_method?: PaymentMethod | null;
          subtotal: number;
          tax: number;
          total: number;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_invoice_id?: string | null;
          paid_at?: string | null;
          cancelled_at?: string | null;
          promo_code_id?: string | null;
          discount_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          purchaser_id?: string;
          status?: OrderStatus;
          payment_method?: PaymentMethod | null;
          subtotal?: number;
          tax?: number;
          total?: number;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_invoice_id?: string | null;
          paid_at?: string | null;
          cancelled_at?: string | null;
          promo_code_id?: string | null;
          discount_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_purchaser_id_fkey";
            columns: ["purchaser_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_promo_code_id_fkey";
            columns: ["promo_code_id"];
            referencedRelation: "promo_codes";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          ticket_type_id: string;
          quantity: number;
          unit_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          ticket_type_id: string;
          quantity?: number;
          unit_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          ticket_type_id?: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_ticket_type_id_fkey";
            columns: ["ticket_type_id"];
            referencedRelation: "ticket_types";
            referencedColumns: ["id"];
          }
        ];
      };
      tickets: {
        Row: {
          id: string;
          ticket_number: string;
          order_id: string;
          order_item_id: string;
          ticket_type_id: string;
          purchaser_id: string;
          attendee_id: string | null;
          status: TicketStatus;
          invite_email: string | null;
          invite_token: string | null;
          invite_sent_at: string | null;
          assigned_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_number?: string;
          order_id: string;
          order_item_id: string;
          ticket_type_id: string;
          purchaser_id: string;
          attendee_id?: string | null;
          status?: TicketStatus;
          invite_email?: string | null;
          invite_token?: string | null;
          invite_sent_at?: string | null;
          assigned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticket_number?: string;
          order_id?: string;
          order_item_id?: string;
          ticket_type_id?: string;
          purchaser_id?: string;
          attendee_id?: string | null;
          status?: TicketStatus;
          invite_email?: string | null;
          invite_token?: string | null;
          invite_sent_at?: string | null;
          assigned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_order_item_id_fkey";
            columns: ["order_item_id"];
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey";
            columns: ["ticket_type_id"];
            referencedRelation: "ticket_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_purchaser_id_fkey";
            columns: ["purchaser_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_attendee_id_fkey";
            columns: ["attendee_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      promo_codes: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          discount_type: DiscountType;
          fixed_price: number | null;
          member_price_discount: number;
          max_total_uses: number | null;
          max_uses_per_user: number | null;
          current_uses: number;
          applicable_ticket_types: string[] | null;
          valid_from: string | null;
          valid_until: string | null;
          category: PromoCategory | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          discount_type: DiscountType;
          fixed_price?: number | null;
          member_price_discount?: number;
          max_total_uses?: number | null;
          max_uses_per_user?: number | null;
          current_uses?: number;
          applicable_ticket_types?: string[] | null;
          valid_from?: string | null;
          valid_until?: string | null;
          category?: PromoCategory | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          discount_type?: DiscountType;
          fixed_price?: number | null;
          member_price_discount?: number;
          max_total_uses?: number | null;
          max_uses_per_user?: number | null;
          current_uses?: number;
          applicable_ticket_types?: string[] | null;
          valid_from?: string | null;
          valid_until?: string | null;
          category?: PromoCategory | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      promo_code_uses: {
        Row: {
          id: string;
          promo_code_id: string;
          user_id: string;
          order_id: string | null;
          used_at: string;
        };
        Insert: {
          id?: string;
          promo_code_id: string;
          user_id: string;
          order_id?: string | null;
          used_at?: string;
        };
        Update: {
          id?: string;
          promo_code_id?: string;
          user_id?: string;
          order_id?: string | null;
          used_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promo_code_uses_promo_code_id_fkey";
            columns: ["promo_code_id"];
            referencedRelation: "promo_codes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promo_code_uses_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promo_code_uses_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      validate_promo_code: {
        Args: {
          p_code: string;
          p_user_id: string;
        };
        Returns: {
          is_valid: boolean;
          promo_code_id: string | null;
          discount_type: DiscountType | null;
          fixed_price: number | null;
          error_message: string | null;
        }[];
      };
      use_promo_code: {
        Args: {
          p_promo_code_id: string;
          p_user_id: string;
          p_order_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      order_status: OrderStatus;
      payment_method: PaymentMethod;
      ticket_status: TicketStatus;
      discount_type: DiscountType;
      promo_category: PromoCategory;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
