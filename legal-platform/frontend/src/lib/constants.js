// Label maps for backend enum values — not mock data, just display labels
// for real enums defined in backend/prisma/schema.prisma.

export const documentCategoryLabels = {
  IDENTITY_PROOF: "Identity Proof",
  ADDRESS_PROOF: "Address Proof",
  PROPERTY_DOCUMENT: "Property Document",
  CONTRACT: "Contract",
  COURT_ORDER: "Court Order",
  FINANCIAL_DOCUMENT: "Financial Document",
  OTHER: "Other",
};

export const roleHome = { USER: "/dashboard", LAWYER: "/lawyer", ADMIN: "/admin", SUPER_ADMIN: "/admin" };
