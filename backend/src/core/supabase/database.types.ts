export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      analyses: {
        Row: {
          created_at: string;
          error_code: Database["public"]["Enums"]["analysis_error_code"] | null;
          error_message: string | null;
          id: string;
          session_id: string | null;
          shop_id: string | null;
          status: Database["public"]["Enums"]["analysis_status"];
          url: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          error_code?: Database["public"]["Enums"]["analysis_error_code"] | null;
          error_message?: string | null;
          id?: string;
          session_id?: string | null;
          shop_id?: string | null;
          status?: Database["public"]["Enums"]["analysis_status"];
          url: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          error_code?: Database["public"]["Enums"]["analysis_error_code"] | null;
          error_message?: string | null;
          id?: string;
          session_id?: string | null;
          shop_id?: string | null;
          status?: Database["public"]["Enums"]["analysis_status"];
          url?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "analyses_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analyses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_lots: {
        Row: {
          amount_initial: number;
          amount_remaining: number;
          created_at: string;
          expires_at: string | null;
          id: string;
          plan_id: string | null;
          sector: string | null;
          source: Database["public"]["Enums"]["credit_lot_source"];
          stripe_checkout_session_id: string | null;
          stripe_invoice_id: string | null;
          user_id: string;
        };
        Insert: {
          amount_initial: number;
          amount_remaining: number;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          plan_id?: string | null;
          sector?: string | null;
          source: Database["public"]["Enums"]["credit_lot_source"];
          stripe_checkout_session_id?: string | null;
          stripe_invoice_id?: string | null;
          user_id: string;
        };
        Update: {
          amount_initial?: number;
          amount_remaining?: number;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          plan_id?: string | null;
          sector?: string | null;
          source?: Database["public"]["Enums"]["credit_lot_source"];
          stripe_checkout_session_id?: string | null;
          stripe_invoice_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_lots_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_transactions: {
        Row: {
          created_at: string;
          delta: number;
          id: string;
          lot_id: string;
          metadata: Json;
          reason: Database["public"]["Enums"]["credit_transaction_reason"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          delta: number;
          id?: string;
          lot_id: string;
          metadata?: Json;
          reason: Database["public"]["Enums"]["credit_transaction_reason"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          delta?: number;
          id?: string;
          lot_id?: string;
          metadata?: Json;
          reason?: Database["public"]["Enums"]["credit_transaction_reason"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_lot_id_fkey";
            columns: ["lot_id"];
            isOneToOne: false;
            referencedRelation: "credit_lots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      catalog_products: {
        Row: {
          attributes: Json;
          brand: string;
          category: string;
          created_at: string;
          description: string | null;
          detailed_description: string | null;
          id: string;
          images: string[];
          name: string;
          price: number;
          sector: string;
          sub_category: string | null;
          updated_at: string;
          url: string;
          year: number | null;
        };
        Insert: {
          attributes?: Json;
          brand: string;
          category: string;
          created_at?: string;
          description?: string | null;
          detailed_description?: string | null;
          id?: string;
          images?: string[];
          name: string;
          price: number;
          sector: string;
          sub_category?: string | null;
          updated_at?: string;
          url: string;
          year?: number | null;
        };
        Update: {
          attributes?: Json;
          brand?: string;
          category?: string;
          created_at?: string;
          description?: string | null;
          detailed_description?: string | null;
          id?: string;
          images?: string[];
          name?: string;
          price?: number;
          sector?: string;
          sub_category?: string | null;
          updated_at?: string;
          url?: string;
          year?: number | null;
        };
        Relationships: [];
      };
      product_templates: {
        Row: {
          created_at: string;
          fields: Json;
          id: string;
          name: string;
          shop_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          fields?: Json;
          id?: string;
          name: string;
          shop_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          fields?: Json;
          id?: string;
          name?: string;
          shop_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_templates_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_templates_shop_id_fkey";
            columns: ["shop_id"];
            isOneToOne: false;
            referencedRelation: "shops";
            referencedColumns: ["id"];
          },
        ];
      };
      shops: {
        Row: {
          brands: string[];
          categories: string[];
          cms: Database["public"]["Enums"]["shop_cms"];
          created_at: string;
          id: string;
          name: string;
          sector: string | null;
          session_id: string | null;
          updated_at: string;
          url: string;
          user_id: string | null;
        };
        Insert: {
          brands?: string[];
          categories?: string[];
          cms?: Database["public"]["Enums"]["shop_cms"];
          created_at?: string;
          id?: string;
          name: string;
          sector?: string | null;
          session_id?: string | null;
          updated_at?: string;
          url: string;
          user_id?: string | null;
        };
        Update: {
          brands?: string[];
          categories?: string[];
          cms?: Database["public"]["Enums"]["shop_cms"];
          created_at?: string;
          id?: string;
          name?: string;
          sector?: string | null;
          session_id?: string | null;
          updated_at?: string;
          url?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "shops_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_billing: {
        Row: {
          active_subscription_id: string | null;
          created_at: string;
          stripe_customer_id: string | null;
          subscription_period_end: string | null;
          subscription_status: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active_subscription_id?: string | null;
          created_at?: string;
          stripe_customer_id?: string | null;
          subscription_period_end?: string | null;
          subscription_status?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active_subscription_id?: string | null;
          created_at?: string;
          stripe_customer_id?: string | null;
          subscription_period_end?: string | null;
          subscription_status?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_billing_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_entitlements: {
        Row: {
          expires_at: string;
          granted_at: string;
          id: string;
          revoked_at: string | null;
          type: Database["public"]["Enums"]["user_entitlement_type"];
          user_id: string;
        };
        Insert: {
          expires_at: string;
          granted_at?: string;
          id?: string;
          revoked_at?: string | null;
          type: Database["public"]["Enums"]["user_entitlement_type"];
          user_id: string;
        };
        Update: {
          expires_at?: string;
          granted_at?: string;
          id?: string;
          revoked_at?: string | null;
          type?: Database["public"]["Enums"]["user_entitlement_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_entitlements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          pending_auto_analyze: boolean;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          pending_auto_analyze?: boolean;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          pending_auto_analyze?: boolean;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      credit_lot_source: "signup_grant" | "pack_purchase" | "subscription_grant" | "manual";
      credit_transaction_reason: "export" | "expiry" | "refund" | "grant";
      user_entitlement_type: "free_low_price_exports";
      analysis_error_code:
        | "SITE_UNREACHABLE"
        | "UNANALYZABLE"
        | "UNKNOWN_SECTOR"
        | "INTERNAL_ERROR";
      analysis_status: "pending" | "running" | "done" | "failed";
      shop_cms: "prestashop" | "shopify" | "woocommerce" | "autre" | "inconnu";
      template_field_type:
        | "text"
        | "long_text"
        | "rich_text"
        | "number"
        | "price"
        | "percentage"
        | "boolean"
        | "date"
        | "datetime"
        | "url"
        | "email"
        | "phone"
        | "enum"
        | "multi_enum"
        | "reference"
        | "image"
        | "file"
        | "color"
        | "size"
        | "weight"
        | "dimension"
        | "country"
        | "currency"
        | "json";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      credit_lot_source: ["signup_grant", "pack_purchase", "subscription_grant", "manual"],
      credit_transaction_reason: ["export", "expiry", "refund", "grant"],
      user_entitlement_type: ["free_low_price_exports"],
      analysis_error_code: ["SITE_UNREACHABLE", "UNANALYZABLE", "UNKNOWN_SECTOR", "INTERNAL_ERROR"],
      analysis_status: ["pending", "running", "done", "failed"],
      shop_cms: ["prestashop", "shopify", "woocommerce", "autre", "inconnu"],
      template_field_type: [
        "text",
        "long_text",
        "rich_text",
        "number",
        "price",
        "percentage",
        "boolean",
        "date",
        "datetime",
        "url",
        "email",
        "phone",
        "enum",
        "multi_enum",
        "reference",
        "image",
        "file",
        "color",
        "size",
        "weight",
        "dimension",
        "country",
        "currency",
        "json",
      ],
    },
  },
} as const;
