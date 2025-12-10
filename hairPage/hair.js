// hair.js
// Make sure this file is in the same folder as hair.html and hair.json

let globalMonths = [];
let globalWeeklyRoutine = [];
let viewMode = "detailed"; // "simple" or "detailed"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todayIndex = new Date().getDay();
const todayName = DAY_NAMES[todayIndex];

/* ---------- Load Data ---------- */

async function loadHairData() {
  const res = await fetch("./hair.json");
  if (!res.ok) {
    const monthContent = document.getElementById("monthContent");
    if (monthContent) {
      monthContent.innerHTML =
        '<p class="text-sm text-rose-400">Could not load <span class="font-semibold">hair.json</span>. Check the file path.</p>';
    }
    throw new Error("Failed to load hair.json");
  }
  return await res.json();
}

/* ---------- Month Tabs, Progress, & Mobile Select ---------- */

function renderMonthTabs(months) {
  const tabsContainer = document.getElementById("monthTabs");
  const select = document.getElementById("monthSelectMobile");

  if (tabsContainer) {
    tabsContainer.innerHTML = "";
    months.forEach((month, index) => {
      const btn = document.createElement("button");
      btn.textContent = month.name;
      btn.type = "button";
      btn.dataset.index = index;
      btn.className =
        "whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold border border-slate-700 text-slate-200 bg-slate-900/70 hover:bg-slate-800/90 hover:border-hairPrimary/70 hover:text-hairSoft transition";
      btn.addEventListener("click", () => setActiveMonth(months, index));
      tabsContainer.appendChild(btn);
    });
  }

  if (select) {
    select.innerHTML = "";
    months.forEach((month, index) => {
      const opt = document.createElement("option");
      opt.value = index;
      opt.textContent = month.name;
      select.appendChild(opt);
    });

    select.addEventListener("change", (e) => {
      const idx = parseInt(e.target.value, 10);
      if (!Number.isNaN(idx)) {
        setActiveMonth(months, idx);
      }
    });
  }
}

function updateMonthProgress(index) {
  const label = document.getElementById("monthProgressLabel");
  const fill = document.getElementById("monthProgressFill");
  const monthNumber = index + 1;
  const total = 12;
  const percent = Math.min(100, (monthNumber / total) * 100);

  if (label) label.textContent = `Month ${monthNumber} of ${total}`;
  if (fill) fill.style.width = `${percent}%`;
}

function setActiveMonth(months, index) {
  const tabs = document.getElementById("monthTabs");
  const content = document.getElementById("monthContent");
  const select = document.getElementById("monthSelectMobile");
  if (!content) return;

  // Update tab styles (desktop/tablet)
  if (tabs) {
    [...tabs.children].forEach((btn, i) => {
      if (i === index) {
        btn.className =
          "whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold border border-hairPrimary text-hairSoft bg-gradient-to-r from-hairPink/60 via-hairPurple/60 to-hairPrimary/70 shadow-glow";
      } else {
        btn.className =
          "whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold border border-slate-700 text-slate-200 bg-slate-900/70 hover:bg-slate-800/90 hover:border-hairPrimary/70 hover:text-hairSoft transition";
      }
    });
  }

  // Sync mobile select
  if (select && select.value !== String(index)) {
    select.value = String(index);
  }

  const m = months[index];

  content.innerHTML = `
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-[11px] uppercase tracking-wide text-slate-400">${m.phase}</p>
        <h3 class="text-base sm:text-lg font-semibold text-slate-50">${m.name}</h3>
        <p class="text-[11px] text-slate-300 mt-1">
          <span class="font-semibold text-hairSoft">Approx. length:</span> ${m.lengthNote}
        </p>
      </div>
      <div class="mt-1 sm:mt-0 bg-slate-950/60 border border-hairPrimary/50 rounded-2xl px-3 py-2 text-[11px] max-w-xs">
        <p class="font-semibold text-hairSoft mb-1">Focus This Month</p>
        <p class="text-slate-100">${m.focus}</p>
      </div>
    </div>
    <div class="mt-4">
      <h4 class="text-sm font-semibold mb-2 flex items-center gap-2 text-slate-50">
        <span class="text-base">📌</span> Monthly Tasks (Once per Month)
      </h4>
      <ul class="list-disc list-inside text-xs sm:text-sm text-slate-200 space-y-1">
        ${m.extras.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </div>
    <p class="mt-3 text-[11px] text-slate-400">
      Your <span class="font-semibold text-hairSoft">weekly routine stays the same</span>.
      These are just small extra check-ins layered on top.
    </p>
  `;

  updateMonthProgress(index);
}

/* ---------- Weekly Routine Cards & Today Badge ---------- */

function renderTodayBadge(weeklyRoutine) {
  const badge = document.getElementById("todayBadge");
  if (!badge) return;

  const todayEntry = weeklyRoutine.find((e) => e.day === todayName);

  if (!todayEntry) {
    badge.innerHTML = "";
    return;
  }

  badge.innerHTML = `
    <div class="inline-flex items-center gap-2 rounded-full bg-slate-900/80 border border-hairPrimary/60 px-3 py-1.5">
      <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="text-slate-200 text-xs">
        Today is <span class="font-semibold text-hairSoft">${todayEntry.day}</span> —
        <span class="font-semibold">${todayEntry.title}</span>
      </span>
    </div>
  `;
}

function renderWeeklyRoutine(weeklyRoutine) {
  const wrapper = document.getElementById("weeklyRoutineWrapper");
  if (!wrapper) return;

  wrapper.innerHTML = "";

  const isDetailed = viewMode === "detailed";

  weeklyRoutine.forEach((entry) => {
    const card = document.createElement("article");

    const isWashDay = !!entry.highlight;
    const isToday = entry.day === todayName;
    const emoji =
      entry.day === "Saturday"
        ? "🧴"
        : entry.day === "Tuesday"
        ? "💆🏽‍♀️"
        : entry.day === "Sunday"
        ? "🧘🏽‍♀️"
        : "✨";

    card.className = [
      "rounded-2xl border p-3 flex flex-col gap-2 text-xs sm:text-[13px]",
      "bg-slate-900/70 border-slate-800 shadow-sm hover:shadow-glow transition",
      isWashDay ? "bg-gradient-to-b from-hairPrimary/30 to-slate-900/80" : "",
      isToday ? "border-hairSoft shadow-glow" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const todayBadge = isToday
      ? '<span class="text-[10px] px-2 py-1 rounded-full bg-hairSoft text-slate-900 font-semibold border border-slate-900">Today</span>'
      : "";

    const washBadge = isWashDay
      ? '<span class="text-[10px] px-2 py-1 rounded-full bg-slate-950/70 border border-hairSoft text-hairSoft font-semibold">Wash Day</span>'
      : "";

    card.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div>
          <p class="text-[11px] uppercase tracking-wide text-slate-400 flex items-center gap-1">
            <span>${emoji}</span> ${entry.day}
          </p>
          <p class="font-semibold text-slate-50 mt-0.5">
            ${entry.title}
          </p>
        </div>
        <div class="flex flex-col items-end gap-1">
          ${todayBadge}
          ${washBadge}
        </div>
      </div>
      ${
        isDetailed
          ? `
        <ul class="mt-1 list-disc list-inside space-y-1 text-slate-200">
          ${entry.tasks.map((t) => `<li>${t}</li>`).join("")}
        </ul>
      `
          : `
        <p class="mt-1 text-slate-200">
          ${entry.tasks[0]}
        </p>
      `
      }
    `;

    wrapper.appendChild(card);
  });

  renderTodayBadge(weeklyRoutine);
}

/* ---------- View Mode Toggle ---------- */

function initViewToggle() {
  const simpleBtn = document.getElementById("viewSimpleBtn");
  const detailedBtn = document.getElementById("viewDetailedBtn");

  if (!simpleBtn || !detailedBtn) return;

  function updateButtons() {
    if (viewMode === "simple") {
      simpleBtn.className =
        "px-3 py-1 rounded-full bg-slate-50 text-slate-900 font-semibold shadow-sm";
      detailedBtn.className =
        "px-3 py-1 rounded-full text-slate-300 hover:text-hairSoft hover:bg-slate-800/80 transition";
    } else {
      detailedBtn.className =
        "px-3 py-1 rounded-full bg-slate-50 text-slate-900 font-semibold shadow-sm";
      simpleBtn.className =
        "px-3 py-1 rounded-full text-slate-300 hover:text-hairSoft hover:bg-slate-800/80 transition";
    }
  }

  simpleBtn.addEventListener("click", () => {
    viewMode = "simple";
    updateButtons();
    if (globalWeeklyRoutine.length) {
      renderWeeklyRoutine(globalWeeklyRoutine);
    }
  });

  detailedBtn.addEventListener("click", () => {
    viewMode = "detailed";
    updateButtons();
    if (globalWeeklyRoutine.length) {
      renderWeeklyRoutine(globalWeeklyRoutine);
    }
  });

  updateButtons();
}

/* ---------- Init ---------- */

loadHairData().then((data) => {
  if (!data) return;
  const { months, weeklyRoutine } = data;

  globalMonths = Array.isArray(months) ? months : [];
  globalWeeklyRoutine = Array.isArray(weeklyRoutine) ? weeklyRoutine : [];

  // Default to "simple" view on small screens so it feels lighter on phones
  if (window.innerWidth < 640) {
    viewMode = "simple";
  }

  if (globalMonths.length) {
    renderMonthTabs(globalMonths);
    setActiveMonth(globalMonths, 0); // start at Month 1
  }

  if (globalWeeklyRoutine.length) {
    initViewToggle();
    renderWeeklyRoutine(globalWeeklyRoutine);
  }
});
