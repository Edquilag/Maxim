// SwiftPadala static prototype state and screen behavior.
const screens = [...document.querySelectorAll(".screen")];
const bottomNav = document.getElementById("bottomNav");
const toast = document.getElementById("toast");

const services = {
  ride: { label: "Motorcycle Ride", icon: "🏍️", base: 45, perKm: 12, extra: 0 },
  parcel: { label: "Parcel Delivery", icon: "📦", base: 55, perKm: 10, extra: 15 },
  pabili: { label: "Food / Pabili", icon: "🛒", base: 60, perKm: 11, extra: 25 },
  grocery: { label: "Grocery", icon: "🥬", base: 70, perKm: 13, extra: 35 },
};

const riders = [
  { name: "Juan Reyes", avatar: "JR", rating: "4.9", vehicle: "Yamaha Mio", plate: "KAA 4821" },
  { name: "Carlo Mendoza", avatar: "CM", rating: "4.8", vehicle: "Honda Click", plate: "NDB 1946" },
  { name: "Paolo Santos", avatar: "PS", rating: "5.0", vehicle: "Suzuki Burgman", plate: "KBC 7302" },
];

const defaultOrders = [
  {
    service: "Food / Pabili",
    date: "May 7, 2026",
    pickup: "Ayala Center Cebu",
    dropoff: "Lahug, Cebu City",
    fare: 132,
    status: "Delivered",
  },
  {
    service: "Motorcycle Ride",
    date: "May 5, 2026",
    pickup: "SM Lanang Premier",
    dropoff: "Roxas Ave, Davao",
    fare: 88,
    status: "Completed",
  },
  {
    service: "Parcel Delivery",
    date: "May 2, 2026",
    pickup: "BGC, Taguig",
    dropoff: "Ermita, Manila",
    fare: 156,
    status: "Delivered",
  },
];

const transactions = [
  ["Ride payment", "-₱88.00", "May 5"],
  ["Wallet top up", "+₱500.00", "May 3"],
  ["Promo reward", "+₱40.00", "May 1"],
];

const state = {
  selectedService: "parcel",
  selectedPayment: "Cash",
  distance: 4.8,
  fare: 0,
  currentBooking: null,
  matchingTimer: null,
  progressTimer: null,
  timelineIndex: 1,
};

function getOrders() {
  const stored = localStorage.getItem("swiftpadalaOrders");
  return stored ? JSON.parse(stored) : defaultOrders;
}

function saveOrders(orders) {
  localStorage.setItem("swiftpadalaOrders", JSON.stringify(orders));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function showScreen(id) {
  screens.forEach((screen) => screen.classList.toggle("active", screen.id === id));
  const navScreens = ["home", "orders", "wallet", "profile", "booking", "tracking"];
  bottomNav.classList.toggle("visible", navScreens.includes(id));

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.tab === id);
  });

  if (id === "orders") renderOrders();
  if (id === "home") renderHomeRecent();
}

function formatPeso(value) {
  return `₱${Math.round(value).toLocaleString("en-PH")}`;
}

function calculateFare() {
  const service = services[state.selectedService];
  const itemDetails = document.getElementById("itemDetails").value.trim();
  const itemBoost = itemDetails.length > 25 && state.selectedService !== "ride" ? 12 : 0;
  state.distance = Number((3.2 + state.selectedService.length * 0.38 + itemDetails.length * 0.015).toFixed(1));
  state.fare = service.base + service.perKm * state.distance + service.extra + itemBoost;

  document.getElementById("estimatedFare").textContent = formatPeso(state.fare);
  document.getElementById("mockDistance").textContent = `${state.distance.toFixed(1)} km`;
  document.getElementById("pickupTime").textContent = `${Math.max(4, Math.round(state.distance + 2))} min`;
}

function renderServiceSelector() {
  const selector = document.getElementById("serviceSelector");
  selector.innerHTML = Object.entries(services)
    .map(([key, service]) => {
      const active = key === state.selectedService ? "active" : "";
      return `<button class="chip ${active}" type="button" data-service-choice="${key}">${service.icon} ${service.label}</button>`;
    })
    .join("");
}

function setService(serviceKey) {
  state.selectedService = serviceKey;
  renderServiceSelector();
  const itemGroup = document.getElementById("itemFieldGroup");
  itemGroup.style.display = serviceKey === "ride" ? "none" : "block";
  calculateFare();
}

function renderHomeRecent() {
  const recent = getOrders().slice(0, 2);
  const container = document.getElementById("homeRecent");
  container.innerHTML = recent.length
    ? recent.map(orderCardTemplate).join("")
    : `<div class="empty-state">No recent trips yet. Your first SwiftPadala booking will appear here.</div>`;
}

function orderCardTemplate(order) {
  return `
    <article class="activity-card">
      <div class="service-icon yellow">${serviceIconByLabel(order.service)}</div>
      <div>
        <h4>${order.service}</h4>
        <p>${order.pickup} → ${order.dropoff}</p>
        <p>${order.date} · ${order.status}</p>
      </div>
      <strong>${formatPeso(order.fare)}</strong>
    </article>
  `;
}

function serviceIconByLabel(label) {
  return Object.values(services).find((service) => service.label === label)?.icon || "🚚";
}

function renderOrders() {
  const orders = getOrders();
  const list = document.getElementById("ordersList");
  list.innerHTML = orders.length
    ? orders.map(orderCardTemplate).join("")
    : `<div class="empty-state">No saved orders yet. Book a ride or delivery to start your activity list.</div>`;
}

function renderTransactions() {
  document.getElementById("transactionList").innerHTML = transactions
    .map(([name, amount, date]) => `<div class="list-row"><span>${name}</span><strong>${amount} · ${date}</strong></div>`)
    .join("");
}

function beginMatching() {
  const pickup = document.getElementById("pickup").value.trim();
  const dropoff = document.getElementById("dropoff").value.trim();
  const itemDetails = document.getElementById("itemDetails").value.trim();
  const service = services[state.selectedService];

  state.currentBooking = {
    service: service.label,
    pickup,
    dropoff,
    itemDetails,
    payment: state.selectedPayment,
    distance: state.distance,
    fare: state.fare,
    date: new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
    status: "In progress",
  };

  document.getElementById("matchingDetail").textContent = `Searching ${state.distance.toFixed(1)} km route to ${dropoff}.`;
  showScreen("matching");
  showToast("Booking request sent");

  window.clearTimeout(state.matchingTimer);
  state.matchingTimer = window.setTimeout(assignRider, 3600);
}

function assignRider() {
  const rider = riders[Math.floor(Math.random() * riders.length)];
  const booking = state.currentBooking;
  if (!booking) return;

  document.querySelector(".avatar").textContent = rider.avatar;
  document.getElementById("riderName").textContent = rider.name;
  document.getElementById("riderMeta").textContent = `⭐ ${rider.rating} · ${rider.vehicle} · ${rider.plate}`;
  document.getElementById("eta").textContent = `${Math.round(booking.distance + 9)} minutes`;
  document.getElementById("trackingRoute").textContent = `${booking.pickup} → ${booking.dropoff}`;
  document.getElementById("summaryService").textContent = booking.service;
  document.getElementById("summaryDistance").textContent = `${booking.distance.toFixed(1)} km`;
  document.getElementById("summaryPayment").textContent = booking.payment;
  document.getElementById("summaryFare").textContent = formatPeso(booking.fare);

  state.timelineIndex = 1;
  renderTimeline();
  storeCurrentBooking("Rider assigned");
  showScreen("tracking");
  showToast(`${rider.name} accepted your booking`);

  window.clearInterval(state.progressTimer);
  state.progressTimer = window.setInterval(() => {
    if (!document.getElementById("tracking").classList.contains("active")) return;
    state.timelineIndex = Math.min(4, state.timelineIndex + 1);
    renderTimeline();
    if (state.timelineIndex === 4) {
      storeCurrentBooking("Delivered");
      window.clearInterval(state.progressTimer);
    }
  }, 5200);
}

function renderTimeline() {
  const steps = ["Booking confirmed", "Rider assigned", "Picked up", "On the way", "Delivered"];
  document.getElementById("timeline").innerHTML = steps
    .map((step, index) => {
      const className = index < state.timelineIndex ? "done" : index === state.timelineIndex ? "active" : "";
      const note = index <= state.timelineIndex ? "Updated just now" : "Pending";
      return `
        <div class="timeline-step ${className}">
          <div class="dot">${index < state.timelineIndex ? "✓" : index + 1}</div>
          <div><strong>${step}</strong><span>${note}</span></div>
        </div>
      `;
    })
    .join("");
}

function storeCurrentBooking(status) {
  if (!state.currentBooking) return;
  const orders = getOrders();
  const saved = { ...state.currentBooking, status };
  saveOrders([saved, ...orders.filter((order) => order.date + order.dropoff !== saved.date + saved.dropoff)].slice(0, 12));
  renderHomeRecent();
}

function cancelBooking() {
  window.clearTimeout(state.matchingTimer);
  window.clearInterval(state.progressTimer);
  if (state.currentBooking) {
    state.currentBooking.status = "Cancelled";
    storeCurrentBooking("Cancelled");
  }
  state.currentBooking = null;
  showScreen("home");
  showToast("Booking cancelled");
}

function initEvents() {
  document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const phone = document.getElementById("phoneInput").value.replace(/\D/g, "");
    const error = document.getElementById("loginError");
    if (phone.length !== 10 || !phone.startsWith("9")) {
      error.textContent = "Enter a valid Philippine mobile number starting with 9.";
      return;
    }
    error.textContent = "";
    localStorage.setItem("swiftpadalaPhone", phone);
    showScreen("home");
    showToast("Welcome back to SwiftPadala");
  });

  document.addEventListener("click", (event) => {
    const screenButton = event.target.closest("[data-screen]");
    const serviceButton = event.target.closest("[data-service]");
    const toastButton = event.target.closest("[data-toast]");
    const tabButton = event.target.closest("[data-tab]");
    const serviceChoice = event.target.closest("[data-service-choice]");
    const paymentChoice = event.target.closest("[data-payment]");

    if (serviceButton) setService(serviceButton.dataset.service);
    if (screenButton) showScreen(screenButton.dataset.screen);
    if (toastButton) showToast(toastButton.dataset.toast);
    if (tabButton) showScreen(tabButton.dataset.tab);
    if (serviceChoice) setService(serviceChoice.dataset.serviceChoice);
    if (paymentChoice) {
      state.selectedPayment = paymentChoice.dataset.payment;
      document.querySelectorAll("[data-payment]").forEach((button) => button.classList.toggle("active", button === paymentChoice));
      calculateFare();
    }
  });

  document.getElementById("bookingForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const pickup = document.getElementById("pickup").value.trim();
    const dropoff = document.getElementById("dropoff").value.trim();
    const error = document.getElementById("bookingError");

    if (pickup.length < 4 || dropoff.length < 4) {
      error.textContent = "Add a clear pickup and drop-off location.";
      return;
    }
    if (state.selectedService !== "ride" && document.getElementById("itemDetails").value.trim().length < 3) {
      error.textContent = "Add item details so the rider knows what to handle.";
      return;
    }
    error.textContent = "";
    beginMatching();
  });

  document.getElementById("itemDetails").addEventListener("input", calculateFare);
  document.getElementById("dropoff").addEventListener("input", calculateFare);
  document.getElementById("cancelBookingBtn").addEventListener("click", cancelBooking);

  document.getElementById("clearOrdersBtn").addEventListener("click", () => {
    saveOrders([]);
    renderOrders();
    renderHomeRecent();
    showToast("Activity cleared");
  });

  document.getElementById("darkToggle").addEventListener("change", (event) => {
    document.body.classList.toggle("dark", event.target.checked);
    localStorage.setItem("swiftpadalaDark", event.target.checked ? "1" : "0");
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    showScreen("auth");
    showToast("Logged out");
  });
}

function boot() {
  renderServiceSelector();
  renderTransactions();
  renderHomeRecent();
  renderOrders();
  setService(state.selectedService);

  const dark = localStorage.getItem("swiftpadalaDark") === "1";
  document.body.classList.toggle("dark", dark);
  document.getElementById("darkToggle").checked = dark;

  initEvents();
  window.setTimeout(() => {
    const hasPhone = localStorage.getItem("swiftpadalaPhone");
    showScreen(hasPhone ? "home" : "auth");
  }, 1400);
}

boot();
