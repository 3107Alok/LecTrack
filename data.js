// DATA & CONFIGURATION MODULE
// Subjects mapping
const subjects = {
  "CS310L": "Theory of Computation",
  "CS311L": "Software Engineering (SE & DP)",
  "HS203L": "Aptitude - 3",
  "HS204L": "Soft Skills",
  "IT401B": "Advance Databases",
  "CS312B": "DL and Gen AI",
  "PE": "Professional Elective",
  "CS311P": "Software Engineering (SE & DP) Lab",
  "CS313P": "Problem Solving Lab"
};

// Global month names
const GLOBAL_MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Sem Dates
const startDate = new Date("2026-08-03");
const endDate = new Date("2026-12-07");

// Baseline date when pastData was recorded (Tuesday, 27 October 2026)
const pastDataDate = new Date("2026-10-27");
pastDataDate.setHours(0, 0, 0, 0);

// Today (midnight normalized)
const today = new Date();
today.setHours(0, 0, 0, 0);

// Academic Calendar Events & Holidays
const holidays = [
  "2026-04-14",
  "2026-04-20", "2026-04-21", "2026-04-22",
  "2026-04-23", "2026-04-24", "2026-04-25",
  "2026-04-27", "2026-04-28",
  "2026-08-05", "2026-08-06", "2026-08-07",
  "2026-08-15", "2026-08-28", "2026-09-04",
  "2026-10-02", "2026-10-20", "2026-11-06", "2026-11-24",
  "2026-12-25"
];

const calendarEvents = [
  // Holidays
  { start: "2026-08-04", end: "2026-08-11", type: "holiday", title: "Kanwar Yatra Holiday" },
  { date: "2026-08-15", type: "holiday", title: "Independence Day" },
  { date: "2026-08-28", type: "holiday", title: "Raksha Bandhan" },
  { date: "2026-09-04", type: "holiday", title: "Janmashtami" },
  { date: "2026-10-02", type: "holiday", title: "Gandhi Jayanti" },
  { date: "2026-10-20", type: "holiday", title: "Dussehra" },
  { start: "2026-11-06", end: "2026-11-11", type: "holiday", title: "Diwali Break" },
  { date: "2026-11-24", type: "holiday", title: "Guru Nanak Jayanti" },
  { start: "2026-12-08", end: "2026-12-11", type: "holiday", title: "ESE Prep Break" },
  { date: "2026-12-25", type: "holiday", title: "Christmas" },

  // Exams
  { start: "2026-09-21", end: "2026-09-26", type: "mse1", title: "MSE-I" },
  { start: "2026-11-18", end: "2026-11-27", type: "mse2", title: "MSE-II" },
  { start: "2026-12-14", end: "2026-12-28", type: "ese", title: "End Semester Examination" },
  { start: "2026-12-26", end: "2027-01-02", type: "practical", title: "ESE Practical" }
];

// Helper functions for exams
function parseExamTime(timeStr, dateRef) {
  if (!timeStr || !timeStr.includes('-')) return null;
  try {
    const parts = timeStr.split("-");
    const endPart = parts[1].trim();
    const match = endPart.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;

    let hours = parseInt(match[1]);
    const mins = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const res = new Date(dateRef);
    res.setHours(hours, mins, 0, 0);
    return res;
  } catch (e) { return null; }
}
