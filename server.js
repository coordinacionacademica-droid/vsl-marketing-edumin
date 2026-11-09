const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const API_KEY = process.env.DLOCALGO_API_KEY;
const SECRET_KEY = process.env.DLOCALGO_SECRET_KEY;
const API_URL = process.env.DLOCALGO_API_URL || 'https://api-sbx.dlocalgo.com';

// URL FIJA Y BLINDADA DE N8N PARA PAGOS (Marketing no puede tocarla)
const N8N_NOTIFICATION_URL = process.env.DLOCALGO_NOTIFICATION_URL || 'https://n8n.gcg-corp.com/webhook/matricula-vsl-dlocalgo';
// Webhook activo del Workflow "PAGOS PASARELA" en n8n (Registra en Q10, Sheets y envía correo Gmail con accesos)
const N8N_PASARELA_Q10_URL = 'https://n8n.gcg-corp.com/webhook/c592d97d-78d1-4ead-8bed-673be3464658';
const N8N_MATRICULA_URL = 'https://n8n.gcg-corp.com/webhook/matricula-q10';

// Archivos de persistencia local (compatible con entorno Serverless de Vercel)
const isVercel = process.env.VERCEL === '1';
const STORAGE_DIR = isVercel ? '/tmp' : __dirname;
const HISTORY_FILE = path.join(STORAGE_DIR, 'links_history.json');
const MATRICULAS_FILE = path.join(STORAGE_DIR, 'matriculas_registradas.json');
const PAGOS_FILE = path.join(STORAGE_DIR, 'pagos_verificados.json');

// Funciones auxiliares para persistencia
function loadJsonFile(filePath, defaultVal = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.error(`Error leyendo ${filePath}:`, e);
  }
  return defaultVal;
}

function saveJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error guardando ${filePath}:`, e);
  }
}

// Endpoint informativo para pruebas GET en el navegador
app.get('/api/create-payment', (req, res) => {
  res.json({
    status: 'online',
    servicio: 'EDUMIN dLocal Go Payment Gateway',
    metodo_requerido: 'POST',
    mensaje: 'La API de cobros está 100% activa. Utilice una petición POST para generar pagos.'
  });
});

// 1. Endpoint para crear la orden de pago dinámica (Modal VSL)
app.post('/api/create-payment', async (req, res) => {
  try {
    const { diplomado, country, currency, amount, nombres, apellidos, nombre, dni, correo, telefono } = req.body;

    const orderId = 'ORD-' + Date.now();
    const paymentAmount = Number(amount) || 129.0;
    const paymentCurrency = (currency || 'PEN').toUpperCase();

    // Normalizar a formato oficial "Curso Especializado en [Nombre]" (NUNCA DAEM ni conteo de módulos ni horas)
    let programaSeleccionado = diplomado || 'Gestión Minera';
    programaSeleccionado = programaSeleccionado
      .replace(/\s*\(\d+\s*m[oó]dulos\)/gi, '')
      .replace(/\s*\(\d+\s*horas?\)/gi, '')
      .trim();
    programaSeleccionado = programaSeleccionado.replace(/^(daem en|curso especializado en|diplomado en|especialización en)\s*/gi, '').trim();
    programaSeleccionado = 'Curso Especializado en ' + programaSeleccionado;

    // Procesar nombres y apellidos (soporta separados o un solo string)
    let firstName = (nombres || '').trim();
    let lastName = (apellidos || '').trim();
    if (!firstName && nombre) {
      const parts = nombre.trim().split(/\s+/);
      if (parts.length >= 2) {
        const mid = Math.ceil(parts.length / 2);
        firstName = parts.slice(0, mid).join(' ');
        lastName = parts.slice(mid).join(' ');
      } else {
        firstName = parts[0] || '';
      }
    }
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || 'Estudiante');

    // Guardar registro previo de orden con datos del alumno
    const pagos = loadJsonFile(PAGOS_FILE, {});
    pagos[orderId] = {
      order_id: orderId,
      amount: paymentAmount,
      currency: paymentCurrency,
      diplomado: programaSeleccionado,
      status: 'PENDING',
      matricula_completada: false,
      alumno_nombre: firstName,
      alumno_apellido: lastName,
      alumno_dni: dni || '',
      alumno_correo: correo || '',
      alumno_telefono: telefono || '',
      created_at: new Date().toISOString()
    };
    saveJsonFile(PAGOS_FILE, pagos);

    // Detectar dominio base (soporta localhost y Vercel en la nube)
    const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] || (req.secure || process.env.VERCEL ? 'https' : 'http');
    const baseUrl = `${protocol}://${host}`;

    // URL a la que dLocal Go redirige al alumno tras pagar con todos los datos precargados
    const successRedirectUrl = `${baseUrl}/matricula.html?order_id=${orderId}&monto=${paymentAmount}&moneda=${paymentCurrency}&diplomado=${encodeURIComponent(programaSeleccionado)}&email=${encodeURIComponent(correo || '')}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&dni=${encodeURIComponent(dni || '')}&telefono=${encodeURIComponent(telefono || '')}`;

    const requestPayload = {
      currency: paymentCurrency,
      amount: paymentAmount,
      order_id: orderId,
      description: programaSeleccionado.slice(0, 100),
      success_url: successRedirectUrl,
      back_url: baseUrl,
      notification_url: N8N_NOTIFICATION_URL
    };

    if (country && country !== 'ALL') {
      requestPayload.country = country.toUpperCase();
    } else {
      requestPayload.country = 'PE';
    }

    // PRE-CARGA DE DATOS DEL PAGADOR EN DLOCAL GO (Para que el alumno no tenga que volver a escribirlos)
    if (firstName || correo || dni) {
      const cleanDoc = (dni || '').toString().trim().replace(/\D/g, '');
      let phoneClean = undefined;
      if (telefono) {
        const numOnly = telefono.toString().replace(/\D/g, '');
        phoneClean = telefono.toString().startsWith('+') ? telefono.toString().trim() : (numOnly ? `+51${numOnly}` : undefined);
      }
      requestPayload.payer = {
        name: fullName.slice(0, 100),
        email: (correo || '').trim().slice(0, 100),
        document: cleanDoc.slice(0, 20),
        document_type: 'DNI',
        phone: phoneClean
      };
    }

    console.log(`[dLocal Go] Generando pago para: "${programaSeleccionado}" - ${paymentCurrency} ${paymentAmount} (Orden: ${orderId}) con pagador:`, requestPayload.payer);

    const dlocalResponse = await fetch(`${API_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}:${SECRET_KEY}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify(requestPayload)
    });

    const data = await dlocalResponse.json();

    if (!dlocalResponse.ok) {
      console.error('[dLocal Go] Error:', data);
      return res.status(dlocalResponse.status).json({ success: false, error: data.message || 'Error en pasarela' });
    }

    // Actualizar con id de dLocal Go
    if (data.id) {
      pagos[orderId].dlocal_id = data.id;
      saveJsonFile(PAGOS_FILE, pagos);
    }

    return res.json({
      success: true,
      id: data.id,
      order_id: orderId,
      amount: data.amount,
      currency: data.currency,
      redirect_url: data.redirect_url
    });

  } catch (err) {
    console.error('[Servidor] Error:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});

// 2. Endpoint para crear Links Reutilizables de Campaña (Para Marketing)
app.post('/api/create-recurring-link', async (req, res) => {
  try {
    const { description, amount, currency, country, campaign } = req.body;

    const paymentAmount = Number(amount) || 27.0;
    const paymentCurrency = (currency || 'USD').toUpperCase();
    const programaNombre = description || 'Gestión Minera';
    const campanaNombre = campaign || 'Campaña General';

    // Generar identificador de campaña
    const linkId = 'LNK-' + Date.now();

    // Detectar dominio base (soporta localhost y Vercel en la nube)
    const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] || (req.secure || process.env.VERCEL ? 'https' : 'http');
    const baseUrl = `${protocol}://${host}`;

    // Redirección al Campus Virtual Q10 o Ficha
    const successRedirectUrl = `${baseUrl}/matricula.html?monto=${paymentAmount}&moneda=${paymentCurrency}&diplomado=${encodeURIComponent(programaNombre)}&campana=${encodeURIComponent(campanaNombre)}&link_id=${linkId}`;

    const requestPayload = {
      currency: paymentCurrency,
      amount: paymentAmount,
      description: `${programaNombre} (${campanaNombre})`,
      success_url: successRedirectUrl,
      notification_url: N8N_NOTIFICATION_URL // Blindado permanentemente a n8n
    };

    if (country && country !== 'ALL') {
      requestPayload.country = country.toUpperCase();
    }

    console.log(`[dLocal Go] Creando Link de Campaña: "${programaNombre}" - ${paymentCurrency} ${paymentAmount} [${campanaNombre}]`);

    const dlocalResponse = await fetch(`${API_URL}/v1/recurring-payments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}:${SECRET_KEY}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify(requestPayload)
    });

    const data = await dlocalResponse.json();

    if (!dlocalResponse.ok) {
      console.error('[dLocal Go] Error creando link:', data);
      return res.status(dlocalResponse.status).json({ success: false, error: data.message || 'Error en pasarela' });
    }

    // Guardar en el historial de campañas de Marketing
    const history = loadJsonFile(HISTORY_FILE, []);
    const newEntry = {
      id: linkId,
      date: new Date().toISOString(),
      program: programaNombre,
      campaign: campanaNombre,
      amount: paymentAmount,
      currency: paymentCurrency,
      country: country || 'ALL',
      url: data.url
    };
    history.unshift(newEntry);
    saveJsonFile(HISTORY_FILE, history);

    return res.json({
      success: true,
      url: data.url,
      entry: newEntry
    });

  } catch (err) {
    console.error('[Servidor] Error:', err);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// 2.1 Endpoint para obtener el historial de links de Marketing
app.get('/api/links-history', (req, res) => {
  const history = loadJsonFile(HISTORY_FILE, []);
  return res.json({ success: true, links: history });
});

// 2.2 Endpoint para validar pago y verificar si ya fue matriculado (Anti-Duplicidad)
app.get('/api/validar-pago', (req, res) => {
  const { order_id, email } = req.query;
  const pagos = loadJsonFile(PAGOS_FILE, {});
  const matriculas = loadJsonFile(MATRICULAS_FILE, []);

  // 1. Validar por order_id si existe
  if (order_id && pagos[order_id]) {
    const pago = pagos[order_id];
    if (pago.matricula_completada) {
      return res.json({
        valid: false,
        already_registered: true,
        message: `Esta compra (${order_id}) ya fue matriculada previamente. Tus accesos ya están activos.`,
        data: pago
      });
    }
    return res.json({
      valid: true,
      already_registered: false,
      data: pago
    });
  }

  // 2. Validar por correo si ya se matriculó en este mismo programa
  if (email) {
    const yaRegistrado = matriculas.find(m => m.correo.toLowerCase() === email.toLowerCase());
    if (yaRegistrado) {
      return res.json({
        valid: true,
        already_registered: true,
        message: `El correo ${email} ya cuenta con una matrícula registrada para ${yaRegistrado.diplomado}.`,
        data: yaRegistrado
      });
    }
  }

  // Si no se encuentra registro previo, se permite continuar
  return res.json({ valid: true, already_registered: false });
});

// 3. Endpoint para procesar la Ficha de Matrícula (Valida contra duplicados y envía a n8n)
app.post('/api/registrar-matricula', async (req, res) => {
  try {
    const alumnoData = req.body;
    const { order_id, correo, diplomado, numeroDocumento } = alumnoData;

    const pagos = loadJsonFile(PAGOS_FILE, {});
    const matriculas = loadJsonFile(MATRICULAS_FILE, []);

    // 1. VALIDACIÓN ANTI-DUPLICADO: Verificar si la orden ya fue usada
    if (order_id && pagos[order_id] && pagos[order_id].matricula_completada) {
      console.warn(`[Bloqueo Anti-Duplicado] Intento de reusar orden ${order_id}`);
      return res.status(400).json({
        success: false,
        error: 'Esta orden de pago ya fue utilizada para una matrícula anterior. No se puede registrar dos veces.'
      });
    }

    // 2. VALIDACIÓN ANTI-DUPLICADO: Verificar si el DNI o correo ya está matriculado en este diplomado
    const duplicado = matriculas.find(m => 
      (m.numeroDocumento === numeroDocumento || m.correo.toLowerCase() === correo.toLowerCase()) &&
      m.diplomado.toLowerCase() === diplomado.toLowerCase()
    );

    if (duplicado) {
      console.warn(`[Bloqueo Anti-Duplicado] Alumno con DNI ${numeroDocumento} / Correo ${correo} ya matriculado en ${diplomado}`);
      return res.status(400).json({
        success: false,
        error: `Ya existe una matrícula activa para el DNI ${numeroDocumento} en ${diplomado}. Si necesitas asistencia contacta a soporte.`
      });
    }

    console.log('---------------------------------------------------------');
    console.log('🎓 [Q10 - NUEVA MATRÍCULA VALIDADA Y APROBADA]:');
    console.log(`- Alumno: ${alumnoData.nombres} ${alumnoData.apellidos}`);
    console.log(`- Documento: ${alumnoData.tipoDocumento} ${alumnoData.numeroDocumento}`);
    console.log(`- Programa: ${alumnoData.diplomado}`);
    console.log(`- Correo: ${alumnoData.correo} | Tel: ${alumnoData.telefono}`);
    console.log(`- Monto Validado: ${alumnoData.montoPagado}`);
    console.log(`- Orden ID: ${order_id || 'Directo'}`);
    console.log('---------------------------------------------------------');

    // 3. Marcar la orden como matriculada (Invalida el link para futuros intentos)
    if (order_id && pagos[order_id]) {
      pagos[order_id].matricula_completada = true;
      pagos[order_id].matricula_fecha = new Date().toISOString();
      pagos[order_id].alumno_dni = numeroDocumento;
      pagos[order_id].alumno_email = correo;
      saveJsonFile(PAGOS_FILE, pagos);
    }

    // 4. Guardar en registro local
    const nuevoRegistro = {
      ...alumnoData,
      id: 'MAT-' + Date.now(),
      registeredAt: new Date().toISOString()
    };
    matriculas.unshift(nuevoRegistro);
    saveJsonFile(MATRICULAS_FILE, matriculas);

    // 5. Transmitir a n8n (Dispara el flujo oficial de Q10, Google Sheets y envío de credenciales por Gmail)
    try {
      console.log(`[n8n] Transmitiendo matrícula al flujo "PAGOS PASARELA" en n8n...`);
      
      const cleanPhone = (alumnoData.telefono || '').replace(/\D/g, '');
      const phone51 = cleanPhone.startsWith('51') ? cleanPhone : ('51' + cleanPhone);
      const parsedAmount = parseFloat(alumnoData.montoPagado) || 27.0;

      const n8nPayload = {
        event: 'payment_success',
        packageName: 'PROGRAMA COMPLETO',
        diplomado: alumnoData.diplomado,
        amount: parsedAmount,
        paymentDateFormatted: new Date().toLocaleDateString('es-PE'),
        orderNumber: order_id || ('ORD-' + Date.now()),
        customer: {
          dni: alumnoData.numeroDocumento,
          phone: phone51,
          email: alumnoData.correo,
          firstName: alumnoData.nombres,
          lastName: alumnoData.apellidos
        }
      };

      // Notificar a PAGOS PASARELA
      fetch(N8N_PASARELA_Q10_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload)
      }).then(r => console.log(`[n8n Response] Status: ${r.status}`))
        .catch(err => console.error('[n8n Error]:', err));

      // Notificar específicamente a https://n8n.gcg-corp.com/webhook/pagos-dlocalgo
      fetch(N8N_NOTIFICATION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'PAGO_VALIDADO_MATRICULA',
          timestamp: new Date().toISOString(),
          ...n8nPayload
        })
      }).then(r => console.log(`[n8n pagos-dlocalgo] Notificado con éxito (${r.status})`))
        .catch(err => console.error('[n8n pagos-dlocalgo Error]:', err));

    } catch (e) {
      console.error('[n8n Error]:', e);
    }

    return res.json({
      success: true,
      message: 'Matrícula validada y registrada con éxito. Sincronización en curso con Q10.'
    });

  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).json({ success: false, error: 'Error al procesar la matrícula' });
  }
});

// 4. Webhook para recibir confirmaciones de dLocal Go (Actualiza estado y envía correo de rescate)
app.post('/api/webhook', (req, res) => {
  const event = req.body;
  console.log('[Webhook dLocal Go Recibido]:', JSON.stringify(event));

  const orderId = event.order_id;
  const status = event.status;
  const payerEmail = event.payer?.email || event.payer_email;

  if (orderId) {
    const pagos = loadJsonFile(PAGOS_FILE, {});
    if (!pagos[orderId]) {
      pagos[orderId] = { order_id: orderId, matricula_completada: false };
    }
    pagos[orderId].status = status;
    pagos[orderId].payer_email = payerEmail;
    pagos[orderId].amount = event.amount;
    pagos[orderId].currency = event.currency;
    saveJsonFile(PAGOS_FILE, pagos);

    if (status === 'PAID') {
      console.log(`🎉 ¡VENTA PAGADA CONFIRMADA! Orden: ${orderId} - Comprador: ${payerEmail || 'No informado'}`);
      console.log(`📧 [Simulador Rescate Email] Si el alumno cierra la pestaña, n8n le envía a ${payerEmail} su enlace exclusivo de matrícula: http://localhost:${PORT}/matricula.html?order_id=${orderId}&email=${encodeURIComponent(payerEmail || '')}`);

      // Notificar directamente a https://n8n.gcg-corp.com/webhook/pagos-dlocalgo
      fetch(N8N_NOTIFICATION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evento: 'PAGO_VALIDADO_DLOCALGO',
          order_id: orderId,
          status: status,
          amount: event.amount,
          currency: event.currency,
          email: payerEmail,
          raw_event: event,
          timestamp: new Date().toISOString()
        })
      }).then(r => console.log(`[n8n pagos-dlocalgo] Webhook Venta notificado con éxito (${r.status})`))
        .catch(err => console.error('[n8n pagos-dlocalgo Error]:', err));
    }
  }

  return res.status(200).send('OK');
});

// Rutas amigables para los dos diplomados
app.get('/gestion-minera', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gestion-minera.html'));
});
app.get('/geometalurgia', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'geometalurgia.html'));
});

// Iniciar servidor local o exportar para Vercel Serverless
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Servidor VSL & Matrícula Q10 activo en: http://localhost:${PORT}`);
    console.log(`⚡ n8n Webhook Ventas: ${N8N_NOTIFICATION_URL}`);
    console.log(`🎓 n8n Webhook Matrículas Q10: ${N8N_MATRICULA_URL}`);
    console.log(`🔒 Validación Anti-Duplicidad & Token de Orden ACTIVA`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
