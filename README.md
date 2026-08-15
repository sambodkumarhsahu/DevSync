DevSync

DevSync is a full-stack project management web application built for developers and small teams.

It helps users create projects, manage tasks, track progress, and keep their work organized in one place.

Features
User signup and login
JWT authentication
Create and manage projects
Create and manage tasks
Task priorities
Task status tracking
Task assignment
Project dashboard
File management
Tech Stack

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
Getting Started

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

Open http://localhost:3000 in your browser.

Project Structure
DevSync/
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
│
├── frontend/
│   ├── app/
│   └── public/
│
├── .gitignore
└── README.md
About

I built DevSync to practice full-stack development and learn how a frontend, backend, database, and authentication system work together in a real-world application.

Future Improvements
Team invitations
Real-time collaboration
Notifications
Better file sharing
Search and filtering
Project analytics
Deployment
Author

Sambodh Kumar Sahu

CSE — Delhi Technological University (DTU)
