/** JSON columns from API (nullable). */
export type JsonObject = Record<string, unknown>;

export type LandlordDto = {
  id: number;
  org: number;
  name: string;
  legal_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
  contact_info: JsonObject | null;
  bank_details: JsonObject | null;
  created_at: string;
  updated_at: string;
};

export type BuildingDto = {
  id: number;
  org: number;
  landlord: number;
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
  country_code: string;
  latitude: string | null;
  longitude: string | null;
  location_notes: string;
  building_type: string;
  created_at: string;
  updated_at: string;
};

export type UnitDto = {
  id: number;
  building: number;
  /** Present on list/detail when API includes building (search & onboarding). */
  building_name?: string;
  /** True when an active lease exists for this unit (list/detail from API). */
  has_active_lease?: boolean;
  unit_number: string;
  floor: string;
  entrance: string;
  unit_type: string;
  size: string | null;
  status: string;
  payment_code?: string;
  payment_code_status?: "active" | "inactive" | "suspended";
  address_override_line1: string;
  address_override_city: string;
  internal_notes: string;
  created_at: string;
  updated_at: string;
};

/** Create payload (POST). */
export type LandlordCreate = {
  org: number;
  name: string;
  legal_name?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country_code?: string;
  contact_info?: JsonObject | null;
  bank_details?: JsonObject | null;
};

export type LandlordUpdate = Partial<
  Omit<LandlordDto, "id" | "org" | "created_at" | "updated_at">
>;

export type BuildingCreate = {
  org: number;
  landlord: number;
  name: string;
  building_type?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country_code?: string;
  latitude?: string | null;
  longitude?: string | null;
  location_notes?: string;
};

export type BuildingUpdate = Partial<
  Omit<BuildingDto, "id" | "org" | "created_at" | "updated_at">
>;

export type UnitCreate = {
  building: number;
  unit_number: string;
  unit_type?: string;
  status?: string;
  floor?: string;
  entrance?: string;
  size?: string | null;
  address_override_line1?: string;
  address_override_city?: string;
  internal_notes?: string;
};

export type UnitUpdate = Partial<
  Omit<UnitDto, "id" | "created_at" | "updated_at">
>;
