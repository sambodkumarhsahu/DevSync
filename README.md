# 🚀 DevSync

> A full-stack project management and team collaboration platform for developers and teams.

DevSync is a modern project management platform designed to help development teams organize projects, manage tasks, assign work, and collaborate efficiently from a centralized workspace.

---

## 🌟 Overview

Managing software projects often involves multiple tools for tasks, projects, files, and team communication.

**DevSync** brings the core project management workflow into one application.

Users can:

- Create and manage projects
- Create and track tasks
- Assign tasks to users
- Set task priorities
- Track task status
- Manage project files
- Work inside dedicated project workspaces
- Authenticate securely using JWT

---

## ✨ Features

### 🔐 Authentication

- User registration
- User login
- JWT-based authentication
- Protected API routes
- Password-based authentication
- Persistent authenticated sessions

### 📁 Project Management

- Create projects
- View projects
- Manage project information
- Project-specific workspaces
- Organize tasks by project

### ✅ Task Management

- Create tasks
- Edit tasks
- Assign tasks
- Set task priority
- Track task status
- Organize tasks by project

### 📊 Task Status

Tasks can be organized into different stages:

```text
TODO → IN PROGRESS → DONE
```

### 🎯 Task Priority

Each task can have a priority level:

```text
LOW
MEDIUM
HIGH
```

### 👥 Team Collaboration

DevSync is designed around team-based development workflows.

Users can:

- Assign tasks
- Organize work by project
- Track project progress
- Work inside shared project workspaces

### 📂 File Management

Projects can contain files that are managed through the backend API.

This provides a centralized location for project-related resources.

### 🎨 Modern Dashboard

The frontend provides dedicated interfaces for:

- Dashboard
- Projects
- Workspace
- Login
- Signup
- Task management

---

# 🛠️ Tech Stack

## Frontend

| Technology | Purpose |
|------------|---------|
| Next.js | React framework |
| React | UI development |
| TypeScript | Type-safe development |
| Tailwind CSS | Styling |
| Next.js App Router | Application routing |

## Backend

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | REST API |
| MongoDB | Database |
| Mongoose | MongoDB ODM |
| JWT | Authentication |

## Tools

| Tool | Purpose |
|------|---------|
| Git | Version control |
| GitHub | Repository hosting |
| VS Code | Development |
| npm | Package management |

---

# 🏗️ Architecture

DevSync follows a full-stack architecture where the Next.js frontend communicates with the Express.js backend through REST APIs.

```text
                    ┌──────────────────────┐
                    │       DevSync        │
                    │      Frontend        │
                    │      Next.js         │
                    └──────────┬───────────┘
                               │
                               │ HTTP / REST API
                               ▼
                    ┌──────────────────────┐
                    │       Backend        │
                    │     Express.js       │
                    │      Node.js         │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌─────────────────┐       ┌─────────────────┐
        │   JWT Auth      │       │    MongoDB      │
        │ Authentication  │       │    Database     │
        └─────────────────┘       └─────────────────┘
```

---

# 📂 Project Structure

```text
DevSync/
│
├── backend/
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── models/
│   │   ├── File.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── files.js
│   │   ├── projects.js
│   │   └── tasks.js
│   │
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   │
│   ├── app/
│   │   │
│   │   ├── components/
│   │   │   └── Navbar.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx
│   │   │
│   │   ├── projects/
│   │   │   └── page.tsx
│   │   │
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   │
│   │   ├── workspace/
│   │   │   └── [projectId]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── public/
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── postcss.config.mjs
│
├── .gitignore
└── README.md
```

---

# ⚙️ Getting Started

Follow the steps below to run DevSync locally.

## 1. Clone the repository

```bash
git clone https://github.com/sambodkumarhsahu/DevSync.git
```

Move into the project directory:

```bash
cd DevSync
```

---

# 🔧 Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

---

## 🔑 Environment Variables

Create a file named:

```text
.env
```

inside the `backend` directory.

Add:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

### Example

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/devsync
JWT_SECRET=your_secret_key
PORT=5000
```

> ⚠️ Never commit your `.env` file to GitHub.

---

## ▶️ Start Backend

Run:

```bash
npm start
```

The backend should start on:

```text
http://localhost:5000
```

---

# 💻 Frontend Setup

Open a new terminal.

From the project root:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

---

# 🔄 Running the Full Application

You need both the frontend and backend running.

### Terminal 1 — Backend

```bash
cd backend
npm install
npm start
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

# 🔑 Environment Variables

The backend requires:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret used for JWT authentication | `your-secret` |
| `PORT` | Backend server port | `5000` |

---

# 🔌 API Structure

DevSync uses REST APIs for communication between the frontend and backend.

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

## Projects

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
```

## Tasks

```text
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

## Files

```text
GET    /api/files
POST   /api/files
DELETE /api/files/:id
```

> API routes may evolve as the application continues to develop.

---

# 🔐 Authentication Flow

DevSync uses JWT-based authentication.

```text
User
 │
 │ Login / Signup
 ▼
Frontend
 │
 │ POST request
 ▼
Express API
 │
 │ Validate credentials
 ▼
MongoDB
 │
 │ User verified
 ▼
JWT Token
 │
 ▼
Frontend
 │
 │ Authenticated requests
 ▼
Protected API Routes
```

---

# 📋 Task Workflow

Tasks follow a simple development workflow:

```text
┌─────────┐
│   TODO  │
└────┬────┘
     │
     ▼
┌─────────────┐
│ IN PROGRESS │
└──────┬──────┘
       │
       ▼
┌─────────┐
│  DONE   │
└─────────┘
```

Tasks can also be categorized by priority:

```text
🔴 HIGH
🟡 MEDIUM
🟢 LOW
```

---

# 🖥️ Application Pages

DevSync currently contains the following major pages:

### Landing Page

Introduces DevSync and provides navigation into the application.

### Login

Allows existing users to authenticate.

### Signup

Allows new users to create accounts.

### Dashboard

Provides an overview of projects and tasks.

### Projects

Displays and manages projects.

### Workspace

Provides a project-specific environment where users can manage their development work.

---

# 📸 Screenshots

Add application screenshots here.

Example:

```text
screenshots/
├── dashboard.png
├── projects.png
├── workspace.png
├── login.png
└── signup.png
```

Then add them to the README:

```markdown
![Dashboard](screenshots/dashboard.png)
```

---

# 🚀 Future Improvements

DevSync is actively being developed.

Planned features include:

- [ ] Real-time collaboration
- [ ] Team invitations
- [ ] Role-based access control
- [ ] Drag-and-drop task management
- [ ] Task comments
- [ ] Task deadlines
- [ ] Notifications
- [ ] Activity timeline
- [ ] Project analytics
- [ ] Project progress charts
- [ ] File previews
- [ ] Cloud file storage
- [ ] Search and filtering
- [ ] Dark/light theme
- [ ] Email notifications
- [ ] Real-time updates with WebSockets
- [ ] Production deployment
- [ ] CI/CD pipeline

---

# 🧪 Development

To check the frontend for production issues:

```bash
cd frontend
npm run build
```

To start the frontend development server:

```bash
npm run dev
```

To start the backend:

```bash
cd backend
npm start
```

---

# 🌐 Deployment

DevSync can be deployed using modern cloud platforms.

Potential deployment architecture:

```text
                 ┌──────────────────┐
                 │     Frontend     │
                 │     Next.js      │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │     Backend      │
                 │   Node + Express │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │     MongoDB      │
                 │      Atlas       │
                 └──────────────────┘
```

---

# 🤝 Contributing

Contributions are welcome.

### 1. Fork the repository

Create your own fork of DevSync.

### 2. Clone your fork

```bash
git clone https://github.com/your-username/DevSync.git
```

### 3. Create a feature branch

```bash
git checkout -b feature/your-feature
```

### 4. Make your changes

Implement your feature or fix.

### 5. Commit your changes

```bash
git add .
git commit -m "Add your feature"
```

### 6. Push your branch

```bash
git push origin feature/your-feature
```

### 7. Open a Pull Request

Submit your changes for review.

---

# 🛡️ Security

Please do not commit sensitive information such as:

- MongoDB credentials
- JWT secrets
- API keys
- Access tokens
- Private configuration

Environment variables should be stored in:

```text
backend/.env
```

The `.env` file is intentionally excluded from Git using `.gitignore`.

---

# 📄 License

This project is currently intended for educational, development, and portfolio purposes.

---

# 👨‍💻 Author

## Sambodh Kumar Sahu

Computer Science & Engineering  
Delhi Technological University

---

# ⭐ Support

If you find DevSync useful or interesting, consider giving the repository a ⭐ on GitHub.

---

## 🔗 Repository

GitHub:

https://github.com/sambodkumarhsahu/DevSync

---

<p align="center">
  Built with ❤️ using Next.js, Node.js, Express.js and MongoDB.
</p>
