# PrintEase - Project Summary & Architecture Document

## 1. Project Overview
**PrintEase** is a smart, unified web application designed specifically for college campuses. It aims to modernize the traditional college print shop by eliminating physical queues and digitizing the submission of capstone project reports and everyday print jobs. 

The platform serves two primary audiences:
- **Students:** For uploading documents, configuring print requirements, making online payments, and tracking their orders in real-time.
- **Shopkeepers & Faculty/Admins:** For managing print queues efficiently, downloading files natively based on their type, and validating student document submissions.

---

## 2. Core Functional Modules

### A. Smart Print Request System
Replaces the traditional "flash drive and verbal instruction" method:
- **File Uploads:** Students can upload various file formats (.pdf, .docx, .doc, images).
- **Smart Tech - Automated Page Counting:** Using **PDF.js** for PDFs and a highly custom client-side **JSZip** algorithm for Microsoft Word files, the app accurately determines the page count without relying on external paid APIs or Microsoft Word itself.
- **Pricing Engine:** Automatically calculates total cost dynamically based on:
  - Base per-page cost (e.g., ₹4).
  - Capstone Embossing fees (e.g., ₹140 for Black/B.Tech, ₹160 for Brown/M.Tech).
  - Extra Add-ons (Spiral Binding, Stapling, Bond paper integration).
- **Payments:** Integrated directly with the **Razorpay Payment Gateway** for secure transactions, ensuring money settles into the shopkeeper's linked bank account.
- **Order Tracking:** Provides the student with an auto-generated Student Print ID and QR code, tracking the order from *Queued → Printing → Ready → Collected*.

### B. Remote Document Submission System
Designed for placed or remote students to submit capstone/internal documents digitally:
- **Structured Fields:** Students input Name, Roll No., Department, and Guide Name alongside their report upload.
- **Notice & Validation System:** A dedicated dashboard for faculty/admins to review submissions. They can set statuses (*Received, Approved, Rejected, Resubmit*) and leave feedback/notes in a dedicated Notice Section visible to the student.

---

## 3. The PWA Advantage (Progressive Web App)
PrintEase operates as a progressive web application. 
- **App-like Experience:** Students can "Install" the app directly onto their mobile phones from the browser via Vite's PWA capabilities, ensuring a native app feel.
- **Offline Capabilities:** Caching strategies allow certain elements (like checking past transaction history or viewing a completed QR code) to remain functional even on a spotty college Wi-Fi connection.

---

## 4. Technical Architecture & Stack

The application is built on a modern, robust, serverless architecture optimized for high performance and low maintenance.

**Frontend:**
- **React 18 & Typescript:** For building a dynamic, type-safe, and highly interactive user interface.
- **Vite:** As the lightning-fast build tool and bundler.
- **TailwindCSS & Shadcn UI (Radix Primitives):** Provides a beautiful, fully responsive, mobile-first design with accessible components.
- **Zod & React Hook Form:** For strict client-side form and upload validations.

**Backend & Database:**
- **Supabase (PostgreSQL):** Used as the primary relational database holding User Data, Print Orders, Submissions, and Shopkeeper configuration settings. 
- **Vercel Serverless Functions (Node.js):** Acts as the API layer managing secure tasks like Razorpay order creation, Webhook listening, and Authentication flows.
- **Custom Auth:** Implemented using `bcryptjs` and `jsonwebtoken` to handle distinct role-based access for Students vs. Shopkeepers.

**Third-Party Integrations & Utilities:**
- **Razorpay:** For live INR payment handling and KYC compliance.
- **JSZip:** Handles complex binary extraction of Word document XML to process page lengths client-side.
- **PDF.js:** Renders and processes PDF data.
- **Upload Storage:** Uses Supabase's secure bucket storage with automated clean-up of orphaned files to maintain storage efficiency.

---

## 5. Deployment Information
The entire platform is configured for strict Continuous Integration and Deployment (CI/CD) and is currently hosted in a **Production Environment on Vercel** (`vercel.json` routing is fully configured).

## 6. Recent Polish & Fixes
To ensure production readiness, the following critical milestones were recently completed:
- **Shopkeeper Dashboard File Handling:** clicking "Download" efficiently opens PDFs/Images in new tabs, whilst triggering immediate raw downloads for .doc/.docx files.
- **Complete Elimination of CloudConvert:** Reduced dependency and API costs by building an indigenous Word parsing counter.
- **Capstone Specific Pricing Models:** Accurately routing specific colors and prices depending on the degree (B.Tech vs M.Tech).
- **KYC & Payment Setup:** Razorpay compliance achieved, ensuring business readiness.
