// ATTENDANCE CORE & DASHBOARD MODULE
// Recorded attendance data (actual classes held & attended till date)
const pastData = {
  "CS310L": { present: 38, total: 38 },
  "CS311L": { present: 27, total: 27 },
  "HS203L": { present: 16, total: 16 },
  "HS204L": { present: 16, total: 16 },
  "IT401B": { present: 48, total: 49 },
  "CS312B": { present: 49, total: 49 },
  "PE": { present: 54, total: 56 },
  "CS311P": { present: 22, total: 22 },
  "CS313P": { present: 40, total: 42 }
};

// Target phase calculation
let selectedPhase = localStorage.getItem('lectrack_targetPhase');
if (!selectedPhase || (selectedPhase !== 'mse2' && selectedPhase !== 'ese')) {
  selectedPhase = 'mse2';
}

function setPhase(phaseKey) {
  selectedPhase = phaseKey;
  localStorage.setItem('lectrack_targetPhase', phaseKey);
  renderDashboard();
  // Also sync calci phase if open
  const calciModal = document.getElementById('calciModal');
  if (calciModal && calciModal.style.display === 'block') {
    openAttendanceCalci();
  }
}

function getPhaseInfo() {
  let mse2Event = calendarEvents.find(e => e.type === 'mse2');

  if (selectedPhase === 'ese') {
    return { endDate: new Date("2026-12-07"), label: "Target: Till ESE (Last Instruction Day)", type: "ese" };
  }

  // Default is MSE-2
  if (mse2Event) {
    let endD = new Date(mse2Event.start);
    endD.setDate(endD.getDate() - 1);
    return { endDate: endD, label: "Target: Till MSE-2", type: "mse2" };
  }
  return { endDate: new Date("2026-11-17"), label: "Target: Till MSE-2", type: "mse2" };
}

// Full future scheduled counts from startDate to target endDate
function fullFutureCounts() {
  const phase = getPhaseInfo();
  let counts = {};
  let current = new Date(startDate);

  while (current <= phase.endDate) {
    let d = current.getDay();

    if (d !== 0 && d !== 6 && !isHoliday(current)) {
      let classes = timetable[d];
      if (classes) {
        classes.forEach(sub => {
          counts[sub] = (counts[sub] || 0) + 1;
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return counts;
}

// Remaining scheduled lectures from today to target endDate based on live time
function remainingCounts() {
  const phase = getPhaseInfo();
  let counts = {};

  let current = new Date(today);
  let now = new Date();

  while (current <= phase.endDate) {
    let d = current.getDay();

    if (d !== 0 && d !== 6 && !isHoliday(current)) {
      let classes = timetable[d];

      if (classes) {
        if (current.getTime() === today.getTime()) {
          // Current day logic: only count classes that haven't occurred yet today based on time
          const currentH = now.getHours();
          const currentM = now.getMinutes();
          const currentTime = currentH * 60 + currentM;

          for (let i = 0; i < classes.length; i++) {
            const end = periodEndTimes[i].h * 60 + periodEndTimes[i].m;
            if (currentTime < end) {
              counts[classes[i]] = (counts[classes[i]] || 0) + 1;
            }
          }
        } else {
          // Future days
          classes.forEach(sub => {
            counts[sub] = (counts[sub] || 0) + 1;
          });
        }
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return counts;
}

// Classes finished earlier today based on current time
function getTodayElapsedClasses() {
  let elapsed = {};
  let d = today.getDay();
  if (d === 0 || d === 6 || isHoliday(today)) return elapsed;
  let classes = timetable[d];
  if (!classes) return elapsed;

  let now = new Date();
  let currentTime = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < classes.length; i++) {
    const end = periodEndTimes[i].h * 60 + periodEndTimes[i].m;
    if (currentTime >= end && classes[i] !== '-') {
      elapsed[classes[i]] = (elapsed[classes[i]] || 0) + 1;
    }
  }
  return elapsed;
}

let fullFuture = fullFutureCounts();
let remaining = remainingCounts();

// Render dashboard cards
function renderDashboard() {
  fullFuture = fullFutureCounts();
  remaining = remainingCounts();

  const dashboard = document.getElementById("dashboard");
  if (!dashboard) return;

  const phase = getPhaseInfo();
  dashboard.innerHTML = `
    <div style="width: 100%; text-align: center; margin-bottom: 12px; grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;">
      <span style="color: var(--text-dim); font-size: 0.85rem; font-weight: 700;">Target:</span>
      <select id="phaseSelector" onchange="setPhase(this.value)" class="phase-dropdown">
        <option value="mse2" ${selectedPhase === 'mse2' ? 'selected' : ''}>🎯 Till MSE-2 (17 Nov)</option>
        <option value="ese" ${selectedPhase === 'ese' ? 'selected' : ''}>🎓 Till ESE (7 Dec)</option>
      </select>
    </div>
  `;

  let targetNode = document.querySelector('input[name="targetPct"]:checked');
  let targetVal = targetNode ? targetNode.value : "75";
  let multiplier = targetVal === "86" ? 0.86 : 0.75;

  const sortedSubjects = Object.keys(subjects).sort((a, b) => subjects[a].localeCompare(subjects[b]));
  const todayElapsed = (typeof getTodayElapsedClasses === 'function') ? getTodayElapsedClasses() : {};

  let delayIndex = 0;
  for (let sub of sortedSubjects) {
    let past = pastData[sub] || { present: 0, total: 0 };
    let elapsedToday = todayElapsed[sub] || 0;
    let finalTotal = past.total + elapsedToday + (remaining[sub] || 0);
    let required = Math.ceil(multiplier * finalTotal);
    let futureLeft = remaining[sub] || 0;

    dashboard.innerHTML += `
      <div class="card" style="animation-delay: ${delayIndex * 0.05}s;" onclick="showDetails('${sub}')">
        <div class="row">
          <div class="subject">${subjects[sub]}</div>

          <div class="ratio">For ${targetVal}%: 
            <span class="ratio-badge">${required} / ${finalTotal}</span>
          </div>

          <div class="remaining">${futureLeft} lectures remaining</div>
        </div>
      </div>
    `;
    delayIndex++;
  }

  localStorage.setItem('lectrack_targetPct', targetVal);
}

// Show day-wise lecture list for a subject
function showDetails(subject) {
  const phase = getPhaseInfo();
  let html = "";
  let current = new Date(today);

  let now = new Date();
  let currentH = now.getHours();
  let currentM = now.getMinutes();
  let currentTime = currentH * 60 + currentM;

  while (current <= phase.endDate) {
    let d = current.getDay();

    if (d !== 0 && d !== 6 && !isHoliday(current)) {
      let classes = timetable[d];
      if (classes) {
        let count = 0;
        if (current.getTime() === today.getTime()) {
          // Today: only count periods whose end time has not passed yet
          for (let i = 0; i < classes.length; i++) {
            if (classes[i] === subject) {
              const end = periodEndTimes[i].h * 60 + periodEndTimes[i].m;
              if (currentTime < end) {
                count++;
              }
            }
          }
        } else {
          count = classes.filter(s => s === subject).length;
        }

        if (count > 0) {
          let day = current.toLocaleDateString("en-GB", { day: "numeric" });
          let month = current.toLocaleDateString("en-GB", { month: "long" });
          let weekday = current.toLocaleDateString("en-GB", { weekday: "short" });

          html += `
            <div style="margin-bottom:8px;">
              📅 ${day} ${month} (${weekday}) ${count} hour${count > 1 ? "s" : ""}
            </div>
          `;
        }
      }
    }
    current.setDate(current.getDate() + 1);
  }

  const titleEl = document.getElementById("modalTitle");
  if (titleEl) titleEl.innerText = subjects[subject] || subject;
  const contentEl = document.getElementById("modalContent");
  if (contentEl) contentEl.innerHTML = html;
  const modal = document.getElementById("modal");
  if (modal) modal.style.display = "block";
}

// Live Attendance external link
function openAttendance() {
  window.open("https://cybervidya.pages.dev/");
}
