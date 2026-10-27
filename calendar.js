// CALENDAR & DAY OVERRIDES MODULE
// Custom day overrides format: { "YYYY-MM-DD": "class" | "holiday" | "exam" }
let calendarOverrides = JSON.parse(localStorage.getItem('lectrack_calendar_overrides')) || {};

function getDayOverride(dateStr) {
  return calendarOverrides[dateStr];
}

// Holiday check function — string comparison to avoid timezone offsets
function isHoliday(date) {
  let y = date.getFullYear();
  let m = String(date.getMonth() + 1).padStart(2, '0');
  let d = String(date.getDate()).padStart(2, '0');
  let str = y + '-' + m + '-' + d;

  // Check custom user override first
  const override = getDayOverride(str);
  if (override === 'class') return false; // Explicitly marked as normal class day
  if (override === 'holiday' || override === 'exam' || override === 'mse2') return true; // Marked as holiday or exam (no classes)

  if (typeof holidays !== 'undefined' && holidays.includes(str)) return true;

  const skipTypes = ['holiday', 'mse1', 'mse2', 'ese', 'practical'];
  if (typeof calendarEvents !== 'undefined') {
    for (const event of calendarEvents) {
      if (skipTypes.includes(event.type)) {
        if (event.date && event.date === str) return true;
        if (event.start && event.end && str >= event.start && str <= event.end) return true;
      }
    }
  }
  return false;
}

// Calendar Modal View
function openCalendar() {
  renderCalendar();
  const modal = document.getElementById('calendarModal');
  if (modal) modal.style.display = 'block';
}

function renderCalendar() {
  const months = [
    { month: 7, year: 2026 }, // August
    { month: 8, year: 2026 }, // September
    { month: 9, year: 2026 }, // October
    { month: 10, year: 2026 }, // November
    { month: 11, year: 2026 }, // December
    { month: 0, year: 2027 }  // January
  ];

  let html = '<div class="calendar-container">';
  months.forEach(m => {
    html += generateMonthHTML(m.month, m.year);
  });
  html += '</div>';

  const container = document.getElementById('calendarContent');
  if (container) container.innerHTML = html;
}

function generateMonthHTML(month, year) {
  const date = new Date(year, month, 1);
  const monthName = date.toLocaleString('en-GB', { month: 'long' });
  const firstDayRaw = date.getDay();
  // Mon(0), Tue(1), Wed(2), Thu(3), Fri(4), Sat(5), Sun(6)
  const firstDay = (firstDayRaw === 0) ? 6 : firstDayRaw - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  let html = `<div class="month-box">
    <div class="month-name">${monthName} ${year}</div>
    <div class="calendar-grid">
      ${dayNames.map(d => `<div class="day-header">${d}</div>`).join('')}`;

  // Empty slots before first day
  for (let i = 0; i < firstDay; i++) {
    html += '<div></div>';
  }

  const now = new Date();
  const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let d = 1; d <= daysInMonth; d++) {
    const current = new Date(year, month, d);
    let mStr = String(month + 1).padStart(2, '0');
    let dStr = String(d).padStart(2, '0');
    let dateStr = `${year}-${mStr}-${dStr}`;

    let { type, label, title, hasOverride } = getDayType(current);
    const classes = ['cal-day'];

    const isPast = current < todayAtMidnight;
    const isToday = current.getTime() === todayAtMidnight.getTime();
    const isExam = type && type !== 'holiday';

    let isFinished = isPast;
    if (isToday && isExam) {
      const specificEndTime = getLatestExamEndTime(d, month);
      if (specificEndTime) {
        isFinished = now > specificEndTime;
      } else {
        isFinished = now.getHours() >= 17;
      }
    }

    if (isFinished && isExam && type !== 'mse') {
      classes.push('completed');
      label = '✓ ' + label;
    }

    if (type) classes.push(type);
    if (hasOverride) classes.push('has-override');

    let titleAttr = ` title="${title || dateStr} (Click to change status)"`;
    let clickAttr = ` onclick="openDayOverridePopup(event, '${dateStr}', '${(title || '').replace(/'/g, "\\'")}')" style="cursor: pointer;"`;

    html += `<div class="${classes.join(' ')}"${titleAttr}${clickAttr}>
      ${d}
      ${label ? `<span class="day-label">${label}</span>` : ''}
    </div>`;
  }

  html += '</div></div>';
  return html;
}

function getDayType(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday

  // 0. Check User Overrides
  const override = getDayOverride(dateStr);
  if (override) {
    if (override === 'class') {
      return { type: 'class-day', label: 'Class', title: 'Marked: Regular Class', hasOverride: true };
    }
    if (override === 'holiday') {
      return { type: 'holiday', label: 'H', title: 'Marked: Holiday', hasOverride: true };
    }
    if (override === 'exam' || override === 'mse2') {
      return { type: 'mse', label: 'Exam', title: 'Marked: Exam Day', hasOverride: true };
    }
  }

  // 1. Check Events Array for exact holidays
  if (typeof calendarEvents !== 'undefined') {
    for (const event of calendarEvents) {
      if (event.date && event.date === dateStr) {
        return { type: 'holiday', label: 'H', title: event.title || 'Holiday', hasOverride: false };
      }
    }
  }

  // 2. Sat/Sun as Holiday
  if (day === 0) return { type: 'holiday', label: '', title: 'Sunday', hasOverride: false };
  if (day === 6) return { type: 'holiday', label: '', title: 'Saturday', hasOverride: false };

  // 3. Check Exam & Holiday Ranges
  if (typeof calendarEvents !== 'undefined') {
    for (const event of calendarEvents) {
      if (event.start && event.end) {
        if (dateStr >= event.start && dateStr <= event.end) {
          if (event.type === 'holiday') return { type: 'holiday', label: 'H', title: event.title, hasOverride: false };
          if (event.type === 'mse1') return { type: 'mse', label: 'MSE-1', title: event.title, hasOverride: false };
          if (event.type === 'mse2') return { type: 'mse', label: 'MSE-2', title: event.title, hasOverride: false };
          if (event.type === 'ese') return { type: 'ese', label: 'ESE', title: event.title, hasOverride: false };
          if (event.type === 'practical') return { type: 'practical', label: 'Prac', title: event.title, hasOverride: false };
        }
      }
    }
  }

  return { type: '', label: '', title: '', hasOverride: false };
}

// Day Override Popup Handling
let selectedOverrideDateStr = null;

function openDayOverridePopup(e, dateStr, currentTitle) {
  e.stopPropagation();
  selectedOverrideDateStr = dateStr;

  const popup = document.getElementById('calDayPopup');
  const titleEl = document.getElementById('calDayPopupTitle');
  if (titleEl) {
    titleEl.innerHTML = `📅 ${dateStr}<br><span style="font-size: 0.65rem; color: var(--text-dim); font-weight: normal;">${currentTitle || 'Default'}</span>`;
  }

  let x = e.clientX + 10;
  let y = e.clientY + 10;
  if (x + 230 > window.innerWidth) x = window.innerWidth - 240;
  if (y + 200 > window.innerHeight) y = window.innerHeight - 210;

  if (popup) {
    popup.style.left = `${Math.max(10, x)}px`;
    popup.style.top = `${Math.max(10, y)}px`;
    popup.style.display = 'block';
  }
}

function applyDayOverride(action) {
  if (!selectedOverrideDateStr) return;

  if (action === 'default') {
    delete calendarOverrides[selectedOverrideDateStr];
  } else {
    calendarOverrides[selectedOverrideDateStr] = action;
  }

  localStorage.setItem('lectrack_calendar_overrides', JSON.stringify(calendarOverrides));

  const popup = document.getElementById('calDayPopup');
  if (popup) popup.style.display = 'none';

  renderCalendar();
  if (typeof renderDashboard === 'function') renderDashboard();

  if (typeof showToast === 'function') {
    showToast(`Updated ${selectedOverrideDateStr} status!`);
  }
}

function resetCalendarOverrides() {
  if (Object.keys(calendarOverrides).length === 0) {
    if (typeof showToast === 'function') showToast("No custom dates are set.");
    return;
  }
  calendarOverrides = {};
  localStorage.removeItem('lectrack_calendar_overrides');
  renderCalendar();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof showToast === 'function') showToast("Reset all calendar days to default!");
}

// Close day override popup on click elsewhere
document.addEventListener('click', function(e) {
  const popup = document.getElementById('calDayPopup');
  if (popup && popup.style.display === 'block' && !e.target.closest('#calDayPopup')) {
    popup.style.display = 'none';
  }
});
