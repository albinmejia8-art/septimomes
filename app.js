(() => {
  'use strict';
  const cfg = window.ALBUM_CONFIG;
  if (!cfg || !Array.isArray(cfg.canciones)) {
    document.body.innerHTML = '<p style="color:white;padding:50px;font-family:sans-serif">No se pudo cargar config.js. Verifica que esté en la misma carpeta que index.html.</p>';
    return;
  }
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const songs = cfg.canciones.map(song => ({...song}));
  let currentPage = 0, selectedSong = -1, editingSong = -1, toastTimer;
  let currentlyPlaying = false;
  const audio = $('#audio');
  audio.volume = .8;

  songs.forEach(s => {
    try {
      const saved = JSON.parse(localStorage.getItem('album_carta_' + s.id) || 'null');
      if (saved && typeof saved === 'object') {
        if (typeof saved.carta === 'string') s.carta = saved.carta;
        if (typeof saved.frase === 'string') s.frase = saved.frase;
      }
    } catch (_) { /* Private browsing or blocked storage */ }
  });
  $('#cover-intro').textContent = cfg.introduccion;
  $('h1').innerHTML = `Felices <em>7 meses,</em><br><span class="cover-you">mi amor.</span>`;

  const decorativeSymbols = ['✧', '♡', '✩', '⋆', '✦'];
  function makePage(song, i) {
    const titleParts = song.titulo.lastIndexOf(' ');
    const decoratedTitle = titleParts > -1 ? escapeHTML(song.titulo.slice(0, titleParts)) + ' <em>' + escapeHTML(song.titulo.slice(titleParts + 1)) + '</em>' : `<em>${escapeHTML(song.titulo)}</em>`;
    const defaultPhoto = song.fotoPersonal || songs[(i + 2) % songs.length].foto;
    return `<section class="page chapter-page theme-${escapeHTML(song.id)}" id="page-${i+1}" aria-label="Capítulo ${i+1}: ${escapeHTML(song.titulo)}">
      <div class="chapter-wrap">
        <div class="chapter-topline"><span>✦ &nbsp; UNA CANCIÓN, UN PEDACITO DE NOSOTROS</span><span class="chapter-counter">${song.numero} / 05</span></div>
        <div class="chapter-grid">
          <div class="chapter-visual"><div class="album-orbit"><div class="album-backplate"></div>
            <div class="art-frame"><img src="${escapeHTML(song.foto)}" alt="Ilustración romántica inspirada en ${escapeHTML(song.titulo)}" loading="lazy"><div class="art-seal">siete meses de magia ♡</div></div>
            <span class="art-float a1">✧</span><span class="art-float a2">♡</span><span class="art-float a3">⋆</span>
            <button type="button" class="personal-photo" data-upload="${i}" aria-label="Agregar una foto personal a ${escapeHTML(song.titulo)}"><img class="personal-photo-img" data-photo="${i}" src="${escapeHTML(defaultPhoto)}" alt="Imagen romántica, reemplazable por una fotografía de los dos"><span>+ nuestra foto</span></button>
            </div><div class="visual-foot"><span class="visual-small-heart">♡</span> un recuerdo que se escucha y se siente <span class="visual-small-heart">♡</span></div>
            <div class="photo-control"><span>¿Quieres colocar una foto de ustedes?</span><button type="button" data-upload="${i}">Elegir foto</button></div>
            <input type="file" class="photo-input" data-file="${i}" accept="image/*" aria-label="Seleccionar fotografía para ${escapeHTML(song.titulo)}">
          </div>
          <div class="chapter-content"><div class="song-kicker">CAPÍTULO ${song.numero} · ${escapeHTML(song.etiqueta)}</div>
            <h2>${decoratedTitle}</h2><div class="song-artist">♫ ${escapeHTML(song.artista)}</div>
            <p class="song-description">${escapeHTML(song.subtitulo)}</p>
            <div class="lyrics-quote"><span class="quote-caption">✦ LA FRASE DE NUESTRA CANCIÓN</span><span class="quote-text" data-quote="${i}"></span><span class="quote-marks">”</span></div>
            <article class="letter-card"><div class="letter-top"><h3>Una carta para ti, mi amor</h3><span class="letter-icon">✧</span></div>
              <div class="letter-body" id="letter-${i}"></div>
              <div class="letter-cta"><button type="button" class="text-link" data-expand="${i}">Leer carta completa ↓</button><button type="button" class="outline-small" data-edit="${i}">✎ Escribir / editar carta</button></div>
            </article>
            <div class="chapter-actions"><button class="chapter-back" type="button" data-go="${i}">← Capítulo anterior</button><button class="chapter-next" type="button" data-go="${i+2}">${i === songs.length-1 ? 'Nuestro final especial' : 'Siguiente canción'} &nbsp; →</button></div>
            <span class="song-flourish" aria-hidden="true">${decorativeSymbols[i]}</span>
          </div>
        </div>
      </div>
    </section>`;
  }
  function makeFinalPage() {
    return `<section class="page final-page" id="page-${songs.length+1}" aria-label="Sorpresa final">
      <div class="final-content"><div class="eyebrow">✦ &nbsp; EL FINAL DE ESTE ÁLBUM, NO DE NUESTRA HISTORIA &nbsp; ✦</div>
      <div class="final-heart">♡</div><h2>Y lo más bonito...<br><em>todavía nos espera.</em></h2>
      <p class="final-quote" id="final-message"></p>
      <div class="final-images"><img src="assets/img/song-cine.webp" alt="Escena tierna bajo la luna"><img src="assets/img/song-elvis.webp" alt="Medusas azules y un recuerdo de amor"></div>
      <p class="final-sign" id="final-sign"></p><p class="cover-caption">Gracias por estos siete meses a tu lado, amorcito. ♡</p>
      <button type="button" class="glow-button final-reset" data-go="0">♡ Volver a nuestro comienzo</button>
      </div></section>`;
  }
  $('#dynamic-pages').innerHTML = songs.map(makePage).join('') + makeFinalPage();
  $('#final-message').textContent = cfg.despedida;
  $('#final-sign').textContent = cfg.firma;
  function fillSongText(i) {
    $(`[data-quote="${i}"]`).textContent = '“' + songs[i].frase + '”';
    $(`#letter-${i}`).textContent = songs[i].carta;
  }
  songs.forEach((s, i) => fillSongText(i));

  const pages = $$('.page');
  const nav = $('#chapter-nav');
  const navNames = ['Portada', ...songs.map(s => s.titulo), 'Siempre ♡'];
  nav.innerHTML = navNames.map((name, i) => `<button type="button" data-go="${i}" title="${escapeHTML(name)}" aria-label="Ir a ${escapeHTML(name)}" class="${i === 0 ? 'is-active' : ''}"><span class="nav-name">${escapeHTML(name)}</span><span class="nav-num">${i === 0 ? '⌂' : i === songs.length+1 ? '♡' : i.toString().padStart(2,'0')}</span></button>`).join('');

  function updatePlayerInfo(songIndex) {
    const song = songs[songIndex];
    $('#player-title').textContent = song.titulo;
    $('#player-artist').textContent = song.artista;
    $('#player-cover').style.backgroundImage = `url("${encodeURI(song.foto)}")`;
    $('#player').hidden = false;
  }
  function setMusic(index, autoplay = false) {
    if (index < 0 || index >= songs.length) return;
    const changed = index !== selectedSong;
    selectedSong = index;
    updatePlayerInfo(index);
    if (changed) {
      audio.pause();
      audio.src = songs[index].audio;
      audio.load();
      $('#elapsed').textContent = '0:00';
      $('#duration').textContent = '0:00';
      $('#progress').value = 0;
      $('#progress').style.setProperty('--progress', '0%');
    }
    if (autoplay) playMusic(); else updatePlayUI();
  }
  function playMusic() {
    if (selectedSong === -1) setMusic(0, false);
    const attempt = audio.play();
    if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {
      updatePlayUI();
      showToast('Toca ▶ para activar la música en tu dispositivo.');
    });
  }
  function updatePlayUI() {
    currentlyPlaying = !audio.paused && !audio.ended;
    $('#play-icon').textContent = currentlyPlaying ? 'Ⅱ' : '▶';
    $('#play-toggle').setAttribute('aria-label', currentlyPlaying ? 'Pausar música' : 'Reproducir música');
    $('#playing-state').textContent = currentlyPlaying ? 'Sonando ♫' : 'En pausa';
    $('#player').classList.toggle('is-playing', currentlyPlaying);
  }
  function formatTime(t) { return Number.isFinite(t) && t >= 0 ? `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}` : '0:00'; }
  function showPage(nextIndex, autoplay = false) {
    const next = Math.min(Math.max(Number(nextIndex) || 0, 0), songs.length+1);
    pages[currentPage].classList.remove('active');
    pages[currentPage].setAttribute('aria-hidden','true');
    currentPage = next;
    pages[currentPage].classList.add('active');
    pages[currentPage].removeAttribute('aria-hidden');
    $$('.chapter-nav button').forEach((button, idx) => {
      const active = idx === currentPage;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (currentPage > 0 && currentPage <= songs.length) setMusic(currentPage-1, autoplay || currentlyPlaying);
    else if (currentPage === songs.length+1) { audio.pause();updatePlayUI(); }
    else if (currentPage === 0) { audio.pause();updatePlayUI(); }
    document.title = (currentPage > 0 && currentPage <= songs.length ? songs[currentPage-1].titulo + ' ♡ ' : 'Felices siete meses ♡ ') + 'Nuestro álbum';
  }

  audio.addEventListener('play', updatePlayUI);
  audio.addEventListener('pause', updatePlayUI);
  audio.addEventListener('loadedmetadata', () => {$('#duration').textContent = formatTime(audio.duration);});
  audio.addEventListener('timeupdate', () => {
    $('#elapsed').textContent = formatTime(audio.currentTime);
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      const val = Math.round((audio.currentTime / audio.duration) * 1000);
      $('#progress').value = val;
      $('#progress').style.setProperty('--progress', `${val/10}%`);
    }
  });
  audio.addEventListener('ended', () => {
    updatePlayUI();
    if (selectedSong < songs.length-1) showPage(selectedSong+2, true);
    else showPage(songs.length+1, false);
  });
  audio.addEventListener('error', () => showToast('No se encontró este audio. Comprueba la carpeta assets/music.'));
  $('#progress').addEventListener('input', (e) => {
    if (Number.isFinite(audio.duration) && audio.duration) audio.currentTime = (Number(e.target.value)/1000) * audio.duration;
  });
  $('#play-toggle').addEventListener('click', () => audio.paused ? playMusic() : audio.pause());
  $('#player-next').addEventListener('click', () => showPage(selectedSong < songs.length-1 ? selectedSong+2 : songs.length+1,true));
  $('#player-prev').addEventListener('click', () => {
    if (audio.currentTime > 3) audio.currentTime = 0;
    else showPage(Math.max(1, selectedSong), true);
  });
  $('#sound-toggle').addEventListener('click', () => {
    audio.muted = !audio.muted;
    $('#sound-toggle').classList.toggle('is-muted', audio.muted);
    $('#sound-toggle').title = audio.muted ? 'Activar sonido' : 'Silenciar música';
    showToast(audio.muted ? 'Música silenciada' : 'Música activada 💙');
  });
  $('#begin-button').addEventListener('click', () => showPage(1, true));

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }
  document.addEventListener('click', (event) => {
    const goButton = event.target.closest('[data-go]');
    if (goButton) {showPage(goButton.dataset.go, false); return;}
    const editButton = event.target.closest('[data-edit]');
    if (editButton) {openEdit(Number(editButton.dataset.edit)); return;}
    const expandButton = event.target.closest('[data-expand]');
    if (expandButton) {
      const body = $(`#letter-${expandButton.dataset.expand}`);
      const nowExpanded = body.classList.toggle('expanded');
      expandButton.textContent = nowExpanded ? 'Mostrar menos ↑' : 'Leer carta completa ↓';
      return;
    }
    const uploadButton = event.target.closest('[data-upload]');
    if (uploadButton) $(`[data-file="${uploadButton.dataset.upload}"]`).click();
  });

  function openEdit(index) {
    editingSong = index;
    $('#edit-title').textContent = `Tu carta · ${songs[index].titulo}`;
    $('#edit-quote').value = songs[index].frase;
    $('#edit-letter').value = songs[index].carta;
    $('#edit-modal').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#edit-quote').focus();
  }
  function closeEdit() {
    $('#edit-modal').hidden = true;
    document.body.style.overflow = '';
    editingSong = -1;
  }
  $('#close-edit').addEventListener('click', closeEdit);
  $('#cancel-edit').addEventListener('click', closeEdit);
  $('#edit-modal').addEventListener('click', e => { if (e.target === $('#edit-modal')) closeEdit(); });
  $('#save-edit').addEventListener('click', () => {
    if (editingSong === -1) return;
    songs[editingSong].frase = $('#edit-quote').value.trim() || 'Eres mi canción favorita';
    songs[editingSong].carta = $('#edit-letter').value;
    try {localStorage.setItem('album_carta_' + songs[editingSong].id, JSON.stringify({frase:songs[editingSong].frase,carta:songs[editingSong].carta}));}
    catch (_) { showToast('Sin espacio para guardar aquí; descarga tus textos.'); }
    fillSongText(editingSong);
    closeEdit();
    showToast('Tu carta quedó guardada en este navegador ♡');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (!$('#edit-modal').hidden) closeEdit(); $('#help-popover').hidden = true; return; }
    if (!$('#edit-modal').hidden || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight') showPage(currentPage + 1, false);
    if (e.key === 'ArrowLeft') showPage(currentPage - 1, false);
  });

  // Las fotos elegidas se reducen antes de guardarlas en este navegador.
  $$('.photo-input').forEach(input => input.addEventListener('change', async () => {
    const i = Number(input.dataset.file);
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {showToast('Elige una imagen JPG, PNG o WEBP.');return;}
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
      const max = 680;
      const scale = Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1,Math.round(img.naturalWidth*scale));
      canvas.height = Math.max(1,Math.round(img.naturalHeight*scale));
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      const data = canvas.toDataURL('image/jpeg',.72);
      songs[i].fotoPersonal = data;
      $(`[data-photo="${i}"]`).src = data;
      URL.revokeObjectURL(url);
      try {localStorage.setItem('album_foto_'+songs[i].id, data);}catch(_){showToast('Foto visible aquí, pero el navegador no pudo guardarla.');return;}
      showToast('Qué linda foto ♡ Guardada en este navegador.');
    } catch (error) {showToast('No pudimos abrir esa foto. Prueba con otra.');}
  }));
  songs.forEach((s, i) => {
    try {const photo = localStorage.getItem('album_foto_' + s.id); if (photo && photo.startsWith('data:image/')) {songs[i].fotoPersonal = photo; $(`[data-photo="${i}"]`).src=photo;}}
    catch (_) {}
  });

  $('#help-button').addEventListener('click',()=>$('#help-popover').hidden=!$('#help-popover').hidden);
  $('#close-help').addEventListener('click',()=>$('#help-popover').hidden=true);
  $('#download-texts').addEventListener('click', () => {
    const exportData = {...cfg,canciones:songs.map(s => ({...s}))};
    const content = '/* Textos personalizados para compartir el álbum. Reemplaza config.js por este archivo. */\nwindow.ALBUM_CONFIG = '+JSON.stringify(exportData,null,2)+';\n';
    const blob = new Blob([content],{type:'text/javascript;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href=url;anchor.download='config.js';document.body.appendChild(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    showToast('¡Listo! Reemplaza config.js por el archivo descargado.');
  });

  // Cada toque deja un pequeño recuerdo luminoso que desaparece suavemente.
  document.addEventListener('pointerdown', event => {
    if (!$('#edit-modal').hidden || event.pointerType === 'mouse' && event.button !== 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i=0;i<3;i++) {
      const heart=document.createElement('span');
      heart.className='touch-heart';
      heart.textContent=i===1?'✧':'♡';
      heart.style.setProperty('--x', (event.clientX+(i-1)*11)+'px');
      heart.style.setProperty('--y', (event.clientY+(i%2)*6)+'px');
      heart.style.setProperty('--dx', (i-1)*31+'px');
      heart.style.animationDelay=(i*60)+'ms';
      document.body.appendChild(heart);
      setTimeout(()=>heart.remove(),1750);
    }
  });

  // Ambiente oceánico, suave y animado. Cada elemento se dibuja una sola vez.
  const stars = $('#starfield');
  for (let i=0;i<86;i++) {
    const el=document.createElement('i');el.className='star';
    el.style.left=(Math.random()*100).toFixed(2)+'%';
    el.style.top=(Math.random()*100).toFixed(2)+'%';
    el.style.setProperty('--size', (Math.random()*2.7+.8).toFixed(2)+'px');
    el.style.setProperty('--opacity',(Math.random()*.55+.25).toFixed(2));
    el.style.setProperty('--dur',(Math.random()*4+2).toFixed(2)+'s');
    el.style.setProperty('--delay',(-Math.random()*6).toFixed(2)+'s');
    stars.appendChild(el);
  }
  const bubbles=$('#bubbles');
  for(let i=0;i<25;i++){
    const bubble=document.createElement('i');bubble.className='bubble';
    bubble.style.setProperty('--left',(Math.random()*100).toFixed(2)+'%');
    bubble.style.setProperty('--size',(Math.random()*13+4).toFixed(2)+'px');
    bubble.style.setProperty('--dur',(Math.random()*14+14).toFixed(2)+'s');
    bubble.style.setProperty('--delay',(-Math.random()*30).toFixed(2)+'s');
    bubbles.appendChild(bubble);
  }
  showPage(0,false);
})();
