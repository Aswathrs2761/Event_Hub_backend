# Event_Hub – Backend

Event_Hub is a complete event management and ticketing backend platform where users can browse and purchase event tickets, organizers can create and manage events, and admins can control users, events, payments and reports.  
The system supports secure Stripe payments, automatic refunds, email notifications, role-based access control and real-time analytics.

This repository contains the **backend** of the application built with **Node.js, Express and MongoDB**.

---

## 🚀 Features

### User
- Register & login using JWT authentication
- Browse approved events
- Purchase tickets using Stripe
- Receive email notifications for ticket purchases
- View purchased tickets
- Cancel tickets and get automatic refunds
- Email notification on refund

---

### Organizer
- Register & login as organizer
- Create and manage events
- Update and delete their own events
- Upload event images using Cloudinary
- View event details and ticket sales
- View users who purchased tickets for their events
- Access organizer dashboard analytics
- View recent sales reports
- View last 7 days chart data
- Suspend their own events
- Receive email notifications for ticket purchases and cancellations
- Cancel tickets and get automatic refunds

---

### Admin
- Register & login as admin
- Role-based admin dashboard
- View all users
- View user details with events and tickets
- Suspend / activate users
- Delete users
- View all events
- Approve, reject or suspend events
- Delete any event
- View all transactions
- View transaction details
- Process refunds
- View platform statistics
- View revenue reports
- View event performance reports

---

### Backend Capabilities
- Role-based access control (User / Organizer / Admin)
- JWT authentication middleware
- Stripe payment and refund integration
- Cloudinary image upload integration
- Email notifications using SendGrid
- MongoDB aggregation based analytics
- Pagination and filtering APIs
- Secure inventory handling for tickets

---

## 🛠 Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB (Mongoose)**
- **JWT Authentication**
- **Stripe API**
- **SendGrid**
- **Cloudinary**
- **Multer**
- **bcrypt**
- **dotenv**
- **cors**

---

## backend deployed url

## https://event-hub-backend-uzcs.onrender.com