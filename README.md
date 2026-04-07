# University Event & Club Management System (Campus Connect)

[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20MongoDB-blue.svg)](https://nodejs.org/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20MSAL-green.svg)](https://reactjs.org/)

## Overview

Campus Connect is a full-stack web application for university club and event management. Features role-based dashboards for Admins, Teachers, Club Heads, Conveners, Coordinators, and Students. Supports Microsoft Azure AD login, event registration, meeting attendance with QR scanning, club management, and more.

## Tech Stack

### Backend
- **Node.js + Express** (`backend/server.js`)
- **MongoDB + Mongoose** (models: User, Club, Event, Meeting, Registration, etc.)
- **Authentication**: MSAL (Microsoft Azure AD), JWT, Passport
- **Dependencies**: bcryptjs, cors, dotenv, jsonwebtoken, qrcode

### Frontend
- **React 19 + React Router** (`frontend/src/App.js`)
- **MSAL React** for Microsoft login
- **Axios** for API calls
- **TailwindCSS** (via CSS modules)
- **Dependencies**: @azure/msal-react, react-router-dom, react-scripts

## Features

- **Role-Based Dashboards**:
  | Role | Features |
  |------|----------|
  | Admin | User/Club management |
  | Teacher | View events/meetings |
  | Club Head/Convener | Create/manage clubs, events, meetings |
  | Student | Register events, scan QR for attendance |
  | Coordinator | Event coordination |

- **Event Management**: CRUD, registration, QR codes
- **Meeting Management**: Schedule, attendance tracking with scanner
- **Club Management**: Create, join, role requests
- **Auth**: Microsoft OAuth, JWT sessions

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Microsoft Azure AD app (clientId/tenantId in .env)

### Setup

1. **Clone & Install**
   ```
   git clone https://github.com/ShalleySharma/university-event-club-management-system.git
   cd university-event-club-management-system
   ```

2. **Backend**
   ```
   cd backend
   copy .env.example .env  # Add DB_URI, MSAL_CLIENT_ID, etc.
   npm install
   npm start  # Runs on http://localhost:5000
   ```

3. **Frontend**
   ```
   cd frontend
   npm install
   npm start  # Runs on http://localhost:3000
   ```

4. **Login**: Use Microsoft account → Redirect to role-based dashboard

## Environment Variables

**.env (backend)**
```
DB_URI=mongodb://localhost:27017/campusconnect
JWT_SECRET=your_jwt_secret
MSAL_CLIENT_ID=your_azure_client_id
MSAL_TENANT_ID=your_tenant_id
SESSION_SECRET=your_session_secret
PORT=5000
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/login | Microsoft login | - |
| GET | /api/clubs | List clubs | ✓ |
| POST | /api/events | Create event | ✓ |
| POST | /api/meetings/:id/attendance | QR attendance | ✓ |
| GET | /api/users/dashboard | Role dashboard data | ✓ |

## Project Structure

```
campus-connect/
├── backend/
│   ├── server.js
│   ├── models/ (User.js, Club.js, Event.js, ...)
│   ├── controllers/
│   ├── routes/
│   └── middleware/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/Dashboard/ (*.jsx, *.css)
│   │   ├── context/AuthContext.js
│   │   └── App.js
└── README.md
```

## Scripts

**Backend** (`backend/`):
- `npm start` – Production
- `npm run dev` – Nodemon dev server

**Frontend** (`frontend/`):
- `npm start` – Dev server (localhost:3000)
- `npm run build` – Production build
- `npm test` – Run tests

## Deployment

- **Backend**: Render/Heroku/Vercel + MongoDB Atlas
- **Frontend**: Vercel/Netlify/Vercel
- Update MSAL config for production domain

## Contributing

1. Fork repo
2. Create feature branch `git checkout -b feature/amazing`
3. Commit changes `git commit -m "Add amazing feature"`
4. Push `git push origin feature/amazing`
5. Open PR to `main`

## License

ISC License - see [LICENSE](LICENSE) (create if missing)

## Contact

Shalley Sharma - [@shalley](https://twitter.com/shalley)  
Project Link: [https://github.com/ShalleySharma/university-event-club-management-system](https://github.com/ShalleySharma/university-event-club-management-system)
