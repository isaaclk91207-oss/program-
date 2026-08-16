import React, { useState, useEffect, useMemo, useRef } from "react";
import pccpLogo from "./src/assets/pccp-logo.png";
import { QRCodeSVG } from "qrcode.react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  Car, Shield, User, Users, LayoutDashboard, ClipboardList, MessageSquare,
  Settings, LogOut, Search, ChevronRight, ChevronLeft, QrCode, CheckCircle2,
  XCircle, AlertTriangle, Star, MapPin, Navigation, Award, BadgeCheck, Clock,
  RefreshCw, ArrowLeft, Menu, X, Phone, Mail, TrendingUp, ShieldCheck,
  ShieldAlert, ShieldClose, Plus, Eye, ChevronDown, Home as HomeIcon, CreditCard,
  Sparkles, FileCheck2, Ban, ScanLine, Loader2, Filter, SlidersHorizontal, Bell,
  UserX, UserCheck, ListChecks, CalendarDays, Wrench, ExternalLink, Save, Pencil, Trash2, Download, Check
} from "lucide-react";

/* =========================================================================
   DESIGN TOKENS (documented, not enforced — see inline usage)
   Base:      slate-950 / slate-900 / slate-50 (navy-charcoal professional)
   Accent:    amber-500/600 (certification gold — used sparingly)
   Success:   emerald-600   Warning: amber-600   Error: rose-600
   Display:   font-semibold tracking-tight (headers)
   Data/IDs:  font-mono (passport numbers, driver IDs — "official document" feel)
   ========================================================================= */

/* -------------------------------------------------------------------------
   MOCK DATA — structured as the future API is expected to shape it.
   Scoring model below mirrors CALCULATION_LOGIC_OVERVIEW.docx (CD formula)
   and is explicitly a Phase 1 placeholder — weights are configurable.
   ------------------------------------------------------------------------- */

const CERT_LEVELS = ["CD", "CC", "CPC", "CEC", "CMC"];

const CERT_LEVEL_NAMES = {
  CD: "Chauffeur Diploma",
  CC: "Certified Chauffeur",
  CPC: "Professional Chauffeur",
  CEC: "Executive Chauffeur",
  CMC: "Master Chauffeur",
};

const PASS_MARKS = { CD: 75, CC: 80, CPC: 85, CEC: 88, CMC: 90 };

const DEFAULT_WEIGHTS = { written: 0.2, practical: 0.3, operational: 0.3, feedback: 0.2 };

/* -------------------------------------------------------------------------
   DEPARTMENTS + COMMENT TAG CATEGORIES
   Comment tags are dynamic and categorized by the selected star rating:
   - 1-3 stars: improvement / negative feedback tags
   - 4-5 stars: positive feedback tags
   ------------------------------------------------------------------------- */
const DEPARTMENTS = ["Executive", "Finance", "HR", "Operations", "Marketing", "IT", "Legal"];

const TAG_CATEGORIES = {
  negative: [
    { id: "safety", label: "Safety Concerns", icon: "ShieldAlert" },
    { id: "behavior", label: "Driver Behavior", icon: "UserX" },
    { id: "cleanliness", label: "Vehicle Cleanliness", icon: "Sparkles" },
    { id: "service", label: "Service", icon: "Star" },
    { id: "punctuality", label: "Punctuality", icon: "Clock" },
    { id: "other", label: "Other Issues", icon: "MessageSquare" },
  ],
  positive: [
    { id: "service", label: "Excellent Service", icon: "Star" },
    { id: "safety", label: "Felt Safe", icon: "ShieldCheck" },
    { id: "cleanliness", label: "Clean Vehicle", icon: "Sparkles" },
    { id: "behavior", label: "Professional Driver", icon: "UserCheck" },
    { id: "punctuality", label: "Punctual", icon: "Clock" },
  ],
};

function getTagCategory(rating) {
  return rating <= 3 ? TAG_CATEGORIES.negative : TAG_CATEGORIES.positive;
}

function allTags() {
  return [...TAG_CATEGORIES.negative, ...TAG_CATEGORIES.positive];
}

/* -------------------------------------------------------------------------
   LOCAL STORAGE PERSISTENCE
   ------------------------------------------------------------------------- */
const STORAGE_KEY = "pccp-state";

function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const all = JSON.parse(raw);
    return key in all ? all[key] : fallback;
  } catch { return fallback; }
}

const MERGE_SLICES = ["notifications", "transportRequests", "drivers", "vehicles"];

function mergeById(existing, incoming, idKey = "id") {
  const map = new Map();
  (existing || []).forEach((x) => { if (x && x[idKey] != null) map.set(x[idKey], x); });
  (incoming || []).forEach((x) => { if (x && x[idKey] != null) map.set(x[idKey], x); });
  return [...map.values()];
}

function saveMergedState(local) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    const merged = { ...existing, ...local };
    MERGE_SLICES.forEach((k) => { if (local[k]) merged[k] = mergeById(existing[k], local[k]); });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {}
}

function clearState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

function makeNotifId(suffix) {
  const rand = (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `NTF-${Date.now()}-${rand}-${suffix}`;
}

function findTag(tagId) {
  return allTags().find((x) => x.id === tagId);
}

function tagTone(rating) {
  return rating <= 3 ? "rose" : "emerald";
}

const TAG_ICONS = { ShieldAlert, UserX, Sparkles, Star, Clock, MessageSquare, ShieldCheck, UserCheck, Shield, User };

function tagIcon(name) {
  return TAG_ICONS[name] || MessageSquare;
}

function feedbackTo100(avgRating) {
  return Math.round(avgRating * 20 * 10) / 10;
}

function computeOverallScore(a, weights = DEFAULT_WEIGHTS) {
  const feedback100 = feedbackTo100(a.feedbackAvg);
  const score =
    a.written * weights.written +
    a.practical * weights.practical +
    a.operational * weights.operational +
    feedback100 * weights.feedback;
  return Math.round(score * 100) / 100;
}

function computeFeedbackAvg(driverId, feedbackRecords) {
  const recs = feedbackRecords.filter((f) => f.driverId === driverId);
  if (recs.length === 0) return 0;
  return Math.round((recs.reduce((s, f) => s + f.rating, 0) / recs.length) * 10) / 10;
}

function computeDriverScore(driver, feedbackRecords, weights = DEFAULT_WEIGHTS) {
  const feedbackAvg = computeFeedbackAvg(driver.id, feedbackRecords);
  const a = { ...driver.assessment, feedbackAvg };
  return computeOverallScore(a, weights);
}

function getQualifiedLevels(score, passMarks) {
  return CERT_LEVELS.filter((l) => score >= passMarks[l]);
}

const RAW_DRIVERS = [
  { id: "DRV-001", name: "Ko Maung", level: "CPC", certStatus: "Certified", status: "Active", validUntil: "31 Dec 2026", phone: "+95 9 214 6683", email: "komaung@pccp.demo", vehicle: "Toyota Alphard · YGN-3312", currentVehicle: "YGN-3312", joined: "12 Mar 2023", accidentFree: "3 yrs", englishLevel: "B2", credits: 1250,
    assessment: { written: 88, practical: 92, operational: 90, feedbackAvg: 4.9 } },
  { id: "DRV-002", name: "Ko Aung", level: "CPC", certStatus: "Certified", status: "Active", validUntil: "18 Nov 2026", phone: "+95 9 254 1120", email: "koaung@pccp.demo", vehicle: "Toyota Vellfire · YGN-1187", currentVehicle: "YGN-1187", joined: "02 Jun 2023", accidentFree: "2 yrs", englishLevel: "B1", credits: 980,
    assessment: { written: 85, practical: 89, operational: 87, feedbackAvg: 4.8 } },
  { id: "DRV-003", name: "Ko Min", level: "CC", certStatus: "Certified", status: "Active", validUntil: "05 Feb 2027", phone: "+95 9 442 9931", email: "komin@pccp.demo", vehicle: "Honda Odyssey · YGN-4420", currentVehicle: "YGN-4420", joined: "21 Sep 2023", accidentFree: "2 yrs", englishLevel: "B1", credits: 760,
    assessment: { written: 80, practical: 84, operational: 82, feedbackAvg: 4.7 } },
  { id: "DRV-004", name: "Ko Myo", level: "CC", certStatus: "Certified", status: "Active", validUntil: "14 Jan 2027", phone: "+95 9 761 0021", email: "komyo@pccp.demo", vehicle: "Toyota Estima · YGN-2260", currentVehicle: "YGN-2260", joined: "30 Jan 2024", accidentFree: "1 yr", englishLevel: "A2", credits: 540,
    assessment: { written: 78, practical: 81, operational: 83, feedbackAvg: 4.6 } },
  { id: "DRV-005", name: "Kaung Htet", level: "CD", certStatus: "Certified", status: "Active", validUntil: "09 Aug 2026", phone: "+95 9 555 2214", email: "kaung.htet@pccp.demo", vehicle: "Toyota Wish · YGN-9021", currentVehicle: "YGN-9021", joined: "17 Apr 2024", accidentFree: "1 yr", englishLevel: "A2", credits: 410,
    assessment: { written: 76, practical: 78, operational: 80, feedbackAvg: 4.4 } },
  { id: "DRV-006", name: "Zin Min Latt", level: "CD", certStatus: "Pending", status: "Active", validUntil: "—", phone: "+95 9 887 4402", email: "zin.min@pccp.demo", vehicle: "Toyota Noah · YGN-6631", currentVehicle: "YGN-6631", joined: "03 Jul 2024", accidentFree: "—", englishLevel: "A2", credits: 210,
    assessment: { written: 70, practical: 74, operational: 72, feedbackAvg: 4.1 } },
  { id: "DRV-007", name: "Thura Aung", level: "CD", certStatus: "Pending", status: "Active", validUntil: "—", phone: "+95 9 320 7754", email: "thura.aung@pccp.demo", vehicle: "Honda Freed · YGN-7742", currentVehicle: "YGN-7742", joined: "22 Aug 2024", accidentFree: "—", englishLevel: "A2", credits: 150,
    assessment: { written: 65, practical: 68, operational: 70, feedbackAvg: 3.8 } },
  { id: "DRV-008", name: "Nay Lin Oo", level: "CC", certStatus: "Suspended", status: "Inactive", validUntil: "—", phone: "+95 9 611 0087", email: "nay.lin@pccp.demo", vehicle: "Toyota Alphard · YGN-5590", currentVehicle: "YGN-5590", joined: "11 Nov 2023", accidentFree: "—", englishLevel: "B1", credits: 620,
    assessment: { written: 74, practical: 70, operational: 68, feedbackAvg: 3.2 } },
  { id: "DRV-009", name: "Htet Wai Yan", level: "CPC", certStatus: "Revoked", status: "Inactive", validUntil: "—", phone: "+95 9 992 3345", email: "htet.wai@pccp.demo", vehicle: "Toyota Vellfire · YGN-0043", currentVehicle: "YGN-0043", joined: "05 Dec 2022", accidentFree: "—", englishLevel: "B2", credits: 900,
    assessment: { written: 60, practical: 58, operational: 55, feedbackAvg: 2.6 } },
  { id: "DRV-010", name: "Soe Moe Kyaw", level: "CD", certStatus: "Certified", status: "Active", validUntil: "27 Oct 2026", phone: "+95 9 470 8812", email: "soe.moe@pccp.demo", vehicle: "Toyota Wish · YGN-3387", currentVehicle: "YGN-3387", joined: "14 Feb 2024", accidentFree: "2 yrs", englishLevel: "B1", credits: 380,
    assessment: { written: 82, practical: 85, operational: 86, feedbackAvg: 4.7 } },
];

const initialDrivers = RAW_DRIVERS.map((d) => ({
  ...d,
  score: computeOverallScore(d.assessment),
  rating: d.assessment.feedbackAvg,
}));

/* -------------------------------------------------------------------------
   VEHICLES — QR is permanently bound to the car number (plate).
   ONE CAR NUMBER = ONE UNIQUE CAR QR
   ------------------------------------------------------------------------- */
const VEHICLES = [
  { id: "VEH-001", plate: "YGN-3312", qrValue: "YGN-3312", make: "Toyota", model: "Alphard", year: 2023, color: "White", status: "Active" },
  { id: "VEH-002", plate: "YGN-1187", qrValue: "YGN-1187", make: "Toyota", model: "Vellfire", year: 2022, color: "Black", status: "Active" },
  { id: "VEH-003", plate: "YGN-4420", qrValue: "YGN-4420", make: "Honda", model: "Odyssey", year: 2023, color: "Silver", status: "Active" },
  { id: "VEH-004", plate: "YGN-2260", qrValue: "YGN-2260", make: "Toyota", model: "Estima", year: 2022, color: "White", status: "Active" },
  { id: "VEH-005", plate: "YGN-9021", qrValue: "YGN-9021", make: "Toyota", model: "Wish", year: 2024, color: "Grey", status: "Active" },
  { id: "VEH-006", plate: "YGN-6631", qrValue: "YGN-6631", make: "Toyota", model: "Noah", year: 2023, color: "White", status: "Maintenance" },
  { id: "VEH-007", plate: "YGN-7742", qrValue: "YGN-7742", make: "Honda", model: "Freed", year: 2024, color: "Silver", status: "Active" },
  { id: "VEH-008", plate: "YGN-5590", qrValue: "YGN-5590", make: "Toyota", model: "Alphard", year: 2022, color: "Black", status: "Active" },
  { id: "VEH-009", plate: "YGN-0043", qrValue: "YGN-0043", make: "Toyota", model: "Vellfire", year: 2022, color: "Black", status: "Retired" },
];

/* -------------------------------------------------------------------------
   PASSENGERS
   ------------------------------------------------------------------------- */
const PASSENGERS = [
  { id: "PAS-00128", name: "U Aung Myo", department: "Executive", phone: "+95 9 123 4567", email: "aung.myo@company.com" },
  { id: "PAS-00118", name: "Daw Thin Thin", department: "Finance", phone: "+95 9 223 4567", email: "thin.thin@company.com" },
  { id: "PAS-00102", name: "U Kyaw Zin", department: "HR", phone: "+95 9 323 4567", email: "kyaw.zin@company.com" },
  { id: "PAS-00094", name: "Daw Mya", department: "Operations", phone: "+95 9 423 4567", email: "mya@company.com" },
  { id: "PAS-00071", name: "U Thein Aung", department: "Marketing", phone: "+95 9 523 4567", email: "thein.aung@company.com" },
  { id: "PAS-00061", name: "Daw Sandar", department: "IT", phone: "+95 9 623 4567", email: "sandar@company.com" },
];

/* -------------------------------------------------------------------------
   TRANSPORT REQUESTS
   Status flow: PENDING → ASSIGNED → QR_PENDING → PICK_UP_SCANNED
                → IN_PROGRESS → DROP_OFF_SCANNED → FEEDBACK_SUBMITTED
   ------------------------------------------------------------------------- */
const TRANSPORT_REQUESTS = [
  { id: "TRQ-001", passengerId: "PAS-00128", passengerName: "U Aung Myo", department: "Executive",
    pickup: "Yangon International Airport", destination: "Junction City",
    date: "14 Aug 2026", time: "10:00 AM",
    status: "PENDING", driverId: null, driverName: null, vehicleId: null, vehiclePlate: null,
    qrScanStatus: null, feedbackStatus: null, createdAt: "14 Aug 2026, 09:05 AM" },
  { id: "TRQ-002", passengerId: "PAS-00118", passengerName: "Daw Thin Thin", department: "Finance",
    pickup: "Head Office", destination: "Downtown",
    date: "14 Aug 2026", time: "02:00 PM",
    status: "ASSIGNED", driverId: "DRV-002", driverName: "Ko Aung", vehicleId: "VEH-002", vehiclePlate: "YGN-1187",
    qrScanStatus: "QR_PENDING", feedbackStatus: null, createdAt: "13 Aug 2026, 04:20 PM" },
  { id: "TRQ-003", passengerId: "PAS-00102", passengerName: "U Kyaw Zin", department: "HR",
    pickup: "Junction City", destination: "Yangon International Airport",
    date: "13 Aug 2026", time: "08:00 AM",
    status: "QR_PENDING", driverId: "DRV-001", driverName: "Ko Maung", vehicleId: "VEH-001", vehiclePlate: "YGN-3312",
    qrScanStatus: "QR_PENDING", feedbackStatus: null, createdAt: "12 Aug 2026, 10:00 AM" },
  { id: "TRQ-004", passengerId: "PAS-00094", passengerName: "Daw Mya", department: "Operations",
    pickup: "Sule", destination: "Yangon Central Station",
    date: "13 Aug 2026", time: "11:00 AM",
    status: "PICK_UP_SCANNED", driverId: "DRV-004", driverName: "Ko Myo", vehicleId: "VEH-004", vehiclePlate: "YGN-2260",
    qrScanStatus: "PICK_UP_SCANNED", feedbackStatus: null, createdAt: "12 Aug 2026, 02:30 PM" },
  { id: "TRQ-005", passengerId: "PAS-00071", passengerName: "U Thein Aung", department: "Marketing",
    pickup: "Downtown", destination: "Head Office",
    date: "12 Aug 2026", time: "09:00 AM",
    status: "DROP_OFF_SCANNED", driverId: "DRV-003", driverName: "Ko Min", vehicleId: "VEH-003", vehiclePlate: "YGN-4420",
    qrScanStatus: "DROP_OFF_SCANNED", feedbackStatus: null, createdAt: "11 Aug 2026, 05:00 PM" },
  { id: "TRQ-006", passengerId: "PAS-00061", passengerName: "Daw Sandar", department: "IT",
    pickup: "Head Office", destination: "Junction City",
    date: "12 Aug 2026", time: "03:00 PM",
    status: "FEEDBACK_SUBMITTED", driverId: "DRV-001", driverName: "Ko Maung", vehicleId: "VEH-001", vehiclePlate: "YGN-3312",
    qrScanStatus: "DROP_OFF_SCANNED", feedbackStatus: "SUBMITTED", createdAt: "12 Aug 2026, 08:00 AM" },
  { id: "TRQ-007", passengerId: "PAS-00128", passengerName: "U Aung Myo", department: "Executive",
    pickup: "Yangon International Airport", destination: "Head Office",
    date: "11 Aug 2026", time: "07:00 AM",
    status: "FEEDBACK_SUBMITTED", driverId: "DRV-002", driverName: "Ko Aung", vehicleId: "VEH-002", vehiclePlate: "YGN-1187",
    qrScanStatus: "DROP_OFF_SCANNED", feedbackStatus: "SUBMITTED", createdAt: "10 Aug 2026, 06:00 PM" },
  { id: "TRQ-008", passengerId: "PAS-00118", passengerName: "Daw Thin Thin", department: "Finance",
    pickup: "Downtown", destination: "Yangon International Airport",
    date: "11 Aug 2026", time: "06:00 PM",
    status: "PENDING", driverId: null, driverName: null, vehicleId: null, vehiclePlate: null,
    qrScanStatus: null, feedbackStatus: null, createdAt: "11 Aug 2026, 08:00 AM" },
];

/* -------------------------------------------------------------------------
   NOTIFICATIONS
   ------------------------------------------------------------------------- */
const INITIAL_NOTIFICATIONS = [
  { id: "NTF-001", recipientId: "PAS-00118", recipientRole: "passenger", read: false, timestamp: "14 Aug 2026, 09:15 AM",
    title: "Transport Request Assigned",
    message: "Your transport request TRQ-002 has been assigned to Driver Ko Aung with vehicle YGN-1187.",
    relatedRequestId: "TRQ-002" },
  { id: "NTF-002", recipientId: "DRV-002", recipientRole: "driver", read: false, timestamp: "14 Aug 2026, 09:15 AM",
    title: "New Transport Assigned",
    message: "You have been assigned transport request TRQ-002 for Daw Thin Thin from Head Office to Downtown.",
    relatedRequestId: "TRQ-002" },
  { id: "NTF-003", recipientId: "PAS-00102", recipientRole: "passenger", read: false, timestamp: "13 Aug 2026, 07:30 AM",
    title: "Reminder: Scan Vehicle QR",
    message: "Please scan the vehicle QR code for your transport request TRQ-003.",
    relatedRequestId: "TRQ-003" },
  { id: "NTF-004", recipientId: "DRV-001", recipientRole: "driver", read: true, timestamp: "13 Aug 2026, 07:00 AM",
    title: "New Transport Assigned",
    message: "You have been assigned transport request TRQ-003 for U Kyaw Zin from Junction City to Yangon International Airport.",
    relatedRequestId: "TRQ-003" },
  { id: "NTF-005", recipientId: "PAS-00094", recipientRole: "passenger", read: true, timestamp: "13 Aug 2026, 10:45 AM",
    title: "Trip Completed",
    message: "Your trip TRQ-004 to Yangon Central Station has been completed. Please submit your feedback.",
    relatedRequestId: "TRQ-004" },
  { id: "NTF-006", recipientId: "DRV-004", recipientRole: "driver", read: true, timestamp: "13 Aug 2026, 10:40 AM",
    title: "Check Out Recorded",
    message: "Your check-out for vehicle YGN-2260 has been recorded successfully.",
    relatedRequestId: "TRQ-004" },
  { id: "NTF-007", recipientId: "PAS-00128", recipientRole: "passenger", read: false, timestamp: "14 Aug 2026, 09:00 AM",
    title: "Trip Completed",
    message: "Your trip TRQ-007 to Head Office has been completed. Thank you for riding with us.",
    relatedRequestId: "TRQ-007" },
  { id: "NTF-008", recipientId: "DRV-001", recipientRole: "driver", read: false, timestamp: "14 Aug 2026, 09:05 AM",
    title: "Reminder: QR Verification",
    message: "Transport request TRQ-003 is awaiting pick-up. Complete QR verification when the passenger arrives.",
    relatedRequestId: "TRQ-003" },
  { id: "NTF-009", recipientId: "ADMIN", recipientRole: "admin", read: false, timestamp: "14 Aug 2026, 09:10 AM",
    title: "New Transport Request",
    message: "Daw Thiri (PAS-00118) requested transport from Head Office to Downtown on 14 Aug 2026 at 10:00 AM.",
    relatedRequestId: "TRQ-002" },
];

/* -------------------------------------------------------------------------
   FEEDBACK RECORDS — linked to passenger + driver + vehicle + request
   ------------------------------------------------------------------------- */
const FEEDBACK_RECORDS = [
  { id: "FDB-001", requestId: "TRQ-006", passengerId: "PAS-00061", passengerName: "Daw Sandar",
    driverId: "DRV-001", driverName: "Ko Maung", vehicleId: "VEH-001", vehiclePlate: "YGN-3312",
    rating: 5, comment: "Extremely punctual and courteous. Car was spotless.", commentTags: ["service", "safety"],
    date: "12 Aug 2026", department: "IT" },
  { id: "FDB-002", requestId: "TRQ-007", passengerId: "PAS-00128", passengerName: "U Aung Myo",
    driverId: "DRV-002", driverName: "Ko Aung", vehicleId: "VEH-002", vehiclePlate: "YGN-1187",
    rating: 4, comment: "Smooth and safe journey. Arrived on time.", commentTags: ["cleanliness"],
    date: "11 Aug 2026", department: "Executive" },
  { id: "FDB-003", requestId: "TRQ-005", passengerId: "PAS-00071", passengerName: "U Thein Aung",
    driverId: "DRV-003", driverName: "Ko Min", vehicleId: "VEH-003", vehiclePlate: "YGN-4420",
    rating: 5, comment: "Very professional and friendly driver.", commentTags: ["behavior"],
    date: "12 Aug 2026", department: "Marketing" },
  { id: "FDB-004", requestId: "TRQ-004", passengerId: "PAS-00094", passengerName: "Daw Mya",
    driverId: "DRV-004", driverName: "Ko Myo", vehicleId: "VEH-004", vehiclePlate: "YGN-2260",
    rating: 3, comment: "Good service but the vehicle cleanliness needs improvement.", commentTags: ["cleanliness"],
    date: "13 Aug 2026", department: "Operations" },
];

/* -------------------------------------------------------------------------
   VEHICLE CHECK-INS — driver operational records
   ------------------------------------------------------------------------- */
const VEHICLE_CHECKINS = [
  { id: "CHK-001", vehicleId: "VEH-001", vehiclePlate: "YGN-3312", driverId: "DRV-001", driverName: "Ko Maung",
    requestId: "TRQ-006", checkInLocation: "Head Office", checkInTime: "09:00 AM",
    checkInRemark: "Vehicle clean, no damage", checkOutLocation: "Junction City", checkOutTime: "04:00 PM",
    checkOutRemark: "No new damage, vehicle clean", status: "CHECKED_OUT" },
  { id: "CHK-002", vehicleId: "VEH-002", vehiclePlate: "YGN-1187", driverId: "DRV-002", driverName: "Ko Aung",
    requestId: "TRQ-007", checkInLocation: "Yangon International Airport", checkInTime: "06:30 AM",
    checkInRemark: "Minor scratch on rear bumper", checkOutLocation: "Head Office", checkOutTime: "08:15 AM",
    checkOutRemark: "No new damage", status: "CHECKED_OUT" },
  { id: "CHK-003", vehicleId: "VEH-003", vehiclePlate: "YGN-4420", driverId: "DRV-003", driverName: "Ko Min",
    requestId: "TRQ-005", checkInLocation: "Downtown", checkInTime: "08:45 AM",
    checkInRemark: "Vehicle clean", checkOutLocation: "Head Office", checkOutTime: "10:30 AM",
    checkOutRemark: "Clean, no damage", status: "CHECKED_OUT" },
  { id: "CHK-004", vehicleId: "VEH-004", vehiclePlate: "YGN-2260", driverId: "DRV-004", driverName: "Ko Myo",
    requestId: "TRQ-004", checkInLocation: "Sule", checkInTime: "10:30 AM",
    checkInRemark: "Vehicle clean, no damage", checkOutLocation: null, checkOutTime: null,
    checkOutRemark: null, status: "CHECKED_IN" },
];

const FEEDBACK_LOG = FEEDBACK_RECORDS;

const DESTINATIONS = ["Yangon International Airport", "Downtown", "Junction City", "Sule", "Yangon Central Station"];

const DEMO_NOW = "14 Aug 2026, 10:15 AM";
const DEMO_TIME = "10:15 AM";

function formatDateInput(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function formatTimeInput(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

const RANK_WEIGHTING_NOTE =
  "Ranking below is sorted by rating for prototype purposes only. The final ranking algorithm has not been confirmed.";

/* -------------------------------------------------------------------------
   CSV EXPORT
   ------------------------------------------------------------------------- */
function exportToCSV(data, columns, filename, context = {}) {
  const header = columns.map((c) => c.label).join(",");
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = typeof c.key === "function" ? c.key(row, context) : row[c.key];
      const str = val == null ? "" : String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const DRIVER_EXPORT_COLUMNS = [
  { key: "name", label: "Driver Name" },
  { key: "id", label: "Driver ID" },
  { key: "certStatus", label: "Cert Status" },
  { key: "level", label: "Level" },
  { key: "rating", label: "Rating" },
  { key: "score", label: "Score" },
  { key: "status", label: "Status" },
  { key: (r) => r.assignedVehicleId || "", label: "Vehicle" },
];

const REQUEST_EXPORT_COLUMNS = [
  { key: "id", label: "Request ID" },
  { key: "passengerName", label: "Passenger" },
  { key: "passengerId", label: "Passenger ID" },
  { key: "department", label: "Department" },
  { key: "pickup", label: "Pickup" },
  { key: "destination", label: "Destination" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "status", label: "Status" },
];

const FEEDBACK_EXPORT_COLUMNS = [
  { key: (r, ctx) => { const d = (ctx.drivers || []).find((x) => x.id === r.driverId); return d ? d.name : r.driverId; }, label: "Driver Name" },
  { key: "driverId", label: "Driver ID" },
  { key: "passengerName", label: "Passenger" },
  { key: "plate", label: "Vehicle Plate" },
  { key: "requestId", label: "Request ID" },
  { key: "date", label: "Date" },
  { key: "rating", label: "Rating" },
  { key: "comment", label: "Comment" },
  { key: (r) => (r.commentTags || []).join("; "), label: "Tags" },
];

const CHECKIN_EXPORT_COLUMNS = [
  { key: "id", label: "Record ID" },
  { key: (r, ctx) => { const d = (ctx.drivers || []).find((x) => x.id === r.driverId); return d ? d.name : r.driverId; }, label: "Driver Name" },
  { key: "driverId", label: "Driver ID" },
  { key: "plate", label: "Vehicle Plate" },
  { key: "requestId", label: "Request ID" },
  { key: "checkInLocation", label: "Check-In Location" },
  { key: "checkInTime", label: "Check-In Time" },
  { key: "checkOutLocation", label: "Check-Out Location" },
  { key: "checkOutTime", label: "Check-Out Time" },
  { key: "status", label: "Status" },
];

const ASSESSMENT_EXPORT_COLUMNS = [
  { key: "name", label: "Driver Name" },
  { key: "id", label: "Driver ID" },
  { key: (r) => r.assessment.written, label: "Written" },
  { key: (r) => r.assessment.practical, label: "Practical" },
  { key: (r) => r.assessment.operational, label: "Operational" },
  { key: (r) => r.assessment.feedbackAvg, label: "Feedback Avg" },
  { key: "score", label: "Overall Score" },
  { key: "level", label: "Level" },
  { key: "certStatus", label: "Cert Status" },
];

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

/* -------------------------------------------------------------------------
   SHARED ATOMS
   ------------------------------------------------------------------------- */

function cx(...a) { return a.filter(Boolean).join(" "); }

function BrandLogo({ height = 28, darkChip = false, className = "" }) {
  return (
    <img
      src={pccpLogo}
      alt="PCCP"
      className={cx("block object-contain", darkChip && "bg-slate-900 rounded-md p-1.5", className)}
      style={{ height }}
    />
  );
}

function Badge({ tone = "slate", children, icon: Icon, className }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    navy: "bg-slate-800 text-slate-50 border-slate-700",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone], className)}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

function certToneMap(status) {
  if (status === "Certified") return { tone: "emerald", icon: ShieldCheck };
  if (status === "Pending") return { tone: "amber", icon: ShieldAlert };
  if (status === "Suspended") return { tone: "amber", icon: ShieldAlert };
  if (status === "Revoked") return { tone: "rose", icon: ShieldClose };
  return { tone: "slate", icon: Shield };
}

function CertBadge({ status }) {
  const { tone, icon } = certToneMap(status);
  return <Badge tone={tone} icon={icon}>{status}</Badge>;
}

function StatusBadge({ status }) {
  return status === "Active"
    ? <Badge tone="emerald" icon={CheckCircle2}>Active</Badge>
    : <Badge tone="rose" icon={XCircle}>Inactive</Badge>;
}

function Avatar({ name, size = "h-10 w-10", tone = "bg-slate-800" }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return (
    <div className={cx(size, tone, "rounded-full flex items-center justify-center text-slate-50 font-semibold shrink-0")}>
      {initials}
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={cx("bg-white rounded-xl border border-slate-200 shadow-sm", className)}>{children}</div>;
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    accent: "bg-amber-600 text-white hover:bg-amber-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    outline: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };
  return (
    <button
      className={cx("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed", variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

function ProgressBar({ value, tone = "slate" }) {
  const tones = { slate: "bg-slate-800", emerald: "bg-emerald-600", amber: "bg-amber-600", rose: "bg-rose-600" };
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className={cx("h-full rounded-full", tones[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function StarRating({ value, onChange, size = "h-7 w-7", readOnly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={cx(readOnly ? "cursor-default" : "cursor-pointer")}
        >
          <Star className={cx(size, (hover || value) >= n ? "fill-amber-500 text-amber-500" : "text-slate-300")} />
        </button>
      ))}
    </div>
  );
}

function EmptyState({ title = "No data available", subtitle, icon: Icon = ClipboardList }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="font-medium text-slate-700">{title}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-1 max-w-xs">{subtitle}</p>}
    </div>
  );
}

function Modal({ open, onClose, title, children, tone = "slate" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const tones = {
    success: { bg: "bg-emerald-600", icon: CheckCircle2 },
    error: { bg: "bg-rose-600", icon: XCircle },
    info: { bg: "bg-slate-900", icon: Sparkles },
  };
  const t = tones[toast.type] || tones.info;
  const Icon = t.icon;
  return (
    <div className="fixed bottom-24 right-4 sm:bottom-5 z-[60] animate-[fadein_.2s]">
      <div className={cx(t.bg, "text-white rounded-full pl-3 pr-4 py-2.5 shadow-lg flex items-center gap-2 text-sm font-medium")}>
        <Icon className="h-4 w-4" /> {toast.message}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{children}</p>;
}

function TopBar({ title, subtitle, onBack, right }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button onClick={onBack} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-slate-100 shrink-0">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-semibold text-slate-900 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/* -------------------------------------------------------------------------
   STATUS + UI ATOMS (transport requests, page headers, dialogs, bells)
   ------------------------------------------------------------------------- */

const TRANSPORT_STATUS_STYLES = {
  PENDING: { tone: "amber", label: "Pending", icon: Clock },
  ASSIGNED: { tone: "sky", label: "Assigned", icon: CheckCircle2 },
  QR_PENDING: { tone: "amber", label: "QR Pending", icon: QrCode },
  PICK_UP_SCANNED: { tone: "emerald", label: "Pick Up Confirmed", icon: CheckCircle2 },
  IN_PROGRESS: { tone: "indigo", label: "In Progress", icon: Navigation },
  DROP_OFF_SCANNED: { tone: "teal", label: "Drop Off Complete", icon: MapPin },
  FEEDBACK_SUBMITTED: { tone: "green", label: "Feedback Submitted", icon: Star },
};

function TransportStatusBadge({ status, className }) {
  const cfg = TRANSPORT_STATUS_STYLES[status] || { tone: "slate", label: status, icon: ClipboardList };
  return <Badge tone={cfg.tone} icon={cfg.icon} className={className}>{cfg.label}</Badge>;
}

function PageHeader({ title, subtitle, actions, onBack }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button onClick={onBack} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-slate-100 shrink-0">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
}

function NotificationBell({ count, onClick, className }) {
  return (
    <button onClick={onClick} className={cx("relative h-9 w-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors", className)}>
      <Bell className="h-5 w-5 text-slate-600" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-rose-600 text-white text-[10px] font-semibold flex items-center justify-center px-1">
          {count}
        </span>
      )}
    </button>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", tone = "primary", loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-slate-600 mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={tone === "danger" ? "danger" : tone === "success" ? "success" : "primary"} onClick={onConfirm} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

function LoadingSpinner({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
      <p className="text-sm text-slate-400 mt-3">{label}</p>
    </div>
  );
}

function ErrorState({ title = "Something went wrong", subtitle = "Please try again.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center mb-3">
        <AlertTriangle className="h-6 w-6 text-rose-600" />
      </div>
      <p className="font-medium text-slate-700">{title}</p>
      {subtitle && <p className="text-sm text-slate-400 mt-1 max-w-xs">{subtitle}</p>}
      {onRetry && <Button variant="outline" className="mt-4" onClick={onRetry}><RefreshCw className="h-4 w-4" /> Retry</Button>}
    </div>
  );
}

/* -------------------------------------------------------------------------
   ROOT APP
   ------------------------------------------------------------------------- */

export default function App() {
  const [role, setRole] = useState(() => loadState("role", null));
  const [selectedUserId, setSelectedUserId] = useState(() => loadState("selectedUserId", null));
  const [lastAssignedDriverId, setLastAssignedDriverId] = useState(() => loadState("lastAssignedDriverId", null));
  const [weights, setWeights] = useState(() => loadState("weights", DEFAULT_WEIGHTS));
  const [passMarks, setPassMarks] = useState(() => loadState("passMarks", PASS_MARKS));
  const [drivers, setDrivers] = useState(() => loadState("drivers", initialDrivers));
  const [vehicles, setVehicles] = useState(() => loadState("vehicles", VEHICLES));
  const [passengers] = useState(PASSENGERS);
  const [transportRequests, setTransportRequests] = useState(() => loadState("transportRequests", TRANSPORT_REQUESTS));
  const [notifications, setNotifications] = useState(() => loadState("notifications", INITIAL_NOTIFICATIONS));
  const [feedbackRecords, setFeedbackRecords] = useState(() => loadState("feedbackRecords", FEEDBACK_RECORDS));
  const [vehicleCheckins, setVehicleCheckins] = useState(() => loadState("vehicleCheckins", VEHICLE_CHECKINS));
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const notifyRef = useRef(null);
  const liveRef = useRef({ notifications, transportRequests, drivers, vehicles });
  const createdNotifIds = useRef(new Set());
  const toastedIds = useRef(new Set());

  useEffect(() => {
    saveMergedState({ role, selectedUserId, lastAssignedDriverId, weights, passMarks, drivers, vehicles, transportRequests, notifications, feedbackRecords, vehicleCheckins });
  }, [role, selectedUserId, weights, passMarks, drivers, vehicles, transportRequests, notifications, feedbackRecords, vehicleCheckins]);

  useEffect(() => {
    liveRef.current = { notifications, transportRequests, drivers, vehicles };
  }, [notifications, transportRequests, drivers, vehicles]);

  function applyExternal(next) {
    if (!next) return;
    const slices = ["notifications", "transportRequests", "drivers", "vehicles"];
    let changed = false;
    slices.forEach((k) => {
      if (next[k] && JSON.stringify(next[k]) !== JSON.stringify(liveRef.current[k])) changed = true;
    });
    if (!changed) return;
    if (next.notifications) {
      setNotifications((prev) => {
        const prevIds = new Set(prev.map((n) => n.id));
        const merged = mergeById(prev, next.notifications);
        if (role) {
          merged.filter((n) => n.recipientRole === role && !prevIds.has(n.id))
            .forEach((n) => notifyRef.current && notifyRef.current(n.title, "info"));
        }
        return merged;
      });
    }
    if (next.transportRequests) setTransportRequests((prev) => mergeById(prev, next.transportRequests));
    if (next.drivers) setDrivers((prev) => mergeById(prev, next.drivers));
    if (next.vehicles) setVehicles((prev) => mergeById(prev, next.vehicles));
  }

  useEffect(() => {
    function onStorage(e) {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      let next;
      try { next = JSON.parse(e.newValue); } catch { return; }
      applyExternal(next);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [role]);

  useEffect(() => {
    const id = setInterval(() => {
      let raw;
      try { raw = localStorage.getItem(STORAGE_KEY); } catch { return; }
      if (!raw) return;
      let next;
      try { next = JSON.parse(raw); } catch { return; }
      applyExternal(next);
    }, 1000);
    return () => clearInterval(id);
  }, [role]);

  useEffect(() => {
    if (!role || !selectedUserId) return;
    notifications
      .filter((n) =>
        n.recipientRole === role &&
        n.recipientId === selectedUserId &&
        !n.read &&
        createdNotifIds.current.has(n.id) &&
        !toastedIds.current.has(n.id)
      )
      .forEach((n) => {
        toastedIds.current.add(n.id);
        notify(`${n.title}: ${n.message}`, "info");
      });
  }, [role, selectedUserId, notifications]);

  useEffect(() => {
    setDrivers((prev) => prev.map((d) => {
      const feedbackAvg = computeFeedbackAvg(d.id, feedbackRecords);
      const score = computeDriverScore({ ...d, assessment: { ...d.assessment, feedbackAvg } }, feedbackRecords, weights);
      if (d.score === score && d.assessment.feedbackAvg === feedbackAvg && d.rating === feedbackAvg) return d;
      return { ...d, score, rating: feedbackAvg, assessment: { ...d.assessment, feedbackAvg } };
    }));
  }, [feedbackRecords, weights]);

  function resetToDefaults() {
    clearState();
    setRole(null);
    setSelectedUserId(null);
    setWeights(DEFAULT_WEIGHTS);
    setPassMarks(PASS_MARKS);
    setDrivers(initialDrivers);
    setVehicles(VEHICLES);
    setTransportRequests(TRANSPORT_REQUESTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setFeedbackRecords(FEEDBACK_RECORDS);
    setVehicleCheckins(VEHICLE_CHECKINS);
    notify("Demo reset to defaults.", "success");
  }

  function notify(message, type = "success") {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }
  notifyRef.current = notify;

  function resetToRoleSelect() {
    setRole(null);
    setSelectedUserId(null);
  }

  function switchRole(target, userId) {
    setRole(target);
    setSelectedUserId(userId || null);
  }

  function assignDriverVehicle(requestId, driverId, vehicleId) {
    const driver = drivers.find((d) => d.id === driverId);
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    const req = transportRequests.find((r) => r.id === requestId);
    if (!driver || !vehicle || !req) return;

    setLastAssignedDriverId(driverId);

    setTransportRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: "ASSIGNED", driverId, driverName: driver.name, vehicleId, vehiclePlate: vehicle.plate, qrScanStatus: "QR_PENDING" }
          : r
      )
    );

    const ts = "14 Aug 2026, 09:15 AM";
    const passengerNotif = { id: makeNotifId("p"), recipientId: req.passengerId, recipientRole: "passenger", read: false, timestamp: ts,
      title: "Driver Assigned",
      message: `${driver.name} is assigned to your trip`,
      relatedRequestId: requestId };
    const driverNotif = { id: makeNotifId("d"), recipientId: driverId, recipientRole: "driver", read: false, timestamp: ts,
      title: `New Trip Assigned (#${requestId})`,
      message: `Pick up ${req.passengerName} from ${req.pickup} to ${req.destination}.`,
      relatedRequestId: requestId };
    createdNotifIds.current.add(passengerNotif.id);
    createdNotifIds.current.add(driverNotif.id);
    setNotifications((prev) => [...prev, passengerNotif, driverNotif].slice(-50));
  }

  function markNotificationRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function nextSeqId(list, prefix) {
    const max = list.reduce((m, x) => Math.max(m, parseInt(x.id.split("-")[1], 10) || 0), 0);
    return `${prefix}-${String(max + 1).padStart(3, "0")}`;
  }

  function addTransportRequest(data) {
    const request = {
      id: nextSeqId(transportRequests, "TRQ"),
      passengerId: data.passengerId,
      passengerName: data.passengerName,
      department: data.department,
      pickup: data.pickup.trim(),
      destination: data.destination.trim(),
      date: formatDateInput(data.date),
      time: formatTimeInput(data.time),
      status: "PENDING",
      driverId: null, driverName: null, vehicleId: null, vehiclePlate: null,
      qrScanStatus: null, feedbackStatus: null,
      createdAt: DEMO_NOW,
    };
    setTransportRequests((prev) => [...prev, request]);
    setNotifications((prev) => [
      ...prev,
      { id: makeNotifId("a"), recipientId: "ADMIN", recipientRole: "admin", read: false, timestamp: DEMO_TIME,
        title: "New Transport Request",
        message: `${data.passengerName} (${data.passengerId}) requested transport from ${data.pickup.trim()} to ${data.destination.trim()} on ${formatDateInput(data.date)} at ${formatTimeInput(data.time)}.`,
        relatedRequestId: request.id },
    ].slice(-50));
    return request.id;
  }

  function updateTransportRequest(id, patch) {
    setTransportRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function submitFeedback(requestId, { rating, comment, tags }) {
    const req = transportRequests.find((r) => r.id === requestId);
    if (!req) return;
    const record = {
      id: nextSeqId(feedbackRecords, "FDB"),
      requestId,
      passengerId: req.passengerId,
      passengerName: req.passengerName,
      driverId: req.driverId,
      driverName: req.driverName,
      vehicleId: req.vehicleId,
      vehiclePlate: req.vehiclePlate,
      rating, comment: comment.trim(), commentTags: tags,
      date: "14 Aug 2026",
      department: req.department,
    };
    setFeedbackRecords((prev) => [...prev, record]);
    updateTransportRequest(requestId, { status: "FEEDBACK_SUBMITTED", qrScanStatus: "DROP_OFF_SCANNED", feedbackStatus: "SUBMITTED" });
  }

  function addVehicleCheckIn(record) {
    const id = `CHK-${String(vehicleCheckins.reduce((m, c) => Math.max(m, parseInt(c.id.split("-")[1], 10) || 0), 0) + 1).padStart(3, "0")}`;
    setVehicleCheckins((prev) => [...prev, { id, ...record }]);
  }

  function updateVehicleCheckIn(requestId, patch) {
    setVehicleCheckins((prev) => prev.map((c) => (c.requestId === requestId ? { ...c, ...patch } : c)));
  }

  function markAllNotificationsRead(roleKey) {
    setNotifications((prev) => prev.map((n) => (n.recipientRole === roleKey ? { ...n, read: true } : n)));
  }

  function getUnreadCount(roleKey) {
    return notifications.filter((n) => n.recipientRole === roleKey && !n.read).length;
  }

  return (
    <div className="min-h-full w-full bg-slate-50 text-slate-900" style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <Toast toast={toast} />
      {!role && <RoleSelect onSelect={switchRole} />}
      {role &&       <DemoSwitchBar role={role} drivers={drivers} passengers={passengers} lastAssignedDriverId={lastAssignedDriverId}
        onSwitchRole={switchRole} onSwitchProfile={(r, id) => switchRole(r, id)} onReset={resetToRoleSelect} />}
      {role === "admin" && (
        <AdminApp
          drivers={drivers} setDrivers={setDrivers}
          vehicles={vehicles} setVehicles={setVehicles} passengers={passengers}
          transportRequests={transportRequests} setTransportRequests={setTransportRequests}
          notifications={notifications} setNotifications={setNotifications}
          feedbackRecords={feedbackRecords} setFeedbackRecords={setFeedbackRecords}
          vehicleCheckins={vehicleCheckins} setVehicleCheckins={setVehicleCheckins}
          weights={weights} passMarks={passMarks} setWeights={setWeights} setPassMarks={setPassMarks}
          onAssign={assignDriverVehicle}
          markNotificationRead={markNotificationRead}
          markAllNotificationsRead={markAllNotificationsRead}
          unreadCount={getUnreadCount("admin")}
          notify={notify} onExit={resetToRoleSelect}
        />
      )}
      {role === "driver" && !selectedUserId && (
        <DriverUserSelector drivers={drivers} onSelect={setSelectedUserId} onExit={resetToRoleSelect} />
      )}
      {role === "driver" && selectedUserId && (
        <DriverApp drivers={drivers} vehicles={vehicles} transportRequests={transportRequests} notifications={notifications}
          vehicleCheckins={vehicleCheckins} addVehicleCheckIn={addVehicleCheckIn} updateVehicleCheckIn={updateVehicleCheckIn}
          markNotificationRead={markNotificationRead} notify={notify} onExit={resetToRoleSelect} userId={selectedUserId} />
      )}
      {role === "passenger" && !selectedUserId && (
        <PassengerUserSelector passengers={passengers} onSelect={setSelectedUserId} onExit={resetToRoleSelect} />
      )}
      {role === "passenger" && selectedUserId && (
        <PassengerApp passengers={passengers} drivers={drivers} vehicles={vehicles} transportRequests={transportRequests} notifications={notifications}
          addTransportRequest={addTransportRequest} updateTransportRequest={updateTransportRequest} submitFeedback={submitFeedback}
          markNotificationRead={markNotificationRead} notify={notify} onExit={resetToRoleSelect} userId={selectedUserId} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   ROLE SELECTION
   ------------------------------------------------------------------------- */

function RoleSelect({ onSelect }) {
  const cards = [
    { key: "admin", title: "Admin", desc: "Manage drivers, assessments and certification.", icon: LayoutDashboard, tag: "Desktop-oriented" },
    { key: "driver", title: "Driver", desc: "View profile, certification and QR identity.", icon: CreditCard, tag: "Mobile-first" },
    { key: "passenger", title: "Passenger", desc: "Use the service and rate your chauffeur.", icon: Car, tag: "Mobile-first" },
  ];
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-slate-950">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-5">
            <BrandLogo height={48} />
          </div>
          <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-semibold tracking-widest uppercase mb-4">
            <Shield className="h-4 w-4" /> Phase 1 Prototype
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">Professional Chauffeur<br className="hidden sm:block" /> Certification Program</h1>
          <p className="text-slate-400 mt-3 max-w-lg mx-auto">Choose a demo role to preview its experience. This selector is for prototype demonstration only — not the production sign-in.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {cards.map((c) => (
            <button
              key={c.key}
              onClick={() => onSelect(c.key)}
              className="text-left bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-6 transition-colors group"
            >
              <div className="h-11 w-11 rounded-xl bg-slate-800 group-hover:bg-amber-600 flex items-center justify-center mb-5 transition-colors">
                <c.icon className="h-5 w-5 text-slate-300 group-hover:text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg">{c.title}</h3>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">{c.desc}</p>
              <div className="flex items-center justify-between mt-6">
                <span className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">{c.tag}</span>
                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
        <p className="text-center text-slate-600 text-xs mt-10">Business rules for scoring, certification progression and ranking are placeholders pending confirmation.</p>
      </div>
    </div>
  );
}

function RoleSwitchFooter({ onExit, label }) {
  return (
    <button onClick={onExit} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
      <LogOut className="h-4 w-4" /> {label}
    </button>
  );
}

const DEMO_ROLES = [
  { key: "admin", label: "Admin", sub: "System Admin", icon: LayoutDashboard },
  { key: "driver", label: "Driver", sub: "Select driver", icon: Car },
  { key: "passenger", label: "Passenger", sub: "Select passenger", icon: User },
];

function DemoSwitchBar({ role, drivers, passengers, lastAssignedDriverId, onSwitchRole, onSwitchProfile, onReset }) {
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(null);
  const current = DEMO_ROLES.find((r) => r.key === role) || DEMO_ROLES[0];

  const accounts = picking === "driver"
    ? (drivers || []).filter((d) => d.status === "Active")
    : (passengers || []);

  return (
    <div className="sticky top-0 z-50 bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <BrandLogo height={26} />
          <span className="text-xs font-semibold tracking-widest uppercase text-amber-400 truncate">PCCP Demo</span>
        </div>
        <div className="relative">
          <button onClick={() => { setPicking(null); setOpen((o) => !o); }}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium">
            <span className="text-slate-400">Viewing</span>
            <span className="flex items-center gap-1.5"><current.icon className="h-3.5 w-3.5 text-amber-400" />{current.label}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-1 w-72 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1 z-50 max-h-[70vh] overflow-y-auto">
                {!picking && (
                  <>
                    <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Quick Role Switcher</p>
                    {DEMO_ROLES.map((r) => (
                      <button key={r.key} onClick={() => {
                          if (r.key === "driver" && lastAssignedDriverId) { onSwitchProfile("driver", lastAssignedDriverId); setOpen(false); }
                          else if (r.key === "driver" || r.key === "passenger") { setPicking(r.key); }
                          else { onSwitchRole(r.key); setOpen(false); }
                        }}
                        className={cx("w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50", r.key === role && "bg-slate-50")}>
                        <r.icon className={cx("h-4 w-4", r.key === role ? "text-amber-500" : "text-slate-400")} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium leading-tight">{r.label}</span>
                          <span className="block text-[11px] text-slate-400 leading-tight">{r.sub}</span>
                        </span>
                        {(r.key === "driver" || r.key === "passenger") && <ChevronRight className="h-4 w-4 text-slate-300" />}
                        {r.key === role && r.key === "admin" && <Check className="h-4 w-4 text-amber-500" />}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 my-1" />
                    <button onClick={() => { onReset(); setOpen(false); }}
                      className="w-full text-left px-3 py-2 flex items-center gap-2.5 text-slate-500 hover:bg-slate-50 text-sm">
                      <LogOut className="h-4 w-4" /> Full role select
                    </button>
                  </>
                )}
                {picking && (
                  <>
                    <button onClick={() => setPicking(null)}
                      className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-500 hover:bg-slate-50 text-sm border-b border-slate-100">
                      <ArrowLeft className="h-4 w-4" /> Back to roles
                    </button>
                    <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {picking === "driver" ? "Select Driver" : "Select Passenger"}
                    </p>
                    {accounts.map((a) => (
                      <button key={a.id} onClick={() => { onSwitchProfile(picking, a.id); setOpen(false); setPicking(null); }}
                        className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50">
                        <Avatar name={a.name} size="h-7 w-7" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium leading-tight truncate">{a.name}</span>
                          <span className="block text-[11px] text-slate-400 font-mono leading-tight">{a.id}</span>
                        </span>
                        <Check className="h-4 w-4 text-slate-200" />
                      </button>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   ADMIN APPLICATION
   ========================================================================= */

function AdminApp({ drivers, setDrivers, vehicles, setVehicles, passengers, transportRequests, setTransportRequests,
  notifications, setNotifications, feedbackRecords, setFeedbackRecords, vehicleCheckins, setVehicleCheckins,
  weights, passMarks, setWeights, setPassMarks,
  onAssign, markNotificationRead, markAllNotificationsRead, unreadCount, notify, onExit }) {
  const [authed, setAuthed] = useState(false);
  const [screen, setScreen] = useState("dashboard"); // dashboard | requests | requestDetail | drivers | driverDetail | vehicles | vehicleDetail | assessments | records | feedback | notifications | settings
  const [selectedId, setSelectedId] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const selectedDriver = drivers.find((d) => d.id === selectedId);
  const selectedRequest = transportRequests.find((r) => r.id === selectedId);
  const selectedVehicle = vehicles.find((v) => v.id === selectedId);
  const selectedPassenger = passengers.find((p) => p.id === selectedId);

  function updateDriver(id, patch) {
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function updateRequest(id, patch) {
    setTransportRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function updateVehicle(id, patch) {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  function nextId(list, prefix) {
    const max = list.reduce((m, x) => Math.max(m, parseInt(x.id.split("-")[1], 10) || 0), 0);
    return `${prefix}-${String(max + 1).padStart(3, "0")}`;
  }

  function addDriver(data) {
    const vehicle = vehicles.find((v) => v.id === data.vehicleId);
    const d = {
      id: nextId(drivers, "DRV"),
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      level: data.level,
      certStatus: "Pending",
      status: "Active",
      validUntil: "—",
      joined: "14 Aug 2026",
      accidentFree: "—",
      englishLevel: data.englishLevel,
      credits: 0,
      currentVehicle: vehicle ? vehicle.plate : null,
      vehicle: vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.plate}` : "—",
      assessment: { written: 0, practical: 0, operational: 0, feedbackAvg: 0 },
      score: 0,
      rating: 0,
    };
    setDrivers((prev) => [...prev, d]);
    notify("Driver added successfully.", "success");
  }

  function addVehicle(data) {
    const v = {
      id: nextId(vehicles, "VEH"),
      plate: data.plate.trim().toUpperCase(),
      qrValue: data.plate.trim().toUpperCase(),
      make: data.make.trim(),
      model: data.model.trim(),
      year: data.year,
      color: data.color.trim(),
      status: "Active",
    };
    setVehicles((prev) => [...prev, v]);
    notify("Vehicle added successfully.", "success");
  }

  const nav = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "requests", label: "Transport Requests", icon: ClipboardList },
    { key: "drivers", label: "Drivers", icon: Users },
    { key: "vehicles", label: "Vehicles", icon: Car },
    { key: "passengers", label: "Passengers", icon: User },
    { key: "assessments", label: "Assessments", icon: FileCheck2 },
    { key: "records", label: "Operational Records", icon: ListChecks },
    { key: "feedback", label: "Feedback", icon: MessageSquare },
    { key: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  function go(key) {
    setScreen(key);
    setSelectedId(null);
    setMobileNavOpen(false);
  }

  if (!authed) {
    return <AdminLogin onLogin={() => setAuthed(true)} onExit={onExit} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className={cx(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 flex flex-col transition-transform",
        mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800">
          <BrandLogo height={32} />
          <div>
            <p className="text-white font-semibold text-sm leading-tight">PCCP Admin</p>
            <p className="text-[11px] text-slate-500">Management Console</p>
          </div>
          <button className="ml-auto lg:hidden text-slate-500" onClick={() => setMobileNavOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((n) => {
            const active = screen === n.key ||
              (n.key === "drivers" && screen === "driverDetail") ||
              (n.key === "requests" && screen === "requestDetail") ||
              (n.key === "vehicles" && screen === "vehicleDetail") ||
              (n.key === "passengers" && screen === "passengerDetail");
            return (
              <button
                key={n.key}
                onClick={() => go(n.key)}
                className={cx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active ? "bg-slate-800 text-white" : "hover:bg-slate-900 text-slate-400"
                )}
              >
                <n.icon className="h-4 w-4" /> {n.label}
                {n.badge > 0 && (
                  <span className="ml-auto h-5 min-w-5 rounded-full bg-rose-600 text-white text-[10px] font-semibold flex items-center justify-center px-1.5">{n.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-slate-800 flex items-center gap-3">
          <Avatar name="Admin User" tone="bg-amber-700" size="h-9 w-9" />
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">Admin User</p>
            <p className="text-[11px] text-slate-500">Program Administrator</p>
          </div>
        </div>
        <div className="px-4 pb-4"><RoleSwitchFooter onExit={onExit} label="Exit demo role" /></div>
      </aside>
      {mobileNavOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileNavOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button onClick={() => setMobileNavOpen(true)}><Menu className="h-5 w-5" /></button>
          <BrandLogo height={28} darkChip />
          <NotificationBell count={unreadCount} onClick={() => { setScreen("notifications"); setMobileNavOpen(false); }} />
        </div>

        {screen === "dashboard" && (
          <AdminDashboard
            transportRequests={transportRequests}
            drivers={drivers} vehicles={vehicles}
            onGoRequests={() => go("requests")}
            onGoDrivers={() => go("drivers")}
            onGoVehicles={() => go("vehicles")}
            onGoFeedback={() => go("feedback")}
            onOpenRequest={(id) => { setSelectedId(id); setScreen("requestDetail"); }}
            onOpenDriver={(id) => { setSelectedId(id); setScreen("driverDetail"); }}
          />
        )}
        {screen === "requests" && (
          <TransportRequestsList transportRequests={transportRequests} drivers={drivers}
            onOpen={(id) => { setSelectedId(id); setScreen("requestDetail"); }} />
        )}
        {screen === "requestDetail" && selectedRequest && (
          <TransportRequestDetail
            request={selectedRequest} drivers={drivers} vehicles={vehicles}
            feedbackRecords={feedbackRecords}
            onBack={() => setScreen("requests")}
            onAssign={(driverId, vehicleId) => { onAssign(selectedRequest.id, driverId, vehicleId); notify("Driver and vehicle assigned.", "success"); }}
          />
        )}
        {screen === "drivers" && (
          <AdminDrivers drivers={drivers} vehicles={vehicles} onOpenDriver={(id) => { setSelectedId(id); setScreen("driverDetail"); }} onAddDriver={addDriver} />
        )}
        {screen === "driverDetail" && selectedDriver && (
          <AdminDriverDetail
            driver={selectedDriver}
            onBack={() => setScreen("drivers")}
            onUpdate={(patch) => updateDriver(selectedDriver.id, patch)}
            onDelete={(id) => { setDrivers((prev) => prev.filter((d) => d.id !== id)); setScreen("drivers"); }}
            notify={notify}
            vehicleCheckins={vehicleCheckins}
            vehicles={vehicles}
            weights={weights}
            passMarks={passMarks}
          />
        )}
        {screen === "vehicles" && <VehiclesList vehicles={vehicles} drivers={drivers} onOpen={(id) => { setSelectedId(id); setScreen("vehicleDetail"); }} onAddVehicle={addVehicle} />}
        {screen === "vehicleDetail" && selectedVehicle && (
          <VehicleDetail vehicle={selectedVehicle} drivers={drivers} onBack={() => setScreen("vehicles")} vehicleCheckins={vehicleCheckins}
            onUpdate={(patch) => updateVehicle(selectedVehicle.id, patch)} onDelete={(id) => { setVehicles((prev) => prev.filter((v) => v.id !== id)); setScreen("vehicles"); }} notify={notify} />
        )}
        {screen === "passengers" && (
          <PassengersList passengers={passengers} transportRequests={transportRequests} onOpenPassenger={(id) => { setSelectedId(id); setScreen("passengerDetail"); }} />
        )}
        {screen === "passengerDetail" && selectedPassenger && (
          <PassengerDetail passenger={selectedPassenger} transportRequests={transportRequests} onBack={() => setScreen("passengers")} />
        )}
        {screen === "assessments" && <AdminAssessments drivers={drivers} onOpenDriver={(id) => { setSelectedId(id); setScreen("driverDetail"); }} />}
        {screen === "records" && <OperationalRecords vehicleCheckins={vehicleCheckins} drivers={drivers} vehicles={vehicles} transportRequests={transportRequests} />}
        {screen === "feedback" && <AdminFeedback drivers={drivers} feedbackRecords={feedbackRecords} onOpenDriver={(id) => { setSelectedId(id); setScreen("driverDetail"); }} />}
        {screen === "notifications" && (
          <AdminNotifications notifications={notifications} markRead={markNotificationRead} markAllRead={() => markAllNotificationsRead("admin")}
            onOpenRequest={(id) => { setSelectedId(id); setScreen("requestDetail"); }} />
        )}
        {screen === "settings" && <AdminSettings notify={notify} weights={weights} passMarks={passMarks} onUpdateWeights={setWeights} onUpdatePassMarks={setPassMarks} onReset={resetToDefaults} />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   ADMIN LOGIN
   ------------------------------------------------------------------------- */

function AdminLogin({ onLogin, onExit }) {
  const [email, setEmail] = useState("admin@pccp.demo");
  const [password, setPassword] = useState("••••••••");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-slate-950">
      <div className="w-full max-w-sm">
         <div className="text-center mb-8">
           <div className="flex justify-center mb-4"><BrandLogo height={48} /></div>
           <h1 className="text-2xl font-semibold text-white tracking-tight">PCCP Management Console</h1>
          <p className="text-slate-400 text-sm mt-1.5">Sign in to manage transport operations</p>
        </div>
        <Card className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
              className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
              className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <Button className="w-full" onClick={onLogin}><LogOut className="h-4 w-4 rotate-180" /> Sign In</Button>
          <p className="text-[11px] text-slate-400 text-center">Demo credentials pre-filled — not a real authentication flow.</p>
        </Card>
        <div className="mt-6 text-center"><RoleSwitchFooter onExit={onExit} label="Back to role selection" /></div>
      </div>
    </div>
  );
}

function DriverUserSelector({ drivers, onSelect, onExit }) {
  const active = drivers.filter((d) => d.status === "Active");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-4"><Car className="h-7 w-7 text-white" /></div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Driver Portal</h1>
          <p className="text-slate-400 text-sm mt-1.5">Select a driver account to continue</p>
        </div>
        <div className="space-y-2">
          {active.map((d) => (
            <button key={d.id} onClick={() => onSelect(d.id)}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-slate-800 transition text-left">
              <Avatar name={d.name} size="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{d.name}</p>
                <p className="text-xs text-slate-400 font-mono">{d.id} · Level {d.level}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-xs text-amber-400"><Star className="h-3 w-3 fill-amber-400" /> {d.rating.toFixed(1)}</div>
                <p className="text-xs text-slate-500 mt-0.5">{d.currentVehicle || "No vehicle"}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 text-center"><RoleSwitchFooter onExit={onExit} label="Back to role selection" /></div>
      </div>
    </div>
  );
}

function PassengerUserSelector({ passengers, onSelect, onExit }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-sky-600 flex items-center justify-center mx-auto mb-4"><User className="h-7 w-7 text-white" /></div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Passenger Portal</h1>
          <p className="text-slate-400 text-sm mt-1.5">Select a passenger account to continue</p>
        </div>
        <div className="space-y-2">
          {passengers.map((p) => (
            <button key={p.id} onClick={() => onSelect(p.id)}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 hover:bg-slate-800 transition text-left">
              <Avatar name={p.name} size="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{p.name}</p>
                <p className="text-xs text-slate-400 font-mono">{p.id}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-400">{p.department}</p>
                <p className="text-xs text-slate-500 mt-0.5">{p.phone}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 text-center"><RoleSwitchFooter onExit={onExit} label="Back to role selection" /></div>
      </div>
    </div>
  );
}

function KPICard({ label, value, icon: Icon, tone = "slate", suffix }) {
  const tones = { slate: "text-slate-900", emerald: "text-emerald-600", amber: "text-amber-600", sky: "text-sky-600", indigo: "text-indigo-600", teal: "text-teal-600" };
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>{label}</SectionLabel>
        <Icon className="h-4 w-4 text-slate-300" />
      </div>
      <p className={cx("text-2xl sm:text-3xl font-semibold tracking-tight", tones[tone])}>{value}<span className="text-base font-medium text-slate-400 ml-1">{suffix}</span></p>
    </Card>
  );
}

function AdminDashboard({ transportRequests, drivers, vehicles, onGoRequests, onGoDrivers, onGoVehicles, onGoFeedback, onOpenRequest, onOpenDriver }) {
  const total = transportRequests.length;
  const pending = transportRequests.filter((r) => r.status === "PENDING").length;
  const assigned = transportRequests.filter((r) => r.status === "ASSIGNED" || r.status === "QR_PENDING").length;
  const qrPending = transportRequests.filter((r) => r.status === "QR_PENDING" || r.qrScanStatus === "QR_PENDING").length;
  const qrScanned = transportRequests.filter((r) => r.qrScanStatus === "PICK_UP_SCANNED" || r.qrScanStatus === "DROP_OFF_SCANNED").length;
  const completed = transportRequests.filter((r) => ["PICK_UP_SCANNED", "DROP_OFF_SCANNED", "FEEDBACK_SUBMITTED"].includes(r.status)).length;
  const feedbackDone = transportRequests.filter((r) => r.feedbackStatus === "SUBMITTED").length;
  const activeDrivers = drivers.filter((d) => d.status === "Active").length;
  const activeVehicles = vehicles.filter((v) => v.status === "Active").length;
  const upcoming = transportRequests.filter((r) => ["PENDING", "ASSIGNED", "QR_PENDING"].includes(r.status)).length;

  const statusData = [
    { name: "Pending", value: pending, color: "#f59e0b" },
    { name: "Assigned", value: assigned, color: "#3b82f6" },
    { name: "In Progress", value: qrScanned, color: "#06b6d4" },
    { name: "Completed", value: completed, color: "#10b981" },
    { name: "Feedback", value: feedbackDone, color: "#8b5cf6" },
  ].filter((d) => d.value > 0);

  const deptData = Object.entries(
    transportRequests.reduce((acc, r) => { acc[r.department] = (acc[r.department] || 0) + 1; return acc; }, {})
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const scoreData = (() => {
    const buckets = [
      { name: "0-20", min: 0, max: 20, count: 0 },
      { name: "21-40", min: 21, max: 40, count: 0 },
      { name: "41-60", min: 41, max: 60, count: 0 },
      { name: "61-80", min: 61, max: 80, count: 0 },
      { name: "81-100", min: 81, max: 100, count: 0 },
    ];
    drivers.forEach((d) => {
      const b = buckets.find((b) => d.score >= b.min && d.score <= b.max);
      if (b) b.count++;
    });
    return buckets;
  })();

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader title="Dashboard" subtitle="Transport operations and certification overview." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Requests" value={total} icon={ClipboardList} />
        <KPICard label="Pending Requests" value={pending} icon={Clock} tone="amber" />
        <KPICard label="Assigned Requests" value={assigned} icon={CheckCircle2} tone="sky" />
        <KPICard label="Upcoming Trips" value={upcoming} icon={CalendarDays} tone="indigo" />
        <KPICard label="Completed Trips" value={completed} icon={MapPin} tone="emerald" />
        <KPICard label="QR Pending" value={qrPending} icon={QrCode} tone="amber" />
        <KPICard label="QR Scanned" value={qrScanned} icon={ScanLine} tone="teal" />
        <KPICard label="Feedback Submitted" value={feedbackDone} icon={Star} tone="emerald" />
      </div>

      {total > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Request Status Distribution</h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center"><Users className="h-5 w-5 text-emerald-600" /></div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{activeDrivers} / {drivers.length}</p>
            <p className="text-xs text-slate-400">Active Drivers</p>
          </div>
          <button onClick={onGoDrivers} className="ml-auto text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1">View all <ChevronRight className="h-3.5 w-3.5" /></button>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-sky-100 flex items-center justify-center"><Car className="h-5 w-5 text-sky-600" /></div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{activeVehicles} / {vehicles.length}</p>
            <p className="text-xs text-slate-400">Active Vehicles</p>
          </div>
          <button onClick={onGoVehicles} className="ml-auto text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1">View all <ChevronRight className="h-3.5 w-3.5" /></button>
        </Card>
      </div>

      {deptData.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Requests by Department</h2>
          <ResponsiveContainer width="100%" height={Math.max(180, deptData.length * 36)}>
            <BarChart data={deptData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Transport Requests</h2>
            <button onClick={onGoRequests} className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1">View all <ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
          {transportRequests.length === 0 ? (
            <EmptyState title="No transport requests" subtitle="Passenger requests will appear here." icon={ClipboardList} />
          ) : (
            <div className="divide-y divide-slate-100">
              {transportRequests.slice(0, 5).map((r) => (
                <button key={r.id} onClick={() => onOpenRequest(r.id)} className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50">
                  <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Avatar name={r.passengerName} size="h-9 w-9" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{r.passengerName}</p>
                    <p className="text-xs text-slate-400 font-mono">{r.id} · {r.department} · {r.date}</p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-slate-500">{r.pickup} → {r.destination}</p>
                    {r.driverName && <p className="text-xs text-slate-400 mt-0.5">{r.driverName} · {r.vehiclePlate}</p>}
                  </div>
                  <TransportStatusBadge status={r.status} />
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={onGoRequests}><ClipboardList className="h-4 w-4" /> Review Requests</Button>
            <Button variant="outline" className="w-full justify-start" onClick={onGoDrivers}><Users className="h-4 w-4" /> Manage Drivers</Button>
            <Button variant="outline" className="w-full justify-start" onClick={onGoVehicles}><Car className="h-4 w-4" /> Manage Vehicles</Button>
            <Button variant="outline" className="w-full justify-start" onClick={onGoFeedback}><MessageSquare className="h-4 w-4" /> Review Feedback</Button>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Driver Overview</h2>
          <button onClick={onGoDrivers} className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1">View all <ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">Certification</th>
                <th className="px-5 py-3 font-medium">Level</th>
                <th className="px-5 py-3 font-medium">Rating</th>
                <th className="px-5 py-3 font-medium">Vehicle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drivers.slice(0, 5).map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onOpenDriver(d.id)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={d.name} size="h-8 w-8" />
                      <div>
                        <p className="font-medium text-slate-900">{d.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{d.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><CertBadge status={d.certStatus} /></td>
                  <td className="px-5 py-3 text-slate-700">Level {d.level}</td>
                  <td className="px-5 py-3 text-slate-700 flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {d.rating.toFixed(1)}</td>
                  <td className="px-5 py-3 font-mono text-slate-500">{d.currentVehicle || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Driver Score Distribution</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={scoreData} margin={{ left: 10, right: 10 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function AdminDrivers({ drivers, vehicles, onOpenDriver, onAddDriver }) {
  const [query, setQuery] = useState("");
  const [certFilter, setCertFilter] = useState("All");
  const [sortKey, setSortKey] = useState("name");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = drivers.filter((d) =>
      (d.name.toLowerCase().includes(query.toLowerCase()) || d.id.toLowerCase().includes(query.toLowerCase())) &&
      (certFilter === "All" || d.certStatus === certFilter)
    );
    list = [...list].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "rating") return b.rating - a.rating;
      if (sortKey === "score") return b.score - a.score;
      return 0;
    });
    return list;
  }, [drivers, query, certFilter, sortKey]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Driver Management</h1>
          <p className="text-slate-500 text-sm mt-1">Search, filter and manage driver records.</p>
        </div>
        <Button variant="accent" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Driver</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or driver ID"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={certFilter} onChange={(e) => setCertFilter(e.target.value)} className="rounded-lg border border-slate-200 text-sm py-2.5 px-2 focus:outline-none">
              {["All", "Certified", "Pending", "Suspended", "Revoked"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="rounded-lg border border-slate-200 text-sm py-2.5 px-2 focus:outline-none">
              <option value="name">Sort: Name</option>
              <option value="rating">Sort: Rating</option>
              <option value="score">Sort: Score</option>
            </select>
          </div>
          <Button variant="outline" onClick={() => exportToCSV(filtered, DRIVER_EXPORT_COLUMNS, "drivers.csv")} className="ml-auto">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="No drivers found" subtitle="Try adjusting your search or filter." icon={Users} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Driver</th>
                  <th className="px-5 py-3 font-medium">Driver ID</th>
                  <th className="px-5 py-3 font-medium">Certification</th>
                  <th className="px-5 py-3 font-medium">Level</th>
                  <th className="px-5 py-3 font-medium">Rating</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onOpenDriver(d.id)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={d.name} size="h-8 w-8" />
                        <span className="font-medium text-slate-900">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-500">{d.id}</td>
                    <td className="px-5 py-3"><CertBadge status={d.certStatus} /></td>
                    <td className="px-5 py-3 text-slate-700">Level {d.level}</td>
                    <td className="px-5 py-3 text-slate-700 flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {d.rating.toFixed(1)}</td>
                    <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onOpenDriver(d.id); }} className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onOpenDriver(d.id); }} className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddDriverModal open={addOpen} onClose={() => setAddOpen(false)} onSave={onAddDriver} vehicles={vehicles} />
    </div>
  );
}

function PassengersList({ passengers, transportRequests, onOpenPassenger }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return passengers.filter((p) =>
      !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.department || "").toLowerCase().includes(q)
    );
  }, [passengers, query]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Passenger Directory</h1>
        <p className="text-slate-500 text-sm mt-1">View and select passenger accounts for transport services.</p>
      </div>

      <Card className="p-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, ID or department"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="No passengers found" subtitle="Try adjusting your search." icon={User} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Passenger</th>
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const tripCount = transportRequests.filter((r) => r.passengerId === p.id).length;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onOpenPassenger(p.id)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.name} size="h-8 w-8" />
                          <span className="font-medium text-slate-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-500">{p.id}</td>
                      <td className="px-5 py-3 text-slate-700">{p.department || "—"}</td>
                      <td className="px-5 py-3 text-slate-700">{p.phone || "—"}</td>
                      <td className="px-5 py-3 text-slate-700">{p.email || "—"}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={(e) => { e.stopPropagation(); onOpenPassenger(p.id); }}
                          className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        {tripCount > 0 && <span className="ml-2 text-xs text-slate-400">({tripCount})</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function PassengerDetail({ passenger, transportRequests, onBack }) {
  const trips = transportRequests.filter((r) => r.passengerId === passenger.id);
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to passengers
      </button>
      <Card className="p-6 flex items-center gap-4">
        <Avatar name={passenger.name} size="h-14 w-14" />
        <div className="min-w-0">
          <p className="text-lg font-semibold text-slate-900">{passenger.name}</p>
          <p className="text-xs text-slate-400 font-mono">{passenger.id}</p>
          <p className="text-sm text-slate-500 mt-1">{passenger.department || "—"}</p>
        </div>
      </Card>
      <Card className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <SectionLabel>Phone</SectionLabel>
          <p className="text-sm text-slate-700">{passenger.phone || "—"}</p>
        </div>
        <div>
          <SectionLabel>Email</SectionLabel>
          <p className="text-sm text-slate-700">{passenger.email || "—"}</p>
        </div>
      </Card>

      <div>
        <SectionLabel>Transport Requests</SectionLabel>
        <Card className="divide-y divide-slate-100 mt-2">
          {trips.length === 0 ? (
            <EmptyState title="No transport requests" subtitle="This passenger has not requested transport yet." icon={Car} />
          ) : (
            trips.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{t.id}</p>
                  <p className="text-xs text-slate-500 truncate">{t.pickup} → {t.destination}</p>
                </div>
                <TransportStatusBadge status={t.status} />
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

function AddDriverModal({ open, onClose, onSave, vehicles }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", level: "CD", englishLevel: "A2", vehicleId: "" });
  const [errors, setErrors] = useState({});

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleSave() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.phone.trim()) errs.phone = "Phone is required.";
    if (!form.email.trim() || !form.email.includes("@")) errs.email = "A valid email is required.";
    if (form.vehicleId && !vehicles.find((v) => v.id === form.vehicleId)) errs.vehicleId = "Select a valid vehicle.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave(form);
    setForm({ name: "", phone: "", email: "", level: "CD", englishLevel: "A2", vehicleId: "" });
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Driver">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500">Full Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ko Zaw"
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.name ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Phone *</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+95 9 ..."
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.phone ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Email *</label>
            <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="driver@pccp.demo" type="email"
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.email ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Target Level</label>
            <select value={form.level} onChange={(e) => set("level", e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 focus:outline-none">
              {CERT_LEVELS.map((l) => <option key={l} value={l}>{l} — pass mark {PASS_MARKS[l]}%</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">English Level</label>
            <select value={form.englishLevel} onChange={(e) => set("englishLevel", e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 focus:outline-none">
              {["A1", "A2", "B1", "B2", "C1"].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500">Assigned Vehicle (optional)</label>
            <select value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 focus:outline-none">
              <option value="">No vehicle assigned</option>
              {vehicles.filter((v) => v.status === "Active").map((v) => (
                <option key={v.id} value={v.id}>{v.make} {v.model} · {v.plate}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-slate-400">New drivers start as Pending certification with zero assessment marks until assessed.</p>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><Plus className="h-4 w-4" /> Add Driver</Button>
        </div>
      </div>
    </Modal>
  );
}

function EditDriverModal({ open, onClose, onSave, driver, vehicles }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", level: "CD", englishLevel: "A2", vehicleId: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (driver) {
      const matchedVehicle = vehicles.find((v) => v.plate === driver.vehicle?.split(" · ")[1]);
      setForm({
        name: driver.name || "",
        phone: driver.phone || "",
        email: driver.email || "",
        level: driver.level || "CD",
        englishLevel: driver.englishLevel || "A2",
        vehicleId: matchedVehicle ? matchedVehicle.id : "",
      });
    }
  }, [driver, vehicles]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleSave() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.phone.trim()) errs.phone = "Phone is required.";
    if (!form.email.trim() || !form.email.includes("@")) errs.email = "A valid email is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const vehicle = vehicles.find((v) => v.id === form.vehicleId);
    onSave({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      level: form.level,
      englishLevel: form.englishLevel,
      currentVehicle: vehicle ? vehicle.plate : null,
      vehicle: vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.plate}` : "—",
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit Driver — ${driver?.name || ""}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500">Full Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.name ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Phone *</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.phone ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Email *</label>
            <input value={form.email} onChange={(e) => set("email", e.target.value)} type="email"
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.email ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Certification Level</label>
            <select value={form.level} onChange={(e) => set("level", e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 focus:outline-none">
              {CERT_LEVELS.map((l) => <option key={l} value={l}>{l} — pass mark {PASS_MARKS[l]}%</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">English Level</label>
            <select value={form.englishLevel} onChange={(e) => set("englishLevel", e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 focus:outline-none">
              {["A1", "A2", "B1", "B2", "C1"].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500">Assigned Vehicle</label>
            <select value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 focus:outline-none">
              <option value="">No vehicle assigned</option>
              {vehicles.filter((v) => v.status === "Active").map((v) => (
                <option key={v.id} value={v.id}>{v.make} {v.model} · {v.plate}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><CheckCircle2 className="h-4 w-4" /> Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
}

function AdminDriverDetail({ driver, onBack, onUpdate, onDelete, notify, vehicleCheckins, vehicles, weights, passMarks }) {
  const [tab, setTab] = useState("overview");
  const [confirmModal, setConfirmModal] = useState(null); // 'status' | 'issue' | 'revoke' | 'delete' | 'suspend' | null
  const [editOpen, setEditOpen] = useState(false);
  const [issueLevel, setIssueLevel] = useState(driver.level);
  const [revokeReason, setRevokeReason] = useState("");

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "info", label: "Driver Information" },
    { key: "passport", label: "Driver Passport" },
    { key: "assessment", label: "Assessment" },
    { key: "feedback", label: "Feedback" },
    { key: "records", label: "Operational Records" },
  ];

  const eligible = driver.score >= (PASS_MARKS[issueLevel] || 100);

  function handleToggleStatus() {
    const next = driver.status === "Active" ? "Inactive" : "Active";
    onUpdate({ status: next });
    notify(`Driver set to ${next}.`, "success");
    setConfirmModal(null);
  }

  function handleIssue() {
    if (!eligible) return;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const validUntil = `${expiry.getDate()} ${months[expiry.getMonth()]} ${expiry.getFullYear()}`;
    onUpdate({ certStatus: "Certified", level: issueLevel, validUntil });
    notify("Certified successfully.", "success");
    setConfirmModal(null);
  }

  function handleRevoke() {
    onUpdate({ certStatus: "Revoked", validUntil: "—" });
    notify("Certification revoked.", "success");
    setConfirmModal(null);
    setRevokeReason("");
  }

  return (
    <div className="max-w-6xl mx-auto">
      <TopBar title={driver.name} subtitle={`${driver.id} · Level ${driver.level}`} onBack={onBack}
        right={<div className="hidden sm:flex items-center gap-2"><CertBadge status={driver.certStatus} /><StatusBadge status={driver.status} /></div>} />

      <div className="p-6 space-y-5">
        <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar name={driver.name} size="h-16 w-16" tone="bg-slate-800" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold text-slate-900">{driver.name}</h2>
              <CertBadge status={driver.certStatus} />
              <StatusBadge status={driver.status} />
            </div>
            <p className="text-sm text-slate-400 font-mono mt-1">{driver.id} · Level {driver.level} · {driver.rating.toFixed(1)} ★</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit</Button>
            <Button variant="outline" onClick={() => setConfirmModal("status")}>
              {driver.status === "Active" ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {driver.status === "Active" ? "Set Inactive" : "Set Active"}
            </Button>
            {driver.certStatus !== "Suspended" && driver.certStatus !== "Revoked" && (
              <Button variant="outline" onClick={() => setConfirmModal("suspend")} className="text-amber-700 border-amber-200 hover:bg-amber-50">
                <AlertTriangle className="h-4 w-4" /> Suspend
              </Button>
            )}
            <Button variant="success" onClick={() => setConfirmModal("issue")}><FileCheck2 className="h-4 w-4" /> Issue Certificate</Button>
            <Button variant="danger" onClick={() => setConfirmModal("revoke")} disabled={driver.certStatus === "Revoked"}><Ban className="h-4 w-4" /> Revoke</Button>
            <Button variant="danger" onClick={() => setConfirmModal("delete")} className="text-rose-600 border-rose-200 hover:bg-rose-50">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </Card>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cx("px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px",
                tab === t.key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600")}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="grid md:grid-cols-3 gap-5">
            <Card className="p-5 md:col-span-2 space-y-4">
              <SectionLabel>Overall Performance</SectionLabel>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-semibold text-slate-900">{driver.score}%</p>
                <p className="text-sm text-slate-400 mb-1">Pass mark for Level {driver.level}: {PASS_MARKS[driver.level]}%</p>
              </div>
              <ProgressBar value={driver.score} tone={driver.score >= PASS_MARKS[driver.level] ? "emerald" : "amber"} />
              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  ["Written", driver.assessment.written],
                  ["Practical", driver.assessment.practical],
                  ["Operational", driver.assessment.operational],
                  ["Feedback (100-pt)", feedbackTo100(driver.assessment.feedbackAvg)],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{label}</span><span className="font-medium text-slate-700">{val}</span></div>
                    <ProgressBar value={val} />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5 space-y-3">
              <SectionLabel>Certification Timeline</SectionLabel>
              <TimelineRow icon={Clock} label="Joined program" value={driver.joined} />
              <TimelineRow icon={ShieldCheck} label="Current status" value={driver.certStatus} />
              <TimelineRow icon={Award} label="Valid until" value={driver.validUntil} />
            </Card>
          </div>
        )}

        {tab === "info" && (
          <Card className="p-5 grid sm:grid-cols-2 gap-5">
            <InfoRow icon={CreditCard} label="Driver ID" value={driver.id} mono />
            <InfoRow icon={Phone} label="Phone" value={driver.phone} />
            <InfoRow icon={Mail} label="Email" value={driver.email} />
            <InfoRow icon={Car} label="Assigned Vehicle" value={driver.vehicle} />
            <InfoRow icon={Clock} label="Joined" value={driver.joined} />
            <InfoRow icon={Shield} label="Account Status" value={driver.status} />
          </Card>
        )}

        {tab === "passport" && (
          <div className="max-w-sm">
            <PassportCard driver={driver} />
          </div>
        )}

        {tab === "assessment" && <AdminAssessmentPanel driver={driver} onUpdate={onUpdate} notify={notify} weights={weights} passMarks={passMarks} />}

        {tab === "feedback" && (
          <Card className="p-5">
            <SectionLabel>Feedback for {driver.name}</SectionLabel>
            <FeedbackList driverId={driver.id} />
          </Card>
        )}
        {tab === "records" && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-900">Operational Records</h2></div>
            {(() => {
              const driverCheckins = (vehicleCheckins || []).filter((c) => c.driverId === driver.id);
              return driverCheckins.length === 0 ? (
                <EmptyState title="No records" subtitle="Check-in/out records for this driver will appear here." icon={ListChecks} />
              ) : (
                <div className="divide-y divide-slate-100">
                  {driverCheckins.map((c) => (
                    <div key={c.id} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center"><Car className="h-3.5 w-3.5 text-slate-500" /></div>
                          <span className="text-sm font-medium text-slate-900">{c.vehiclePlate}</span>
                        </div>
                        <Badge tone={c.status === "CHECKED_OUT" ? "emerald" : "amber"} icon={c.status === "CHECKED_OUT" ? CheckCircle2 : Clock}>
                          {c.status === "CHECKED_OUT" ? "Checked Out" : "Checked In"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{c.requestId}</p>
                      <div className="grid sm:grid-cols-2 gap-2 mt-3 text-sm">
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Check In</p>
                          <p className="text-slate-900 mt-0.5">{c.checkInLocation} · {c.checkInTime}</p>
                        </div>
                        {c.checkOutLocation ? (
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Check Out</p>
                            <p className="text-slate-900 mt-0.5">{c.checkOutLocation} · {c.checkOutTime}</p>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-amber-50 p-3 flex items-center justify-center">
                            <p className="text-xs text-amber-700 font-medium">Awaiting check-out</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Card>
        )}
      </div>

      {/* Status confirm */}
      <Modal open={confirmModal === "status"} onClose={() => setConfirmModal(null)} title={driver.status === "Active" ? "Set driver inactive?" : "Set driver active?"}>
        <p className="text-sm text-slate-600 mb-5">
          {driver.status === "Active"
            ? "The driver will be hidden from passenger search, ranking, and service matching. Their profile remains stored for records."
            : "The driver will become visible again in passenger search, ranking, and service matching."}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
          <Button variant={driver.status === "Active" ? "danger" : "success"} onClick={handleToggleStatus}>Confirm</Button>
        </div>
      </Modal>

      {/* Issue certificate */}
      <Modal open={confirmModal === "issue"} onClose={() => setConfirmModal(null)} title="Issue Certificate">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500">Certification Level</label>
            <select value={issueLevel} onChange={(e) => setIssueLevel(e.target.value)} className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 focus:outline-none">
              {CERT_LEVELS.map((l) => <option key={l} value={l}>{l} — pass mark {PASS_MARKS[l]}%</option>)}
            </select>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 flex items-center justify-between text-sm">
            <span className="text-slate-500">Current overall score</span>
            <span className="font-semibold text-slate-900">{driver.score}%</span>
          </div>
          {!eligible && (
            <div className="flex items-start gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              Driver does not meet the {PASS_MARKS[issueLevel]}% pass mark required for Level {issueLevel}. Issuance is blocked.
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button variant="success" disabled={!eligible} onClick={handleIssue}>Approve & Issue</Button>
          </div>
        </div>
      </Modal>

      {/* Revoke certificate */}
      <Modal open={confirmModal === "revoke"} onClose={() => setConfirmModal(null)} title="Revoke Certificate">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">This will immediately mark the driver's certification as Revoked. This action can be reviewed later but should be used deliberately.</p>
          <div>
            <label className="text-xs font-medium text-slate-500">Reason (optional)</label>
            <textarea value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} rows={3}
              placeholder="e.g. Repeated safety violations, red-zone breach"
              className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 focus:outline-none resize-none" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRevoke}>Confirm Revoke</Button>
          </div>
        </div>
      </Modal>

      {/* Delete driver */}
      <Modal open={confirmModal === "delete"} onClose={() => setConfirmModal(null)} title="Delete Driver?">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">This will permanently remove <strong>{driver.name}</strong> ({driver.id}) from the system. This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { onDelete(driver.id); notify(`${driver.name} deleted.`, "success"); }}>Delete Driver</Button>
          </div>
        </div>
      </Modal>

      {/* Suspend driver */}
      <Modal open={confirmModal === "suspend"} onClose={() => setConfirmModal(null)} title="Suspend Driver?">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">This will set <strong>{driver.name}</strong>'s certification status to Suspended. They will be excluded from passenger search and assignments until reactivated.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { onUpdate({ certStatus: "Suspended" }); notify(`${driver.name} suspended.`, "success"); setConfirmModal(null); }}>Suspend</Button>
          </div>
        </div>
      </Modal>

      <EditDriverModal open={editOpen} onClose={() => setEditOpen(false)} driver={driver} vehicles={vehicles || []}
        onSave={(patch) => { onUpdate(patch); setEditOpen(false); notify("Driver updated.", "success"); }} />
    </div>
  );
}

function TimelineRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-slate-500" /></div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-slate-500" /></div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={cx("text-sm font-medium text-slate-800", mono && "font-mono")}>{value}</p>
      </div>
    </div>
  );
}

function AdminAssessmentPanel({ driver, onUpdate, notify, weights = DEFAULT_WEIGHTS, passMarks = PASS_MARKS }) {
  const [marks, setMarks] = useState({
    written: driver.assessment.written,
    practical: driver.assessment.practical,
    operational: driver.assessment.operational,
  });
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const feedback100 = feedbackTo100(driver.assessment.feedbackAvg);
  const overall = useMemo(() => {
    const a = { ...marks, feedbackAvg: driver.assessment.feedbackAvg };
    return computeOverallScore(a);
  }, [marks, driver.assessment.feedbackAvg]);

  function handleChange(key, raw) {
    setMarks((m) => ({ ...m, [key]: raw }));
  }

  function validate() {
    const errs = {};
    ["written", "practical", "operational"].forEach((key) => {
      const v = marks[key];
      if (v === "" || v === null || v === undefined) errs[key] = "Mark is required.";
      else if (isNaN(Number(v))) errs[key] = "Mark must be a number.";
      else if (Number(v) < 0 || Number(v) > 100) errs[key] = "Mark must be between 0 and 100.";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSaveClick() {
    if (!validate()) return;
    setConfirmOpen(true);
  }

  function handleConfirmSave() {
    const numeric = { written: Number(marks.written), practical: Number(marks.practical), operational: Number(marks.operational) };
    const newAssessment = { ...driver.assessment, ...numeric };
    onUpdate({ assessment: newAssessment, score: computeOverallScore(newAssessment) });
    setConfirmOpen(false);
    notify("Assessment saved successfully.", "success");
  }

  const categories = [
    { key: "written", label: "Written / Knowledge Assessment", weight: weights.written },
    { key: "practical", label: "Practical Assessment", weight: weights.practical },
    { key: "operational", label: "Operational Performance", weight: weights.operational },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card className="p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-1">
          <SectionLabel>Manual Assessment — {driver.name}</SectionLabel>
          <Badge tone="slate">Driver ID: {driver.id}</Badge>
        </div>
        <p className="text-xs text-slate-400 mb-5">Scores are weighted: Written {Math.round(weights.written * 100)}%, Practical {Math.round(weights.practical * 100)}%, Operational {Math.round(weights.operational * 100)}%, Feedback {Math.round(weights.feedback * 100)}%. Weights and pass marks are configurable in Settings.</p>

        <div className="space-y-5">
          {categories.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-700">{c.label}</label>
                <span className="text-xs text-slate-400">Weight {Math.round(c.weight * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number" min={0} max={100} value={marks[c.key]}
                  onChange={(e) => handleChange(c.key, e.target.value)}
                  className={cx("w-28 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                    errors[c.key] ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")}
                />
                <span className="text-sm text-slate-400">/ 100</span>
                <div className="flex-1"><ProgressBar value={Number(marks[c.key]) || 0} /></div>
              </div>
              {errors[c.key] && <p className="text-xs text-rose-600 mt-1">{errors[c.key]}</p>}
            </div>
          ))}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">User Feedback (auto-calculated)</label>
              <span className="text-xs text-slate-400">Weight {Math.round(weights.feedback * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500">{feedback100}</div>
              <span className="text-sm text-slate-400">/ 100</span>
              <div className="flex-1"><ProgressBar value={feedback100} tone="amber" /></div>
            </div>
            <p className="text-xs text-slate-400 mt-1">Derived from monthly average rating ({driver.assessment.feedbackAvg.toFixed(1)} ★ × 20).</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 h-fit">
        <SectionLabel>Overall Score</SectionLabel>
        <p className="text-4xl font-semibold text-slate-900 mt-1">{overall}%</p>
        <p className="text-xs text-slate-400 mt-1">Pass mark for Level {driver.level}: {passMarks[driver.level]}%</p>
        <ProgressBar value={overall} tone={overall >= passMarks[driver.level] ? "emerald" : "amber"} />
        {(() => {
          const qualified = getQualifiedLevels(overall, passMarks);
          const maxQualified = qualified.length > 0 ? qualified[qualified.length - 1] : null;
          return (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-2">Qualifies for</p>
              <div className="flex flex-wrap gap-1.5">
                {CERT_LEVELS.map((l) => {
                  const qualifies = overall >= passMarks[l];
                  return (
                    <span key={l} className={cx("text-xs font-mono px-2 py-1 rounded-md", qualifies ? "bg-emerald-50 text-emerald-700 font-medium" : "bg-slate-50 text-slate-400")}>
                      {l} {qualifies ? "✓" : `${passMarks[l]}%`}
                    </span>
                  );
                })}
              </div>
              {maxQualified && maxQualified !== driver.level && (
                <p className="text-xs text-emerald-600 mt-2">Eligible for upgrade to {maxQualified}</p>
              )}
            </div>
          );
        })()}
        <Button className="w-full mt-5" onClick={handleSaveClick}><ClipboardList className="h-4 w-4" /> Save Assessment</Button>
      </Card>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Save">
        <p className="text-sm text-slate-600 mb-5">Are you sure you want to save this assessment? Overall score will be updated to {overall}%.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmSave}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}

function FeedbackList({ driverId }) {
  const items = FEEDBACK_LOG.filter((f) => f.driverId === driverId);
  if (items.length === 0) return <EmptyState title="No feedback yet" subtitle="Feedback submitted by passengers will appear here." icon={MessageSquare} />;
  return (
    <div className="space-y-3">
      {items.map((f, i) => (
        <div key={i} className="p-3 rounded-lg bg-slate-50 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 font-mono">{f.passengerName} · {f.date}</p>
            <p className="text-sm text-slate-700 mt-1">{f.comment}</p>
          </div>
          <StarRating value={f.rating} readOnly size="h-3.5 w-3.5" />
        </div>
      ))}
    </div>
  );
}

function AdminFeedback({ drivers, feedbackRecords, onOpenDriver }) {
  const [query, setQuery] = useState("");
  const [driverFilter, setDriverFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return feedbackRecords.filter((f) => {
      const d = drivers.find((x) => x.id === f.driverId);
      const matchesDriver = driverFilter === "All" || f.driverId === driverFilter;
      const matchesRating = ratingFilter === "All" || f.rating === Number(ratingFilter);
      const matchesQuery =
        !q ||
        (d?.name || "").toLowerCase().includes(q) ||
        f.passengerName.toLowerCase().includes(q) ||
        f.vehiclePlate.toLowerCase().includes(q) ||
        f.requestId.toLowerCase().includes(q) ||
        f.date.toLowerCase().includes(q) ||
        f.comment.toLowerCase().includes(q);
      return matchesDriver && matchesRating && matchesQuery;
    });
  }, [feedbackRecords, drivers, query, driverFilter, ratingFilter]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <PageHeader title="Feedback Review" subtitle="All passenger feedback submitted across drivers." />
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by passenger, driver, plate, request or comment"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} className="rounded-lg border border-slate-200 text-sm py-2.5 px-2 focus:outline-none">
              <option value="All">All Drivers</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="rounded-lg border border-slate-200 text-sm py-2.5 px-2 focus:outline-none">
              <option value="All">All Ratings</option>
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Star{r > 1 ? "s" : ""}</option>)}
            </select>
          </div>
          <Button variant="outline" onClick={() => exportToCSV(filtered, FEEDBACK_EXPORT_COLUMNS, "feedback.csv", { drivers })} className="ml-auto">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </Card>
      <Card className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <EmptyState title="No feedback matches" subtitle="Try adjusting your filters or search." icon={MessageSquare} />
        ) : (
          filtered.map((f) => {
            const d = drivers.find((x) => x.id === f.driverId);
            return (
              <button key={f.id} onClick={() => setSelected(f)} className="w-full flex items-start gap-4 p-5 text-left hover:bg-slate-50">
                <Avatar name={d?.name || "?"} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-medium text-slate-900">{d?.name}</p>
                    <StarRating value={f.rating} readOnly size="h-4 w-4" />
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{f.comment}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {f.commentTags.map((tag) => {
                      const t = findTag(tag);
                      return t ? <Badge key={tag} tone={tagTone(f.rating)} className="!text-[10px] !px-2 !py-0.5">{t.label}</Badge> : null;
                    })}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-2">{f.passengerName} · {f.vehiclePlate} · {f.requestId} · {f.date}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 mt-1 shrink-0" />
              </button>
            );
          })
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Feedback Detail">
        {selected && (() => {
          const d = drivers.find((x) => x.id === selected.driverId);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={d?.name || "?"} />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{d?.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{selected.driverId}</p>
                </div>
                <StarRating value={selected.rating} readOnly size="h-4 w-4" />
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-700">{selected.comment}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selected.commentTags.map((tag) => {
                  const t = findTag(tag);
                  return t ? <Badge key={tag} tone={tagTone(selected.rating)}>{t.label}</Badge> : null;
                })}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Passenger</p>
                  <p className="text-slate-900 mt-0.5">{selected.passengerName}</p>
                  <p className="text-xs text-slate-500 font-mono">{selected.passengerId}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Vehicle</p>
                  <p className="text-slate-900 mt-0.5 font-mono">{selected.vehiclePlate}</p>
                  <p className="text-xs text-slate-500 font-mono">{selected.vehicleId}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Request</p>
                  <p className="text-slate-900 mt-0.5 font-mono">{selected.requestId}</p>
                  <p className="text-xs text-slate-500">{selected.department}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Date</p>
                  <p className="text-slate-900 mt-0.5">{selected.date}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => { setSelected(null); onOpenDriver(selected.driverId); }}>View Driver</Button>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

function AdminSettings({ notify, weights, passMarks, onUpdateWeights, onUpdatePassMarks, onReset }) {
  const [localWeights, setLocalWeights] = useState(weights);
  const [localPassMarks, setLocalPassMarks] = useState(passMarks);
  const [saved, setSaved] = useState(false);

  const totalWeight = Object.values(localWeights).reduce((s, v) => s + v, 0);
  const weightsValid = Math.abs(totalWeight - 1) < 0.001;

  function handleSave() {
    onUpdateWeights(localWeights);
    onUpdatePassMarks(localPassMarks);
    setSaved(true);
    notify("Settings saved.", "success");
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configuration for scoring, permissions and certification rules.</p>
      </div>
      <Card className="p-5 space-y-4">
        <SectionLabel>Scoring Weights</SectionLabel>
        <p className="text-xs text-slate-400">Adjust the weight of each category in the overall score calculation. Weights must total 100%.</p>
        {Object.entries(localWeights).map(([k, v]) => (
          <div key={k} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
            <span className="capitalize text-sm text-slate-600 w-32">{k}</span>
            <input type="number" min={0} max={1} step={0.05} value={v}
              onChange={(e) => setLocalWeights((w) => ({ ...w, [k]: Number(e.target.value) }))}
              className="w-20 rounded-lg border border-slate-200 text-sm py-1.5 px-2 font-mono text-right focus:outline-none focus:ring-2 focus:ring-slate-300" />
            <span className="text-sm text-slate-400">({Math.round(v * 100)}%)</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-sm text-slate-500">Total:</span>
          <span className={cx("text-sm font-mono font-medium", weightsValid ? "text-emerald-600" : "text-rose-600")}>{Math.round(totalWeight * 100)}%</span>
          {!weightsValid && <span className="text-xs text-rose-500">— must equal 100%</span>}
        </div>
      </Card>
      <Card className="p-5">
        <SectionLabel>Certification Pass Marks</SectionLabel>
        <p className="text-xs text-slate-400 mb-3">Minimum overall score (%) required to hold each certification level.</p>
        <div className="grid grid-cols-5 gap-3">
          {CERT_LEVELS.map((l) => (
            <div key={l} className="text-center rounded-lg bg-slate-50 py-3 px-2">
              <p className="text-xs text-slate-400">{l}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <input type="number" min={0} max={100} value={localPassMarks[l]}
                  onChange={(e) => setLocalPassMarks((p) => ({ ...p, [l]: Number(e.target.value) }))}
                  className="w-14 rounded border border-slate-200 text-sm py-1 text-center font-mono focus:outline-none focus:ring-2 focus:ring-slate-300" />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5 space-y-3">
        <SectionLabel>Rules (TBD)</SectionLabel>
        <div className="divide-y divide-slate-100 text-sm">
          <div className="flex items-center justify-between py-3">
            <span className="text-slate-600">Driver ranking period</span>
            <span className="font-mono text-xs text-slate-400">To be confirmed</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-slate-600">Passenger booking window</span>
            <span className="font-mono text-xs text-slate-400">To be confirmed</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-slate-600">Off-duty hours / rest policy</span>
            <span className="font-mono text-xs text-slate-400">To be confirmed</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-slate-600">Penalty &amp; appeal rules</span>
            <span className="font-mono text-xs text-slate-400">To be confirmed</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-slate-600">Admin permission levels</span>
            <span className="font-mono text-xs text-slate-400">To be confirmed</span>
          </div>
        </div>
      </Card>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={!weightsValid}><Save className="h-4 w-4" /> Save Settings</Button>
        {saved && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>}
        <div className="flex-1" />
        <Button variant="outline" onClick={() => { if (confirm("Reset all demo data to defaults? This will clear your saved state.")) onReset(); }} className="text-rose-600 border-rose-200 hover:bg-rose-50">
          <RefreshCw className="h-4 w-4" /> Reset Demo
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   ADMIN — TRANSPORT REQUESTS (list + detail + assignment)
   ------------------------------------------------------------------------- */

function TransportRequestsList({ transportRequests, drivers, onOpen }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statuses = ["All", "PENDING", "ASSIGNED", "QR_PENDING", "PICK_UP_SCANNED", "IN_PROGRESS", "DROP_OFF_SCANNED", "FEEDBACK_SUBMITTED"];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = transportRequests.filter((r) =>
      (statusFilter === "All" || r.status === statusFilter) &&
      (
        r.id.toLowerCase().includes(q) ||
        r.passengerName.toLowerCase().includes(q) ||
        r.passengerId.toLowerCase().includes(q) ||
        r.pickup.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        (r.vehiclePlate && r.vehiclePlate.toLowerCase().includes(q))
      )
    );
    return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [transportRequests, query, statusFilter]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <PageHeader title="Transport Requests" subtitle="Review, assign and track passenger transport requests." />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by ID, passenger, trip or plate"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 text-sm py-2.5 px-2 focus:outline-none">
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Button variant="outline" onClick={() => exportToCSV(filtered, REQUEST_EXPORT_COLUMNS, "transport-requests.csv")} className="ml-auto">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="No transport requests" subtitle="Try adjusting your search or status filter." icon={ClipboardList} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Request</th>
                  <th className="px-5 py-3 font-medium">Passenger</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Trip</th>
                  <th className="px-5 py-3 font-medium">Schedule</th>
                  <th className="px-5 py-3 font-medium">Driver / Vehicle</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.passengerName} size="h-8 w-8" />
                        <div>
                          <p className="font-medium text-slate-900">{r.id}</p>
                          <p className="text-xs text-slate-400">{r.createdAt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{r.passengerName}</p>
                      <p className="text-xs text-slate-400 font-mono">{r.passengerId}</p>
                    </td>
                    <td className="px-5 py-3"><Badge tone="navy">{r.department}</Badge></td>
                    <td className="px-5 py-3 text-slate-600">
                      <p>{r.pickup}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Navigation className="h-3 w-3" /> {r.destination}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <p>{r.date}</p>
                      <p className="text-xs text-slate-400">{r.time}</p>
                    </td>
                    <td className="px-5 py-3">
                      {r.driverName ? (
                        <div>
                          <p className="text-slate-900">{r.driverName}</p>
                          <p className="text-xs font-mono text-slate-400">{r.vehiclePlate}</p>
                        </div>
                      ) : <span className="text-xs text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3"><TransportStatusBadge status={r.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => onOpen(r.id)} className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function AssignModal({ open, onClose, drivers, vehicles, driverId, vehicleId, onDriverChange, onVehicleChange, onConfirm }) {
  return (
    <Modal open={open} onClose={onClose} title="Assign Driver & Vehicle">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-500">Driver</label>
          <select value={driverId} onChange={(e) => onDriverChange(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300">
            <option value="">Select a driver…</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name} · {d.id} · Level {d.level} · {d.rating.toFixed(1)} ★</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Vehicle</label>
          <select value={vehicleId} onChange={(e) => onVehicleChange(e.target.value)}
            className="w-full mt-1 rounded-lg border border-slate-200 text-sm py-2.5 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300">
            <option value="">Select a vehicle…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.make} {v.model} · {v.plate}</option>
            ))}
          </select>
        </div>
        <Button className="w-full" onClick={onConfirm} disabled={!driverId || !vehicleId}>
          <UserCheck className="h-4 w-4" /> Assign
        </Button>
        <p className="text-[11px] text-slate-400">Assignment notifies the driver and passenger, and moves the request to Assigned.</p>
      </div>
    </Modal>
  );
}

function TransportRequestDetail({ request, drivers, vehicles, feedbackRecords, onBack, onAssign }) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [driverId, setDriverId] = useState(request.driverId || "");
  const [vehicleId, setVehicleId] = useState(request.vehicleId || "");

  const feedback = feedbackRecords.find((f) => f.requestId === request.id);
  const activeDrivers = drivers.filter((d) => d.status === "Active");
  const activeVehicles = vehicles.filter((v) => v.status === "Active");
  const assigned = !!request.driverId;

  const steps = ["PENDING", "ASSIGNED", "QR_PENDING", "PICK_UP_SCANNED", "IN_PROGRESS", "DROP_OFF_SCANNED", "FEEDBACK_SUBMITTED"];
  const currentIdx = steps.indexOf(request.status);

  function handleAssign() {
    if (!driverId || !vehicleId) return;
    onAssign(driverId, vehicleId);
    setAssignOpen(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <TopBar title={request.id} subtitle={`Created ${request.createdAt}`} onBack={onBack}
        right={<TransportStatusBadge status={request.status} />} />

      <div className="p-4 sm:p-6 space-y-5">
        <Card className="p-5">
          <SectionLabel>Request Status</SectionLabel>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1">
            {steps.map((s, i) => {
              const cfg = TRANSPORT_STATUS_STYLES[s];
              const done = i <= currentIdx;
              const current = i === currentIdx;
              return (
                <div key={s} className="flex items-center shrink-0">
                  {i > 0 && <div className={cx("h-0.5 w-6 sm:w-10", done ? "bg-emerald-400" : "bg-slate-200")} />}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={cx("h-6 w-6 rounded-full flex items-center justify-center border-2",
                      done ? (current ? "bg-emerald-600 border-emerald-600" : "bg-emerald-500 border-emerald-500") : "border-slate-200 bg-white")}>
                      {done ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                    </div>
                    <span className={cx("text-[10px] whitespace-nowrap", done ? "text-slate-700" : "text-slate-400")}>{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <SectionLabel>Passenger</SectionLabel>
          <div className="flex items-center gap-4">
            <Avatar name={request.passengerName} size="h-12 w-12" />
            <div>
              <p className="font-semibold text-slate-900">{request.passengerName}</p>
              <p className="text-xs text-slate-400 font-mono">{request.passengerId} · {request.department}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionLabel>Trip Details</SectionLabel>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><MapPin className="h-4 w-4 text-slate-500" /></div>
              <div>
                <p className="text-xs text-slate-400">Pick Up</p>
                <p className="text-sm font-medium text-slate-900">{request.pickup}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Navigation className="h-4 w-4 text-slate-500" /></div>
              <div>
                <p className="text-xs text-slate-400">Destination</p>
                <p className="text-sm font-medium text-slate-900">{request.destination}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><CalendarDays className="h-4 w-4 text-slate-500" /></div>
              <div>
                <p className="text-xs text-slate-400">Date</p>
                <p className="text-sm font-medium text-slate-900">{request.date}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Clock className="h-4 w-4 text-slate-500" /></div>
              <div>
                <p className="text-xs text-slate-400">Time</p>
                <p className="text-sm font-medium text-slate-900">{request.time}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <SectionLabel>Assignment</SectionLabel>
            {!assigned && <Button onClick={() => setAssignOpen(true)}><UserCheck className="h-4 w-4" /> Assign Driver & Vehicle</Button>}
          </div>
          {assigned ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex gap-3 items-center">
                <Avatar name={request.driverName} size="h-10 w-10" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{request.driverName}</p>
                  <p className="text-xs text-slate-400 font-mono">{request.driverId}</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center"><Car className="h-4 w-4 text-slate-500" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{request.vehiclePlate}</p>
                  <p className="text-xs text-slate-400 font-mono">{request.vehicleId}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No driver assigned yet. Assign a driver and vehicle to start this request.</p>
          )}
        </Card>

        <Card className="p-5">
          <SectionLabel>QR Verification</SectionLabel>
          <div className="flex items-center gap-3">
            <div className={cx("h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
              request.qrScanStatus ? "bg-emerald-100" : "bg-slate-100")}>
              <QrCode className={cx("h-5 w-5", request.qrScanStatus ? "text-emerald-600" : "text-slate-400")} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {request.qrScanStatus === "PICK_UP_SCANNED" ? "Pick Up QR Scanned" :
                 request.qrScanStatus === "DROP_OFF_SCANNED" ? "Drop Off QR Scanned" :
                 request.qrScanStatus === "QR_PENDING" ? "Awaiting passenger QR scan" :
                 "No QR scan recorded yet"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Vehicle QR is bound to the car plate and confirmed at pick-up and drop-off.</p>
            </div>
          </div>
        </Card>

        {request.feedbackStatus === "SUBMITTED" && feedback && (
          <Card className="p-5">
            <SectionLabel>Passenger Feedback</SectionLabel>
            <div className="flex items-center gap-1 mb-2"><StarRating value={feedback.rating} readOnly size="h-4 w-4" /></div>
            <p className="text-sm text-slate-700">{feedback.comment}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {feedback.commentTags.map((tag) => {
                const t = findTag(tag);
                return t ? <Badge key={tag} tone={tagTone(feedback.rating)}>{t.label}</Badge> : null;
              })}
            </div>
          </Card>
        )}
      </div>

      <AssignModal open={assignOpen} onClose={() => setAssignOpen(false)}
        drivers={activeDrivers} vehicles={activeVehicles}
        driverId={driverId} vehicleId={vehicleId}
        onDriverChange={setDriverId} onVehicleChange={setVehicleId}
        onConfirm={handleAssign} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   ADMIN — VEHICLES (fleet + permanent vehicle QR)
   ------------------------------------------------------------------------- */

function VehiclesList({ vehicles, drivers, onOpen, onAddVehicle }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState("plate");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = vehicles.filter((v) =>
      (statusFilter === "All" || v.status === statusFilter) &&
      (
        v.plate.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q)
      )
    );
    list = [...list].sort((a, b) => {
      if (sortKey === "plate") return a.plate.localeCompare(b.plate);
      if (sortKey === "make") return a.make.localeCompare(b.make);
      if (sortKey === "year") return b.year - a.year;
      return 0;
    });
    return list;
  }, [vehicles, query, statusFilter, sortKey]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <PageHeader title="Vehicles" subtitle="PCCP fleet. One car number = one unique, permanent QR."
        actions={<Button variant="accent" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Vehicle</Button>} />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by plate, make or model"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 text-sm py-2.5 px-2 focus:outline-none">
              {["All", "Active", "Maintenance", "Retired"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="rounded-lg border border-slate-200 text-sm py-2.5 px-2 focus:outline-none">
              <option value="plate">Sort: Plate</option>
              <option value="make">Sort: Make</option>
              <option value="year">Sort: Year</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="No vehicles found" subtitle="Try adjusting your search or filter." icon={Car} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Plate</th>
                  <th className="px-5 py-3 font-medium">QR</th>
                  <th className="px-5 py-3 font-medium">Driver</th>
                  <th className="px-5 py-3 font-medium">Year</th>
                  <th className="px-5 py-3 font-medium">Color</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onOpen(v.id)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center"><Car className="h-4 w-4 text-slate-500" /></div>
                        <span className="font-medium text-slate-900">{v.make} {v.model}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-700">{v.plate}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{v.qrValue}</td>
                    <td className="px-5 py-3">
                      {(() => { const drv = drivers.find((d) => d.currentVehicle === v.plate); return drv ? (
                        <div className="flex items-center gap-2"><Avatar name={drv.name} size="h-6 w-6" /><span className="text-sm text-slate-700">{drv.name}</span></div>
                      ) : <span className="text-xs text-slate-400">Unassigned</span>; })()}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{v.year}</td>
                    <td className="px-5 py-3 text-slate-600">{v.color}</td>
                    <td className="px-5 py-3">
                      {v.status === "Active" ? <Badge tone="emerald" icon={CheckCircle2}>Active</Badge>
                        : v.status === "Maintenance" ? <Badge tone="amber" icon={AlertTriangle}>Maintenance</Badge>
                        : <Badge tone="slate" icon={XCircle}>Retired</Badge>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={(e) => { e.stopPropagation(); onOpen(v.id); }} className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddVehicleModal open={addOpen} onClose={() => setAddOpen(false)} onSave={onAddVehicle} />
    </div>
  );
}

function AddVehicleModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ make: "", model: "", plate: "", year: new Date().getFullYear(), color: "" });
  const [errors, setErrors] = useState({});

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleSave() {
    const errs = {};
    if (!form.make.trim()) errs.make = "Make is required.";
    if (!form.model.trim()) errs.model = "Model is required.";
    if (!form.plate.trim()) errs.plate = "Plate is required.";
    if (!form.year || Number(form.year) < 1990 || Number(form.year) > 2030) errs.year = "Enter a valid year.";
    if (!form.color.trim()) errs.color = "Color is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ ...form, year: Number(form.year) });
    setForm({ make: "", model: "", plate: "", year: new Date().getFullYear(), color: "" });
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Vehicle">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Make *</label>
            <input value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="e.g. Toyota"
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.make ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.make && <p className="text-xs text-rose-600 mt-1">{errors.make}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Model *</label>
            <input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. Alphard"
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.model ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.model && <p className="text-xs text-rose-600 mt-1">{errors.model}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Plate / Car Number *</label>
            <input value={form.plate} onChange={(e) => set("plate", e.target.value.toUpperCase())} placeholder="e.g. YGN-0000"
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2",
                errors.plate ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.plate && <p className="text-xs text-rose-600 mt-1">{errors.plate}</p>}
            {!errors.plate && <p className="text-[11px] text-slate-400 mt-1">The QR code will be bound to this plate permanently.</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Year *</label>
            <input value={form.year} onChange={(e) => set("year", e.target.value)} type="number" min={1990} max={2030}
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.year ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.year && <p className="text-xs text-rose-600 mt-1">{errors.year}</p>}
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500">Color *</label>
            <input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="e.g. White"
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.color ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.color && <p className="text-xs text-rose-600 mt-1">{errors.color}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><Plus className="h-4 w-4" /> Add Vehicle</Button>
        </div>
      </div>
    </Modal>
  );
}

function EditVehicleModal({ open, onClose, onSave, vehicle }) {
  const [form, setForm] = useState({ make: "", model: "", year: "", color: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (vehicle) setForm({ make: vehicle.make || "", model: vehicle.model || "", year: vehicle.year || "", color: vehicle.color || "" });
  }, [vehicle]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleSave() {
    const errs = {};
    if (!form.make.trim()) errs.make = "Make is required.";
    if (!form.model.trim()) errs.model = "Model is required.";
    if (!form.year || Number(form.year) < 1990 || Number(form.year) > 2030) errs.year = "Enter a valid year.";
    if (!form.color.trim()) errs.color = "Color is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ make: form.make.trim(), model: form.model.trim(), year: Number(form.year), color: form.color.trim() });
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit Vehicle — ${vehicle?.plate || ""}`}>
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 px-4 py-3 flex items-center gap-3">
          <QrCode className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-900 font-mono">{vehicle?.plate}</p>
            <p className="text-xs text-slate-400">QR is permanently bound to this plate</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Make *</label>
            <input value={form.make} onChange={(e) => set("make", e.target.value)}
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.make ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.make && <p className="text-xs text-rose-600 mt-1">{errors.make}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Model *</label>
            <input value={form.model} onChange={(e) => set("model", e.target.value)}
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.model ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.model && <p className="text-xs text-rose-600 mt-1">{errors.model}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Year *</label>
            <input value={form.year} onChange={(e) => set("year", e.target.value)} type="number" min={1990} max={2030}
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.year ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.year && <p className="text-xs text-rose-600 mt-1">{errors.year}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Color *</label>
            <input value={form.color} onChange={(e) => set("color", e.target.value)}
              className={cx("w-full mt-1 rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                errors.color ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
            {errors.color && <p className="text-xs text-rose-600 mt-1">{errors.color}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><CheckCircle2 className="h-4 w-4" /> Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
}

function VehicleDetail({ vehicle, drivers, onBack, vehicleCheckins, onUpdate, onDelete, notify }) {
  const [confirmStatus, setConfirmStatus] = useState(null); // 'maintenance' | 'active' | 'retire' | 'delete' | null
  const [editOpen, setEditOpen] = useState(false);
  const checkins = vehicleCheckins.filter((c) => c.vehicleId === vehicle.id);
  const assignedDriver = drivers.find((d) => d.currentVehicle === vehicle.plate);
  const vehicleStatusTone = vehicle.status === "Active" ? "emerald" : vehicle.status === "Maintenance" ? "amber" : "slate";

  function changeStatus(status) {
    onUpdate({ status });
    notify(`Vehicle ${vehicle.plate} set to ${status}.`, "success");
    setConfirmStatus(null);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <TopBar title={`${vehicle.make} ${vehicle.model}`} subtitle={`${vehicle.plate} · ${vehicle.id}`} onBack={onBack}
        right={<div className="flex items-center gap-2 flex-wrap">
          <Badge tone={vehicleStatusTone}>{vehicle.status}</Badge>
          <button onClick={() => setEditOpen(true)} className="text-xs font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"><Pencil className="h-3.5 w-3.5" /> Edit</button>
          {vehicle.status !== "Maintenance" && (
            <button onClick={() => setConfirmStatus("maintenance")} className="text-xs font-medium text-amber-700 hover:text-amber-900 inline-flex items-center gap-1"><Wrench className="h-3.5 w-3.5" /> Maintenance</button>
          )}
          {vehicle.status !== "Active" && vehicle.status !== "Retired" && (
            <button onClick={() => setConfirmStatus("active")} className="text-xs font-medium text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Set Active</button>
          )}
          {vehicle.status !== "Retired" && (
            <button onClick={() => setConfirmStatus("retire")} className="text-xs font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><Ban className="h-3.5 w-3.5" /> Retire</button>
          )}
          <button onClick={() => setConfirmStatus("delete")} className="text-xs font-medium text-rose-600 hover:text-rose-800 inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
        </div>} />

      <div className="p-4 sm:p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <Card className="p-5">
            <SectionLabel>Vehicle Information</SectionLabel>
            <dl className="grid grid-cols-2 gap-4">
              {[
                { label: "Make", value: vehicle.make },
                { label: "Model", value: vehicle.model },
                { label: "Year", value: vehicle.year },
                { label: "Color", value: vehicle.color },
                { label: "Plate", value: vehicle.plate, mono: true },
                { label: "Status", value: vehicle.status },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-xs text-slate-400">{row.label}</dt>
                  <dd className={cx("text-sm font-medium text-slate-900 mt-0.5", row.mono && "font-mono")}>{row.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="p-5 flex flex-col items-center justify-center text-center">
            <SectionLabel>Vehicle QR · Permanent</SectionLabel>
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-4">
              <QRCodeSVG value={vehicle.qrValue} size={140} />
            </div>
            <p className="text-sm font-mono text-slate-900 mt-3">{vehicle.qrValue}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">This QR is bound permanently to car number {vehicle.plate}. Passengers and drivers scan it for pick-up, drop-off and check-in verification.</p>
          </Card>
        </div>

        <Card className="p-5">
          <SectionLabel>Assigned Driver</SectionLabel>
          {assignedDriver ? (
            <div className="flex items-center gap-4">
              <Avatar name={assignedDriver.name} size="h-12 w-12" />
              <div>
                <p className="font-semibold text-slate-900">{assignedDriver.name}</p>
                <p className="text-xs text-slate-400 font-mono">{assignedDriver.id} · Level {assignedDriver.level}</p>
              </div>
              <div className="ml-auto"><CertBadge status={assignedDriver.certStatus} /></div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No driver is currently assigned to this vehicle.</p>
          )}
        </Card>

        <Card className="p-5">
          <SectionLabel>Driver History</SectionLabel>
          {(() => {
            const driverMap = new Map();
            checkins.forEach((c) => {
              if (!driverMap.has(c.driverId)) driverMap.set(c.driverId, { id: c.driverId, name: c.driverName, count: 0 });
              driverMap.get(c.driverId).count++;
            });
            const history = [...driverMap.values()];
            return history.length === 0 ? (
              <p className="text-sm text-slate-400 mt-2">No driver history for this vehicle yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 py-3">
                    <Avatar name={h.name} size="h-9 w-9" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{h.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{h.id}</p>
                    </div>
                    <Badge tone="slate">{h.count} trip{h.count !== 1 ? "s" : ""}</Badge>
                  </div>
                ))}
              </div>
            );
          })()}
        </Card>

        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-900">Check-in / Check-out History</h2></div>
          {checkins.length === 0 ? (
            <EmptyState title="No check-in records" subtitle="Driver operational records for this vehicle will appear here." icon={ListChecks} />
          ) : (
            <div className="divide-y divide-slate-100">
              {checkins.map((c) => (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.driverName} size="h-7 w-7" />
                      <p className="text-sm font-medium text-slate-900">{c.driverName}</p>
                    </div>
                    <Badge tone={c.status === "CHECKED_OUT" ? "emerald" : "amber"} icon={c.status === "CHECKED_OUT" ? CheckCircle2 : Clock}>
                      {c.status === "CHECKED_OUT" ? "Checked Out" : "Checked In"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{c.requestId}</p>
                  <div className="grid sm:grid-cols-2 gap-2 mt-3 text-sm">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Check In</p>
                      <p className="text-slate-900 mt-0.5">{c.checkInLocation} · {c.checkInTime}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.checkInRemark}</p>
                    </div>
                    {c.checkOutLocation ? (
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Check Out</p>
                        <p className="text-slate-900 mt-0.5">{c.checkOutLocation} · {c.checkOutTime}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{c.checkOutRemark}</p>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-amber-50 p-3 flex items-center justify-center">
                        <p className="text-xs text-amber-700 font-medium">Awaiting check-out</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={!!confirmStatus}
        onClose={() => setConfirmStatus(null)}
        onConfirm={() => changeStatus(confirmStatus === "maintenance" ? "Maintenance" : confirmStatus === "active" ? "Active" : "Retired")}
        title={confirmStatus === "maintenance" ? "Set vehicle to Maintenance?" : confirmStatus === "active" ? "Set vehicle to Active?" : "Retire this vehicle?"}
        message={
          confirmStatus === "maintenance"
            ? `Mark ${vehicle.plate} as under maintenance. It will be excluded from new assignments while unavailable.`
            : confirmStatus === "active"
              ? `Mark ${vehicle.plate} as Active. It becomes available for driver and transport assignments again.`
              : `Permanently retire ${vehicle.plate}. Retired vehicles are removed from assignment options but their QR and records are preserved.`
        }
        confirmLabel={confirmStatus === "maintenance" ? "Set Maintenance" : confirmStatus === "active" ? "Set Active" : "Retire"}
        tone={confirmStatus === "retire" ? "danger" : "primary"}
      />

      {/* Delete vehicle */}
      <Modal open={confirmStatus === "delete"} onClose={() => setConfirmStatus(null)} title="Delete Vehicle?">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">This will permanently remove <strong>{vehicle.plate}</strong> ({vehicle.make} {vehicle.model}) from the system. All QR bindings and records will be preserved but the vehicle will no longer appear in management lists.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmStatus(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { onDelete(vehicle.id); notify(`Vehicle ${vehicle.plate} deleted.`, "success"); }}>Delete Vehicle</Button>
          </div>
        </div>
      </Modal>

      <EditVehicleModal open={editOpen} onClose={() => setEditOpen(false)} vehicle={vehicle}
        onSave={(patch) => { onUpdate(patch); setEditOpen(false); notify("Vehicle updated.", "success"); }} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   ADMIN — ASSESSMENTS, OPERATIONAL RECORDS, NOTIFICATIONS
   ------------------------------------------------------------------------- */

function AdminAssessments({ drivers, onOpenDriver }) {
  const [tab, setTab] = useState("summary"); // summary | scores

  const certified = drivers.filter((d) => d.certStatus === "Certified").length;
  const pending = drivers.filter((d) => d.certStatus === "Pending").length;
  const avgScore = drivers.length ? Math.round((drivers.reduce((s, d) => s + d.score, 0) / drivers.length) * 10) / 10 : 0;
  const topPerformers = [...drivers].sort((a, b) => b.score - a.score).slice(0, 5);

  const buckets = [
    { label: "0 – 59", min: 0, max: 59 },
    { label: "60 – 69", min: 60, max: 69 },
    { label: "70 – 79", min: 70, max: 79 },
    { label: "80 – 89", min: 80, max: 89 },
    { label: "90 – 100", min: 90, max: 100 },
  ].map((b) => ({ ...b, count: drivers.filter((d) => d.score >= b.min && d.score <= b.max).length }));
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <PageHeader title="Assessments" subtitle="Driver assessment scores and certification eligibility." />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {["summary", "scores"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cx("rounded-md px-4 py-1.5 text-sm font-medium capitalize", tab === t ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800")}>
              {t === "summary" ? "Summary" : "All Scores"}
            </button>
          ))}
        </div>
        {tab === "scores" && (
          <Button variant="outline" onClick={() => exportToCSV(drivers, ASSESSMENT_EXPORT_COLUMNS, "assessments.csv")}>
            <Download className="h-4 w-4" /> Export
          </Button>
        )}
      </div>

      {tab === "summary" ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Total Drivers" value={drivers.length} icon={Users} />
            <KPICard label="Certified" value={certified} icon={Award} tone="emerald" />
            <KPICard label="Pending" value={pending} icon={Clock} tone="amber" />
            <KPICard label="Average Score" value={avgScore} suffix="%" icon={TrendingUp} tone="sky" />
          </div>

          <Card className="p-5">
            <SectionLabel>By Certification Level</SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
              {CERT_LEVELS.map((l) => {
                const levelDrivers = drivers.filter((d) => d.level === l);
                const lAvg = levelDrivers.length ? Math.round((levelDrivers.reduce((s, d) => s + d.score, 0) / levelDrivers.length) * 10) / 10 : 0;
                return (
                  <div key={l} className="rounded-lg bg-slate-50 p-4 text-center">
                    <p className="text-xs font-semibold tracking-widest text-slate-400">{l}</p>
                    <p className="text-xl font-semibold text-slate-900 mt-1">{levelDrivers.length}</p>
                    <p className="text-xs text-slate-400 mt-1">avg {lAvg}%</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Top Performers</SectionLabel>
            <div className="space-y-2 mt-2">
              {topPerformers.map((d, i) => (
                <button key={d.id} onClick={() => onOpenDriver(d.id)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-left">
                  <span className={cx("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0", i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-50 text-slate-400")}>#{i + 1}</span>
                  <Avatar name={d.name} size="h-8 w-8" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{d.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{d.id} · Level {d.level}</p>
                  </div>
                  <span className="font-mono font-semibold text-slate-900">{d.score}%</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Score Distribution</SectionLabel>
            <div className="space-y-2.5 mt-3">
              {buckets.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-16 shrink-0">{b.label}</span>
                  <div className="flex-1 h-5 rounded-md bg-slate-100 overflow-hidden">
                    <div className="h-full bg-slate-800 rounded-md" style={{ width: `${(b.count / maxBucket) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-slate-600 w-6 text-right">{b.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                    <th className="px-5 py-3 font-medium">Driver</th>
                    <th className="px-5 py-3 font-medium">Written</th>
                    <th className="px-5 py-3 font-medium">Practical</th>
                    <th className="px-5 py-3 font-medium">Operational</th>
                    <th className="px-5 py-3 font-medium">Feedback</th>
                    <th className="px-5 py-3 font-medium">Overall</th>
                    <th className="px-5 py-3 font-medium">Level</th>
                    <th className="px-5 py-3 font-medium">Certification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drivers.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onOpenDriver(d.id)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={d.name} size="h-8 w-8" />
                          <div>
                            <p className="font-medium text-slate-900">{d.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{d.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-700">{d.assessment.written}</td>
                      <td className="px-5 py-3 font-mono text-slate-700">{d.assessment.practical}</td>
                      <td className="px-5 py-3 font-mono text-slate-700">{d.assessment.operational}</td>
                      <td className="px-5 py-3 font-mono text-slate-700">{d.assessment.feedbackAvg.toFixed(1)}</td>
                      <td className="px-5 py-3"><span className="font-mono font-semibold text-slate-900">{d.score}%</span></td>
                      <td className="px-5 py-3"><Badge tone="navy">Level {d.level}</Badge></td>
                      <td className="px-5 py-3"><CertBadge status={d.certStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-xs text-slate-400">{RANK_WEIGHTING_NOTE}</p>
        </>
      )}
    </div>
  );
}

function OperationalRecords({ vehicleCheckins, drivers, vehicles, transportRequests }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState(null);

  function parseReqDate(dateStr) {
    const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const parts = dateStr.split(" ");
    return parts.length === 3 ? new Date(parseInt(parts[2]), months[parts[1]], parseInt(parts[0])) : null;
  }

  const reqDateMap = useMemo(() => {
    const map = {};
    (transportRequests || []).forEach((r) => { map[r.id] = r.date; });
    return map;
  }, [transportRequests]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return vehicleCheckins.filter((c) => {
      if (statusFilter !== "All" && c.status !== statusFilter) return false;
      if (!q) {} else if (
        !c.id.toLowerCase().includes(q) &&
        !c.driverName.toLowerCase().includes(q) &&
        !c.driverId.toLowerCase().includes(q) &&
        !c.vehiclePlate.toLowerCase().includes(q) &&
        !c.checkInLocation.toLowerCase().includes(q) &&
        !(c.checkOutLocation && c.checkOutLocation.toLowerCase().includes(q))
      ) return false;
      if (dateFrom || dateTo) {
        const reqDate = reqDateMap[c.requestId];
        if (reqDate) {
          const d = parseReqDate(reqDate);
          if (d) {
            if (dateFrom && d < new Date(dateFrom)) return false;
            if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
          }
        }
      }
      return true;
    });
  }, [vehicleCheckins, query, statusFilter, dateFrom, dateTo, reqDateMap]);

  const checkedIn = vehicleCheckins.filter((c) => c.status === "CHECKED_IN").length;
  const checkedOut = vehicleCheckins.filter((c) => c.status === "CHECKED_OUT").length;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <PageHeader title="Operational Records" subtitle="Vehicle check-in and check-out history recorded by drivers." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Records" value={vehicleCheckins.length} icon={ListChecks} />
        <KPICard label="Checked In" value={checkedIn} icon={Clock} tone="amber" />
        <KPICard label="Checked Out" value={checkedOut} icon={CheckCircle2} tone="emerald" />
        <KPICard label="Vehicles Used" value={new Set(vehicleCheckins.map((c) => c.vehicleId)).size} icon={Car} tone="sky" />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by driver, plate or location"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 text-sm py-2.5 px-2 focus:outline-none">
              {["All", "CHECKED_IN", "CHECKED_OUT"].map((s) => <option key={s} value={s}>{s === "All" ? "All statuses" : s === "CHECKED_IN" ? "Checked In" : "Checked Out"}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From"
              className="rounded-lg border border-slate-200 text-sm py-2.5 px-2 focus:outline-none" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To"
              className="rounded-lg border border-slate-200 text-sm py-2.5 px-2 focus:outline-none" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-slate-400 hover:text-slate-700">Clear</button>
            )}
          </div>
          <Button variant="outline" onClick={() => exportToCSV(filtered, CHECKIN_EXPORT_COLUMNS, "operational-records.csv", { drivers })} className="ml-auto">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="No operational records" subtitle="Try adjusting your search or filter." icon={ListChecks} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Record</th>
                  <th className="px-5 py-3 font-medium">Driver</th>
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Check In</th>
                  <th className="px-5 py-3 font-medium">Check Out</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-slate-500">{c.id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={c.driverName} size="h-7 w-7" />
                        <span className="font-medium text-slate-900">{c.driverName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-700">{c.vehiclePlate}</td>
                    <td className="px-5 py-3 text-slate-600">{c.checkInLocation}<p className="text-xs text-slate-400">{c.checkInTime}</p></td>
                    <td className="px-5 py-3 text-slate-600">
                      {c.checkOutLocation ? <>{c.checkOutLocation}<p className="text-xs text-slate-400">{c.checkOutTime}</p></> : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3"><Badge tone={c.status === "CHECKED_OUT" ? "emerald" : "amber"} icon={c.status === "CHECKED_OUT" ? CheckCircle2 : Clock}>{c.status === "CHECKED_OUT" ? "Checked Out" : "Checked In"}</Badge></td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setSelected(c)} className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Operational Record ${selected.id}` : ""}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={selected.driverName} size="h-10 w-10" />
              <div>
                <p className="font-semibold text-slate-900">{selected.driverName}</p>
                <p className="text-xs text-slate-400 font-mono">{selected.driverId} · Vehicle {selected.vehiclePlate} · {selected.requestId}</p>
              </div>
              <div className="ml-auto">
                <Badge tone={selected.status === "CHECKED_OUT" ? "emerald" : "amber"} icon={selected.status === "CHECKED_OUT" ? CheckCircle2 : Clock}>
                  {selected.status === "CHECKED_OUT" ? "Checked Out" : "Checked In"}
                </Badge>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Check In</p>
                <p className="text-slate-900 mt-0.5">{selected.checkInLocation}</p>
                <p className="text-xs text-slate-500">{selected.checkInTime}</p>
                <p className="text-xs text-slate-600 mt-2">{selected.checkInRemark}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Check Out</p>
                {selected.checkOutLocation ? (
                  <>
                    <p className="text-slate-900 mt-0.5">{selected.checkOutLocation}</p>
                    <p className="text-xs text-slate-500">{selected.checkOutTime}</p>
                    <p className="text-xs text-slate-600 mt-2">{selected.checkOutRemark}</p>
                  </>
                ) : (
                  <p className="text-amber-700 text-xs font-medium mt-2">Awaiting check-out</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AdminNotifications({ notifications, markRead, markAllRead, onOpenRequest }) {
  const [filter, setFilter] = useState("All"); // All | Unread
  const adminNotifications = notifications.filter((n) => n.recipientRole === "admin");
  const filtered = filter === "All" ? adminNotifications : adminNotifications.filter((n) => !n.read);
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <PageHeader title="Notifications" subtitle="Admin dispatch and system notifications."
        actions={<Button variant="outline" onClick={markAllRead}><CheckCircle2 className="h-4 w-4" /> Mark All Read</Button>} />
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {["All", "Unread"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cx("rounded-md px-4 py-1.5 text-sm font-medium", filter === f ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800")}>
            {f}{f === "Unread" ? ` (${adminNotifications.filter((n) => !n.read).length})` : ""}
          </button>
        ))}
      </div>
      <Card className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <EmptyState title={filter === "Unread" ? "No unread notifications" : "No notifications"} icon={Bell} />
        ) : (
          filtered.map((n) => (
            <div key={n.id} onClick={() => markRead(n.id)} className={cx("flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50", !n.read && "bg-amber-50/50")}>
              <div className={cx("h-9 w-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                n.recipientRole === "driver" ? "bg-sky-100 text-sky-600" : n.recipientRole === "passenger" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500")}>
                {n.recipientRole === "driver" ? <User className="h-4 w-4" /> : n.recipientRole === "passenger" ? <Car className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <Badge tone={n.read ? "slate" : "amber"}>{n.read ? "Read" : "New"}</Badge>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1.5 capitalize">{n.recipientRole} · {n.recipientId} · {n.timestamp}</p>
                {onOpenRequest && n.relatedRequestId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markRead(n.id); onOpenRequest(n.relatedRequestId); }}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50">
                    <ExternalLink className="h-3.5 w-3.5" /> View Request {n.relatedRequestId}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

/* =========================================================================
   DRIVER APPLICATION (mobile-first)
   ========================================================================= */

function MobileShell({ title, subtitle, onBack, children, nav, active, onNav, onExit, right }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 max-w-md md:max-w-xl lg:max-w-2xl mx-auto border-x border-slate-200">
      <TopBar title={title} subtitle={subtitle} onBack={onBack} right={
        <div className="flex items-center gap-2">
          {right}
          <button onClick={onExit} className="text-xs text-slate-400 hover:text-slate-700">Exit</button>
        </div>
      } />
      <div className="flex-1 overflow-y-auto pb-24">{children}</div>
      <div className="fixed bottom-0 left-0 right-0 max-w-md md:max-w-xl lg:max-w-2xl mx-auto bg-white border-t border-slate-200 flex">
        {nav.map((n) => (
          <button key={n.key} onClick={() => onNav(n.key)} className={cx("flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium", active === n.key ? "text-slate-900" : "text-slate-400")}>
            <n.icon className={cx("h-5 w-5", active === n.key && "text-amber-600")} />
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DriverApp({ drivers, vehicles, transportRequests, notifications, vehicleCheckins, addVehicleCheckIn, updateVehicleCheckIn, markNotificationRead, notify, onExit, userId }) {
  const driver = drivers.find((d) => d.id === userId);
  const [screen, setScreen] = useState("home");
  const [verifyState, setVerifyState] = useState("idle"); // idle | scanning | success | fail
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const myTrips = transportRequests.filter((r) => r.driverId === driver.id);
  const myNotifications = notifications.filter((n) => n.recipientRole === "driver" && n.recipientId === driver.id);
  const activeTrip = myTrips.find((t) => ["ASSIGNED", "QR_PENDING", "PICK_UP_SCANNED", "IN_PROGRESS", "DROP_OFF_SCANNED"].includes(t.status));
  const vehiclePlate = activeTrip ? activeTrip.vehiclePlate : driver.currentVehicle;
  const unreadCount = myNotifications.filter((n) => !n.read).length;
  const selectedRequest = myTrips.find((r) => r.id === selectedRequestId);

  const nav = [
    { key: "home", label: "Home", icon: HomeIcon },
    { key: "trips", label: "Trips", icon: ListChecks },
    { key: "qr", label: "QR", icon: QrCode },
    { key: "profile", label: "Profile", icon: User },
  ];

  const titles = { home: "Driver Home", trips: "My Trips", calendar: "Trip Calendar", tripDetail: "Trip Details", notifications: "Notifications", passport: "Driver Passport", certification: "Certification", qr: "Driver QR Code", profile: "My Profile", verify: "QR Verification", checkIn: "Check In", checkOut: "Check Out" };

  function runScan(valid = true) {
    setScreen("verify");
    setVerifyState("scanning");
    setTimeout(() => setVerifyState(valid ? "success" : "fail"), 1400);
  }

  function openTrip(id) {
    setSelectedRequestId(id);
    setScreen("tripDetail");
  }

  function handleCheckInDone(data) {
    const req = selectedRequest;
    addVehicleCheckIn({
      vehicleId: req.vehicleId, vehiclePlate: req.vehiclePlate,
      driverId: driver.id, driverName: driver.name, requestId: req.id,
      checkInLocation: data.location, checkInTime: DEMO_TIME, checkInRemark: data.remark || "—",
      checkOutLocation: null, checkOutTime: null, checkOutRemark: null, status: "CHECKED_IN",
    });
    notify("Check in recorded.");
    setScreen("tripDetail");
  }

  function handleCheckOutDone(data) {
    updateVehicleCheckIn(selectedRequest.id, {
      checkOutLocation: data.location, checkOutTime: DEMO_TIME, checkOutRemark: data.remark || "—", status: "CHECKED_OUT",
    });
    notify("Check out recorded.");
    setScreen("tripDetail");
  }

  return (
    <MobileShell
      title={titles[screen]} subtitle={screen !== "verify" ? driver.id : undefined}
      onBack={screen === "verify" ? () => { setScreen("qr"); setVerifyState("idle"); } : ["tripDetail", "notifications"].includes(screen) ? () => setScreen("trips") : ["checkIn", "checkOut"].includes(screen) ? () => setScreen("tripDetail") : undefined}
      nav={nav} active={screen === "verify" ? "qr" : ["tripDetail", "notifications"].includes(screen) ? "trips" : ["checkIn", "checkOut"].includes(screen) ? "trips" : screen} onNav={setScreen} onExit={onExit}
      right={<NotificationBell count={unreadCount} onClick={() => setScreen("notifications")} />}
    >
        {screen === "home" && <DriverHome driver={driver} trips={myTrips} onGo={setScreen} onOpenTrip={openTrip} vehicleCheckins={vehicleCheckins} vehicles={vehicles} />}
      {screen === "trips" && <DriverTrips trips={myTrips} onOpen={openTrip} />}
      {screen === "calendar" && <TripCalendar trips={myTrips} onOpen={openTrip} />}
      {screen === "tripDetail" && selectedRequest && (
        <DriverTripDetail request={selectedRequest} onBack={() => setScreen("trips")}
          checkIn={vehicleCheckins.find((c) => c.requestId === selectedRequest.id)}
          onCheckIn={() => setScreen("checkIn")} onCheckOut={() => setScreen("checkOut")} />
      )}
      {screen === "checkIn" && selectedRequest && (
        <VehicleCheckInScreen request={selectedRequest} mode="checkin" vehicles={vehicles}
          onCancel={() => setScreen("tripDetail")} onDone={handleCheckInDone} />
      )}
      {screen === "checkOut" && selectedRequest && (
        <VehicleCheckInScreen request={selectedRequest} mode="checkout" vehicles={vehicles}
          onCancel={() => setScreen("tripDetail")} onDone={handleCheckOutDone} />
      )}
      {screen === "notifications" && (
        <MobileNotifications notifications={myNotifications} onMarkRead={markNotificationRead}
          onOpen={(n) => n.relatedRequestId && openTrip(n.relatedRequestId)} emptyTitle="No notifications" />
      )}
      {screen === "passport" && <div className="p-5"><PassportCard driver={driver} /></div>}
      {screen === "certification" && <DriverCertification driver={driver} />}
      {screen === "qr" && <DriverQR driver={driver} vehiclePlate={vehiclePlate} onScan={runScan} />}
        {screen === "profile" && <DriverProfile driver={driver} trips={myTrips} vehicleCheckins={vehicleCheckins} />}
      {screen === "verify" && <QRVerify driver={driver} state={verifyState} onRetry={() => runScan(true)} onRetryFail={() => runScan(false)} />}
    </MobileShell>
  );
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parseTripDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split(" ");
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = MONTH_NAMES.indexOf(parts[1]);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || month < 0 || isNaN(year)) return null;
  return new Date(year, month, day);
}

function TripCalendar({ trips, onOpen }) {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tripsByDate = useMemo(() => {
    const map = {};
    trips.forEach((t) => {
      const d = parseTripDate(t.date);
      if (d) {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [trips]);

  function getTripsForDay(day) {
    const key = `${year}-${month}-${day}`;
    return tripsByDate[key] || [];
  }

  const selectedTrips = selectedDate != null ? getTripsForDay(selectedDate) : [];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft className="h-5 w-5 text-slate-600" /></button>
        <h2 className="font-semibold text-slate-900">{MONTH_NAMES[month]} {year}</h2>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-slate-100"><ChevronRight className="h-5 w-5 text-slate-600" /></button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-slate-400 py-2">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dayTrips = getTripsForDay(day);
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isSelected = selectedDate === day;
            return (
              <button key={day} onClick={() => setSelectedDate(isSelected ? null : day)}
                className={cx(
                  "relative flex flex-col items-center py-2 rounded-lg text-sm transition",
                  isSelected ? "bg-slate-900 text-white" : isToday ? "bg-amber-50 text-amber-900 font-semibold" : "hover:bg-slate-50 text-slate-700"
                )}>
                {day}
                {dayTrips.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {dayTrips.slice(0, 3).map((_, j) => (
                      <span key={j} className={cx("h-1.5 w-1.5 rounded-full", isSelected ? "bg-white" : "bg-emerald-500")} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {selectedDate != null && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {MONTH_NAMES[month]} {selectedDate}, {year}
            <span className="ml-2 text-xs font-normal text-slate-400">({selectedTrips.length} trip{selectedTrips.length !== 1 ? "s" : ""})</span>
          </h3>
          {selectedTrips.length === 0 ? (
            <Card className="p-4 text-sm text-slate-400 text-center">No trips scheduled for this day.</Card>
          ) : selectedTrips.map((t) => (
            <button key={t.id} onClick={() => onOpen(t.id)} className="w-full">
              <Card className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-medium text-slate-900">{t.id}</p>
                  <TransportStatusBadge status={t.status} />
                </div>
                <p className="text-xs text-slate-400 mt-1">{t.passengerName} · {t.time}</p>
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {t.pickup}</p>
                  <p className="flex items-center gap-2"><Navigation className="h-3.5 w-3.5 text-slate-400" /> {t.destination}</p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DriverTrips({ trips, onOpen }) {
  if (trips.length === 0) {
    return <div className="p-5"><EmptyState title="No trips assigned" subtitle="Transport requests assigned to you will appear here." icon={ListChecks} /></div>;
  }
  return (
    <div className="p-5 space-y-3">
      <div>
        <h2 className="font-semibold text-slate-900">My Trips</h2>
        <p className="text-xs text-slate-400 mt-0.5">{trips.length} assigned transport request(s)</p>
      </div>
      {trips.map((r) => (
        <button key={r.id} onClick={() => onOpen(r.id)} className="w-full">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-sm font-medium text-slate-900">{r.id}</p>
              <TransportStatusBadge status={r.status} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{r.passengerName} · {r.department}</p>
            <div className="mt-3 space-y-1.5 text-sm text-slate-600">
              <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {r.pickup}</p>
              <p className="flex items-center gap-2"><Navigation className="h-3.5 w-3.5 text-slate-400" /> {r.destination}</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400"><CalendarDays className="h-3.5 w-3.5 inline mr-1" />{r.date} · {r.time}</p>
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1">Details <ChevronRight className="h-3.5 w-3.5" /></span>
            </div>
          </Card>
        </button>
      ))}
    </div>
  );
}

function DriverTripDetail({ request, onBack, checkIn, onCheckIn, onCheckOut, actions }) {
  return (
    <div className="p-5 space-y-5">
      <Card className="p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <SectionLabel>Transport Request</SectionLabel>
            <p className="font-mono text-lg font-semibold text-slate-900">{request.id}</p>
          </div>
          <TransportStatusBadge status={request.status} />
        </div>
      </Card>

      <Card className="p-5">
        <SectionLabel>Passenger</SectionLabel>
        <div className="flex items-center gap-3">
          <Avatar name={request.passengerName} size="h-11 w-11" />
          <div>
            <p className="font-medium text-slate-900">{request.passengerName}</p>
            <p className="text-xs text-slate-400 font-mono">{request.passengerId} · {request.department}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <SectionLabel>Trip</SectionLabel>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><MapPin className="h-4 w-4 text-slate-500" /></div>
            <div>
              <p className="text-xs text-slate-400">Pick Up</p>
              <p className="text-sm font-medium text-slate-900">{request.pickup}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Navigation className="h-4 w-4 text-slate-500" /></div>
            <div>
              <p className="text-xs text-slate-400">Destination</p>
              <p className="text-sm font-medium text-slate-900">{request.destination}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><CalendarDays className="h-4 w-4 text-slate-500" /></div>
            <div>
              <p className="text-xs text-slate-400">Schedule</p>
              <p className="text-sm font-medium text-slate-900">{request.date} · {request.time}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <SectionLabel>Vehicle</SectionLabel>
        {request.vehiclePlate ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center"><Car className="h-4 w-4 text-slate-500" /></div>
            <div>
              <p className="font-mono text-sm font-semibold text-slate-900">{request.vehiclePlate}</p>
              <p className="text-xs text-slate-400">{request.vehicleId}</p>
            </div>
          </div>
        ) : <p className="text-sm text-slate-400">No vehicle assigned yet.</p>}
      </Card>

      <Card className="p-5">
        <SectionLabel>QR Verification</SectionLabel>
        <div className="flex items-center gap-3">
          <div className={cx("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", request.qrScanStatus ? "bg-emerald-100" : "bg-slate-100")}>
            <QrCode className={cx("h-5 w-5", request.qrScanStatus ? "text-emerald-600" : "text-slate-400")} />
          </div>
          <p className="text-sm text-slate-600">
            {request.qrScanStatus === "QR_PENDING" ? "Awaiting the passenger to scan the vehicle QR at pick-up."
              : request.qrScanStatus === "PICK_UP_SCANNED" ? "Pick-up confirmed by vehicle QR."
              : request.qrScanStatus === "DROP_OFF_SCANNED" ? "Drop-off confirmed by vehicle QR."
              : "No QR scan recorded yet."}
          </p>
        </div>
      </Card>

      {(onCheckIn || checkIn) && (
        <Card className="p-5">
          <SectionLabel>Vehicle Check-In / Check-Out</SectionLabel>
          {checkIn ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Check In</p>
                <p className="text-sm text-slate-900 mt-0.5">{checkIn.checkInLocation}</p>
                <p className="text-xs text-slate-500">{checkIn.checkInTime}</p>
                <p className="text-xs text-slate-600 mt-1">{checkIn.checkInRemark}</p>
              </div>
              {checkIn.status === "CHECKED_IN" ? (
                <Button className="w-full" onClick={onCheckOut}><ScanLine className="h-4 w-4" /> Scan QR to Check Out</Button>
              ) : (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Check Out</p>
                  <p className="text-sm text-slate-900 mt-0.5">{checkIn.checkOutLocation}</p>
                  <p className="text-xs text-slate-500">{checkIn.checkOutTime}</p>
                  <p className="text-xs text-slate-600 mt-1">{checkIn.checkOutRemark}</p>
                </div>
              )}
            </div>
          ) : (
            <Button className="w-full" onClick={onCheckIn}><ScanLine className="h-4 w-4" /> Scan QR to Check In</Button>
          )}
        </Card>
      )}

      {actions && <div className="space-y-3">{actions}</div>}
    </div>
  );
}

function VehicleCheckInScreen({ request, mode, vehicles, onDone, onCancel }) {
  const [phase, setPhase] = useState("scan"); // scan | form
  const [location, setLocation] = useState(mode === "checkin" ? request.pickup : request.destination);
  const [remark, setRemark] = useState("");
  const isCheckIn = mode === "checkin";
  const vehicle = vehicles.find((v) => v.plate === request.vehiclePlate);
  const inputCls = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300";

  if (phase === "scan") {
    return (
      <VehicleQRScan
        assignedPlate={request.vehiclePlate} vehicleName={vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.color}` : request.vehiclePlate}
        onValid={() => setPhase("form")} onCancel={onCancel}
        title={isCheckIn ? "Scan Vehicle QR — Check In" : "Scan Vehicle QR — Check Out"}
        hint={`Scan the QR on ${request.vehiclePlate} to ${isCheckIn ? "record your check-in" : "complete your check-out"}.`}
      />
    );
  }
  return (
    <div className="p-5 space-y-5">
      <Card className="p-5">
        <SectionLabel>Vehicle</SectionLabel>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center"><Car className="h-5 w-5 text-slate-500" /></div>
          <div>
            <p className="font-mono text-sm font-semibold text-slate-900">{request.vehiclePlate}</p>
            <p className="text-xs text-slate-400">{vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.color}` : request.vehicleId}</p>
          </div>
        </div>
      </Card>
      <div>
        <SectionLabel>{isCheckIn ? "Check In Location" : "Check Out Location"}</SectionLabel>
        <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
      </div>
      <div>
        <SectionLabel>{isCheckIn ? "Check In Time" : "Check Out Time"}</SectionLabel>
        <p className="text-sm font-mono text-slate-900">{DEMO_TIME}</p>
      </div>
      <div>
        <SectionLabel>Remark (optional)</SectionLabel>
        <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} placeholder="e.g. Damage at rear view mirror by previous driver"
          className={cx(inputCls, "resize-none")} />
      </div>
      <Button className="w-full" onClick={() => onDone({ location: location.trim(), remark: remark.trim() })}>
        Submit {isCheckIn ? "Check In" : "Check Out"}
      </Button>
    </div>
  );
}

function MobileNotifications({ notifications, onMarkRead, onOpen, emptyTitle = "No notifications" }) {
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Notifications</h2>
        {notifications.filter((n) => !n.read).length > 0 && <Badge tone="amber">{notifications.filter((n) => !n.read).length} new</Badge>}
      </div>
      {notifications.length === 0 ? (
        <EmptyState title={emptyTitle} subtitle="You're all caught up." icon={Bell} />
      ) : (
        notifications.map((n) => (
          <button key={n.id} onClick={() => { onMarkRead(n.id); onOpen(n); }} className="w-full text-left">
            <Card className={cx("p-4", !n.read && "border-amber-300 bg-amber-50/50")}>
              <div className="flex items-start gap-3">
                <div className={cx("h-9 w-9 rounded-full flex items-center justify-center shrink-0", n.read ? "bg-slate-100 text-slate-400" : "bg-amber-100 text-amber-600")}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    {!n.read && <Badge tone="amber">New</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1.5">{n.timestamp}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 mt-1" />
              </div>
            </Card>
          </button>
        ))
      )}
    </div>
  );
}

function DriverHome({ driver, trips, onGo, onOpenTrip, vehicleCheckins, vehicles }) {
  const assignedVehicle = vehicles.find((v) => v.plate === driver.currentVehicle);
  const activeCheckin = vehicleCheckins.find((c) => c.driverId === driver.id && c.status === "CHECKED_IN");
  const tripCount = trips.length;
  const completedTrips = trips.filter((t) => t.status === "FEEDBACK_SUBMITTED").length;
  return (
    <div className="p-5 space-y-5">
      <Card className="p-5 flex items-center gap-4">
        <Avatar name={driver.name} size="h-14 w-14" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900">{driver.name}</p>
          <p className="text-xs text-slate-400 font-mono">{driver.id}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <CertBadge status={driver.certStatus} />
            <Badge tone="slate">Level {driver.level}</Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 text-center">
        <Card className="p-4">
          <p className="text-2xl font-semibold text-slate-900">{driver.rating.toFixed(1)} ★</p>
          <p className="text-xs text-slate-400 mt-1">Rating</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-semibold text-slate-900">{tripCount}</p>
          <p className="text-xs text-slate-400 mt-1">Total Trips</p>
        </Card>
      </div>

      {assignedVehicle && (
        <Card className="p-5">
          <SectionLabel>Current Vehicle</SectionLabel>
          <div className="flex items-center gap-4 mt-2">
            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Car className="h-6 w-6 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm">{assignedVehicle.plate}</p>
              <p className="text-xs text-slate-400">{assignedVehicle.make} {assignedVehicle.model}</p>
            </div>
            <Badge tone={activeCheckin ? "emerald" : "slate"}>{activeCheckin ? "Checked In" : "Not Checked In"}</Badge>
          </div>
        </Card>
      )}

      <Card className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">{completedTrips} of {tripCount} trips completed</p>
          <p className="text-xs text-slate-400 mt-0.5">Tap to view all trips</p>
        </div>
        <button onClick={() => onGo("trips")} className="text-xs font-medium text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">View Trips</button>
      </Card>

      <div className="space-y-3">
        {activeCheckin ? (
          <QuickCard icon={LogOut} title="Check Out" desc="Record vehicle drop-off" onClick={() => onGo("trips")} />
        ) : assignedVehicle ? (
          <QuickCard icon={ScanLine} title="Check In" desc="Scan vehicle QR to start" onClick={() => onGo("trips")} />
        ) : null}
        <QuickCard icon={CreditCard} title="Driver Passport" desc="Your official professional identity" onClick={() => onGo("passport")} />
        <QuickCard icon={Award} title="Certification" desc={`Level ${driver.level} · ${driver.certStatus}`} onClick={() => onGo("certification")} />
        <QuickCard icon={QrCode} title="QR Code" desc="Scan to verify your identity" onClick={() => onGo("qr")} />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Passenger Feedback QR</SectionLabel>
          <Badge tone="amber" icon={QrCode}>Feedback</Badge>
        </div>
        <p className="text-xs text-slate-400 mb-4">Passengers can scan this QR code to rate your service and provide feedback.</p>
        <div className="flex flex-col items-center bg-white rounded-xl p-4 border border-slate-200">
          <QRCodeSVG
            value="https://forms.gle/AwM49wXGSNYAGD7GA"
            size={160}
            bgColor="#ffffff"
            fgColor="#0f172a"
            level="M"
            includeMargin={false}
          />
          <p className="text-xs text-slate-400 mt-3 font-mono">UAB Academy Feedback Form</p>
        </div>
        <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-slate-50">
          <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="text-[11px] text-slate-500">Share this QR with passengers after completing their trip.</p>
        </div>
      </Card>
    </div>
  );
}

function QuickCard({ icon: Icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} className="w-full">
      <Card className="p-4 flex items-center gap-4 hover:border-slate-300 transition-colors">
        <div className="h-11 w-11 rounded-xl bg-slate-900 flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-amber-400" /></div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-medium text-slate-900 text-sm">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </Card>
    </button>
  );
}

function DriverProfile({ driver, trips, vehicleCheckins }) {
  const tripCount = trips.length;
  const completedTrips = trips.filter((t) => t.status === "FEEDBACK_SUBMITTED").length;
  const checkins = vehicleCheckins.filter((c) => c.driverId === driver.id);
  const checkedOut = checkins.filter((c) => c.status === "CHECKED_OUT").length;
  const validUntil = driver.certStatus === "Certified" ? "Jan 2027" : driver.certStatus === "Pending" ? "Pending review" : "—";
  return (
    <div className="p-5 space-y-5">
      <div className="flex flex-col items-center text-center py-3">
        <Avatar name={driver.name} size="h-20 w-20" />
        <h2 className="font-semibold text-lg text-slate-900 mt-3">{driver.name}</h2>
        <p className="text-xs text-slate-400 font-mono">{driver.id}</p>
        <div className="flex items-center gap-2 mt-2"><CertBadge status={driver.certStatus} /><StatusBadge status={driver.status} /></div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Card className="p-4">
          <p className="text-xl font-semibold text-slate-900">{driver.rating.toFixed(1)} ★</p>
          <p className="text-xs text-slate-400 mt-1">Rating</p>
        </Card>
        <Card className="p-4">
          <p className="text-xl font-semibold text-slate-900">{completedTrips}/{tripCount}</p>
          <p className="text-xs text-slate-400 mt-1">Trips</p>
        </Card>
        <Card className="p-4">
          <p className="text-xl font-semibold text-emerald-600">{checkedOut}</p>
          <p className="text-xs text-slate-400 mt-1">Completed</p>
        </Card>
      </div>

      <Card className="p-5 space-y-4">
        <SectionLabel>Professional Information</SectionLabel>
        <InfoRow icon={Award} label="Certification Level" value={`Level ${driver.level}`} />
        <InfoRow icon={BadgeCheck} label="Certification Status" value={driver.certStatus} />
        <InfoRow icon={CalendarDays} label="Valid Until" value={validUntil} />
        <InfoRow icon={Car} label="Assigned Vehicle" value={driver.vehicle} />
        <InfoRow icon={Clock} label="Joined Program" value={driver.joined} />
      </Card>
      <Card className="p-5 space-y-4">
        <SectionLabel>Contact Information</SectionLabel>
        <InfoRow icon={Phone} label="Phone" value={driver.phone} />
        <InfoRow icon={Mail} label="Email" value={driver.email} />
      </Card>
      <p className="text-xs text-slate-400 text-center px-4">Assessment marks are managed by Admin and cannot be edited from this profile.</p>
    </div>
  );
}

function PassportCard({ driver }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl" style={{ background: "linear-gradient(135deg, #0b1220 0%, #182338 55%, #0b1220 100%)" }}>
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #d4af37 0%, transparent 70%)" }} />
      <div className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandLogo height={22} className="rounded" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-amber-400">PCCP Passport</span>
          </div>
          <BadgeCheck className="h-5 w-5 text-emerald-400" />
        </div>

        <div className="flex items-center gap-4 mt-6">
          <div className="h-16 w-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-semibold text-lg">
            {driver.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <p className="text-white font-semibold text-lg leading-tight">{driver.name}</p>
            <p className="text-slate-400 text-xs font-mono mt-0.5 tracking-wider">{driver.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-700/60">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Certification</p>
            <p className="text-white text-sm font-medium mt-0.5">{CERT_LEVEL_NAMES[driver.level] || driver.level}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Level</p>
            <p className="text-white text-sm font-medium mt-0.5">Level {driver.level}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status</p>
            <p className="text-emerald-400 text-sm font-medium mt-0.5 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {driver.certStatus}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Valid Until</p>
            <p className="text-white text-sm font-medium mt-0.5">{driver.validUntil}</p>
          </div>
        </div>
      </div>
      <div className="h-2 w-full" style={{ background: "linear-gradient(90deg, #d4af37, #f3d68a, #d4af37)" }} />
    </div>
  );
}

function DriverCertification({ driver }) {
  const feedback100 = feedbackTo100(driver.assessment.feedbackAvg);
  return (
    <div className="p-5 space-y-5">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <SectionLabel>Current Level</SectionLabel>
            <p className="text-2xl font-semibold text-slate-900">Level {driver.level}</p>
          </div>
          <CertBadge status={driver.certStatus} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-5">
          <div>
            <p className="text-xs text-slate-400">Overall Performance</p>
            <p className="text-xl font-semibold text-slate-900 mt-0.5">{driver.score}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Rating</p>
            <p className="text-xl font-semibold text-slate-900 mt-0.5">{driver.rating.toFixed(1)} ★</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <SectionLabel>Assessment Summary</SectionLabel>
        {[["Written", driver.assessment.written], ["Practical", driver.assessment.practical], ["Operational", driver.assessment.operational], ["Feedback", feedback100]].map(([label, val]) => (
          <div key={label}>
            <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{label}</span><span className="font-medium text-slate-700">{val}%</span></div>
            <ProgressBar value={val} tone="amber" />
          </div>
        ))}
      </Card>
      <p className="text-xs text-slate-400 text-center px-4">Certification calculation is a Phase 1 placeholder pending confirmation by the project team.</p>
    </div>
  );
}

function DriverQR({ driver, vehiclePlate, onScan }) {
  return (
    <div className="p-5 flex flex-col items-center">
      <Card className="p-8 flex flex-col items-center w-full">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Vehicle QR · Car</p>
        <QRVisual seed={vehiclePlate || driver.id} />
        <p className="font-semibold text-slate-900 mt-5">{driver.name}</p>
        <p className="text-xs text-slate-400 font-mono">{driver.id}</p>
        <p className="text-xs text-slate-500 mt-3">Car plate: <span className="font-mono">{vehiclePlate || "—"}</span></p>
        <p className="text-[11px] text-slate-400 mt-1">Scan at check-in &amp; drop-off</p>
        <Badge tone="emerald" icon={CheckCircle2} className="mt-3">Verified</Badge>
      </Card>
      <div className="flex gap-2 w-full mt-4">
        <Button variant="outline" className="flex-1"><RefreshCw className="h-4 w-4" /> Refresh QR</Button>
        <Button className="flex-1" onClick={() => onScan(true)}><ScanLine className="h-4 w-4" /> Simulate Scan</Button>
      </div>
    </div>
  );
}

function QRVisual({ seed = "DRV-001", size = 176 }) {
  // Deterministic pseudo-QR pattern for prototype purposes (not a real scannable code)
  const cells = 12;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 100000;
  const rand = (i) => { h = (h * 9301 + 49297 + i) % 233280; return h / 233280; };
  const grid = Array.from({ length: cells * cells }, (_, i) => rand(i) > 0.52);
  const cell = size / cells;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg border border-slate-200">
      <rect width={size} height={size} fill="white" />
      {grid.map((on, i) => {
        const x = (i % cells) * cell, y = Math.floor(i / cells) * cell;
        return on ? <rect key={i} x={x} y={y} width={cell} height={cell} fill="#0f172a" /> : null;
      })}
      {[[0, 0], [1, 0], [0, 1]].map(([cx_, cy_], idx) => (
        <g key={idx} transform={`translate(${cx_ * (size - 3 * cell)}, ${cy_ * (size - 3 * cell)})`}>
          <rect width={cell * 3} height={cell * 3} fill="#0f172a" />
          <rect x={cell * 0.5} y={cell * 0.5} width={cell * 2} height={cell * 2} fill="white" />
          <rect x={cell} y={cell} width={cell} height={cell} fill="#0f172a" />
        </g>
      ))}
    </svg>
  );
}

function QRVerify({ driver, state, onRetry, onRetryFail }) {
  return (
    <div className="p-5 flex flex-col items-center justify-center min-h-[70vh] text-center">
      {state === "scanning" && (
        <>
          <Loader2 className="h-10 w-10 text-slate-400 animate-spin" />
          <p className="text-slate-500 text-sm mt-4">Verifying QR code…</p>
        </>
      )}
      {state === "success" && (
        <>
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"><CheckCircle2 className="h-8 w-8 text-emerald-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">Driver Verified</h2>
          <Badge tone="emerald" icon={CheckCircle2}>Verified</Badge>
          <Card className="p-5 mt-5 w-full text-left">
            <InfoRow icon={User} label="Driver" value={driver.name} />
            <div className="h-3" />
            <InfoRow icon={CreditCard} label="Driver ID" value={driver.id} mono />
            <div className="h-3" />
            <InfoRow icon={Award} label="Certification" value={`${CERT_LEVEL_NAMES[driver.level] || driver.level} — Level ${driver.level}`} />
            <div className="h-3" />
            <InfoRow icon={Shield} label="Status" value={driver.status} />
          </Card>
          <Button variant="outline" className="w-full mt-4" onClick={onRetryFail}>Simulate Failed Scan</Button>
        </>
      )}
      {state === "fail" && (
        <>
          <div className="h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center mb-4"><XCircle className="h-8 w-8 text-rose-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">Verification Failed</h2>
          <p className="text-slate-500 text-sm mt-2">Unable to verify this QR code.</p>
          <Button className="w-full mt-6" onClick={onRetry}>Try Again</Button>
        </>
      )}
    </div>
  );
}

function VehicleQRScan({ assignedPlate, vehicleName, onValid, onCancel, title = "Scan Vehicle QR", hint }) {
  const [state, setState] = useState("idle"); // idle | scanning | valid | invalid
  function runScan(qrValue) {
    setState("scanning");
    setTimeout(() => {
      if (qrValue === assignedPlate) {
        setState("valid");
        setTimeout(onValid, 900);
      } else {
        setState("invalid");
      }
    }, 1300);
  }
  return (
    <div className="p-5 space-y-5">
      {state === "idle" && (
        <>
          <Card className="p-8 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center"><QrCode className="h-7 w-7 text-amber-400" /></div>
            <p className="font-semibold text-slate-900 mt-4">{title}</p>
            <p className="text-xs text-slate-400 mt-1.5 max-w-[240px]">{hint || "Scan the QR code displayed in your assigned vehicle."}</p>
            <Badge tone="navy" className="mt-3 font-mono">{assignedPlate}</Badge>
          </Card>
          <Button className="w-full" onClick={() => runScan(assignedPlate)}><ScanLine className="h-4 w-4" /> Simulate Scan</Button>
          <Button variant="outline" className="w-full" onClick={() => runScan("YGN-0000")}><XCircle className="h-4 w-4" /> Simulate Wrong QR</Button>
          {onCancel && <button onClick={onCancel} className="w-full text-center text-sm text-slate-400 py-1 hover:text-slate-600">Cancel</button>}
        </>
      )}
      {state === "scanning" && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <Loader2 className="h-10 w-10 text-slate-400 animate-spin" />
          <p className="text-slate-500 text-sm mt-4">Validating QR code…</p>
          <p className="text-xs text-slate-400 mt-1">Checking registration, vehicle status and assignment…</p>
        </div>
      )}
      {state === "valid" && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"><CheckCircle2 className="h-8 w-8 text-emerald-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">Vehicle Verified</h2>
          <p className="text-slate-500 text-sm mt-1">{vehicleName || assignedPlate}</p>
        </div>
      )}
      {state === "invalid" && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center mb-4"><XCircle className="h-8 w-8 text-rose-600" /></div>
          <h2 className="text-xl font-semibold text-slate-900">QR Validation Failed</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-xs">This QR code does not match your assigned vehicle.</p>
          <Button className="w-full mt-6" onClick={() => setState("idle")}>Try Again</Button>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   PASSENGER APPLICATION (mobile-first)
   ========================================================================= */

function PassengerApp({ passengers, drivers, vehicles, transportRequests, notifications, addTransportRequest, updateTransportRequest, submitFeedback, markNotificationRead, notify, onExit, userId }) {
  const [screen, setScreen] = useState("home");
  const [destination, setDestination] = useState(null);
  const [assignedDriver, setAssignedDriver] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [scanKind, setScanKind] = useState("pickup"); // pickup | dropoff
  const [lastRating, setLastRating] = useState(0);
  const passengerId = userId;
  const passenger = passengers.find((p) => p.id === passengerId);

  const activeDrivers = drivers.filter((d) => d.status === "Active");
  const ranked = [...activeDrivers].sort((a, b) => b.rating - a.rating);

  const myTrips = transportRequests.filter((r) => r.passengerId === passengerId);
  const myNotifications = notifications.filter((n) => n.recipientRole === "passenger" && n.recipientId === passengerId);
  const unreadCount = myNotifications.filter((n) => !n.read).length;
  const selectedRequest = myTrips.find((r) => r.id === selectedRequestId);

  const nav = [
    { key: "home", label: "Home", icon: HomeIcon },
    { key: "trips", label: "My Requests", icon: ListChecks },
    { key: "profile", label: "Profile", icon: User },
  ];

  function confirmDestination(dest) {
    setDestination(dest);
    const chosen = ranked[0];
    setAssignedDriver(chosen);
    setScreen("driverinfo");
  }

  function openTrip(id) {
    setSelectedRequestId(id);
    setScreen("tripDetail");
  }

  function handleCreateRequest(form) {
    const id = addTransportRequest({ ...form, passengerId, passengerName: passenger.name });
    notify("Request submitted successfully.");
    setSelectedRequestId(id);
    setScreen("tripDetail");
  }

  function handleScanValid() {
    if (scanKind === "pickup") {
      updateTransportRequest(selectedRequestId, { status: "PICK_UP_SCANNED", qrScanStatus: "PICK_UP_SCANNED" });
      notify("Pick up confirmed.");
    } else {
      updateTransportRequest(selectedRequestId, { status: "DROP_OFF_SCANNED", qrScanStatus: "DROP_OFF_SCANNED" });
      notify("Drop off confirmed.");
    }
    setScreen("tripDetail");
  }

  function renderTripActions(request) {
    if (request.status === "PENDING") {
      return (
        <Card className="p-4 bg-slate-50">
          <p className="text-sm text-slate-600 flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /> Awaiting admin assignment. You will be notified when a driver is assigned.</p>
        </Card>
      );
    }
    if (request.status === "ASSIGNED" || request.status === "QR_PENDING") {
      return <Button className="w-full" onClick={() => { setScanKind("pickup"); setScreen("scan"); }}><ScanLine className="h-4 w-4" /> Scan Car QR — Pick Up</Button>;
    }
    if (request.status === "PICK_UP_SCANNED") {
      return <Button className="w-full" onClick={() => { setScanKind("dropoff"); setScreen("scan"); }}><ScanLine className="h-4 w-4" /> Scan Car QR — Drop Off</Button>;
    }
    if (request.status === "DROP_OFF_SCANNED") {
      return <Button className="w-full" onClick={() => setScreen("feedback")}><Star className="h-4 w-4" /> Leave Feedback</Button>;
    }
    if (request.status === "FEEDBACK_SUBMITTED") {
      return (
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <p className="text-sm text-emerald-800 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Trip completed — feedback submitted.</p>
        </Card>
      );
    }
    return null;
  }

  const titles = { id: "Passenger ID", home: "Where To?", createRequest: "New Transport Request", whereto: "Where-To", driverinfo: "Driver Information", ranking: "Driver Ranking", feedback: "Rate Your Driver", success: "Feedback Submitted", profile: "Passenger Profile", trips: "My Trips", calendar: "Trip Calendar", tripDetail: "Trip Details", notifications: "Notifications", scan: scanKind === "pickup" ? "Scan Car QR — Pick Up" : "Scan Car QR — Drop Off" };

  return (
    <MobileShell
      title={titles[screen]} subtitle={screen !== "home" ? passengerId : undefined}
      onBack={["driverinfo", "feedback", "success"].includes(screen) ? () => setScreen("home") : ["tripDetail", "notifications"].includes(screen) ? () => setScreen("trips") : ["scan"].includes(screen) ? () => setScreen("tripDetail") : screen === "createRequest" ? () => setScreen("home") : undefined}
      nav={nav} active={["whereto", "driverinfo", "feedback", "success", "ranking", "createRequest"].includes(screen) ? "home" : ["tripDetail", "notifications", "scan"].includes(screen) ? "trips" : screen}
      onNav={setScreen} onExit={onExit}
      right={<NotificationBell count={unreadCount} onClick={() => setScreen("notifications")} />}
    >
      {screen === "home" && (
        <PassengerHome passengerId={passengerId} ranked={ranked} onWhereTo={() => setScreen("whereto")} onRanking={() => setScreen("ranking")} onProfile={() => setScreen("profile")} onTrips={() => setScreen("trips")} onCreateRequest={() => setScreen("createRequest")} />
      )}
      {screen === "createRequest" && (
        <PassengerCreateRequest passenger={passenger} onCancel={() => setScreen("home")} onSubmit={handleCreateRequest} />
      )}
      {screen === "whereto" && <WhereTo onConfirm={confirmDestination} />}
      {screen === "driverinfo" && assignedDriver && (
        <PassengerDriverInfo driver={assignedDriver} destination={destination} rank={ranked.findIndex((d) => d.id === assignedDriver.id) + 1}
          onFeedback={() => setScreen("feedback")} onViewPassport={() => notify("Driver Passport preview shared with passenger.", "info")} />
      )}
      {screen === "ranking" && <PassengerRanking ranked={ranked} onSelect={(d) => { setAssignedDriver(d); setScreen("driverinfo"); }} />}
      {screen === "feedback" && (
        selectedRequest && selectedRequest.driverId ? (
          <PassengerFeedback driver={drivers.find((d) => d.id === selectedRequest.driverId)} request={selectedRequest}
            onSubmit={(data) => { setLastRating(data.rating); submitFeedback(selectedRequest.id, data); setScreen("success"); }} />
        ) : (
          assignedDriver && (
            <PassengerFeedback driver={assignedDriver} onSubmit={(data) => { setLastRating(data.rating); notify("Feedback submitted."); setScreen("success"); }} />
          )
        )
      )}
      {screen === "success" && (
        selectedRequest && selectedRequest.driverId ? (
          <FeedbackSuccess driver={drivers.find((d) => d.id === selectedRequest.driverId)} request={selectedRequest} rating={lastRating} onHome={() => setScreen("home")} />
        ) : (
          assignedDriver && <FeedbackSuccess driver={assignedDriver} rating={lastRating} onHome={() => setScreen("home")} />
        )
      )}
      {screen === "profile" && <PassengerProfile passenger={passenger} tripCount={myTrips.length} />}
      {screen === "trips" && <PassengerTrips trips={myTrips} onOpen={openTrip} />}
      {screen === "calendar" && <TripCalendar trips={myTrips} onOpen={openTrip} />}
      {screen === "tripDetail" && selectedRequest && (
        <DriverTripDetail request={selectedRequest} onBack={() => setScreen("trips")} actions={renderTripActions(selectedRequest)} />
      )}
      {screen === "scan" && selectedRequest && (
        <VehicleQRScan
          assignedPlate={selectedRequest.vehiclePlate}
          vehicleName={`${vehicles.find((v) => v.id === selectedRequest.vehicleId)?.make || ""} ${vehicles.find((v) => v.id === selectedRequest.vehicleId)?.model || ""}`.trim() || selectedRequest.vehiclePlate}
          onValid={handleScanValid} onCancel={() => setScreen("tripDetail")}
          title={scanKind === "pickup" ? "Scan Car QR — Pick Up" : "Scan Car QR — Drop Off"}
          hint={scanKind === "pickup" ? "Scan the QR displayed in your assigned vehicle at the pick-up point." : "Scan the QR in your vehicle again to confirm drop-off."}
        />
      )}
      {screen === "notifications" && (
        <MobileNotifications notifications={myNotifications} onMarkRead={markNotificationRead}
          onOpen={(n) => n.relatedRequestId && openTrip(n.relatedRequestId)} emptyTitle="No notifications" />
      )}
    </MobileShell>
  );
}

function PassengerCreateRequest({ passenger, onCancel, onSubmit }) {
  const [form, setForm] = useState({ department: passenger.department, pickup: "", destination: "", date: "", time: "" });
  const [errors, setErrors] = useState({});
  const departments = [...new Set(PASSENGERS.map((p) => p.department))];
  const inputCls = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300";

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function submit() {
    const errs = {};
    ["department", "pickup", "destination", "date", "time"].forEach((k) => { if (!String(form[k] || "").trim()) errs[k] = "Required."; });
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit(form);
  }

  return (
    <div className="p-5 space-y-5">
      <Card className="p-5 space-y-1.5">
        <SectionLabel>Passenger</SectionLabel>
        <p className="text-sm font-medium text-slate-900">{passenger.name}</p>
        <p className="text-xs text-slate-400 font-mono">{passenger.id}</p>
      </Card>

      <div>
        <SectionLabel>Department</SectionLabel>
        <select value={form.department} onChange={(e) => setField("department", e.target.value)} className={inputCls}>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div>
        <SectionLabel>Pickup Location</SectionLabel>
        <input value={form.pickup} onChange={(e) => setField("pickup", e.target.value)} placeholder="e.g. Head Office" className={cx(inputCls, errors.pickup && "border-rose-400")} />
        {errors.pickup && <p className="text-xs text-rose-600 mt-1">{errors.pickup}</p>}
      </div>

      <div>
        <SectionLabel>Destination</SectionLabel>
        <input value={form.destination} onChange={(e) => setField("destination", e.target.value)} placeholder="e.g. Yangon International Airport" className={cx(inputCls, errors.destination && "border-rose-400")} />
        {errors.destination && <p className="text-xs text-rose-600 mt-1">{errors.destination}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <SectionLabel>Date</SectionLabel>
          <input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} className={cx(inputCls, errors.date && "border-rose-400")} />
          {errors.date && <p className="text-xs text-rose-600 mt-1">{errors.date}</p>}
        </div>
        <div>
          <SectionLabel>Time</SectionLabel>
          <input type="time" value={form.time} onChange={(e) => setField("time", e.target.value)} className={cx(inputCls, errors.time && "border-rose-400")} />
          {errors.time && <p className="text-xs text-rose-600 mt-1">{errors.time}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button className="flex-1" onClick={submit}>Submit Request</Button>
      </div>
    </div>
  );
}

function PassengerTrips({ trips, onOpen }) {
  return (
    <div className="p-5 space-y-3">
      <div>
        <h2 className="font-semibold text-slate-900">My Trips</h2>
        <p className="text-xs text-slate-400 mt-0.5">{trips.length} transport request(s)</p>
      </div>
      {trips.length === 0 ? (
        <EmptyState title="No trips yet" subtitle="Transport requests you create will appear here." icon={ListChecks} />
      ) : trips.map((r) => (
        <button key={r.id} onClick={() => onOpen(r.id)} className="w-full">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-sm font-medium text-slate-900">{r.id}</p>
              <TransportStatusBadge status={r.status} />
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-slate-600">
              <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {r.pickup}</p>
              <p className="flex items-center gap-2"><Navigation className="h-3.5 w-3.5 text-slate-400" /> {r.destination}</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400"><CalendarDays className="h-3.5 w-3.5 inline mr-1" />{r.date} · {r.time}</p>
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1">Details <ChevronRight className="h-3.5 w-3.5" /></span>
            </div>
          </Card>
        </button>
      ))}
    </div>
  );
}

function PassengerHome({ passengerId, ranked, onWhereTo, onRanking, onProfile, onTrips, onCreateRequest }) {
  return (
    <div className="p-5 space-y-5">
      <div>
        <p className="text-slate-400 text-sm">Passenger ID <span className="font-mono text-slate-500">{passengerId}</span></p>
        <h2 className="text-xl font-semibold text-slate-900 mt-1">Where do you want to go?</h2>
      </div>

      <button onClick={onWhereTo} className="w-full text-left">
        <Card className="p-5 bg-slate-900 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-600 flex items-center justify-center"><Navigation className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-white font-semibold">Where-To</p>
              <p className="text-slate-400 text-xs mt-0.5">Enter your destination</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500 ml-auto" />
          </div>
        </Card>
      </button>

      <button onClick={onCreateRequest} className="w-full text-left">
        <Card className="p-4 flex items-center gap-4 border-emerald-200">
          <div className="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-emerald-600" /></div>
          <div className="flex-1 text-left">
            <p className="font-medium text-slate-900 text-sm">New Transport Request</p>
            <p className="text-xs text-slate-400 mt-0.5">Create a request for admin to assign</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </Card>
      </button>

      <div>
        <SectionLabel>Recent Destinations</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {DESTINATIONS.slice(0, 3).map((d) => (
            <span key={d} className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-600">{d}</span>
          ))}
        </div>
      </div>

      <button onClick={onTrips} className="w-full">
        <Card className="p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center"><ListChecks className="h-5 w-5 text-slate-600" /></div>
          <div className="flex-1 text-left">
            <p className="font-medium text-slate-900 text-sm">My Trips</p>
            <p className="text-xs text-slate-400 mt-0.5">View your transport requests</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </Card>
      </button>

      <button onClick={onRanking} className="w-full">
        <Card className="p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-slate-600" /></div>
          <div className="flex-1 text-left">
            <p className="font-medium text-slate-900 text-sm">Driver Ranking</p>
            <p className="text-xs text-slate-400 mt-0.5">Top-rated certified chauffeurs</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </Card>
      </button>

      <button onClick={onProfile} className="w-full">
        <Card className="p-4 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center"><User className="h-5 w-5 text-slate-600" /></div>
          <div className="flex-1 text-left">
            <p className="font-medium text-slate-900 text-sm">Passenger Profile</p>
            <p className="text-xs text-slate-400 mt-0.5">View your passenger ID</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </Card>
      </button>
    </div>
  );
}

function WhereTo({ onConfirm }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const suggestions = DESTINATIONS.filter((d) => d.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-5 space-y-5">
      <div className="relative">
        <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); }} placeholder="Enter destination"
          className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white" />
      </div>

      <div>
        <SectionLabel>Suggested Destinations</SectionLabel>
        <div className="space-y-2">
          {suggestions.length === 0 ? (
            <EmptyState title="No destination found" subtitle="Try a different search term." icon={MapPin} />
          ) : suggestions.map((d) => (
            <button key={d} onClick={() => setSelected(d)} className="w-full">
              <Card className={cx("p-3.5 flex items-center gap-3", selected === d && "ring-2 ring-slate-900")}>
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-800">{d}</span>
                {selected === d && <CheckCircle2 className="h-4 w-4 text-emerald-600 ml-auto" />}
              </Card>
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full" disabled={!selected} onClick={() => onConfirm(selected)}>Confirm Destination</Button>
    </div>
  );
}

function PassengerDriverInfo({ driver, destination, rank, onFeedback, onViewPassport }) {
  return (
    <div className="p-5 space-y-5">
      {destination && (
        <Card className="p-4 flex items-center gap-3 bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800">Destination confirmed: <span className="font-medium">{destination}</span></p>
        </Card>
      )}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <Avatar name={driver.name} size="h-16 w-16" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900">{driver.name}</p>
            <p className="text-xs text-slate-400 font-mono">{driver.id}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <CertBadge status={driver.certStatus} />
              <Badge tone="slate">Level {driver.level}</Badge>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5 text-center">
          <div className="rounded-lg bg-slate-50 py-3">
            <p className="text-lg font-semibold text-slate-900">{driver.rating.toFixed(1)} ★</p>
            <p className="text-[11px] text-slate-400">Rating</p>
          </div>
          <div className="rounded-lg bg-slate-50 py-3">
            <p className="text-lg font-semibold text-slate-900">#{rank}</p>
            <p className="text-[11px] text-slate-400">Ranking</p>
          </div>
          <div className="rounded-lg bg-slate-50 py-3">
            <p className="text-lg font-semibold text-emerald-600">Verified</p>
            <p className="text-[11px] text-slate-400">Status</p>
          </div>
        </div>
      </Card>
      <Button variant="outline" className="w-full" onClick={onViewPassport}><CreditCard className="h-4 w-4" /> View Driver Passport</Button>
      <Button className="w-full" onClick={onFeedback}><Star className="h-4 w-4" /> Rate This Driver</Button>
    </div>
  );
}

function PassengerRanking({ ranked, onSelect }) {
  if (ranked.length === 0) return <div className="p-5"><EmptyState title="No ranking data" subtitle="No active drivers are currently available." icon={TrendingUp} /></div>;
  return (
    <div className="p-5 space-y-4">
      <p className="text-xs text-slate-400 bg-slate-100 rounded-lg p-3">{RANK_WEIGHTING_NOTE}</p>
      <div className="space-y-2">
        {ranked.map((d, i) => (
          <button key={d.id} onClick={() => onSelect(d)} className="w-full">
            <Card className={cx("p-4 flex items-center gap-4", i === 0 && "ring-1 ring-amber-300 bg-amber-50/40")}>
              <div className={cx("h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0",
                i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-300 text-slate-800" : i === 2 ? "bg-amber-800/70 text-white" : "bg-slate-100 text-slate-500")}>
                {i + 1}
              </div>
              <Avatar name={d.name} size="h-10 w-10" />
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium text-slate-900 text-sm truncate">{d.name}</p>
                <p className="text-xs text-slate-400">Level {d.level}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{d.rating.toFixed(1)} ★</p>
                <CertBadge status={d.certStatus} />
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}

function PassengerFeedback({ driver, request, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [errors, setErrors] = useState({});

  function handleRating(n) {
    setRating(n);
    setSelectedTags([]);
    setErrors((e) => ({ ...e, rating: undefined, tags: undefined }));
  }

  function toggleTag(id) {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
    setErrors((e) => ({ ...e, tags: undefined }));
  }

  function handleSubmit() {
    const errs = {};
    if (rating === 0) errs.rating = "Please select a rating.";
    if (selectedTags.length === 0) errs.tags = "Please select at least one tag.";
    if (!comment.trim()) errs.comment = "Please enter your feedback.";
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit({ rating, comment, tags: selectedTags });
  }

  const tagBucket = rating > 0 ? getTagCategory(rating) : [];

  return (
    <div className="p-5 space-y-6">
      {request && (
        <Card className="p-5 space-y-2.5 bg-slate-50">
          <div className="flex items-center justify-between gap-2">
            <SectionLabel>Trip Summary</SectionLabel>
            <TransportStatusBadge status={request.status} />
          </div>
          <p className="font-mono text-xs text-slate-400">{request.id}</p>
          <div className="space-y-1.5 text-sm text-slate-600">
            <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {request.pickup}</p>
            <p className="flex items-center gap-2"><Navigation className="h-3.5 w-3.5 text-slate-400" /> {request.destination}</p>
          </div>
          <p className="text-xs text-slate-400">{request.date} · {request.time} · Car {request.vehiclePlate}</p>
        </Card>
      )}
      <Card className="p-5 flex items-center gap-4">
        <Avatar name={driver.name} />
        <div>
          <p className="font-medium text-slate-900">{driver.name}</p>
          <p className="text-xs text-slate-400 font-mono">{driver.id}</p>
        </div>
      </Card>

      <div className="text-center">
        <SectionLabel>Rating</SectionLabel>
        <div className="flex justify-center mt-2"><StarRating value={rating} onChange={handleRating} /></div>
        {errors.rating && <p className="text-xs text-rose-600 mt-2">{errors.rating}</p>}
      </div>

      {rating > 0 && (
        <div>
          <SectionLabel>{rating <= 3 ? "What needs improvement?" : "What did you appreciate?"}</SectionLabel>
          <p className="text-xs text-slate-400 mb-2">
            {rating <= 3 ? "Select the areas that best describe your feedback (1–3 stars)." : "Select the areas that best describe your feedback (4–5 stars)."}
          </p>
          <div className="flex flex-wrap gap-2">
            {tagBucket.map((tag) => {
              const Icon = tagIcon(tag.icon);
              const active = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cx("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? rating <= 3 ? "bg-rose-600 text-white border-rose-600" : "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-600 border-slate-300 hover:border-slate-500")}
                >
                  <Icon className="h-3.5 w-3.5" /> {tag.label}
                </button>
              );
            })}
          </div>
          {errors.tags && <p className="text-xs text-rose-600 mt-2">{errors.tags}</p>}
        </div>
      )}

      <div>
        <SectionLabel>Comment</SectionLabel>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4}
          placeholder="Tell us about your experience."
          className={cx("w-full rounded-xl border px-3 py-3 text-sm focus:outline-none focus:ring-2 resize-none bg-white",
            errors.comment ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:ring-slate-300")} />
        {errors.comment && <p className="text-xs text-rose-600 mt-1">{errors.comment}</p>}
      </div>

      <Button className="w-full" onClick={handleSubmit}>Submit Feedback</Button>
    </div>
  );
}

function FeedbackSuccess({ driver, request, rating, onHome }) {
  const lastRating = rating || 0;
  return (
    <div className="p-5 flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"><CheckCircle2 className="h-8 w-8 text-emerald-600" /></div>
      <h2 className="text-xl font-semibold text-slate-900">Feedback Submitted Successfully</h2>
      <p className="text-slate-500 text-sm mt-2 max-w-xs">Thank you for helping us improve our chauffeur service.</p>
      <Card className="p-4 mt-5 w-full flex items-center gap-3">
        <Avatar name={driver.name} size="h-9 w-9" />
        <div className="text-left flex-1">
          <p className="text-sm font-medium text-slate-900">{driver.name}</p>
          {request && <p className="text-xs text-slate-400 font-mono">{request.id}</p>}
        </div>
        <StarRating value={lastRating || 5} readOnly size="h-4 w-4" />
      </Card>
      <Button className="w-full mt-6" onClick={onHome}>Return Home</Button>
    </div>
  );
}

function PassengerProfile({ passenger, tripCount = 0 }) {
  if (!passenger) return null;
  return (
    <div className="p-5 space-y-5">
      <div className="flex flex-col items-center text-center py-3">
        <Avatar name={passenger.name} size="h-16 w-16" />
        <p className="font-semibold text-lg text-slate-900 mt-3">{passenger.name}</p>
        <p className="font-mono text-sm text-slate-500">{passenger.id}</p>
        <Badge tone="sky" className="mt-2">{passenger.department}</Badge>
      </div>
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Contact Information</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-slate-400" />
            <span className="text-slate-700">{passenger.phone}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-slate-400" />
            <span className="text-slate-700">{passenger.email}</span>
          </div>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Trip Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-slate-50">
            <p className="text-2xl font-semibold text-slate-900">{tripCount}</p>
            <p className="text-xs text-slate-400">Total Trips</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-slate-50">
            <p className="text-2xl font-semibold text-emerald-600">{passenger.department}</p>
            <p className="text-xs text-slate-400">Department</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
