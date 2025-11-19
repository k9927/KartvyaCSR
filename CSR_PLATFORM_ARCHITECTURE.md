# CSR Platform Architecture - Corporate-NGO Bridge (CORRECTED)

## 📋 Overview
A platform connecting Corporate entities with NGOs for CSR project collaboration:
- **NGOs** create and manage their own projects/initiatives
- **Corporates** browse NGO projects and send CSR funding requests
- **NGOs** accept/decline CSR requests from corporates
- Once accepted, they collaborate on active projects

**Flow:** NGO creates project → Corporate sees it → Corporate sends CSR request (with funding) → NGO accepts/rejects → Active partnership

---

## 🗄️ Database Schema

### 1. `ngo_projects` Table
Stores projects/initiatives created by NGOs (these are what corporates browse).

```sql
CREATE TABLE ngo_projects (
  id SERIAL PRIMARY KEY,
  ngo_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  focus_area VARCHAR(100) NOT NULL, -- healthcare, education, etc.
  location VARCHAR(255) NOT NULL, -- city, state
  region VARCHAR(100), -- north, south, etc.
  status VARCHAR(50) DEFAULT 'open', -- open | active | completed | archived
  required_funding NUMERIC(15,2), -- how much funding is needed
  beneficiaries_count INTEGER, -- expected beneficiaries
  start_date DATE,
  end_date DATE,
  progress INTEGER DEFAULT 0, -- 0-100
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. `csr_requests` Table
Stores CSR funding requests sent by corporates to NGOs for their projects.

```sql
CREATE TABLE csr_requests (
  id SERIAL PRIMARY KEY,
  corporate_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ngo_project_id INTEGER NOT NULL REFERENCES ngo_projects(id) ON DELETE CASCADE,
  proposed_budget NUMERIC(15,2) NOT NULL, -- funding offer from corporate
  message TEXT, -- optional message from corporate
  status VARCHAR(50) DEFAULT 'pending', -- pending | accepted | rejected | withdrawn
  corporate_feedback TEXT, -- notes from corporate
  ngo_response TEXT, -- response from NGO
  requested_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  UNIQUE(corporate_user_id, ngo_project_id) -- one request per corporate per project
);
```

### 3. `active_partnerships` Table (or update ngo_projects)
When CSR request is accepted, create an active partnership/project.

```sql
CREATE TABLE active_partnerships (
  id SERIAL PRIMARY KEY,
  csr_request_id INTEGER NOT NULL REFERENCES csr_requests(id) ON DELETE CASCADE,
  ngo_project_id INTEGER NOT NULL REFERENCES ngo_projects(id) ON DELETE CASCADE,
  corporate_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ngo_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partnership_name VARCHAR(255), -- name of the collaboration
  agreed_budget NUMERIC(15,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active | completed | terminated
  progress INTEGER DEFAULT 0,
  corporate_contact JSONB, -- { name, email, phone }
  ngo_contact JSONB, -- { name, email, phone }
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Alternative:** You could just update `ngo_projects` to link to `csr_request_id` and `corporate_user_id` when accepted, instead of a separate partnerships table.

### 4. `project_documents` Table
Store files related to partnerships (MoU, reports, etc.)

```sql
CREATE TABLE project_documents (
  id SERIAL PRIMARY KEY,
  partnership_id INTEGER REFERENCES active_partnerships(id) ON DELETE CASCADE,
  ngo_project_id INTEGER REFERENCES ngo_projects(id) ON DELETE CASCADE,
  uploaded_by_user_id INTEGER NOT NULL REFERENCES users(id),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  document_type VARCHAR(100), -- mou, report, proposal, etc.
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Endpoints Structure

### NGO APIs (POST/GET `/api/ngo/*`)

#### 1. **Create Project**
```
POST /api/ngo/projects
Body: {
  name, description, focus_area, location, region,
  required_funding, beneficiaries_count, start_date, end_date
}
Response: { success: true, data: { project: {...} } }
```

#### 2. **List My Projects**
```
GET /api/ngo/projects?status=open&page=1&limit=10
Response: { success: true, data: { projects: [...], total: 50 } }
```

#### 3. **Update My Project**
```
PUT /api/ngo/projects/:projectId
Body: { name?, description?, status?, progress?, ... }
Response: { success: true, data: { project: {...} } }
```

#### 4. **Delete/Archive Project**
```
DELETE /api/ngo/projects/:projectId
Response: { success: true, message: "Project archived" }
```

#### 5. **Get CSR Requests (Incoming)**
```
GET /api/ngo/csr-requests?status=pending
Response: { success: true, data: { requests: [...] } }
```

#### 6. **Accept CSR Request**
```
POST /api/ngo/csr-requests/:requestId/accept
Body: { response?: string }
Response: { success: true, data: { partnership: {...} } }
```

#### 7. **Reject CSR Request**
```
POST /api/ngo/csr-requests/:requestId/reject
Body: { reason?: string }
Response: { success: true, message: "Request rejected" }
```

#### 8. **Get Active Partnerships**
```
GET /api/ngo/partnerships?status=active
Response: { success: true, data: { partnerships: [...] } }
```

---

### Corporate APIs (GET/POST `/api/corporate/*`)

#### 1. **Browse NGO Projects** (public/open projects)
```
GET /api/corporate/browse-projects?focus_area=healthcare&region=north&status=open
Response: { success: true, data: { projects: [...] } }
```

#### 2. **View Project Details**
```
GET /api/corporate/ngo-projects/:projectId
Response: { success: true, data: { project: {...}, ngoInfo: {...} } }
```

#### 3. **Send CSR Request** (funding offer)
```
POST /api/corporate/csr-requests
Body: {
  ngo_project_id,
  proposed_budget,
  message?
}
Response: { success: true, data: { request: {...} } }
```

#### 4. **My Sent Requests**
```
GET /api/corporate/csr-requests?status=pending
Response: { success: true, data: { requests: [...] } }
```

#### 5. **Withdraw CSR Request**
```
DELETE /api/corporate/csr-requests/:requestId
Response: { success: true, message: "Request withdrawn" }
```

#### 6. **Active Partnerships** (where NGO accepted)
```
GET /api/corporate/partnerships?status=active
Response: { success: true, data: { partnerships: [...] } }
```

#### 7. **Track Partnership Progress**
```
GET /api/corporate/partnerships/:partnershipId
Response: { success: true, data: { partnership: {...}, updates: [...] } }
```

---

## 📱 Dashboard Structure

### Corporate Dashboard
**Route:** `/corporate-dashboard` (based on DashboardBundle.jsx)

**Pages/Sections:**
1. **Dashboard Home** (`/dashboard`)
   - Stats: Pending Requests, Active Partnerships, Total Investment
   - Recent activity feed
   - Investment by Focus Area (pie chart)

2. **Discover NGOs** (`/dashboard/discover`) ⭐ **MAIN FEATURE**
   - Browse NGOs (organizations), not individual projects
   - Filters: Search, Focus Area, Verified Only
   - NGO cards showing: name, location, tagline, focus areas, verified status
   - Click "View Profile" to see NGO details

3. **NGO Profile** (`/dashboard/ngo/:ngoId`)
   - View NGO overview (about, description, contact)
   - View NGO's projects (list of their initiatives)
   - **"Connect" button** - sends CSR request to this NGO
   - Tabs: Overview | Projects

4. **My Requests** (`/dashboard/requests`)
   - View all CSR requests sent by corporate
   - Tabs: All | Pending | Accepted | Declined
   - Shows: NGO name, description, amount, status, date
   - Filter by status

5. **Reports & Analytics** (`/dashboard/reports`)
   - Investment by Focus Area (pie chart)
   - Monthly CSR Spending (bar chart)
   - Partnership Growth Over Time (line chart)
   - Partnership summary table

6. **My Profile** (`/dashboard/profile`)
   - Edit company information
   - Contact details, CSR budget, etc.

---

### NGO Dashboard (Already Exists - Needs API Integration)
**Route:** `/ngo-dashboard` ✅

**Current Sections (from code):**
1. **Dashboard Home** ✅
   - Stats: Total Funds, Active Projects, etc.
   - CSR Requests (pending)
   - Fund chart

2. **Projects** ✅ (`/ngo-dashboard/projects`)
   - List their projects
   - Create new project
   - Edit/delete projects
   - **Needs:** API integration to save/create projects

3. **Connections** ✅ (`/ngo-dashboard/connections`)
   - CSR Requests (incoming)
   - Accepted connections
   - Connection history
   - **Needs:** API to accept/reject CSR requests

4. **Active Projects** ✅
   - Shows partnerships (projects with donors)
   - Progress tracking
   - Documents
   - **Needs:** API to load from partnerships table

5. **Analytics** ✅
   - Charts and stats
   - **Needs:** API for real data

6. **Funding** ✅
   - Funding overview
   - **Needs:** API integration

---

## 🚀 Implementation Phases

### Phase 1: Database & Backend Foundation
1. ✅ Create `ngo_projects` table
2. ✅ Create `csr_requests` table
3. ✅ Create `active_partnerships` table
4. ✅ Implement NGO APIs (create, list, update projects)
5. ✅ Implement Corporate APIs (browse, send CSR requests)

### Phase 2: Corporate Dashboard
1. ✅ Create Corporate Dashboard component structure
2. ✅ **Browse NGO Projects** page (main feature)
3. ✅ Send CSR request modal/form
4. ✅ My CSR Requests page
5. ✅ Active Partnerships page

### Phase 3: NGO Dashboard API Integration
1. ✅ Connect "Projects" page to backend (create/list/update)
2. ✅ Connect "Connections" (CSR Requests) to backend
3. ✅ Connect "Active Projects" to partnerships API
4. ✅ Replace all mock data with real API calls

### Phase 4: Advanced Features
1. ✅ Project documents upload
2. ✅ Progress tracking
3. ✅ Notifications system
4. ✅ Analytics dashboards
5. ✅ Search & filters

---

## 🔄 Correct Flow Example

1. **NGO creates project:**
   - NGO: "Clean Water Initiative" - needs ₹3,00,000
   - Status: "open" (looking for funding)

2. **Corporate browses:**
   - Corporate sees "Clean Water Initiative"
   - Interested, sends CSR Request: "We offer ₹3,00,000"
   - Status: "pending"

3. **NGO receives request:**
   - NGO sees CSR request in "Connections" → "Incoming"
   - NGO accepts → Creates active partnership
   - Status: "accepted"

4. **Active partnership:**
   - Shows in NGO dashboard "Active Projects" with donor "Corporate Name"
   - Shows in Corporate dashboard "Active Partnerships"
   - Both track progress

---

## 📝 Next Steps

1. **Run SQL migrations** to create tables
2. **Implement backend APIs** in `server/index.js`
3. **Create Corporate Dashboard** with Browse Projects feature
4. **Integrate NGO Dashboard** with APIs (replace mocks)
5. **Test end-to-end flow**

---

## 🔐 Authentication
All endpoints require JWT authentication via `authenticate` middleware.
- Corporate endpoints: verify `user_type === 'corporate'`
- NGO endpoints: verify `user_type === 'ngo'`
- Users can only access their own data

---

**Ready to start?** Let's begin with Phase 1: Database setup!
