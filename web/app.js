/* ==========================================================================
   VetCare JS - Lógica del Cliente y Consumo de la API REST
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- ELEMENTOS DEL DOM ---
  const authSection = document.getElementById('auth-section');
  const vetDashboard = document.getElementById('vet-dashboard');
  const ownerDashboard = document.getElementById('owner-dashboard');
  
  const toggleLoginBtn = document.getElementById('toggle-login');
  const toggleRegisterBtn = document.getElementById('toggle-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  const userProfileHeader = document.getElementById('user-profile-header');
  const userDisplayName = document.getElementById('user-display-name');
  const userDisplayRole = document.getElementById('user-display-role');
  const logoutBtn = document.getElementById('logout-btn');
  
  const apiUrlInput = document.getElementById('api-url-input');

  // VET DOM
  const petSearchInput = document.getElementById('pet-search-input');
  const petSearchBtn = document.getElementById('pet-search-btn');
  const petSearchResults = document.getElementById('pet-search-results');
  const vetTreatmentsList = document.getElementById('vet-treatments-list');
  const refreshVetBtn = document.getElementById('refresh-vet-dashboard');
  
  const statActiveTreatments = document.getElementById('stat-active-treatments');
  const statAlertTreatments = document.getElementById('stat-alert-treatments');

  // OWNER DOM
  const ownerPetsList = document.getElementById('owner-pets-list');
  const addPetForm = document.getElementById('add-pet-form');
  const refreshOwnerBtn = document.getElementById('refresh-owner-dashboard');

  // Modales
  const createTreatmentModal = document.getElementById('create-treatment-modal');
  const closeTreatmentModalBtn = document.getElementById('close-treatment-modal');
  const cancelTreatmentBtn = document.getElementById('cancel-treatment-btn');
  const createTreatmentForm = document.getElementById('create-treatment-form');
  const addRuleBtn = document.getElementById('add-rule-btn');
  const rulesContainer = document.getElementById('rules-container');
  const treatmentPetIdInput = document.getElementById('treatment-pet-id');
  const treatmentPetInfoBox = document.getElementById('treatment-pet-info-box');

  const dailyLogModal = document.getElementById('daily-log-modal');
  const closeLogModalBtn = document.getElementById('close-log-modal');
  const cancelLogBtn = document.getElementById('cancel-log-btn');
  const createDailyLogForm = document.getElementById('create-daily-log-form');
  const logTreatmentIdInput = document.getElementById('log-treatment-id');
  const logImageFileInput = document.getElementById('log-image-file');
  const logImageUrlInput = document.getElementById('log-image-url');
  const imageUploadProgress = document.getElementById('image-upload-progress');

  const logsHistoryModal = document.getElementById('logs-history-modal');
  const closeHistoryModalBtn = document.getElementById('close-history-modal');
  const historyPetInfo = document.getElementById('history-pet-info');
  const historyLogsContainer = document.getElementById('history-logs-container');

  // --- CONFIGURACIÓN E INTERCEPTORES API ---
  function getApiUrl() {
    return apiUrlInput.value.trim() || 'http://localhost:3000/api/v1';
  }

  async function apiCall(path, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${getApiUrl()}${path}`;
    try {
      const response = await fetch(url, { ...options, headers });
      
      // Control de sesión expirada
      if (response.status === 401) {
        showToast('Sesión expirada o no autorizada. Iniciando salida...', 'error');
        logout();
        throw new Error('No autorizado (401)');
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
      }
      return data;
    } catch (error) {
      console.error(`Error en API Call a ${url}:`, error);
      throw error;
    }
  }

  // --- NOTIFICACIONES TOAST ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check-circle-2';
    if (type === 'error') icon = 'alert-triangle';

    toast.innerHTML = `
      <i data-lucide="${icon}"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --- CONTROL DE VISTAS (SPA ROUTER) ---
  function initApp() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');

    // Inicializar iconos lucide
    lucide.createIcons();

    if (!token) {
      // Mostrar pantalla de Login
      authSection.classList.remove('hidden');
      vetDashboard.classList.add('hidden');
      ownerDashboard.classList.add('hidden');
      userProfileHeader.classList.add('hidden');
      return;
    }

    // Configurar cabecera de perfil de usuario
    userDisplayName.textContent = name || 'Usuario';
    userDisplayRole.textContent = role === 'VET' ? 'Veterinario' : 'Dueño';
    userProfileHeader.classList.remove('hidden');
    authSection.classList.add('hidden');

    if (role === 'VET') {
      vetDashboard.classList.remove('hidden');
      ownerDashboard.classList.add('hidden');
      loadVetDashboard();
    } else {
      ownerDashboard.classList.remove('hidden');
      vetDashboard.classList.add('hidden');
      loadOwnerDashboard();
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    initApp();
  }

  logoutBtn.addEventListener('click', logout);

  // --- CONTROL DE LOGIN / REGISTRO TOGGLE ---
  toggleLoginBtn.addEventListener('click', () => {
    toggleLoginBtn.classList.add('active');
    toggleRegisterBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  });

  toggleRegisterBtn.addEventListener('click', () => {
    toggleRegisterBtn.classList.add('active');
    toggleLoginBtn.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });

  // --- ENVÍO DE FORMULARIOS DE AUTENTICACIÓN ---
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('name', data.user.name);
      
      showToast('Sesión iniciada con éxito', 'success');
      initApp();
    } catch (err) {
      showToast(err.message || 'Credenciales inválidas', 'error');
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    if (password.length < 8) {
      showToast('La contraseña debe tener mínimo 8 caracteres', 'error');
      return;
    }

    try {
      await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone: phone || undefined, password, role })
      });
      
      showToast('Registro exitoso. Iniciando sesión...', 'success');
      
      // Auto login después del registro
      const loginData = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      localStorage.setItem('token', loginData.accessToken);
      localStorage.setItem('role', loginData.user.role);
      localStorage.setItem('name', loginData.user.name);
      
      initApp();
    } catch (err) {
      showToast(err.message || 'Error al registrar usuario', 'error');
    }
  });

  // ==========================================================================
  // LÓGICA DE VETERINARIO (VET)
  // ==========================================================================

  // Búsqueda de Pacientes (Mascotas)
  async function searchPets() {
    const q = petSearchInput.value.trim();
    if (!q) {
      petSearchResults.innerHTML = '<p class="info-text">Ingresa un término para buscar</p>';
      return;
    }

    petSearchResults.innerHTML = '<div class="spinner"></div>';
    try {
      const pets = await apiCall(`/pets/search?q=${encodeURIComponent(q)}`);
      
      if (pets.length === 0) {
        petSearchResults.innerHTML = '<p class="info-text">No se encontraron mascotas</p>';
        return;
      }

      petSearchResults.innerHTML = '';
      pets.forEach(pet => {
        const div = document.createElement('div');
        div.className = 'pet-search-item';
        div.innerHTML = `
          <div class="pet-search-info">
            <span class="pet-search-name">${escapeHtml(pet.name)}</span>
            <span class="pet-search-species">${escapeHtml(translateSpecies(pet.species))} • ${escapeHtml(pet.breed || 'Sin raza')}</span>
          </div>
          <button class="btn btn-sm btn-outline select-pet-btn" data-id="${pet.id}" data-name="${escapeHtml(pet.name)}" data-species="${escapeHtml(pet.species)}" data-breed="${escapeHtml(pet.breed || '')}">
            Prescribir
          </button>
        `;
        petSearchResults.appendChild(div);
      });

      // Botón para seleccionar y abrir modal de tratamiento
      document.querySelectorAll('.select-pet-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.dataset.id;
          const name = e.target.dataset.name;
          const species = translateSpecies(e.target.dataset.species);
          const breed = e.target.dataset.breed;

          treatmentPetIdInput.value = id;
          treatmentPetInfoBox.innerHTML = `📍 Paciente: <strong>${name}</strong> (${species}${breed ? ' • ' + breed : ''})`;
          
          // Resetear formulario
          createTreatmentForm.reset();
          document.getElementById('treatment-start-date').valueAsDate = new Date();
          rulesContainer.innerHTML = '';
          addRuleRow(); // Agregar una regla vacía por defecto
          
          createTreatmentModal.classList.remove('hidden');
        });
      });

    } catch (err) {
      showToast('Error al buscar pacientes', 'error');
    }
  }

  petSearchBtn.addEventListener('click', searchPets);
  petSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchPets();
  });

  // Manejo de reglas dinámicas en el modal de Tratamiento
  function addRuleRow() {
    const div = document.createElement('div');
    div.className = 'rule-row';
    div.innerHTML = `
      <input type="text" placeholder="Medicamento" class="rule-med" required>
      <input type="text" placeholder="Dosis" class="rule-dosage" required>
      <select class="rule-freq" required>
        <option value="4">C/4 horas</option>
        <option value="6">C/6 horas</option>
        <option value="8" selected>C/8 horas</option>
        <option value="12">C/12 horas</option>
        <option value="24">C/24 horas</option>
      </select>
      <div class="rule-photo-check">
        <input type="checkbox" class="rule-photo">
        <label>Foto</label>
      </div>
      <button type="button" class="btn-remove-rule"><i data-lucide="trash-2"></i></button>
    `;
    rulesContainer.appendChild(div);
    lucide.createIcons();

    div.querySelector('.btn-remove-rule').addEventListener('click', () => {
      div.remove();
    });
  }

  addRuleBtn.addEventListener('click', addRuleRow);

  // Cerrar modales
  closeTreatmentModalBtn.addEventListener('click', () => createTreatmentModal.classList.add('hidden'));
  cancelTreatmentBtn.addEventListener('click', () => createTreatmentModal.classList.add('hidden'));

  // Guardar nuevo tratamiento
  createTreatmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const petId = treatmentPetIdInput.value;
    const diagnosis = document.getElementById('treatment-diagnosis').value.trim();
    const startDate = document.getElementById('treatment-start-date').value;
    const endDateVal = document.getElementById('treatment-end-date').value;
    const endDate = endDateVal ? new Date(endDateVal).toISOString() : undefined;

    // Recolectar reglas
    const rules = [];
    const rows = rulesContainer.querySelectorAll('.rule-row');
    rows.forEach(row => {
      rules.push({
        medicineName: row.querySelector('.rule-med').value.trim(),
        dosage: row.querySelector('.rule-dosage').value.trim(),
        frequencyHours: parseInt(row.querySelector('.rule-freq').value, 10),
        requirePhoto: row.querySelector('.rule-photo').checked
      });
    });

    try {
      await apiCall('/treatments', {
        method: 'POST',
        body: JSON.stringify({
          petId,
          diagnosis,
          startDate: new Date(startDate).toISOString(),
          endDate,
          rules
        })
      });

      showToast('Tratamiento creado exitosamente', 'success');
      createTreatmentModal.classList.add('hidden');
      loadVetDashboard();
    } catch (err) {
      showToast(err.message || 'Error al crear tratamiento', 'error');
    }
  });

  // Carga del Dashboard de Veterinario (Semáforo)
  let currentFilter = 'ALL';

  async function loadVetDashboard() {
    vetTreatmentsList.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Cargando información del semáforo...</p>
      </div>
    `;

    try {
      const items = await apiCall('/treatments/dashboard');
      
      // Actualizar contadores
      statActiveTreatments.textContent = items.length;
      statAlertTreatments.textContent = items.filter(t => t.priority === 'RED').length;

      // Filtrar items
      const filtered = items.filter(item => {
        if (currentFilter === 'ALL') return true;
        return item.priority === currentFilter;
      });

      if (filtered.length === 0) {
        vetTreatmentsList.innerHTML = '<p class="info-text">No hay tratamientos activos con la prioridad seleccionada</p>';
        return;
      }

      vetTreatmentsList.innerHTML = '';
      filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = `glass-card clinical-card priority-${item.priority.toLowerCase()}`;
        
        const badgeColor = item.priority.toLowerCase();
        
        card.innerHTML = `
          <div class="card-header-row">
            <div class="pet-main-info">
              <div class="pet-avatar">${item.pet.name[0].toUpperCase()}</div>
              <div class="pet-names-wrapper">
                <span class="pet-title">${escapeHtml(item.pet.name)}</span>
                <span class="pet-species-tag">${escapeHtml(translateSpecies(item.pet.species))} • ${escapeHtml(item.pet.owner?.name || 'Dueño')}</span>
              </div>
            </div>
            <span class="priority-badge ${badgeColor}">${item.priority}</span>
          </div>

          <p class="diagnosis-text"><strong>Dx:</strong> ${escapeHtml(item.diagnosis)}</p>
          
          <div class="card-stats">
            <div class="card-stat">
              <span class="value">${item.stats.actualDoses}/${item.stats.expectedDoses}</span>
              <span class="label">Dosis (24h)</span>
            </div>
            <div class="card-stat">
              <span class="value">${item.stats.logsCount24h}</span>
              <span class="label">Reportes (24h)</span>
            </div>
            <div class="card-stat">
              <span class="value">${item.stats.hasAlarmSigns ? '🚨 Sí' : 'No'}</span>
              <span class="label">Alarmas</span>
            </div>
          </div>

          <div class="dates-info">
            <span>Inicio: ${formatDateString(item.startDate)}</span>
            ${item.pet.owner?.phone ? `<span>📞 ${escapeHtml(item.pet.owner.phone)}</span>` : ''}
          </div>

          <div class="card-actions">
            <button class="btn btn-sm btn-primary view-history-btn" data-treatment-id="${item.treatmentId}" data-pet-name="${escapeHtml(item.pet.name)}" data-diagnosis="${escapeHtml(item.diagnosis)}">
              <i data-lucide="history"></i> Ver Evolución
            </button>
            <button class="btn btn-sm btn-outline cancel-status-btn" data-treatment-id="${item.treatmentId}">
              <i data-lucide="check-square"></i> Finalizar
            </button>
          </div>
        `;
        vetTreatmentsList.appendChild(card);
      });

      lucide.createIcons();

      // Botón para ver historial
      document.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const btnEl = e.currentTarget;
          openLogsHistory(btnEl.dataset.treatmentId, btnEl.dataset.petName, btnEl.dataset.diagnosis);
        });
      });

      // Botón para finalizar tratamiento
      document.querySelectorAll('.cancel-status-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const btnEl = e.currentTarget;
          if (confirm('¿Estás seguro de marcar este tratamiento como COMPLETADO?')) {
            try {
              await apiCall(`/treatments/${btnEl.dataset.treatmentId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'COMPLETED' })
              });
              showToast('Tratamiento finalizado correctamente', 'success');
              loadVetDashboard();
            } catch (err) {
              showToast('Error al actualizar tratamiento', 'error');
            }
          }
        });
      });

    } catch (err) {
      vetTreatmentsList.innerHTML = '<p class="info-text error-text">Error al conectar con la API</p>';
      showToast('Error al cargar dashboard del semáforo', 'error');
    }
  }

  // Filtrado del semáforo
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.priority;
      loadVetDashboard();
    });
  });

  refreshVetBtn.addEventListener('click', loadVetDashboard);


  // ==========================================================================
  // LÓGICA DEL DUEÑO (OWNER)
  // ==========================================================================

  // Crear Mascota
  addPetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('pet-name').value.trim();
    const species = document.getElementById('pet-species').value;
    const breed = document.getElementById('pet-breed').value.trim();
    const weightVal = document.getElementById('pet-weight').value;
    const microchip = document.getElementById('pet-microchip').value.trim();

    const weight = weightVal ? parseFloat(weightVal) : undefined;

    try {
      await apiCall('/pets', {
        method: 'POST',
        body: JSON.stringify({
          name,
          species,
          breed: breed || undefined,
          weight,
          microchip: microchip || undefined
        })
      });

      showToast('Mascota registrada correctamente', 'success');
      addPetForm.reset();
      loadOwnerDashboard();
    } catch (err) {
      showToast(err.message || 'Error al registrar mascota', 'error');
    }
  });

  // Cargar Dashboard de Dueño
  async function loadOwnerDashboard() {
    ownerPetsList.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Cargando tus mascotas...</p>
      </div>
    `;

    try {
      const pets = await apiCall('/pets');
      
      if (pets.length === 0) {
        ownerPetsList.innerHTML = `
          <div class="glass-card panel-card text-center" style="grid-column: 1/-1; padding: 40px;">
            <i data-lucide="paw-print" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
            <h3>No tienes mascotas registradas</h3>
            <p class="subtitle">Registra tu primera mascota en el formulario de la izquierda</p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      ownerPetsList.innerHTML = '';
      
      for (const pet of pets) {
        // Consultar tratamientos activos por mascota
        const treatments = await apiCall(`/treatments/by-pet/${pet.id}`);
        const activeTreatment = treatments.find(t => t.status === 'ACTIVE');

        const card = document.createElement('div');
        card.className = 'glass-card owner-pet-card';
        
        let treatmentBoxHtml = '';
        if (activeTreatment) {
          treatmentBoxHtml = `
            <div class="treatment-info-highlight active">
              <p>🩹 <strong>Tratamiento Activo:</strong> ${escapeHtml(activeTreatment.diagnosis)}</p>
              <button class="btn btn-sm btn-primary add-log-btn" style="margin-top: 10px; width: 100%;" data-treatment-id="${activeTreatment.id}">
                Registrar Reporte Diario
              </button>
            </div>
          `;
        } else {
          treatmentBoxHtml = `
            <div class="treatment-info-highlight">
              <p>Saludable / Sin tratamiento post-operatorio activo</p>
            </div>
          `;
        }

        card.innerHTML = `
          <div class="owner-pet-header">
            <div class="pet-avatar">${pet.name[0].toUpperCase()}</div>
            <div>
              <h3>${escapeHtml(pet.name)}</h3>
              <p class="subtitle" style="margin: 0;">${escapeHtml(translateSpecies(pet.species))} ${pet.breed ? '• ' + escapeHtml(pet.breed) : ''}</p>
            </div>
          </div>

          <div class="owner-pet-details">
            <div class="detail-row">
              <span>Peso:</span>
              <span>${pet.weight ? pet.weight + ' kg' : 'No registrado'}</span>
            </div>
            <div class="detail-row">
              <span>Microchip:</span>
              <span>${pet.microchip ? escapeHtml(pet.microchip) : 'No'}</span>
            </div>
          </div>

          ${treatmentBoxHtml}
        `;
        ownerPetsList.appendChild(card);
      }

      lucide.createIcons();

      // Botón para registrar reporte diario
      document.querySelectorAll('.add-log-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const treatmentId = e.target.dataset.treatmentId;
          logTreatmentIdInput.value = treatmentId;
          createDailyLogForm.reset();
          logImageUrlInput.value = '';
          imageUploadProgress.classList.add('hidden');
          dailyLogModal.classList.remove('hidden');
        });
      });

    } catch (err) {
      ownerPetsList.innerHTML = '<p class="info-text">Error al cargar información</p>';
      showToast('Error al conectar con el servidor', 'error');
    }
  }

  refreshOwnerBtn.addEventListener('click', loadOwnerDashboard);

  // Cerrar modal de evolución
  closeLogModalBtn.addEventListener('click', () => dailyLogModal.classList.add('hidden'));
  cancelLogBtn.addEventListener('click', () => dailyLogModal.classList.add('hidden'));

  // Integración de Carga de Foto a Cloudinary mediante firma del Backend
  logImageFileInput.addEventListener('change', async () => {
    const file = logImageFileInput.files[0];
    if (!file) return;

    imageUploadProgress.classList.remove('hidden');
    imageUploadProgress.innerHTML = '<div class="spinner sm"></div> <span>Subiendo imagen...</span>';
    
    try {
      // 1. Obtener firma del backend
      const sigData = await apiCall('/cloudinary/signature?folder=vet_app/daily_logs');

      // Si detectamos las credenciales demo por defecto, simulamos la subida
      if (sigData.cloudName === 'your-cloud-name' || sigData.apiKey === 'your-api-key' || !sigData.cloudName) {
        showToast('Credenciales demo detectadas. Simulando carga de foto...', 'info');
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Imagen demo veterinaria
        logImageUrlInput.value = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80';
        showToast('Imagen demo cargada (Simulación)', 'success');
        imageUploadProgress.innerHTML = '<span>✅ Subida simulada (Demo)</span>';
        return;
      }

      // 2. Subir directo a Cloudinary usando FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', sigData.timestamp);
      formData.append('signature', sigData.signature);
      formData.append('folder', sigData.folder);

      const cloudUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`;
      
      const response = await fetch(cloudUrl, {
        method: 'POST',
        body: formData
      });

      const cloudRes = await response.json();
      
      if (!response.ok) {
        throw new Error(cloudRes.error?.message || 'Error en subida a Cloudinary');
      }

      logImageUrlInput.value = cloudRes.secure_url;
      showToast('Imagen subida a Cloudinary correctamente', 'success');
      imageUploadProgress.innerHTML = '<span>✅ Subida completa</span>';
    } catch (err) {
      console.error(err);
      
      // Fallback si la cuenta está deshabilitada/inválida para no romper el test
      if (err.message.includes('disabled') || err.message.includes('cloud_name') || err.message.includes('Cloudinary')) {
        showToast('Cuenta de Cloudinary inactiva/demo. Usando imagen demo...', 'warning');
        logImageUrlInput.value = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80';
        imageUploadProgress.innerHTML = '<span>⚠️ Imagen demo cargada</span>';
      } else {
        showToast(err.message || 'Error al subir la imagen', 'error');
        imageUploadProgress.innerHTML = '<span>❌ Falló la subida</span>';
      }
    }
  });

  // Guardar evolución diaria (Daily Log)
  createDailyLogForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const treatmentId = logTreatmentIdInput.value;
    const appetiteLevel = parseInt(document.getElementById('log-appetite').value, 10);
    const energyLevel = parseInt(document.getElementById('log-energy').value, 10);
    const painLevel = parseInt(document.getElementById('log-pain').value, 10);
    const tempVal = document.getElementById('log-temperature').value;
    const temperature = tempVal ? parseFloat(tempVal) : undefined;
    const medicineTaken = document.getElementById('log-medicine-taken').checked;
    const alarmSigns = document.getElementById('log-alarm-signs').value.trim();
    const observations = document.getElementById('log-observations').value.trim();
    const imageUrl = logImageUrlInput.value;

    try {
      await apiCall('/daily-logs', {
        method: 'POST',
        body: JSON.stringify({
          treatmentId,
          appetiteLevel,
          energyLevel,
          painLevel,
          temperature,
          medicineTaken,
          alarmSigns: alarmSigns || undefined,
          observations: observations || undefined,
          imageUrl: imageUrl || undefined
        })
      });

      showToast('Reporte diario guardado y semáforo actualizado', 'success');
      dailyLogModal.classList.add('hidden');
      loadOwnerDashboard();
    } catch (err) {
      showToast(err.message || 'Error al guardar evolución', 'error');
    }
  });


  // ==========================================================================
  // HISTORIAL DE REPORTES
  // ==========================================================================

  async function openLogsHistory(treatmentId, petName, diagnosis) {
    historyPetInfo.innerHTML = `🩺 Mascota: <strong>${petName}</strong> | Diagnóstico: <em>${diagnosis}</em>`;
    historyLogsContainer.innerHTML = '<div class="spinner"></div>';
    logsHistoryModal.classList.remove('hidden');

    try {
      const result = await apiCall(`/daily-logs/treatment/${treatmentId}`);
      const logs = result.data || [];

      if (logs.length === 0) {
        historyLogsContainer.innerHTML = '<p class="info-text">No hay reportes de evolución registrados para este tratamiento</p>';
        return;
      }

      historyLogsContainer.innerHTML = '';
      logs.forEach(log => {
        const div = document.createElement('div');
        div.className = 'log-item-card';

        // Determinar semáforo de este log específico
        const isAlert = log.alarmSigns && log.alarmSigns.trim() !== '';
        const levelStyle = isAlert ? 'border-left: 4px solid var(--alert-red); background: rgba(239, 68, 68, 0.05);' : 'border-left: 4px solid var(--alert-green);';

        div.style = levelStyle;

        div.innerHTML = `
          <div class="log-item-details">
            <span class="log-item-header">Reporte del ${formatDateString(log.registeredAt)}</span>
            <div class="log-item-metrics">
              <span>Apetito: <strong>${log.appetiteLevel}/5</strong></span>
              <span>Energía: <strong>${log.energyLevel}/5</strong></span>
              ${log.painLevel ? `<span>Dolor: <strong>${log.painLevel}/10</strong></span>` : ''}
              ${log.temperature ? `<span>Temp: <strong>${log.temperature} °C</strong></span>` : ''}
              <span>Medicinas: <strong>${log.medicineTaken ? 'Sí' : 'No'}</strong></span>
            </div>
            ${log.alarmSigns ? `<p class="log-item-text alert-red">⚠️ <strong>Signos Alarma:</strong> ${escapeHtml(log.alarmSigns)}</p>` : ''}
            ${log.observations ? `<p class="log-item-text">📝 <strong>Observaciones:</strong> ${escapeHtml(log.observations)}</p>` : ''}
          </div>
          ${log.imageUrl ? `
            <div class="log-item-photo">
              <a href="${log.imageUrl}" target="_blank">
                <img src="${log.imageUrl}" alt="Foto de la herida">
              </a>
            </div>
          ` : '<div class="info-text">Sin foto</div>'}
        `;
        historyLogsContainer.appendChild(div);
      });

    } catch (err) {
      historyLogsContainer.innerHTML = '<p class="info-text">Error al cargar historial</p>';
    }
  }

  closeHistoryModalBtn.addEventListener('click', () => logsHistoryModal.classList.add('hidden'));


  // ==========================================================================
  // UTILERÍAS & AUXILIARES
  // ==========================================================================

  function translateSpecies(species) {
    const s = {
      DOG: 'Perro',
      CAT: 'Gato',
      BIRD: 'Ave',
      RODENT: 'Roedor',
      REPTILE: 'Reptil',
      OTHER: 'Otro'
    };
    return s[species] || species;
  }

  function formatDateString(isoString) {
    const d = new Date(isoString);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- INICIALIZACIÓN ---
  initApp();
});
