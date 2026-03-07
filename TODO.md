# My Clubs Page Implementation Plan

## Task: Add "My Clubs" page for teachers with Create Club functionality

## Files to Update:

### 1. Backend - Club Model (backend/models/Club.js)
Add new fields:
- category (String)
- logo (String - optional URL)
- facultyCoordinator (ObjectId - ref User)
- eventsCount (Number)

### 2. Backend - Club Controller (backend/controllers/clubController.js)
Add new functions:
- getTeacherClubs - Get clubs created by teacher
- updateClub - Update club details
- deleteClub - Delete a club

### 3. Backend - Club Routes (backend/routes/clubRoutes.js)
Add new routes:
- GET /my-clubs - Get teacher's clubs
- PUT /:clubId - Update club
- DELETE /:clubId - Delete club

### 4. Frontend - TeacherDashboard (frontend/src/pages/Dashboard/TeacherDashboard.jsx)
- Update to show "My Clubs" section
- Add "Create Club" button
- Add Create Club modal/form
- Display clubs as cards with edit/delete options

## Implementation Steps:

### Step 1: Update Club Model
- Add category, logo, facultyCoordinator, eventsCount fields

### Step 2: Update Club Controller
- Add getTeacherClubs function
- Add updateClub function
- Add deleteClub function

### Step 3: Update Club Routes
- Add /my-clubs GET route
- Add /:clubId PUT route
- Add /:clubId DELETE route

### Step 4: Update TeacherDashboard
- Add state for clubs and modal
- Add Create Club form
- Display clubs as cards
- Add edit/delete functionality

## UI Design:
- Clubs displayed as cards
- Each card shows: name, description, category, members count, events count
- "Create Club" button at top
- View Details, Edit Club, Delete buttons on each card

