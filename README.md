# 🚀 DevSync

> A full-stack project management and team collaboration platform built with the MERN stack.

DevSync is a modern project management application designed to help developers and teams organize projects, manage tasks, collaborate with team members, and keep development work structured in one place.

---

## ✨ Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Protected API routes
- Secure password handling

### 📁 Project Management
- Create and manage projects
- Add project descriptions
- Organize work by project
- Project-based workspace

### ✅ Task Management
- Create tasks
- Update task status
- Set task priorities
- Assign tasks to users
- Track task progress

### 👥 Team Collaboration
- User-based task assignment
- Project workspaces
- Centralized project information

### 📂 File Management
- Upload and manage project files
- Project-specific file organization

### 🎨 Modern Frontend
- Responsive UI
- Dashboard
- Project pages
- Workspace interface
- Login and signup pages
- Built with Next.js and TypeScript

---

## 🛠️ Tech Stack

### Frontend

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**

### Backend

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **JWT Authentication**

### Development Tools

- Git
- GitHub
- npm
- VS Code

---

## 📂 Project Structure

```text
DevSync/
│
├── backend/
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
│   ├── app/
│   │   ├── components/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── projects/
│   │   ├── signup/
│   │   └── workspace/
│   │
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
