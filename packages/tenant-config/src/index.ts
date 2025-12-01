export type BrandId = "acme" | "globex";

export interface BrandConfig {
  id: BrandId;
  name: string;
  displayName: string;
  primaryColor: string;
  logoPath?: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

const brands: Record<BrandId, BrandConfig> = {
  acme: {
    id: "acme",
    name: "acme",
    displayName: "Acme Labs",
    primaryColor: "#2563eb",
    logoPath: "/brands/acme/logo.svg",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  },
  globex: {
    id: "globex",
    name: "globex",
    displayName: "Globex Corp",
    primaryColor: "#7c3aed",
    logoPath: "/brands/globex/logo.svg",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  },
};

export function getBrandConfig(brandId: BrandId): BrandConfig {
  return brands[brandId];
}

export function getAllBrands(): BrandConfig[] {
  return Object.values(brands);
}

export { brands };

