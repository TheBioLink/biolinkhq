
---

# 🚀 BiolinkHQ

**BiolinkHQ** is a full-stack, production-ready **link-in-bio platform** built with modern web technologies.

It allows users to create a **customisable personal page**, manage links, track analytics, and monetise through subscriptions and credits — all from a clean dashboard.

---

## ✨ Features

### 🔐 Authentication

* Google OAuth via **NextAuth**
* MongoDB-backed sessions
* Built-in **ban system** (email + username level)

---

### 🧑‍💻 User Dashboard

* Create and manage your personal page
* Custom username (`/yourname`)
* Edit:

  * Profile info (name, bio, location)
  * Profile & banner images
  * Background (color/image)
  * Social buttons
  * Link cards
* Live preview via public page

---

### 🌐 Public Profile Pages

* Dynamic route: `/[uri]`
* Fully styled personal “mini website”
* Includes:

  * Avatar + banner
  * Bio + location
  * Buttons + links
* Built-in:

  * **Analytics tracking**
  * **Share system**
  * **Ban protection (page + owner)**

---

### 📊 Advanced Analytics

Tracks:

* Page views
* Unique visitors
* Link clicks
* Shares (copy, native, X, etc.)
* Devices, browsers, OS
* Countries
* Referrers

All data is:

* Stored in MongoDB
* Privacy-conscious (anonymous IDs)
* Viewable in dashboard (last 30 days)

---

### ☁️ Media Uploads

* Powered by **Cloudinary**
* Supports:

  * Profile images
  * Banner images
* Auto-resizing + optimisation

---

### 💳 Monetisation (Stripe)

* Subscription system (free → premium tiers)
* Stored on `Page` model
* Includes:

  * Plan tracking
  * Billing cycle
  * Trial support
  * Subscription state

---

### 💰 Credits System

* Internal credit balance per user/page
* Transactions:

  * Grant
  * Spend
  * Refund
* Admin-controlled distribution

---

### 🛡️ Admin System

* Ban users by:

  * Email
  * Username (URI)
* Founder/admin access (hardcoded)
* Admin panel in dashboard

---

### 📈 Event Tracking System

* Stores detailed events:

  * Page views
  * Clicks
  * Shares
* Includes metadata:

  * Device type
  * Browser
  * OS
  * Country
  * Referrer

---

### 🧠 Extra Features

* Referral system
* Job application system (internal hiring page)
* Trust/feedback collector
* Premium UI components

---

## 🧱 Tech Stack

### Frontend

* **Next.js 14 (App Router)**
* React 18
* Tailwind CSS

### Backend

* Next.js API Routes
* Node.js runtime

### Database

* MongoDB
* Mongoose

### Auth

* NextAuth
* MongoDB Adapter

### Storage

* Cloudinary (images)

### Payments

* Stripe

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (website)/        # Public marketing pages
│   ├── (app)/            # Authenticated dashboard
│   ├── (page)/[uri]/     # Public user pages
│   └── api/              # Backend API routes
│
├── components/           # UI components
├── models/               # Mongoose schemas
├── libs/                 # External integrations (Mongo, Stripe, Cloudinary, Analytics)
├── actions/              # Server actions
```

---

## 🔌 API Routes

Key endpoints:

* `/api/auth/[...nextauth]` → Authentication
* `/api/upload` → Cloudinary uploads
* `/api/analytics/track` → Event tracking
* `/api/stats` → Platform stats
* `/api/credits/give` → Admin credit system
* `/api/stripe/*` → Billing / subscriptions

---

## ⚙️ Environment Variables

Create a `.env.local` file:

```env
# MongoDB
MONGO_URI=

# Auth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=biolinkhq

# Stripe
STRIPE_SECRET_KEY=
```

---

## 🚀 Getting Started

```bash
# 1. Clone repo
git clone https://github.com/TheBioLink/biolinkhq.git

# 2. Install deps
npm install

# 3. Add env variables
# (see above)

# 4. Run dev server
npm run dev
```

App runs on:

```
http://localhost:3000
```

---

## 🧠 Key Design Decisions

* **App Router over Pages Router**
* **Server-first architecture** (Next.js 14)
* **MongoDB for flexibility + scaling**
* **Event-based analytics instead of simple counters**
* **Separation of public / dashboard / profile routes**
* **No sensitive data exposed to frontend**

---

## ⚠️ Notes

* README in original repo is outdated — project now uses `src/app`, not `pages/`
* Google OAuth is currently required (no email/password)
* Admin access is currently hardcoded (should be role-based in production)
* Stripe flows are partially implemented but extensible

---

## 🔮 Future Improvements

* Email/password auth option
* Role-based admin system
* Multi-provider OAuth
* Real-time analytics dashboard
* Better rate limiting / abuse protection
* Public API for developers

---

## 📄 License

MIT License
