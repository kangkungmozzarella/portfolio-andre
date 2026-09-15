(() => {
  "use strict";
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector(".site-header");
  let scrollPending = false;
  function updateHeader() {
    header.classList.toggle("scrolled", window.scrollY > 24);
    scrollPending = false;
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!scrollPending) {
        scrollPending = true;
        requestAnimationFrame(updateHeader);
      }
    },
    { passive: true },
  );
  updateHeader();

  // Keep content visible by default; enhance only when observation is available.
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    document
      .querySelectorAll(".reveal")
      .forEach((el) => revealObserver.observe(el));
    if (!motion.matches)
      document.documentElement.classList.add("motion-enabled");
    motion.addEventListener("change", (event) => {
      document.documentElement.classList.toggle(
        "motion-enabled",
        !event.matches,
      );
    });

    const navLinks = [...document.querySelectorAll(".site-header nav a")];
    const sections = [...document.querySelectorAll("main > section")];
    const visibleSections = new Set();
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.isIntersecting
            ? visibleSections.add(entry.target)
            : visibleSections.delete(entry.target);
        });
        const current = sections.find((section) =>
          visibleSections.has(section),
        );
        navLinks.forEach((link) => {
          if (current && link.hash === "#" + current.id)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-15% 0px -50% 0px" },
    );
    sections.forEach((section) => sectionObserver.observe(section));
  }

  function updateTime() {
    const now = new Date();
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = now.getFullYear();
    });
    document.querySelector(".local-time").textContent = new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          document.querySelector(".local-time").dataset.timezone ||
          "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
    ).format(now);
  }
  updateTime();
  setInterval(updateTime, 60000);

  // Animate the measured height in both directions while retaining native
  // summary keyboard support and a usable details element without JavaScript.
  const experiencePanels = new Map();
  document.querySelectorAll(".experience-row").forEach((row) => {
    const summary = row.querySelector("summary");
    let expanded = row.open;
    let animation = null;

    function settle() {
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
        animation = null;
      }
      row.open = expanded;
      row.dataset.expanded = String(expanded);
      row.style.removeProperty("height");
      row.style.removeProperty("overflow");
    }

    function setExpanded(nextExpanded) {
      if (expanded === nextExpanded) return;
      expanded = nextExpanded;
      if (motion.matches || typeof row.animate !== "function") {
        settle();
        return;
      }

      // Read the current animated height before cancelling so rapid clicks
      // reverse from the current position instead of jumping to an endpoint.
      const from = row.getBoundingClientRect().height;
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
      }
      row.style.removeProperty("height");
      row.open = true;
      row.dataset.expanded = String(expanded);
      const border = parseFloat(getComputedStyle(row).borderBottomWidth);
      const to = expanded
        ? row.getBoundingClientRect().height
        : summary.getBoundingClientRect().height + border;
      row.style.height = `${from}px`;
      row.style.overflow = "clip";
      animation = row.animate(
        { height: [`${from}px`, `${to}px`] },
        { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
      animation.onfinish = settle;
    }

    experiencePanels.set(row, setExpanded);
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      const nextExpanded = !expanded;
      if (nextExpanded) {
        experiencePanels.forEach((setOtherExpanded, otherRow) => {
          if (otherRow !== row && otherRow.parentElement === row.parentElement) {
            setOtherExpanded(false);
          }
        });
      }
      setExpanded(nextExpanded);
    });

    window.addEventListener("resize", () => {
      if (animation) settle();
    });
    motion.addEventListener("change", () => {
      if (motion.matches) settle();
    });
  });

  // One native dialog provides focus trapping, Escape, and focus restoration.
  const dialog = document.querySelector(".project-dialog");
  const content = dialog.querySelector(".dialog-content");
  const controls = dialog.querySelector(".gallery-controls");
  const count = dialog.querySelector(".gallery-count");
  let images = [];
  let imageIndex = 0;
  function showImage(index) {
    if (!images.length) return;
    imageIndex = (index + images.length) % images.length;
    images.forEach((image, i) => {
      image.hidden = i !== imageIndex;
    });
    count.textContent = `${imageIndex + 1} / ${images.length}`;
  }
  document.querySelectorAll("[data-detail]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      const template = document.getElementById(
        "detail-" + trigger.dataset.detail,
      );
      if (!template || typeof dialog.showModal !== "function") return;
      event.preventDefault();
      content.replaceChildren(template.content.cloneNode(true));
      content.querySelector("h2").id = "dialog-title";
      images = [...content.querySelectorAll(".gallery-images img")];
      controls.hidden = images.length < 2;
      showImage(0);
      dialog.showModal();
      document.body.classList.add("dialog-open");
      dialog.scrollTop = 0;
      dialog.querySelector(".dialog-close").focus({ preventScroll: true });
    });
  });
  dialog
    .querySelector(".dialog-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () =>
    document.body.classList.remove("dialog-open"),
  );
  let startedOnBackdrop = false;
  function outsideDialog(event) {
    const box = dialog.getBoundingClientRect();
    return (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    );
  }
  dialog.addEventListener("pointerdown", (event) => {
    startedOnBackdrop = outsideDialog(event);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && startedOnBackdrop && outsideDialog(event))
      dialog.close();
    startedOnBackdrop = false;
  });
  dialog
    .querySelector(".gallery-prev")
    .addEventListener("click", () => showImage(imageIndex - 1));
  dialog
    .querySelector(".gallery-next")
    .addEventListener("click", () => showImage(imageIndex + 1));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showImage(imageIndex + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
})();
