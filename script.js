// Datos base de películas. Incluyen nombre, horarios, precio en quetzales y poster.
const movies = [
  {
    id: "movie1",
    title: "Burbujas",
    schedules: ["12:45", "15:30", "18:10"],
    priceGTQ: 42,
    poster: "https://upload.wikimedia.org/wikipedia/en/thumb/0/06/Bubble_film_poster.jpg/250px-Bubble_film_poster.jpg"
  },
  {
    id: "movie2",
    title: "Grandes espias",
    schedules: ["13:00", "16:20", "20:40"],
    priceGTQ: 48,
    poster: "https://upload.wikimedia.org/wikipedia/en/thumb/2/26/My_Spy_poster.jpg/250px-My_Spy_poster.jpg"
  },
  {
    id: "movie3",
    title: "Inu-oh: la pelicula",
    schedules: ["14:10", "17:45", "21:00"],
    priceGTQ: 50,
    poster: "https://upload.wikimedia.org/wikipedia/en/thumb/5/51/Inu-Oh_Poster.jpg/250px-Inu-Oh_Poster.jpg"
  },
  {
    id: "movie4",
    title: "The Adam Project",
    schedules: ["12:30", "16:00", "19:30"],
    priceGTQ: 46,
    poster: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d7/The_Adam_Project_poster.png/250px-The_Adam_Project_poster.png"
  },
  {
    id: "movie5",
    title: "Lo que le falta a esta estrella",
    schedules: ["11:50", "15:10", "18:50"],
    priceGTQ: 44,
    poster: "https://upload.wikimedia.org/wikipedia/en/thumb/7/74/Lost_in_Starlight_teaser_poster.jpg/250px-Lost_in_Starlight_teaser_poster.jpg"
  },
  {
    id: "movie6",
    title: "Monkey Man: El despertar",
    schedules: ["14:40", "18:00", "21:20"],
    priceGTQ: 56,
    poster: "https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Monkey_Man_film.jpg/250px-Monkey_Man_film.jpg"
  },
  {
    id: "movie7",
    title: "Amigos imaginarios",
    schedules: ["12:10", "15:40", "19:10"],
    priceGTQ: 43,
    poster: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/IF_%28film%29_poster_2.jpg/250px-IF_%28film%29_poster_2.jpg"
  }
];

// Tipo de cambio fijo para conversión rápida de GTQ a USD.
const USD_RATE = 7.8;
const ROWS = "ABCDEFGH".split("");
const COLS = 10;

// Estado global de la app: selección actual, asientos por función y reserva confirmada.
const state = {
  selectedMovieId: null,
  selectedSchedule: null,
  selectedSeats: [],
  currency: "GTQ",
  bookingsByShow: {},
  confirmedReservation: null
};

// Referencias a elementos del DOM.
const movieGrid = document.getElementById("movieGrid");
const seatMap = document.getElementById("seatMap");
const summaryContent = document.getElementById("summaryContent");
const paymentAmount = document.getElementById("paymentAmount");
const currencySelect = document.getElementById("currency");
const paymentForm = document.getElementById("paymentForm");
const cancelBtn = document.getElementById("cancelBtn");
const pdfBtn = document.getElementById("pdfBtn");
const themeToggle = document.getElementById("themeToggle");

// Convierte una cantidad en quetzales a la moneda activa.
function formatMoney(gtqValue, currency = state.currency) {
  if (currency === "USD") {
    return `$ ${(gtqValue / USD_RATE).toFixed(2)}`;
  }
  return `Q ${gtqValue.toFixed(2)}`;
}

// Muestra ambas monedas para que el usuario vea equivalencia GTQ/USD.
function dualPriceText(gtqValue) {
  return `Q ${gtqValue.toFixed(2)} / $ ${(gtqValue / USD_RATE).toFixed(2)}`;
}

// Obtiene la película seleccionada actualmente.
function getSelectedMovie() {
  return movies.find((m) => m.id === state.selectedMovieId) || null;
}

// Identificador único de función (película + horario) para separar reservas.
function getShowKey(movieId, schedule) {
  return `${movieId}__${schedule}`;
}

// Genera asientos ocupados de ejemplo, de forma determinística, para simular funciones con demanda.
function createInitialOccupiedSeats(seedKey) {
  const seed = [...seedKey].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const occupied = new Set();
  let x = seed;
  while (occupied.size < 14) {
    x = (x * 9301 + 49297) % 233280;
    const rowIndex = x % ROWS.length;
    x = (x * 9301 + 49297) % 233280;
    const col = (x % COLS) + 1;
    occupied.add(`${ROWS[rowIndex]}${col}`);
  }
  return occupied;
}

// Asegura que exista contenedor de reservas para la función seleccionada.
function ensureShowBooking() {
  const key = getShowKey(state.selectedMovieId, state.selectedSchedule);
  if (!state.bookingsByShow[key]) {
    state.bookingsByShow[key] = {
      occupied: createInitialOccupiedSeats(key)
    };
  }
  return state.bookingsByShow[key];
}

// Renderiza tarjetas de películas con poster, horarios y precio.
function renderMovies() {
  movieGrid.innerHTML = movies.map((movie) => {
    const scheduleOptions = movie.schedules.map((s) => `<option value="${s}">${s}</option>`).join("");
    return `
      <article class="movie-card">
        <img src="${movie.poster}" alt="Poster de ${movie.title}">
        <div class="movie-body">
          <h3>${movie.title}</h3>
          <p class="movie-meta">Precio: ${dualPriceText(movie.priceGTQ)}</p>
          <label>
            Horario
            <select data-movie-schedule="${movie.id}">
              ${scheduleOptions}
            </select>
          </label>
          <button class="btn" data-select-movie="${movie.id}" type="button">Elegir Película</button>
        </div>
      </article>
    `;
  }).join("");

  // Eventos de selección de película/horario.
  movieGrid.querySelectorAll("[data-select-movie]").forEach((button) => {
    button.addEventListener("click", () => {
      const movieId = button.getAttribute("data-select-movie");
      const scheduleSelect = movieGrid.querySelector(`[data-movie-schedule="${movieId}"]`);
      const schedule = scheduleSelect.value;
      state.selectedMovieId = movieId;
      state.selectedSchedule = schedule;
      state.selectedSeats = [];
      renderSeats();
      renderSummary();
      Swal.fire({
        icon: "success",
        title: "Función seleccionada",
        text: "Ahora elige los asientos disponibles."
      });
    });
  });
}

// Construye la cuadrícula de asientos según la función activa.
function renderSeats() {
  seatMap.innerHTML = "";
  const movie = getSelectedMovie();
  if (!movie || !state.selectedSchedule) {
    return;
  }

  const showBooking = ensureShowBooking();
  const fragment = document.createDocumentFragment();

  for (const row of ROWS) {
    for (let c = 1; c <= COLS; c++) {
      const seatCode = `${row}${c}`;
      const seatBtn = document.createElement("button");
      seatBtn.type = "button";
      seatBtn.className = "seat";
      seatBtn.textContent = seatCode;

      const occupied = showBooking.occupied.has(seatCode);
      const selected = state.selectedSeats.includes(seatCode);

      if (occupied) seatBtn.classList.add("occupied");
      if (selected) seatBtn.classList.add("selected");

      seatBtn.addEventListener("click", () => {
        if (showBooking.occupied.has(seatCode)) {
          Swal.fire({
            icon: "error",
            title: "Asiento no disponible",
            text: "Ese asiento ya está ocupado."
          });
          return;
        }
        if (state.selectedSeats.includes(seatCode)) {
          state.selectedSeats = state.selectedSeats.filter((s) => s !== seatCode);
        } else {
          state.selectedSeats.push(seatCode);
        }
        renderSeats();
        renderSummary();
      });

      fragment.appendChild(seatBtn);
    }
  }
  seatMap.appendChild(fragment);
}

// Construye resumen y total según película/asientos/moneda activa.
function renderSummary() {
  const movie = getSelectedMovie();
  if (!movie || !state.selectedSchedule) {
    summaryContent.innerHTML = "<p>Selecciona una película, horario y asientos.</p>";
    paymentAmount.value = state.currency === "USD" ? "$ 0.00" : "Q 0.00";
    return;
  }

  const seatsCount = state.selectedSeats.length;
  const totalGTQ = seatsCount * movie.priceGTQ;
  const totalDisplay = formatMoney(totalGTQ);
  const altCurrency = state.currency === "GTQ" ? "USD" : "GTQ";
  const totalAltDisplay = formatMoney(totalGTQ, altCurrency);

  summaryContent.innerHTML = `
    <p><strong>Película:</strong> ${movie.title}</p>
    <p><strong>Horario:</strong> ${state.selectedSchedule}</p>
    <p><strong>Asientos:</strong> ${seatsCount ? state.selectedSeats.join(", ") : "Ninguno"}</p>
    <p><strong>Boletos:</strong> ${seatsCount}</p>
    <p><strong>Total (${state.currency}):</strong> ${totalDisplay}</p>
    <p><strong>Equivalente (${altCurrency}):</strong> ${totalAltDisplay}</p>
  `;
  paymentAmount.value = totalDisplay;
}

// Valida datos mínimos de pago para una pasarela de ejemplo.
function validatePaymentFields() {
  const cardName = document.getElementById("cardName").value.trim();
  const cardNumber = document.getElementById("cardNumber").value.replace(/\s+/g, "");
  const cardExpiry = document.getElementById("cardExpiry").value.trim();
  const cardCVV = document.getElementById("cardCVV").value.trim();

  if (!cardName || cardName.length < 4) return "Ingresa un nombre válido.";
  if (!/^\d{16}$/.test(cardNumber)) return "El número de tarjeta debe tener 16 dígitos.";
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) return "Vencimiento inválido. Usa formato MM/AA.";

  // Validacion logica: mes 01-12, ano <= 40 y fecha no vencida.
  const [, monthText, yearText] = cardExpiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  const expiryMonth = Number(monthText);
  const expiryYearTwoDigits = Number(yearText);
  const expiryYearFull = 2000 + expiryYearTwoDigits;
  const now = new Date();
  const expiryEndDate = new Date(expiryYearFull, expiryMonth, 0, 23, 59, 59, 999);

  if (expiryYearTwoDigits > 40) return "El ano de vencimiento maximo permitido es 40.";
  if (expiryEndDate < now) return "La tarjeta está vencida. Ingresa una fecha vigente.";

  if (!/^\d{3,4}$/.test(cardCVV)) return "CVV inválido.";
  return null;
}

// Confirma el pago, bloquea asientos seleccionados y guarda la reserva.
function processPayment() {
  const movie = getSelectedMovie();
  if (!movie || !state.selectedSchedule) {
    Swal.fire({ icon: "warning", title: "Selecciona una función primero" });
    return;
  }

  if (state.selectedSeats.length === 0) {
    Swal.fire({ icon: "warning", title: "Selecciona al menos un asiento" });
    return;
  }

  const validationError = validatePaymentFields();
  if (validationError) {
    Swal.fire({ icon: "error", title: "Datos de pago inválidos", text: validationError });
    return;
  }

  const showBooking = ensureShowBooking();
  for (const seat of state.selectedSeats) {
    if (showBooking.occupied.has(seat)) {
      Swal.fire({
        icon: "error",
        title: "Conflicto de asientos",
        text: `El asiento ${seat} ya fue reservado. Elige otros.`
      });
      return;
    }
  }

  state.selectedSeats.forEach((seat) => showBooking.occupied.add(seat));
  const totalGTQ = movie.priceGTQ * state.selectedSeats.length;
  const ticketId = `CINE-${Date.now().toString().slice(-8)}`;

  state.confirmedReservation = {
    ticketId,
    movieId: movie.id,
    movieTitle: movie.title,
    schedule: state.selectedSchedule,
    seats: [...state.selectedSeats],
    totalGTQ,
    createdAt: new Date().toLocaleString("es-GT")
  };

  state.selectedSeats = [];
  renderSeats();
  renderSummary();
  pdfBtn.disabled = false;

  Swal.fire({
    icon: "success",
    title: "Pago realizado",
    text: `Reserva confirmada. Código: ${ticketId}`
  });
}

// Cancela la reserva confirmada y libera asientos.
function cancelReservation() {
  if (!state.confirmedReservation && state.selectedSeats.length === 0) {
    Swal.fire({
      icon: "info",
      title: "No hay reserva activa",
      text: "Primero selecciona una reserva para cancelar."
    });
    return;
  }

  Swal.fire({
    title: "¿Cancelar reserva?",
    text: "Esta acción liberará los asientos reservados.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, cancelar",
    cancelButtonText: "No"
  }).then((result) => {
    if (!result.isConfirmed) return;

    if (state.confirmedReservation) {
      const movie = movies.find((m) => m.id === state.confirmedReservation.movieId);
      if (movie) {
        const key = getShowKey(movie.id, state.confirmedReservation.schedule);
        const showBooking = state.bookingsByShow[key];
        if (showBooking) {
          state.confirmedReservation.seats.forEach((seat) => showBooking.occupied.delete(seat));
        }
      }
      state.confirmedReservation = null;
      pdfBtn.disabled = true;
    }

    state.selectedSeats = [];
    renderSeats();
    renderSummary();
    paymentForm.reset();
    paymentAmount.value = state.currency === "USD" ? "$ 0.00" : "Q 0.00";

    Swal.fire({
      icon: "success",
      title: "Reserva cancelada",
      text: "Los asientos fueron liberados correctamente."
    });
  });
}

// Dibuja un codigo de barras visual (deterministico) sin librerias externas.
function drawPseudoBarcode(doc, x, y, width, height, seedText) {
  let cursorX = x;
  const chars = seedText.split("");

  doc.setFillColor(20, 20, 20);

  for (let i = 0; i < chars.length && cursorX < x + width - 1; i++) {
    const code = chars[i].charCodeAt(0);
    const barWidth = 0.45 + (code % 3) * 0.35; // 0.45, 0.80, 1.15
    const gap = 0.35 + ((code >> 1) % 2) * 0.3;

    if (cursorX + barWidth > x + width) break;
    doc.rect(cursorX, y, barWidth, height, "F");
    cursorX += barWidth + gap;
  }

  // Rellena el restante con patron minimo para evitar espacios vacios.
  while (cursorX < x + width - 0.6) {
    doc.rect(cursorX, y, 0.5, height, "F");
    cursorX += 0.9;
  }
}

// Genera un boleto PDF con estilo de ticket de cine.
function generateTicketPDF() {
  if (!state.confirmedReservation) {
    Swal.fire({ icon: "warning", title: "No hay boleto para exportar" });
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    Swal.fire({
      icon: "error",
      title: "Error al generar PDF",
      text: "La libreria de PDF no se cargo. Verifica tu conexion e intenta de nuevo."
    });
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const r = state.confirmedReservation;
  const barcodeText = r.ticketId.replace("CINE-", "WR");
  const seatsText = r.seats.join(", ");

  // Fondo general.
  doc.setFillColor(238, 238, 238);
  doc.rect(0, 0, 210, 297, "F");

  // Franja superior azul.
  doc.setFillColor(52, 79, 147);
  doc.roundedRect(10, 12, 190, 20, 1.4, 1.4, "F");
  doc.setFillColor(244, 190, 60);
  doc.circle(20, 22, 2.2, "F");
  doc.circle(24.2, 19.8, 1.8, "F");
  doc.circle(24.2, 24.2, 1.8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("Cine Reserva", 30, 24);
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text("Ticket digital", 30, 28);

  // Cuerpo principal del ticket.
  doc.setFillColor(52, 79, 147);
  doc.roundedRect(10, 36, 190, 58, 1.2, 1.2, "F");

  // Muescas laterales (estilo boleto recortable).
  doc.setFillColor(238, 238, 238);
  doc.circle(10, 65, 3, "F");
  doc.circle(200, 65, 3, "F");

  // Tres paneles internos.
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 40, 32, 50, 0.8, 0.8, "F");
  doc.roundedRect(48, 40, 98, 50, 0.8, 0.8, "F");
  doc.roundedRect(148, 40, 48, 50, 0.8, 0.8, "F");

  // Panel izquierdo: mini icono/brand.
  doc.setTextColor(52, 79, 147);
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("CR", 30, 61, { align: "center" });
  doc.setFontSize(8.5);
  doc.setFont(undefined, "normal");
  doc.text("Cine", 30, 69, { align: "center" });
  doc.text("Reserva", 30, 73, { align: "center" });

  // Panel central: datos de la compra.
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Cine Reserva Plaza Central", 97, 47, { align: "center" });
  doc.setDrawColor(85, 104, 160);
  doc.setLineWidth(0.6);
  doc.line(49, 49.5, 145, 49.5);

  doc.setFontSize(10.5);
  doc.setFont(undefined, "normal");
  doc.text(r.movieTitle.toUpperCase(), 97, 56, { align: "center" });
  doc.text(`Horario: ${r.schedule}`, 97, 62, { align: "center" });
  doc.text(`Fecha: ${r.createdAt}`, 97, 68, { align: "center" });
  doc.text(`Transaccion: ${r.ticketId}`, 97, 74, { align: "center" });
  doc.text(`Boletos: ${r.seats.length} x ADULTO`, 97, 80, { align: "center" });

  const wrappedSeats = doc.splitTextToSize(`Asientos: ${seatsText}`, 90);
  doc.text(wrappedSeats, 97, 86, { align: "center" });

  // Panel derecho: codigo de barras.
  drawPseudoBarcode(doc, 157, 52, 30, 24, barcodeText);
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(barcodeText, 172, 82, { align: "center" });

  // Nota informativa.
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(10, 98, 190, 24, 1, 1, "F");
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.35);
  doc.roundedRect(10, 98, 190, 24, 1, 1, "S");
  doc.setTextColor(45, 45, 45);
  doc.setFontSize(8.8);
  doc.setFont(undefined, "normal");
  const note = "Presenta este boleto para ingresar a la sala. En caso de reembolso, se solicitara la tarjeta utilizada en la compra. Conserva tu comprobante.";
  const wrappedNote = doc.splitTextToSize(note, 180);
  doc.text(wrappedNote, 15, 106);

  // Marca principal.
  doc.setFillColor(244, 190, 60);
  doc.circle(30, 145, 4, "F");
  doc.circle(38, 139, 4, "F");
  doc.circle(46, 145, 4, "F");
  doc.circle(38, 151, 4, "F");
  doc.setTextColor(18, 93, 171);
  doc.setFontSize(36);
  doc.setFont(undefined, "bold");
  doc.text("Cine Reserva", 58, 150);

  // Seccion inferior: promo + codigo.
  doc.setFillColor(255, 219, 53);
  doc.roundedRect(10, 170, 95, 58, 1.2, 1.2, "F");
  doc.setFillColor(16, 16, 16);
  doc.rect(10, 190, 95, 12, "F");
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text("PROMO COMBO", 57.5, 183, { align: "center" });
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.text("Disfruta promociones en dulceria", 57.5, 187, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.text("Valido en tu Cine Reserva favorito", 57.5, 197.5, { align: "center" });

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(108, 170, 92, 58, 1.2, 1.2, "F");
  doc.setDrawColor(120, 120, 120);
  doc.roundedRect(108, 170, 92, 58, 1.2, 1.2, "S");
  drawPseudoBarcode(doc, 130, 193, 48, 22, barcodeText);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text(barcodeText, 154, 220, { align: "center" });

  // Total de pago.
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text(`Total: Q ${r.totalGTQ.toFixed(2)} / $ ${(r.totalGTQ / USD_RATE).toFixed(2)}`, 10, 238);

  doc.save(`${r.ticketId}.pdf`);
}

// Cambia entre modo claro/oscuro y persiste preferencia.
function initTheme() {
  const savedTheme = localStorage.getItem("cine_theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Modo Claro";
  }
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  themeToggle.textContent = dark ? "Modo Claro" : "Modo Oscuro";
  localStorage.setItem("cine_theme", dark ? "dark" : "light");
});

currencySelect.addEventListener("change", () => {
  state.currency = currencySelect.value;
  renderSummary();
});

paymentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  processPayment();
});

cancelBtn.addEventListener("click", cancelReservation);
pdfBtn.addEventListener("click", generateTicketPDF);

// Formatea automáticamente tarjeta y vencimiento para reducir errores de entrada.
document.getElementById("cardNumber").addEventListener("input", (e) => {
  const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
  e.target.value = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
});

document.getElementById("cardExpiry").addEventListener("input", (e) => {
  const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
  let monthPart = raw.slice(0, 2);
  let yearPart = raw.slice(2, 4);

  // Si el usuario escribe un solo digito mayor a 1, se normaliza como 0X.
  if (raw.length === 1 && Number(raw) > 1) {
    monthPart = `0${raw}`;
    yearPart = "";
  }

  // Limita MM al rango 01-12.
  if (monthPart.length === 2) {
    let monthNumber = Number(monthPart);
    if (monthNumber < 1) monthNumber = 1;
    if (monthNumber > 12) monthNumber = 12;
    monthPart = String(monthNumber).padStart(2, "0");
  }

  // Limita AA al maximo 40.
  if (yearPart.length === 2) {
    let yearNumber = Number(yearPart);
    if (yearNumber > 40) yearNumber = 40;
    yearPart = String(yearNumber).padStart(2, "0");
  }

  if (monthPart.length < 2) {
    e.target.value = monthPart;
    return;
  }

  e.target.value = yearPart ? `${monthPart}/${yearPart}` : `${monthPart}/`;
});

// Inicialización de la app.
initTheme();
renderMovies();
renderSummary();
