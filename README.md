# Liberty CRM

A production-ready internal sales CRM built with React + Supabase. Features role-based access, lead pipeline management, action logging, document uploads, and analytics dashboards.

---

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend / Auth:** Supabase (Auth, PostgreSQL, Storage)
- **Styling:** Tailwind CSS (dark theme, DM Sans font)
- **Charts:** Recharts
- **Routing:** React Router v6
- **Toasts:** react-hot-toast

---

## Quick Start

### 1. Clone and install

```bash
cd crm-app
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL Editor, paste and run `schema.sql` — this creates all tables, RLS policies, indexes, and the storage bucket.
3. Copy your credentials from **Project Settings → API**.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Create users

Go to **Authentication → Users → Add User** in Supabase and create your team members. The trigger in `schema.sql` automatically creates their profile rows.

After creating users, go to **Table Editor → profiles** and:
- Set at least one user's `role` to `admin`
- Fill in `full_name` for each user (or the seed script does this)

### 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## Deployment

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or any static host.

---

## Roles

| Role | Access |
|------|-------|
| `admin` | All pages, all leads, user management, analytics dashboard |
| `agent` | My Leads only |

RLS policies enforce data isolation at the database level.
