# 🚀 Student Progress Management System
######## VIDEO WALKTHROUGH LINK -->  https://youtu.be/pD3xQsFmGyU?feature=shared  #######
> 


---

## ✨ Features Overview

### 🧑‍🎓 Student Table/Card View
- 👥 Lists all students with:
  - Name, Email, Phone, Codeforces Handle
  - Current & Max Rating
  - Last Data Sync Timestamp
- ✏️ Add / Edit / Delete students
- 📤 Export data as CSV
- 🔍 Profile View for detailed insights

<details>
<summary>📊 <strong>Student Profile View</strong></summary>

#### 📈 Contest History
- Time filters: 30 / 90 / 365 days
- Line graph of rating changes
- Contest list:
  - Ranks, rating changes, problems unsolved

#### 🧩 Problem-Solving Stats
- Filters: 7 / 30 / 90 days
- Metrics:
  - Most difficult problem
  - Total solved, average rating, problems/day
- Visuals:
  - Bar chart by rating bucket
  - Submission heatmap calendar

</details>

<details>
<summary>🔁 <strong>Data Sync</strong></summary>

- 🕑 Auto-sync daily (cron job)
- ⚡ Real-time sync on CF handle update
- ⚙️ Cron config via admin settings


</details>

<details>
<summary>📬 <strong>Inactivity Detection</strong></summary>

- 🚫 Detects students inactive for 7+ days
- 🔕 Option to disable reminders per student

</details>

---

## 💻 Tech Stack

### 🔧 Backend
- `node-cron` for scheduling


### 🖥️ Frontend
- React 19 + React Router 7
- Vite + TypeScript
- Recharts, Framer Motion for visuals
- Tailwind CSS (assumed)
- `uuid` for unique IDs

---

## 🔌 APIs Overview

| Functionality       | Method | 
|---------------------|--------|
| List Students       | GET    |
| Add Student         | POST   |
| View Student        | GET    | 
| Edit Student        | PUT    | 
| Delete Student      | DELETE | 
| Download CSV        | GET    |
| Sync CF Data        | POST   | 
| Toggle Reminders    | PUT    | 
| Get/Set Cron        | GET/PUT|

---

## 🖼️ Key Interfaces

- 🏠 **Dashboard**: Table of students, actions, search, filters
- 📃 **Profile View**: Graphs, history, stats, filters
- ➕ **Add/Edit Student Modal**
- ⚙️ **Settings Page**: Cron frequency config (optional)

---
