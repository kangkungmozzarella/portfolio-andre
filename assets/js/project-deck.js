// Projects start as a pile. On wide screens a click spreads them across the
// table where they float; scrolling the pile out of view gathers them again.
// On narrow screens the pile stays and the top card is swiped away instead.
(() => {
  "use strict";
  const deck = document.querySelector(".project-deck");
  const stage = deck?.querySelector(".deck-stage");
  const cards = stage ? [...stage.querySelectorAll(".deck-card")] : [];
  if (!cards.length) return;
  const toggle = deck.querySelector(".deck-toggle");
  const toggleLabel = deck.querySelector(".deck-toggle-label");
  const count = deck.querySelector(".deck-count");
  const narrow = matchMedia("(max-width: 700px)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const total = cards.length;
  const noun = total === 1 ? "project" : "projects";

  // Fixed offsets keep the scatter looking thrown by hand, yet identical on
  // every visit. depth = how far a card follows the pointer.
  const scatter = [
    { x: -0.6, y: -0.5, r: -7, depth: 14 },
    { x: 0.4, y: 0.6, r: 5, depth: 24 },
    { x: 0.7, y: -0.7, r: -3, depth: 10 },
    { x: -0.5, y: 0.4, r: 8, depth: 20 },
    { x: 0.5, y: 0.2, r: -5, depth: 28 },
    { x: -0.2, y: -0.6, r: 4, depth: 16 },
  ];
  const pile = [
    { x: 0, y: 0, r: -2 },
    { x: 12, y: 8, r: 4 },
    { x: -14, y: 12, r: -6 },
    { x: 16, y: 18, r: 7 },
    { x: -8, y: 22, r: -9 },
  ];
  let spread = false;
  let order = cards.map((_, i) => i);

  deck.classList.add("deck-ready");
  cards.forEach((card, i) => {
    card.style.setProperty("--depth", scatter[i % scatter.length].depth);
    card.style.setProperty("--float-duration", `${5.2 + (i % 3) * 1.3}s`);
    card.style.setProperty("--float-delay", `${-i * 1.7}s`);
  });

  function place(card, x, y, r, z, delay = 0) {
    card.style.setProperty("--x", `${x.toFixed(1)}px`);
    card.style.setProperty("--y", `${y.toFixed(1)}px`);
    card.style.setProperty("--r", `${r}deg`);
    card.style.setProperty("--z", z);
    card.style.setProperty("--delay", `${delay}ms`);
  }

  function layoutTable() {
    const width = stage.clientWidth;
    const cardWidth = cards[0].offsetWidth;
    const cardHeight = Math.max(...cards.map((card) => card.offsetHeight));
    const cols = width >= 1000 ? 3 : 2;
    const rows = Math.ceil(total / cols);
    // One height for both states, so gathering the pile off-screen never
    // shifts the page under the reader.
    const height = Math.max(rows * (cardHeight * 0.9 + 36) + 70, cardHeight + 150);
    stage.style.height = `${Math.round(height)}px`;
    // While piled, the toggle sits right under the pile instead of at the
    // far bottom of the table.
    const controlsTop = spread ? height + 14 : height / 2 + cardHeight / 2 + 44;
    deck.style.setProperty("--controls-top", `${Math.round(controlsTop)}px`);
    const slots = cards.map((_, i) => {
      const s = scatter[i % scatter.length];
      const row = Math.floor(i / cols);
      const inRow = Math.min(cols, total - row * cols);
      const col = i - row * cols;
      const cell = width / cols;
      const margin = cardWidth / 2 + 12;
      let x = (col + 0.5 + (cols - inRow) / 2) * cell + s.x * 50;
      x = Math.min(width - margin, Math.max(margin, x));
      const y = 35 + (row + 0.5) * ((height - 70) / rows) + s.y * 22;
      return { x, y, r: s.r };
    });
    drawSlots(slots, width, height, cardWidth, cardHeight);
    cards.forEach((card, i) => {
      card.inert = !spread;
      card.style.setProperty("--s", 1);
      if (!spread) {
        const p = pile[i % pile.length];
        place(card, p.x, p.y, p.r, total - i, (total - 1 - i) * 35);
        return;
      }
      const { x, y, r } = slots[i];
      place(card, x - width / 2, y - height / 2, r, total - i, i * 70);
    });
  }

  // Outlines of where each card will land, with a thread back to the pile.
  // They fill the empty table while piled and explain what spreading does.
  const svgNS = "http://www.w3.org/2000/svg";
  const slotLayer = document.createElementNS(svgNS, "svg");
  slotLayer.setAttribute("class", "deck-slots");
  slotLayer.setAttribute("aria-hidden", "true");
  stage.prepend(slotLayer);
  let slotKey = "";
  function drawSlots(slots, width, height, cardWidth, cardHeight) {
    const key = [width, height, cardWidth, cardHeight].map(Math.round).join();
    if (key === slotKey) return;
    slotKey = key;
    slotLayer.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const cx = width / 2;
    const cy = height / 2;
    slotLayer.innerHTML = slots
      .map(({ x, y, r }, i) => {
        // Bend each thread away from the straight line so they fan out.
        const bend = (i % 2 ? 1 : -1) * 60;
        const mx = (cx + x) / 2 + bend;
        const my = (cy + y) / 2 - Math.abs(bend) / 2;
        const n = String(i + 1).padStart(2, "0");
        return `<path class="deck-thread" pathLength="1" style="--i:${i}" d="M${cx} ${cy} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}"/>
<g class="deck-slot" style="--i:${i}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r})"><rect x="${-cardWidth / 2}" y="${-cardHeight / 2}" width="${cardWidth}" height="${cardHeight}" rx="12"/><text x="${-cardWidth / 2 + 18}" y="${-cardHeight / 2 + 30}">${n}</text></g>`;
      })
      .join("");
  }

  function layoutSwipe() {
    const cardHeight = Math.max(...cards.map((card) => card.offsetHeight));
    stage.style.height = `${Math.round(cardHeight + 70)}px`;
    deck.style.setProperty("--controls-top", `${Math.round(cardHeight + 70)}px`);
    order.forEach((index, depth) => {
      const card = cards[index];
      const p = pile[depth % pile.length];
      card.inert = depth !== 0;
      card.classList.toggle("is-top", depth === 0);
      card.style.setProperty("--s", Math.max(0.8, 1 - depth * 0.05).toFixed(2));
      card.style.setProperty("--o", depth > 2 ? 0 : 1);
      place(card, 0, depth * 14 - 28, depth ? p.r * 0.6 : 0, total - depth);
    });
    count.textContent = `${order[0] + 1} / ${total}`;
  }

  function layout() {
    if (narrow.matches) layoutSwipe();
    else layoutTable();
  }

  function setSpread(next) {
    spread = next && !narrow.matches;
    deck.dataset.state = spread ? "spread" : "stacked";
    toggle.setAttribute("aria-expanded", String(spread));
    toggleLabel.textContent = spread
      ? "Stack them again"
      : `Spread the ${total} ${noun}`;
    if (!spread) resetPointer();
    layout();
  }

  toggle.addEventListener("click", () => setSpread(!spread));
  stage.addEventListener("click", (event) => {
    if (!spread && !narrow.matches && !event.target.closest(".deck-card"))
      setSpread(true);
  });

  // Gather the cards once the reader has moved on to another section.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      // Slot outlines draw in and animate only while the table is on screen.
      deck.classList.toggle("in-view", entry.isIntersecting);
      if (!entry.isIntersecting && spread) setSpread(false);
    }).observe(stage);
  }

  // Spread cards drift slightly toward the pointer, the nearer ones further.
  let pointerFrame = 0;
  let pointer = { x: 0, y: 0 };
  function resetPointer() {
    pointer = { x: 0, y: 0 };
    stage.style.setProperty("--mx", 0);
    stage.style.setProperty("--my", 0);
  }
  stage.addEventListener("pointermove", (event) => {
    if (!spread || reduced.matches || event.pointerType !== "mouse") return;
    const box = stage.getBoundingClientRect();
    pointer = {
      x: ((event.clientX - box.left) / box.width) * 2 - 1,
      y: ((event.clientY - box.top) / box.height) * 2 - 1,
    };
    if (!pointerFrame)
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        stage.style.setProperty("--mx", pointer.x.toFixed(3));
        stage.style.setProperty("--my", pointer.y.toFixed(3));
      });
  });
  stage.addEventListener("pointerleave", resetPointer);

  // Narrow screens: swipe the top card away, or use the arrow buttons.
  function cycle(step) {
    const top = cards[order[0]];
    order = step > 0 ? [...order.slice(1), order[0]] : [order.at(-1), ...order.slice(0, -1)];
    top.style.setProperty("--drag", "0px");
    top.style.setProperty("--drag-r", "0deg");
    layoutSwipe();
  }
  deck.querySelector(".deck-next").addEventListener("click", () => cycle(1));
  deck.querySelector(".deck-prev").addEventListener("click", () => cycle(-1));

  let drag = null;
  let suppressClick = false;
  stage.addEventListener("pointerdown", (event) => {
    const card = event.target.closest(".deck-card");
    if (!narrow.matches || card !== cards[order[0]]) return;
    drag = { card, id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, active: false };
  });
  stage.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
        drag = null; // vertical intent: let the page scroll
        return;
      }
      if (Math.abs(dx) < 8) return;
      drag.active = true;
      drag.card.setPointerCapture(event.pointerId);
      drag.card.classList.add("is-dragging");
    }
    drag.dx = dx;
    drag.card.style.setProperty("--drag", `${dx}px`);
    drag.card.style.setProperty("--drag-r", `${(dx / 18).toFixed(1)}deg`);
  });
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const { card, active, dx } = drag;
    drag = null;
    if (!active) return;
    card.classList.remove("is-dragging");
    // The release that ends a swipe must not also open the gallery.
    suppressClick = true;
    setTimeout(() => (suppressClick = false), 0);
    if (Math.abs(dx) > 70) cycle(dx < 0 ? 1 : -1);
    else {
      card.style.setProperty("--drag", "0px");
      card.style.setProperty("--drag-r", "0deg");
    }
  }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    },
    true,
  );

  narrow.addEventListener("change", () => {
    cards.forEach((card) => {
      card.classList.remove("is-top");
      card.style.removeProperty("--o");
    });
    setSpread(false);
  });
  reduced.addEventListener("change", resetPointer);
  window.addEventListener("resize", layout, { passive: true });
  document.fonts?.ready.then(layout);
  setSpread(false);
})();
