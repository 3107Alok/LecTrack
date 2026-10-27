// TIMETABLE MODULE
const timetable = {
  1: ["CS313P", "CS313P", "PE", "PE", "CS310L", "HS204L", "CS311L", "-"],
  2: ["PE", "PE", "CS312B", "HS203L", "HS203L", "CS311L", "-", "-"],
  3: ["IT401B", "CS310L", "PE", "PE", "CS312B", "IT401B", "IT401B", "-"],
  4: ["CS311L", "CS310L", "CS312B", "CS311P", "CS311P", "IT401B", "CS312B", "CS312B"],
  5: ["HS204L", "CS310L", "IT401B", "CS313P", "CS313P", "-", "-", "-"]
};

// Period timing boundaries for live lecture calculations
const periodEndTimes = [
  { h: 10, m: 0 }, { h: 10, m: 50 }, { h: 11, m: 40 }, { h: 12, m: 30 }, { h: 13, m: 20 }, // Before Lunch
  { h: 15, m: 10 }, { h: 16, m: 0 }, { h: 16, m: 50 }  // After Lunch
];

// Open and render TimeTable Modal
function openTimeTable() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const times = [
    "09:10-10:00",
    "10:00-10:50",
    "10:50-11:40",
    "11:40-12:30",
    "12:30-01:20",
    "01:20-02:20", // Lunch
    "02:20-03:10",
    "03:10-04:00",
    "04:00-04:50"
  ];

  let html = `<h2 style="text-align: center; margin-bottom: 20px;"><span class="shimmer-title">Time Table CS - 5A</span></h2>
    <table class="tt-table">
    <thead>
      <tr>
        <th>Day</th>
        ${times.map(t => `<th>${t}</th>`).join('')}
      </tr>
    </thead>
    <tbody>`;

  days.forEach((dayName, dayIdx) => {
    const dayKey = dayIdx + 1;
    html += `<tr>
      <td class="day-col">${dayName}</td>
      ${times.map((time, tIdx) => {
      if (tIdx === 5) {
        return dayIdx === 0 ? `<td rowspan="5" class="lunch-cell">LUNCH BREAK</td>` : '';
      }
      const periodIdx = tIdx < 5 ? tIdx : tIdx - 1;
      const subCode = (timetable[dayKey] && timetable[dayKey][periodIdx]) || "-";
      const subName = (typeof subjects !== 'undefined' && subjects[subCode]) ? subjects[subCode] : subCode;
      return `<td>
          <div class="sub-code">${subCode}</div>
          <div class="sub-name">${subName}</div>
        </td>`;
    }).join('')}
    </tr>`;
  });

  html += `</tbody></table>`;

  const container = document.getElementById("timeTableContent");
  if (container) container.innerHTML = html;
  const modal = document.getElementById("timeTableModal");
  if (modal) modal.style.display = "block";
}
