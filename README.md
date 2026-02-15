# LASUMSA Election Runner

A secure, real-time online voting platform for student elections. Built with React, Node.js, Express, SQLite, and WebSockets.

## Features

- **Secure Voter Authentication** – Voters log in with their matric number + unique voting code
- **One Vote Per Person** – Each voter can only cast their ballot once
- **Real-Time Live Analytics** – Admin dashboard shows live vote counts with charts
- **Mobile Responsive** – Works on all devices
- **Admin Dashboard** – Create elections, manage candidates, monitor results
- **WebSocket Updates** – Instant vote count updates without page refresh

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Seed the database with sample data
npm run seed

# Start both frontend and backend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## Default Admin Credentials

- **Email**: admin@lasumsa.edu
- **Password**: admin123

## Sample Voter Credentials (after seeding)

- **Matric Number**: MAT/2024/001
- **Voting Code**: VOTE-001-ABC

## Architecture

```
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       └── services/
└── server/          # Node.js/Express backend
    ├── routes/
    ├── middleware/
    ├── models/
    └── data/        # SQLite database
```
