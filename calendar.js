    // CALENDAR
    function openCalendar() {
      renderCalendar();
      document.getElementById('calendarModal').style.display = 'block';
    }

    const calendarEvents = [
      // Holidays
      { date: "2026-08-15", type: "holiday", title: "Independence Day" },
      { date: "2026-08-26", type: "holiday", title: "Raksha Bandhan / Eid-e-Milad" },
      { date: "2026-09-04", type: "holiday", title: "Janmashtami" },
      { date: "2026-10-02", type: "holiday", title: "Gandhi Jayanti" },
      { date: "2026-10-20", type: "holiday", title: "Dussehra" },
      { date: "2026-11-07", type: "holiday", title: "Deepawali" },
      { date: "2026-11-24", type: "holiday", title: "Guru Nanak Jayanti" },
      { date: "2026-12-25", type: "holiday", title: "Christmas" },

      // Exams
      { start: "2026-09-14", end: "2026-09-21", type: "mse1", title: "MSE-I" },
      { start: "2026-11-02", end: "2026-11-19", type: "mse2", title: "MSE-II" },
      { start: "2026-12-08", end: "2026-12-23", type: "ese", title: "End Semester Examination" }
    ];

    function renderCalendar() {
      const months = [
        { month: 7, year: 2026 }, // August
        { month: 8, year: 2026 }, // September
        { month: 9, year: 2026 }, // October
        { month: 10, year: 2026 }, // November
        { month: 11, year: 2026 }  // December
      ];

      let html = '<div class="calendar-container">';
      months.forEach(m => {
        html += generateMonthHTML(m.month, m.year);
      });
      html += '</div>';

      document.getElementById('calendarContent').innerHTML = html;
    }

    function generateMonthHTML(month, year) {
      const date = new Date(year, month, 1);
      const monthName = date.toLocaleString('en-GB', { month: 'long' });
      const firstDayRaw = date.getDay(); // 0=Sun, 1=Mon...
      // New Order: Mon(0), Tue(1), Wed(2), Thu(3), Fri(4), Sat(5), Sun(6)
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

      // Days of the month
      const now = new Date();
      const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      for (let d = 1; d <= daysInMonth; d++) {
        const current = new Date(year, month, d);
        let { type, label } = getDayType(current);
        const classes = ['cal-day'];

        // Precise Status Check
        const isPast = current < todayAtMidnight;
        const isToday = current.getTime() === todayAtMidnight.getTime();
        const isExam = type && type !== 'holiday';

        let isFinished = isPast;
        if (isToday && isExam) {
          const specificEndTime = getLatestExamEndTime(d, month);
          if (specificEndTime) {
            isFinished = now > specificEndTime;
          } else {
            isFinished = now.getHours() >= 17; // Default fallback
          }
        }

        if (isFinished && isExam && type !== 'mse') {
          classes.push('completed');
          label = '✓ ' + label;
        }

        if (type) classes.push(type);

        html += `<div class="${classes.join(' ')}">
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

      // 1. Check Events Array
      for (const event of calendarEvents) {
        if (event.date && event.date === dateStr) {
          return { type: 'holiday', label: 'H' };
        }
        if (event.start && event.end) {
          if (dateStr >= event.start && dateStr <= event.end) {
            if (event.type === 'mse1' || event.type === 'mse2') {
              if (day === 0 || day === 6) return { type: 'holiday', label: '' };
              return { type: 'mse', label: event.type === 'mse1' ? 'MSE-1' : 'MSE-2' };
            }
            if (event.type === 'ese') return { type: 'ese', label: 'ESE' };
          }
        }
      }

      // 2. Sunday as Holiday
      if (day === 0) return { type: 'holiday', label: '' };

      return { type: '', label: '' };
    }

