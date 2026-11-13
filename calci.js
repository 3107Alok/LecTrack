// ATTENDANCE CALCULATOR MODULE
const CALCI_VERSION = "v7";
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
