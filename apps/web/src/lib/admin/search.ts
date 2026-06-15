export type ProfessionalFilterCriteria = {
  text?: string;
  professionalStatus?: string;
  complianceStatus?: string;
  roleId?: string;
  postcode?: string;
  maxTravelKm?: string | number;
  availability?: string;
  requireValidDocs?: boolean;
};

export type ProfessionalFilters = {
  text?: string;
  professionalStatus?: string;
  complianceStatus?: string;
  roleId?: string;
  postcode?: string;
  maxTravelKm?: number;
  availability?: string;
  requireValidDocs?: boolean;
};

export function buildProfessionalFilters(c: ProfessionalFilterCriteria): ProfessionalFilters {
  const f: ProfessionalFilters = {};
  const txt = c.text?.trim();
  if (txt) f.text = txt;
  if (c.professionalStatus) f.professionalStatus = c.professionalStatus;
  if (c.complianceStatus) f.complianceStatus = c.complianceStatus;
  if (c.roleId) f.roleId = c.roleId;
  const pc = c.postcode?.trim();
  if (pc) f.postcode = pc;
  const kmRaw = c.maxTravelKm;
  const km = kmRaw === undefined || kmRaw === "" ? NaN : Number(kmRaw);
  if (!Number.isNaN(km) && km > 0) f.maxTravelKm = km;
  if (c.availability) f.availability = c.availability;
  if (c.requireValidDocs) f.requireValidDocs = true;
  return f;
}
