# TODO: Fix Student/Teacher Login with Microsoft College ID

- [x] Update backend/config/passport.js: Replace placeholder domain with actual domains (@krmangalam.edu.in for teachers, @krmu.edu.in for students) and assign roles based on domain.
- [x] Update backend/routes/authRoutes.js: Use authController.microsoftCallback for the Microsoft callback route to generate JWT and redirect properly.
- [x] Create frontend/src/context/AuthContext.js: New file for authentication context to manage token and user state.
- [x] Update frontend/src/App.js: Add authentication context, handle /auth/success route, protect /dashboard route.
- [x] Update frontend/src/pages/Dashboard/Dashboard.jsx: Display user role, add logout button.
