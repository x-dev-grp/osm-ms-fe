export function toIsoDate(value: Date | string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

export function toIsoDateTime(value: Date | string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

export function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value : new Date(value);
}

export function toEmployeeRef(id: string | null | undefined): { id: string; firstName: string; lastName: string } | undefined {
  return id ? { id, firstName: '', lastName: '' } : undefined;
}

export function toPosteRef(id: string | null | undefined): { id: string; title: string } | undefined {
  return id ? { id, title: '' } : undefined;
}

export function toPayrollPeriodRef(id: string | null | undefined): { id: string } | undefined {
  return id ? { id } : undefined;
}

export function prefillEmployeeIdFromQuery(
  route: { snapshot: { queryParamMap: { get: (key: string) => string | null } } },
  form: { patchValue: (value: { employeeId: string }) => void },
  editing: boolean,
  entityId: string | null
): void {
  if (editing || entityId) {
    return;
  }
  const employeeId = route.snapshot.queryParamMap.get('employeeId');
  if (employeeId) {
    form.patchValue({ employeeId });
  }
}

export function formatTimeForApi(value: Date | string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toTimeString().slice(0, 8);
  }
  return String(value).slice(0, 8);
}
