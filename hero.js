/* Decorative reel: no framework, tracking, sound or third-party media requests. */
(function(){
  'use strict';
  var hero = document.querySelector('.hero-cinema');
  var video = document.getElementById('cravingReel');
  var control = document.getElementById('motionControl');
  if (!hero || !video || !control) return;
  var label = control.querySelector('.motion-label');
  var icon = control.querySelector('.motion-icon');
  var chapters = Array.from(hero.querySelectorAll('.reel-chapter'));
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var connection = navigator.connection;
  var wantsMotion = !reducedMotion.matches && !(connection && connection.saveData);
  var visible = true;
  var failed = false;
  var playRequest = 0;
  control.hidden = false;

  function showState(playing){
    hero.dataset.motion = playing ? 'playing' : 'paused';
    label.textContent = playing ? 'Pause motion' : 'Play motion';
    icon.textContent = playing ? 'Ⅱ' : '▶';
    control.setAttribute('aria-label', playing ? 'Pause video and animations' : 'Play video and animations');
  }

  function stop(){
    playRequest++;
    video.pause();
    showState(false);
  }

  function play(){
    if (failed || !wantsMotion || !visible || document.hidden) return;
    if (!video.getAttribute('src')){
      video.src = video.dataset.src;
      video.load();
    }
    var request = ++playRequest;
    video.play().then(function(){
      if (request !== playRequest) return;
      if (!wantsMotion || !visible || document.hidden){ stop(); return; }
      hero.classList.add('has-film');
      showState(true);
    }).catch(function(){
      if (request === playRequest) showState(false);
    });
  }

  control.addEventListener('click', function(){
    wantsMotion = video.paused;
    if (wantsMotion) play(); else stop();
  });
  video.addEventListener('error', function(){
    failed = true;
    stop();
    hero.classList.remove('has-film');
    control.hidden = true;
    document.getElementById('reelChapters').hidden = true;
  });
  video.addEventListener('loadedmetadata', function(){
    document.getElementById('reelChapters').hidden = false;
  });
  video.addEventListener('timeupdate', function(){
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    var sceneLength = video.duration / chapters.length;
    var active = Math.min(chapters.length - 1, Math.floor(video.currentTime / sceneLength));
    hero.style.setProperty('--reel-progress', ((video.currentTime % sceneLength) / sceneLength * 100) + '%');
    chapters.forEach(function(chapter, index){
      chapter.setAttribute('aria-current', index === active ? 'true' : 'false');
    });
  });
  chapters.forEach(function(chapter, index){
    chapter.addEventListener('click', function(){
      if (!Number.isFinite(video.duration) || !video.duration) return;
      video.currentTime = index * video.duration / chapters.length;
      // Seeking never overrides an explicit pause or reduced-motion preference.
    });
  });
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) stop(); else play();
  });
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
  showState(false);
  play();
})();
