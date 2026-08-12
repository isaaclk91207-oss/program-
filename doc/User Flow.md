# Professional Chauffeur Certification Program (PCCP)

## Phase 1 — User Flow Document

| | |
|---|---|
| **Document Version** | 2.0 |
| **Document Status** | Draft for Review |
| **Project** | Professional Chauffeur Certification Program (PCCP) |
| **Phase** | Phase 1 — User Flow & Functional Process Definition |

---

## 1. Document Overview

### 1.1 Purpose

This document defines the Phase 1 User Flow for the Professional Chauffeur Certification Program (PCCP). The purpose of this document is to translate the current business requirements into a clear, role-based system flow covering:

- Admin activities
- Driver activities
- Passenger activities
- Written Assessment
- Practical Assessment
- Operational Record
- Passenger Feedback
- Driver QR interaction
- Certification assessment process

This document will serve as a foundation for the next stages of:

- UI/UX Design
- Functional Requirements
- Screen Specification
- API Requirements
- Database Design
- System Development

---

## 2. Project Objective

The PCCP system is designed to support the professional chauffeur certification and evaluation process. The system connects three primary user roles:

- **Admin**
- **Driver**
- **Passenger**

The system collects information from different assessment and operational sources and organizes them into a structured certification process.

### Overall Assessment Components

| Assessment Component | Weight |
|---|---|
| Written Assessment | 20% |
| Practical Assessment | 30% |
| Operational Record | 30% |
| Feedback | 20% |
| **Total** | **100%** |

---

## 3. User Roles

### 3.1 Admin

The Admin is responsible for managing driver information and administering assessment-related information.

**Primary responsibilities:**

- Manage driver information
- Manage assessment records
- Record written assessment results
- Record practical assessment results
- Record operational records
- Review passenger feedback
- Review driver assessment information
- Monitor certification-related information

### 3.2 Driver

The Driver is the subject of the certification and assessment process.

**Primary responsibilities:**

- Access Driver profile
- View Driver ID
- View Driver Passport
- View certification information
- View certification status/level
- Display Driver QR Code

> The Driver does not directly modify official assessment results unless such permission is defined later.

### 3.3 Passenger

The Passenger participates in the feedback component of the certification process.

**Primary responsibilities:**

- Identify the Passenger
- Scan Driver QR Code
- Provide Passenger ID
- Provide Department
- Record trip information
- Provide star rating
- Submit mandatory comment
- Select comment tags

---

## 4. High-Level System Flow

```
Training → Written Assessment → Practical Assessment → Operational Record → Passenger Feedback → Assessment Consolidation → Certification Result
```

### Assessment Weight Breakdown

```
Written Assessment    — 20%
Practical Assessment  — 30%
Operational Record    — 30%
Feedback              — 20%
                      -----
Overall Assessment    = 100%
```

---

## 5. Overall Assessment Timeline

| Phase | Activity | Details | Timing |
|---|---|---|---|
| Training Day | Training → Written Assessment | 40 MCQ, 20% weight | Same day after training |
| Within 3 Days After Training | Practical Assessment | 30% weight | Two assessor sources: Fleet Assessor, Mystery Passenger |
| 60 Days Before → 30 Days After Training | Operational Record Monitoring | 30% weight | Covers operational period |
| 30 Days After Training | Passenger Feedback | 20% weight | Passenger scans Driver QR and completes feedback |

---

## 6. Written Assessment User Flow

### 6.1 Overview

- Contributes **20%** of the overall PCCP assessment
- Consists of **40 multiple-choice questions (MCQ)**
- Conducted on the **same day after training**
- Questions prepared by Fleet Management

### 6.2 Written Assessment Flow

```
Training Completed → Written Assessment → 40 MCQ → Assessment Completed → Score Recorded → Written Assessment Result → 20% Assessment Component
```

### 6.3 Written Assessment — Admin Flow

```
Admin → Assessment Management → Written Assessment → Select Driver → Enter / Review Written Assessment Result → Record Score → Save → Assessment Result Stored
```

### 6.4 Written Assessment Information

The system should support the following information:

- Driver
- Assessment date
- Number of questions (Total: 40)
- Score
- Result
- Assessment status

> The detailed question-management workflow is subject to the final business requirement.

---

## 7. Practical Assessment User Flow

### 7.1 Overview

- Contributes **30%** of the overall assessment
- Must be conducted **within 3 days after training**

### 7.2 Assessment Categories

| Assessment Category | Score |
|---|---|
| Pre-Trip Readiness | 20 |
| Vehicle Inspection | 20 |
| Safety | 30 |
| Behavior | 15 |
| Service Delivery | 15 |
| **Total** | **100** |

### 7.3 Assessor Sources

The Practical Assessment uses two assessor sources:

**Fleet Assessor** — Responsible for:
- Pre-Trip Readiness
- Vehicle Inspection
- Service Delivery

**Mystery Passenger** — Responsible for:
- Safety
- Behavior

### 7.4 Practical Assessment Flow

```
Driver Completes Training
  → Within 3 Days
    → Practical Assessment
      → Fleet Assessor: Pre-Trip Readiness, Vehicle Inspection, Service Delivery
      → Mystery Passenger: Safety, Behavior
    → Assessment Results Consolidated
  → Practical Assessment Score → 30% Overall Weight
```

### 7.5 Practical Assessment — Admin Flow

```
Admin → Assessment Management → Practical Assessment → Select Driver → Review Assessor Results → Review: Pre-Trip Readiness, Vehicle Inspection, Safety, Behavior, Service Delivery → Consolidate Results → Save Assessment → Practical Assessment Result Recorded
```

---

## 8. Operational Record User Flow

### 8.1 Overview

- Contributes **30%** of the overall assessment
- Covers a period of **60 days before training** through **30 days after training**

### 8.2 Operational Record Categories

| Category | Score |
|---|---|
| Accident Record | 20 |
| Vehicle Damage | 20 |
| Attendance | 20 |
| Documentation | 10 |
| Vehicle Utilization / Driving Hours | 30 |
| **Total** | **100** |

### 8.3 Operational Record Flow

```
60 Days Before Training
  → Collect Operational Records
    → Training
      → Continue Operational Monitoring
        → 30 Days After Training
          → Finalize Operational Record
            → Calculate Operational Record Result → 30% Overall Weight
```

### 8.4 Operational Record — Admin Flow

```
Admin → Operational Records → Select Driver → Review Operational Data
  → Accident Record
  → Vehicle Damage
  → Attendance
  → Documentation
  → Vehicle Utilization / Driving Hours
→ Review / Confirm Record → Save → Operational Record Result
```

---

## 9. Passenger Feedback User Flow

### 9.1 Overview

- Contributes **20%** of the overall assessment
- Occurs **30 days after training**
- Passenger enters the feedback process by **scanning the Driver's QR Code**

### 9.2 Passenger Feedback Flow (Complete)

```
Driver QR Code
  → Passenger Scans QR
    → Identify Driver
      → Passenger ID
      → Department
    → Trip Information
      → Departure Location
      → Departure Time
      → Arrival Location
      → Arrival Time
    → Star Rating
    → Comment
    → Comment Tags
  → Submit Feedback
    → Feedback Recorded
```

### 9.3 Passenger Identification

After scanning the Driver QR Code, the Passenger must provide:

- **Passenger ID**
- **Department**

The system should associate the feedback with the relevant Driver.

```
Passenger → Driver → Trip → Feedback
```

### 9.4 Trip Information

The Passenger Feedback form must capture:

| Field | Description |
|---|---|
| Departure Location | Where the trip started |
| Departure Time | When the trip started |
| Arrival Location | Where the trip ended |
| Arrival Time | When the trip ended |

### 9.5 Rating and Comment Flow

```
Passenger → Select Star Rating → Enter Comment → Select Comment Tags → Submit
```

- The comment is **mandatory**
- The system must **not allow** the feedback form to be submitted if the required comment is missing

### 9.6 Comment Tags

- The feedback interface should provide a mechanism for tagging the Passenger's comment
- The exact list of tags should be confirmed with the business/team requirements
- The UI should be designed so that comment tags can be configured without requiring major changes

---

## 10. Driver QR Code Flow

### 10.1 Driver QR Code Purpose

The Driver has a dedicated QR Code.

### 10.2 Driver Flow

```
Driver Dashboard → Driver QR Code → Display QR Code → Passenger Scans QR → System Identifies Driver → Open Feedback Form
```

### 10.3 QR Code Verification / Feedback Relationship

The QR Code serves as the connection between the Driver and Passenger Feedback process:

```
Driver → Driver QR Code → Passenger Scan → Driver Identification → Passenger Feedback
```

> The QR Code is not only a Driver identity feature; it also provides the entry point for the Passenger Feedback process.

---

## 11. Driver User Flow

### 11.1 Driver Flow

```
Driver Login → Driver Dashboard
  → Driver Profile
  → Driver Passport
  → Certification
  → QR Code
```

### 11.2 Driver Dashboard

The Driver Dashboard should provide a summary of the Driver's professional information:

- Driver Photo
- Driver Name
- Driver ID
- Certification Status
- Certification Level
- Assessment Summary
- Rating
- QR Code Access

> The exact information displayed should follow the final business requirements.

### 11.3 Driver Passport Flow

```
Driver Dashboard → Driver Passport → Display Professional Driver Information → Display Certification Information → Display Verification / QR Information
```

The Driver Passport should represent the Driver's official professional identity within the PCCP system.

### 11.4 Certification Information Flow

The Driver should be able to view the assessment components that contribute to the certification result:

| Component | Weight |
|---|---|
| Written Assessment | 20% |
| Practical Assessment | 30% |
| Operational Record | 30% |
| Feedback | 20% |
| **Total** | **100%** |

> The final certification calculation and progression rules should follow the approved business rules.

---

## 12. Admin User Flow

### 12.1 Overall Admin Flow

```
Admin Login
  → Admin Dashboard
    → Driver Management
      → Driver List
      → Driver Detail
    → Assessment Management
      → Written Assessment
      → Practical Assessment
      → Operational Record
      → Feedback
    → Assessment Review
      → Review All Components
      → Consolidate Assessment Information
      → Certification Result
```

### 12.2 Admin Driver Management Flow

```
Driver Management → Search / Filter Driver → Select Driver → Driver Detail
  → View:
    - Driver Information
    - Passport
    - Certification
    - Assessment
    - Feedback
    - Operational Records
```

> The exact create/update permissions should be confirmed based on the final Admin permission model.

---

## 13. End-to-End PCCP User Flow

### Complete Phase 1 Flow

```
Driver Training
  → Written Assessment (20%)
  → Practical Assessment (30%)
  → Operational Record (30%)
  → Passenger Feedback (20%)
  → Assessment Consolidation
  → Certification Result
```

### Role-Based User Experiences

**Admin:**
```
Login → Dashboard → Driver Management → Assessment Management → Review Results
```

**Driver:**
```
Login → Dashboard → Passport → Certification → QR Code
```

**Passenger:**
```
Scan Driver QR → Passenger ID → Department → Trip Information → Rating → Mandatory Comment → Tags → Submit
```

---

## 14. System Relationship

```
                        PCCP SYSTEM
                            |
              +-------------+-------------+
              |             |             |
            ADMIN         DRIVER      PASSENGER
              |             |             |
              |             |             |
         Manage Driver   View Profile   Scan QR
         Assessments     Passport           |
         Records         Certification      |
         Feedback        QR Code            |
              |                            |
              +-------------+--------------+
                            |
                      Assessment Data
                            |
              +-------------+-------------+
              |             |             |
          Written       Practical    Operational
           20%            30%           30%
              |
           Feedback
             20%
              |
        Overall Assessment
              |
         Certification
```

---

## 15. Validation and Exception Flows

The system should support appropriate validation states.

### Written Assessment

- Invalid score
- Missing score
- Incomplete assessment

### Practical Assessment

- Missing assessor result
- Invalid score
- Incomplete category
- Missing required assessment

### Operational Record

- Missing record
- Incomplete data
- Invalid operational value

### Passenger Feedback

- Missing Passenger ID
- Missing Department
- Missing trip information
- Missing rating
- Missing mandatory comment
- Invalid submission

---

## 16. Feedback Validation Flow

```
Submit Feedback
  → Required Information Complete?
    → YES → Save Feedback → Success
    → NO → Display Validation Error → Passenger Corrects Information → Submit Again
```

---

## 17. Assessment Data Consolidation

After the required assessment information has been collected, the system should provide a consolidated assessment view:

```
Driver
  → Written Assessment (20%)
  → Practical Assessment (30%)
  → Operational Record (30%)
  → Feedback (20%)
  → Overall Assessment
  → Certification Result
```

> The exact calculation method should be implemented according to the approved assessment rules.

---

## 18. UI/UX Implications

The User Flow directly informs the UI/UX design.

### Admin Interface — Should prioritize:

- Dashboard
- Driver Management
- Assessment Management
- Operational Records
- Feedback Review
- Assessment Summary

### Driver Interface — Should prioritize:

- Driver Profile
- Driver Passport
- Certification
- Assessment Summary
- QR Code

### Passenger Interface — Should prioritize:

- QR Scan
- Passenger Identification
- Department
- Trip Information
- Rating
- Comment
- Comment Tags
- Submission Confirmation

---

## 19. Phase 1 Scope Boundary

### Confirmed in Current User Flow:

- Admin role
- Driver role
- Passenger role
- Written Assessment
- Practical Assessment
- Operational Record
- Passenger Feedback
- Driver QR Code
- Passenger ID
- Department
- Trip information
- Rating
- Mandatory Comment
- Comment Tags
- Driver Passport
- Certification information

### NOT Confirmed (Future Enhancements):

- AI-based driver recommendation
- AI-based performance analysis
- Real-time driver GPS tracking
- Ride-hailing/booking algorithm
- Automated driver ranking algorithm
- Final certification progression rules
- Final comment-tag taxonomy

---

## 20. Requirement Traceability

| Requirement | User Role | User Flow |
|---|---|---|
| Driver Management | Admin | Admin → Driver Management |
| Written Assessment | Admin / Driver | Training → Written Assessment |
| 40 MCQ | Assessment | Written Assessment |
| Practical Assessment | Admin / Assessors | Training → Practical Assessment |
| Fleet Assessment | Fleet Assessor | Practical Assessment |
| Mystery Passenger | Passenger / Assessor | Practical Assessment |
| Operational Record | Admin | Operational Record |
| Accident Record | Admin | Operational Record |
| Vehicle Damage | Admin | Operational Record |
| Attendance | Admin | Operational Record |
| Documentation | Admin | Operational Record |
| Vehicle Utilization / Driving Hours | Admin | Operational Record |
| Driver QR | Driver | Driver → QR |
| Passenger ID | Passenger | QR → Feedback |
| Department | Passenger | QR → Feedback |
| Departure Information | Passenger | Feedback |
| Arrival Information | Passenger | Feedback |
| Star Rating | Passenger | Feedback |
| Mandatory Comment | Passenger | Feedback |
| Comment Tags | Passenger | Feedback |
| Certification | Driver / Admin | Assessment → Certification |

---

## 21. Open Business Questions

The following items should be confirmed before final development:

1. How is the Written Assessment score converted into the 20% component?
2. How are Practical Assessment scores calculated across the two assessor sources?
3. How is the Operational Record score calculated?
4. How is the Feedback score calculated?
5. What is the exact overall certification formula?
6. What are the certification levels?
7. What determines whether a Driver passes or fails?
8. What are the final Passenger comment tags?
9. What information should be visible after scanning a Driver QR?
10. Who is authorized to enter and edit each assessment component?
11. How is the Mystery Passenger assigned?
12. How are the 60-day-before and 30-day-after operational records collected?
13. Is Driver Ranking required for Phase 1, and if so, what is its calculation method?

> These questions should be confirmed before finalizing the functional requirements and backend implementation.

---

## 22. Recommended Next Steps

After this User Flow is reviewed and approved by the Team Lead, the recommended sequence is:

```
User Flow → Functional Requirements → UI/UX Prototype → Screen Specification → API Requirements → Database / ERD → Development
```

The immediate next step is to convert each confirmed flow into detailed UI/UX screens and interactions.

---

## 23. Conclusion

The Phase 1 PCCP User Flow establishes a structured certification process based on four assessment components:

- **Written Assessment** — 20%
- **Practical Assessment** — 30%
- **Operational Record** — 30%
- **Passenger Feedback** — 20%

The system provides separate experiences for:

- **Admin** — Management and assessment administration
- **Driver** — Professional identity, certification, and QR access
- **Passenger** — Driver QR scanning, trip information, rating, and feedback

This User Flow provides the current functional foundation for the PCCP Phase 1 prototype and will be used to guide the next stage of UI/UX and system requirement definition.

---

| | |
|---|---|
| **Document Status** | Draft for Review |
| **Version** | 2.0 |
| | **End of Document** |
