(() => {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const appSelect = document.getElementById('appName');
  const typeSelect = document.getElementById('inquiryType');
  const emailInput = document.getElementById('userEmail');
  const messageInput = document.getElementById('userMessage');

  function getURLParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  function showError(fieldId, errorId, messageKey) {
    const group = document.getElementById(fieldId).closest('.form-group');
    const errorEl = document.getElementById(errorId);
    group.classList.add('has-error');
    errorEl.textContent = I18n.t(messageKey);
  }

  function clearErrors() {
    document.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
    document.querySelectorAll('.error-msg').forEach(e => e.textContent = '');
  }

  function validate() {
    clearErrors();
    let valid = true;

    if (!appSelect.value) {
      showError('appName', 'appError', 'validation.appRequired');
      valid = false;
    }

    if (!typeSelect.value) {
      showError('inquiryType', 'typeError', 'validation.typeRequired');
      valid = false;
    }

    const email = emailInput.value.trim();
    if (!email) {
      showError('userEmail', 'emailError', 'validation.emailRequired');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('userEmail', 'emailError', 'validation.emailInvalid');
      valid = false;
    }

    if (!messageInput.value.trim()) {
      showError('userMessage', 'messageError', 'validation.messageRequired');
      valid = false;
    }

    return valid;
  }

  function showToast(type, messageKey) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = I18n.t(messageKey);
    container.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    const label = submitBtn.querySelector('[data-i18n]');
    if (loading) {
      label.setAttribute('data-i18n', 'form.sending');
      label.textContent = I18n.t('form.sending');
    } else {
      label.setAttribute('data-i18n', 'form.submit');
      label.textContent = I18n.t('form.submit');
    }
  }

  // Honeypot check
  function isBot() {
    const hp = form.querySelector('[name="_honeypot"]');
    return hp && hp.value.length > 0;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isBot()) return;
    if (!validate()) return;

    setLoading(true);

    // Get the displayed text of the selected option (translated type name)
    const selectedOption = typeSelect.options[typeSelect.selectedIndex];
    const typeText = selectedOption.textContent;

    try {
      await EmailService.send({
        app: appSelect.value,
        type: typeText,
        typeValue: typeSelect.value,
        email: emailInput.value.trim(),
        message: messageInput.value.trim(),
        source: getURLParam('source'),
        language: document.documentElement.lang
      });

      showToast('success', 'toast.success');
      form.reset();
      clearErrors();
    } catch (err) {
      console.error('Email send failed:', err);
      showToast('error', 'toast.error');
    } finally {
      setLoading(false);
    }
  });

  // Clear individual errors on input
  appSelect.addEventListener('change', () => {
    appSelect.closest('.form-group').classList.remove('has-error');
  });
  typeSelect.addEventListener('change', () => {
    typeSelect.closest('.form-group').classList.remove('has-error');
  });
  emailInput.addEventListener('input', () => {
    emailInput.closest('.form-group').classList.remove('has-error');
  });
  messageInput.addEventListener('input', () => {
    messageInput.closest('.form-group').classList.remove('has-error');
  });
})();
