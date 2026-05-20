# Document Tracking API

<<<<<<< HEAD
# Document Tracking System

A web-based document tracking system built with React, TypeScript, and Vite.  
This application allows users to securely track the status of official documents within the organization.
=======
A RESTful API built with Node.js, Express, and Supabase for managing and tracking documents.

This project provides CRUD operations for document records, including creating, reading, updating, and deleting document information from a Supabase database.
>>>>>>> 9a5a91d (add admin authen)

---

# Features

<<<<<<< HEAD
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
=======
- Get all documents
- Get document by ID
- Get document by UID
- Create new document records
- Update document information
- Delete document records
- JSON REST API
- Supabase database integration
- Environment variable support with dotenv
- CORS enabled

---

# Technologies Used

- Node.js
- Express.js
- Supabase
- dotenv
- cors

---

# Project Structure

```bash
project/
│
├── server.js
├── package.json
├── .env
└── README.md
>>>>>>> 9a5a91d (add admin authen)
```

---

<<<<<<< HEAD
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
=======
# Installation

## 1. Clone Repository

```bash
git clone https://github.com/kengzas1253/School_tacking_document
>>>>>>> 9a5a91d (add admin authen)
```

---

## 2. Enter Project Directory

```bash
cd your-repository
```

---

## 3. Install Dependencies

```bash
npm install
```

---

# Environment Variables

Create a `.env` file in the project root directory.

Example:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-secret-key
PORT=3000
```

---

# Running the Server

## Development Mode

```bash
node server.js
```

or with nodemon:

```bash
npx nodemon server.js
```

---

# API Endpoints

## Get All Documents

```http
GET /documents
```

---

## Get Document By ID

```http
GET /documents/:id
```

Example:

```http
GET /documents/1
```

---

## Get Document By UID

```http
GET /documents/uid/:uid
```

Example:

```http
GET /documents/uid/12345-ABCDE
```

---

## Create Document

```http
POST /documents
```

### Request Body

```json
{
  "uid": "DOC001",
  "record_datetime": "2026-05-19T10:00:00",
  "doc_number": "001/2026",
  "doc_date": "2026-05-19",
  "department": "IT Department",
  "officer_name": "John Doe",
  "subject": "Document Subject",
  "phone_number": "0123456789",
  "status": "Pending",
  "drive_link": "https://drive.google.com/...",
  "remarks": "Important document",
  "processing_at": "2026-05-19T11:00:00",
  "completed_at": null
}
```

---

## Update Document

```http
PUT /documents/:id
```

Example:

```http
PUT /documents/1
```

---

## Delete Document

```http
DELETE /documents/:id
```

Example:

```http
DELETE /documents/1
```

---

# Example Response

```json
{
  "id": 1,
  "uid": "DOC001",
  "doc_number": "001/2026",
  "status": "Pending"
}
```

---

# Database Table

Table name:

```text
document_tracking
```

Recommended columns:

- id
- uid
- record_datetime
- doc_number
- doc_date
- department
- officer_name
- subject
- phone_number
- status
- drive_link
- remarks
- processing_at
- completed_at

---

# Notes

- Make sure your Supabase table permissions allow API access.
- Store your secret keys securely.
- Do not upload `.env` files to GitHub.

---

# License

This project is licensed under the MIT License.
