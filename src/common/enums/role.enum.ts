// Phase 1 supports two roles only, per the PRD (Landlord / Tenant).
export enum Role {
  LANDLORD = 'landlord',
  TENANT = 'tenant',
}

// RoleEnum used by the token service (system/admin tokens) — superset of Role.
export enum RoleEnum {
  ADMIN = 'admin',
  LANDLORD = 'landlord',
  TENANT = 'tenant',
}
