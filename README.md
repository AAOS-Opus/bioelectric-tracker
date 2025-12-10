# Bioelectric Regeneration Tracker

A comprehensive wellness and bioelectric regeneration tracking platform built with Next.js 15, React 18, TypeScript, and MongoDB.

## 🌟 Features

- **4-Phase Wellness Program** - Foundation, Cellular Activation, Deep Detoxification, Tissue Regeneration
- **Product Tracking** - Time-based protocols (morning/afternoon/evening)
- **Modality Sessions** - Track bioelectric device sessions (Spooky Scalar, MWO)
- **Biomarker Monitoring** - Energy, mood, sleep, digestion, pain, clarity
- **AI Insights** - Pattern recognition and personalized recommendations
- **Progress Journaling** - Rich multimedia entries
- **Dark/Light Theme** - Scheduled theme switching
- **Accessibility** - WCAG compliant with reduced motion support

## 📋 Prerequisites

- Node.js 18.0 or higher
- npm 9.0 or higher
- MongoDB 6.0 or higher

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd Liver_and_Colon
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and configure:

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/bioelectric-tracker
NEXTAUTH_SECRET=generate-a-random-secret-here
NEXTAUTH_URL=http://localhost:3000

# Optional
EMAIL_SERVER=smtp://...
TWILIO_ACCOUNT_SID=...
```

**Generate NextAuth Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Database Setup

Initialize the database with default data:

```bash
npm run db:init
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - TypeScript type checking
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run db:init` - Initialize database schema
- `npm run db:seed` - Seed database with sample data
- `npm run health` - Check application health
- `npm run auth:test` - Test authentication
- `npm run security:verify` - Security audit
- `npm run pre-deploy` - Pre-deployment checks

## 🏗️ Project Structure

```
/src
├── /app                  # Next.js App Router
│   ├── /api             # API routes
│   ├── /auth            # Authentication pages
│   └── /dashboard       # Main application
├── /components          # React components (140+)
│   ├── /ui              # Primitive components
│   ├── /dashboard       # Dashboard widgets
│   ├── /modalities      # Modality scheduling
│   └── /progress        # Progress tracking
├── /lib                 # Utilities & services
├── /models              # Mongoose schemas
├── /types               # TypeScript definitions
├── /hooks               # Custom React hooks
├── /contexts            # React Context providers
└── /store               # State management

/scripts                 # Database & deployment scripts
```

## 🎨 Tech Stack

- **Frontend:** Next.js 15, React 18.3.1, TypeScript
- **Styling:** Tailwind CSS with custom design tokens
- **UI Components:** Radix UI primitives
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** NextAuth.js
- **State:** React Context + SWR
- **Forms:** React Hook Form + Zod validation
- **Testing:** Jest + React Testing Library

## 🔐 Authentication

The application uses NextAuth.js with credentials provider. Default route protection:

- `/` - Redirects to `/auth/login` or `/dashboard` based on auth status
- `/dashboard/*` - Protected routes (requires authentication)
- `/auth/*` - Public authentication pages

## 📊 Database Collections

- `users` - User accounts and profiles
- `phases` - Wellness program phases (4 phases)
- `products` - Supplement/product catalog
- `product_usage` - Product consumption logs
- `modalities` - Bioelectric modality types
- `modality_sessions` - Session tracking
- `progress_notes` - Journal entries
- `biomarkers` - Biomarker definitions
- `biomarker_logs` - Biomarker measurements
- `notifications` - User notifications
- `notification_settings` - Notification preferences

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run specific test file:

```bash
npm test -- ProductTracker.test.tsx
```

Generate coverage report:

```bash
npm run test:coverage
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repository in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Railway

1. Connect GitHub repository
2. Add MongoDB plugin
3. Set environment variables
4. Deploy

### Self-hosted

```bash
npm run build
npm start
```

## 🔧 Configuration

### Theme Customization

Edit `src/app/globals.css` to customize theme colors (HSL format):

```css
:root {
  --primary: 215 75% 20%;
  --success: 142 72% 29%;
  /* ... */
}
```

### Feature Flags

Control features via environment variables:

```bash
NEXT_PUBLIC_ENABLE_INSIGHTS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_EMAIL=false
NEXT_PUBLIC_ENABLE_SMS=false
```

## 📝 License

MIT

## 🤝 Support

For issues and questions, please open an issue in the repository.

---

Built with ❤️ for bioelectric regeneration and wellness tracking
