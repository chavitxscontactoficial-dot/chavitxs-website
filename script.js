// ==========================================================================
// CONTROL GLOBAL Y LÓGICA DE LA INTRANET - CHAVITXS
// ==========================================================================

const SIETE_DIAS_MS = 604800000; // 7 días en milisegundos

// --- ESTADOS INICIALES DESDE LOCALSTORAGE (DECLARACIÓN ÚNICA) ---
let planesData = JSON.parse(localStorage.getItem('chavitxs_planes')) || [  
  { id: 1, categoria: 'redes', texto: '3 contenidos semanales sobre prevención', completado: false },  
  { id: 2, categoria: 'redes', texto: 'Llegar a 10k seguidores en IG y TikTok', completado: false },  
  { id: 3, categoria: 'articulos', texto: 'Guía PEP en 72 hrs', completado: true },  
  { id: 4, categoria: 'articulos', texto: 'Mitos del SAT para jóvenes', completado: false },  
  { id: 5, categoria: 'app', texto: 'Notificaciones push con PWA cerrada', completado: false }  
];  

let ideasData = JSON.parse(localStorage.getItem('chavitxs_ideas')) || [];  

let insumosData = JSON.parse(localStorage.getItem('chavitxs_insumos')) || [
  { id: 1, nombre: 'Pruebas VIH', cantidad: 150 },
  { id: 2, nombre: 'Condones', cantidad: 30 },
  { id: 3, nombre: 'Lubricantes', cantidad: 200 },
  { id: 4, nombre: 'Folletería', cantidad: 15 }
];

// --- AUTENTICACIÓN Y SESIÓN ---

// --- AUTENTICACIÓN REAL CON GOOGLE (OAuth 2.0 / GIS) ---
function iniciarSesionGoogle() {
  const CLIENT_ID = "224136231973-bv4t44fu80egb9mmp1o74i10l4vcq825.apps.googleusercontent.com";

  const client = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    callback: (tokenResponse) => {
      if (tokenResponse && tokenResponse.access_token) {
        
        // 1. Solicitamos el perfil a Google
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        })
        .then(res => res.json())
        .then(user => {
          
          // =========================================================
          // A) LISTA BLANCA DE CORREOS AUTORIZADOS
          // Agrega aquí todos los correos del equipo que pueden entrar:
          // =========================================================
          const listaColaboradores = [
            "aar.cor.academico2@gmail.com",
            "alearerob28@gmail.com",
            "chavitxs.contactoficial@gmail.com",
            "escutiavalentina@gmail.com",
            "bren.dlogz@gmail.com",
            "mdzferr03@gmail.com",
            "csblanco6@gmail.com",
            "ronalddonals839@gmail.com",
          ];

          // 2. Verificamos si el correo devuelto por Google está en la lista
          const estaAutorizado = listaColaboradores.includes(user.email.toLowerCase());

          // 3. Si NO está en la lista, mostramos alerta y frenamos la entrada
          if (!estaAutorizado) {
            alert(`Acceso denegado. La cuenta (${user.email}) no está registrada como colaboradora de CHAVITXS.`);
            return; // Al poner return, el código se detiene aquí y no redirige a la intranet
          }

          // 4. Si SÍ está autorizado, creamos el objeto de sesión con sus datos reales
          const usuarioReal = {
            nombre: user.name,
            email: user.email,
            foto: user.picture,
            rol: "Colaborador"
          };

          // 5. Guardamos en el navegador y permitimos el acceso
          sessionStorage.setItem('usuarioCHAVITXS', JSON.stringify(usuarioReal));
          window.location.href = "intranet.html";
        })
        .catch(err => {
          console.error("Error al obtener perfil:", err);
          alert("No se pudieron obtener los datos de la cuenta.");
        });
      }
    },
  });

  client.requestAccessToken();
}

function cerrarSesion() {  
  sessionStorage.removeItem('usuarioCHAVITXS');  
  window.location.href = "red.html";  
}  

// --- INICIALIZACIÓN ÚNICA DEL DOM ---
document.addEventListener('DOMContentLoaded', () => {  

  // 1. Botón Google Login en red.html
  // 1. Botón Google Login en red.html
  const btnLogin = document.getElementById('btnLoginGoogle');  
  if (btnLogin) {  
    btnLogin.addEventListener('click', (e) => {
      e.preventDefault();
      iniciarSesionGoogle();
    });  
  } 

  // 2. Protección de Ruta Intranet
  if (window.location.pathname.includes('intranet.html')) {  
    const usuarioGuardado = sessionStorage.getItem('usuarioCHAVITXS');  
    if (!usuarioGuardado) {  
      alert("Acceso denegado. Debes iniciar sesión con tu cuenta de colaborador.");  
      window.location.href = "red.html";  
      return;
    } else {  
      const user = JSON.parse(usuarioGuardado);  
      const nameElem = document.getElementById('userName');  
      const emailElem = document.getElementById('userEmail');  
      if (nameElem) nameElem.textContent = `Hola, ${user.nombre}`;  
      if (emailElem) emailElem.textContent = user.email;  
    }  
  }  

  // 3. Header Scroll
  const header = document.querySelector('.main-header');  
  if (header) {  
    window.addEventListener('scroll', () => {  
      if (window.scrollY > 80) {  
        header.classList.add('visible');  
      } else {  
        header.classList.remove('visible');  
      }  
    });  
  }  

  // 4. Cargar módulos de Intranet
  verificarLimpiezaSemanal();
  renderPlanes();  
  renderIdeas();  
  renderInsumos();
});  

// --- MÓDULO 1: NAVEGACIÓN Y METAS ---
function openTab(evt, tabName) {  
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));  
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));  
  
  const target = document.getElementById(tabName);
  if (target) target.classList.add('active');  
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');  
}  

function togglePlanForm() {  
  const form = document.getElementById('addPlanForm');  
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';  
}  

function agregarPlan() {  
  const inputTexto = document.getElementById('newPlanTitle');  
  const selectCat = document.getElementById('newPlanCategory');  
  if (!inputTexto || !inputTexto.value.trim()) return alert('Escribe un título.');  

  planesData.push({  
    id: Date.now(),  
    categoria: selectCat.value,  
    texto: inputTexto.value.trim(),  
    completado: false  
  });  
  guardarYActualizarPlanes();  
  inputTexto.value = '';  
  togglePlanForm();  
}  

function toggleCompletado(id) {  
  planesData = planesData.map(plan => {  
    if (plan.id === id) plan.completado = !plan.completado;  
    return plan;  
  });  
  guardarYActualizarPlanes();  
}  

function borrarPlan(id) {
  planesData = planesData.filter(p => p.id !== id);
  guardarYActualizarPlanes();
}

function guardarYActualizarPlanes() {  
  localStorage.setItem('chavitxs_planes', JSON.stringify(planesData));  
  renderPlanes();  
}  

function renderPlanes() {  
  ['redes', 'articulos', 'colab', 'app', 'miembros'].forEach(cat => {  
    const listEl = document.getElementById(`list-${cat}`);  
    if (listEl) listEl.innerHTML = '';  
  });  

  let totalMetas = planesData.length;  
  let completadas = 0;  

  planesData.forEach(plan => {  
    if (plan.completado) completadas++;  
    const listEl = document.getElementById(`list-${plan.categoria}`);  
    if (listEl) {  
      const li = document.createElement('li');  
      li.className = `task-item-dynamic ${plan.completado ? 'completed' : ''}`;  
      li.innerHTML = `  
        <label class="custom-checkbox">  
          <input type="checkbox" ${plan.completado ? 'checked' : ''} onchange="toggleCompletado(${plan.id})">  
          <span class="plan-text">${plan.texto}</span>  
        </label>  
        <i class="fa-solid fa-trash" onclick="borrarPlan(${plan.id})" style="cursor:pointer; color:var(--highlight-pink); font-size:0.75rem;"></i>
      `;  
      listEl.appendChild(li);  
    }  
  });  

  const porcentaje = totalMetas > 0 ? Math.round((completadas / totalMetas) * 100) : 0;  
  const textEl = document.getElementById('progressText');
  const percentEl = document.getElementById('progressPercent');
  const fillEl = document.getElementById('progressBarFill');

  if (textEl) textEl.innerText = `${completadas} de ${totalMetas} completados`;  
  if (percentEl) percentEl.innerText = `${porcentaje}%`;  
  if (fillEl) fillEl.style.width = `${porcentaje}%`;  
}  

// --- MÓDULO 2: BUZÓN DE IDEAS ---
function guardarIdea(e) {  
  e.preventDefault();  
  const titleEl = document.getElementById('ideaTitle');  
  const descEl = document.getElementById('ideaDesc');  
  if (!titleEl || !descEl) return;  

  const titulo = titleEl.value.trim();  
  const desc = descEl.value.trim();  
  if (!titulo || !desc) return;  

  ideasData.unshift({ id: Date.now(), titulo, desc, fecha: new Date().toLocaleDateString('es-MX') });  
  localStorage.setItem('chavitxs_ideas', JSON.stringify(ideasData));  
  e.target.reset();  
  renderIdeas();  
}  

function renderIdeas() {  
  const container = document.getElementById('ideasList');  
  if (!container) return;  
  container.innerHTML = '';  

  if (ideasData.length === 0) {  
    container.innerHTML = '<li class="empty-idea" style="color:var(--text-muted); font-size:0.8rem;">No hay ideas en el buzón.</li>';  
    return;  
  }  

  ideasData.forEach(idea => {  
    const li = document.createElement('li');  
    li.className = 'idea-card-item';  
    li.innerHTML = `  
      <div class="idea-header">  
        <strong>${idea.titulo}</strong>  
        <small>${idea.fecha || 'Reciente'}</small>  
      </div>  
      <p style="margin-bottom:0.5rem; color:var(--text-muted); font-size:0.85rem;">${idea.desc}</p>  
      <div style="display:flex; gap:0.4rem; justify-content:flex-end;">  
        <button onclick="aprobarIdeaAMeta(${idea.id})" class="btn-primary" style="font-size:0.7rem; padding:0.25rem 0.5rem; width:auto;">  
          Aprobar a Meta  
        </button>  
        <button onclick="borrarIdea(${idea.id})" class="btn-secondary" style="font-size:0.7rem; padding:0.25rem 0.5rem; width:auto; color:var(--highlight-pink);">  
          <i class="fa-solid fa-trash"></i>  
        </button>  
      </div>  
    `;  
    container.appendChild(li);  
  });  
}  

function borrarIdea(id) {  
  ideasData = ideasData.filter(i => i.id !== id);  
  localStorage.setItem('chavitxs_ideas', JSON.stringify(ideasData));  
  renderIdeas();  
}  

function aprobarIdeaAMeta(id) {  
  const idea = ideasData.find(i => i.id === id);  
  if (!idea) return;  

  const cat = prompt("Categoría destino:\n(redes, articulos, colab, app, miembros)", "redes");  
  const validas = ['redes', 'articulos', 'colab', 'app', 'miembros'];  

  if (cat && validas.includes(cat.toLowerCase().trim())) {  
    planesData.push({  
      id: Date.now(),  
      categoria: cat.toLowerCase().trim(),  
      texto: `${idea.titulo}: ${idea.desc}`,  
      completado: false  
    });  
    guardarYActualizarPlanes();  
    borrarIdea(id);  
  }  
}  

// --- MÓDULO 3: INSUMOS BÁSICOS (SIN ELIMINACIÓN Y CON BOTONES +/-) ---
function renderInsumos() {
  const container = document.getElementById('stockContainer');
  if (!container) return;
  container.innerHTML = '';

  insumosData.forEach(item => {
    const isLow = item.cantidad < 50 && item.cantidad > 0;
    const isEmpty = item.cantidad <= 0;
    
    let statusClass = 'ok';
    if (isLow) statusClass = 'low';
    if (isEmpty) statusClass = 'empty';

    const div = document.createElement('div');
    div.className = `stock-pill ${statusClass}`;
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:0.4rem;">
        <span style="font-weight:600;">${item.nombre}</span>
        <div class="stock-controls">
          <button onclick="modificarStock(${item.id}, -1)" class="btn-stock-adj">-</button>
          <button onclick="modificarStock(${item.id}, 1)" class="btn-stock-adj">+</button>
        </div>
      </div>
      <strong>${item.cantidad > 0 ? item.cantidad + ' pcs' : 'Agotado'}</strong>
    `;
    container.appendChild(div);
  });
}

function modificarStock(id, cambio) {
  insumosData = insumosData.map(item => {
    if (item.id === id) {
      const nuevaCant = item.cantidad + cambio;
      return { ...item, cantidad: nuevaCant < 0 ? 0 : nuevaCant };
    }
    return item;
  });
  guardarYRenderizarInsumos();
}

function guardarInsumo(e) {
  e.preventDefault();
  const nameEl = document.getElementById('stockName');
  const qtyEl = document.getElementById('stockQty');
  if (!nameEl || !qtyEl) return;

  const nombre = nameEl.value.trim();
  const cantidad = parseInt(qtyEl.value);

  const idx = insumosData.findIndex(i => i.nombre.toLowerCase() === nombre.toLowerCase());
  if (idx !== -1) {
    insumosData[idx].cantidad = cantidad < 0 ? 0 : cantidad;
  } else {
    insumosData.push({ id: Date.now(), nombre, cantidad: cantidad < 0 ? 0 : cantidad });
  }

  guardarYRenderizarInsumos();
  e.target.reset();
}

function guardarYRenderizarInsumos() {
  localStorage.setItem('chavitxs_insumos', JSON.stringify(insumosData));
  renderInsumos();
}

function exportarInsumosASheets() {
  const webhookURL = "https://script.google.com/macros/s/AKfycbwnf5QwRa2TQafXx3nU9Ojf7F6Z-_qEah_wmvQkf0JRrX0yvOwDigkw7wojB3Y7d3-G/exec";

  fetch(webhookURL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fecha: new Date().toISOString(),
      inventario: insumosData
    })
  })
  .then(() => alert("¡Cierre de transparencia enviado a Google Sheets!"))
  .catch(() => alert("Error al conectar con Sheets."));
}

// --- LIMPIEZA AUTOMÁTICA SEMANAL ---
function verificarLimpiezaSemanal() {  
  const ultima = localStorage.getItem('chavitxs_last_cleanup');  
  const ahora = Date.now();  

  if (!ultima || (ahora - parseInt(ultima)) >= SIETE_DIAS_MS) {  
    planesData = planesData.filter(p => !p.completado);  
    localStorage.setItem('chavitxs_planes', JSON.stringify(planesData));  
    localStorage.setItem('chavitxs_last_cleanup', ahora.toString());  
  }  
}
