// planning-save.dto.ts  (put in shared/dtos)
export interface PlanningSaveRequest {
  mills: {
    millMachineId: string;
    receptionIds: string[];      // just the PKs
  }[];
}

export interface PlanningSaveResponse {
  globalLots: {
    id: string;                  // DB id
    number: string;              // “GLOT-M01-20250511-001”
    millMachineId: string;
    receptionIds: string[];
  }[];
}
