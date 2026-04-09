# PROJECT IDEA DOCUMENT
**PrintEase: Smart Print Shop + Document Submission Platform**  
*For College Students & Shop Owners*

**College Print Center | Department of Computer Science | 2024–2025**

## Overview
PrintEase is built to solve two separate but related problems that happen inside a college campus every day: 
1. Long queues at the print shop. 
2. The manual and disorganized way students submit their capstone project reports and internal documents.

---

### Part 1 — Problem Statement

#### 1.1 The Print Shop Problem
Current manual process issues:
- Students carry USB drives or use WhatsApp to share files.
- Standing in long physical queues (30 to 90 minutes).
- Verbal communication of print settings causes misprints and disputes.
- No record of orders, bills, or tracking.
- Shopkeeper manages everything manually.

#### 1.2 The Placed Student — Document Submission Problem
Placed or outstation students cannot physically come to college to submit reports.
- No official digital channel for remote capstone/project report submissions.
- Students depend on friends to submit physically.
- No acknowledgment, receipt, or status updates.
- Faculty manually track submissions with no centralized system.

#### 1.3 Summary
- **Long print queues:** No digital ordering system.
- **Manual print settings:** No structured order form.
- **No tracking:** Students wait with no digital updates.
- **Remote document submission:** Placed students can't submit remotely.
- **No submission confirmation:** Manual paper-based tracking fails.

---

### Part 2 — Solution
PrintEase is a unified web application with two main modules inside one interface, featuring separate portals for Students and Shopkeepers/Admins.

#### 2.1 Module A — Smart Print Request System
Students upload print files remotely, configure settings digitally, view auto-calculated prices, make simulated payments, and receive a QR Code/Order ID. The shopkeeper prints it, and the student collects it without queuing.

#### 2.2 Module B — Remote Document Submission System (New Addition)
Allows students to:
- Upload capstone project reports remotely.
- Fill structured details (Name, Roll No, Dept, Guide, Title).
- Receive an auto-generated Submission Receipt/ID.
- Access a **Notice Section** with validation comments, alerts, and faculty status updates.

#### 2.3 How Both Modules Work Together
- **Print Request:** Students get Print Order ID + QR code.
- **Document Submit:** Placed students get Submission ID + Notice Section.
- **Shop/Admin Dashboard:** Print queue management + validation of submissions.

---

### Part 3 — Requirements of the Student

#### 3.1 Authentication
- Mobile number login with 4-digit OTP (demo display).
- Auto-generate unique Student Print ID (e.g., `SID-2025-001`).
- Persistent session.

#### 3.2 Print Request
- Supported types: PDF, Word, PowerPoint, Images, Text.
- Auto-detect PDF page count.
- Configurable settings: B&W/Color/Mixed, Copies, Single/Double-sided.
- Special instructions field.
- Extra services: Spiral Binding (+₹20), Stapling (+₹5).
- Simulated UPI/Card payment.
- Real-time tracking (Queued → Printing → Ready → Collected) with polling.

#### 3.3 Document Submission (New)
- Form fields: Name, Roll Number, Department, Year, Guide Name, Project Title, Document Type.
- File upload (PDF max 50MB).
- Auto-generated Submission ID (`SUB-2025-0001`).
- Notice Section for faculty feedback.
- Read-only for student after validation.

---

### Part 4 & 5 — Requirements of the Shopkeeper / Admin

#### 4.1 Login
- Email/Password login (default: `shop@printease.com` / `shop123`).

#### 4.2 Print Queue Management
- Real-time dashboard with polling (new orders appear without refresh).
- Order workflow: Queued → Printing → Ready → Completed.
- Sound notifications for new orders.
- Filtering and search functionalities.

#### 4.3 & 5.2 Document Submission Management
- Separate Submission Inbox.
- Download submitted documents.
- **Notice Section:** Admin writes official notes visible to students (Acknowledgment, Missing Document, Approved, Rejected, Resubmit Required).
- **Validation Status Workflow:** Received → Under Review → Approved / Rejected / Resubmit Required.

#### 4.4 Analytics
- Today's orders, revenue, and pages.
- Charts: Orders per hour, B&W vs Color pie chart.
- Submissions this week.

---

### Part 6 — Unified Interface Structure
- **Landing Page:** Side-by-side selection: Student Portal (Blue) vs. Shopkeeper Portal (Green).
- **Student UI:** Mobile-first vertical layout with Dashboard, Upload, History, and Submission tabs.
- **Shopkeeper UI:** Desktop-optimized layout with Sidebar (Queue, Submissions, Analytics, Settings).

#### 6.4 Developer Access
Hidden panel for:
- Pricing configuration.
- Credential reset.
- Data management (clear localStorage).
- Status simulation for testing.

---

### Part 7 & 8 — Complete User Flows
*Referenced from master idea document regarding the detailed step-by-step navigation for Student Print, Student Submission, Shopkeeper Print Management, and Admin Submission Validation.*
