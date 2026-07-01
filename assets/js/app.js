document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
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

  // University Presets mapping
  const universityPresets = {
    'anna': 75,
    'srm': 75,
    'sathyabama': 75,
    'vit': 80,
    'saveetha': 75,
    'hindustan': 75,
    'custom': 75
  };

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

  // Read query params to auto-select university
  const urlParams = new URLSearchParams(window.location.search);
  const uniParam = urlParams.get('uni');
  if (uniParam && universityPresets[uniParam] !== undefined) {
    universitySelect.value = uniParam;
    requiredPercentageInput.value = universityPresets[uniParam];
  }

  // Handle University Select Change
  universitySelect.addEventListener('change', (e) => {
    const selectedUni = e.target.value;
    if (universityPresets[selectedUni] !== undefined) {
      requiredPercentageInput.value = universityPresets[selectedUni];
      calculateAttendance();
    }
  });

  // Input validation and live calculation
  [totalClassesInput, attendedClassesInput, requiredPercentageInput].forEach(input => {
    input.addEventListener('input', () => {
      if (input.value < 0) {
        input.value = 0;
      }
      calculateAttendance();
    });
  });

  // Calculate Attendance Logic
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

      if (safeAbsences === 0) {
        status = 'warning';
      } else {
        status = 'safe';
      }
    } else {
      status = 'danger';
      
      if (required >= 100) {
        classesToAttend = 'Impossible';
      } else {
        classesToAttend = Math.ceil((required * total - 100 * attended) / (100 - required));
      }
    }

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
      statusBadge.textContent = 'At Risk';
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
  }

  function setProgress(percent) {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
    statusRing.style.strokeDashoffset = offset;
  }

  resetButton.addEventListener('click', () => {
    totalClassesInput.value = '';
    attendedClassesInput.value = '';
    
    universitySelect.value = 'anna';
    requiredPercentageInput.value = 75;
    
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
    const required = parseFloat(requiredPercentageInput.value) || 0;
    const currentPercent = ((attended / total) * 100).toFixed(1);
    
    const uniName = universitySelect.options[universitySelect.selectedIndex].text;
    const currentStatus = statusBadge.textContent;
    
    let shareText = `UniWise Attendance Calc 🏫\n`;
    shareText += `University: ${uniName}\n`;
    shareText += `Current Attendance: ${currentPercent}% (${currentStatus})\n`;
    
    if (currentPercent >= required) {
      const safeAbs = safeAbsencesValue.textContent;
      shareText += `I can safely miss: ${safeAbs} more classes!\n`;
    } else {
      const reqToAttend = classesToAttendValue.textContent;
      shareText += `Required consecutive classes: ${reqToAttend} to reach ${required}%\n`;
    }
    shareText += `Calculate yours here: ${window.location.origin}${window.location.pathname}?uni=${universitySelect.value}`;

    navigator.clipboard.writeText(shareText).then(() => {
      showToast('Result summary copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      showToast('Failed to copy. Please copy the page URL.');
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
        showToast("Feature Coming Soon: Payment portals will be live shortly!");
      }, 1500);
    });
  });

  // Pro Locked tools clicks
  const proToolItems = document.querySelectorAll('.pro-tool-item');
  proToolItems.forEach(item => {
    item.addEventListener('click', () => {
      const name = item.querySelector('.pro-tool-name').textContent;
      showToast(`${name} is locked. Pro Tools launching soon!`);
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
