# FINAL CAPSTONE PROJECT REPORT

**PROJECT TITLE:** 
**PrintEase: Smart Print Shop & Remote Document Submission Platform**
*Submitted in partial fulfillment of the requirements for the Degree in Computer Science / Engineering*

---

## ABSTRACT
The traditional university print shop process is bottlenecked by physical queues, manual file transfers via USB or messaging apps, and disorganized communication regarding print configurations. Simultaneously, final-year students (especially those placed out-station) struggle with the lack of a centralized, secure remote submission system for official capstone reports. This project, **PrintEase**, introduces a unified, progressive web application (PWA) solution. The platform provides a dual-module interface connecting students and shop administrators seamlessly. By integrating proprietary client-side document parsing for precise page calculation, a dynamic pricing engine, and Razorpay-powered online transactions, the system digitizes the entire lifecycle of document printing and academic report submission.

---

## CHAPTER 1: INTRODUCTION

### 1.1 Project Overview
PrintEase aims to modernize campus utility infrastructure. By leveraging a high-performance React and Node.js stack, the application splits functionality into two distinct user portals: a mobile-first Student Interface and a desktop-optimized Shopkeeper/Admin Dashboard. 

### 1.2 Objective
* To eliminate physical wait times at the campus print shop.
* To provide accurate, automated document page counting algorithms (bypassing the need for manual inspection).
* To establish a formal, remote gateway for students to submit and track capstone project reports dynamically.

---

## CHAPTER 2: PROBLEM STATEMENT

The current ecosystem suffers from severe operational inefficiencies:
1. **The Print Bottleneck:** Students wait up to 90 minutes to print simple documents. The reliance on manual USB transfers and verbal communication of precise printing settings (Colour vs B&W, Binding, Pages to print) leads to high error rates and disputes.
2. **The Remote Submission Void:** Last-semester students who are on out-station internships lack an official channel to submit mandatory capstone documents. Faculty also lack a centralized database to validate, track, and acknowledge these massive PDF reports.

---

## CHAPTER 3: PROPOSED SOLUTION

PrintEase solves these issues via a completely digital ecosystem functioning inside a Progressive Web App (PWA).

### 3.1 Module A: Smart Print Request System
Instead of waiting in line, students access PrintEase on their phone, upload their document, automatically see the calculated price, and pay online. They receive a Print ID and QR code, which they simply scan at the shop counter to pick up their items once the app notifies them the print is "Ready".

### 3.2 Module B: Remote Document Submission Gateway
A specialized component allowing students to submit official project files alongside critical metadata (Roll Number, Department, Guide Name). An admin dashboard reviews these submissions, utilizing a "Notice Section" to formally Approve, Reject, or request Resubmissions directly from the student.

---

## CHAPTER 4: SYSTEM ARCHITECTURE & TECHNOLOGIES

The application is built on a highly robust, serverless full-stack architecture ensuring speed, data integrity, and compliance.

### 4.1 Technology Stack
* **Frontend:** React 18, TypeScript, Vite Bundler.
* **Styling & UI:** TailwindCSS, Shadcn UI (Radix Primitives) for accessible, responsive interfaces.
* **Backend Database:** Supabase (PostgreSQL) for relational data models governing Users, Orders, and Pricing configurations.
* **Authentication:** Custom JWT mapping using `bcryptjs` and session tokens for high-level security between Student and Admin privileges.
* **Payment Gateway:** Razorpay API for live KYC-compliant checkout.
* **Hosting:** Vercel (Production-level serverless deployment).

### 4.2 Progressive Web App (PWA) Integration
To maximize student adoption, the Vite PWA plugin was integrated to allow students to "install" the web app directly onto their phone's home screen. The service workers cache previous transactions, allowing QR codes and order status to display even when the campus Wi-Fi drops.

---

## CHAPTER 5: KEY TECHNICAL INNOVATIONS implementation details

### 5.1 Standalone Client-Side Document Parsing (Smart Counting)
The largest technical hurdle was generating accurate pricing for `.doc` and `.docx` files without relying on paid external APIs (like CloudConvert) or having MS Word installed on the server. 
**Implementation:** The system utilizes `JSZip` to natively extract and decode the underlying XML structure of Microsoft Word documents locally in the user's browser. It analyzes the document metadata and content streams to perform highly accurate algorithmic page estimations prior to the user hitting the payment screen.

### 5.2 Capstone Dynamic Pricing Engine
The software features a smart pricing calculator built for university-specific rules. The engine dynamically calculates:
* Per-page base rates (e.g., ₹4 per page).
* Extra document add-ons like Bond Paper upgrades.
* Dedicated Capstone Embossing logic (Detects Degree type: ₹140 assigned to B.Tech Black embossing; ₹160 assigned to M.Tech Brown embossing).

### 5.3 Intelligent Shopkeeper File Handling
The administrative interface automatically distinguishes file types. 
* Secure `target="_blank"` browser routing instantly displays visually safe files (PDFs/Images) in new tabs.
* Complex documents (like .docx) utilize direct-download blob routing to bypass browser restrictions and deposit the file instantly onto the shopkeeper's desktop system for rapid printing.

---

## CHAPTER 6: FUTURE SCOPE 
*   **Printer API Integration:** Directly linking the Supabase queue to the shop's physical print spoolers (e.g., via CUPS) to automatically begin printing verified PDF orders.
*   **Plagiarism Checking:** Linking the Remote Document Submission API to a service like Turnitin, automating plagiarism checks for all submitted Capstone reports before they reach the faculty inbox.

---

## CHAPTER 7: CONCLUSION
PrintEase successfully addresses massive logistical issues facing students and campus administration daily. By synthesizing cloud database management, proprietary file parsing algorithms, automated digital payments, and offline PWA functionality, the project delivers a production-ready software solution capable of handling thousands of highly-configurable print routing requests securely and efficiently.
