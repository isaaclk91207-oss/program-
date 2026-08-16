# PCCP User Flow Document
## Professional Chauffeur Certification Program — Phase 1

---

## 1. System Overview

### 1.1 Roles
| Role | Access | Device |
|------|--------|--------|
| Admin | Full management access | Responsive (desktop-first) |
| Driver | Trips, check in/out, profile, passport, certification | Mobile-first |
| Passenger | Requests, QR scan, feedback | Mobile-first |

### 1.2 Core Entities
```
Passenger
    ↓
Transport Request
    ↓
Assigned Driver
    ↓
Assigned Vehicle  (Car Number = One Unique QR)
    ↓
Vehicle / Car QR
    ↓
QR Validation
    ↓
Feedback
    ↓
Feedback Record
```

### 1.3 Vehicle QR Principle
```
ONE CAR NUMBER = ONE UNIQUE CAR QR

Example:
Vehicle YGN-3312 → QR encodes "YGN-3312" (permanent)
  - Driver A uses YGN-3312 today  → same QR
  - Driver B uses YGN-3312 tomorrow → same QR

The QR belongs to the VEHICLE, not the driver.
```

---

## 2. Passenger User Flow

### 2.1 Login Flow
```
START
  ↓
Open App
  ↓
Passenger Login Screen
  ↓
Enter Passenger ID (or use demo ID)
  ↓
Click [Continue]
  ↓
Passenger Home
END
```

### 2.2 Create Transport Request Flow
```
START: Passenger Home
  ↓
Click [Request Transport]
  ↓
Create Transport Request Screen
  ↓
Fill Form:
  - Passenger ID (auto-filled, read-only)
  - Passenger Name (auto-filled, read-only)
  - Department (dropdown, required)
  - Pickup Location (text, required)
  - Destination (text, required)
  - Date (date picker, required)
  - Requested Time (time picker, required)
  ↓
Click [Submit Request]
  ↓
Validation: all fields required
  ↓
[SUCCESS] → Request Created (Status: PENDING)
  ↓
Toast: "Request submitted successfully"
  ↓
Navigate to Transport Request Detail
  ↓
END
```

### 2.3 Transport Request Status Flow
```
PENDING
  ↓ (Admin assigns driver + vehicle)
ASSIGNED
  ↓ (Notifications sent to Passenger + Driver)
QR_PENDING
  ↓ (Passenger scans vehicle QR - Pick Up)
PICK_UP_SCANNED
  ↓ (Trip in progress)
IN_PROGRESS
  ↓ (Passenger scans vehicle QR - Drop Off)
DROP_OFF_SCANNED
  ↓ (Passenger submits feedback)
FEEDBACK_SUBMITTED
END
```

### 2.4 Pick Up QR Scan Flow
```
START: Assigned Transport View
  ↓
Click [SCAN CAR QR]
  ↓
Pick Up QR Scan Screen
  ↓
Instruction: "Scan the QR code displayed in your assigned vehicle"
  ↓
Camera viewfinder activates (simulated)
  ↓
User scans QR (or uses Simulate button)
  ↓
Loading: "Validating QR code..."
  ↓
Validation:
  1. Is QR registered? → YES/NO
  2. Does it belong to a valid vehicle? → YES/NO
  3. Does the vehicle match the passenger's assigned vehicle? → YES/NO
  4. Does the passenger have an active transport request? → YES/NO
  ↓
[VALID] → Pick Up Confirmation Screen
  ↓
Auto-filled Info:
  - Car No: YGN-3312 (from QR)
  - Driver Name: Ko Maung (from assignment)
  - Passenger ID: PAS-00128 (from login)
  - Pick Up Location: Airport (from request)
  - Time: 10:00 AM (auto-captured)
  ↓
Click [Submit]
  ↓
Update Status → PICK_UP_SCANNED
  ↓
Toast: "Pick up confirmed"
  ↓
Navigate to Trip Progress
  ↓
END

[INVALID] → QR Validation Error Screen
  ↓
Message: "This QR code does not match your assigned vehicle."
  ↓
[Try Again] → Return to Scan
[Cancel] → Return to Assigned Transport
  ↓
END
```

### 2.5 Drop Off / Feedback Flow
```
START: Trip Completed
  ↓
Navigate to Feedback Screen
  ↓
Drop Off / Feedback Form
  ↓
Trip Summary Displayed:
  - Request ID
  - Passenger ID
  - Department
  - Car Number
  - Driver Name
  - Departure Location
  - Departure Time
  - Arrival Location
  - Arrival Time
  ↓
Rate Your Ride:
  - Select 1-5 stars (required)
  ↓
Comment (Required):
  - Enter feedback text (required)
  ↓
Comment Tags (dynamic by star rating):
  - 1-2 stars: Safety Concerns, Driver Behavior, Vehicle Cleanliness, Other Issues
  - 3 stars: Service, Safety, Cleanliness, Driver Behavior, Other
  - 4-5 stars: Excellent Service, Felt Safe, Clean Vehicle, Professional Driver, Punctual
  - Select at least one tag (required)
  ↓
Click [Submit Feedback]
  ↓
Validation:
  - Rating > 0
  - Comment not empty
  - At least 1 tag selected
  ↓
[SUCCESS] → Feedback Success Screen
  ↓
Message: "Feedback submitted successfully."
  ↓
Display Summary: Rating, Comment, Tags, Date
  ↓
Update Status → FEEDBACK_SUBMITTED
  ↓
Create Feedback Record (linked to Passenger + Driver + Vehicle + Request)
  ↓
[Return Home] → Passenger Home
  ↓
END
```

### 2.6 View Notifications Flow
```
START: Passenger Home
  ↓
Click Notification Bell (or Notifications tab)
  ↓
Notifications Screen
  ↓
List: Unread (bold, dot) | Read (normal)
  ↓
Click Notification
  ↓
Mark as Read
  ↓
Detail: Full message + related request link + timestamp
  ↓
[View Request] → Transport Request Detail
  ↓
END
```

---

## 3. Admin User Flow

### 3.1 Login Flow
```
START
  ↓
Role Selector → Click [Admin]
  ↓
Admin Login Screen
  ↓
Email: admin@pccp.demo (pre-filled)
Password: (pre-filled)
  ↓
Click [Sign In]
  ↓
Admin Dashboard
END
```

### 3.2 Dashboard Flow
```
START: Admin Dashboard
  ↓
View KPI Cards:
  - Total Transport Requests
  - Pending Requests
  - Assigned Requests
  - QR Pending
  - QR Scanned
  - Completed Trips
  - Feedback Submitted
  ↓
View Driver Overview (active drivers)
  ↓
View Vehicle Overview (active vehicles)
  ↓
View Recent Transport Requests Table
  ↓
Click Row → Transport Request Detail
  ↓
END
```

### 3.3 Transport Request List Flow
```
START: Sidebar → Transport Requests
  ↓
View Table:
  - Request ID | Passenger | Department | Date | Time
  - Pickup | Destination | Driver | Vehicle
  - Assignment Status | QR Status | Feedback Status
  ↓
Search: Request ID / Passenger name
Filter: Status (All, Pending, Assigned, QR Pending, etc.)
Sort: Date, Status
  ↓
Click Row → Transport Request Detail
  ↓
END
```

### 3.4 Assign Driver + Vehicle Flow
```
START: Transport Request Detail (Status: PENDING)
  ↓
Click [Assign Driver + Vehicle]
  ↓
Assign Modal Opens
  ↓
View Passenger Info (read-only): Name, ID, Department
  ↓
View Trip Info (read-only): Pickup, Destination, Date, Time
  ↓
Select Driver:
  - Search by name/ID
  - List of active certified drivers (Name, ID, Level, Rating)
  - Click to select
  ↓
Select Vehicle:
  - Search by plate
  - List of active vehicles (Plate, Make/Model, Status)
  - Click to select
  ↓
[Confirm Assignment]
  ↓
Validation: driver + vehicle required
  ↓
Update: Request Status → ASSIGNED
Create: Passenger notification
Create: Driver notification
  ↓
Toast: "Assignment confirmed"
  ↓
Close Modal
  ↓
END
```

### 3.5 Driver Management Flow
```
START: Sidebar → Drivers
  ↓
View Table: Driver, ID, Certification, Level, Rating, Status
  ↓
Search: Name / ID
Filter: Certification status
Sort: Name, Rating, Score
  ↓
Click Row → Driver Detail
  ↓
END
```

### 3.6 Driver Detail Flow
```
START: Driver Detail
  ↓
Header: Avatar, Name, CertBadge, StatusBadge, Actions
  ↓
Tabs:
  - Overview (score, breakdown, timeline)
  - Driver Information (contact, vehicle, joined)
  - Driver Passport (passport card)
  - Assessment (edit written/practical/operational scores)
  - Feedback (feedback list)
  - Operational Records (check-in/out history)
  ↓
END
```

### 3.7 Vehicle Management Flow
```
START: Sidebar → Vehicles
  ↓
View Table: Vehicle, Plate, Year, Color, QR, Driver, Status
  ↓
Search: Plate / Make/Model
Filter: Status
  ↓
Click Row → Vehicle Detail
  ↓
END
```

### 3.8 Vehicle Detail Flow
```
START: Vehicle Detail
  ↓
Vehicle Info: Plate, Make, Model, Year, Color, Status
  ↓
QR Code Section: QR encodes plate, permanent
  ↓
Assigned Driver: current + history
  ↓
Check-In History: check-in/check-out records
  ↓
END
```

### 3.9 Assessment Management Flow
```
START: Sidebar → Assessments
  ↓
Select Driver
  ↓
Edit Scores:
  - Written (0-100, weight 20%)
  - Practical (0-100, weight 30%)
  - Operational (0-100, weight 30%)
  - Feedback (auto-calculated, weight 20%)
  ↓
View Overall Score (calculated)
  ↓
[Save Assessment] → Confirmation modal
  ↓
Toast: "Assessment saved successfully"
  ↓
END
```

### 3.10 Operational Records Flow
```
START: Sidebar → Operational Records
  ↓
View Table: Driver, Vehicle, Request, Type, Location, Time, Remark
  ↓
Search: Driver / Vehicle
Filter: Type, Date range
  ↓
END
```

### 3.11 Feedback Review Flow
```
START: Sidebar → Feedback
  ↓
Filter: Driver, Rating, Date
  ↓
View List: Passenger, Driver, Vehicle, Rating, Comment, Tags, Date
  ↓
Click → Detail
  ↓
END
```

### 3.12 Notification Center Flow
```
START: Sidebar → Notifications
  ↓
Filter: All, Unread
  ↓
List: Icon, Title, Message, Timestamp, Unread dot
  ↓
Click → Mark as read + detail
  ↓
[Mark All as Read]
  ↓
END
```

### 3.13 Assessment Summary Flow
```
START: Sidebar → Assessments → Summary tab
  ↓
Overview: Total, Certified, Pending, Average score
  ↓
By Level: CD, CC, CPC, CEC, CMC stats
  ↓
Top Performers list
  ↓
END
```

### 3.14 Settings Flow
```
START: Sidebar → Settings
  ↓
Scoring Weights (Phase 1 placeholder, TBD)
  ↓
Certification Pass Marks
  ↓
TBD Rules:
  - Certification progression logic
  - Final ranking algorithm
  - QR reminder timing
  - Admin permission levels
  ↓
END
```

---

## 4. Driver User Flow

### 4.1 Login Flow
```
START
  ↓
Role Selector → Click [Driver]
  ↓
Driver Login Screen
  ↓
Driver ID: DRV-001 (pre-filled)
  ↓
Click [Continue]
  ↓
Driver Home
END
```

### 4.2 Driver Home Flow
```
START: Driver Home
  ↓
Welcome Card: Avatar, Name, ID, Certification, Level
  ↓
Stats: Rating, Status, Assigned Vehicle
  ↓
Current Vehicle Card: Plate, Make/Model, Check-in status
  ↓
Assigned Trips Count + [View Trips]
  ↓
Quick Actions: Check In/Out, Passport, Certification
  ↓
END
```

### 4.3 Assigned Trips Flow
```
START: Driver Home → Assigned Trips
  ↓
List: Passenger, Dept, Pickup→Destination, Date/Time, Vehicle, Status
  ↓
Filter: All, Pending, In Progress, Completed
  ↓
Click → Trip Detail
  ↓
END
```

### 4.4 Trip Detail Flow
```
START: Trip Detail
  ↓
Trip Info: Request ID, Status, Pickup, Destination, Date, Time
  ↓
Passenger Info: Name, ID, Department, Phone, Email
  ↓
Vehicle Info: Plate, Make/Model, Color
  ↓
Check-In/Out Section:
  - Check-In Status: badge, location, time, remark
  - Check-Out Status: badge, location, time, remark
  - [Check In] (if not checked in)
  - [Check Out] (if checked in, not checked out)
  ↓
END
```

### 4.5 Check In QR Scan Flow
```
START: Trip Detail
  ↓
Click [Check In]
  ↓
Check In QR Scan Screen
  ↓
Instruction: "Scan the QR code on your assigned vehicle"
  ↓
Camera viewfinder (simulated) → Scan
  ↓
Validation: QR registered? Valid vehicle? Matches assigned? Active trip?
  ↓
[VALID] → Check In Form
  ↓
Vehicle Info: Plate, Make/Model, Color
  ↓
Fill:
  - Check In Location (required, pre-filled)
  - Check In Time (auto, display only)
  - Remark (optional): "Damage at rear view mirror by previous driver"
  ↓
[Submit Check In]
  ↓
Update Status → CHECKED_IN
  ↓
Toast: "Check in recorded"
  ↓
Check In Confirmation Screen
  ↓
END

[INVALID] → Error: "This QR code does not match your assigned vehicle."
  ↓
[Try Again] / [Cancel]
  ↓
END
```

### 4.6 Check Out QR Scan Flow
```
START: Trip Detail (Status: CHECKED_IN)
  ↓
Click [Check Out]
  ↓
Check Out QR Scan Screen
  ↓
Scan → Validate → [VALID] → Check Out Form
  ↓
Fill:
  - Check Out Location (required, pre-filled)
  - Check Out Time (auto, display only)
  - Remark (optional)
  ↓
[Submit Check Out]
  ↓
Update Status → CHECKED_OUT
  ↓
Update Request Status → COMPLETED
  ↓
Toast: "Check out recorded"
  ↓
Check Out Confirmation Screen
  ↓
END
```

### 4.7 Driver Profile Flow
```
START: Driver Home → Profile
  ↓
Avatar, Name, ID
  ↓
Info: Phone, Email, Vehicle, Joined, Status
  ↓
Certification: Level, Status, Valid Until
  ↓
Stats: Rating, Trips, Accident-Free
  ↓
END
```

### 4.8 Driver Passport Flow
```
START: Driver Home → Passport
  ↓
PassportCard:
  - Dark gradient background
  - PCCP Logo + "Digital Driver Passport"
  - "VERIFIED" badge
  - Driver avatar + ID badge
  - Name, location, branch type, transfer type
  - Metrics: Certified Since, Valid Until, English Level, Accident-Free, Feedback, Credits
  - Tags: Next level, Safety score, Vehicle score
  - Certification hexagonal badge
  - QR code ("SCAN FOR FEEDBACK")
  - Gold bottom bar
  ↓
END
```

### 4.9 Certification Flow
```
START: Driver Home → Certification
  ↓
Current Level: Level, Status, Overall Score
  ↓
Assessment Summary: Written, Practical, Operational, Feedback (progress bars)
  ↓
Overall Score vs Pass Mark
  ↓
Certification Timeline
  ↓
"Certification calculation is a Phase 1 placeholder" (TBD)
  ↓
END
```

### 4.10 Driver Notifications Flow
```
START: Driver Home → Notifications
  ↓
List: Unread | Read
  ↓
Click → Mark as read + detail
  ↓
[View Trip] → Trip Detail
  ↓
END
```

---

## 5. Notification Design

### 5.1 Passenger — Assignment
```
Title: "Transport Request Assigned"
Message: "Your transport request TRQ-001 has been assigned to Driver Ko Maung with vehicle YGN-3312."
Fields shown: Driver, Vehicle, Pickup, Destination, Date, Time
```

### 5.2 Driver — New Assignment
```
Title: "New Transport Assigned"
Message: "You have been assigned transport request TRQ-001 for U Aung Myo from Airport to Junction City."
Fields shown: Passenger, Department, Pickup, Destination, Date, Time, Vehicle
```

### 5.3 QR Reminder (configurable timing — TBD)
```
Title: "Reminder: Scan Vehicle QR"
Message: "Please scan the vehicle QR code for your transport request TRQ-001."
```
> Reminder timing is configurable / TBD. Not hardcoded in Phase 1.

---

## 6. Status Flow Reference

### 6.1 Transport Request
```
PENDING → ASSIGNED → QR_PENDING → PICK_UP_SCANNED → IN_PROGRESS → DROP_OFF_SCANNED → FEEDBACK_SUBMITTED
```

### 6.2 Vehicle Check-In
```
CHECKED_IN → CHECKED_OUT
```

### 6.3 QR Status
```
PENDING → ASSIGNED → QR PENDING → QR SCANNED → COMPLETED → FEEDBACK SUBMITTED
```

---

## 7. QR Validation Logic

```
Scan QR
  ↓
Extract car number from QR value
  ↓
Find vehicle where plate === car number
  ↓
Vehicle found?
  ├── NO → "QR not registered"
  └── YES → Continue
  ↓
Vehicle status = Active?
  ├── NO → "Vehicle not valid"
  └── YES → Continue
  ↓
PASSENGER: Does vehicle match assigned vehicle on active request?
  ├── NO → "This QR code does not match your assigned vehicle."
  └── YES → "Vehicle Verified" → Continue to Feedback
  ↓
DRIVER: Does driver have active trip assigned to this vehicle?
  ├── NO → "This QR code does not match your assigned vehicle."
  └── YES → Proceed with Check In / Check Out
```

---

## 8. Data Relationship

```
Passenger
    ↓
Transport Request
    ↓
Assigned Driver
    ↓
Assigned Vehicle
    ↓
Vehicle / Car QR  (permanent, one per car number)
    ↓
QR Validation
    ↓
Feedback
    ↓
Feedback Record
  (linked to: passengerId + driverId + vehicleId + requestId)
```

---

## 9. UI States Reference

### 9.1 Required States
| # | State | Location |
|---|-------|----------|
| 1 | Empty Transport Request | Admin + Passenger |
| 2 | Pending Request | Admin + Passenger |
| 3 | Assigned Request | All portals |
| 4 | QR Pending | Passenger assigned transport |
| 5 | QR Scanning | Passenger + Driver scanners |
| 6 | QR Validation Loading | Both scanners |
| 7 | QR Valid | Pick up + Check in/out |
| 8 | QR Invalid | Both scanners |
| 9 | Feedback Form | Passenger |
| 10 | Feedback Validation Error | Passenger |
| 11 | Feedback Success | Passenger |
| 12 | Notification Unread | All portals |
| 13 | Notification Read | All portals |
| 14 | Assignment Confirmation | Admin |
| 15 | Loading | Global |
| 16 | Error | Global |

---

## 10. Prototype Flow (End-to-End)

```
1.  Passenger logs in
2.  Passenger creates Transport Request
3.  Request appears as PENDING
4.  Admin logs in
5.  Admin opens the request
6.  Admin selects Driver
7.  Admin selects Vehicle
8.  Admin confirms assignment
9.  Passenger receives notification
10. Driver receives notification
11. Passenger opens Assigned Transport
12. Passenger taps Scan Car QR
13. QR is validated
14. Vehicle is confirmed
15. Pick Up confirmed (QR Status → QR SCANNED)
16. Trip in progress
17. Trip completed
18. Passenger gives rating
19. Passenger enters mandatory comment
20. Passenger selects comment tag
21. Passenger submits feedback
22. Success confirmation appears
23. Admin can see Feedback Submitted status
```

---

## 11. Certification Module

### 11.1 Weights
| Component | Weight |
|-----------|--------|
| Written Assessment (40 MCQ, questions by Fleet Management) | 20% |
| Practical Assessment (pre-trip readiness, vehicle inspection, safety, behavior, service) | 30% |
| Operational Record (accident, damage, attendance, documentation, utilization) | 30% |
| Passenger Feedback (rating, mandatory comment, comment tags) | 20% |

### 11.2 Levels & Pass Marks
| Level | Pass Mark |
|-------|-----------|
| CD | 75% |
| CC | 80% |
| CPC | 85% |
| CEC | 88% |
| CMC | 90% |

> Final certification progression formula: **TBD** (Phase 1 placeholder)

---

## 12. Out of Scope (Future)

- GPS Tracking / Vehicle GPS Integration
- Automatic Driving Hours
- AI Driver Recommendation
- AI Performance Analysis
- Ride-hailing algorithm
- Automated Driver Ranking
- Final certification progression logic
- Driver QR (QR belongs to VEHICLE only)

---

## Document Information
- **Version:** 1.0
- **Phase:** 1 (Prototype)
- **Last Updated:** 14 Aug 2026
- **Status:** Active
