# FinTrack – Smart Personal Finance & Expense Management System

FinTrack is a full-stack, enterprise-grade personal finance management application engineered with a **React + Vite** frontend, a **Python Django REST Framework** backend, and a secure **TiDB Cloud Serverless** database connected via encrypted TLS transport.

---

## 🌟 Key Features

### 1. 🔐 Authentication & Profile Security
- JWT-based authentication (access token rotation and refresh token blacklisting).
- Secure password hashing with PBKDF2/Argon2.
- User profile management (name, phone, avatar, preferred currency: INR, USD, EUR, GBP).
- Self-service password reset flow and change password facility.
- Strict multi-tenant data isolation: every financial query is strictly scoped to `request.user`.

### 2. 📈 Income & Expense Management
- Real-time logging of income earnings and expense outlays.
- System-default and custom user-defined categories with personalized colors and icons.
- Automated dynamic calculations for daily, weekly, monthly, and yearly income/expense totals.
- Search, filter by date range/category, and sort by amount or date.

### 3. 📊 Interactive Dashboard & Financial Analytics
- Net cash balance, total income, total expenses, and savings rate.
- Interactive **Recharts** visualizations:
  - 6-month historical income vs. expense area chart.
  - Category spending breakdown donut/pie chart.
  - Real-time budget utilization meters.
  - Savings goal milestone cards.
- Quick transaction entry drawer.

### 4. 🎯 Budget Management & Automated Alerts
- Monthly category-specific spending caps.
- Dynamic tracking of spent, remaining, and percentage utilization.
- Non-duplicate automated alerts triggered at **50%**, **75%**, **90%**, and **100% (exceeded)** thresholds.

### 5. 💰 Savings Goals
- Goal creation with target amount, target date, and descriptions.
- Atomic contribution transactions (`transaction.atomic`) preventing race conditions.
- Real-time completion progress meters with automated milestone completion alerts.

### 6. 📅 Financial Calendar & Recurring Transactions
- Month-view calendar displaying daily financial inflows and outflows with click-to-inspect transaction drawers.
- Scheduled recurring transactions (Daily, Weekly, Monthly, Yearly) with duplicate-prevention execution checks.

### 7. 📑 Audited Financial Statements & Exports
- Multi-format exports:
  - **PDF Statements**: Professional formatted financial statements using ReportLab.
  - **Excel Workbooks**: Styled multi-sheet financial workbooks using OpenPyXL.
  - **CSV Exports**: Raw transaction ledgers.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM, Axios, Recharts, Lucide React, React Hot Toast |
| **Backend** | Python 3.12, Django 6, Django REST Framework, Simple JWT, django-cors-headers, PyMySQL, ReportLab, OpenPyXL |
| **Database** | TiDB Cloud Starter (Serverless v8.5), MySQL-compatible with TLS (`ISRG Root X1` CA verification) |
| **Deployment** | Vercel (Frontend), Render (Backend), TiDB Cloud (Database) |

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22.14.0)
- **Python**: 3.11+ (tested on Python 3.12)
- **TiDB Cloud Starter Cluster**

---

### 2. Backend Setup

1. Open PowerShell and navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

3. Install required Python packages:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure environment variables in `backend/.env`:
   ```env
   TIDB_HOST=your-cluster-gateway.tidbcloud.com
   TIDB_PORT=4000
   TIDB_USER=your_user.root
   TIDB_PASSWORD=your_password
   TIDB_DB_NAME=finance_management
   CA_PATH=certs/tidb-ca.pem

   DJANGO_SECRET_KEY=your-secure-django-secret-key
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

5. Test the TLS connection to TiDB Cloud:
   ```powershell
   python test_tidb.py
   ```

6. Run database migrations:
   ```powershell
   python manage.py migrate
   ```

7. Seed default financial categories:
   ```powershell
   python manage.py seed_categories
   ```

8. Start the Django development server:
   ```powershell
   python manage.py runserver 8000
   ```
   API root: `http://localhost:8000/api/`

---

### 3. Frontend Setup

1. Open a new PowerShell terminal and navigate to `frontend`:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Configure frontend environment variables in `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

4. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   App URL: `http://localhost:5173`

---

## 🧪 Automated Testing

FinTrack comes with automated tests covering authentication, transaction workflows, budget alerts, savings goals, and cross-user data isolation.

To run the automated test suite:
```powershell
cd backend
python manage.py test
```

Expected output:
```
Ran 18 tests in ~50s
OK
```

---

## 🚢 Deployment Guide

### A. Database (TiDB Cloud)
- Use your existing cluster on TiDB Cloud Serverless.
- Ensure TLS transport verification is active with the `tidb-ca.pem` certificate.

### B. Backend (Render)
1. Push your repository to GitHub.
2. In Render, create a new **Web Service** connected to your repository.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `./build.sh` (or `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate && python manage.py seed_categories`)
   - **Start Command**: `gunicorn config.wsgi:application`
4. Add the environment variables from `backend/.env.example` in the Render dashboard.

### C. Frontend (Vercel)
1. In Vercel, import your GitHub repository.
2. Configure the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variable:
   - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com/api`
4. Deploy. The included `frontend/vercel.json` ensures clean client-side routing on all paths.

---

## 🛡️ Security Architecture

1. **Zero Credential Hardcoding**: Database passwords and Django secret keys are strictly read from environment variables (`.env`).
2. **Encrypted Transport**: All TiDB Cloud queries enforce TLS with certificate authority verification.
3. **Queryset Sandboxing**: All Django querysets filter explicitly by `user=request.user` to prevent horizontal privilege escalation.
4. **Token Invalidation**: Refresh tokens are blacklisted upon logout via SimpleJWT token blacklist.
