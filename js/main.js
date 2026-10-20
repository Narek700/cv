(function () {
  'use strict';

  /* ---------------- Background particle network ---------------- */
  var canvas = document.getElementById('canvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var width = 700;
    var height = 250;
    var opts = {
      particleColor: 'rgba(255,255,255,0.35)',
      lineColor: [200, 200, 200],
      particleAmount: 50,
      defaultSpeed: 0.15,
      variantSpeed: 0.15,
      defaultRadius: 2,
      variantRadius: 2,
      linkRadius: 80,
    };

    function resize() {
      width = canvas.width = 700;
      height = canvas.height = 250;
    }

    function Particle() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      var speed = opts.defaultSpeed + Math.random() * opts.variantSpeed;
      var angle = Math.floor(Math.random() * 360);
      this.radius = opts.defaultRadius + Math.random() * opts.variantRadius;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
    }
    Particle.prototype.update = function () {
      if (this.x >= width || this.x <= 0) this.vx *= -1;
      if (this.y >= height || this.y <= 0) this.vy *= -1;
      this.x = Math.min(Math.max(this.x + this.vx, 0), width);
      this.y = Math.min(Math.max(this.y + this.vy, 0), height);
    };
    Particle.prototype.draw = function () {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = opts.particleColor;
      ctx.fill();
    };

    function linkPoints(point, hubs) {
      for (var i = 0; i < hubs.length; i++) {
        var dist = Math.hypot(point.x - hubs[i].x, point.y - hubs[i].y);
        var opacity = 1 - dist / opts.linkRadius;
        if (opacity > 0) {
          ctx.lineWidth = 0.5;
          ctx.strokeStyle = 'rgba(' + opts.lineColor.join(',') + ',' + opacity + ')';
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(hubs[i].x, hubs[i].y);
          ctx.stroke();
        }
      }
    }

    var particles = [];
    function setup() {
      resize();
      particles = [];
      for (var i = 0; i < opts.particleAmount; i++) particles.push(new Particle());
      requestAnimationFrame(loop);
    }
    function loop() {
      requestAnimationFrame(loop);
      ctx.clearRect(0, 0, width, height);
      particles.forEach(function (p) { p.update(); p.draw(); });
      particles.forEach(function (p) { linkPoints(p, particles); });
    }
    setup();
  }

  /* ---------------- Burger menu ---------------- */
  var aside = document.getElementById('aside');
  var burger = document.getElementById('burger');
  if (burger && aside) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('open');
      if (window.navigator.vibrate) window.navigator.vibrate(30);
      aside.classList.toggle('active', burger.classList.contains('open'));
    });
  }

  /* ---------------- Reveal + skill bars on load ---------------- */
  window.addEventListener('load', function () {
    document.querySelectorAll('.trs').forEach(function (el) { el.classList.add('active'); });

    var lines = document.querySelectorAll('.skill .line');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var line = entry.target;
          var fill = line.querySelector('span');
          fill.style.width = (line.getAttribute('data-p') || 0) + '%';
          observer.unobserve(line);
        });
      }, { threshold: 0.4 });
      lines.forEach(function (line) { io.observe(line); });
    } else {
      lines.forEach(function (line) {
        line.querySelector('span').style.width = (line.getAttribute('data-p') || 0) + '%';
      });
    }
  });

  /* ---------------- Avatar lightbox ---------------- */
  var avatar = document.getElementById('avatar');
  if (avatar && burger) {
    avatar.addEventListener('click', function () {
      var isActive = avatar.classList.toggle('active');
      burger.style.opacity = isActive ? '0' : '1';
      burger.style.zIndex = isActive ? '-1' : '9999';
    });
  }
  var closeBtn = document.getElementById('close');
  if (closeBtn && avatar) {
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      avatar.classList.remove('active');
      if (burger) { burger.style.opacity = '1'; burger.style.zIndex = '9999'; }
    });
  }

  console.log(
    '%cWelcome!',
    'color: red; background-color: white; font-size: 25px; text-transform: uppercase; padding: 50px 10px; font-family: Arial, sans-serif;'
  );
})();
