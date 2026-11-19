/* ============================================================
   Кафедра ВТ ИКТИБ ЮФУ — общий скрипт для всех страниц
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Тема ---------- */
  const THEME_KEY = "vt-theme";
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(theme === "dark"));
      btn.setAttribute("aria-label", theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему");
    });
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { saved = null; }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));

    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* приватный режим */ }
      });
    });
  }

  /* ---------- Мобильное меню ---------- */
  function initNav() {
    const toggle = document.getElementById("navToggle");
    const nav = document.getElementById("mainNav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest(".nav-link") && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- Тень шапки при скролле + кнопка «Наверх» ---------- */
  function initScrollUi() {
    const header = document.querySelector(".site-header");
    const toTop = document.querySelector(".to-top");

    const onScroll = () => {
      const y = window.scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 8);
      if (toTop) toTop.classList.toggle("is-visible", y > 600);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      });
    }
  }

  /* ---------- Появление блоков при скролле ---------- */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    items.forEach((el) => observer.observe(el));
  }

  /* ---------- Счётчики ---------- */
  function initCounters() {
    const counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;

    const run = (el) => {
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      if (reduceMotion) {
        el.textContent = target + suffix;
        return;
      }
      const duration = 1100;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!("IntersectionObserver" in window)) {
      counters.forEach(run);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach((el) => observer.observe(el));
  }

  /* ---------- Частицы в hero ---------- */
  function initHeroCanvas() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas || reduceMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dots = [];
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(70, Math.round((width * height) / 18000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.7
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < dots.length; i++) {
        const a = dots[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > width) a.vx *= -1;
        if (a.y < 0 || a.y > height) a.vy *= -1;

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 212, 255, 0.55)";
        ctx.fill();

        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 130) continue;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = "rgba(0, 212, 255, " + (0.16 * (1 - dist / 130)).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 180);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(draw);
      }
    });
  }

  /* ---------- Курсор-«прожектор» и параллакс hero ---------- */
  function initPointerFx() {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    // Параллакс: заголовок и карточки фактов чуть смещаются за курсором
    const layers = [
      { el: hero.querySelector(".hero-inner > div"), depth: 10 },
      { el: hero.querySelector(".hero-facts"), depth: 18 }
    ].filter((layer) => layer.el);

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;
    let running = false;

    const render = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      layers.forEach((layer) => {
        layer.el.style.transform =
          "translate3d(" + (currentX * layer.depth).toFixed(2) + "px, " +
          (currentY * layer.depth).toFixed(2) + "px, 0)";
      });

      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        raf = requestAnimationFrame(render);
      } else {
        running = false;
      }
    };

    const kick = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(render);
    };

    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Позиция «прожектора» для CSS-подсветки
      hero.style.setProperty("--mx", x.toFixed(1) + "px");
      hero.style.setProperty("--my", y.toFixed(1) + "px");

      if (reduceMotion) return;
      targetX = x / rect.width - 0.5;
      targetY = y / rect.height - 0.5;
      kick();
    });

    hero.addEventListener("pointerleave", () => {
      targetX = 0;
      targetY = 0;
      kick();
    });

    window.addEventListener("pagehide", () => cancelAnimationFrame(raf));
  }

  /* ---------- Пасхалка: уточка ---------- */
  function initDuck() {
    const trigger = document.getElementById("duckTrigger");
    const popover = document.getElementById("duckPopover");
    if (!trigger || !popover) return;

    const hide = () => {
      popover.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    };

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const willShow = popover.hidden;
      popover.hidden = !willShow;
      trigger.setAttribute("aria-expanded", String(willShow));
    });

    document.addEventListener("click", (event) => {
      if (!popover.hidden && !popover.contains(event.target)) hide();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !popover.hidden) {
        hide();
        trigger.focus();
      }
    });
  }

  /* ---------- Преподаватели: поиск, фильтр, модалка ---------- */
  function initTeachers() {
    const grid = document.getElementById("teacherGrid");
    if (!grid || typeof TEACHERS === "undefined") return;

    const empty = document.getElementById("teacherEmpty");
    const countEl = document.getElementById("resultCount");
    const chips = Array.from(document.querySelectorAll(".chip"));
    const searchInput = document.getElementById("teacherSearch");
    const searchClear = document.getElementById("searchClear");
    const modal = document.getElementById("teacherModal");
    const modalBody = document.getElementById("teacherModalBody");

    let activeFilter = "all";
    let query = "";
    let lastFocused = null;

    const initials = (name) => name.split(" ").filter(Boolean).slice(0, 2)
      .map((part) => part[0].toUpperCase()).join("");

    // Фото есть не у всех: если поле photo не задано — показываем инициалы.
    const avatar = (teacher, extraClass = "") => teacher.photo
      ? `<span class="avatar avatar-photo ${extraClass}"><img src="${escapeHtml(teacher.photo)}" alt="${escapeHtml(teacher.name)}" loading="lazy" decoding="async" width="120" height="120"></span>`
      : `<span class="avatar ${extraClass}" aria-hidden="true">${escapeHtml(initials(teacher.name))}</span>`;

    const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));

    const normalize = (value) => String(value || "").toLowerCase().replace(/ё/g, "е").trim();

    const matches = (teacher, needle) => {
      if (!needle) return true;
      const haystack = normalize([teacher.name, teacher.role, teacher.degree, teacher.focus, teacher.courses, teacher.email].join(" "));
      return needle.split(/\s+/).every((word) => haystack.includes(word));
    };

    const render = () => {
      const needle = normalize(query);
      const list = TEACHERS.filter((t) =>
        (activeFilter === "all" || t.category === activeFilter) && matches(t, needle)
      );

      grid.innerHTML = list.map((t) => `
        <button type="button" class="teacher-card" data-index="${TEACHERS.indexOf(t)}" aria-haspopup="dialog">
          <span class="teacher-top">
            ${avatar(t)}
            <span>
              <span class="teacher-name">${escapeHtml(t.name)}</span><br>
              <span class="teacher-role">${escapeHtml(t.role)}</span>
            </span>
          </span>
          ${t.degree ? `<span class="teacher-degree">${escapeHtml(t.degree)}</span>` : ""}
          ${t.focus ? `<span class="teacher-focus">${escapeHtml(t.focus)}</span>` : ""}
          <span class="teacher-contacts">
            <span>${escapeHtml(t.email)}</span>
            ${t.room ? `<span>каб. ${escapeHtml(t.room)}</span>` : ""}
            ${t.phone ? `<span>${escapeHtml(t.phone)}</span>` : ""}
          </span>
        </button>
      `).join("");

      if (empty) empty.hidden = list.length > 0;
      if (countEl) {
        countEl.textContent = list.length
          ? `Найдено: ${list.length} из ${TEACHERS.length}`
          : "";
      }
    };

    const openModal = (teacher, trigger) => {
      if (!modal || !modalBody) return;
      lastFocused = trigger || null;

      const rows = [
        ["Должность", teacher.role],
        ["Учёная степень", teacher.degree],
        ["Научное направление", teacher.focus],
        ["Курсы", teacher.courses],
        ["Аудитория", teacher.room],
        ["Телефон", teacher.phone],
        ["E-mail", teacher.email]
      ].filter((row) => row[1]);

      modalBody.innerHTML = `
        <div class="modal-head">
          ${avatar(teacher)}
          <div>
            <h2 class="modal-name" id="teacherModalTitle">${escapeHtml(teacher.name)}</h2>
            <p class="modal-role">${escapeHtml(teacher.role)}</p>
          </div>
        </div>
        <ul class="modal-list">
          ${rows.map(([k, v]) => `<li><span class="k">${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></li>`).join("")}
        </ul>
        <div class="modal-actions">
          ${teacher.profileUrl 
            ? `<a class="btn btn-primary btn-sm" href="${escapeHtml(teacher.profileUrl)}" target="_blank" rel="noopener">Профиль на сайте ЮФУ</a>` 
            : `<span class="muted" style="font-size:0.9rem">Ссылка на профиль пока не добавлена</span>`
          }
        </div>
      `;

      modal.hidden = false;
      document.body.style.overflow = "hidden";
      const closeBtn = modal.querySelector(".modal-close");
      if (closeBtn) closeBtn.focus();
    };

    const closeModal = () => {
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    };

    grid.addEventListener("click", (event) => {
      const card = event.target.closest(".teacher-card");
      if (!card) return;
      const teacher = TEACHERS[Number(card.dataset.index)];
      if (teacher) openModal(teacher, card);
    });

    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal || event.target.closest(".modal-close")) closeModal();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeModal();
      });
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => {
          c.classList.remove("is-active");
          c.setAttribute("aria-pressed", "false");
        });
        chip.classList.add("is-active");
        chip.setAttribute("aria-pressed", "true");
        activeFilter = chip.dataset.filter;
        render();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        query = searchInput.value;
        if (searchClear) searchClear.hidden = query.length === 0;
        render();
      });

      searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          searchInput.value = "";
          query = "";
          if (searchClear) searchClear.hidden = true;
          render();
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener("click", () => {
        searchInput.value = "";
        query = "";
        searchClear.hidden = true;
        searchInput.focus();
        render();
      });
    }

    render();
  }

  /* ---------- Старт ---------- */
  initTheme();
  initNav();
  initScrollUi();
  initReveal();
  initCounters();
  initHeroCanvas();
  initPointerFx();
  initDuck();
  initTeachers();
})();
