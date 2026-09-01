# Traveloop – Personalized Travel Planning Made Easy

Traveloop is an intelligent, personalized, and collaborative platform that transforms the way individuals plan and experience travel. Built for the Odoo KAHE Hackathon by team **The Invictus**.

## Features
- **Interactive Itinerary Builder:** Drag-and-drop city stops and detailed daily activities.
- **Budget Tracker:** Real-time financial feedback based on estimated activity costs.
- **Packing Checklist:** Categorized, interactive packing lists.
- **Travel Journal:** A dedicated master-detail notebook for trip memories.
- **Public Sharing:** Generate secure, read-only links to share your itineraries.
- **Admin Analytics:** Platform-wide dashboard for metrics and destination insights.

---

## How to Run This Project Locally

Follow these steps to get the project running on your own machine.

### Prerequisites
1. **Node.js** (v16 or higher)
2. **MySQL** Server (running locally)
3. **Git**

### 1. Clone the Repository
Open your terminal and run:
```bash
git clone https://github.com/karthikthebehara/Odoo-KAHE-Hackathon-The-Invictus.git
cd Odoo-KAHE-Hackathon-The-Invictus
```

### 2. Database Setup
1. Open your MySQL client (e.g., MySQL Workbench, XAMPP, or command line).
2. Create a new database named `traveloop`:
   ```sql
   CREATE DATABASE traveloop;
   ```
3. Import the database schema to create the necessary tables. You can run the SQL script provided in the repository:
   ```bash
   mysql -u root -p traveloop < database/schema.sql
   ```
*(Note: If you don't have the command line tool set up, simply open `database/schema.sql`, copy all the text, and execute it as a query inside MySQL Workbench).*

### 3. Server Setup (Backend)
1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` folder (`server/.env`) and add your database credentials and a JWT secret:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=traveloop
   JWT_SECRET=your_super_secret_jwt_key
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *You should see a message saying the server is running on port 5000 and the database is connected.*

### 4. Client Setup (Frontend)
1. Open a **new, separate** terminal window and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm run dev
   ```

### 5. View the App
Open your browser and navigate to `http://localhost:3000`. You can now sign up for a new account and start planning your trips!