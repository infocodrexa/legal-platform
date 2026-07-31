# NyayaSetu — Legal Document Verification & Online Lawyer Consultation Platform

Ek complete legal-tech platform: users apne documents upload karke verify
karwa sakte hain, aur Bar Council-verified lawyers se video consultation
book kar sakte hain. Do parts hain — **backend** (Node.js + Express +
Prisma + PostgreSQL) aur **frontend** (Next.js 15).

Ye file poore project ko local machine pe chalane ke liye hai — step by
step, shuru se.

---

## 1. Project structure

```
legal-platform/
├── backend/          → Node.js + Express + Prisma API (port 5000)
├── frontend/          → Next.js 15 website + dashboards (port 3000)
├── docs/               → Deployment aur backup-restore documentation
├── docker-compose.yml → Poora stack ek command se chalane ke liye
└── .github/workflows/ → CI/CD pipeline
```

Backend apna alag `README.md` rakhta hai (poori API surface, Phase-wise
build notes) — `backend/README.md`. Frontend ka apna `README.md` bhi hai
(sab pages, design system) — `frontend/README.md`. Ye root file sirf
**"kaise chalayein"** ke liye hai.

---

## 2. Aapko kya chahiye hoga (prerequisites)

Install karo:

| Cheez | Version | Kaise check karein |
|---|---|---|
| Node.js | 18.18 ya usse upar | `node -v` |
| npm | Node ke saath hi aata hai | `npm -v` |
| PostgreSQL | 14 ya upar | `psql --version` |
| Git | koi bhi recent | `git --version` |

Optional (agar Docker se chalana hai to):
| Cheez | Kyun chahiye |
|---|---|
| Docker + Docker Compose | Poora stack (backend+frontend+Postgres+Redis) ek command se |

---

## 3. Sabse jaldi wala tareeka — Docker se (agar Docker install hai)

Agar Docker Desktop ya Docker Engine already install hai, to ye sabse
aasan raasta hai:

```bash
# 1. Repo ke root mein jaao (jahan docker-compose.yml hai)
cd legal-platform

# 2. Backend ka .env file banao
cp backend/.env.example backend/.env
# ab backend/.env file kholo aur real values daalo (Section 6 dekho neeche)

# 3. Poora stack start karo
docker compose up --build
```

Ye 4 cheezein start karega: Postgres, Redis, Backend (`:5000`), Frontend
(`:3000`). Migrations aur seed **automatically nahi chalte** — pehli baar
ke liye Section 5 follow karo (`prisma migrate deploy` aur `db:seed`), ek
alag terminal mein `docker compose exec backend` ke through.

Agar Docker nahi hai, to niche wala manual tareeka follow karo — wahi
zyada common hai.

---

## 4. Manual setup — Step by Step

### Step 1 — Repo clone/download karo aur andar jaao

```bash
cd legal-platform
```

### Step 2 — PostgreSQL database banao

Agar Postgres already install hai:

```bash
# Postgres service start karo (system ke hisaab se command alag ho sakta hai)
# Ubuntu/Debian:
sudo service postgresql start
# Mac (Homebrew):
brew services start postgresql

# Ab database aur user banao
psql -U postgres
```

Phir `psql` ke andar:

```sql
CREATE USER legalplatform WITH PASSWORD 'legalplatform' SUPERUSER;
CREATE DATABASE legalplatform OWNER legalplatform;
\q
```

(Password chahe jo bhi rakho — bas aage `.env` mein wahi daalna hai.)

### Step 3 — Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Ab `.env` file kholo aur ye values badlo (baaki sab default rehne do
local testing ke liye):

```env
DATABASE_URL="postgresql://legalplatform:legalplatform@localhost:5432/legalplatform?schema=public"
JWT_ACCESS_SECRET=koi-bhi-lamba-random-string-daal-do
JWT_REFRESH_SECRET=isse-alag-ek-aur-lamba-random-string
FIELD_ENCRYPTION_KEY=64-hex-characters-ka-string
```

`FIELD_ENCRYPTION_KEY` generate karne ke liye:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Iska output copy karke `.env` mein paste kar do.

Baaki AWS/Razorpay/Google/WhatsApp wale variables abhi ke liye placeholder
values pe hi rehne do (`replace-me` type) — jab tak un features ko real
test nahi karna, tab tak app bina real credentials ke bhi chal jaata hai
(document upload/payment jaise features un features tak nahi pahunchenge,
baaki sab chalega).

### Step 4 — Prisma Client generate karo aur migrations run karo

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Ye do commands:
1. Prisma Client banayenge (database se baat karne wala code)
2. Poora schema (26 tables) real database mein bana denge

Agar sab sahi gaya to terminal mein "Your database is now in sync with
your schema" jaisa message dikhega.

### Step 5 — Seed data daalo (demo accounts + sample content)

```bash
npm run db:seed
```

Ye demo accounts bana dega (Super Admin, Admin, 3 Lawyers, 3 Clients) —
poori list Section 7 mein hai. Saath mein sample documents, appointments,
payments, blog posts, FAQs, testimonials bhi aa jayenge — app bharaa-bharaa
dikhega, khaali nahi.

### Step 6 — Backend start karo

```bash
npm run dev
```

Backend ab `http://localhost:5000` pe chal raha hoga. Check karne ke liye:

```bash
curl http://localhost:5000/health
```

`{"success":true,"message":"OK",...}` aana chahiye.

### Step 7 — Frontend setup (naya terminal kholo)

```bash
cd frontend
npm install
```

Frontend ke liye `.env.local` file banao:

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
```

### Step 8 — Frontend start karo

```bash
npm run dev
```

Ab browser mein `http://localhost:3000` kholo — poori website chalu ho
jayegi.

---

## 5. Ek baar mein sab commands (copy-paste ke liye)

```bash
# Terminal 1 — Backend
cd backend
npm install
cp .env.example .env
# .env mein DATABASE_URL, JWT secrets, FIELD_ENCRYPTION_KEY set karo
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > .env.local
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" >> .env.local
npm run dev
```

---

## 6. `.env` mein kya-kya values chahiye (backend)

| Variable | Zaroori hai kya | Kya karta hai |
|---|---|---|
| `DATABASE_URL` | ✅ Haan | Postgres connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ✅ Haan | Login tokens sign karne ke liye |
| `FIELD_ENCRYPTION_KEY` | ✅ Haan | Sensitive data encrypt karne ke liye (64 hex chars) |
| `BCRYPT_SALT_ROUNDS` | Default theek hai | Password hashing strength |
| `AWS_*` | Sirf agar document upload real test karna hai | S3 file storage |
| `RAZORPAY_*` | Sirf agar payment real test karna hai | Payment gateway |
| `GOOGLE_CALENDAR_*` | Sirf agar Google Meet link chahiye | Video call links |
| `WHATSAPP_*` | Sirf agar WhatsApp notification chahiye | `WHATSAPP_ENABLED=false` rakho to skip ho jaata hai |
| `SMTP_*` | Email bhejne ke liye | Local testing mein fail bhi ho to app crash nahi hota |

**Important**: `AWS_*`, `RAZORPAY_*`, `GOOGLE_CALENDAR_*`, `WHATSAPP_*` ke
bina bhi app chalega — sirf wahi specific features (real file upload,
real payment, real Meet link, real WhatsApp) kaam nahi karenge jab tak
real credentials na dalo.

---

## 7. Demo Accounts (seed chalane ke baad)

Sab ka password: **`Demo@1234`**

| Role | Email |
|---|---|
| Super Admin | `superadmin@nyayasetu.demo` |
| Admin | `admin@nyayasetu.demo` |
| Lawyer (KYC verified) | `lawyer1@nyayasetu.demo` |
| Lawyer (KYC verified) | `lawyer2@nyayasetu.demo` |
| Lawyer (KYC pending — approval workflow test karne ke liye) | `lawyer3@nyayasetu.demo` |
| Client / User | `user1@nyayasetu.demo`, `user2@nyayasetu.demo`, `user3@nyayasetu.demo` |

Login `http://localhost:3000/login` se karo.

---

## 8. Kaunsa URL kya hai

| URL | Kya hai |
|---|---|
| `http://localhost:3000` | Public website (homepage, services, blog, lawyers directory) |
| `http://localhost:3000/login` | Login page |
| `http://localhost:3000/dashboard` | User Dashboard (login ke baad auto-redirect) |
| `http://localhost:3000/lawyer` | Lawyer Dashboard |
| `http://localhost:3000/admin` | Admin Dashboard |
| `http://localhost:5000/health` | Backend health check |
| `http://localhost:5000/api/v1/*` | Saare API endpoints |

---

## 9. Useful commands (baad mein kaam aayenge)

```bash
# Backend
cd backend
npm run prisma:studio     # Database ko browser mein dekhne ke liye GUI
npm run prisma:migrate    # Naya schema change hone par migration banao
npm run dev                # Dev server (auto-restart on change)

# Frontend
cd frontend
npm run build              # Production build banao
npm run start               # Production build ko chalao (build ke baad)
npm run lint                 # Code check karo
```

---

## 10. Agar kuch atke to (Troubleshooting)

**"Can't reach database server"**
→ Postgres chalu hai ya nahi check karo (`sudo service postgresql status`),
aur `.env` mein `DATABASE_URL` sahi hai ya nahi.

**"Prisma Client not generated" / import errors**
→ `npx prisma generate` chalao backend folder ke andar.

**Frontend pe "Network Error" ya API calls fail ho rahi hain**
→ Backend chalu hai ya nahi check karo (`curl http://localhost:5000/health`),
aur frontend ke `.env.local` mein `NEXT_PUBLIC_API_URL` sahi hai ya nahi.

**Login karne ke baad turant logout ho jaata hai**
→ `JWT_ACCESS_SECRET` aur `JWT_REFRESH_SECRET` `.env` mein set hain ya nahi
check karo — khaali nahi honi chahiye.

**Seed script fail ho raha hai**
→ Pehle migrations chali hain ya nahi confirm karo (`npx prisma migrate dev`),
tabhi `npm run db:seed` chalega.

**Document upload / payment / Google Meet / WhatsApp kaam nahi kar raha**
→ Ye sab real third-party credentials maangte hain (AWS S3, Razorpay,
Google, Meta WhatsApp). Jab tak `.env` mein real keys nahi daalo, ye
features error denge — baaki poora app (login, dashboards, CMS, etc.)
bina in credentials ke bhi chalega.

---

## 11. Aage kya padhna hai

- `backend/README.md` — poori API list, har Phase ka detail, security notes
- `frontend/README.md` — poore pages ki list, design system, kaunsa page
  kis API se connect hai
- `docs/deployment.md` — real server pe deploy karne ka guide (Docker,
  CI/CD)
- `docs/backup-restore.md` — database backup kaise le aur restore kaise
  karein
