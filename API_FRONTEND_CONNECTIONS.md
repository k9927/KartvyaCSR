# API & Frontend Connections Summary

This document lists all API endpoints and their corresponding frontend connections for both Corporate and NGO dashboards.

## ✅ Corporate Dashboard APIs

### Dashboard & Stats
- **GET `/api/corporate/dashboard-stats`** → `getCorporateDashboardStats()`
  - Used in: `CorporateDashboard.jsx` - Dashboard page
  - Returns: Total investment, pending requests, active projects, shortlist count, fund distribution, monthly spending, recent activity

### Projects (Active Partnerships)
- **GET `/api/corporate/projects`** → `getCorporateProjects()`
  - Used in: `CorporateDashboard.jsx` - Projects page
  - Returns: List of active partnerships with project details

- **PATCH `/api/corporate/projects/:projectId/status`** → `updateCorporateProjectStatus()`
  - Used in: `CorporateDashboard.jsx` - Update project status

- **GET `/api/corporate/projects/:projectId/messages`** → `getCorporateProjectMessages()`
  - Used in: `CorporateDashboard.jsx` - Project messages modal

- **POST `/api/corporate/projects/:projectId/messages`** → `postCorporateProjectMessage()`
  - Used in: `CorporateDashboard.jsx` - Send message to NGO about project

### Browse & Discover NGOs
- **GET `/api/corporate/browse-ngos`** → `getCorporateBrowseNgos()`
  - Used in: `CorporateDashboard.jsx` - Discover/Connections page
  - Parameters: search, focus_area, verified_only, page, limit
  - Returns: List of NGOs with their projects

- **GET `/api/corporate/ngo/:ngoId`** → `getCorporateNgoProfile()`
  - Used in: `CorporateDashboard.jsx` - NGO Profile Modal
  - Returns: Full NGO profile with all open projects

### Connections & Shortlist
- **GET `/api/corporate/connections`** → `getCorporateConnections()`
  - Used in: `CorporateDashboard.jsx` - Shortlist page
  - Parameters: shortlist=true for saved NGOs

- **POST `/api/corporate/connections/:ngoId/save`** → `saveCorporateNgo()`
  - Used in: `CorporateDashboard.jsx` - Save NGO to shortlist

- **DELETE `/api/corporate/connections/:ngoId/save`** → `removeCorporateNgo()`
  - Used in: `CorporateDashboard.jsx` - Remove NGO from shortlist

### CSR Requests
- **GET `/api/corporate/requests`** → `getCorporateRequests()`
  - Used in: `CorporateDashboard.jsx` - Requests page
  - Returns: All CSR requests sent by corporate

- **POST `/api/corporate/requests`** → `createCorporateRequest()`
  - Used in: `CorporateDashboard.jsx` - Send CSR Request modal
  - Creates new CSR funding request to NGO

- **DELETE `/api/corporate/requests/:requestId`** → `deleteCorporateRequest()`
  - Used in: `CorporateDashboard.jsx` - Delete/withdraw request

### Partnerships
- **GET `/api/corporate/partnerships`** → `getCorporatePartnerships()`
  - Used in: `CorporateDashboard.jsx` - Active partnerships
  - Returns: List of active partnerships

### Activity Log
- **GET `/api/corporate/activity`** → `getCorporateActivity()`
  - Used in: `CorporateDashboard.jsx` - Activity feed
  - Returns: Recent corporate activities

---

## ✅ NGO Dashboard APIs

### Dashboard & Stats
- **GET `/api/ngo/dashboard-stats`** → `getNGODashboardStats()`
  - Used in: `NGODashboard.jsx` - Dashboard page
  - Returns: Total projects, pending requests, active partnerships, project stats by status

### Projects Management
- **GET `/api/ngo/projects`** → `getNGOProjects()`
  - Used in: `NGODashboard.jsx` - Projects page
  - Returns: All NGO projects

- **POST `/api/ngo/projects`** → `createNGOProject()`
  - Used in: `NGODashboard.jsx` - Add Project modal
  - Creates new project

- **PUT `/api/ngo/projects/:projectId`** → `updateNGOProject()`
  - Used in: `NGODashboard.jsx` - Edit Project modal
  - Updates project details

- **DELETE `/api/ngo/projects/:projectId`** → `deleteNGOProject()`
  - Used in: `NGODashboard.jsx` - Delete/Archive project

### CSR Requests (Incoming)
- **GET `/api/ngo/csr-requests`** → `getNGORequests()`
  - Used in: `NGODashboard.jsx` - Connections page (Incoming tab)
  - Returns: Pending CSR requests from corporates
  - **Note**: Frontend filters to show only `status='pending'` requests

- **POST `/api/ngo/csr-requests/:requestId/accept`** → `acceptCSRRequest()`
  - Used in: `NGODashboard.jsx` - Accept request button
  - Accepts CSR request and creates active partnership

- **POST `/api/ngo/csr-requests/:requestId/reject`** → `rejectCSRRequest()`
  - Used in: `NGODashboard.jsx` - Decline request button
  - Rejects CSR request

### Partnerships
- **GET `/api/ngo/partnerships`** → `getNGOPartnerships()`
  - Used in: `NGODashboard.jsx` - Connections page (Accepted tab)
  - Returns: Active partnerships

### Partnership Updates & Messages
- **POST `/api/partnerships/:partnershipId/updates`** → `postPartnershipUpdate()`
  - Used in: `NGODashboard.jsx` - Send message and schedule meeting
  - Creates partnership update/message/milestone

- **GET `/api/partnerships/:partnershipId/updates`** → `getPartnershipUpdates()`
  - Used in: (Available for future use)
  - Returns: All updates for a partnership

- **PUT `/api/partnerships/:partnershipId/progress`** → `updatePartnershipProgress()`
  - Used in: (Available for future use)
  - Updates partnership progress percentage

### Funding/Donations
- **POST `/api/ngo/donations`** → `addNGODonation()`
  - Used in: `FundingPage.jsx` - Add Donation modal
  - Records new donation (logs in user_activity_logs)

- **GET `/api/ngo/donations`** → `getNGODonations()`
  - Used in: (Available for future use)
  - Returns: All donation records

### User Profile
- **GET `/api/user/profile`** → `getUserProfile()`
  - Used in: Both dashboards - Load user profile
  - Returns: User and profile information

---

## 📋 Frontend Features Status

### ✅ Fully Connected (API + Frontend)
1. **Corporate Dashboard**
   - ✅ Dashboard stats
   - ✅ Browse/Discover NGOs with filters
   - ✅ View NGO profile with projects
   - ✅ Save/Remove NGOs from shortlist
   - ✅ Send CSR requests
   - ✅ View/Manage active projects (partnerships)
   - ✅ Send messages to NGOs about projects
   - ✅ View activity log
   - ✅ View/manage CSR requests

2. **NGO Dashboard**
   - ✅ Dashboard stats
   - ✅ Create/Edit/Delete projects
   - ✅ View incoming CSR requests
   - ✅ Accept/Reject CSR requests
   - ✅ View active partnerships
   - ✅ Send messages to corporates (via partnership updates)
   - ✅ Schedule meetings (via partnership updates)
   - ✅ Add donations in Funding page
   - ✅ Analytics page (uses local data from partnerships)

### 🔄 Partially Connected (Frontend ready, API exists)
1. **Partnership Updates**
   - API exists: `POST /api/partnerships/:partnershipId/updates`
   - Frontend uses it for messages and meetings
   - Could be enhanced to show update history

2. **Donation History**
   - API exists: `GET /api/ngo/donations`
   - Frontend currently uses local state
   - Can be enhanced to load from API

---

## 🎯 Key Features

### Image Handling
- **New NGOs**: Upload images during registration → Saved to `/uploads/` → Path stored in `logo_path`
- **Existing NGOs**: Use online hosted images (Unsplash) → Stored in `logo_path`
- **Display**: Server returns full URL for uploaded images, relative path for placeholders
- **Frontend**: Automatically displays correct image based on `logo_path` value

### Request Flow
1. Corporate browses NGOs → `GET /api/corporate/browse-ngos`
2. Corporate sends request → `POST /api/corporate/requests`
3. NGO sees request → `GET /api/ngo/csr-requests` (filtered to `status='pending'`)
4. NGO accepts → `POST /api/ngo/csr-requests/:id/accept` → Creates partnership
5. Both can view partnership → `GET /api/ngo/partnerships` or `GET /api/corporate/partnerships`

---

## 📝 Notes

- All APIs require authentication via JWT token
- APIs return standardized response format: `{ success: boolean, data: {...}, message: string }`
- Frontend uses helper functions (`extractValue`, `extractArray`) to handle API responses
- Error handling is implemented in both frontend and backend
- All database operations use transactions where appropriate

---

**Last Updated**: All APIs are connected and functional! 🎉


