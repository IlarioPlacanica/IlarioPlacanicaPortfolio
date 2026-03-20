(() => {
  const body = document.body;

  const ui = {
    menuToggle: document.querySelector('.menu-toggle'),
    siteNav: document.querySelector('.site-nav'),
    revealItems: [...document.querySelectorAll('.reveal')],
    indexItems: [...document.querySelectorAll('.project-index-item')],
    previewContainer: document.querySelector('.project-index-preview'),
    previewImage: document.getElementById('index-preview-image'),
    previewVideo: document.getElementById('index-preview-video'),
    previewVideoSource: document.querySelector('#index-preview-video source'),
    lightbox: document.getElementById('lightbox'),
    lightboxStage: document.getElementById('lightbox-stage'),
    lightboxCaption: document.getElementById('lightbox-caption'),
    lightboxClose: document.querySelector('.lightbox-close'),
    lightboxTriggers: [...document.querySelectorAll('.js-open-lightbox')]
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const previewState = {
    type: '',
    src: ''
  };

  function setMenuState(isOpen) {
    if (!ui.menuToggle) return;
    body.classList.toggle('menu-open', isOpen);
    ui.menuToggle.setAttribute('aria-expanded', String(isOpen));
  }

  function initMenu() {
    if (!ui.menuToggle) return;

    ui.menuToggle.addEventListener('click', () => {
      const expanded = ui.menuToggle.getAttribute('aria-expanded') === 'true';
      setMenuState(!expanded);
    });

    ui.siteNav?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuState(false));
    });
  }

  function initRevealObserver() {
    if (!ui.revealItems.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      ui.revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: '0px 0px -6% 0px'
      }
    );

    ui.revealItems.forEach((item) => observer.observe(item));
  }

  function stopPreviewVideo() {
    if (!ui.previewVideo) return;
    ui.previewVideo.pause();
  }

  function playPreviewVideo() {
    if (!ui.previewVideo || prefersReducedMotion) return;
    const playPromise = ui.previewVideo.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }

  function setProjectIndexPreview(type, src) {
    const { previewContainer, previewImage, previewVideo, previewVideoSource } = ui;
    if (!previewContainer || !previewImage || !previewVideo || !previewVideoSource || !src) return;
    if (previewState.type === type && previewState.src === src) return;

    const isVideo = type === 'video';
    previewContainer.classList.toggle('is-image', !isVideo);

    if (isVideo) {
      if (previewVideoSource.getAttribute('src') !== src) {
        stopPreviewVideo();
        previewVideoSource.setAttribute('src', src);
        previewVideo.load();
      }
      playPreviewVideo();
    } else {
      if (previewImage.getAttribute('src') !== src) {
        previewImage.setAttribute('src', src);
      }
      stopPreviewVideo();
    }

    previewState.type = type;
    previewState.src = src;
  }

  function activateIndexItem(item) {
    if (!item) return;

    ui.indexItems.forEach((entry) => entry.classList.remove('is-active'));
    item.classList.add('is-active');

    setProjectIndexPreview(
      item.dataset.previewType || 'image',
      item.dataset.previewSrc || ''
    );
  }

  function initProjectIndex() {
    if (!ui.indexItems.length) return;

    const initialItem =
      ui.indexItems.find((item) => item.classList.contains('is-active')) || ui.indexItems[0];

    activateIndexItem(initialItem);

    ui.indexItems.forEach((item) => {
      const activate = () => activateIndexItem(item);
      item.addEventListener('mouseenter', activate);
      item.addEventListener('focus', activate);
      item.addEventListener('touchstart', activate, { passive: true });
    });
  }

  function clearLightboxStage() {
    if (!ui.lightboxStage) return;

    const activeVideo = ui.lightboxStage.querySelector('video');
    const activeIframe = ui.lightboxStage.querySelector('iframe');

    if (activeVideo) {
      activeVideo.pause();
      activeVideo.removeAttribute('src');
      activeVideo.load();
    }

    if (activeIframe) {
      activeIframe.setAttribute('src', 'about:blank');
    }

    ui.lightboxStage.innerHTML = '';
  }

  function createLightboxMedia(type, src, caption) {
    let mediaNode;

    if (type === 'video') {
      mediaNode = document.createElement('video');
      mediaNode.controls = true;
      mediaNode.autoplay = !prefersReducedMotion;
      mediaNode.loop = true;
      mediaNode.playsInline = true;
      mediaNode.preload = 'metadata';
      mediaNode.src = src;
    } else if (type === 'tour') {
      mediaNode = document.createElement('iframe');
      mediaNode.src = src;
      mediaNode.loading = 'lazy';
      mediaNode.allow = 'fullscreen';
      mediaNode.title = caption || 'Interactive tour';
    } else {
      mediaNode = document.createElement('img');
      mediaNode.src = src;
      mediaNode.alt = caption || 'Portfolio media';
      mediaNode.loading = 'eager';
    }

    return mediaNode;
  }

  function openLightbox(type, src, caption = '') {
    const { lightbox, lightboxStage, lightboxCaption } = ui;
    if (!lightbox || !lightboxStage || !lightboxCaption || !src) return;

    clearLightboxStage();

    const mediaNode = createLightboxMedia(type, src, caption);
    lightboxStage.appendChild(mediaNode);
    lightboxCaption.textContent = caption;

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    body.classList.add('lightbox-open');
  }

  function closeLightbox() {
    if (!ui.lightbox) return;
    clearLightboxStage();
    ui.lightbox.classList.remove('is-open');
    ui.lightbox.setAttribute('aria-hidden', 'true');
    body.classList.remove('lightbox-open');
  }

  function initLightbox() {
    if (!ui.lightboxTriggers.length) return;

    ui.lightboxTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();

        openLightbox(
          trigger.dataset.type || 'image',
          trigger.dataset.src || '',
          trigger.dataset.caption || ''
        );
      });
    });

    ui.lightboxClose?.addEventListener('click', closeLightbox);

    ui.lightbox?.addEventListener('click', (event) => {
      if (event.target === ui.lightbox) {
        closeLightbox();
      }
    });
  }

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeLightbox();
        setMenuState(false);
      }
    });
  }

  function init() {
    initMenu();
    initRevealObserver();
    initProjectIndex();
    initLightbox();
    initKeyboardShortcuts();
  }

  init();
})();