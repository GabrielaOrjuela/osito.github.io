(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function bindTilt(element, xProperty, yProperty, maxTiltX, maxTiltY) {
    if (!element) return;

    element.addEventListener('pointermove', (event) => {
      if (reducedMotion || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;

      const bounds = element.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;

      element.style.setProperty(xProperty, `${(-y * maxTiltX).toFixed(2)}deg`);
      element.style.setProperty(yProperty, `${(x * maxTiltY).toFixed(2)}deg`);
    });

    element.addEventListener('pointerleave', () => {
      element.style.setProperty(xProperty, '0deg');
      element.style.setProperty(yProperty, '0deg');
    });
  }

  bindTilt(document.querySelector('.hero-cassette'), '--cassette-tilt-x', '--cassette-tilt-y', 5, 6);

  document.querySelectorAll('.glass-orb').forEach((orb) => {
    bindTilt(orb, '--glass-tilt-x', '--glass-tilt-y', 6, 6);
    orb.addEventListener('pointermove', (event) => {
      if (reducedMotion || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;

      const bounds = orb.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      orb.style.setProperty('--glass-light-x', `${Math.round(20 + x * 60)}%`);
      orb.style.setProperty('--glass-light-y', `${Math.round(12 + y * 55)}%`);
    });
    orb.addEventListener('pointerleave', () => {
      orb.style.removeProperty('--glass-light-x');
      orb.style.removeProperty('--glass-light-y');
    });
  });

  document.querySelectorAll('.mixtape-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (reducedMotion || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;

      const bounds = card.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      const y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
      card.style.setProperty('--card-tilt-x', `${(-y * 4).toFixed(2)}deg`);
      card.style.setProperty('--card-tilt-y', `${(x * 4).toFixed(2)}deg`);
      card.style.setProperty('--card-lift', '-9px');
      card.style.setProperty('--card-shadow-y', '24px');
      card.style.setProperty('--card-shadow-blur', '26px');
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--card-tilt-x', '0deg');
      card.style.setProperty('--card-tilt-y', '0deg');
      card.style.setProperty('--card-lift', '0px');
      card.style.setProperty('--card-shadow-y', '14px');
      card.style.setProperty('--card-shadow-blur', '18px');
    });
  });

  const words = [...document.querySelectorAll('.patch-words span')];
  let wordResetTimer;

  function bounceWords(activeIndex) {
    if (reducedMotion) return;

    window.clearTimeout(wordResetTimer);
    words.forEach((word, index) => {
      const distance = index - activeIndex;
      const direction = distance === 0 ? (activeIndex % 2 === 0 ? 1 : -1) : Math.sign(distance);
      const intensity = Math.abs(distance) === 0 ? 1 : Math.abs(distance) === 1 ? .55 : .2;

      word.style.setProperty('--bounce-x', `${(direction * 8 * intensity).toFixed(1)}px`);
      word.style.setProperty('--bounce-y', `${(distance === 0 ? -12 : 7) * intensity}px`);
      word.style.setProperty('--bounce-rotation', `${(direction * (distance === 0 ? 1.4 : -.8) * intensity).toFixed(2)}deg`);
    });

    wordResetTimer = window.setTimeout(() => {
      words.forEach((word) => {
        word.style.setProperty('--bounce-x', '0px');
        word.style.setProperty('--bounce-y', '0px');
        word.style.setProperty('--bounce-rotation', '0deg');
      });
    }, 230);
  }

  words.forEach((word, index) => {
    word.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') bounceWords(index);
    });
    word.addEventListener('pointerdown', () => bounceWords(index));
    word.addEventListener('focus', () => bounceWords(index));
  });

  const cassetteWall = document.querySelector('.cassette-wall');

  function dropCassette(cassette) {
    if (cassette.dataset.falling === 'true') return;

    const bounds = cassette.getBoundingClientRect();
    const computed = window.getComputedStyle(cassette);
    const distance = Math.max(0, window.innerHeight - bounds.top + bounds.height);
    const duration = reducedMotion ? 180 : Math.min(1450, Math.max(850, distance * 1.4));
    const direction = Number(cassette.getAttribute('aria-label').match(/\d+$/)?.[0] || 1) % 2 ? 1 : -1;
    const drift = direction * 34;
    const rotation = reducedMotion ? 0 : direction * 540;
    const clone = cassette.cloneNode(false);

    cassette.dataset.falling = 'true';
    cassette.style.visibility = 'hidden';
    clone.className = 'cassette-fall-clone';
    clone.removeAttribute('role');
    clone.removeAttribute('tabindex');
    clone.removeAttribute('aria-label');
    clone.setAttribute('aria-hidden', 'true');
    clone.style.left = `${bounds.left}px`;
    clone.style.top = `${bounds.top}px`;
    clone.style.width = `${bounds.width}px`;
    clone.style.height = `${bounds.height}px`;
    clone.style.transform = computed.transform;
    document.body.append(clone);

    const animation = clone.animate(
      [
        { transform: computed.transform, opacity: 1 },
        { transform: `translate3d(${drift}px, ${distance}px, 0) ${computed.transform} rotate(${rotation}deg)`, opacity: 0 }
      ],
      { duration, easing: 'cubic-bezier(.58, 0, .94, .46)', fill: 'forwards' }
    );

    const cleanup = () => {
      clone.remove();
      cassette.style.removeProperty('visibility');
      delete cassette.dataset.falling;
    };

    animation.finished.then(cleanup, cleanup);
  }

  if (cassetteWall) {
    cassetteWall.addEventListener('click', (event) => {
      const cassette = event.target.closest('img[role="button"]');
      if (cassette && cassetteWall.contains(cassette)) dropCassette(cassette);
    });

    cassetteWall.addEventListener('keydown', (event) => {
      const cassette = event.target.closest('img[role="button"]');
      if (cassette && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        dropCassette(cassette);
      }
    });
  }

  const phonePair = document.querySelector('.phone-pair-second');

  function animatePhonePair() {
    if (!phonePair || reducedMotion) return;

    const phones = [...phonePair.querySelectorAll('img')];
    if (phones.length < 2) return;

    const gap = Number.parseFloat(window.getComputedStyle(phonePair).columnGap) || 0;
    const inward = Math.min(gap / 2, phones[0].getBoundingClientRect().width * .58);
    const duration = 1250;

    phones.forEach((phone, index) => {
      const direction = index === 0 ? 1 : -1;
      phone.animate(
        [
          { transform: 'translateX(0) rotate(0deg)', offset: 0 },
          { transform: `translateX(${direction * inward}px) rotate(${direction * 6}deg)`, offset: .42 },
          { transform: `translateX(${direction * (inward + 5)}px) rotate(${direction * 7}deg)`, offset: .54 },
          { transform: `translateX(${direction * (inward - 3)}px) rotate(${direction * 4}deg)`, offset: .66 },
          { transform: 'translateX(0) rotate(0deg)', offset: 1 }
        ],
        { duration, easing: 'cubic-bezier(.35, .07, .35, 1)' }
      );
    });
  }

  if (phonePair && 'IntersectionObserver' in window) {
    const phoneObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        phoneObserver.disconnect();
        animatePhonePair();
      }
    }, { threshold: .35 });
    phoneObserver.observe(phonePair);
  } else {
    animatePhonePair();
  }

  const waitingListButton = document.querySelector('.experience-cassette');
  const waitingListPanel = document.querySelector('#waiting-list');

  if (waitingListButton && waitingListPanel) {
    waitingListButton.addEventListener('click', () => {
      const isOpening = waitingListButton.getAttribute('aria-expanded') !== 'true';
      waitingListButton.setAttribute('aria-expanded', String(isOpening));
      waitingListPanel.classList.toggle('is-open', isOpening);
      waitingListPanel.setAttribute('aria-hidden', String(!isOpening));
      waitingListPanel.inert = !isOpening;

      if (isOpening) {
        window.setTimeout(() => {
          if (waitingListPanel.classList.contains('is-open')) {
            waitingListPanel.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
          }
        }, 120);
      } else if (waitingListPanel.contains(document.activeElement)) {
        waitingListButton.focus();
      }
    });
  }

  const waitingListForm = document.querySelector('.waiting-list-form');

  if (waitingListForm) {
    const emailInput = waitingListForm.querySelector('input[type="email"]');
    const consentInput = waitingListForm.querySelector('input[name="consent"]');
    const honeypotInput = waitingListForm.querySelector('input[name="website"]');
    const submitButton = waitingListForm.querySelector('button[type="submit"]');
    const status = waitingListForm.querySelector('.waiting-list-status');
    const policyLink = waitingListForm.querySelector('.waiting-list-policy-link');
    const policyPending = waitingListForm.querySelector('.waiting-list-policy-pending');
    const policyUrl = waitingListForm.dataset.privacyUrl.trim();
    let isSubmitting = false;

    function safeHttpUrl(value) {
      if (!value.trim()) return '';

      try {
        const url = new URL(value, window.location.href);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
      } catch {
        return '';
      }
    }

    if (policyUrl) {
      const safePolicyUrl = safeHttpUrl(policyUrl);
      if (safePolicyUrl) {
        policyLink.href = safePolicyUrl;
        policyLink.hidden = false;
        policyPending.hidden = true;
      }
    }

    function setFormStatus(message, state) {
      status.textContent = message;
      status.dataset.state = state;
    }

    waitingListForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (isSubmitting) return;
      status.textContent = '';
      delete status.dataset.state;

      if (!emailInput.validity.valid) {
        emailInput.reportValidity();
        setFormStatus('Escribe un correo electrónico válido.', 'error');
        return;
      }

      if (!consentInput.checked) {
        consentInput.reportValidity();
        setFormStatus('Debes aceptar el consentimiento para continuar.', 'error');
        return;
      }

      if (honeypotInput.value.trim()) {
        setFormStatus('No se pudo completar el registro. Inténtalo de nuevo.', 'error');
        return;
      }

      const endpoint = safeHttpUrl(waitingListForm.dataset.endpoint.trim());
      if (!endpoint || !policyLink.href || policyLink.hidden) {
        setFormStatus('El registro aún no está configurado; no guardamos tu correo.', 'error');
        return;
      }

      isSubmitting = true;
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando…';
      setFormStatus('Enviando tu solicitud…', 'loading');

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailInput.value.trim(),
            consent: true,
            consentedAt: new Date().toISOString(),
            website: honeypotInput.value
          })
        });

        if (response.status === 409) {
          setFormStatus('Ese correo ya está registrado en la lista.', 'error');
          return;
        }

        if (!response.ok) {
          setFormStatus('No se pudo guardar tu correo. Inténtalo más tarde.', 'error');
          return;
        }

        waitingListForm.reset();
        setFormStatus('¡Ya estás en la lista! Te avisaremos cuando todo esté listo.', 'success');
      } catch {
        setFormStatus('No se pudo conectar con el servicio. Tu correo no se guardó.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Quiero estar en la lista';
      }
    });
  }
})();