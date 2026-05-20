# React + TypeScript + Vite

# Document Tracking System

A web-based document tracking system built with React, TypeScript, and Vite.  
This application allows users to securely track the status of official documents within the organization.

---

# Features

- User Authentication with Supabase
- Secure Login System
- Registration restricted to School Gmail accounts
- File Upload and Storage using Supabase Storage
- Track document status in real-time
- Responsive UI with React + TypeScript
- Fast development environment powered by Vite

---

# Tech Stack

- React
- TypeScript
- Vite
- Supabase Authentication
- Supabase Storage

---

# Installation

## 1. Create Project with Vite

```bash
npm create vite@latest document-tracking-system -- --template react-ts
```

---

## 2. Navigate to Project Folder

```bash
cd document-tracking-system
```

---

## 3. Install Dependencies

```bash
npm install

```
## 4. Environment Variables

Create a `.env` file in the root directory.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-secret-key
```
