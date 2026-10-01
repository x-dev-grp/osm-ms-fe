// CHANGE: permissions - centralize permission enums and helpers
// Entity enums are also generated in permissions.generated.ts (run: node oosm/scripts/sync-permissions.cjs)

export enum OOSMModule {
  HR = 'HR',
  RECEPTION = 'RECEPTION',
  PRODUCTION = 'PRODUCTION',
  FINANCE = 'FINANCE',
  HABILITATION = 'HABILITATION',
  INVENTAIR = 'INVENTAIR',
  CONDITIONING = 'CONDITIONING',
}

export enum ReceptionEntity {
  SUPPLIER = 'SUPPLIER',
  SUPPLIERINFO = 'SUPPLIERINFO',
  UNIFIEDDELIVERY = 'UNIFIEDDELIVERY',
}

export enum ProductionEntity {
  QUALITYCONTROLRESULT = 'QUALITYCONTROLRESULT',
  QUALITYCONTROLRULE = 'QUALITYCONTROLRULE',
  STORAGEUNIT = 'STORAGEUNIT',
  MACHINEPLAN = 'MACHINEPLAN',
  MILLMACHINE = 'MILLMACHINE',
  MAINTENANCEWORKORDER = 'MAINTENANCEWORKORDER',
  MILLEQUIPMENT = 'MILLEQUIPMENT',
  EQUIPMENTSERVICEMISSION = 'EQUIPMENTSERVICEMISSION',
  OILTRANSACTION = 'OILTRANSACTION',
  OILCREDIT = 'OILCREDIT',
  base_type = 'base_type',
  CERTIFICATION='CERTIFICATION'
}

export enum FinanceEntity {
  OILCREDIT = 'OILCREDIT',
  BANKACCOUNT = 'BANKACCOUNT',
  EXPENSE = 'EXPENSE',
  FINANCIALTRANSACTION = 'FINANCIALTRANSACTION',
  OILSALE = 'OILSALE',
  WASTESALE = 'WASTESALE',
}

export enum HREntity {
  EMPLOYEE = 'EMPLOYEE',
  POSTE = 'POSTE',
  CONTRACT = 'CONTRACT',
  POINTAGE = 'POINTAGE',
  LEAVEREQUEST = 'LEAVEREQUEST',
  PAYROLLPERIOD = 'PAYROLLPERIOD',
  PAYSLIP = 'PAYSLIP',
  DEPARTMENT = 'DEPARTMENT',
  GRADE = 'GRADE',
  EMPLOYEECATEGORY = 'EMPLOYEECATEGORY',
  WORKSCHEDULE = 'WORKSCHEDULE',
  TIMESHEET = 'TIMESHEET',
  OVERTIMERULE = 'OVERTIMERULE',
  OVERTIMEREQUEST = 'OVERTIMEREQUEST',
  LEAVETYPE = 'LEAVETYPE',
  PUBLICHOLIDAY = 'PUBLICHOLIDAY',
  SALARYADVANCE = 'SALARYADVANCE',
  EMPLOYEELOAN = 'EMPLOYEELOAN',
  LEGALRULE = 'LEGALRULE',
  SOCIALSECURITYCONFIG = 'SOCIALSECURITYCONFIG',
  TAXCONFIGURATION = 'TAXCONFIGURATION',
  MINIMUMWAGERULE = 'MINIMUMWAGERULE',
  SALARYCOMPONENT = 'SALARYCOMPONENT',
  COMPANYLEGALPROFILE = 'COMPANYLEGALPROFILE',
  EMPLOYEEDOCUMENT = 'EMPLOYEEDOCUMENT',
  COMPLIANCE = 'COMPLIANCE',
  PAYROLLVARIABLE = 'PAYROLLVARIABLE',
  CONTRACTAMENDMENT = 'CONTRACTAMENDMENT',
}

export enum HabilitationEntity {
  COMPANYPROFILE = 'COMPANYPROFILE',
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  OOSMUSER = 'OOSMUSER',
}

export enum InventoryEntity {
  ARTICLESEC = 'ARTICLESEC',
  STOCKSEC = 'STOCKSEC',
  PRODUCT = 'PRODUCT',
  SKU = 'SKU',
  BOM = 'BOM',
  BONCOMMANDE = 'BONCOMMANDE',
  MATERIEL_SUPPLIER = 'MATERIEL_SUPPLIER',
  LIGNECONDITIONNEMENT = 'LIGNECONDITIONNEMENT',
  EMPLACEMENTSTOCK = 'EMPLACEMENTSTOCK',
  MOUVEMENTSTOCKSEC = 'MOUVEMENTSTOCKSEC',
}

export enum ConditioningEntity {
  ARTICLESEC = 'ARTICLESEC',
  PRODUITFINAL = 'PRODUITFINAL',
  BOM = 'BOM',
  LIGNECONDITIONNEMENT = 'LIGNECONDITIONNEMENT',
  STOCKSEC = 'STOCKSEC',
  EMPLACEMENTSTOCK = 'EMPLACEMENTSTOCK',
  MOUVEMENTSTOCKSEC = 'MOUVEMENTSTOCKSEC',
  FILTRATIONOPERATION = 'FILTRATIONOPERATION',
  OF = 'OF',
  PROJET = 'PROJET',
  CLIENT = 'CLIENT',
  CERTIFICATION = 'CERTIFICATION',
  EXPEDITION = 'EXPEDITION',
  QUALITY = 'QUALITY',
  LABELCONTENT = 'LABELCONTENT',
  ANALYTICS = 'ANALYTICS',
  MOBILESYNC = 'MOBILESYNC',
  AUDIT = 'AUDIT',
}

export enum Action {
  READ = 'READ',
  DETAIL = 'DETAIL',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CANCEL = 'CANCEL',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  VALIDATE = 'VALIDATE',
  CALCULATE = 'CALCULATE',
  PAY = 'PAY',
  GEN_PDF = 'GEN_PDF',
  COMPLETE = 'COMPLETE',
  COMPLETE_PAYMENT_DETAILS = 'COMPLETE_PAYMENT_DETAILS',
  SET_PRICE = 'SET_PRICE',
  ASSIGN_SUPPLIER = 'ASSIGN_SUPPLIER',
  OIL_IN_TRANSACTION = 'OIL_IN_TRANSACTION',
  OIL_OUT_TRANSACTION = 'OIL_OUT_TRANSACTION',
  OIL_PAYMENT = 'OIL_PAYMENT',
  TO_PROD = 'TO_PROD',
  PLANNING = 'PLANNING',
  OLIVE_QUALITY = 'OLIVE_QUALITY',
  OIL_QUALITY = 'OIL_QUALITY',
  UPDATE_OLIVE_QUALITY = 'UPDATE_OLIVE_QUALITY',
  UPDATE_OIL_QUALITY = 'UPDATE_OIL_QUALITY',
  MAINTENANCE = 'MAINTENANCE',
  DELIVERYHISTORY = 'DELIVERYHISTORY',
  GEN_PDF_QC_OIL = 'GEN_PDF_QC_OIL',
  GEN_PDF_QC_OLIVE = 'GEN_PDF_QC_OLIVE',
  GEN_PDF_PRODUCTION = 'GEN_PDF_PRODUCTION',
  START = 'START',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  CLOSE = 'CLOSE',
  SHIP = 'SHIP',
  DELIVER = 'DELIVER',
  ADD_LINE = 'ADD_LINE',
  REMOVE_LINE = 'REMOVE_LINE',
  UPDATE_STATUS = 'UPDATE_STATUS',
  DRAFT = 'DRAFT',
  FINALIZE = 'FINALIZE',
  EXPORT = 'EXPORT',
  SYNC = 'SYNC',
  REPORT = 'REPORT',
  ENTREE_STOCK = 'ENTREE_STOCK',
  SORTIE_STOCK = 'SORTIE_STOCK',
  AJUSTER_STOCK = 'AJUSTER_STOCK',
  ASSIGN_EMPLACEMENT = 'ASSIGN_EMPLACEMENT',
  RESERVER_STOCK = 'RESERVER_STOCK',
  LIBERER_STOCK = 'LIBERER_STOCK',
  CHECK_STOCK = 'CHECK_STOCK',
  TRANSFERER_STOCK = 'TRANSFERER_STOCK',
  REGENERATE_QR = 'REGENERATE_QR',
}

export function permissionKey(moduleName: OOSMModule, entity: string, action: Action): string {
  return `${moduleName}:${entity}:${action}`;
}

/**
 * MODULE:ENTITY pairs renamed between permission catalogs. Roles may hold either key,
 * so holding one side grants the other.
 */
const EQUIVALENT_PERMISSION_ENTITIES: ReadonlyArray<readonly [string, string]> = [
  ['INVENTAIR:ARTICLE', 'CONDITIONING:ARTICLE'],
  ['INVENTAIR:ARTICLESEC', 'CONDITIONING:ARTICLESEC'],
  ['INVENTAIR:PRODUCT', 'CONDITIONING:PRODUITFINAL'],
  ['INVENTAIR:PRODUITFINAL', 'CONDITIONING:PRODUITFINAL'],
  ['INVENTAIR:BOM', 'CONDITIONING:BOM'],
  ['INVENTAIR:LIGNECONDITIONNEMENT', 'CONDITIONING:LIGNECONDITIONNEMENT'],
  ['INVENTAIR:STOCKSEC', 'CONDITIONING:STOCKSEC'],
  ['INVENTAIR:EMPLACEMENTSTOCK', 'CONDITIONING:EMPLACEMENTSTOCK'],
  ['INVENTAIR:MOUVEMENTSTOCKSEC', 'CONDITIONING:MOUVEMENTSTOCKSEC'],
  ['PRODUCTION:OILCREDIT', 'FINANCE:OILCREDIT']
];

/** [granting, granted]: holding the first grants the second, not the reverse. */
const IMPLIED_PERMISSION_ENTITIES: ReadonlyArray<readonly [string, string]> = [
  ['PRODUCTION:STORAGEUNIT', 'CONDITIONING:FILTRATIONOPERATION']
];

function splitPermission(permission: string): { entityKey: string; action: string } | null {
  const parts = permission.toUpperCase().split(':');
  if (parts.length !== 3) {
    return null;
  }
  return { entityKey: `${parts[0]}:${parts[1]}`, action: parts[2] };
}

/** Upper-cased keys any of which grants `permission` (the key itself first). */
export function grantingPermissionKeys(permission: string): string[] {
  const key = permission.toUpperCase();
  const parsed = splitPermission(key);
  if (!parsed) {
    return [key];
  }
  const keys = [key];
  for (const [a, b] of EQUIVALENT_PERMISSION_ENTITIES) {
    if (parsed.entityKey === a) keys.push(`${b}:${parsed.action}`);
    if (parsed.entityKey === b) keys.push(`${a}:${parsed.action}`);
  }
  for (const [granting, granted] of IMPLIED_PERMISSION_ENTITIES) {
    if (parsed.entityKey === granted) keys.push(`${granting}:${parsed.action}`);
  }
  return [...new Set(keys)];
}

/** Upper-cased held permissions plus every key they grant through renamed catalog entries. */
export function expandGrantedPermissions(permissions: Iterable<string>): Set<string> {
  const expanded = new Set<string>();
  for (const permission of permissions) {
    const key = String(permission).toUpperCase();
    expanded.add(key);
    const parsed = splitPermission(key);
    if (!parsed) {
      continue;
    }
    for (const [a, b] of EQUIVALENT_PERMISSION_ENTITIES) {
      if (parsed.entityKey === a) expanded.add(`${b}:${parsed.action}`);
      if (parsed.entityKey === b) expanded.add(`${a}:${parsed.action}`);
    }
    for (const [granting, granted] of IMPLIED_PERMISSION_ENTITIES) {
      if (parsed.entityKey === granting) expanded.add(`${granted}:${parsed.action}`);
    }
  }
  return expanded;
}


