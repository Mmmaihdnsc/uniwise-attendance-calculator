document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Main Calculator
  const universitySelect = document.getElementById('university');
  const totalClassesInput = document.getElementById('total-classes');
  const attendedClassesInput = document.getElementById('attended-classes');
  const requiredPercentageInput = document.getElementById('required-percentage');
  
  const percentageDisplay = document.getElementById('attendance-value');
  const statusRing = document.getElementById('status-ring');
  const statusBadge = document.getElementById('status-badge');
  
  const safeAbsencesValue = document.getElementById('safe-absences-value');
  const classesToAttendValue = document.getElementById('classes-to-attend-value');
  
  const resetButton = document.getElementById('btn-reset');
  const shareButton = document.getElementById('btn-share');
  const toast = document.getElementById('toast');

  // DOM Elements - Modules
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Module 1 (Absence Buffer) Output Elements
  const bufTargetDisplay = document.getElementById('buf-target');
  const bufCurrentDisplay = document.getElementById('buf-current');
  const bufBunksDisplay = document.getElementById('buf-bunks');
  const bufRiskDisplay = document.getElementById('buf-risk');

  // Module 3 (Recovery) Output Elements
  const recPlanContainer = document.getElementById('recovery-plan-steps');

  // Module 4 (Bunk Calculator) Input & Output Elements
  const bunkCurrentInput = document.getElementById('bunk-current-pct');
  const bunkTotalInput = document.getElementById('bunk-total-classes');
  const bunkLimitDisplay = document.getElementById('bunk-limit-val');
  const bunkRiskDisplay = document.getElementById('bunk-risk-status');

  // Presets mapping
  const universityPresets = {
    'anna': 75,
    'srm': 75,
    'vit': 80,
    'sathyabama': 75,
    'saveetha': 75,
    'hits': 75,
    'custom': 75
  };

  // 1. Tab Switching Functionality
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      // Trigger sub-module updates when tabs are clicked
      updateModules();
    });
  });

  // FAQ Accordion Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // Handle University Preset Change
  universitySelect.addEventListener('change', (e) => {
    const selectedUni = e.target.value;
    if (universityPresets[selectedUni] !== undefined) {
      requiredPercentageInput.value = universityPresets[selectedUni];
      calculateAttendance();
    }
  });

  // Live calculations trigger
  [totalClassesInput, attendedClassesInput, requiredPercentageInput].forEach(input => {
    input.addEventListener('input', () => {
      if (input.value < 0) {
        input.value = 0;
      }
      calculateAttendance();
    });
  });

  // Bunk Calculator module direct inputs trigger
  [bunkCurrentInput, bunkTotalInput].forEach(input => {
    input.addEventListener('input', () => {
      if (input.value < 0) {
        input.value = 0;
      }
      calculateModule4();
    });
  });

  // 2. Core Calculator Logic
  function calculateAttendance() {
    const total = parseInt(totalClassesInput.value) || 0;
    const attended = parseInt(attendedClassesInput.value) || 0;
    const required = parseFloat(requiredPercentageInput.value) || 0;

    if (total === 0) {
      percentageDisplay.textContent = '0.0%';
      setProgress(0);
      statusBadge.textContent = 'Enter Details';
      statusBadge.className = 'status-badge';
      statusBadge.style.background = 'rgba(255, 255, 255, 0.05)';
      statusBadge.style.color = 'var(--text-secondary)';
      statusBadge.style.boxShadow = 'none';
      
      safeAbsencesValue.textContent = '0';
      safeAbsencesValue.className = 'metric-value';
      classesToAttendValue.textContent = '0';
      classesToAttendValue.className = 'metric-value';

      // Reset Bunk calculator module fields with defaults if empty
      bunkCurrentInput.placeholder = "e.g., 78";
      bunkTotalInput.placeholder = "e.g., 60";
      
      updateModules();
      return;
    }

    if (attended > total) {
      percentageDisplay.textContent = '100%';
      setProgress(100);
      statusBadge.textContent = 'Invalid Input';
      statusBadge.className = 'status-badge status-danger';
      
      safeAbsencesValue.textContent = '0';
      safeAbsencesValue.className = 'metric-value';
      classesToAttendValue.textContent = '0';
      classesToAttendValue.className = 'metric-value';
      return;
    }

    const currentPercent = (attended / total) * 100;
    percentageDisplay.textContent = `${currentPercent.toFixed(1)}%`;
    setProgress(currentPercent);

    let safeAbsences = 0;
    let classesToAttend = 0;
    let status = '';

    if (currentPercent >= required) {
      if (required > 0) {
        safeAbsences = Math.floor((100 * attended) / required) - total;
      } else {
        safeAbsences = 0;
      }
      
      if (safeAbsences < 0) safeAbsences = 0;
      status = safeAbsences === 0 ? 'warning' : 'safe';
    } else {
      status = 'danger';
      if (required >= 100) {
        classesToAttend = 'Impossible';
      } else {
        classesToAttend = Math.ceil((required * total - 100 * attended) / (100 - required));
      }
    }

    // Update Status Badge UI
    if (status === 'safe') {
      statusBadge.textContent = 'Safe';
      statusBadge.className = 'status-badge status-safe';
      statusBadge.style.background = '';
      statusBadge.style.color = '';
      statusBadge.style.boxShadow = '';
      statusRing.style.stroke = 'var(--success)';
    } else if (status === 'warning') {
      statusBadge.textContent = 'Warning';
      statusBadge.className = 'status-badge status-warning';
      statusBadge.style.background = '';
      statusBadge.style.color = '';
      statusBadge.style.boxShadow = '';
      statusRing.style.stroke = 'var(--warning)';
    } else if (status === 'danger') {
      statusBadge.textContent = 'Critical';
      statusBadge.className = 'status-badge status-danger';
      statusBadge.style.background = '';
      statusBadge.style.color = '';
      statusBadge.style.boxShadow = '';
      statusRing.style.stroke = 'var(--danger)';
    }

    safeAbsencesValue.textContent = safeAbsences;
    safeAbsencesValue.className = `metric-value ${safeAbsences > 0 ? 'highlight-safe' : ''}`;
    
    classesToAttendValue.textContent = classesToAttend;
    classesToAttendValue.className = `metric-value ${classesToAttend > 0 || classesToAttend === 'Impossible' ? 'highlight-danger' : ''}`;

    // Prefill Module 4 Inputs based on Main Calculator values
    bunkCurrentInput.value = currentPercent.toFixed(1);
    bunkTotalInput.value = total;

    updateModules();
  }

  function setProgress(percent) {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
    statusRing.style.strokeDashoffset = offset;
  }

  // 3. Multi-Tool Modules Update Engine
  function updateModules() {
    calculateModule1();
    calculateModule3();
    calculateModule4();
  }

  // MODULE 1: How Many Classes Can I Miss
  function calculateModule1() {
    const total = parseInt(totalClassesInput.value) || 0;
    const attended = parseInt(attendedClassesInput.value) || 0;
    const required = parseFloat(requiredPercentageInput.value) || 75;

    bufTargetDisplay.textContent = `${required}%`;

    if (total === 0) {
      bufCurrentDisplay.textContent = '0.0%';
      bufBunksDisplay.textContent = '0';
      bufRiskDisplay.textContent = 'Enter stats above';
      bufRiskDisplay.className = 'metric-value';
      return;
    }

    const current = (attended / total) * 100;
    bufCurrentDisplay.textContent = `${current.toFixed(1)}%`;

    let safeBunks = 0;
    if (current >= required) {
      safeBunks = Math.floor((100 * attended) / required) - total;
      if (safeBunks < 0) safeBunks = 0;
    }

    bufBunksDisplay.textContent = safeBunks;

    if (current < required) {
      bufRiskDisplay.textContent = 'Critical (Below Target)';
      bufRiskDisplay.className = 'metric-value highlight-danger';
    } else if (safeBunks === 0) {
      bufRiskDisplay.textContent = 'Warning (No margin left)';
      bufRiskDisplay.className = 'metric-value highlight-danger';
      bufRiskDisplay.style.color = 'var(--warning)';
    } else {
      bufRiskDisplay.textContent = 'Safe';
      bufRiskDisplay.className = 'metric-value highlight-safe';
      bufRiskDisplay.style.color = 'var(--success)';
    }
  }

  // MODULE 3: How to Regain Attendance (Recovery Plan)
  function calculateModule3() {
    const total = parseInt(totalClassesInput.value) || 0;
    const attended = parseInt(attendedClassesInput.value) || 0;
    const required = parseFloat(requiredPercentageInput.value) || 75;

    if (total === 0) {
      recPlanContainer.innerHTML = `
        <div class="tip-card" style="text-align: center; color: var(--text-secondary);">
          Please enter your current total and attended classes above to generate a recovery plan.
        </div>
      `;
      return;
    }

    const current = (attended / total) * 100;

    if (current >= required) {
      recPlanContainer.innerHTML = `
        <div class="tip-card" style="border-color: var(--success); text-align: center;">
          <h4 style="color: var(--success); margin-bottom: 0.25rem;">✔ No Recovery Plan Needed</h4>
          <p class="tip-content">Your current attendance (${current.toFixed(1)}%) is above your required target (${required}%). Keep maintaining it!</p>
        </div>
      `;
      return;
    }

    let recoveryClasses = 0;
    if (required >= 100) {
      recPlanContainer.innerHTML = `
        <div class="tip-card" style="border-color: var(--danger); text-align: center;">
          <h4 style="color: var(--danger); margin-bottom: 0.25rem;">⚠️ Impossible to Recover</h4>
          <p class="tip-content">It is mathematically impossible to reach 100% attendance because you have already missed at least one class session.</p>
        </div>
      `;
      return;
    }

    recoveryClasses = Math.ceil((required * total - 100 * attended) / (100 - required));
    const targetTotal = total + recoveryClasses;
    const targetAttended = attended + recoveryClasses;

    recPlanContainer.innerHTML = `
      <ol class="steps-list">
        <li class="step-item">
          <div class="step-number">1</div>
          <div class="step-details">
            <h4>Attend ${recoveryClasses} Consecutive Sessions</h4>
            <p>You must attend the next ${recoveryClasses} classes in a row without missing any to hit your target.</p>
          </div>
        </li>
        <li class="step-item">
          <div class="step-number">2</div>
          <div class="step-details">
            <h4>Reach Target Threshold</h4>
            <p>Your session counts will rise to ${targetAttended}/${targetTotal} classes, pulling your average to exactly ${((targetAttended/targetTotal)*100).toFixed(1)}%.</p>
          </div>
        </li>
        <li class="step-item">
          <div class="step-number">3</div>
          <div class="step-details">
            <h4>Submit Official Permissions (If Any)</h4>
            <p>If some absences were due to official duties or illness, verify that your HOD has approved your OD/medical certificates on the portal to credit your logs.</p>
          </div>
        </li>
      </ol>
    `;
  }

  // MODULE 4: Bunk Calculator
  function calculateModule4() {
    const current = parseFloat(bunkCurrentInput.value) || 0;
    const total = parseInt(bunkTotalInput.value) || 0;
    const required = parseFloat(requiredPercentageInput.value) || 75;

    if (total === 0 || current === 0) {
      bunkLimitDisplay.textContent = '0';
      bunkRiskDisplay.textContent = 'Enter values';
      bunkRiskDisplay.style.color = 'var(--text-secondary)';
      return;
    }

    // Reconstruct attended classes from percentage
    const attended = Math.round((current / 100) * total);

    let bunkLimit = 0;
    if (current >= required) {
      if (required > 0) {
        bunkLimit = Math.floor((100 * attended) / required) - total;
      }
      if (bunkLimit < 0) bunkLimit = 0;
    }

    bunkLimitDisplay.textContent = bunkLimit;

    if (current < required) {
      bunkRiskDisplay.textContent = 'Critical (Defaulter)';
      bunkRiskDisplay.style.color = 'var(--danger)';
    } else if (bunkLimit === 0) {
      bunkRiskDisplay.textContent = 'Warning (Bunk Buffer Exhausted)';
      bunkRiskDisplay.style.color = 'var(--warning)';
    } else {
      bunkRiskDisplay.textContent = 'Safe (Has Buffer)';
      bunkRiskDisplay.style.color = 'var(--success)';
    }
  }

  // 4. Interactive Elements triggers
  resetButton.addEventListener('click', () => {
    totalClassesInput.value = '';
    attendedClassesInput.value = '';
    universitySelect.value = 'anna';
    requiredPercentageInput.value = 75;
    
    // Reset Bunk calculator module fields
    bunkCurrentInput.value = '';
    bunkTotalInput.value = '';

    calculateAttendance();
    showToast('All fields reset successfully.');
  });

  shareButton.addEventListener('click', () => {
    const total = parseInt(totalClassesInput.value) || 0;
    if (total === 0) {
      showToast('Please enter attendance details first before sharing.');
      return;
    }

    const attended = parseInt(attendedClassesInput.value) || 0;
    const required = parseFloat(requiredPercentageInput.value) || 75;
    const currentPercent = ((attended / total) * 100).toFixed(1);
    
    const uniName = universitySelect.options[universitySelect.selectedIndex].text;
    const currentStatus = statusBadge.textContent;
    
    let shareText = `College Attendance Calculator 🏫\n`;
    shareText += `Institution: ${uniName}\n`;
    shareText += `Current Attendance: ${currentPercent}% (${currentStatus})\n`;
    
    if (currentPercent >= required) {
      const safeAbs = safeAbsencesValue.textContent;
      shareText += `Permissible Bunks left: ${safeAbs} classes!\n`;
    } else {
      const reqToAttend = classesToAttendValue.textContent;
      shareText += `Required makeup sessions: ${reqToAttend} consecutive classes to hit ${required}%\n`;
    }
    shareText += `Calculate yours here: ${window.location.origin}${window.location.pathname}`;

    navigator.clipboard.writeText(shareText).then(() => {
      showToast('Attendance summary copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      showToast('Copy failed. Please manually copy the URL.');
    });
  });

  // Digital Product checkout clicks
  const productButtons = document.querySelectorAll('.product-btn');
  productButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.digital-product-card');
      const title = card.querySelector('.product-title').textContent;
      showToast(`Redirecting to secure UPI payment for: ${title}...`);
      setTimeout(() => {
        showToast("SaaS Feature Coming Soon: Checkout portals will be live shortly!");
      }, 1500);
    });
  });

  // Pro Locked tools clicks
  const proToolItems = document.querySelectorAll('.pro-tool-item');
  proToolItems.forEach(item => {
    item.addEventListener('click', () => {
      const name = item.querySelector('.pro-tool-name').textContent;
      showToast(`${name} is locked. UniWise Pro SaaS dashboard launching soon!`);
    });
  });

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
});
