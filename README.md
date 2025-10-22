# FireGEO - Restructured Architecture

This project has been restructured into a modern **React frontend** and **Node.js backend** architecture with MVC pattern.

## 🏗️ Architecture Overview

```
firegeo/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── routes/         # API route definitions
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database schemas
│   │   ├── utils/          # Helper functions
│   │   ├── middleware/     # Auth, error handling
│   │   ├── config/         # Configuration files
│   │   └── server.js       # Express server
│   └── package.json
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API calls
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Helper functions
│   │   └── main.jsx        # React entry point
│   └── package.json
└── README.md
```

## 🎨 New Color Scheme

The application now uses a beautiful blue gradient color scheme:

- **Primary Blue**: `#3273E3`
- **Black**: `#000000`
- **White**: `#FFFFFF`
- **Gradients**: Various combinations for modern UI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.local .env.local
# Edit .env.local with your configuration
npm run db:push
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local .env.local
# Edit .env.local with your configuration
npm run dev
```

## 🔧 Environment Variables

### Backend (.env.local)
```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="your-secret"
AUTUMN_SECRET_KEY="your-autumn-key"
FRONTEND_URL="http://localhost:3000"
PORT="5000"
```

### Frontend (.env.local)
```env
VITE_API_URL="http://localhost:5000/api"
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/sign-in` - Sign in
- `POST /api/auth/sign-up` - Sign up
- `GET /api/auth/session` - Get session
- `POST /api/auth/sign-out` - Sign out

### Chat
- `POST /api/chat` - Send message
- `GET /api/chat` - Get conversations
- `GET /api/chat/:id` - Get conversation
- `GET /api/chat/credits` - Get credits

### User
- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile

### Brand Monitor
- `GET /api/brand-monitor/analyses` - Get analyses
- `POST /api/brand-monitor/analyze` - Create analysis

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** with Drizzle ORM
- **Better Auth** for authentication
- **Autumn** for billing
- **AI SDK** for multiple AI providers

### Frontend
- **React 18** with Vite
- **React Router** for routing
- **TanStack Query** for data fetching
- **Tailwind CSS** for styling
- **Axios** for API calls

## 🎯 Features

- ✅ **Separated Architecture**: Clean separation of frontend and backend
- ✅ **MVC Pattern**: Routes → Controllers → Services → Models
- ✅ **Modern UI**: Beautiful blue gradient design
- ✅ **Authentication**: Better Auth integration
- ✅ **AI Chat**: Multi-provider AI chat system
- ✅ **Billing**: Autumn credit system
- ✅ **Responsive**: Mobile-first design
- ✅ **Type Safety**: Full TypeScript support (backend can be converted)

## 🔄 Migration from Next.js

The original Next.js application has been restructured:

1. **API Routes** → Backend Express routes with MVC pattern
2. **Pages** → React components with React Router
3. **Components** → Reusable React components
4. **Lib** → Backend services and utilities
5. **Styling** → New blue gradient Tailwind theme

## 📝 Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon
```

### Frontend Development
```bash
cd frontend
npm run dev  # Starts Vite dev server
```

### Database Operations
```bash
cd backend
npm run db:generate  # Generate migrations
npm run db:push      # Push to database
npm run db:studio    # Open Drizzle Studio
```

## 🚀 Deployment

### Backend Deployment
- Deploy to any Node.js hosting (Heroku, Railway, DigitalOcean)
- Set environment variables
- Run database migrations

### Frontend Deployment
- Deploy to Vercel, Netlify, or any static hosting
- Set `VITE_API_URL` to your backend URL
- Build with `npm run build`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details