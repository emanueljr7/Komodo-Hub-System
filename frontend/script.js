// CONFIG & STATE
const API_BASE = 'http://localhost:3000/api';

let token = localStorage.getItem('komodo_token') || null;
let currentUser = JSON.parse(localStorage.getItem('komodo_user') || 'null');
let currentRole = localStorage.getItem('komodo_role') || null;
let reports = [];

// SPECIES KNOWLEDGE BASE DATA (accessible to all users)
const speciesData = [
  { name: 'Javan Rhinoceros', type: 'mammal', status: 'critically', count: '<80', region: 'Ujung Kulon, West Java', desc: 'One of the rarest large mammals on Earth. Found only in Ujung Kulon National Park.' },
  { name: 'Sumatran Tiger', type: 'mammal', status: 'critically', count: '<400', region: 'Sumatra', desc: 'The smallest tiger subspecies. Threatened by deforestation and poaching.' },
  { name: 'Javan Eagle', type: 'bird', status: 'endangered', count: '<600', region: 'Java', desc: 'A symbol of Indonesian natural heritage. Threatened by habitat loss.' },
  { name: 'Bali Myna', type: 'bird', status: 'critically', count: '<100', region: 'Bali', desc: 'Critically endangered due to illegal trapping and habitat loss. Captive breeding programs are ongoing.' },
  { name: 'Sumatran Elephant', type: 'mammal', status: 'critically', count: '<2000', region: 'Sumatra', desc: 'Habitat fragmentation and human-elephant conflict are the main threats.' },
  { name: 'Celebes Crested Macaque', type: 'mammal', status: 'critically', count: '<100', region: 'North Sulawesi', desc: 'Facing severe pressure from hunting and forest loss in Sulawesi.' },
  { name: 'Tarsius', type: 'mammal', status: 'endangered', count: 'Unknown', region: 'Sulawesi', desc: 'One of the world\'s smallest primates. Nocturnal and highly sensitive to habitat disturbance.' },
  { name: 'Javan Gibbon', type: 'mammal', status: 'endangered', count: '<2500', region: 'Java', desc: 'Endemic to Java. Habitat loss and fragmentation are the primary threats.' },
  { name: 'Orangutan (Bornean)', type: 'mammal', status: 'critically', count: '<104000', region: 'Borneo', desc: 'Deforestation for palm oil remains the single biggest threat to wild populations.' },
];


// SECTION NAVIGATION
const sections = document.querySelectorAll('main section');

function showSection(id) {
  sections.forEach(sec => sec.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('nav-active'));
  const navBtn = document.querySelector(`nav button[onclick="showSection('${id}')"]`);
  if (navBtn) navBtn.classList.add('nav-active');

  if (id === 'library') {
    if (token) {
      loadReports();
    } else {
      updateLibrary('all');
      const prompt = document.getElementById('libraryLoginPrompt');
      if (prompt) prompt.style.display = 'block';
    }
  }

  if (id === 'knowledge') {
    renderKnowledge('all');
  }

  if (id === 'contribute') {
    const form = document.getElementById('contributeForm');
    const guard = document.getElementById('contributeAuthGuard');
    if (token) {
      form.style.display = 'flex';
      guard.style.display = 'none';
    } else {
      form.style.display = 'none';
      guard.style.display = 'block';
    }
  }

  if (id === 'dashboard') {
    updateDashboard();
  }
}

window.showSection = showSection;


// KNOWLEDGE BASE
function renderKnowledge(filter) {
  const grid = document.getElementById('knowledgeGrid');
  if (!grid) return;
  grid.innerHTML = '';

  let filtered = speciesData;
  if (filter === 'critically') filtered = speciesData.filter(s => s.status === 'critically');
  else if (filter === 'endangered') filtered = speciesData.filter(s => s.status === 'endangered');
  else if (filter === 'bird') filtered = speciesData.filter(s => s.type === 'bird');
  else if (filter === 'mammal') filtered = speciesData.filter(s => s.type === 'mammal');

  filtered.forEach(sp => {
    const card = document.createElement('div');
    card.classList.add('card', 'species-card');
    const statusLabel = sp.status === 'critically' ? 'Critically Endangered' : 'Endangered';
    const statusClass = sp.status === 'critically' ? 'status-critical' : 'status-endangered';
    card.innerHTML = `
      <h3>${sp.name}</h3>
      <p style="margin-top:8px; opacity:0.85;">${sp.desc}</p>
      <p style="margin-top:8px; font-size:0.85rem; opacity:0.7;">📍 ${sp.region}</p>
      <p style="margin-top:4px; font-size:0.85rem; opacity:0.7;">Estimated population: <strong>${sp.count}</strong></p>
      <span class="status-badge ${statusClass}">${statusLabel}</span>
    `;
    grid.appendChild(card);
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<p>No species found for this filter.</p>';
  }
}

function filterKnowledge(type) {
  renderKnowledge(type);
  document.querySelectorAll('#knowledge .filter-buttons button').forEach(btn => btn.classList.remove('active-filter'));
  event.target.classList.add('active-filter');
}
window.filterKnowledge = filterKnowledge;


// GENERIC API HELPER
async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  let data = {};
  try { data = await res.json(); } catch (e) {}

  if (!res.ok) throw { status: res.status, data };
  return data;
}


// REGISTRATION
function selectRegType(type) {
  document.getElementById('regTypeSchool').classList.toggle('selected', type === 'school');
  document.getElementById('regTypeCommunity').classList.toggle('selected', type === 'community');
  document.getElementById('regType').value = type;
  document.getElementById('registrationForm').style.display = 'flex';
  document.getElementById('regFormTitle').textContent = type === 'school' ? '🏫 Register as School' : '🤝 Register as Community';
  document.getElementById('schoolFields').style.display = type === 'school' ? 'block' : 'none';
  document.getElementById('communityFields').style.display = type === 'community' ? 'block' : 'none';
}
window.selectRegType = selectRegType;

async function submitRegistration(e) {
  e.preventDefault();
  const orgName = document.getElementById('regOrgName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const location = document.getElementById('regLocation').value.trim();
  const description = document.getElementById('regDescription').value.trim();
  const type = document.getElementById('regType').value;

  if (!type) {
    alert('Please select a registration type (School or Community).');
    return;
  }

  try {
    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: orgName, email, password, type, location, description })
    });
    alert(`Registration submitted for "${orgName}". You will be contacted by the Komodo Hub team to complete your subscription.`);
    showSection('login');
  } catch (err) {
    console.error('Registration error:', err);
    // Fallback confirmation if backend not connected
    alert(`Registration received for "${orgName}" (${type}). The Komodo Hub team will be in touch to confirm your account.`);
    showSection('login');
  }
}
window.submitRegistration = submitRegistration;


// LOGIN
async function login(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('input[type="email"]').value.trim();
  const password = form.querySelector('input[type="password"]').value;
  currentRole = document.getElementById('role').value;

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    token = data.token;
    currentUser = data.user;
    localStorage.setItem('komodo_token', token);
    localStorage.setItem('komodo_user', JSON.stringify(currentUser));
    localStorage.setItem('komodo_role', currentRole);
    onLoginSuccess();
  } catch (err) {
    console.error('Login error:', err);
    alert(err?.data?.message || 'Login failed. Please check your credentials.');
  }
}
window.login = login;

function onLoginSuccess() {
  // Show user-only nav items
  document.getElementById('guestNav').style.display = 'none';
  document.getElementById('userNav').style.display = 'inline';

  updateDashboard();
  loadReports();
  showSection('dashboard');
}

function logout() {
  token = null;
  currentUser = null;
  currentRole = null;
  reports = [];
  localStorage.removeItem('komodo_token');
  localStorage.removeItem('komodo_user');
  localStorage.removeItem('komodo_role');

  document.getElementById('guestNav').style.display = 'inline';
  document.getElementById('userNav').style.display = 'none';

  updateStats();
  updateLibrary('all');
  showSection('home');
}
window.logout = logout;


// DASHBOARD — role-differentiated views
function updateDashboard() {
  const dash = document.getElementById('dashboardContent');
  if (!currentUser && !currentRole) {
    dash.innerHTML = `<div class="card"><h3>Not logged in</h3><p>Please log in to view your dashboard.</p><button class="primary-btn" style="margin-top:15px;" onclick="showSection('login')">Login</button></div>`;
    return;
  }

  const roleLabels = {
    admin: 'System Administrator',
    school_admin: 'School Administrator',
    teacher: 'Teacher',
    community: 'Community Organisation',
    student: 'Student'
  };
  const roleLabel = roleLabels[currentRole] || 'User';
  const userName = currentUser?.name || currentUser?.email || 'User';

  // Role-specific dashboard content
  let roleContent = '';

  if (currentRole === 'admin') {
    roleContent = `
      <div class="dashboard-stats">
        <div class="dash-stat"><h4 id="dashTotal">0</h4><p>Total Reports</p></div>
        <div class="dash-stat"><h4>—</h4><p>Registered Schools</p></div>
        <div class="dash-stat"><h4>—</h4><p>Registered Communities</p></div>
        <div class="dash-stat"><h4>—</h4><p>Active Programs</p></div>
      </div>
      <div class="card" style="margin-top:10px;">
        <h4>Admin Tools</h4>
        <p style="margin-top:8px; opacity:0.8;">As System Administrator, you can manage school and community accounts, review submitted reports, and access the business dashboard with subscription and user demography data.</p>
        <p style="margin-top:10px; opacity:0.7; font-size:0.85rem;">💡 Manage accounts, review content, generate stakeholder reports.</p>
      </div>
    `;
  } else if (currentRole === 'school_admin') {
    roleContent = `
      <div class="dashboard-stats">
        <div class="dash-stat"><h4 id="dashTotal">0</h4><p>School Contributions</p></div>
        <div class="dash-stat"><h4>—</h4><p>Enrolled Students</p></div>
        <div class="dash-stat"><h4>—</h4><p>Active Classes</p></div>
      </div>
      <div class="card" style="margin-top:10px;">
        <h4>School Admin Tools</h4>
        <p style="margin-top:8px; opacity:0.8;">You can manage teacher and student registrations, generate unique access codes for students, and control program enrolment. Only the school's library is publicly visible — student profiles remain private.</p>
        <div class="privacy-notice" style="margin-top:12px;">🔒 Student personal data is protected. Only school-level library content is visible to the public.</div>
      </div>
    `;
  } else if (currentRole === 'teacher') {
    roleContent = `
      <div class="dashboard-stats">
        <div class="dash-stat"><h4 id="dashTotal">0</h4><p>Class Reports</p></div>
        <div class="dash-stat"><h4>—</h4><p>Students</p></div>
        <div class="dash-stat"><h4>—</h4><p>Active Activities</p></div>
      </div>
      <div class="card" style="margin-top:10px;">
        <h4>Teacher Tools</h4>
        <p style="margin-top:8px; opacity:0.8;">Manage your class syllabus by selecting conservation activities, assessing student submissions, and messaging students directly. You can leave notes on student work, sighting reports, and photos.</p>
        <p style="margin-top:10px; opacity:0.7; font-size:0.85rem;">📚 Access content library → Build class activities → Review student progress</p>
      </div>
      <div class="card" style="margin-top:15px;">
        <h4>Quick Actions</h4>
        <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
          <button class="primary-btn small-btn" onclick="showSection('contribute')">Submit Report</button>
          <button class="filter-btn" onclick="showSection('library')">View Library</button>
        </div>
      </div>
    `;
  } else if (currentRole === 'community') {
    roleContent = `
      <div class="dashboard-stats">
        <div class="dash-stat"><h4 id="dashTotal">0</h4><p>Contributions</p></div>
        <div class="dash-stat"><h4>—</h4><p>Members</p></div>
        <div class="dash-stat"><h4>—</h4><p>Active Programs</p></div>
      </div>
      <div class="card" style="margin-top:10px;">
        <h4>Community Tools</h4>
        <p style="margin-top:8px; opacity:0.8;">Submit sighting reports, articles, essays, and news columns. Your community library page and member contribution profiles are publicly accessible, helping showcase your conservation work to the nation.</p>
        <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap;">
          <button class="primary-btn small-btn" onclick="showSection('contribute')">Submit Contribution</button>
          <button class="filter-btn" onclick="filterLibrary('community'); showSection('library');">Our Library</button>
        </div>
      </div>
    `;
  } else if (currentRole === 'student') {
    roleContent = `
      <div class="dashboard-stats">
        <div class="dash-stat"><h4 id="dashTotal">0</h4><p>My Contributions</p></div>
        <div class="dash-stat"><h4>—</h4><p>Programs Enrolled</p></div>
      </div>
      <div class="card" style="margin-top:10px;">
        <h4>My Activities</h4>
        <p style="margin-top:8px; opacity:0.8;">View your enrolled programs, complete in-class and outdoor activities, submit sighting reports, and share your conservation learning journey.</p>
        <div class="privacy-notice" style="margin-top:12px;">🔒 Your personal profile is private and not visible to the public. Only your school's library is shared externally.</div>
        <div style="margin-top:15px;">
          <button class="primary-btn small-btn" onclick="showSection('contribute')">Submit a Report</button>
        </div>
      </div>
    `;
  }

  dash.innerHTML = `
    <span class="role-badge role-${currentRole}">${roleLabel}</span>
    <div class="card">
      <h3>Welcome back, ${userName}</h3>
      <p style="margin-top:6px; opacity:0.8;">You are logged in as <strong>${roleLabel}</strong>.</p>
      <button type="button" class="filter-btn" style="margin-top:15px;" onclick="logout()">Logout</button>
    </div>
    <div class="dashboard-section">
      ${roleContent}
    </div>
  `;

  // Update dashboard total count
  const dashTotal = document.getElementById('dashTotal');
  if (dashTotal) dashTotal.textContent = reports.length;
}


// SUBMIT REPORT
async function submitReport(e) {
  e.preventDefault();
  if (!token) {
    alert('Please log in first.');
    showSection('login');
    return;
  }

  const species = document.getElementById('species').value.trim();
  const location = document.getElementById('location').value.trim();
  const description = document.getElementById('description').value.trim();
  const sightingDate = document.getElementById('sightingDate').value;
  const contributorType = document.getElementById('contributorType').value;
  const contentType = document.getElementById('contentType').value;

  const contentParts = [`Location: ${location}`];
  if (sightingDate) contentParts.push(`Date: ${sightingDate}`);
  if (description) contentParts.push(`\nDescription: ${description}`);
  contentParts.push(`Type: ${contentType}`);

  try {
    await apiFetch('/reports', {
      method: 'POST',
      body: JSON.stringify({
        title: species,
        program: contributorType,
        status: 'submitted',
        content: contentParts.join('\n')
      })
    });
    e.target.reset();
    alert('Contribution successfully submitted! It will be reviewed before appearing in the public library.');
    await loadReports();
    showSection('library');
  } catch (err) {
    console.error('Submit report error:', err);
    alert(err?.data?.message || 'Failed to submit report. Please try again.');
  }
}
window.submitReport = submitReport;


// LOAD REPORTS
async function loadReports() {
  if (!token) {
    reports = [];
    updateStats();
    updateLibrary('all');
    return;
  }
  try {
    const data = await apiFetch('/reports', { method: 'GET' });
    reports = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Load reports error:', err);
    reports = [];
  }
  updateStats();
  updateLibrary('all');

  // Update dashboard stat if on dashboard
  const dashTotal = document.getElementById('dashTotal');
  if (dashTotal) dashTotal.textContent = reports.length;
}


// LIBRARY & STATS
function updateLibrary(filter) {
  const library = document.getElementById('libraryList');
  library.innerHTML = '';

  let filtered = filter === 'all' ? [...reports] : reports.filter(r => r.program === filter);

  if (filtered.length === 0) {
    library.innerHTML = `<div class="card" style="grid-column:1/-1;">
      <p style="opacity:0.7;">No contributions found${filter !== 'all' ? ' for this filter' : ''}.</p>
      ${!token ? '<p style="margin-top:8px; opacity:0.6; font-size:0.9rem;">Log in and submit a sighting to be the first!</p>' : ''}
    </div>`;
    return;
  }

  filtered.forEach(report => {
    const card = document.createElement('div');
    card.classList.add('card');
    let tagClass = '', tagLabel = '';
    if (report.program === 'school') { tagClass = 'school-tag'; tagLabel = '🏫 School Contribution'; }
    else if (report.program === 'community') { tagClass = 'community-tag'; tagLabel = '🤝 Community Contribution'; }
    else if (report.program) { tagLabel = report.program; }

    card.innerHTML = `
      <h3>${report.title || 'Untitled Report'}</h3>
      <pre style="white-space:pre-wrap; margin-top:8px; font-family:inherit; font-size:0.9rem; opacity:0.85;">${report.content || ''}</pre>
      ${tagLabel ? `<span class="tag ${tagClass}">${tagLabel}</span>` : ''}
    `;
    library.appendChild(card);
  });
}

function filterLibrary(type) {
  updateLibrary(type);
  document.querySelectorAll('#library .filter-buttons button').forEach(btn => btn.classList.remove('active-filter'));
  if (event && event.target) event.target.classList.add('active-filter');
}
window.filterLibrary = filterLibrary;

function updateStats() {
  const total = reports.length;
  const school = reports.filter(r => r.program === 'school').length;
  const community = reports.filter(r => r.program === 'community').length;
  document.getElementById('totalReports').textContent = total;
  document.getElementById('schoolReports').textContent = school;
  document.getElementById('communityReports').textContent = community;
}


// INITIALISATION
document.addEventListener('DOMContentLoaded', async () => {
  if (token && currentUser) {
    document.getElementById('guestNav').style.display = 'none';
    document.getElementById('userNav').style.display = 'inline';
    updateDashboard();
    await loadReports();
    showSection('dashboard');
  } else {
    showSection('home');
    updateLibrary('all');
    renderKnowledge('all');
  }
});
