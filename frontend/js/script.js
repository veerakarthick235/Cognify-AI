/* ================================
   COGNIFYAI DASHBOARD SCRIPT
   ================================ */

let intentChart, loadChart;
let historyList = [];
let demoInterval = null;
let analysisCount = 0;

// Chart.js Global Configuration
Chart.defaults.color = '#a0a0c0';
Chart.defaults.font.family = "'Rajdhani', sans-serif";

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  updateEmptyState();
});

// Initialize Empty Charts
function initCharts() {
  const intentCtx = document.getElementById('intentChart').getContext('2d');
  const loadCtx = document.getElementById('loadChart').getContext('2d');

  intentChart = new Chart(intentCtx, {
    type: 'bar',
    data: {
      labels: ['Navigate', 'Search', 'Select', 'Scroll', 'Input'],
      datasets: [{
        label: 'Probability',
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(0, 240, 255, 0.7)',
          'rgba(191, 0, 255, 0.7)',
          'rgba(255, 0, 110, 0.7)',
          'rgba(0, 255, 136, 0.7)',
          'rgba(255, 200, 0, 0.7)'
        ],
        borderColor: [
          'rgba(0, 240, 255, 1)',
          'rgba(191, 0, 255, 1)',
          'rgba(255, 0, 110, 1)',
          'rgba(0, 255, 136, 1)',
          'rgba(255, 200, 0, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10, 10, 26, 0.9)',
          borderColor: 'rgba(0, 240, 255, 0.5)',
          borderWidth: 1,
          titleFont: { family: "'Orbitron', sans-serif", size: 12 },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: 'rgba(0, 240, 255, 0.1)',
            drawBorder: false
          },
          ticks: {
            callback: value => value + '%',
            font: { size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: 600 } }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      }
    }
  });

  loadChart = new Chart(loadCtx, {
    type: 'doughnut',
    data: {
      labels: ['Cognitive Load', 'Available Capacity'],
      datasets: [{
        data: [0, 100],
        backgroundColor: [
          'rgba(191, 0, 255, 0.8)',
          'rgba(30, 30, 60, 0.5)'
        ],
        borderColor: [
          'rgba(191, 0, 255, 1)',
          'rgba(50, 50, 80, 1)'
        ],
        borderWidth: 2,
        cutout: '75%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 11 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(10, 10, 26, 0.9)',
          borderColor: 'rgba(191, 0, 255, 0.5)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 800,
        easing: 'easeOutQuart'
      }
    }
  });
}

// Run Analysis
async function runAnalysis() {
  try {
    // Show loading state
    showNotification('Analyzing...', 'info');
    
    const res = await fetch("http://localhost:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    
    const data = await res.json();
    
    // Update components
    updateIntentChart(data.probabilities);
    updateLoadChart(data.cognitive_load.score);
    updateHistory(data.intent, data.probabilities[data.intent]);
    updateStats(data);
    
    showNotification('Analysis complete!', 'success');
    
  } catch (error) {
    console.error('Analysis failed:', error);
    
    // Demo mode with random data
    const demoData = generateDemoData();
    updateIntentChart(demoData.probabilities);
    updateLoadChart(demoData.cognitive_load.score);
    updateHistory(demoData.intent, demoData.probabilities[demoData.intent]);
    updateStats(demoData);
    
    showNotification('Demo mode - Using simulated data', 'warning');
  }
}

// Generate Demo Data
function generateDemoData() {
  const intents = ['Navigate', 'Search', 'Select', 'Scroll', 'Input'];
  const probabilities = {};
  let total = 0;
  
  intents.forEach((intent, i) => {
    const val = Math.random() * 100;
    probabilities[intent] = val;
    total += val;
  });
  
  // Normalize to 100%
  Object.keys(probabilities).forEach(key => {
    probabilities[key] = Math.round((probabilities[key] / total) * 100);
  });
  
  const maxIntent = Object.entries(probabilities)
    .reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  return {
    intent: maxIntent,
    probabilities,
    cognitive_load: {
      score: Math.round(Math.random() * 100)
    },
    confidence: probabilities[maxIntent]
  };
}

// Update Intent Chart
function updateIntentChart(probs) {
  const labels = Object.keys(probs);
  const values = Object.values(probs);
  
  intentChart.data.labels = labels;
  intentChart.data.datasets[0].data = values;
  intentChart.update('active');
}

// Update Load Chart
function updateLoadChart(score) {
  loadChart.data.datasets[0].data = [score, 100 - score];
  
  // Change color based on load level
  let color;
  if (score < 40) {
    color = 'rgba(0, 255, 136, 0.8)';
  } else if (score < 70) {
    color = 'rgba(255, 200, 0, 0.8)';
  } else {
    color = 'rgba(255, 0, 110, 0.8)';
  }
  
  loadChart.data.datasets[0].backgroundColor[0] = color;
  loadChart.data.datasets[0].borderColor[0] = color.replace('0.8', '1');
  loadChart.update('active');
}

// Update History
function updateHistory(intent, confidence) {
  const timestamp = new Date().toLocaleTimeString();
  
  historyList.unshift({
    intent,
    confidence: Math.round(confidence),
    time: timestamp
  });
  
  // Keep only last 20 entries
  if (historyList.length > 20) {
    historyList.pop();
  }
  
  renderHistory();
  updateEmptyState();
}

// Render History List
function renderHistory() {
  const ul = document.getElementById('history');
  
  ul.innerHTML = historyList.map((item, index) => `
    <li style="animation-delay: ${index * 0.05}s">
      <span class="history-time">${item.time}</span>
      <span class="history-intent">${item.intent}</span>
      <span class="history-confidence">${item.confidence}%</span>
    </li>
  `).join('');
  
  document.getElementById('historyCount').textContent = 
    `${historyList.length} ${historyList.length === 1 ? 'entry' : 'entries'}`;
}

// Update Stats
function updateStats(data) {
  analysisCount++;
  
  document.getElementById('analysisCount').textContent = analysisCount;
  document.getElementById('currentIntent').textContent = data.intent;
  document.getElementById('loadScore').textContent = data.cognitive_load.score + '%';
  document.getElementById('confidence').textContent = 
    Math.round(data.probabilities[data.intent]) + '%';
  
  // Animate stat values
  document.querySelectorAll('.stat-value').forEach(el => {
    el.style.animation = 'none';
    el.offsetHeight; // Trigger reflow
    el.style.animation = 'statPulse 0.5s ease';
  });
}

// Toggle Demo Mode
function toggleDemo() {
  const btn = document.getElementById('demoBtn');
  
  if (demoInterval) {
    clearInterval(demoInterval);
    demoInterval = null;
    btn.classList.remove('active');
    btn.querySelector('.btn-text').textContent = 'Auto Demo';
    showNotification('Auto demo stopped', 'info');
  } else {
    demoInterval = setInterval(runAnalysis, 3000);
    btn.classList.add('active');
    btn.querySelector('.btn-text').textContent = 'Stop Demo';
    runAnalysis();
    showNotification('Auto demo started', 'success');
  }
}

// Clear History
function clearHistory() {
  historyList = [];
  analysisCount = 0;
  
  renderHistory();
  updateEmptyState();
  
  // Reset stats
  document.getElementById('analysisCount').textContent = '0';
  document.getElementById('currentIntent').textContent = '--';
  document.getElementById('loadScore').textContent = '0%';
  document.getElementById('confidence').textContent = '0%';
  
  // Reset charts
  intentChart.data.datasets[0].data = [0, 0, 0, 0, 0];
  intentChart.update();
  
  loadChart.data.datasets[0].data = [0, 100];
  loadChart.update();
  
  showNotification('Dashboard cleared', 'info');
}

// Update Empty State
function updateEmptyState() {
  const emptyState = document.getElementById('emptyState');
  const historyUl = document.getElementById('history');
  
  if (historyList.length === 0) {
    emptyState.classList.remove('hidden');
    historyUl.style.display = 'none';
  } else {
    emptyState.classList.add('hidden');
    historyUl.style.display = 'flex';
  }
}

// Show Notification
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span class="notification-icon">${getNotificationIcon(type)}</span>
    <span class="notification-message">${message}</span>
  `;
  
  // Add styles
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '15px 25px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.95rem',
    fontWeight: '600',
    zIndex: '1000',
    animation: 'slideInRight 0.3s ease',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    backdropFilter: 'blur(10px)'
  });
  
  // Type-specific styles
  const styles = {
    success: { bg: 'rgba(0, 255, 136, 0.2)', border: '#00ff88', color: '#00ff88' },
    warning: { bg: 'rgba(255, 200, 0, 0.2)', border: '#ffc800', color: '#ffc800' },
    error: { bg: 'rgba(255, 0, 110, 0.2)', border: '#ff006e', color: '#ff006e' },
    info: { bg: 'rgba(0, 240, 255, 0.2)', border: '#00f0ff', color: '#00f0ff' }
  };
  
  const s = styles[type] || styles.info;
  notification.style.background = s.bg;
  notification.style.border = `1px solid ${s.border}`;
  notification.style.color = s.color;
  
  document.body.appendChild(notification);
  
  // Auto remove
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getNotificationIcon(type) {
  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ'
  };
  return icons[type] || icons.info;
}

// Add keyframe animations via JS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(100px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideOutRight {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100px); }
  }
  @keyframes statPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); color: #00f0ff; }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);