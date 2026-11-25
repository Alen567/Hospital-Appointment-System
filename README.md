# CareConnect – Healthcare Appointment Management System

CareConnect is a full-stack healthcare appointment management system designed to simplify the interaction between patients, doctors, and healthcare administrators. It provides a centralized platform for managing doctor information, departments, patient profiles, and medical appointments.

The application uses a role-based access system with separate dashboards for patients, doctors, and administrators.

## Features

### Patient
- Register and securely log in.
- Browse available doctors.
- View doctor information and specializations.
- Book appointments with doctors.
- View and manage personal appointments.
- Cancel appointments.
- Manage personal profile.

### Doctor
- Access a dedicated doctor dashboard.
- View and manage appointments.
- Manage appointment availability and time slots.
- View patient information.
- Update professional profile information.

### Administrator
- Access the administrative dashboard.
- Manage doctors and their information.
- Manage healthcare departments.
- Manage registered patients.
- View and manage appointments.
- Monitor application statistics.

### Authentication and Security
- JWT-based authentication.
- Role-based access control.
- Protected dashboard routes.
- Password hashing using bcrypt.
- Authenticated API requests using Axios.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Build Tool | Vite |
| Styling | CSS |
| Backend | Node.js |
| Backend Framework | Express.js |
| Database | PostgreSQL |
| Authentication | JSON Web Tokens (JWT) |
| Password Hashing | bcrypt |
| HTTP Client | Axios |
| Icons | Lucide React |
| Version Control | Git and GitHub |
| Cloud Deployment (Planned) | Amazon Web Services (AWS) |

## Project Architecture

CareConnect follows a client-server architecture.

```text
                 CARECONNECT
                      |
          +-----------+-----------+
          |                       |
      Frontend                 Backend
     React + Vite           Node.js + Express
          |                       |
          |      HTTP / REST API  |
          +-----------------------+
                      |
                      |
                  PostgreSQL
                   Database
```

### Directory Structure

```text
CareConnect/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

*Note: The directory structure is illustrative and may be adjusted to match the actual project.*

## Getting Started

Follow these instructions to run CareConnect locally.

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Alen567/CareConnect.git
```

Navigate into the project directory:

```bash
cd CareConnect
```

### 2. Configure the Database

Create a PostgreSQL database named:

```sql
CREATE DATABASE careconnect_db;
```

Configure the database connection using the backend environment variables.

### 3. Configure Environment Variables

Create a `.env` file inside the `backend/` directory.

Example:

```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/careconnect_db
JWT_SECRET=your_secret_key
```

Create a `.env` file inside the `frontend/` directory.

```env
VITE_API_URL=http://localhost:5000/api
```

Replace the example values with your actual local configuration.

**Important:** Never commit actual environment files, database passwords, JWT secrets, or other credentials to GitHub.

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

Start the backend using the development script configured in `backend/package.json`.

```bash
npm run dev
```

### 5. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm run dev
```

### 6. Access the Application

Open the frontend URL displayed by Vite in your terminal. By default:

```text
http://localhost:5173
```

The backend API runs on port `5000` by default.

## Database

CareConnect uses PostgreSQL as its relational database.

The database stores information related to:

- Users and authentication.
- Patient profiles.
- Doctor profiles.
- Healthcare departments.
- Appointment records.
- Doctor availability and appointment slots.

## Future Improvements

Potential future enhancements include:

- AWS cloud deployment.
- Online document storage using Amazon S3.
- Email notifications for appointments.
- Improved appointment reminders.
- Enhanced application monitoring.
- High availability and scalability using AWS services.

## Cloud Deployment

AWS deployment is planned as a future stage of the project.

The proposed infrastructure includes:

- Amazon EC2 – Application hosting.
- Amazon RDS – Managed PostgreSQL database.
- Amazon S3 – Object storage.
- Amazon VPC – Network infrastructure.
- AWS IAM – Access and permissions management.
- AWS Security Groups – Network access control.

Additional services such as Elastic Load Balancing and Auto Scaling may be introduced for scalability and high availability.

## Project Status

**Development:** Core application features are implemented. Local testing and validation are ongoing.

**Deployment:** AWS deployment is planned.

## Author

**Alen George Arackal**

- GitHub: [Alen567](https://github.com/Alen567)
- Portfolio: [My Digital Portfolio](https://alen567.github.io/My-Digital-Portfolio/)

---

*CareConnect – Connecting Patients and Healthcare Professionals.*