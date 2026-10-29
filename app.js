// UI & THEME MODULE
// Modal utilities
function closeModal(id) {
  const modal = document.getElementById(id || 'modal');
  if (modal) modal.style.display = "none";
}

// Close modal when clicking outside
window.onclick = function (event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = "none";
  }
};

// Date sheet view & render
function openDateSheet() {
  const container = document.getElementById("dateSheetContent");
  if (container) container.innerHTML = renderDateSheet();
  const modal = document.getElementById("dateSheetModal");
  if (modal) modal.style.display = "block";
}

function renderDateSheet() {
  const schedule = (typeof caSchedule !== 'undefined') ? caSchedule : [];

  let rowsHtml = schedule.map((item, idx) => {
    const isLab = item.type && item.type.includes("Lab");
    const badgeColor = isLab ? "#06b6d4" : "#10b981";
    const badgeBg = isLab ? "rgba(6, 182, 212, 0.15)" : "rgba(16, 185, 129, 0.15)";
    const badgeBorder = isLab ? "rgba(6, 182, 212, 0.3)" : "rgba(16, 185, 129, 0.3)";

    return `
      <tr class="ca-row" style="animation-delay: ${idx * 0.05}s;">
        <td style="text-align: left; padding: 12px 14px;">
          <div style="font-weight: 800; color: #fff; font-size: 0.9rem;">${item.subject}</div>
          <div style="font-size: 0.72rem; color: var(--text-dim); font-weight: 600;">Code: ${item.code}</div>
        </td>
        <td style="padding: 12px 10px; font-weight: 700; color: var(--accent-teal); font-size: 0.85rem;">
          📅 ${item.date}
          <div style="font-size: 0.72rem; color: var(--text-dim); font-weight: 600;">(${item.day})</div>
        </td>
        <td style="padding: 12px 10px; text-align: center;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 800; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder};">
            ${item.type}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="mse-header" style="text-align: center; font-size: 1.35rem; margin-bottom: 8px; padding-top: 10px; font-weight: 800; letter-spacing: -0.5px;">
      📝 <span class="shimmer-title">Continuous Assessment (CA)</span>
    </div>
    <div style="text-align: center; font-size: 0.75rem; color: var(--text-dim); margin-bottom: 20px; font-weight: 500;">
      Upcoming CA Tests & Evaluation Schedule
    </div>
    <div class="ca-table-wrapper" style="overflow-x: auto; border-radius: 14px; border: 1px solid var(--glass-border); background: var(--glass-bg);">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="border-bottom: 1px solid var(--glass-border); background: rgba(255,255,255,0.03);">
            <th style="padding: 12px 14px; font-size: 0.7rem; text-transform: uppercase; color: var(--text-dim); font-weight: 800; letter-spacing: 0.5px;">Subject</th>
            <th style="padding: 12px 10px; font-size: 0.7rem; text-transform: uppercase; color: var(--text-dim); font-weight: 800; letter-spacing: 0.5px;">Date & Day</th>
            <th style="padding: 12px 10px; text-align: center; font-size: 0.7rem; text-transform: uppercase; color: var(--text-dim); font-weight: 800; letter-spacing: 0.5px;">Assessment Type</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
    <div style="margin-top: 15px; text-align: center; font-size: 0.7rem; color: var(--text-dim);">
      💡 MSE-2 Examination: <b style="color: #f59e0b;">18 Nov – 26 Nov 2026</b>
    </div>
  `;
}

// Theme Switcher Logic
const themes = {
  default: { name: 'Default', color: '#ecd567', glow: 'rgba(236, 213, 103, 0.25)', bg: 'radial-gradient(circle at 50% 0%, #2b2d1c 0%, #151611 40%, #0a0a0a 100%)' },
  ocean: { name: 'Ocean', color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.25)', bg: 'radial-gradient(circle at 50% 0%, #163641 0%, #101920 40%, #0a0a0a 100%)' },
  forest: { name: 'Forest', color: '#10b981', glow: 'rgba(16, 185, 129, 0.25)', bg: 'radial-gradient(circle at 50% 0%, #183324 0%, #111a15 40%, #0a0a0a 100%)' },
  sunset: { name: 'Sunset', color: '#f97316', glow: 'rgba(249, 115, 22, 0.25)', bg: 'radial-gradient(circle at 50% 0%, #3d2212 0%, #1a120b 40%, #0a0a0a 100%)' },
  amethyst: { name: 'Amethyst', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.25)', bg: 'radial-gradient(circle at 50% 0%, #27163d 0%, #130e1a 40%, #0a0a0a 100%)' },
  custom: { name: 'Custom', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.25)', bg: 'radial-gradient(circle at 50% 0%, #162441 0%, #101420 40%, #0a0a0a 100%)' }
};

function toggleThemeMenu() {
  const menu = document.getElementById('theme-menu');
  if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function applyTheme(themeKey) {
  const theme = themes[themeKey];
  if (!theme) return;

  document.documentElement.style.setProperty('--accent-teal', theme.color);
  document.documentElement.style.setProperty('--accent-glow', theme.glow);
  document.documentElement.style.setProperty('--bg-teal', theme.bg);

  const nameEl = document.getElementById('current-theme-name');
  if (nameEl) nameEl.innerText = theme.name;
  const dotEl = document.getElementById('current-theme-dot');
  if (dotEl) dotEl.style.background = theme.color;

  localStorage.setItem('lectrack_theme', themeKey);
  const menu = document.getElementById('theme-menu');
  if (menu) menu.style.display = 'none';
}

function initTheme() {
  const saved = localStorage.getItem('lectrack_theme') || 'default';
  applyTheme(saved);

  const menu = document.getElementById('theme-menu');
  if (menu) {
    menu.innerHTML = '';
    for (const [key, t] of Object.entries(themes)) {
      menu.innerHTML += `
        <div class="theme-option" onclick="applyTheme('${key}')">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: ${t.color};"></div>
          <span>${t.name}</span>
        </div>
      `;
    }
  }
}

// Close theme menu if clicking outside
document.addEventListener('click', function (e) {
  if (!e.target.closest('.theme-switcher')) {
    const menu = document.getElementById('theme-menu');
    if (menu && menu.style.display === 'block') {
      menu.style.display = 'none';
    }
  }
});

// Toast Notifications
function showToast(message) {
  const existing = document.getElementById('toast-msg');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast-msg';
  toast.innerText = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = 'var(--glass-bg-hover)';
  toast.style.color = '#fff';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '30px';
  toast.style.border = '1px solid var(--accent-teal)';
  toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
  toast.style.zIndex = '10000';
  toast.style.fontSize = '0.9rem';
  toast.style.fontWeight = '700';
  toast.style.whiteSpace = 'nowrap';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(-10px)';
  }, 10);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// PWA Install Prompt Logic
let deferredPrompt;
const installContainer = document.getElementById('install-container');
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installContainer) installContainer.style.display = 'block';
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted' && installContainer) {
      installContainer.style.display = 'none';
    }
    deferredPrompt = null;
  });
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}

// Live update according to time: periodically re-render when lecture boundary passes
let lastElapsedSnapshot = (typeof getElapsedClasses === 'function') ? JSON.stringify(getElapsedClasses()) : '';
setInterval(() => {
  if (typeof getElapsedClasses !== 'function') return;
  const currentElapsed = JSON.stringify(getElapsedClasses());
  if (currentElapsed !== lastElapsedSnapshot) {
    lastElapsedSnapshot = currentElapsed;
    if (typeof renderDashboard === 'function') renderDashboard();
    const calciModal = document.getElementById('calciModal');
    if (calciModal && calciModal.style.display === 'block' && typeof openAttendanceCalci === 'function') {
      openAttendanceCalci();
    }
  }
}, 30000);
