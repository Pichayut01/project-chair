# Rating Presets Backend

Backend service สำหรับจัดการ preset การให้คะแนนในระบบ Chair App

## 🚀 Features

- **CRUD Operations**: สร้าง, อ่าน, แก้ไข, ลบ preset การให้คะแนน
- **User Authentication**: ใช้ JWT token เดียวกับ main backend
- **Shared Database**: ใช้ MongoDB database เดียวกับ main backend
- **Public Templates**: รองรับ preset แบบ public template
- **Usage Tracking**: ติดตามการใช้งาน preset
- **Duplication**: คัดลอก preset จาก template หรือ preset อื่น

## 📁 Project Structure

```
presets-backend/
├── server.js              # Main server file
├── models/
│   └── RatingPreset.js    # Mongoose model for rating presets
├── routes/
│   └── presets.js         # API routes for presets
├── middleware/
│   └── auth.js            # Authentication middleware
├── package.json           # Dependencies
├── .env                   # Environment variables
└── README.md             # This file
```

## 🔧 Installation

1. Install dependencies:
```bash
cd presets-backend
npm install
```

2. Set up environment variables in `.env`:
```env
PRESETS_PORT=5001
MONGODB_URI=mongodb://localhost:27017/myreactdb
JWT_SECRET=News030347
CLIENT_URL=http://localhost:3000
```

3. Start the server:
```bash
npm run dev    # Development mode with nodemon
npm start      # Production mode
```

## 🌐 API Endpoints

### Authentication
All endpoints require JWT token in `x-auth-token` header.

### Presets Management

#### GET `/api/presets`
Get all presets for authenticated user
- Query params:
  - `classroomId`: Filter by classroom ID
  - `includePublic`: Include public presets (true/false)

#### GET `/api/presets/:id`
Get specific preset by ID

#### POST `/api/presets`
Create new preset
```json
{
  "name": "Quiz Assessment",
  "description": "Standard quiz grading criteria",
  "classroomId": "classroom_id",
  "criteria": [
    {
      "name": "Accuracy",
      "maxScore": 10,
      "weight": 1,
      "description": "Correctness of answers"
    }
  ],
  "isPublic": false,
  "isTemplate": false,
  "tags": ["quiz", "assessment"]
}
```

#### PUT `/api/presets/:id`
Update existing preset (creator only)

#### DELETE `/api/presets/:id`
Delete preset (creator only)

#### POST `/api/presets/:id/use`
Mark preset as used (increment usage count)

#### GET `/api/presets/templates/public`
Get public template presets

#### POST `/api/presets/:id/duplicate`
Duplicate preset to user's collection
```json
{
  "classroomId": "target_classroom_id",
  "name": "Custom Name (optional)"
}
```

## 📊 Data Model

### RatingPreset Schema
```javascript
{
  name: String,              // Preset name
  description: String,       // Optional description
  creator: ObjectId,         // User who created this preset
  creatorName: String,       // Creator's display name
  classroomId: ObjectId,     // Associated classroom
  criteria: [{              // Rating criteria
    name: String,           // Criterion name
    maxScore: Number,       // Maximum score for this criterion
    weight: Number,         // Weight (0-1)
    description: String     // Optional description
  }],
  totalMaxScore: Number,    // Calculated total max score
  isPublic: Boolean,        // Public visibility
  isTemplate: Boolean,      // Template status
  tags: [String],          // Tags for categorization
  usageCount: Number,      // Usage statistics
  lastUsed: Date,          // Last usage timestamp
  createdAt: Date,         // Creation timestamp
  updatedAt: Date          // Last update timestamp
}
```

## 🔗 Integration

### With Main Backend
- Shares MongoDB database connection
- Uses same JWT authentication system
- Same User model for authentication

### With Frontend
- CORS configured for `localhost:3000` and `localhost:3001`
- RESTful API design
- JSON responses with success/error status

## 🚦 Running Multiple Backends

Use the provided `start-servers.bat` script to run both backends simultaneously:
```bash
# From project root
start-servers.bat
```

This will start:
- Main Backend: `http://localhost:5000`
- Presets Backend: `http://localhost:5001`
- React Frontend: `http://localhost:3000`

## 🛡️ Security

- JWT token validation on all routes
- User ownership verification for CRUD operations
- Input validation and sanitization
- CORS protection
- Error handling without sensitive data exposure

## 📝 Usage Examples

### Create a Preset
```javascript
const response = await fetch('http://localhost:5001/api/presets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-auth-token': userToken
  },
  body: JSON.stringify({
    name: 'Presentation Rubric',
    classroomId: 'classroom123',
    criteria: [
      { name: 'Content', maxScore: 25, weight: 1 },
      { name: 'Delivery', maxScore: 25, weight: 1 },
      { name: 'Visual Aids', maxScore: 15, weight: 0.6 }
    ]
  })
});
```

### Get User's Presets
```javascript
const response = await fetch('http://localhost:5001/api/presets?classroomId=classroom123', {
  headers: {
    'x-auth-token': userToken
  }
});
const data = await response.json();
```

## 🔧 Development

### Adding New Features
1. Add routes in `routes/presets.js`
2. Update model in `models/RatingPreset.js` if needed
3. Test with authentication middleware
4. Update this README

### Database Indexes
The model includes optimized indexes for:
- Creator and classroom queries
- Public template searches
- Creation date sorting

## 📞 Support

For issues or questions, check the main Chair App repository or contact the development team.
