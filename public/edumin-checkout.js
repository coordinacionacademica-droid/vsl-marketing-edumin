(function() {
  // 1. Detectar configuración global del script
  const currentScript = document.currentScript || document.querySelector('script[src*="edumin-checkout.js"]');
  const defaultCurso = currentScript ? (currentScript.getAttribute('data-curso') || 'Curso Especializado en Gestión Minera') : 'Curso Especializado en Gestión Minera';
  const defaultPrecio = currentScript ? (currentScript.getAttribute('data-precio') || '129') : '129';
  const defaultWa = currentScript ? (currentScript.getAttribute('data-wa') || '987423200') : '987423200';
  const apiBase = currentScript ? (currentScript.getAttribute('data-api') || '') : '';

  // Cargar canvas-confetti si no está presente
  if (!window.confetti) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
    document.head.appendChild(s);
  }

  // Estilos del modal inyectados dinámicamente
  const style = document.createElement('style');
  style.innerHTML = `
    .edumin-modal-overlay {
      position: fixed; inset: 0; z-index: 999999;
      background: rgba(7, 0, 22, 0.88); backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      padding: 16px; opacity: 0; pointer-events: none; transition: opacity 0.25s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .edumin-modal-overlay.active { opacity: 1; pointer-events: auto; }
    .edumin-modal-box {
      position: relative; width: 100%; max-width: 500px;
      background: #0A001F; border: 1px solid rgba(0, 1, 255, 0.4);
      border-radius: 20px; padding: 28px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      transform: scale(0.95) translateY(15px); transition: transform 0.25s ease;
      color: #fff; overflow: hidden;
    }
    .edumin-modal-overlay.active .edumin-modal-box { transform: scale(1) translateY(0); }
    .edumin-glow-1 {
      position: absolute; top: -80px; right: -80px; width: 220px; height: 220px;
      background: rgba(0, 1, 255, 0.2); border-radius: 50%; filter: blur(70px); pointer-events: none;
    }
    .edumin-glow-2 {
      position: absolute; bottom: -80px; left: -80px; width: 220px; height: 220px;
      background: rgba(240, 0, 6, 0.15); border-radius: 50%; filter: blur(70px); pointer-events: none;
    }
    .edumin-close-btn {
      position: absolute; top: 16px; right: 16px; background: none; border: none;
      color: rgba(255, 255, 255, 0.6); font-size: 24px; cursor: pointer; line-height: 1;
      padding: 6px; border-radius: 50%; transition: all 0.2s;
    }
    .edumin-close-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }
    .edumin-badge {
      display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px;
      background: linear-gradient(90deg, #FF7200, #F00006); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .edumin-title { font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 6px 0; line-height: 1.25; }
    .edumin-subtitle { font-size: 13px; color: rgba(255,255,255,0.65); margin: 0 0 18px 0; }
    .edumin-price-box {
      background: #0D0026; border: 1px solid rgba(0, 1, 255, 0.3); border-radius: 12px;
      padding: 12px 16px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between;
    }
    .edumin-old-price { font-size: 11px; color: rgba(255,255,255,0.5); text-decoration: line-through; }
    .edumin-current-price {
      font-size: 24px; font-weight: 900;
      background: linear-gradient(90deg, #FF7200, #F00006); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .edumin-save-pill {
      background: rgba(255, 114, 0, 0.15); border: 1px solid rgba(255, 114, 0, 0.4);
      color: #FF7200; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px;
    }
    .edumin-wa-btn {
      width: 100%; background: #25D366; hover: background: #20bd5a; color: #fff;
      font-weight: 700; font-size: 14px; padding: 13px 16px; border-radius: 12px; border: none;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-bottom: 16px; transition: transform 0.15s, background 0.2s; text-decoration: none;
      box-shadow: 0 4px 14px rgba(37, 211, 102, 0.3);
    }
    .edumin-wa-btn:hover { background: #20bd5a; transform: translateY(-1px); }
    .edumin-divider {
      position: relative; text-align: center; margin: 16px 0;
    }
    .edumin-divider::before {
      content: ""; position: absolute; top: 50%; left: 0; right: 0;
      height: 1px; background: rgba(255,255,255,0.1); z-index: 1;
    }
    .edumin-divider span {
      position: relative; z-index: 2; background: #0A001F; padding: 0 12px;
      font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em;
    }
    .edumin-form-group { margin-bottom: 12px; }
    .edumin-label {
      display: flex; justify-content: space-between; font-size: 12px; font-weight: 500;
      color: rgba(255,255,255,0.85); margin-bottom: 5px;
    }
    .edumin-label small { color: #FF7200; font-size: 10px; }
    .edumin-input {
      width: 100%; box-sizing: border-box; background: #070016;
      border: 1px solid rgba(255,255,255,0.18); border-radius: 8px;
      padding: 10px 14px; color: #fff; font-size: 13px; outline: none; transition: border 0.2s;
    }
    .edumin-input:focus { border-color: #0001FF; }
    .edumin-input::placeholder { color: rgba(255,255,255,0.3); }
    .edumin-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media(max-width: 480px) { .edumin-grid-2 { grid-template-columns: 1fr; } }
    .edumin-submit-btn {
      width: 100%; margin-top: 14px;
      background: linear-gradient(90deg, #FF7200, #F00006);
      border: 1px solid rgba(255,255,255,0.2); border-radius: 12px;
      padding: 14px; color: #fff; font-size: 14px; font-weight: 800;
      cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px;
      box-shadow: 0 8px 20px rgba(240, 0, 6, 0.25);
    }
    .edumin-submit-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .edumin-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .edumin-badges-footer {
      display: flex; justify-content: center; gap: 16px; margin-top: 14px;
      font-size: 11px; color: rgba(255,255,255,0.55); border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;
    }
  `;
  document.head.appendChild(style);

  // Crear HTML del Modal
  const modal = document.createElement('div');
  modal.className = 'edumin-modal-overlay';
  modal.id = 'eduminModal';
  modal.innerHTML = `
    <div class="edumin-modal-box">
      <div class="edumin-glow-1"></div>
      <div class="edumin-glow-2"></div>
      <button class="edumin-close-btn" id="eduminCloseBtn" aria-label="Cerrar">&times;</button>
      
      <div class="edumin-badge">⚡ PRECIO ESPECIAL DE LANZAMIENTO</div>
      <h3 class="edumin-title" id="eduminCursoTitle">Curso Especializado</h3>
      <p class="edumin-subtitle">10 clases especializadas • Modalidad asincrónica • Acceso inmediato</p>
      
      <div class="edumin-price-box">
        <div>
          <div class="edumin-old-price">Precio regular: S/ 199</div>
          <div class="edumin-current-price" id="eduminPriceDisplay">S/ 129 <span style="font-size:11px;font-weight:400;color:rgba(255,255,255,0.8);-webkit-text-fill-color:rgba(255,255,255,0.8)">Por Lanzamiento</span></div>
        </div>
        <span class="edumin-save-pill" id="eduminSavePill">Ahorras S/ 70</span>
      </div>

      <button type="button" class="edumin-wa-btn" id="eduminWaBtn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
        <span>Inscribirme por WhatsApp en 1 click</span>
      </button>

      <div class="edumin-divider"><span>O COMPLETA TUS DATOS</span></div>

      <form id="eduminCheckoutForm">
        <div class="edumin-form-group">
          <label class="edumin-label">Nombre Completo *</label>
          <input type="text" class="edumin-input" id="eduminNombre" placeholder="Ej. Dr. Carlos Mendoza" required>
        </div>

        <div class="edumin-form-group">
          <label class="edumin-label">
            <span>DNI / Documento de Identidad *</span>
            <small>Para aula virtual Q10</small>
          </label>
          <input type="text" class="edumin-input" id="eduminDni" placeholder="Ej. 72496697" required style="font-family: monospace;">
        </div>

        <div class="edumin-grid-2">
          <div class="edumin-form-group">
            <label class="edumin-label">Correo Electrónico *</label>
            <input type="email" class="edumin-input" id="eduminCorreo" placeholder="tuemail@ejemplo.com" required>
          </div>
          <div class="edumin-form-group">
            <label class="edumin-label">Teléfono / WhatsApp *</label>
            <input type="tel" class="edumin-input" id="eduminTelefono" placeholder="+51 987 654 321" required>
          </div>
        </div>

        <button type="submit" class="edumin-submit-btn" id="eduminSubmitBtn">
          <span id="eduminSubmitText">QUIERO ESPECIALIZARME POR S/ 129</span>
          <span>&rarr;</span>
        </button>
      </form>

      <div class="edumin-badges-footer">
        <span>🔒 Pago Seguro 100%</span>
        <span>⚡ Acceso Inmediato Q10</span>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Variables activas
  let activeCurso = defaultCurso;
  let activePrecio = defaultPrecio;
  let activeWa = defaultWa;

  // Función pública para abrir el modal
  window.openEduminCheckout = function(options) {
    options = options || {};
    activeCurso = options.curso || defaultCurso;
    activePrecio = options.precio || defaultPrecio;
    activeWa = options.wa || defaultWa;

    document.getElementById('eduminCursoTitle').textContent = activeCurso;
    document.getElementById('eduminPriceDisplay').innerHTML = `S/ ${activePrecio} <span style="font-size:11px;font-weight:400;color:rgba(255,255,255,0.8);-webkit-text-fill-color:rgba(255,255,255,0.8)">Por Lanzamiento</span>`;
    document.getElementById('eduminSubmitText').textContent = `QUIERO ESPECIALIZARME POR S/ ${activePrecio}`;
    
    const ahorro = Math.max(0, 199 - Number(activePrecio));
    document.getElementById('eduminSavePill').textContent = `Ahorras S/ ${ahorro}`;

    modal.classList.add('active');
  };

  // Función para cerrar
  window.closeEduminCheckout = function() {
    modal.classList.remove('active');
  };

  // Evento cerrar
  document.getElementById('eduminCloseBtn').addEventListener('click', closeEduminCheckout);
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeEduminCheckout();
  });

  // Evento botón WhatsApp
  document.getElementById('eduminWaBtn').addEventListener('click', function() {
    if (window.confetti) {
      window.confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
    const msg = encodeURIComponent(`Hola, deseo inscribirme al ${activeCurso} con el precio de lanzamiento de S/ ${activePrecio}.`);
    window.open(`https://wa.me/51${activeWa}?text=${msg}`, '_blank');
  });

  // Evento submit de pasarela dLocal Go
  document.getElementById('eduminCheckoutForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('eduminSubmitBtn');
    const btnText = document.getElementById('eduminSubmitText');

    btn.disabled = true;
    btnText.textContent = 'CONECTANDO CON DLOCAL GO...';

    if (window.confetti) {
      window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#0001FF', '#FF7200', '#F00006', '#FFFFFF'] });
    }

    const payload = {
      diplomado: activeCurso,
      amount: Number(activePrecio),
      currency: 'PEN',
      country: 'PE',
      nombres: document.getElementById('eduminNombre').value.trim(),
      dni: document.getElementById('eduminDni').value.trim(),
      correo: document.getElementById('eduminCorreo').value.trim(),
      telefono: document.getElementById('eduminTelefono').value.trim()
    };

    fetch(`${apiBase}/api/create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        alert('Error conectando con dLocal Go: ' + (data.error || 'Intente nuevamente'));
        btn.disabled = false;
        btnText.textContent = `QUIERO ESPECIALIZARME POR S/ ${activePrecio}`;
      }
    })
    .catch(err => {
      console.error(err);
      alert('Error de conexión al servidor de pagos.');
      btn.disabled = false;
      btnText.textContent = `QUIERO ESPECIALIZARME POR S/ ${activePrecio}`;
    });
  });

  // 2. Escuchar clics automáticos en cualquier botón de la página de Marketing
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a, button');
    if (!target) return;

    const href = target.getAttribute('href') || '';
    const isEduminBtn = target.classList.contains('edumin-btn') || 
                        target.hasAttribute('data-edumin-checkout') ||
                        href === '#checkout' || 
                        href === '#pagar' || 
                        href === '#comprar';

    if (isEduminBtn) {
      e.preventDefault();
      const curso = target.getAttribute('data-curso') || defaultCurso;
      const precio = target.getAttribute('data-precio') || defaultPrecio;
      const wa = target.getAttribute('data-wa') || defaultWa;
      window.openEduminCheckout({ curso, precio, wa });
    }
  });

  console.log('✅ Motor de Pasarela EDUMIN cargado correctamente.');
})();
