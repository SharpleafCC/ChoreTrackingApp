# Kid's Chore Tracker App

## Overview

This is a touch-friendly chore tracking application specifically designed for Avery and Adyson. The app features a simple HTML/CSS/JavaScript interface with a split-screen design, A/B weekly chore rotation system, and automatic earnings tracking. It's optimized for iPad use in full-screen mode mounted on a fridge.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom kid-friendly color palette
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API with JSON responses
- **Validation**: Zod schemas for request/response validation

### Development Setup
- **Environment**: Replit-optimized with development banner and error handling
- **Hot Reload**: Vite HMR for instant feedback during development
- **Build Process**: ESBuild for production server bundling

## Key Components

### Database Schema
- **Kids**: Stores child information (name, stars, color theme)
- **Chores**: Task management with star values and completion status
- **Achievements**: Gamification badges and milestones
- **Rewards**: Purchasable items using earned stars

### API Endpoints
- **Kids Management**: CRUD operations for managing children
- **Chores System**: Create, update, and track chore completion
- **Rewards Store**: Manage available rewards and redemption
- **Achievements**: Track and award special accomplishments

### UI Components
- **Kid-Friendly Design**: Bright colors, rounded corners, and playful typography
- **Responsive Layout**: Mobile-first design with Tailwind breakpoints
- **Interactive Elements**: Progress bars, star displays, and animated feedback
- **Modal System**: Dialog components for adding/editing data

## Data Flow

1. **User Interaction**: Parents and kids interact through the React frontend
2. **API Communication**: Frontend makes HTTP requests to Express backend
3. **Data Validation**: Zod schemas validate incoming data
4. **Database Operations**: Drizzle ORM handles PostgreSQL interactions
5. **Response Handling**: TanStack Query manages caching and state updates
6. **UI Updates**: React components re-render with fresh data

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **tsx**: TypeScript execution for development
- **vite**: Build tool and development server
- **@replit/vite-plugin-runtime-error-modal**: Error handling for Replit

## Deployment Strategy

### Development
- Uses tsx for running TypeScript directly
- Vite dev server with HMR for frontend
- Environment variables for database connection

### Production
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Database**: Drizzle migrations in `./migrations` directory
- **Environment**: NODE_ENV=production with optimized builds

### Database Management
- **Migrations**: Drizzle Kit handles schema migrations with `npm run db:push`
- **Schema**: Centralized in `shared/schema.ts` for type safety
- **Connection**: Environment-based DATABASE_URL configuration
- **Storage**: DatabaseStorage class implements full CRUD operations

## Recent Changes
- January 15, 2025: Converted to simple HTML/CSS/JS chore tracker for Avery & Adyson
- Added PostgreSQL database support with Drizzle ORM
- Implemented DatabaseStorage class replacing MemStorage
- Added A/B weekly chore rotation system (A-list vs B-list chores)
- Created touch-friendly split-screen interface optimized for iPad
- Added automatic daily reset and earnings tracking ($16 base + $4 bonus)
- Set up localStorage persistence for client-side data
- Added parent controls for week approval and task reset

The application now serves a simple HTML file with embedded CSS and JavaScript, making it perfect for full-screen iPad use while maintaining database persistence for chore tracking data.