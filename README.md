# OOSM Management System - Frontend Documentation

> **Central docs:** Architecture, getting started, and domain guides live in [`../docs/`](../docs/README.md). This file is a module-level reference; some sections (e.g. Angular version) may lag behind `docs/frontend/structure.md`.

## Overview
This is an Angular-based frontend application for an Olive Oil Mill Management System (OOSM). The application provides comprehensive management capabilities for olive oil production, including reception, storage, finance, and quality control.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Modules](#core-modules)
3. [Authentication & Security](#authentication--security)
4. [Shared Services & Models](#shared-services--models)
5. [Business Modules](#business-modules)
6. [Configuration & Settings](#configuration--settings)
7. [Development Guidelines](#development-guidelines)

## Architecture Overview

### Technology Stack
- **Framework**: Angular 17+ (Standalone Components)
- **UI Library**: Angular Material
- **State Management**: NgRx Signals
- **HTTP Client**: Angular HttpClient with Interceptors
- **Internationalization**: ngx-translate
- **Authentication**: JWT with Refresh Token
- **Routing**: Angular Router with Lazy Loading

### Project Structure
```
src/app/
├── /theme//           # Theme and layout components
├── auth/            # Authentication module
├── demo/            # Demo pages and components
├── finance/         # Financial management
├── interceptors/    # HTTP interceptors and guards
├── reception/       # Reception management
├── settings/        # Application settings
├── shared/          # Shared services and models
└── storage/         # Storage management
```

## Core Modules

### App Component (`src/app/app.component.ts`)
**Purpose**: Main application component that handles:
- Application initialization
- Internationalization setup (English/French)
- Navigation loading states
- Global spinner management

**Key Features**:
- Language detection and persistence
- Route change monitoring
- Loading state management

### App Routing (`src/app/app-routing.module.ts`)
**Purpose**: Main routing configuration with lazy loading

**Key Routes**:
- `/dashboard` - Main dashboard
- `/reception` - Reception management
- `/finance` - Financial operations
- `/storage` - Storage management
- `/settings` - Application settings
- `/auth` - Authentication pages

## Authentication & Security

### Authentication Service (`src/app/auth/services/authentication.service.ts`)
**Purpose**: Central authentication management

**Key Methods**:
- `login(payload)` - User authentication
- `refreshToken(refreshToken)` - Token refresh
- `logout(queryParams?)` - User logout
- `hasPermission(permission)` - Permission checking
- `hasRole(role)` - Role verification
- `isAdmin()` - Admin status check

**Features**:
- JWT token management
- Permission-based access control
- Role-based authorization
- Automatic token refresh

### Token Service (`src/app/auth/services/tokenService.service.ts`)
**Purpose**: JWT token management using cookies

**Key Methods**:
- `setToken(token)` - Store authentication token
- `getToken()` - Retrieve stored token
- `decodeToken()` - Decode JWT payload
- `clearTokens()` - Remove all tokens

**Security Features**:
- Secure cookie storage
- Token expiration handling
- JWT payload validation

### Guards and Interceptors

#### Auth Guards
- **AuthGuardChild** (`src/app/interceptors/guards/auth.guard.ts`)
  - Protects authenticated routes
  - Handles user lock status
  - Redirects new users to password update

- **AuthGuardLogin** (`src/app/interceptors/guards/auth-login.guard.ts`)
  - Prevents authenticated users from accessing login
  - Redirects to dashboard if already logged in

- **PermissionGuard** (`src/app/interceptors/guards/permission.guard.ts`)
  - Checks specific permissions
  - Supports multiple permission requirements

#### HTTP Interceptors
- **AuthInterceptor** (`src/app/interceptors/auth.interceptor.ts`)
  - Automatically adds JWT tokens to requests
  - Excludes authentication endpoints

- **ErrorInterceptor** (`src/app/interceptors/error.interceptor.ts`)
  - Handles HTTP error responses
  - Automatic token refresh on 401 errors
  - User logout on authentication failures

## Shared Services & Models

### Base Service (`src/app/shared/services/base.service.ts`)
**Purpose**: Common HTTP operations for CRUD operations

**Methods**:
- `removeItem(path, itemId)` - Soft delete
- `deleteItem(path, itemId)` - Hard delete

### Advanced Search Service (`src/app/shared/services/advanced-serach.service.ts`)
**Purpose**: Advanced search functionality across modules

**Features**:
- Complex search queries
- Filter combinations
- Pagination support

### Dashboard State Service (`src/app/shared/modules/osm-dashboard/services/dashboard-state.service.ts`)
**Purpose**: State management for dashboard components using NgRx Signals

**Features**:
- Data loading states
- Search functionality
- Export capabilities (PDF/Excel)
- Field configuration

### Key Models

#### UnifiedDelivery (`src/app/shared/models/UnifiedDelivery.ts`)
**Purpose**: Core model for delivery/reception operations

**Properties**:
- `deliveryNumber` - Unique delivery identifier
- `deliveryType` - Type (OLIVE/OIL)
- `supplier` - Supplier information
- `region` - Geographic region
- `qualityControlResults` - Quality control data
- `storageUnit` - Storage assignment

#### StorageUnitDto (`src/app/shared/models/StorageUnitDto.ts`)
**Purpose**: Storage unit management

**Properties**:
- `maxCapacity` - Maximum storage capacity
- `currentVolume` - Current volume
- `status` - Unit status (AVAILABLE, FULL, etc.)
- `oilType` - Type of oil stored

#### CompanyProfile (`src/app/shared/models/CompanyProfile.ts`)
**Purpose**: Company information management

**Properties**:
- `legalName` - Company legal name
- `registrationNumber` - Business registration
- `bankAccounts` - Associated bank accounts
- `logoData` - Company logo

## Business Modules

### Reception Module (`src/app/reception/`)

#### Reception Dashboard (`src/app/reception/components/reception-dashboard/reception-dashboard.component.ts`)
**Purpose**: Main reception overview with analytics

**Features**:
- Real-time reception statistics
- Supplier performance metrics
- Storage utilization tracking
- Quality control overview
- Interactive charts and KPIs

#### Olive Reception (`src/app/reception/components/olive-reception/olive-reception.component.ts`)
**Purpose**: Olive reception management

**Features**:
- Olive lot registration
- Quality assessment
- Supplier management
- PDF generation for receipts

#### Oil Reception (`src/app/reception/components/oil-reception/oil-reception.component.ts`)
**Purpose**: Oil reception processing

**Features**:
- Oil quantity tracking
- Price calculation
- Payment management
- Quality control integration

#### Planning Component (`src/app/reception/components/planning/planning.component.ts`)
**Purpose**: Production planning and scheduling

**Features**:
- Drag-and-drop planning interface
- Mill machine assignment
- Global lot management
- Production scheduling

### Finance Module (`src/app/finance/`)

#### Bank Accounts (`src/app/finance/bank-accounts/bank-accounts.component.ts`)
**Purpose**: Bank account management

**Features**:
- Account registration
- RIB/IBAN management
- Currency support
- Account type classification

#### Expenses (`src/app/finance/expenses/expenses.component.ts`)
**Purpose**: Expense tracking and management

**Features**:
- Expense categorization
- Invoice management
- Amount tracking
- Date-based reporting

#### Oil Credit (`src/app/finance/oil-credit/oil-credit.component.ts`)
**Purpose**: Oil credit management

**Features**:
- Credit tracking
- Payment history
- Unit type management
- Credit state monitoring

### Storage Module (`src/app/storage/`)

#### Storage Units (`src/app/storage/storage.component.ts`)
**Purpose**: Storage unit management

**Features**:
- Unit capacity tracking
- Status management
- Oil type assignment
- Maintenance scheduling

#### Oil Transactions (`src/app/storage/oil_transaction/oil_transaction.component.ts`)
**Purpose**: Oil movement tracking

**Features**:
- Transaction history
- Transfer management
- Loan tracking
- Sale recording

### Settings Module (`src/app/settings/`)

#### General Configuration (`src/app/settings/general-config/general-config.component.ts`)
**Purpose**: Company profile and general settings

**Features**:
- Company information management
- Logo upload
- Address configuration
- Bank account association

#### User Management (`src/app/settings/user-management/`)
**Purpose**: User and role administration

**Features**:
- User creation and management
- Role assignment
- Permission management
- Password policies

#### Quality Control Rules (`src/app/settings/quality-control-rule/`)
**Purpose**: Quality control configuration

**Features**:
- Rule definition
- Threshold setting
- Oil and olive specific rules
- Quality parameter management

## Configuration & Settings

### Application Configuration (`src/app/settings/application-config/application-config.component.ts`)
**Purpose**: Application appearance and behavior settings

**Features**:
- Theme selection (light/dark)
- Layout configuration
- Color scheme management
- RTL support
- Language settings

### Environment Configuration
- **Development**: `src/environments/environment.ts`
- **Production**: `src/environments/environment.prod.ts`

**Configuration Areas**:
- API endpoints
- Authentication settings
- Feature flags
- External service URLs

## Development Guidelines

### Code Organization
1. **Standalone Components**: All components use Angular 17+ standalone architecture
2. **Lazy Loading**: Routes are configured for optimal loading performance
3. **Service Pattern**: Business logic is encapsulated in services
4. **Type Safety**: Strong typing with TypeScript interfaces

### State Management
- **NgRx Signals**: Used for reactive state management
- **Service State**: Component-specific state in services
- **Local Storage**: User preferences and settings

### Error Handling
- **Global Error Interceptor**: Centralized error handling
- **Service Error Handling**: Service-specific error management
- **User Feedback**: Toast notifications for user actions

### Internationalization
- **Multi-language Support**: English and French
- **Translation Keys**: Organized by module
- **Dynamic Language Switching**: Runtime language changes

### Security Best Practices
- **JWT Authentication**: Secure token-based authentication
- **Permission-based Access**: Fine-grained access control
- **Route Guards**: Protected route access
- **Input Validation**: Form validation and sanitization

### Performance Optimization
- **Lazy Loading**: Module-based code splitting
- **OnPush Change Detection**: Optimized change detection
- **Virtual Scrolling**: Large data set handling
- **Caching**: Service-level data caching

## API Integration

### Base URL Configuration
All API calls use the configured base URL from environment files:
```typescript
environment.apiUrl + '/api/{module}/{endpoint}'
```

### Standard Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
}
```

### Authentication Headers
All authenticated requests include:
```
Authorization: Bearer {jwt_token}
```

## Testing Strategy

### Unit Testing
- Component testing with Angular TestBed
- Service testing with dependency injection
- Guard testing with route simulation

### Integration Testing
- API integration testing
- End-to-end workflow testing
- Cross-module interaction testing

## Deployment

### Build Process
```bash
# Development build
ng build

# Production build
ng build --configuration production
```

### Environment Configuration
- Environment-specific settings
- API endpoint configuration
- Feature flag management

## Maintenance and Support

### Logging
- Console logging for development
- Error tracking and monitoring
- User action logging

### Monitoring
- Performance monitoring
- Error tracking
- User analytics

### Updates and Migrations
- Angular version updates
- Dependency management
- Breaking change handling

---
