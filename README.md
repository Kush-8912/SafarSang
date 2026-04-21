# SafarSang - Smart Trip Planner 🌍

A React-based travel planning platform that helps users plan, collaborate, and manage complete trip workflows in one place - from itinerary and budgets to documents, packing, risks, and emergency contacts.

## Student Details

- **Name:** Kushagra Aggarwal
- **Roll Number:** 25BCS10163
- **Student Mail ID:** kushagra.25bcs10163@sst.scaler.com
- **Submitted to:** Mrinal Bhattacharya Sir
- **Project Name:** SafarSang

## Live Deployed Link

- [https://safarsang-9e997.web.app](https://safarsang-9e997.web.app)

## Problem Statement

Travel planning is often fragmented across chats, notes, spreadsheets, map links, and document folders. This causes:

- poor visibility of total trip plan and expenses,
- missed activities and deadlines,
- no single source for travel documents and contacts,
- hard collaboration with co-travelers,
- weak risk awareness before and during a trip.

**SafarSang** solves this by providing a centralized trip management dashboard with structured modules and guided workflows.

## Project Overview

SafarSang is built as a modular React + Firebase application where users can:

- create trips manually or generate them using AI prompts,
- view all trips in a visual dashboard with status and budget insights,
- manage detailed trip data in dedicated modules,
- securely authenticate with email/password or Google,
- recover accounts with password reset flows.

## Features

### Authentication & Account Management

- Email/password signup and login
- Google authentication
- Forgot password + custom reset password flow
- Enforced strong password policy (uppercase, lowercase, number, special char, min length)
- Profile management (name + photo update)

### Trip Creation & Dashboard

- Manual trip planning form with mandatory fields
- AI-powered trip generation
- Destination image banners (auto-fetched place visuals)
- Status-based trip overview and key stats
- Budget summary and trip progress indicators

### Trip Modules

- **Itinerary Planner:** Date/time-based activity planning
- **Budget Splitter:** Expense tracking and split calculations
- **Document Vault:** Store and manage travel document links
- **Packing List:** Checklist with assignees and packed status
- **Risk Flags:** Auto-derived risk indicators from trip data
- **Emergency Contacts:** Quick-access contacts for safety
- **Trip Comments:** Collaborative notes and discussions

### UI/UX Enhancements

- Responsive interface across device sizes
- Animated transitions via Framer Motion
- Segmented date input UX with calendar picker support
- Validation-driven forms with actionable error states

## Technologies Used

- **Frontend:** React 19, Vite
- **Routing:** React Router DOM
- **Auth + Database:** Firebase Authentication, Cloud Firestore
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Styling:** Custom CSS (component-scoped + global styles)
- **Code Quality:** ESLint

## React Concepts Used

This project demonstrates core and advanced React concepts:

- **State Management:** `useState` for local UI/form state
- **Effects & Lifecycle:** `useEffect` for async data flows and syncing
- **Memoization & Performance:** `useMemo`, `useCallback` for derived state and stable handlers
- **Context API:** Global auth and trip state via `AuthContext` and `TripContext`
- **Custom Hooks:** `useTripData` for reusable trip-fetching logic
- **Protected Routing:** Route guarding with `ProtectedRoute`
- **Lazy Loading:** `React.lazy` + `Suspense` for code-splitting
- **Controlled Components:** Form validation and dynamic feedback patterns
- **Component Architecture:** Reusable UI primitives (`Button`, `Modal`, `Badge`, etc.)

## Folder Structure

```bash
src/
├── components/
│   ├── trip/
│   │   ├── BudgetSplitter.jsx
│   │   ├── DocumentVault.jsx
│   │   ├── EmergencyContacts.jsx
│   │   ├── ItineraryPlanner.jsx
│   │   ├── PackingList.jsx
│   │   ├── RiskFlags.jsx
│   │   └── TripComments.jsx
│   ├── ui/
│   │   ├── Badge.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── SegmentedDateInput.jsx
│   │   └── Spinner.jsx
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   └── Sidebar.jsx
├── context/
│   ├── AuthContext.jsx
│   └── TripContext.jsx
├── hooks/
│   └── useTripData.js
├── pages/
│   ├── Auth/
│   │   ├── ForgotPassword.jsx
│   │   ├── Login.jsx
│   │   ├── ResetPassword.jsx
│   │   └── Signup.jsx
│   ├── Profile/
│   │   ├── Profile.jsx
│   │   └── Settings.jsx
│   ├── CreateTrip.jsx
│   ├── Dashboard.jsx
│   ├── NotFound.jsx
│   └── TripDetails.jsx
├── services/
│   ├── ai.service.js
│   ├── auth.service.js
│   ├── firebase.js
│   ├── place-image.service.js
│   └── trip.service.js
├── App.jsx
├── App.css
├── index.css
└── main.jsx
```

## Setup Instructions

### 1) Clone and install

```bash
git clone <your-repo-url>
cd "TERM-3 REACT PROJECT"
npm install
```

### 2) Configure environment

Create a `.env` file in project root:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

Firebase config is currently read from `src/services/firebase.js`.
Update it with your own Firebase project credentials if needed.

### 3) Run development server

```bash
npm run dev
```

### 4) Build for production

```bash
npm run build
npm run preview
```

## Security Note

Current Firestore rules should be hardened before production use. Replace temporary open rules with role- and ownership-based access control rules for `users`, `trips`, and nested trip sub-collections.

## Future Improvements

- Push notifications and reminder system
- Calendar sync integrations
- Better map/location intelligence
- Multi-user role permissions per trip
- Offline-first support and conflict handling
