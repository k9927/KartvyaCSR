# CSR Funding Flow Documentation

## Overview
This document explains the complete flow of CSR funding from commitment to disbursement, including how corporates disburse funds and how NGOs track received funds.

## Flow Diagram

```
1. Corporate sends CSR Request
   ↓
2. NGO accepts request
   ↓
3. Partnership created + CSR Funding record created (amount_committed set)
   ↓
4. Corporate can disburse funds (updates amount_disbursed)
   ↓
5. Funding status updates: committed → disbursed → completed
   ↓
6. Stats reflect committed vs disbursed amounts
```

## Database Schema

### `csr_funding` Table
- `id`: Primary key
- `corporate_id`: References users(id) - the corporate making the commitment
- `project_id`: References projects(id) - optional, linked project
- `amount_committed`: Total amount committed by corporate
- `amount_disbursed`: Total amount actually disbursed (can be updated multiple times)
- `funding_status`: 'committed' | 'disbursed' | 'completed'
- `commitment_date`: Date when commitment was made
- `disbursement_date`: Date of last disbursement
- `notes`: Additional notes about the funding

### `active_partnerships` Table
- `id`: Primary key
- `csr_funding_id`: References csr_funding(id) - links partnership to funding record
- `corporate_user_id`: Corporate involved
- `ngo_user_id`: NGO involved
- `project_id`: Linked project (optional)
- `agreed_budget`: Budget agreed upon
- `status`: Partnership status

## API Endpoints

### 1. Get Funding Details
**GET** `/api/funding/:fundingId`
- Returns funding details for a specific funding record
- Accessible by both corporate and NGO (with permission check)

### 2. Disburse Funds
**POST** `/api/funding/:fundingId/disburse`
- Corporate-only endpoint
- Body: `{ amount, notes?, disbursement_date? }`
- Validates that disbursed amount doesn't exceed committed amount
- Updates `amount_disbursed` and `funding_status`
- Creates partnership update entry for tracking
- Logs activity in corporate_activity_log

### 3. Get Partnership Funding
**GET** `/api/partnerships/:partnershipId/funding`
- Returns funding details and disbursement history for a partnership
- Accessible by both corporate and NGO involved in the partnership
- Returns:
  - Funding record (committed, disbursed amounts)
  - Disbursement history (from partnership_updates)

## Frontend Implementation

### Corporate Dashboard

#### 1. Project View Modal
- Shows funding status when viewing a project
- Displays:
  - Committed amount
  - Disbursed amount
  - Remaining amount
  - Disbursement progress bar
  - Funding status badge
- "Disburse" button appears if there's remaining amount

#### 2. Disbursement Modal
- Form to disburse funds:
  - Amount (validated against remaining)
  - Disbursement date (optional)
  - Notes (optional)
- Shows current committed, disbursed, and remaining amounts
- Updates funding record and refreshes project view

#### 3. Dashboard Stats
- "Total Committed" card shows:
  - Total committed amount
  - Total disbursed amount (in green)
  - Pending amount (in amber)

### NGO Dashboard

#### Funding Tracking
- NGOs can view received funding through:
  - Partnership details (shows committed vs disbursed)
  - Funding page (shows all donations and CSR funding)
- Disbursements appear as partnership updates/milestones

## Key Features

### 1. Incremental Disbursements
- Corporates can disburse funds in multiple installments
- Each disbursement is tracked separately
- Total disbursed amount is cumulative
- Status updates automatically:
  - `committed`: No disbursements yet
  - `disbursed`: Some funds disbursed (but not all)
  - `completed`: All committed funds have been disbursed

### 2. Validation
- Cannot disburse more than committed amount
- Amount must be positive
- Corporate must own the funding record

### 3. Tracking & History
- Each disbursement creates a partnership update entry
- Disbursements are visible in partnership timeline
- Activity logs track all disbursement actions

### 4. Stats Integration
- Dashboard stats show:
  - Total committed across all partnerships
  - Total disbursed across all partnerships
  - Pending amount (committed - disbursed)

## Usage Examples

### Corporate Disbursing Funds

1. Navigate to Projects page
2. Click "View" on an active project
3. In the project modal, see "Funding Status" section
4. Click "Disburse" button
5. Enter amount, optional date and notes
6. Submit - funds are disbursed and status updates

### NGO Viewing Received Funds

1. Navigate to Connections/Partnerships page
2. View partnership details
3. See funding information:
   - Committed amount
   - Disbursed amount
   - Remaining amount
4. View disbursement history in partnership updates

## Database Queries

### Get Corporate Funding Stats
```sql
SELECT 
  COALESCE(SUM(amount_committed), 0) as total_committed,
  COALESCE(SUM(amount_disbursed), 0) as total_disbursed
FROM csr_funding 
WHERE corporate_id = $1
```

### Get Partnership Funding
```sql
SELECT cf.*
FROM csr_funding cf
JOIN active_partnerships ap ON ap.csr_funding_id = cf.id
WHERE ap.id = $1
```

### Get Disbursement History
```sql
SELECT pu.*, u.name as posted_by_name
FROM partnership_updates pu
JOIN users u ON pu.posted_by_user_id = u.id
WHERE pu.partnership_id = $1 
  AND pu.update_type = 'milestone' 
  AND pu.content LIKE 'Disbursed%'
ORDER BY pu.created_at DESC
```

## Future Enhancements

1. **Payment Gateway Integration**: Link disbursements to actual bank transfers
2. **Disbursement Schedules**: Set up automatic disbursement schedules
3. **Receipt Generation**: Generate receipts for NGOs when funds are disbursed
4. **Notifications**: Notify NGOs when funds are disbursed
5. **Reporting**: Generate funding reports (committed vs disbursed by period, by focus area, etc.)


