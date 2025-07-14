# Local Development Guide

This guide explains how to develop the Basketball Review app locally without AWS services.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Mock mode is already enabled!** 
   The `.env` file has `VITE_MOCK_API=true` set, which enables full local development.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## How It Works

### Mock Backend
- All API calls are intercepted and handled locally using localStorage
- No AWS services are required during development
- Data persists across browser sessions
- File uploads are stored as data URLs in localStorage

### Features Available in Mock Mode
- ✅ Player management (create, edit, delete)
- ✅ Team management (create, edit, delete) 
- ✅ Game tracking and statistics
- ✅ Image uploads for players and teams
- ✅ Multi-tenant support (organization switching)
- ✅ Full CRUD operations with persistence

### Switching Between Mock and Real Backend

1. **For local development (mock mode):**
   ```
   VITE_MOCK_API=true
   ```

2. **For production (AWS backend):**
   ```
   VITE_MOCK_API=false
   VITE_API_URL=https://your-api-gateway-url.amazonaws.com
   ```

## Development Workflow

1. **Develop features locally** with mock mode enabled
2. **Test thoroughly** - all data persists in localStorage
3. **Deploy to AWS** when ready using CDK:
   ```bash
   npm run cdk:deploy
   ```

## Mock Data Management

### Clear all mock data:
Open browser console and run:
```javascript
// Clear all basketball mock data
Object.keys(localStorage)
  .filter(key => key.startsWith('basketball-mock-'))
  .forEach(key => localStorage.removeItem(key));
```

### Export mock data:
```javascript
// Export current mock data
const mockData = {};
Object.keys(localStorage)
  .filter(key => key.startsWith('basketball-mock-'))
  .forEach(key => mockData[key] = localStorage.getItem(key));
console.log(JSON.stringify(mockData, null, 2));
```

### Import mock data:
```javascript
// Import mock data
const dataToImport = { /* your data */ };
Object.entries(dataToImport).forEach(([key, value]) => 
  localStorage.setItem(key, value)
);
```

## Architecture Benefits

- **Zero AWS costs** during development
- **Fast iteration** - no deployment needed
- **Works offline** - perfect for development
- **Easy onboarding** - no AWS account needed
- **Clean separation** - frontend has no AWS dependencies

## Next Steps

When you're ready to deploy:
1. Set up AWS credentials
2. Run `npm run cdk:deploy`
3. Update `.env` with the API Gateway URL
4. Set `VITE_MOCK_API=false`

That's it! Happy coding! 🏀