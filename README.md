# CyBully: A Machine Learning-Powered Cyberbullying Detection and Moderation Workspace

**A Project Submitted to the Department of Computer Science, Bowen University**  
**Student Name:** Pascal Aderinola  
**Academic Role:** B.Sc. Computer Science Candidate  
**Project Focus:** Natural Language Processing (NLP) & Cyberbullying Detection Systems

---

## 📖 Executive Summary & Project Abstract

In contemporary digital communication ecosystems, cyberbullying, hate speech, and online toxicity present significant social and safety challenges. **CyBully** is a high-performance, machine learning-powered moderation workspace designed to identify, analyze, and mitigate cyberbullying and toxic content in real time. 

The system leverages advanced Natural Language Processing (NLP) models to score submitted text inputs across multiple risk dimensions (e.g., toxicity, insults, identity attacks, aggression, repetition, and intent). High-risk submissions trigger automatic "Incidents" that are queued inside a secure, role-based Moderator Dashboard. Administrators can audit the flagged contents, analyze detailed ML safety metrics, record decision logs, and mark incidents as reviewed, dismissed, or escalated.

### Core Capabilities
1. **Multi-Dimensional Risk Scoring**: Evaluation of toxic intent, repetitive harassment behavior, aggression levels, and identity attacks.
2. **Hybrid ML Inference Scorer**: Configured to run on high-accuracy deep learning models (e.g., Detoxify transformers) with an automatic fallback to local heuristic algorithms under resource constraints.
3. **Dual-Mode Processing Pipeline**:
   - **Direct Mode**: Synchronous inference and persistence for low-latency, single-instance deployments.
   - **Queue Mode**: Asynchronous message-broker-driven (RabbitMQ) worker pipelines for high-throughput scaling.
4. **End-to-End Session Security**: Next.js Server-Side Rendering (SSR) session state seamlessly propagated to a secure FastAPI backend via verified Supabase Bearer Auth.
5. **Secure Password Reset**: Fully integrated forgot password flow, token-based verification callback, and inside-app change password panel supporting live Supabase and mock fallback modes.
6. **User Console Session Log**: Interactive activity logging feed persisted in browser local cache to track user text safety scan outcomes.

---

## 🏛️ System Architecture & Data Flow

CyBully uses a decoupled microservices architecture designed to scale components independently:

```mermaid
graph TD
    User([End User]) -->|Submits text /app| Frontend[Next.js App Router]
    Admin([Administrator / Moderator]) -->|Accesses /moderation| Frontend
    Frontend -->|Forwards Supabase Access Token| Backend[FastAPI Core]
    Backend -->|Validates Token against| AuthProvider[Supabase Auth API]
    Backend -->|Fetches / Persists Data| Database[(Supabase PostgreSQL)]
    
    subgraph Machine Learning Pipeline
        Backend -->|Pipeline: Direct| Scorer{ML Scorer Factory}
        Scorer -->|Mode: Detoxify| Model[Detoxify Transformer]
        Scorer -->|Mode: Heuristic| Local[Regex & Lexicon Scorer]
    end
    
    subgraph Asynchronous Queue Pipeline
        Backend -->|Pipeline: Queue| Broker[RabbitMQ Message Broker]
        Broker -->|Job Dispatch| Workers[Inference, Persistence & Alert Workers]
        Workers --> Database
    end
```

### 1. Frontend Web Shell (`apps/web`)
* **Framework**: Next.js 14 (App Router) utilizing React Server Components (RSCs).
* **Styling**: Vanilla CSS custom design system with support for vibrant status elements, glassmorphism, and responsive layouts.
* **Authentication**: Integrated with Supabase Auth for secure email/password sign-in and session state management.
* **Role Check**: Evaluates user roles based on an allowlist config, granting or denying access to admin routes.

### 2. Backend Service API (`services/api`)
* **Framework**: FastAPI (Python 3.11) with fully asynchronous database sessions.
* **ORM & Database**: SQLAlchemy with Alembic for structured PostgreSQL schema migrations.
* **Authentication Handler**: Supabase bearer token validation. The backend receives the token, requests verification from the Supabase auth server, and verifies the user's role on every secure API request.

---

## 🔐 Administrator Dashboard: Access & Workflow

A core requirement of the CyBully workspace is enabling administrators to audit flagged communications and enforce safety policy guidelines.

### How to Access the Admin Dashboard

1. **Moderator Allowlist Configuration**:  
   Access to the dashboard is strictly regulated using an email-based permission model. Open the backend configuration file (`.env`) and configure the `MODERATOR_EMAILS` variable as a comma-separated list of approved admin emails:
   ```text
   MODERATOR_EMAILS=pascal@bowen.edu.ng,admin@example.com
   ```
2. **Frontend Security Guard**:  
   When a user navigates to the `/moderation` path, the Next.js server calls the [requireModerator()](file:///c:/Users/HP/Desktop/cybully/apps/web/src/lib/guards.ts#L13-L19) guard. This guard verifies that the user is logged in and that their email is listed in `MODERATOR_EMAILS`. If unauthorized, they are instantly redirected to `/app`.
3. **Backend API Protection**:  
   All administrative endpoints (e.g., listing incidents, fetching incident details, patching incident status) depend on the [require_moderator_token](file:///c:/Users/HP/Desktop/cybully/services/api/app/core/security.py#L78-L92) FastAPI dependency. Even if frontend guards are bypassed, the API will reject requests with `403 Forbidden` if the user's token does not map to a moderator email.

### How Admins View and Process Incidents

```mermaid
sequenceDiagram
    actor Admin as Moderator (Admin)
    participant UI as Dashboard (/moderation)
    participant API as FastAPI Backend
    participant DB as PostgreSQL DB

    Admin->>UI: Navigate to /moderation
    UI->>API: GET /api/v1/incidents & /api/v1/alerts (with Bearer JWT)
    API->>API: Verify email is in MODERATOR_EMAILS
    API->>DB: Query pending/flagged incidents
    DB-->>UI: Display incident queue list
    Admin->>UI: Select Incident ID
    UI->>API: GET /api/v1/incidents/{id}
    API-->>UI: Return raw content & ML scores
    Admin->>UI: Enter Review Note & Select Action (Reviewed/Dismissed/Escalated)
    UI->>API: PATCH /api/v1/incidents/{id}
    API->>DB: Update status, note, reviewer_email, moderated_at
    DB-->>Admin: Incident successfully processed & UI updates
```

1. **Incident Queue View (`/moderation`)**:  
   Administrators are presented with a clean workspace queue displaying:
   * **Incidents Grid**: List of flagged text blocks, tracking IDs, and timestamps.
   * **Filters**: Quick sorting options by Status (`pending`, `reviewed`, `dismissed`, `escalated`) and Severity (`low`, `medium`, `high`).
   * **High-Severity Alerts Log**: A dedicated warning monitor situated at the bottom of the page showing real-time notifications for critical safety breaches.

2. **Detailed Incident Investigation (`/moderation/incidents/[id]`)**:  
   Clicking on an incident loads a granular diagnostic page displaying:
   * **Flagged Content**: The raw text that triggered the safety alert.
   * **User Meta**: Unique identifiers for both the sender and target accounts.
   * **Severity Metrics**: An overall normalized safety rating.
   * **Detailed NLP Score Breakdown**: Individual metrics for:
     * **Aggression Score**: Detects threat intensity.
     * **Intent Score**: Assesses malice.
     * **Repetition Score**: Evaluates targeted harassment across consecutive window spans.
     * **Toxic, Insult, and Identity Attack Scores**: Calculated by the model.

3. **Moderator Decision Panel**:  
   To resolve the incident, the admin uses the action board at the bottom of the incident page:
   * **Moderator Note**: An input field to write context or record rationale for the action taken (e.g., "User warning issued for identity hate speech").
   * **Flag as Reviewed**: Confirms the content is toxic and marks the audit trail as completed.
   * **Dismiss (Mark Safe)**: Discards the incident as a false positive, returning the content status to safe.
   * **Escalate to Admin**: Heightens priority for upper-level intervention (e.g., account suspension, database exclusion).

---

## 🛠️ Step-by-Step Installation & Local Execution

### Prerequisites
* **Python**: Version 3.11+
* **Node.js**: Version 18+ (with npm)
* **Database**: PostgreSQL Instance (either local or via Supabase)

### Step 1: Clone and Configure Environment Files

Create the root environmental configuration file:
```powershell
Copy-Item .env.example .env
```

Open `.env` and enter your database details and administrator emails:
```text
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@your-supabase-db.pooler.supabase.com:5432/postgres?sslmode=require
MODERATOR_EMAILS=pascal@bowen.edu.ng,admin@example.com
PIPELINE_MODE=direct
SCORER_PROVIDER=auto
```

Create the frontend config file `apps/web/.env.local`:
```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### Step 2: Initialize Supabase SQL Database
Execute the database schema setup either via the Supabase SQL Editor or by running the local script located at:
[supabase/schema.sql](file:///c:/Users/HP/Desktop/cybully/supabase/schema.sql)

### Step 3: Run the FastAPI Backend Service
Navigate to the api folder, install package dependencies in development mode, and start the Uvicorn web server:
```powershell
cd services/api
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```
* **Interactive APIs Docs**: Available at `http://localhost:8000/docs`

### Step 4: Run the Next.js Frontend
From the root repository, install dependencies and boot the server:
```powershell
npm install
npm run dev:web
```
* **Web Portal Address**: `http://localhost:3000`

---

## 🧪 Verification, Testing & Pidgin English Localization

### Running Automated Test Suites

Validate security checks, scorers, database connectivity, and mock context handling:
* **Backend Pytest**:
  ```powershell
  cd services/api
  pytest
  ```
* **Frontend Checks**:
  ```powershell
  npm run lint:web
  npm run test:web
  ```

### Code-Mixed Nigerian Pidgin English Benchmark

Because the project focuses on localized African cyberbullying detection, a localization benchmark has been provided inside the repository:
* **Benchmark File**: [scripts/localization_samples.json](file:///c:/Users/HP/Desktop/cybully/scripts/localization_samples.json)
* **Goal**: Runs code-mixed Pidgin messages (e.g., toxic insults in Pidgin English) to assess ML transformer efficacy vs. local heuristic text filters, logging detection rate performance.

---

## 🚀 Deployed Environments

### 1. Backend Hosting (Hugging Face Spaces)
The backend service is structured with a root [Dockerfile](file:///c:/Users/HP/Desktop/cybully/Dockerfile) exposing port `7860`, allowing free 24/7 hosting on Hugging Face Spaces:
* **Deployment Type**: Docker SDK Template.
* **Secrets**: Managed via Hugging Face Space settings variables (`DATABASE_URL`, `SUPABASE_URL`).

### 2. Frontend Hosting (Vercel)
The Next.js client compiles as a serverless application, configured to communicate with the Hugging Face space endpoint using the `API_BASE_URL` parameter.

---
*For questions, academic reviews, or supervisor sign-offs, please reach out to **Pascal Aderinola** or the **Bowen University Computer Science Department** faculty advisors.*
