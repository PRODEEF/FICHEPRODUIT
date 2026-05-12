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
      product_template_fields: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          order: number;
          required: boolean;
          template_id: string;
          type: Database["public"]["Enums"]["template_field_type"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          order?: number;
          required?: boolean;
          template_id: string;
          type: Database["public"]["Enums"]["template_field_type"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          order?: number;
          required?: boolean;
          template_id?: string;
          type?: Database["public"]["Enums"]["template_field_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_template_fields_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "product_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      product_templates: {
        Row: {
          client_id: string;
          created_at: string;
          fields: Json;
          id: string;
          name: string;
          shop_id: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          fields?: Json;
          id?: string;
          name: string;
          shop_id: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          created_at?: string;
          fields?: Json;
          id?: string;
          name?: string;
          shop_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_templates_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
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
