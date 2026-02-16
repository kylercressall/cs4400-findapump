# Find A Pump

A full-stack web application that allows users to locate nearby gas stations and compare fuel prices through an interactive map interface.

## Project Overview

**Find A Pump** is a monorepo-based full-stack application consisting of:

- A Next.js frontend  
- A Node.js + Express backend  
- A SQLite database managed with Prisma ORM  
- Turborepo for running frontend and backend concurrently  

The backend follows industry-standard architecture:

Routes → Controllers → Services

This separation ensures:
- Routes define endpoints only  
- Controllers handle validation and HTTP responses  
- Services contain business logic and database operations  

## Repository Structure

```
Find-A-Pump-Project/
│
├── documentation/
├── find-a-pump-code/
│   ├── apps/
│   │   ├── frontend/
│   │   └── backend/
│   ├── prisma/
│   ├── package.json
│   ├── turbo.json
│   └── pnpm-workspace.yaml
```

## Prerequisites

- Node.js (v20+)
- pnpm

Install pnpm if needed:

```bash
npm install -g pnpm
```

Verify installations:

```bash
node -v
pnpm -v
```

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kylercressall/cs4400-findapump.git
cd cs4400-findapump/find-a-pump-code
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create the following files:

**apps/backend/.env**
```env
DATABASE_URL="file:./dev.db"
PORT=4000
```

**apps/frontend/.env.local**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```
Note: A valid Google Maps JavaScript API key is required for the map to render properly.

### 4. Initialize Database (First Time Only)

```bash
cd apps/backend
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed
cd ../..
```

## Running the Application

From the `find-a-pump-code` directory:

```bash
pnpm run dev
```

This starts both applications:

- Frontend: http://localhost:3000  
- Backend: http://localhost:4000  

Restart the development server after modifying environment variables.

## Viewing the Database (Optional)

To inspect the database:

```bash
cd apps/backend
pnpm prisma studio
```

Then visit:

http://localhost:5555

## Backend Architecture

The backend uses structured separation:

- `routes/` – Defines API endpoints  
- `controllers/` – Handles validation and HTTP responses  
- `services/` – Contains business logic and database operations  

This structure improves maintainability, scalability, and clarity.
