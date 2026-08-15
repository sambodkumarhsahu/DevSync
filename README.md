DevSync 🚀

DevSync is a full-stack project management web application built for developers and small teams.

It allows users to create projects, manage tasks, track progress, and organize their work in one place.

✨ Features
🔐 User signup and login
🔑 JWT authentication
📁 Create and manage projects
✅ Create and manage tasks
🎯 Task priorities
🔄 Task status tracking
👥 Task assignment
📊 Project dashboard
📎 File management
🌐 REST API backend
🛠️ Tech Stack

Frontend

Next.js
React
TypeScript
Tailwind CSS

Backend

Node.js
Express.js
MongoDB
Mongoose
JWT
📂 Project Structure
DevSync/
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── app/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
🚀 Getting Started

Clone the repository:

git clone https://github.com/sambodkumarhsahu/DevSync.git
cd DevSync
Backend
cd backend
npm install
npm start

Create a .env file inside the backend folder:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Then open:

http://localhost:3000
🔒 Environment Variables

The .env file contains private configuration and is intentionally excluded from Git.

Required variables:

MONGO_URI
JWT_SECRET
PORT
💡 Why I Built This

I built DevSync to get practical experience with full-stack development.

While building it, I worked with authentication, REST APIs, MongoDB, database models, Next.js, React, TypeScript, and connecting a frontend with a backend.

🔮 Future Improvements
Team invitations
Real-time collaboration
Notifications
Better file sharing
Search and filtering
Project analytics
Deployment
👨‍💻 Author

Sambodh Kumar Sahu

CSE Student — Delhi Technological University (DTU)

GitHub: @sambodkumarhsahu
