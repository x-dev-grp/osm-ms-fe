# OSM Management System - Business Logic Documentation

## Overview
This document outlines the core business logic, workflows, and domain processes for the Olive Oil Mill Management System (OSM). The system manages the complete lifecycle of olive oil production from reception to storage and financial management.

## Table of Contents
1. [Business Domain Overview](#business-domain-overview)
2. [Core Business Processes](#core-business-processes)
3. [Reception Management](#reception-management)
4. [Quality Control](#quality-control)
5. [Storage Management](#storage-management)
6. [Financial Management](#financial-management)
7. [Production Planning](#production-planning)
8. [Business Rules & Validations](#business-rules--validations)
9. [Data Models & Relationships](#data-models--relationships)
10. [Workflow Diagrams](#workflow-diagrams)

## Business Domain Overview

### Olive Oil Production Lifecycle
```
Olive Reception → Quality Control → Processing → Oil Storage → Financial Settlement
```

### Key Business Entities
- **Suppliers**: Olive and oil suppliers
- **Receptions**: Olive and oil deliveries
- **Storage Units**: Oil storage tanks
- **Quality Control**: Quality assessment and rules
- **Financial Transactions**: Payments, expenses, credits
- **Production Planning**: Mill scheduling and lot management

## Core Business Processes

### 1. Reception Process

#### Olive Reception Workflow
1. **Supplier Registration**
   - Supplier information capture
   - Payment history tracking
   - Quality performance monitoring

2. **Delivery Registration**
   - Lot number generation
   - Weight measurement (gross/net)
   - Quality assessment
   - Storage assignment

3. **Documentation**
   - Receipt generation
   - Quality control forms
   - Payment documentation

#### Oil Reception Workflow
1. **Oil Delivery Processing**
   - Quantity verification
   - Quality assessment
   - Price calculation
   - Payment processing

2. **Storage Assignment**
   - Available tank identification
   - Capacity verification
   - Oil type matching

### 2. Quality Control Process

#### Quality Assessment Rules
```typescript
// Quality Control Parameters
interface QualityControlRule {
  id: string;
  name: string;
  type: 'OLIVE' | 'OIL';
  parameters: QualityParameter[];
  thresholds: ThresholdValue[];
  actions: QualityAction[];
}
```

#### Quality Control Workflow
1. **Sample Collection**
   - Representative sampling
   - Sample identification
   - Chain of custody

2. **Laboratory Analysis**
   - Parameter measurement
   - Threshold comparison
   - Result recording

3. **Decision Making**
   - Accept/Reject determination
   - Quality grade assignment
   - Price adjustment calculation

### 3. Storage Management Process

#### Storage Unit Lifecycle
```typescript
enum StorageStatus {
  AVAILABLE = 'AVAILABLE',
  FULL = 'FULL',
  FILLING = 'FILLING',
  MAINTENANCE = 'MAINTENANCE',
  IN_USE = 'IN_USE',
  CLEANING = 'CLEANING',
  RESERVED = 'RESERVED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE'
}
```

#### Storage Operations
1. **Capacity Management**
   - Volume tracking
   - Available space calculation
   - Overflow prevention

2. **Oil Movement Tracking**
   - Transfer operations
   - Loan management
   - Sale recording

3. **Maintenance Scheduling**
   - Inspection scheduling
   - Cleaning operations
   - Preventive maintenance

## Operation Types & Logical Workflows

### Defined Operation Types (from `OperationType` enum)
- **BASE**
- **OLIVE_PURCHASE**
- **OIL_PURCHASE**
- **EXCHANGE**
- **SIMPLE_RECEPTION**
- **PAYMENT**

### Logical Workflow for Each Operation Type

#### 1. BASE
**Description:**
Represents a standard or default operation, often used as a fallback or for basic receptions not fitting other categories.

**Workflow:**
- Register delivery (olive or oil) with minimal required information.
- Assign to supplier and region.
- Record weights/quantities.
- No special financial or exchange logic.
- Complete quality control and storage assignment as usual.

---

#### 2. OLIVE_PURCHASE
**Description:**
Represents the purchase of olives from a supplier.

**Workflow:**
1. **Supplier Selection:** Only active suppliers can be selected.
2. **Delivery Registration:** Enter lot number, gross/net weight, olive variety/type, and delivery date.
3. **Quality Control:** Perform quality assessment (acidity, defects, etc.). Assign quality grade and calculate yield (rendement).
4. **Pricing & Payment:** Calculate price based on weight, quality, and agreed unit price. Record paid and unpaid amounts. Generate payment record (PAYMENT operation may follow).
5. **Storage Assignment:** Assign olives to storage or processing.
6. **Completion:** Mark lot as completed after all steps.

---

#### 3. OIL_PURCHASE
**Description:**
Represents the purchase of oil from a supplier.

**Workflow:**
1. **Supplier Selection:** Only active suppliers can be selected.
2. **Delivery Registration:** Enter lot number, oil quantity, oil type/variety, and delivery date.
3. **Quality Control:** Perform oil quality assessment (acidity, peroxide, etc.). Assign quality grade.
4. **Pricing & Payment:** Calculate price based on quantity, quality, and unit price. Record paid and unpaid amounts. Generate payment record.
5. **Storage Assignment:** Assign oil to available storage tank (check capacity and type).
6. **Completion:** Mark lot as completed after all steps.

---

#### 4. EXCHANGE
**Description:**
Represents an exchange operation, such as trading olives for oil or vice versa.

**Workflow:**
1. **Supplier/Partner Selection:** Select the party involved in the exchange.
2. **Exchange Registration:** Enter details of both items being exchanged (e.g., olives for oil). Record quantities and types for both sides.
3. **Valuation:** Calculate equivalent values based on quality and quantity. Ensure fair exchange (may require approval).
4. **Quality Control:** Assess both items for quality.
5. **Storage/Assignment:** Assign received items to storage or processing.
6. **Completion:** Mark exchange as completed.

---

#### 5. SIMPLE_RECEPTION
**Description:**
Represents a straightforward reception (olive or oil) without purchase, payment, or exchange logic—often used for internal transfers or donations.

**Workflow:**
- Register delivery with basic details (lot number, type, quantity).
- Assign to supplier/partner if applicable.
- Perform quality control if required.
- Assign to storage or processing.
- No payment or exchange logic.
- Mark as completed.

---

#### 6. PAYMENT
**Description:**
Represents a payment operation, typically linked to a previous purchase (olive or oil).

**Workflow:**
1. **Link to Purchase:** Identify the related OLIVE_PURCHASE or OIL_PURCHASE operation.
2. **Payment Registration:** Enter payment amount, date, and method. Update paid/unpaid amounts for the related delivery.
3. **Validation:** Ensure payment does not exceed unpaid amount. Record payment in financial records.
4. **Completion:** Mark payment as completed and update delivery/payment status.

---

### Related Oil Transaction Types (for Oil Movement)
Defined in `TransactionType` enum:
- **RECEPTION_IN**: Oil received into storage.
- **TRANSFER_IN**: Oil transferred into a tank.
- **LOAN**: Oil loaned to a customer.
- **SALE**: Oil sold to a customer.

Each of these has its own workflow, typically involving:
- Validation of storage capacity and oil type.
- Recording the transaction in inventory.
- Updating storage unit status and volume.
- Generating financial or inventory records as needed.

## Reception Management

### Unified Delivery Model
The system uses a unified delivery model that handles both olive and oil receptions:

```typescript
class UnifiedDelivery {
  // Core delivery information
  deliveryNumber: string;
  deliveryType: 'OLIVE' | 'OIL';
  lotNumber: string;
  globalLotNumber?: string;
  
  // Supplier and location
  supplier: SupplierType;
  region: BaseType;
  
  // Weight and quantity
  poidsBrute: number;  // Gross weight
  poidsNet: number;    // Net weight
  oliveQuantity?: number;
  oilQuantity?: number;
  
  // Quality and processing
  status: OliveLotStatus;
  qualityControlResults?: QualityControlResultDto[];
  rendement?: number;  // Yield percentage
  
  // Financial information
  unitPrice?: number;
  price?: number;
  paidAmount?: number;
  unpaidAmount?: number;
}
```

### Reception Business Rules

#### 1. Lot Number Generation
- **Automatic Generation**: System generates sequential lot numbers
- **Format**: `{YEAR}{SEQUENTIAL_NUMBER}`
- **Uniqueness**: Each lot number must be unique
- **Validation**: Prevents duplicate lot numbers

#### 2. Weight Validation
```typescript
// Business Rule: Net weight cannot exceed gross weight
const netNotGreaterThanGross: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const gross = control.get('poidsBrute')?.value;
  const net = control.get('poidsNet')?.value;
  
  if (gross && net && net > gross) {
    return { netGreaterThanGross: true };
  }
  return null;
};
```

#### 3. Supplier Validation
- **Active Status**: Only active suppliers can make deliveries
- **Payment History**: Check for outstanding payments
- **Quality History**: Consider past quality performance

### Reception Workflow States

```typescript
enum OliveLotStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUSED = 'REFUSED'
}
```

## Quality Control

### Quality Control Framework

#### 1. Quality Parameters
```typescript
interface QualityParameter {
  name: string;
  unit: string;
  minValue?: number;
  maxValue?: number;
  targetValue?: number;
  tolerance?: number;
}
```

#### 2. Quality Assessment Process
1. **Parameter Measurement**
   - Acidity level
   - Peroxide value
   - UV absorption
   - Sensory evaluation

2. **Threshold Comparison**
   - Compare measured values against standards
   - Apply quality control rules
   - Determine acceptance criteria

3. **Quality Grade Assignment**
   - Extra Virgin
   - Virgin
   - Lampante
   - Refined

#### 3. Quality-Based Pricing
```typescript
// Quality adjustment calculation
const calculateQualityAdjustment = (basePrice: number, qualityScore: number): number => {
  const adjustmentFactor = qualityScore / 100;
  return basePrice * adjustmentFactor;
};
```

### Quality Control Rules Engine

#### Rule Types
1. **Acceptance Rules**: Determine if lot meets quality standards
2. **Grading Rules**: Assign quality grades
3. **Pricing Rules**: Calculate price adjustments
4. **Processing Rules**: Determine processing requirements

#### Rule Execution
```typescript
interface QualityControlRule {
  id: string;
  name: string;
  type: 'OLIVE' | 'OIL';
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
}
```

## Storage Management

### Storage Unit Management

#### 1. Capacity Planning
```typescript
interface StorageUnitDto {
  id: string;
  name: string;
  maxCapacity: number;      // Maximum capacity in liters
  currentVolume: number;    // Current volume in liters
  status: StorageStatus;
  oilType?: BaseType;       // Type of oil stored
}
```

#### 2. Storage Operations
- **Filling Operations**: Track oil additions
- **Transfer Operations**: Move oil between tanks
- **Draining Operations**: Remove oil for processing/sale
- **Maintenance Operations**: Tank cleaning and inspection

#### 3. Inventory Management
```typescript
// Available capacity calculation
const getAvailableCapacity = (storageUnit: StorageUnitDto): number => {
  return storageUnit.maxCapacity - storageUnit.currentVolume;
};

// Utilization percentage
const getUtilizationPercentage = (storageUnit: StorageUnitDto): number => {
  return (storageUnit.currentVolume / storageUnit.maxCapacity) * 100;
};
```

### Oil Transaction Tracking

#### Transaction Types
```typescript
enum TransactionType {
  RECEPTION_IN = 'RECEPTION_IN',     // Oil received from supplier
  TRANSFER_IN = 'TRANSFER_IN',       // Oil transferred from another tank
  TRANSFER_OUT = 'TRANSFER_OUT',     // Oil transferred to another tank
  LOAN = 'LOAN',                     // Oil loaned to customer
  SALE = 'SALE',                     // Oil sold to customer
  PROCESSING = 'PROCESSING',         // Oil used in processing
  LOSS = 'LOSS'                      // Oil lost (spillage, etc.)
}
```

#### Transaction Validation
1. **Capacity Validation**: Ensure sufficient space for incoming oil
2. **Volume Validation**: Ensure sufficient oil for outgoing transactions
3. **Type Validation**: Ensure oil type compatibility
4. **Status Validation**: Ensure storage unit is available

## Financial Management

### Payment Processing

#### 1. Payment Calculation
```typescript
interface PaymentCalculation {
  basePrice: number;
  qualityAdjustment: number;
  quantity: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}
```

#### 2. Payment Tracking
- **Payment History**: Track all payments by supplier
- **Outstanding Balances**: Monitor unpaid amounts
- **Payment Scheduling**: Plan future payments
- **Payment Methods**: Support multiple payment types

### Expense Management

#### 1. Expense Categories
- **Operational Expenses**: Daily operational costs
- **Maintenance Expenses**: Equipment and facility maintenance
- **Quality Control Expenses**: Laboratory and testing costs
- **Administrative Expenses**: Office and administrative costs

#### 2. Expense Approval Workflow
1. **Expense Submission**: Employee submits expense
2. **Manager Review**: Manager reviews and approves
3. **Payment Processing**: Finance processes payment
4. **Record Keeping**: Expense recorded in system

### Oil Credit Management

#### 1. Credit Types
```typescript
enum CreditState {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}
```

#### 2. Credit Terms
- **Payment Terms**: Standard payment periods
- **Interest Calculation**: Overdue payment interest
- **Credit Limits**: Maximum credit amounts per customer
- **Payment Scheduling**: Automatic payment reminders

## Production Planning

### Planning Framework

#### 1. Planning Components
```typescript
interface PlanningItem {
  id: string;
  type: 'LOT' | 'GLOBAL_LOT';
  lotNumber: string;
  globalLotNumber?: string;
  supplier: SupplierType;
  quantity: number;
  status: PlanningStatus;
  assignedMill?: MillMachine;
  scheduledDate?: Date;
}
```

#### 2. Planning Process
1. **Lot Assignment**: Assign olive lots to global lots
2. **Mill Scheduling**: Schedule processing on mill machines
3. **Capacity Planning**: Ensure mill capacity availability
4. **Quality Planning**: Plan quality control activities

### Mill Machine Management

#### 1. Machine Status Tracking
```typescript
enum MillStatus {
  OPERATIONAL = 'OPERATIONAL',
  MAINTENANCE = 'MAINTENANCE',
  BREAKDOWN = 'BREAKDOWN',
  CLEANING = 'CLEANING',
  IDLE = 'IDLE'
}
```

#### 2. Maintenance Scheduling
- **Preventive Maintenance**: Scheduled maintenance activities
- **Breakdown Maintenance**: Emergency repairs
- **Cleaning Schedule**: Regular cleaning operations
- **Performance Monitoring**: Track machine efficiency

### Lot Completion Process

#### 1. Completion Criteria
```typescript
interface ChildLotCompletionDto {
  lotNumber: string;
  oilQuantity: number;      // Actual oil produced
  rendement: number;        // Yield percentage
  unpaidPrice: number;      // Outstanding payment
}
```

#### 2. Completion Workflow
1. **Processing Completion**: Mark lot as processed
2. **Yield Calculation**: Calculate actual oil yield
3. **Quality Assessment**: Final quality evaluation
4. **Financial Settlement**: Calculate final payment

## Business Rules & Validations

### Data Validation Rules

#### 1. Weight Validation
- Net weight ≤ Gross weight
- Positive weight values only
- Reasonable weight ranges

#### 2. Quantity Validation
- Positive quantities only
- Storage capacity limits
- Minimum quantity thresholds

#### 3. Date Validation
- Delivery date ≤ Current date
- Processing date ≥ Delivery date
- Maintenance dates in future

### Business Logic Rules

#### 1. Storage Assignment Rules
```typescript
const assignStorageUnit = (oilType: string, quantity: number): StorageUnitDto => {
  return storageUnits.find(unit => 
    unit.status === 'AVAILABLE' &&
    unit.oilType?.id === oilType &&
    (unit.maxCapacity - unit.currentVolume) >= quantity
  );
};
```

#### 2. Quality-Based Pricing Rules
```typescript
const calculatePrice = (basePrice: number, qualityScore: number): number => {
  if (qualityScore >= 90) return basePrice * 1.1;  // Premium
  if (qualityScore >= 80) return basePrice;         // Standard
  if (qualityScore >= 70) return basePrice * 0.9;  // Discount
  return basePrice * 0.7;                           // Significant discount
};
```

#### 3. Payment Rules
- Payment due within 30 days of delivery
- Interest charged on overdue payments
- Partial payments accepted
- Credit limits enforced

## Data Models & Relationships

### Core Entity Relationships

#### 1. Supplier → Reception
- One supplier can have multiple receptions
- Reception must have exactly one supplier
- Supplier history affects reception processing

#### 2. Reception → Quality Control
- One reception can have multiple quality control results
- Quality control results determine reception status
- Quality affects pricing and processing

#### 3. Reception → Storage
- Reception can be assigned to storage unit
- Storage unit can contain multiple receptions
- Storage assignment affects inventory tracking

#### 4. Reception → Financial
- Reception generates financial transactions
- Payment history tracked per supplier
- Outstanding balances calculated

### Data Integrity Rules

#### 1. Referential Integrity
- All foreign keys must reference valid records
- Cascade deletes where appropriate
- Soft deletes for audit trails

#### 2. Business Integrity
- Lot numbers must be unique
- Storage capacity cannot be exceeded
- Payment amounts cannot exceed total amounts

#### 3. Temporal Integrity
- Dates must be in logical sequence
- Processing dates after delivery dates
- Maintenance dates in the future

## Workflow Diagrams

### Olive Reception Workflow
```
Supplier Delivery → Weight Measurement → Quality Assessment → Storage Assignment → Payment Processing
```

### Oil Reception Workflow
```
Oil Delivery → Quantity Verification → Quality Control → Storage Assignment → Financial Settlement
```

### Quality Control Workflow
```
Sample Collection → Laboratory Analysis → Result Recording → Decision Making → Action Implementation
```

### Storage Management Workflow
```
Capacity Check → Operation Validation → Transaction Recording → Inventory Update → Status Update
```

### Financial Settlement Workflow
```
Delivery Completion → Price Calculation → Payment Processing → Balance Update → Documentation
```

## Business Intelligence & Analytics

### Key Performance Indicators (KPIs)

#### 1. Reception KPIs
- Total receptions per period
- Average reception size
- Supplier performance metrics
- Quality acceptance rates

#### 2. Storage KPIs
- Storage utilization rates
- Tank turnover rates
- Inventory accuracy
- Storage efficiency

#### 3. Financial KPIs
- Payment collection rates
- Outstanding balance trends
- Expense ratios
- Profitability metrics

#### 4. Quality KPIs
- Quality score trends
- Rejection rates
- Quality improvement metrics
- Customer satisfaction

### Reporting Capabilities

#### 1. Operational Reports
- Daily reception summary
- Storage status reports
- Quality control reports
- Production planning reports

#### 2. Financial Reports
- Payment status reports
- Expense analysis
- Credit management reports
- Profitability analysis

#### 3. Management Reports
- Executive dashboards
- Performance metrics
- Trend analysis
- Forecasting reports

## Compliance & Regulatory Requirements

### Food Safety Compliance
- HACCP principles implementation
- Traceability requirements
- Quality control standards
- Documentation requirements

### Financial Compliance
- Accounting standards
- Tax reporting requirements
- Audit trail maintenance
- Financial record keeping

### Environmental Compliance
- Waste management
- Environmental impact tracking
- Sustainability metrics
- Regulatory reporting

---

This business logic documentation provides a comprehensive overview of the core business processes, rules, and workflows in the OSM Management System. It serves as a reference for understanding the business domain and implementing business requirements in the application. 
