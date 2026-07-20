/** Per-user column visibility for admin list tables (Accounts, Leads). */

export const ADMIN_LIST_KEYS = ['accounts', 'leads'] as const;
export type AdminListKey = (typeof ADMIN_LIST_KEYS)[number];

export type ListColumnPrefs = {
  visibleColumns: string[];
  columnOrder: string[];
};

export const ACCOUNT_COLUMN_IDS = [
  'company',
  'agent',
  'spend',
  'commission',
  'serviceStart',
  'status',
  'industry',
  'website',
  'altWebsite',
  'linkedinUrl',
  'companyLegal',
  'mainPhone',
  'contactName',
  'contactEmail',
  'contactPhone',
  'contactRole',
  'city',
  'state',
  'location',
  'locationCount',
  'foundedYear',
  'employeeCount',
  'ceoPrincipal',
  'annualRevenue',
  'parentCompany',
  'fundingOwnershipType',
  'publicLocationCount',
  'technologies',
  'taxId',
  'mccCode',
  'corpType',
  'notes',
  'savings',
  'since',
  'contractsCount',
  'filesCount',
  'portalMrc',
  'portalPreviousMrc',
  'portalSavings',
  'facebookUrl',
  'instagramUrl',
  'twitterUrl',
  'youtubeUrl',
  'googleBusinessUrl',
  'actions',
] as const;

export type AccountColumnId = (typeof ACCOUNT_COLUMN_IDS)[number];

export const ACCOUNT_COLUMN_LABELS: Record<AccountColumnId, string> = {
  company: 'Account Name',
  agent: 'Sales Agent',
  spend: 'Monthly Spend',
  commission: 'Commission',
  serviceStart: 'Service Start Date',
  status: 'Status',
  industry: 'Industry',
  website: 'Website',
  altWebsite: 'Alt Website',
  linkedinUrl: 'LinkedIn',
  companyLegal: 'Legal Name',
  mainPhone: 'Main Phone',
  contactName: 'Primary Contact',
  contactEmail: 'Contact Email',
  contactPhone: 'Contact Phone',
  contactRole: 'Contact Role',
  city: 'City',
  state: 'State',
  location: 'Primary Location',
  locationCount: 'Locations',
  foundedYear: 'Founded Year',
  employeeCount: 'Employees',
  ceoPrincipal: 'CEO / Principal',
  annualRevenue: 'Annual Revenue',
  parentCompany: 'Parent Company',
  fundingOwnershipType: 'Funding / Ownership',
  publicLocationCount: 'Public Locations',
  technologies: 'Technologies',
  taxId: 'Tax ID / EIN',
  mccCode: 'MCC Code',
  corpType: 'Corp Type',
  notes: 'Notes',
  savings: 'Savings',
  since: 'Member Since',
  contractsCount: 'Contracts',
  filesCount: 'Files',
  portalMrc: 'Candid MRC',
  portalPreviousMrc: 'Previous Provider MRC',
  portalSavings: 'Savings vs Previous',
  facebookUrl: 'Facebook',
  instagramUrl: 'Instagram',
  twitterUrl: 'X / Twitter',
  youtubeUrl: 'YouTube',
  googleBusinessUrl: 'Google Business',
  actions: 'Actions',
};

export const DEFAULT_ACCOUNT_VISIBLE_COLUMNS: AccountColumnId[] = [
  'company',
  'agent',
  'spend',
  'commission',
  'serviceStart',
  'actions',
];

export const ACCOUNT_LOCKED_COLUMNS: AccountColumnId[] = ['company', 'actions'];

export const LEAD_COLUMN_IDS = [
  'created',
  'lead',
  'source',
  'status',
  'decisionMaker',
  'helpWith',
  'website',
  'companyLegal',
  'contactName',
  'contactEmail',
  'contactPhone',
  'contactRole',
  'location',
  'itSupport',
  'currentTechnology',
  'dealStage',
  'lifecycle',
  'closeReason',
  'actions',
] as const;

export type LeadColumnId = (typeof LEAD_COLUMN_IDS)[number];

export const LEAD_COLUMN_LABELS: Record<LeadColumnId, string> = {
  created: 'Created',
  lead: 'Lead',
  source: 'Source',
  status: 'Status',
  decisionMaker: 'Decision Maker?',
  helpWith: 'What can we help with?',
  website: 'Website',
  companyLegal: 'Legal Name',
  contactName: 'Contact Name',
  contactEmail: 'Contact Email',
  contactPhone: 'Contact Phone',
  contactRole: 'Contact Role',
  location: 'Location',
  itSupport: 'IT Support',
  currentTechnology: 'Current Technology',
  dealStage: 'Deal Stage',
  lifecycle: 'Lifecycle',
  closeReason: 'Close Reason',
  actions: 'Actions',
};

export const DEFAULT_LEAD_VISIBLE_COLUMNS: LeadColumnId[] = [
  'created',
  'lead',
  'source',
  'status',
  'decisionMaker',
  'helpWith',
  'actions',
];

export const LEAD_LOCKED_COLUMNS: LeadColumnId[] = ['lead', 'actions'];

const LIST_CONFIG = {
  accounts: {
    ids: ACCOUNT_COLUMN_IDS as readonly string[],
    defaults: DEFAULT_ACCOUNT_VISIBLE_COLUMNS as readonly string[],
    locked: ACCOUNT_LOCKED_COLUMNS as readonly string[],
    primary: 'company',
  },
  leads: {
    ids: LEAD_COLUMN_IDS as readonly string[],
    defaults: DEFAULT_LEAD_VISIBLE_COLUMNS as readonly string[],
    locked: LEAD_LOCKED_COLUMNS as readonly string[],
    primary: 'lead',
  },
} as const;

export function isAdminListKey(value: unknown): value is AdminListKey {
  return typeof value === 'string' && (ADMIN_LIST_KEYS as readonly string[]).includes(value);
}

export function normalizeListColumnPrefs(
  listKey: AdminListKey,
  input?: { visibleColumns?: unknown; columnOrder?: unknown } | null,
): ListColumnPrefs {
  const cfg = LIST_CONFIG[listKey];
  const idSet = new Set(cfg.ids);
  const orderRaw = Array.isArray(input?.columnOrder) ? input!.columnOrder : [];
  const visibleRaw = Array.isArray(input?.visibleColumns) ? input!.visibleColumns : [];
  const order = orderRaw.filter((c): c is string => typeof c === 'string' && idSet.has(c));
  const visible = visibleRaw.filter((c): c is string => typeof c === 'string' && idSet.has(c));

  const columnOrder =
    order.length > 0 ? [...order, ...cfg.ids.filter((c) => !order.includes(c))] : [...cfg.ids];

  let visibleColumns =
    visible.length > 0 ? visible.filter((c) => !cfg.locked.includes(c)) : [...cfg.defaults];

  for (const locked of cfg.locked) {
    if (!visibleColumns.includes(locked)) {
      if (locked === cfg.primary) visibleColumns = [locked, ...visibleColumns];
      else visibleColumns.push(locked);
    }
  }

  // Keep locked primary first, actions last when present.
  visibleColumns = visibleColumns.filter((c) => c !== cfg.primary && c !== 'actions');
  visibleColumns = [cfg.primary, ...visibleColumns];
  if (cfg.locked.includes('actions')) visibleColumns.push('actions');

  return { visibleColumns, columnOrder };
}

export function resolveVisibleColumns(listKey: AdminListKey, prefs: ListColumnPrefs): string[] {
  const cfg = LIST_CONFIG[listKey];
  const visible = new Set(prefs.visibleColumns);
  for (const locked of cfg.locked) visible.add(locked);
  return prefs.columnOrder.filter((id) => visible.has(id) && cfg.ids.includes(id));
}

export async function fetchListColumnPrefs(listKey: AdminListKey): Promise<ListColumnPrefs> {
  const res = await fetch(`/api/admin/list-column-prefs?list=${encodeURIComponent(listKey)}`, {
    cache: 'no-store',
  });
  if (!res.ok) return normalizeListColumnPrefs(listKey, null);
  const data = (await res.json()) as { prefs?: ListColumnPrefs };
  return normalizeListColumnPrefs(listKey, data.prefs);
}

export async function saveListColumnPrefs(
  listKey: AdminListKey,
  prefs: ListColumnPrefs,
): Promise<ListColumnPrefs> {
  const normalized = normalizeListColumnPrefs(listKey, prefs);
  const res = await fetch(`/api/admin/list-column-prefs?list=${encodeURIComponent(listKey)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Could not save columns');
  }
  const data = (await res.json()) as { prefs?: ListColumnPrefs };
  return normalizeListColumnPrefs(listKey, data.prefs ?? normalized);
}
