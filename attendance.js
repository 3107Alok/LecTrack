// ATTENDANCE CORE & DASHBOARD MODULE
// Recorded attendance data (actual classes held & attended till date)
const pastData = {
  "CS310L": { present: 38, total: 38 },
  "CS311L": { present: 28, total: 28 },
  "HS203L": { present: 16, total: 16 },
  "HS204L": { present: 16, total: 16 },
  "IT401B": { present: 46, total: 47 },
  "CS312B": { present: 45, total: 45 },
  "PE": { present: 54, total: 56 },
  "CS311P": { present: 18, total: 18 },
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
  if (selectedPhase === 'ese') {
    return { endDate: new Date("2026-12-07"), label: "Target: Till ESE (Last Instruction Day)", type: "ese" };
  }

  // Default is MSE-2 (Detention cutoff: 16 Nov)
  return { endDate: new Date("2026-11-16"), label: "Target: Till MSE-2 (16 Nov)", type: "mse2" };
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

  let now = new Date();
  let todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let current = new Date(todayMid);

  while (current <= phase.endDate) {
    let d = current.getDay();

    if (d !== 0 && d !== 6 && !isHoliday(current)) {
      let classes = timetable[d];

      if (classes) {
        if (current.getTime() === todayMid.getTime()) {
          // Current day logic: only count classes that haven't occurred yet today based on time
          const currentH = now.getHours();
          const currentM = now.getMinutes();
          const currentTime = currentH * 60 + currentM;

          for (let i = 0; i < classes.length; i++) {
            let sub = classes[i];
            if (sub && sub !== '-') {
              const end = periodEndTimes[i].h * 60 + periodEndTimes[i].m;
              if (currentTime < end) {
                counts[sub] = (counts[sub] || 0) + 1;
              }
            }
          }
        } else {
          // Future days
          classes.forEach(sub => {
            if (sub && sub !== '-') {
              counts[sub] = (counts[sub] || 0) + 1;
            }
          });
        }
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return counts;
}

// All lectures held since pastDataDate up to current moment
function getElapsedClasses() {
  let elapsed = {};
  let now = new Date();
  let todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let currentTime = now.getHours() * 60 + now.getMinutes();

  let baseDate = (typeof pastDataDate !== 'undefined') ? new Date(pastDataDate) : new Date("2026-10-27");
  let current = new Date(baseDate);
  current.setDate(current.getDate() + 1); // Start from day after pastData baseline

  while (current <= todayMid) {
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
              if (currentTime >= end) {
                elapsed[sub] = (elapsed[sub] || 0) + 1;
              }
            } else {
              // Past day: entire lecture occurred
              elapsed[sub] = (elapsed[sub] || 0) + 1;
            }
          }
        }
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return elapsed;
}

// Backward compatibility alias
function getTodayElapsedClasses() {
  return getElapsedClasses();
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
        <option value="mse2" ${selectedPhase === 'mse2' ? 'selected' : ''}>🎯 Till MSE-2 (16 Nov)</option>
        <option value="ese" ${selectedPhase === 'ese' ? 'selected' : ''}>🎓 Till ESE (7 Dec)</option>
      </select>
    </div>
  `;

  let targetNode = document.querySelector('input[name="targetPct"]:checked');
  let targetVal = targetNode ? targetNode.value : "75";
  let multiplier = targetVal === "86" ? 0.86 : 0.75;

  const sortedSubjects = Object.keys(subjects).sort((a, b) => subjects[a].localeCompare(subjects[b]));
  const elapsedClasses = getElapsedClasses();

  let delayIndex = 0;
  for (let sub of sortedSubjects) {
    let past = pastData[sub] || { present: 0, total: 0 };
    let elapsed = elapsedClasses[sub] || 0;
    let finalTotal = past.total + elapsed + (remaining[sub] || 0);
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
  let now = new Date();
  let todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let current = new Date(todayMid);

  let currentH = now.getHours();
  let currentM = now.getMinutes();
  let currentTime = currentH * 60 + currentM;

  while (current <= phase.endDate) {
    let d = current.getDay();

    if (d !== 0 && d !== 6 && !isHoliday(current)) {
      let classes = timetable[d];
      if (classes) {
        let count = 0;
        if (current.getTime() === todayMid.getTime()) {
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
