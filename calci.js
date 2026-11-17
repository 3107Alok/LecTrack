// ATTENDANCE CALCULATOR MODULE
const CALCI_VERSION = "v9";
if (localStorage.getItem('lectrack_calci_version') !== CALCI_VERSION) {
  localStorage.removeItem('lectrack_calci');
  localStorage.setItem('lectrack_calci_version', CALCI_VERSION);
}
let calciState = JSON.parse(localStorage.getItem('lectrack_calci')) || {};

// If calciState is empty or has zeroes when pastData has values, clean or sync it
function getInitialPresent(code, occurred) {
  let past = (typeof pastData !== 'undefined' && pastData[code]) ? pastData[code] : { present: 0, total: 0 };
  let elapsed = (typeof getElapsedClasses === 'function') ? (getElapsedClasses()[code] || 0) : 0;
  let basePresent = past.present + elapsed;

  if (calciState[code] !== undefined && calciState[code] !== null && calciState[code] !== "") {
    let saved = parseInt(calciState[code]);
    if (!isNaN(saved) && saved >= 0 && saved <= occurred) {
      return saved;
    }
  }
  return Math.min(basePresent, occurred);
}

function resetCalci() {
  calciState = {};
  localStorage.removeItem('lectrack_calci');
  openAttendanceCalci();
}

function openAttendanceCalci() {
  const phase = getPhaseInfo();
  const sel = document.getElementById('calciPhaseSelector');
  if (sel && typeof selectedPhase !== 'undefined') sel.value = selectedPhase;

  const tbody = document.getElementById('calciBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const remainFuture = remainingCounts();
  const elapsedClasses = (typeof getElapsedClasses === 'function') ? getElapsedClasses() : {};

  const sortedSubjects = Object.keys(subjects).sort((a, b) => subjects[a].localeCompare(subjects[b]));

  let delayIndex = 0;
  for (let code of sortedSubjects) {
    let past = pastData[code] || { present: 0, total: 0 };
    let elapsed = elapsedClasses[code] || 0;
    let occurred = past.total + elapsed; // Actual lectures held till current time today
    let finalTotal = occurred + (remainFuture[code] || 0);

    // Use persisted value if user manually edited it, else default to actual present count including today
    let currentPresent = getInitialPresent(code, occurred);

    let tr = document.createElement('tr');
    tr.className = 'calci-row';
    tr.style.animationDelay = `${delayIndex * 0.05}s`;
    tr.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div id="health-circle-${code}" style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; flex-shrink: 0;" title="Safe: Target Met"></div>
          <div class="calci-sub-name" style="margin-bottom: 0;">${subjects[code]}</div>
        </div>
      </td>
      <td class="calci-control">
        <button class="step-btn" onclick="adjustCalci('${code}', -1, ${finalTotal}, ${occurred})">−</button>
        <div style="display: flex; align-items: baseline; gap: 4px;">
          <input type="number" id="input-${code}" class="calci-input" value="${currentPresent}" 
                 oninput="updateCalciRow('${code}', this.value, ${finalTotal}, ${occurred}, true)" style="width: 45px; padding: 6px 4px;">
          <span style="font-size: 0.75rem; color: var(--text-dim); font-weight: 800; min-width: 25px;">/ ${occurred}</span>
        </div>
        <button class="step-btn" onclick="adjustCalci('${code}', 1, ${finalTotal}, ${occurred})">+</button>
        <span id="pct-${code}" style="font-size: 0.7rem; color: #10b981; min-width: 40px; text-align: right; font-weight: 700;"></span>
      </td>
      <td class="calci-res" style="color: var(--text-dim);">${remainFuture[code] || 0}</td>
      <td id="res75-${code}" class="calci-res">--</td>
      <td id="res86-${code}" class="calci-res target-86">--</td>
    `;
    tbody.appendChild(tr);

    // Initial Calculation for row without forcing storage write
    updateCalciRow(code, currentPresent, finalTotal, occurred, false);
    delayIndex++;
  }

  // Update overall attendance immediately
  updateOverallAttendance();

  const modal = document.getElementById('calciModal');
  if (modal) modal.style.display = 'block';
}

function updateCalciRow(code, presentVal, finalTotal, occurred, saveToStorage = true) {
  let present = parseInt(presentVal) || 0;
  if (present < 0) present = 0;
  if (present > occurred) present = occurred;

  const input = document.getElementById(`input-${code}`);
  if (input && parseInt(input.value) !== present) {
    input.value = present;
  }

  // Save to persistence only if explicitly edited by user
  if (saveToStorage) {
    calciState[code] = present;
    localStorage.setItem('lectrack_calci', JSON.stringify(calciState));
  }

  const targets = [75, 86];

  targets.forEach(t => {
    const threshold = t / 100;
    const targetId = `res${t}-${code}`;
    const el = document.getElementById(targetId);
    if (!el) return;

    const required = Math.ceil(threshold * finalTotal);
    const diff = required - present;

    if (diff <= 0) {
      el.textContent = "✅ Met";
      el.className = "calci-res met";
    } else {
      el.textContent = `${diff} more`;
      el.className = t === 75 ? "calci-res needed" : "calci-res target-86";
    }
  });

  // Update Health Indicator
  const phase = getPhaseInfo();
  let mandatoryTarget = 0.75;
  let requiredForMandatory = Math.ceil(mandatoryTarget * finalTotal);

  let futureLeft = finalTotal - occurred;
  let maxPossible = present + futureLeft;

  let healthColor = "#ef4444";
  let healthText = `Critical`;

  if (present >= requiredForMandatory) {
    healthColor = "#10b981"; // Safe
    healthText = `Safe: Target Met`;
  } else if (maxPossible >= requiredForMandatory) {
    healthColor = "#f59e0b"; // On Track
    healthText = `Possible to Maintain`;
  } else {
    healthText = `Danger: Cannot Reach`;
  }

  const hc = document.getElementById(`health-circle-${code}`);
  if (hc) {
    hc.style.background = healthColor;
    hc.title = healthText;
  }

  // Individual Percentage
  const pctEl = document.getElementById(`pct-${code}`);
  if (pctEl && occurred > 0) {
    const pctValue = (present / occurred) * 100;
    pctEl.textContent = `${pctValue.toFixed(1)}%`;
    pctEl.style.color = pctValue >= 75 ? "#10b981" : "#ef4444";
  }

  updateOverallAttendance();
}

function updateOverallAttendance() {
  let totalPresent = 0;
  let totalOccurred = 0;
  const elapsedClasses = (typeof getElapsedClasses === 'function') ? getElapsedClasses() : {};

  for (let code in subjects) {
    let past = pastData[code];
    if (past && past.total > 0) {
      let elapsed = elapsedClasses[code] || 0;
      let occurred = past.total + elapsed;
      let present = getInitialPresent(code, occurred);
      totalPresent += present;
      totalOccurred += occurred;
    }
  }

  const el = document.getElementById('overall-attendance');
  if (el && totalOccurred > 0) {
    const pctValue = (totalPresent / totalOccurred) * 100;
    const color = pctValue >= 75 ? '#10b981' : '#ef4444';
    el.innerHTML = `Overall Attendance: <span style="color: ${color}">${pctValue.toFixed(2)}%</span>`;
  }
}

function adjustCalci(code, delta, finalTotal, occurred) {
  const input = document.getElementById(`input-${code}`);
  if (!input) return;
  let val = (parseInt(input.value) || 0) + delta;
  if (val < 0) val = 0;
  if (val > occurred) val = occurred;
  input.value = val;
  updateCalciRow(code, val, finalTotal, occurred, true);
}

// ==========================================
// LAST DAY TO ATTEND MODULE (Till ESE - 7 Dec)
// ==========================================

const periodTimeSlots = [
  "09:10 - 10:00 AM",
  "10:00 - 10:50 AM",
  "10:50 - 11:40 AM",
  "11:40 AM - 12:30 PM",
  "12:30 - 01:20 PM",
  "02:20 - 03:10 PM",
  "03:10 - 04:00 PM",
  "04:00 - 04:50 PM"
];

let currentLastDayTarget = 75;

function openLastDayModal(target = 75) {
  currentLastDayTarget = target;
  switchLastDayTarget(currentLastDayTarget);
  const modal = document.getElementById('lastDayModal');
  if (modal) modal.style.display = 'block';
}

function switchLastDayTarget(target) {
  currentLastDayTarget = target;

  const btn75 = document.getElementById('lastDayTab75');
  const btn86 = document.getElementById('lastDayTab86');
  if (btn75) btn75.classList.toggle('active', target === 75);
  if (btn86) btn86.classList.toggle('active', target === 86);

  renderLastDayView(target);
}

function calculateLastDaySchedule(targetPct) {
  const eseEndDate = new Date("2026-12-07");
  const now = new Date();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const elapsedClasses = (typeof getElapsedClasses === 'function') ? getElapsedClasses() : {};

  // 1. Calculate remaining scheduled classes till 7 Dec
  let remainEse = {};
  let current = new Date(todayMid);
  while (current <= eseEndDate) {
    let d = current.getDay();
    if (d !== 0 && d !== 6 && !isHoliday(current)) {
      let classes = timetable[d];
      if (classes) {
        let isToday = (current.getTime() === todayMid.getTime());
        for (let i = 0; i < classes.length; i++) {
          let sub = classes[i];
          if (sub && sub !== '-') {
            if (isToday) {
              const end = periodEndTimes[i].h * 60 + periodEndTimes[i].m;
              if (currentTime >= end) continue;
            }
            remainEse[sub] = (remainEse[sub] || 0) + 1;
          }
        }
      }
    }
    current.setDate(current.getDate() + 1);
  }

  // 2. Build target info based on Calci live inputs / state
  let targetInfo = {};
  const sortedSubjects = Object.keys(subjects).sort((a, b) => subjects[a].localeCompare(subjects[b]));

  for (let code of sortedSubjects) {
    let past = pastData[code] || { present: 0, total: 0 };
    let elapsed = elapsedClasses[code] || 0;
    let occurred = past.total + elapsed;
    let remain = remainEse[code] || 0;
    let totalEse = occurred + remain;

    // Read directly from user input if Calci modal is open, else fallback to initial/persisted
    let present = getInitialPresent(code, occurred);
    const inputEl = document.getElementById(`input-${code}`);
    if (inputEl) {
      let liveVal = parseInt(inputEl.value);
      if (!isNaN(liveVal) && liveVal >= 0) present = liveVal;
    }

    let required = Math.ceil((targetPct / 100) * totalEse);
    let needed = Math.max(0, required - present);

    targetInfo[code] = {
      code,
      name: subjects[code],
      occurred,
      remain,
      totalEse,
      present,
      required,
      needed,
      attendedSoFar: 0,
      lastLecture: null,
      status: needed === 0 ? 'met' : 'pending'
    };
  }

  // 3. Chronological walk to determine exact lecture date & period
  current = new Date(todayMid);
  while (current <= eseEndDate) {
    let d = current.getDay();
    if (d !== 0 && d !== 6 && !isHoliday(current)) {
      let classes = timetable[d];
      if (classes) {
        let isToday = (current.getTime() === todayMid.getTime());
        for (let i = 0; i < classes.length; i++) {
          let sub = classes[i];
          if (sub && sub !== '-') {
            if (isToday) {
              const end = periodEndTimes[i].h * 60 + periodEndTimes[i].m;
              if (currentTime >= end) continue;
            }

            let info = targetInfo[sub];
            if (info && info.status === 'pending') {
              info.attendedSoFar++;
              if (info.attendedSoFar === info.needed) {
                info.status = 'reached';
                const sortDate = new Date(current);
                sortDate.setHours(periodEndTimes[i].h, periodEndTimes[i].m, 0, 0);
                info.lastLecture = {
                  date: new Date(current),
                  sortTime: sortDate.getTime(),
                  dateStr: current.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
                  dayStr: current.toLocaleDateString("en-GB", { weekday: "short" }),
                  periodNum: i + 1,
                  timeSlot: periodTimeSlots[i]
                };
              }
            }
          }
        }
      }
    }
    current.setDate(current.getDate() + 1);
  }

  let latestLecture = null;
  let allMet = true;
  let hasUnreachable = false;

  for (let code of sortedSubjects) {
    let info = targetInfo[code];
    if (info.status === 'pending') {
      info.status = 'unreachable';
      hasUnreachable = true;
      allMet = false;
    } else if (info.status === 'reached') {
      allMet = false;
      if (!latestLecture || info.lastLecture.sortTime > latestLecture.sortTime) {
        latestLecture = {
          ...info.lastLecture,
          subjectCode: code,
          subjectName: info.name
        };
      }
    }
  }

  return { targetInfo, latestLecture, allMet, hasUnreachable, sortedSubjects };
}

function renderLastDayView(targetPct) {
  const heroEl = document.getElementById('lastDayHero');
  const tbodyEl = document.getElementById('lastDayBody');
  if (!heroEl || !tbodyEl) return;

  const { targetInfo, latestLecture, allMet, hasUnreachable, sortedSubjects } = calculateLastDaySchedule(targetPct);

  // Clean, minimal hero banner
  if (allMet) {
    heroEl.innerHTML = `
      <div class="lastday-hero-card" style="border-color: rgba(16, 185, 129, 0.4); padding: 12px 16px;">
        <div class="lastday-hero-main" style="color: #10b981; font-size: 1.15rem;">🎉 All Targets Met (${targetPct}%)</div>
        <div class="lastday-hero-sub">You can safely bunk all remaining classes till ESE (7 Dec).</div>
      </div>
    `;
  } else if (latestLecture) {
    heroEl.innerHTML = `
      <div class="lastday-hero-card" style="padding: 12px 16px;">
        <div class="lastday-hero-title">Overall Last Lecture to Attend (${targetPct}%)</div>
        <div class="lastday-hero-main" style="color: var(--accent-teal);">📅 ${latestLecture.dateStr} (${latestLecture.dayStr})</div>
        <div class="lastday-hero-sub">
          <b style="color: #fff;">${latestLecture.subjectName}</b> • Period ${latestLecture.periodNum} (${latestLecture.timeSlot})
        </div>
      </div>
    `;
  } else if (hasUnreachable) {
    heroEl.innerHTML = `
      <div class="lastday-hero-card" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08); padding: 12px 16px;">
        <div class="lastday-hero-main" style="font-size: 1rem; color: #ef4444;">⚠️ Target ${targetPct}% Unreachable</div>
        <div class="lastday-hero-sub">Some subjects cannot reach ${targetPct}% even with 100% attendance.</div>
      </div>
    `;
  }

  // Clean, minimal subject rows
  tbodyEl.innerHTML = '';
  for (let code of sortedSubjects) {
    let info = targetInfo[code];
    let tr = document.createElement('tr');
    tr.className = 'calci-row';

    let lastLectureHtml = '';
    if (info.status === 'met') {
      lastLectureHtml = `
        <div style="text-align: right; padding-right: 10px;">
          <span style="color: #10b981; font-weight: 800; font-size: 0.75rem;">✅ Met</span>
        </div>
      `;
    } else if (info.status === 'reached' && info.lastLecture) {
      lastLectureHtml = `
        <div style="text-align: right; padding-right: 10px;">
          <div style="font-weight: 800; color: var(--accent-teal); font-size: 0.78rem;">
            ${info.lastLecture.dateStr} (${info.lastLecture.dayStr})
          </div>
          <div style="font-size: 0.65rem; color: var(--text-dim); font-weight: 600;">
            P${info.lastLecture.periodNum} • ${info.lastLecture.timeSlot}
          </div>
        </div>
      `;
    } else {
      let maxPoss = info.present + info.remain;
      let maxPct = info.totalEse > 0 ? ((maxPoss / info.totalEse) * 100).toFixed(1) : 0;
      lastLectureHtml = `
        <div style="text-align: right; padding-right: 10px;">
          <span style="color: #ef4444; font-weight: 800; font-size: 0.75rem;">⚠️ Max ${maxPct}%</span>
        </div>
      `;
    }

    let pctVal = info.totalEse > 0 ? ((info.present / info.totalEse) * 100).toFixed(1) : 0;

    tr.innerHTML = `
      <td>
        <div class="calci-sub-name" style="margin-bottom: 0;">${info.name}</div>
      </td>
      <td style="text-align: center;">
        <span style="font-weight: 700; font-size: 0.75rem; color: #fff;">${info.present} / ${info.totalEse}</span>
        <div style="font-size: 0.65rem; color: ${pctVal >= targetPct ? '#10b981' : 'var(--text-dim)'}; font-weight: 700;">${pctVal}%</div>
      </td>
      <td style="text-align: center;">
        ${info.needed === 0 ? '<span style="color: #10b981; font-weight: 800; font-size: 0.75rem;">0</span>' : `<span style="color: var(--accent-teal); font-weight: 800; font-size: 0.78rem;">${info.needed}</span>`}
      </td>
      <td>
        ${lastLectureHtml}
      </td>
    `;
    tbodyEl.appendChild(tr);
  }
}
