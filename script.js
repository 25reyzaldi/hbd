(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const loader = $('#loader');
  const main = $('#main');
  const startButton = $('#startBtn');
  const replayButton = $('#replayBtn');
  const musicButton = $('#musicToggle');
  const heartField = $('#heartField');
  const foundCount = $('#foundCount');
  const envelope = $('#envelope');
  const typedLetter = $('#typedLetter');
  const wishStatus = $('#wishStatus');
  const lightbox = $('#lightbox');
  const lightboxImage = $('#lightboxImg');
  const lightboxClose = $('#lightboxClose');
  const toast = $('#toast');
  const canvas = $('#sparkles');

  const letterText =
    'Selamat ulang tahun, sayanggg.\n\nTerima kasih sudah menjadi kamu: seseorang yang baik hati, loyal, sabar, dan selalu punya cara kecil untuk membuat aku bahagia.\n\nSemoga langkahmu tahun ini dipenuhi keberkahan, mendapatka ilmu yang bermanfaat, dan lebih rajin lagi. Doa terbaik untukmu.';

  let toastTimer;
  let foundHearts = 0;
  let extinguishedCandles = 0;
  let audioContext;
  let masterGain;
  let musicTimer;
  let musicPlaying = false;
  let startMusicPlayback = () => {};
  let playSoundEffect = () => {};

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function scrollToSection(selector) {
    const section = $(selector);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  }

  function revealOnScroll() {
    const revealItems = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => observer.observe(item));
  }

  function setupLoader() {
    const hideLoader = () => {
      if (!loader) return;
      loader.classList.add('hide');
      document.body.classList.remove('lock');
    };

    document.body.classList.add('lock');
    window.addEventListener('load', () => setTimeout(hideLoader, 900), { once: true });
    setTimeout(hideLoader, 2600);
  }

  function setupMusic() {
    if (!musicButton) return;

    const musicAudio = new Audio('assets/tiktok_mp3.mp3');
    musicAudio.loop = true;
    musicAudio.preload = 'auto';
    musicAudio.volume = 0.90;

    const getAudioContext = () => {
      if (audioContext) return audioContext;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      audioContext = new AudioContext();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.9;
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.2;
      masterGain.connect(compressor).connect(audioContext.destination);
      return audioContext;
    };

    const playNote = (frequency, duration = 1.2, volume = 0.16, type = 'sine') => {
      if (!audioContext || !masterGain) return;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain).connect(masterGain);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.05);
    };

    playSoundEffect = (sound = 'click') => {
      const context = getAudioContext();
      if (!context) return;
      context.resume();
      const sounds = {
        click: [[660, 0.12, 0.12]],
        heart: [[523, 0.18, 0.15], [784, 0.28, 0.13]],
        open: [[392, 0.25, 0.14], [523, 0.35, 0.14], [659, 0.5, 0.12]],
        candle: [[330, 0.14, 0.12], [220, 0.3, 0.1]],
        success: [[523, 0.2, 0.14], [659, 0.2, 0.14], [784, 0.55, 0.16]]
      };
      (sounds[sound] || sounds.click).forEach(([frequency, duration, volume], index) => {
        setTimeout(() => playNote(frequency, duration, volume), index * 90);
      });
    };

    const updateMusicLabel = () => {
      musicButton.setAttribute('aria-label', musicPlaying ? 'Jeda musik' : 'Putar musik');
      const label = $('.music-text', musicButton);
      if (label) label.textContent = musicPlaying ? 'pause' : 'music';
    };

    const toggleMusic = () => {
      musicPlaying = !musicPlaying;
      if (musicPlaying) {
        const playback = musicAudio.play();
        playback?.catch(() => {
          musicPlaying = false;
          updateMusicLabel();
          showToast('Klik tombol musik sekali lagi untuk memulai audio.');
        });
      } else {
        musicAudio.pause();
      }
      updateMusicLabel();
    };

    startMusicPlayback = () => {
      if (!musicPlaying) toggleMusic();
    };

    musicButton.addEventListener('click', toggleMusic);

    updateMusicLabel();
  }

  function setupGallery() {
    if (!lightbox || !lightboxImage) return;

    const closeLightbox = () => {
      lightbox.classList.remove('show');
      lightboxImage.removeAttribute('src');
      document.body.classList.remove('lock');
    };

    $$('.memory-card img, .final-photo img').forEach((image) => {
      image.addEventListener('click', () => {
        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt;
        lightbox.classList.add('show');
      });
    });

    lightboxClose?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeLightbox();
    });
  }

  function setupHiddenHearts() {
    if (!heartField || !foundCount) return;

    $$('.hidden-heart', heartField).forEach((heart) => {
      heart.addEventListener('click', () => {
        if (heart.classList.contains('found')) return;
        heart.classList.add('found');
        playSoundEffect('heart');
        foundHearts += 1;
        foundCount.textContent = String(foundHearts);

        if (foundHearts === 3) {
          playSoundEffect('success');
          showToast('Kamu menemukan semuanya. Pesan rahasianya menunggumu.');
          setTimeout(() => scrollToSection('#letterSection'), 900);
        }
      });
    });
  }

  function typeLetter() {
    if (!typedLetter || typedLetter.dataset.typed === 'true') return;
    typedLetter.dataset.typed = 'true';
    typedLetter.textContent = '';
    let index = 0;

    const typeNextCharacter = () => {
      typedLetter.textContent += letterText[index];
      index += 1;
      if (index < letterText.length) setTimeout(typeNextCharacter, 24);
    };

    typeNextCharacter();
  }

  function setupEnvelope() {
    if (!envelope) return;
    envelope.addEventListener('click', () => {
      const isOpen = envelope.classList.toggle('open');
      playSoundEffect(isOpen ? 'open' : 'click');
      if (isOpen) typeLetter();
    });
  }

  function setupCandles() {
    if (!wishStatus) return;

    $$('.candle, .flame').forEach((candle) => {
      candle.addEventListener('click', () => {
        const candleNumber = candle.dataset.candle;
        const flame = $(`.flame[data-candle="${candleNumber}"]`);
        const candleBody = $(`.candle[data-candle="${candleNumber}"]`);
        if (!flame || flame.classList.contains('off')) return;

        playSoundEffect('candle');
        flame.classList.add('off');
        candleBody?.classList.add('off');
        extinguishedCandles += 1;
        const remaining = 3 - extinguishedCandles;
        wishStatus.textContent = remaining
          ? `${remaining} lilin masih menyala ✦`
          : 'Pejamkan mata dan buat satu permintaan ✨';

        if (!remaining) showToast('Harapannya sudah kamu titipkan.');
      });
    });
  }

  function setupTilt() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    $$('.tilt').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.transform = `perspective(700px) rotateX(${y * -5}deg) rotateY(${x * 5}deg) translateY(-6px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  function setupSparkles() {
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const particles = [];
    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * pixelRatio;
      canvas.height = window.innerHeight * pixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const createParticle = () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2.2 + 0.5,
      speed: Math.random() * 0.25 + 0.08,
      phase: Math.random() * Math.PI * 2
    });

    resize();
    for (let index = 0; index < 45; index += 1) particles.push(createParticle());
    window.addEventListener('resize', resize);

    const draw = (time) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((particle) => {
        particle.y -= particle.speed;
        if (particle.y < -5) particle.y = window.innerHeight + 5;
        const alpha = 0.18 + (Math.sin(time * 0.0015 + particle.phase) + 1) * 0.16;
        context.fillStyle = `rgba(217, 107, 137, ${alpha})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      });
      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  }

  function resetExperience() {
    foundHearts = 0;
    extinguishedCandles = 0;
    if (foundCount) foundCount.textContent = '0';
    if (wishStatus) wishStatus.textContent = '3 lilin masih menyala ✦';
    $$('.hidden-heart.found').forEach((heart) => heart.classList.remove('found'));
    $$('.flame.off, .candle.off').forEach((item) => item.classList.remove('off'));
    if (envelope) envelope.classList.remove('open');
    if (typedLetter) {
      typedLetter.textContent = '';
      delete typedLetter.dataset.typed;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setupLoader();
  revealOnScroll();
  setupMusic();
  setupGallery();
  setupHiddenHearts();
  setupEnvelope();
  setupCandles();
  setupTilt();
  setupSparkles();

  startButton?.addEventListener('click', () => {
    startMusicPlayback();
    playSoundEffect('open');
    scrollToSection('#gameSection');
  });
  replayButton?.addEventListener('click', resetExperience);
})();
