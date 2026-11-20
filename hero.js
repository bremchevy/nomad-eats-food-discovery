/* Local poster-to-film loop. No audio, tracking or third-party media requests. */
(function(){
  'use strict';
  var hero = document.querySelector('.street-heat');
  var video = document.getElementById('cravingReel');
  var control = document.getElementById('motionControl');
  var watch = document.getElementById('watchReel');
  if (!hero || !video || !control || !watch) return;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var connection = navigator.connection;
  var wantsMotion = !reducedMotion.matches && !(connection && connection.saveData);
  var visible = !('IntersectionObserver' in window);
  var phase = 'poster';
  var failed = false;
  var timer;
  var playRequest = 0;
  control.hidden = false;
  watch.hidden = false;
  function canPlay(){ return wantsMotion && visible && !document.hidden; }
  function showState(playing){
    hero.dataset.motion = playing ? 'playing' : 'paused';
    control.querySelector('.motion-label').textContent = playing ? 'Pause motion' : 'Play motion';
    control.querySelector('.motion-icon').textContent = playing ? 'Ⅱ' : '▶';
    control.setAttribute('aria-label', playing ? 'Pause video and animations' : 'Play video and animations');
  }
  function stop(){
    clearTimeout(timer);
    playRequest++;
    video.pause();
    showState(false);
  }
  function poster(){
    phase = 'poster';
    hero.classList.remove('has-film');
    video.pause();
    if (video.readyState) video.currentTime = 0;
  }
  function film(){
    if (!canPlay() || failed) return;
    clearTimeout(timer);
    phase = 'film';
    if (!video.getAttribute('src')){ video.src = video.dataset.src; video.load(); }
    var request = ++playRequest;
    video.play().then(function(){
      if (request !== playRequest) return;
      if (!canPlay()){ stop(); return; }
      hero.classList.add('has-film');
    }).catch(function(){
      // Leave the poster and decorative motion usable if autoplay is rejected.
      if (request === playRequest) poster();
    });
  }
  function play(){
    if (!canPlay()) return;
    showState(true);
    clearTimeout(timer);
    if (failed) return;
    if (phase === 'film') film(); else timer = setTimeout(film, 6000);
  }
  control.addEventListener('click', function(){
    wantsMotion = hero.dataset.motion !== 'playing';
    if (wantsMotion) play(); else stop();
  });
  watch.addEventListener('click', function(){ wantsMotion = true; showState(true); film(); });
  video.addEventListener('ended', function(){ poster(); play(); });
  video.addEventListener('error', function(){
    failed = true;
    playRequest++;
    clearTimeout(timer);
    poster();
    watch.hidden = true;
  });
  document.addEventListener('visibilitychange', function(){ if (document.hidden) stop(); else play(); });
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      visible = entries[0].isIntersecting;
      if (visible) play(); else stop();
    }, {threshold:0}).observe(hero);
  }
  reducedMotion.addEventListener('change', function(event){
    wantsMotion = !event.matches && !(connection && connection.saveData);
    if (wantsMotion) play(); else stop();
  });
  if (connection && connection.addEventListener){
    connection.addEventListener('change', function(){
      if (connection.saveData){ wantsMotion = false; stop(); }
    });
  }
  var shortlist = document.getElementById('heroShortlist');
  if (shortlist) shortlist.addEventListener('click', function(){ document.getElementById('viewFavBtn').click(); });
  showState(false);
  play();
})();
