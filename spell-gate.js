
/*
 * spell-gate-hogwarts.js
 * Hogwarts-inspired password overlay with animated lanterns, owls,
 * rare randomized comets, opaque mirrored castle, manuscript quotes,
 * and optional HarrySong.mp3 background music.
 *
 * Keep HarrySong.mp3 in the same folder as the HTML page that loads this script.
 * Existing window.SPELL configuration and the original Enter click callback are retained.
 */

(function () {
  'use strict';

  var cfg = window.SPELL || {};
  var enter = document.getElementById('enter');
  var orig = enter && enter.onclick;

  if (!enter || !orig) return;

  var PW = (cfg.password || '').trim();
  var HASH = (cfg.passwordHash || '').trim().toLowerCase();

  if (!PW && !HASH) {
    console.warn('config.js has no password, so the spell page is skipped.');
    return;
  }

  var music = null;
  var musicBtn = null;
  var musicFadeTimer = null;
  var musicVolume = 0.25;

  /* SHA-256 retained for passwordHash compatibility. */

  function sha256hex(str) {

    var K = new Uint32Array(64);
    var H = new Uint32Array(8);
    var n = 2, c = 0;

    function fr(x) {
      return ((x - Math.floor(x)) * 4294967296) >>> 0;
    }

    while (c < 64) {

      var p = true;

      for (var d = 2; d * d <= n; d++) {
        if (n % d === 0) {
          p = false;
          break;
        }
      }

      if (p) {
        if (c < 8) H[c] = fr(Math.sqrt(n));
        K[c] = fr(Math.cbrt(n));
        c++;
      }

      n++;
    }

    var b = new TextEncoder().encode(str);
    var l = b.length;
    var tot = ((l + 9 + 63) >> 6) << 6;
    var m = new Uint8Array(tot);

    m.set(b);
    m[l] = 0x80;

    var dv = new DataView(m.buffer);

    dv.setUint32(tot - 4, (l * 8) >>> 0);
    dv.setUint32(tot - 8, Math.floor(l * 8 / 4294967296));

    var w = new Uint32Array(64);
    var h = H.slice();

    function rr(x, k) {
      return (x >>> k) | (x << (32 - k));
    }

    for (var o = 0; o < tot; o += 64) {

      for (var i = 0; i < 16; i++) {
        w[i] = dv.getUint32(o + i * 4);
      }

      for (i = 16; i < 64; i++) {

        var s0 =
          rr(w[i - 15], 7) ^
          rr(w[i - 15], 18) ^
          (w[i - 15] >>> 3);

        var s1 =
          rr(w[i - 2], 17) ^
          rr(w[i - 2], 19) ^
          (w[i - 2] >>> 10);

        w[i] =
          (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }

      var a = h[0], bb = h[1], cc = h[2], dd = h[3];
      var e = h[4], f = h[5], g = h[6], hh = h[7];

      for (i = 0; i < 64; i++) {

        var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        var ch = (e & f) ^ (~e & g);

        var t1 =
          (hh + S1 + ch + K[i] + w[i]) >>> 0;

        var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        var mj = (a & bb) ^ (a & cc) ^ (bb & cc);

        var t2 = (S0 + mj) >>> 0;

        hh = g;
        g = f;
        f = e;
        e = (dd + t1) >>> 0;

        dd = cc;
        cc = bb;
        bb = a;
        a = (t1 + t2) >>> 0;
      }

      h[0] += a;
      h[1] += bb;
      h[2] += cc;
      h[3] += dd;
      h[4] += e;
      h[5] += f;
      h[6] += g;
      h[7] += hh;
    }

    return Array.prototype.map.call(h, function (x) {
      return x.toString(16).padStart(8, '0');
    }).join('');
  }

  function norm(s) {
    return String(s).trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function ok(s) {
    return PW
      ? norm(s) === norm(PW)
      : sha256hex('spell|' + norm(s)) === HASH;
  }


  /* =====================================================
     HOGWARTS CSS
     ===================================================== */

  var css = `

    .sg {
      --sg-gold: #d9b66e;
      position: fixed;
      inset: 0;
      z-index: 99999;
      overflow: auto;
      isolation: isolate;
      display: grid;
      place-items: center;
      padding: clamp(18px, 4vh, 42px) 24px;
      color: #f3e6c5;
      font-family: Georgia, 'Times New Roman', serif;

      background:
        radial-gradient(
          ellipse at 52% 34%,
          rgba(67, 69, 128, .42),
          transparent 43%
        ),
        radial-gradient(
          ellipse at 15% 80%,
          rgba(101, 53, 49, .22),
          transparent 35%
        ),
        radial-gradient(
          ellipse at 85% 75%,
          rgba(24, 66, 89, .25),
          transparent 36%
        ),
        linear-gradient(
          180deg,
          #080d24 0%,
          #111a3a 48%,
          #080b18 100%
        );

      transition: opacity 1.25s ease, visibility 1.25s ease;
    }

    .sg.fade {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .sg * {
      box-sizing: border-box;
    }

    .sg::before,
    .sg::after {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
    }

    .sg::before {
      z-index: -1;
      opacity: .5;

      background:
        radial-gradient(
          ellipse at 50% 100%,
          rgba(4, 7, 17, .05) 0 20%,
          rgba(3, 5, 13, .78) 82%
        ),
        linear-gradient(
          90deg,
          rgba(2, 5, 18, .28),
          transparent 30%,
          transparent 70%,
          rgba(2, 5, 18, .28)
        );
    }

    .sg::after {
      z-index: 2;
      opacity: .18;

      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.25'/%3E%3C/svg%3E");

      mix-blend-mode: screen;
    }

    /* STARS */

    .sg-stars {
      position: absolute;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .sg-stars i {
      position: absolute;
      width: 2px;
      height: 2px;
      border-radius: 50%;

      background: #fff8dc;

      box-shadow:
        0 0 7px 1px rgba(255, 244, 202, .65);

      animation: sg-twinkle ease-in-out infinite;
    }

    @keyframes sg-twinkle {
      0%,100% {
        opacity: .16;
        transform: scale(.7);
      }

      50% {
        opacity: 1;
        transform: scale(1.45);
      }
    }


    /* MOON */

    .sg-moon {
      position: absolute;
      z-index: 0;

      top: 7%;
      right: 12%;

      width: clamp(58px, 8vw, 104px);
      aspect-ratio: 1;

      border-radius: 50%;

      background:
        radial-gradient(
          circle at 34% 30%,
          #fffef0 0 10%,
          #f8edca 42%,
          #d7c79d 73%,
          #a99a78 100%
        );

      box-shadow:
        0 0 28px 8px rgba(255, 239, 187, .22),
        0 0 100px 35px rgba(255, 226, 157, .13);

      animation:
        sg-moon-glow 5s ease-in-out infinite alternate;
    }

    @keyframes sg-moon-glow {
      to {
        box-shadow:
          0 0 38px 12px rgba(255, 239, 187, .32),
          0 0 125px 45px rgba(255, 226, 157, .2);
      }
    }


    /* RARE RANDOMIZED COMETS */

    .sg-comet {
      position: absolute;
      z-index: 0;

      left: var(--comet-left, -180px);
      top: var(--comet-top, -150px);

      width: var(--comet-width, 165px);
      height: 2px;

      opacity: 0;
      pointer-events: none;

      transform-origin: right center;

      background:
        linear-gradient(
          90deg,
          transparent 0%,
          rgba(186, 211, 255, .12) 35%,
          rgba(255,255,255,.98) 100%
        );

      filter:
        drop-shadow(0 0 5px rgba(190, 218, 255, .95));

      animation:
        sg-comet var(--comet-duration, 42s)
        linear var(--comet-delay, 8s) infinite;
    }

    .sg-comet::after {
      content: '';
      position: absolute;

      right: -1px;
      top: -2px;

      width: 6px;
      height: 6px;

      border-radius: 50%;

      background: #fff;

      box-shadow:
        0 0 10px 3px rgba(207, 227, 255, .9);
    }

    @keyframes sg-comet {

      0%, 2% {
        opacity: 0;

        transform:
          translate3d(0, 0, 0)
          rotate(var(--comet-angle, 33deg));
      }

      3% {
        opacity: .98;
      }

      15% {
        opacity: .78;

        transform:
          translate3d(
            calc(112vw + 280px),
            calc(112vh + 240px),
            0
          )
          rotate(var(--comet-angle, 33deg));
      }

      17%, 100% {
        opacity: 0;

        transform:
          translate3d(
            calc(112vw + 280px),
            calc(112vh + 240px),
            0
          )
          rotate(var(--comet-angle, 33deg));
      }
    }


    /* SKY LANTERNS */

    .sg-lantern {
      position: absolute;
      z-index: 1;

      bottom: -90px;

      width: 25px;
      height: 39px;

      opacity: 0;
      pointer-events: none;

      animation:
        sg-lantern-rise var(--duration) linear var(--delay) infinite;

      filter:
        drop-shadow(0 0 13px rgba(255, 165, 67, .36));
    }

    .sg-lantern::before {
      content: '';
      position: absolute;

      inset: 3px 2px 5px;

      border-radius:
        48% 48% 35% 35% / 24% 24% 17% 17%;

      border:
        1px solid rgba(255, 220, 147, .8);

      background:
        linear-gradient(
          90deg,
          rgba(151, 49, 27, .9),
          #ffca70 48%,
          rgba(146, 47, 27, .94)
        );

      box-shadow:
        inset 0 0 9px rgba(255, 238, 180, .55),
        0 0 17px rgba(255, 163, 60, .28);
    }

    .sg-lantern::after {
      content: '';
      position: absolute;

      left: 50%;
      bottom: 0;

      width: 5px;
      height: 7px;

      transform: translateX(-50%);

      border-radius: 50%;

      background: #fff4bd;

      box-shadow:
        0 0 9px 4px rgba(255, 182, 77, .85);
    }

    .sg-lantern span {
      position: absolute;
      z-index: 1;

      left: 50%;
      top: 12px;

      width: 3px;
      height: 12px;

      transform: translateX(-50%);

      border-radius: 50%;

      background: #fff2ad;

      box-shadow:
        0 0 9px 4px rgba(255, 188, 78, .8);
    }

    @keyframes sg-lantern-rise {

      0% {
        opacity: 0;
        transform: translate3d(0, 0, 0) rotate(-4deg) scale(.72);
      }

      10% {
        opacity: .88;
      }

      50% {
        opacity: .8;
        transform: translate3d(27px, -56vh, 0) rotate(5deg) scale(1);
      }

      90% {
        opacity: .68;
      }

      100% {
        opacity: 0;
        transform: translate3d(-22px, -120vh, 0) rotate(-5deg) scale(.78);
      }
    }


    /* FLYING OWLS */

    .sg-owl {
      position: absolute;
      z-index: 2;

      left: -130px;

      width: var(--owl-size, 72px);
      height: auto;

      opacity: .82;
      pointer-events: none;

      filter:
        drop-shadow(0 3px 7px rgba(0,0,0,.38));

      animation:
        sg-owl-flight var(--owl-duration, 24s)
        linear var(--owl-delay, 0s) infinite;
    }

    .sg-owl .body {
      fill: #c6c1b5;
    }

    .sg-owl .wing {
      fill: #9d9a91;

      transform-box: fill-box;
      transform-origin: 50% 72%;

      animation:
        sg-owl-flap .42s ease-in-out infinite alternate;
    }

    .sg-owl .wing.back {
      animation-delay: -.2s;
    }

    .sg-owl .eye {
      fill: #f3d99e;
    }

    .sg-owl .pupil {
      fill: #292536;
    }

    .sg-owl .beak {
      fill: #bd8a43;
    }

    @keyframes sg-owl-flap {
      from {
        transform: rotate(-18deg) scaleY(.88);
      }

      to {
        transform: rotate(20deg) scaleY(1.08);
      }
    }

    @keyframes sg-owl-flight {

      0% {
        transform:
          translate3d(0, 0, 0)
          rotate(5deg)
          scale(var(--owl-scale, 1));
      }

      25% {
        transform:
          translate3d(25vw, -18px, 0)
          rotate(-2deg)
          scale(var(--owl-scale, 1));
      }

      55% {
        transform:
          translate3d(56vw, 24px, 0)
          rotate(4deg)
          scale(var(--owl-scale, 1));
      }

      78% {
        transform:
          translate3d(82vw, -24px, 0)
          rotate(-3deg)
          scale(var(--owl-scale, 1));
      }

      100% {
        transform:
          translate3d(calc(100vw + 280px), 5px, 0)
          rotate(4deg)
          scale(var(--owl-scale, 1));
      }
    }


    /* ENCHANTED FLYING KEYS */

    .sg-key {
      position: absolute;
      z-index: 1;

      width: 24px;
      height: 11px;

      border-radius: 4px;

      background:
        linear-gradient(
          90deg,
          #8e672b,
          #ffe18b,
          #b88939
        );

      box-shadow:
        0 0 11px rgba(255, 215, 115, .78);

      opacity: .78;

      animation:
        sg-key-flight var(--key-duration, 14s)
        linear var(--key-delay, 0s) infinite;
    }

    .sg-key::before,
    .sg-key::after {
      content: '';
      position: absolute;

      top: -9px;

      width: 13px;
      height: 19px;

      border:
        1px solid rgba(255, 236, 181, .7);

      background:
        rgba(237, 222, 177, .58);
    }

    .sg-key::before {
      left: -12px;

      border-radius: 85% 10% 85% 10%;

      transform-origin: 100% 100%;

      animation:
        sg-key-wing .25s ease-in-out infinite alternate;
    }

    .sg-key::after {
      right: -12px;

      border-radius: 10% 85% 10% 85%;

      transform-origin: 0 100%;

      animation:
        sg-key-wing .25s ease-in-out infinite alternate-reverse;
    }

    @keyframes sg-key-flight {
      0% {
        transform: translate3d(-8vw, 22vh, 0) rotate(15deg);
      }

      50% {
        transform: translate3d(52vw, -8vh, 0) rotate(-22deg);
      }

      100% {
        transform: translate3d(110vw, -30vh, 0) rotate(35deg);
      }
    }

    @keyframes sg-key-wing {
      to {
        transform: rotate(28deg);
      }
    }


    /* CASTLE: MIRRORED AND FULLY OPAQUE */

    .sg-castle {
      position: absolute;
      z-index: 1;

      left: 0;
      bottom: -1px;

      width: 100%;
      height: min(48vh, 410px);

      pointer-events: none;

      opacity: 1;

      transform: scaleX(-1);
      transform-origin: center center;
    }

    .sg-castle .window {
      animation: sg-window 3.2s ease-in-out infinite;
    }

    @keyframes sg-window {
      0%,100% {
        opacity: .45;
      }

      50% {
        opacity: 1;
        filter: drop-shadow(0 0 5px #ffd978);
      }
    }


    /* MIST KEPT BEHIND THE CASTLE */

    .sg-mist {
      position: absolute;
      z-index: 0;

      left: -10%;
      bottom: 6%;

      width: 120%;
      height: 17vh;

      opacity: .18;
      pointer-events: none;

      filter: blur(22px);

      background:
        linear-gradient(
          90deg,
          transparent,
          rgba(162, 176, 204, .55),
          transparent
        );

      animation:
        sg-mist-drift 18s ease-in-out infinite alternate;
    }

    @keyframes sg-mist-drift {
      to {
        transform: translateX(9%);
        opacity: .28;
      }
    }


    /* MAIN LAYOUT */

    .sg-stage {
      position: relative;
      z-index: 4;

      width: min(1160px, calc(100vw - 72px));

      min-height: min(700px, 86vh);

      display: grid;

      grid-template-columns:
        minmax(0, 1.12fr)
        minmax(340px, 410px);

      align-items: center;

      gap: clamp(34px, 4.5vw, 62px);

      margin: auto;
    }


    /* LEFT STORY PANEL */

    .sg-story {
      position: relative;

      display: flex;
      flex-direction: column;
      align-items: flex-start;

      width: 100%;
      max-width: none;
      min-width: 0;

      padding: 28px 12px 30px 20px;

      animation:
        sg-story-enter 1.1s cubic-bezier(.2,.8,.2,1) both;
    }

    @keyframes sg-story-enter {
      from {
        opacity: 0;
        transform: translate3d(-24px, 10px, 0);
      }

      to {
        opacity: 1;
        transform: none;
      }
    }

    .sg-story::before {
      content: '';

      position: absolute;
      z-index: -1;

      left: -20px;
      top: 8%;
      bottom: 8%;

      width: 1px;

      background:
        linear-gradient(
          transparent,
          rgba(224, 194, 130, .62),
          transparent
        );

      box-shadow:
        0 0 18px rgba(224, 194, 130, .32);
    }

    .sg-brandline {
      display: flex;
      align-items: center;
      gap: 10px;

      margin: 0 0 22px;

      color: #dfc58f;

      font:
        600 10px/1.4
        'Cinzel', Georgia, serif;

      letter-spacing: .28em;
      text-transform: uppercase;
    }

    .sg-brandline::before {
      content: '✦';
      color: #f4d58b;
      font-size: 14px;
    }


    /* CREST AND HOGWARTS TITLE */

    .sg-story-head {
      display: grid;

      grid-template-columns:
        clamp(82px, 8vw, 108px)
        minmax(0, 1fr);

      align-items: center;
      gap: 18px;

      width: 100%;
      min-width: 0;
    }

    .sg-story-copy {
      min-width: 0;
    }

    .sg-crest {
      display: block;

      width: 100%;
      max-width: 108px;
      min-width: 0;

      filter:
        drop-shadow(0 0 18px rgba(238, 190, 92, .2));

      animation:
        sg-crest-float 5.5s ease-in-out infinite;
    }

    @keyframes sg-crest-float {
      0%,100% {
        transform: translateY(0) rotate(-1deg);
      }

      50% {
        transform: translateY(-9px) rotate(1deg);
      }
    }

    .sg-est {
      margin: 0 0 5px;

      color: #d8bd83;

      font:
        11px/1.4
        'Cinzel', Georgia, serif;

      letter-spacing: .24em;
      text-transform: uppercase;
    }

    .sg-school {
      display: block;

      max-width: 100%;
      margin: 0;

      white-space: nowrap;

      color: #f4e8c9;

      font:
        700 clamp(2rem, 4vw, 3.35rem)/1.02
        'Cinzel Decorative', Georgia, serif;

      letter-spacing: -.055em;

      text-shadow:
        0 5px 28px rgba(0,0,0,.48),
        0 0 28px rgba(241, 203, 128, .16);
    }

    .sg-school-sub {
      max-width: 320px;

      margin: 13px 0 0;

      color: #d7c9a7;

      font:
        italic clamp(14px, 1.5vw, 17px)/1.6
        Georgia, serif;
    }

    .sg-rule {
      width: min(360px, 90%);
      height: 1px;

      margin: 28px 0 20px;

      background:
        linear-gradient(
          90deg,
          rgba(211, 175, 106, .8),
          rgba(211, 175, 106, .08)
        );
    }


    /* QUOTES FROM HER THROUGH MY EYES */

    .sg-quotebook {
      display: grid;
      gap: 17px;

      width: 100%;
      max-width: 485px;

      margin-top: 25px;

      animation:
        sg-quote-appear 1.6s ease both;
    }

    .sg-quote {
      position: relative;

      margin: 0;
      padding: 0 8px 0 23px;

      border-left:
        1px solid rgba(218, 187, 126, .48);

      color: #e8d9b9;

      font:
        italic 14px/1.7
        Georgia, serif;

      letter-spacing: .015em;

      text-shadow:
        0 0 15px rgba(225, 192, 127, .12);

      transition:
        color .3s,
        text-shadow .3s;
    }

    .sg-quote::before {
      content: '✧';

      position: absolute;

      left: 5px;
      top: 0;

      color: #e2bd79;

      font-size: 10px;
    }

    .sg-quote:hover {
      color: #fff0ce;

      text-shadow:
        0 0 15px rgba(255, 215, 145, .35);
    }

    .sg-quote-credit {
      margin-top: 1px;

      color: #c4a773;

      font:
        9px 'Cinzel', Georgia, serif;

      letter-spacing: .2em;
      text-transform: uppercase;
    }

    @keyframes sg-quote-appear {
      from {
        opacity: 0;
        transform: translateY(12px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }


    /* FLOATING BOOKS */

    .sg-book-stack {
      position: absolute;

      right: 12px;
      bottom: 8px;

      width: 118px;
      height: 64px;

      opacity: .72;

      transform: rotate(-7deg);

      animation:
        sg-book-hover 6s ease-in-out infinite;
    }

    .sg-book-stack i {
      position: absolute;
      right: 0;

      width: 100px;
      height: 15px;

      border:
        1px solid rgba(231, 198, 133, .7);

      border-radius: 3px 7px 7px 3px;

      background:
        linear-gradient(
          90deg,
          #4e2633,
          #8c563d 18%,
          #b88b56 20%,
          #5a3942 24%,
          #281e31
        );

      box-shadow:
        0 5px 8px rgba(0,0,0,.3);
    }

    .sg-book-stack i:nth-child(1) {
      bottom: 3px;
      right: 8px;
    }

    .sg-book-stack i:nth-child(2) {
      bottom: 19px;
      right: 0;

      transform: rotate(5deg);

      background:
        linear-gradient(
          90deg,
          #24394b,
          #607b78 18%,
          #d0b17a 20%,
          #435b60 24%,
          #20283a
        );
    }

    .sg-book-stack i:nth-child(3) {
      bottom: 35px;
      right: 11px;

      transform: rotate(-3deg);

      background:
        linear-gradient(
          90deg,
          #58422c,
          #a07a47 18%,
          #e0c88e 20%,
          #80603b 24%,
          #332b2b
        );
    }

    @keyframes sg-book-hover {
      50% {
        transform: translateY(-7px) rotate(-4deg);
      }
    }


    /* PARCHMENT LOGIN CARD */

    .sg-card {
      position: relative;
      z-index: 5;

      width: 100%;
      max-width: 410px;

      justify-self: end;
      align-self: center;

      margin-top: 30px;

      padding: 34px 36px 30px;

      text-align: center;

      color: #3c2818;

      border:
        1px solid rgba(255, 226, 164, .74);

      border-radius: 7px;

      background:
        radial-gradient(
          ellipse at 14% 12%,
          rgba(255, 249, 220, .88),
          transparent 43%
        ),
        radial-gradient(
          ellipse at 88% 92%,
          rgba(165, 111, 51, .2),
          transparent 48%
        ),
        linear-gradient(
          135deg,
          #f1e2bd,
          #dfc28c 54%,
          #f0dfb5
        );

      box-shadow:
        0 25px 90px rgba(0,0,0,.58),
        0 0 60px rgba(230, 184, 104, .18),
        inset 0 0 35px rgba(112, 67, 29, .21),
        inset 0 0 0 5px rgba(255, 249, 222, .23);

      animation:
        sg-card-arrive 1.15s cubic-bezier(.2,.8,.2,1) both;
    }

    @keyframes sg-card-arrive {
      from {
        opacity: 0;
        transform: translate3d(22px, 18px, 0) scale(.98);
      }

      to {
        opacity: 1;
        transform: none;
      }
    }

    .sg-card::before {
      content: '';

      position: absolute;
      inset: 9px;
      z-index: -1;

      border:
        1px solid rgba(116, 73, 35, .42);

      border-radius: 3px;

      pointer-events: none;
    }

    .sg-card::after {
      content: '✦';

      position: absolute;

      top: 15px;
      right: 18px;

      color: rgba(119, 76, 36, .52);

      font-size: 13px;
    }

    .sg-card.shake {
      animation: sg-shake .48s ease-in-out;
    }

    @keyframes sg-shake {
      20%,60% {
        transform: translateX(-10px);
      }

      40%,80% {
        transform: translateX(10px);
      }
    }

    .sg-card.ok {
      animation: sg-card-glow 1.35s ease-out;
    }

    @keyframes sg-card-glow {
      to {
        filter:
          brightness(1.24)
          drop-shadow(0 0 32px #ffe073);
      }
    }

    .sg-card-top {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;

      margin: 0 0 16px;

      color: #8b642f;

      font:
        600 9px/1.4
        'Cinzel', Georgia, serif;

      letter-spacing: .25em;
    }

    .sg-card-top .seal {
      display: inline-grid;
      place-items: center;

      width: 25px;
      height: 25px;

      border:
        1px solid #a57c42;

      border-radius: 50%;

      color: #7e1f20;

      font-size: 13px;
    }

    .sg-card h2 {
      margin: 0 0 10px;

      color: #641b20;

      font:
        700 clamp(1.55rem, 5vw, 2.05rem)/1.18
        'Cinzel Decorative', Georgia, serif;

      text-shadow:
        0 1px 1px rgba(255,255,255,.55);
    }

    .sg-card p.s {
      margin: 0 auto 13px;

      max-width: 300px;

      color: #634a2b;

      font:
        italic 14px/1.55
        Georgia, serif;
    }

    .sg-card .o {
      margin: 13px 0 19px;

      color: #9b753c;

      font-size: 16px;
      letter-spacing: .45em;
    }

    .sg-card input {
      display: block;

      width: 100%;
      min-height: 52px;

      padding: 12px 14px;

      border:
        1px solid #9d7540;

      border-radius: 3px;

      outline: none;

      background:
        rgba(255, 251, 235, .78);

      color: #382516;

      font:
        15px Georgia, serif;

      letter-spacing: .12em;
      text-align: center;

      box-shadow:
        inset 0 2px 7px rgba(65, 38, 14, .12),
        0 1px 0 rgba(255,255,255,.45);

      transition:
        border-color .25s,
        box-shadow .25s,
        background .25s;
    }

    .sg-card input::placeholder {
      color: #8e7656;
      letter-spacing: .07em;
      opacity: .9;
    }

    .sg-card input:focus {
      border-color: #8a2529;
      background: #fff9e9;

      box-shadow:
        0 0 0 3px rgba(145, 53, 42, .12),
        0 0 19px rgba(255, 185, 83, .48),
        inset 0 2px 5px rgba(0,0,0,.08);
    }

    .sg-card button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;

      min-height: 49px;

      margin-top: 16px;
      padding: 11px 24px;

      border:
        1px solid #e1bf76;

      border-radius: 3px;

      cursor: pointer;

      color: #fff1cf;

      background:
        linear-gradient(180deg, #8c272b, #50131c);

      box-shadow:
        0 5px 13px rgba(65, 20, 19, .27),
        inset 0 1px 0 rgba(255,255,255,.18);

      font:
        600 11px 'Cinzel', Georgia, serif;

      letter-spacing: .15em;
      text-transform: uppercase;

      transition:
        transform .22s,
        filter .22s,
        box-shadow .22s;
    }

    .sg-card button::after {
      content: '✦';

      color: #f0d18e;

      font-size: 13px;
    }

    .sg-card button:hover {
      transform: translateY(-2px);
      filter: brightness(1.16);

      box-shadow:
        0 8px 18px rgba(65, 20, 19, .36),
        0 0 16px rgba(255, 210, 122, .2);
    }

    .sg-card button:focus-visible {
      outline: 3px solid rgba(125, 37, 41, .35);
      outline-offset: 3px;
    }

    .sg-card .m {
      min-height: 1.6em;
      margin: 15px 0 0;

      color: #8a2025;

      font:
        700 13px/1.5
        Georgia, serif;
    }

    .sg-card .h {
      min-height: 1.4em;
      margin-top: 3px;

      color: #775a36;

      font:
        italic 12px/1.5
        Georgia, serif;
    }

    .sg-card-foot {
      margin-top: 16px;

      color: #8a714e;

      font:
        9px/1.5
        'Cinzel', Georgia, serif;

      letter-spacing: .17em;
    }


    /* FLOATING CANDLES */

    .sg-candle {
      position: absolute;
      z-index: 2;

      width: 11px;
      height: 43px;

      animation:
        sg-candle-float 5s ease-in-out
        var(--candle-delay, 0s) infinite;

      transform:
        scale(var(--candle-scale, 1));

      pointer-events: none;
    }

    .sg-candle .wax {
      position: absolute;

      left: 0;
      right: 0;

      top: 14px;
      bottom: 0;

      border-radius: 3px 3px 2px 2px;

      background:
        linear-gradient(
          90deg,
          #b6a17b,
          #fff3d2 48%,
          #b9a27b
        );

      box-shadow:
        0 0 10px rgba(255, 215, 146, .2);
    }

    .sg-candle .flame {
      position: absolute;

      left: 50%;
      top: -6px;

      width: 12px;
      height: 23px;

      margin-left: -6px;

      border-radius:
        50% 50% 50% 50% / 65% 65% 35% 35%;

      background:
        radial-gradient(
          ellipse at 50% 72%,
          #fffde5,
          #ffc04b 57%,
          transparent 79%
        );

      filter:
        drop-shadow(0 0 9px #ffba49);

      animation:
        sg-flame .18s ease-in-out infinite alternate;
    }

    .sg-candle::after {
      content: '';

      position: absolute;

      left: 50%;
      top: -22px;

      width: 64px;
      height: 64px;

      margin-left: -32px;

      border-radius: 50%;

      background:
        radial-gradient(
          circle,
          rgba(255, 190, 80, .22),
          transparent 70%
        );
    }

    @keyframes sg-candle-float {
      50% {
        transform:
          translateY(-13px)
          scale(var(--candle-scale, 1));
      }
    }

    @keyframes sg-flame {
      to {
        transform: scale(.84, 1.14) rotate(4deg);
      }
    }

    .sg.bad .sg-candle .flame {
      opacity: .18;
    }


    /* MUSIC BUTTON */

    .sg-music-toggle {
      position: fixed;

      top: 22px;
      left: 22px;

      z-index: 12;

      padding: 10px 16px;

      border:
        1px solid rgba(225, 191, 118, .7);

      border-radius: 30px;

      color: #f5dfac;

      background:
        rgba(15, 21, 43, .78);

      backdrop-filter: blur(10px);

      box-shadow:
        0 0 18px rgba(218, 174, 91, .15);

      font:
        600 10px 'Cinzel', Georgia, serif;

      letter-spacing: .12em;

      cursor: pointer;

      transition: all .3s ease;
    }

    .sg-music-toggle:hover {
      background:
        rgba(103, 63, 38, .9);

      border-color: #ffe3a0;

      box-shadow:
        0 0 20px rgba(255, 205, 115, .35);

      transform: translateY(-2px);
    }

    .sg-music-toggle:focus-visible {
      outline: 2px solid #ffe3a0;
      outline-offset: 4px;
    }

    .sg-music-toggle:disabled {
      opacity: .55;
      cursor: not-allowed;
    }


    /* WAND CURSOR */

    .sg-wand {
      position: absolute;
      z-index: 10;

      width: 9px;
      height: 9px;

      border-radius: 50%;

      background: #fff;

      box-shadow:
        0 0 9px 4px #ffdf75;

      pointer-events: none;

      transform: translate(-50%, -50%);

      animation:
        sg-sparkle .72s linear forwards;
    }

    @keyframes sg-sparkle {
      to {
        transform: translate(-50%,-50%) scale(2.5);
        opacity: 0;
      }
    }


    /* LUMOS TRANSITION */

    .sg-light {
      position: absolute;
      inset: 0;
      z-index: 8;

      pointer-events: none;

      background:
        radial-gradient(
          circle,
          #fffde8 0,
          #ffdf6d 38%,
          #ff9800 78%
        );

      clip-path:
        circle(0% at 50% 50%);

      transition:
        clip-path 1.55s cubic-bezier(.5,0,.3,1);
    }

    .sg-light.on {
      clip-path:
        circle(160% at 50% 50%);
    }

    .sg-sp {
      position: absolute;
      z-index: 7;

      left: 50%;
      top: 50%;

      width: 9px;
      height: 9px;

      margin: -4px;

      border-radius: 50%;

      background: #ffea8a;

      box-shadow:
        0 0 14px 4px #ffbc3b;

      animation:
        sg-burst 1.3s ease-out forwards;
    }

    @keyframes sg-burst {
      to {
        transform:
          translate(var(--x), var(--y))
          scale(.12);

        opacity: 0;
      }
    }


    /* TABLET AND MOBILE */

    @media (max-width: 960px) {

      .sg {
        padding: 20px 18px 28px;
      }

      .sg-stage {
        width: min(650px, calc(100vw - 36px));

        min-height: 0;

        grid-template-columns:
          minmax(0, 1fr);

        gap: 14px;

        padding: 10px 0;
      }

      .sg-story {
        width: 100%;
        max-width: 620px;

        justify-self: center;

        padding: 5px 8px 12px;
      }

      .sg-story::before {
        display: none;
      }

      .sg-brandline {
        margin-bottom: 10px;
        font-size: 9px;
      }

      .sg-story-head {
        grid-template-columns:
          76px minmax(0, 1fr);

        gap: 15px;
      }

      .sg-crest {
        width: 76px;
      }

      .sg-school {
        font-size: clamp(2rem, 6vw, 3rem);
      }

      .sg-school-sub {
        margin-top: 7px;
        font-size: 13px;
      }

      .sg-rule,
      .sg-landmarks,
      .sg-side-quote,
      .sg-book-stack {
        display: none;
      }

      /* Keep all three quotations visible on tablet and mobile. */

      .sg-quotebook {
        max-width: 620px;
        margin-top: 12px;
        gap: 9px;
      }

      .sg-quote {
        font-size: 12px;
        line-height: 1.5;
      }

      .sg-quote-credit {
        font-size: 8px;
      }

      .sg-card {
        justify-self: center;
        align-self: center;

        width: min(100%, 430px);
        max-width: 430px;

        margin: 0 auto;
      }

      .sg-moon {
        top: 4%;
        right: 7%;
      }

      .sg-castle {
        height: 31vh;
      }
    }


    /* SMALL PHONES */

    @media (max-width: 440px) {

      .sg {
        padding: 14px 12px 22px;
      }

      .sg-stage {
        width: 100%;
        gap: 8px;
        padding: 4px 0;
      }

      .sg-story {
        padding: 3px 4px 8px;
      }

      .sg-brandline {
        margin-bottom: 7px;
        letter-spacing: .18em;
      }

      .sg-story-head {
        grid-template-columns:
          58px minmax(0, 1fr);

        gap: 11px;
      }

      .sg-crest {
        width: 58px;
      }

      .sg-school {
        font-size: clamp(1.75rem, 8vw, 2.1rem);
        letter-spacing: -.06em;
      }

      .sg-est {
        font-size: 8px;
      }

      .sg-school-sub {
        max-width: 240px;

        margin-top: 5px;

        font-size: 11px;
        line-height: 1.35;
      }

      .sg-quotebook {
        margin-top: 8px;
        gap: 7px;
      }

      .sg-quote {
        padding-left: 19px;

        font-size: 11px;
        line-height: 1.45;
      }

      .sg-quote-credit {
        font-size: 7px;
      }

      .sg-card {
        padding: 24px 23px 19px;
      }

      .sg-card h2 {
        font-size: 1.5rem;
      }

      .sg-card .o {
        margin: 10px 0 15px;
      }

      .sg-card input {
        min-height: 48px;
      }

      .sg-card button {
        min-height: 46px;
      }

      .sg-castle {
        height: 25vh;
      }

      .sg-candle:nth-of-type(n+7) {
        display: none;
      }

      .sg-music-toggle {
        top: auto;
        bottom: 15px;
        left: 12px;

        padding: 8px 12px;
      }
    }


    /* REDUCED MOTION ACCESSIBILITY */

    @media (prefers-reduced-motion: reduce) {

      .sg *,
      .sg *::before,
      .sg *::after {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
      }

      .sg-light {
        transition-duration: .01ms !important;
      }
    }

  `;


  /* =====================================================
     INJECT CSS AND LOAD FONTS
     ===================================================== */

  var st = document.createElement('style');

  st.id = 'spell-gate-hogwarts-style';
  st.textContent = css;

  document.head.appendChild(st);

  var lk = document.createElement('link');

  lk.rel = 'stylesheet';

  lk.href =
    'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cinzel+Decorative:wght@700&display=swap';

  document.head.appendChild(lk);


  /* =====================================================
     CASTLE SVG
     ===================================================== */

  var castle = `

    <svg
      class="sg-castle"
      viewBox="0 0 1440 430"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >

      <defs>
        <linearGradient
          id="sg-castle-shade"
          x1="0"
          x2="0"
          y1="0"
          y2="1"
        >
          <stop offset="0" stop-color="#15182b"/>
          <stop offset="1" stop-color="#03050d"/>
        </linearGradient>
      </defs>

      <g fill="url(#sg-castle-shade)">

        <path d="M0 430V300h70v-82h34v-76l39-77 39 77v76h40v-55h23v-44l27-58 27 58v44h25v112h72V192h38v-62h22V65l43-65 43 65v65h22v62h42v-98h28v-55l30-61 30 61v55h28v98h48v-55h30v-49l33-69 33 69v49h30v55h43v-92h28v-60l39-72 39 72v60h28v92h55v-68h35v-47l29-58 29 58v47h35v68h53v-94h34v-58l42-79 42 79v58h34v94h50v-60h28v-46l27-56 27 56v46h28v60h94v130z"/>

        <path
          d="M0 390h1440v40H0z"
          fill="#03050c"
        />

      </g>

      <g fill="#f5ce79">

        <rect class="window" x="128" y="190" width="9" height="20"/>

        <rect
          class="window"
          x="128" y="238"
          width="9" height="19"
          style="animation-delay:-1.2s"
        />

        <rect
          class="window"
          x="290" y="210"
          width="8" height="17"
          style="animation-delay:-.7s"
        />

        <rect
          class="window"
          x="414" y="110"
          width="10" height="23"
          style="animation-delay:-1.7s"
        />

        <rect
          class="window"
          x="449" y="190"
          width="9" height="21"
          style="animation-delay:-.4s"
        />

        <rect
          class="window"
          x="574" y="155"
          width="9" height="18"
          style="animation-delay:-2s"
        />

        <rect
          class="window"
          x="647" y="225"
          width="9" height="18"
          style="animation-delay:-1s"
        />

        <rect
          class="window"
          x="797" y="174"
          width="9" height="19"
          style="animation-delay:-.8s"
        />

        <rect
          class="window"
          x="918" y="210"
          width="9" height="19"
          style="animation-delay:-1.4s"
        />

        <rect
          class="window"
          x="1072" y="178"
          width="9" height="19"
          style="animation-delay:-2.1s"
        />

        <rect
          class="window"
          x="1195" y="205"
          width="9" height="18"
          style="animation-delay:-.3s"
        />

        <rect
          class="window"
          x="1325" y="250"
          width="9" height="18"
          style="animation-delay:-1.8s"
        />

      </g>

    </svg>

  `;


  /* =====================================================
     MAGICAL CREST
     ===================================================== */

  var crest = `

    <svg
      class="sg-crest"
      viewBox="0 0 160 190"
      role="img"
      aria-label="A four-part magical school crest"
    >

      <path
        d="M80 5 145 27v62c0 43-26 73-65 94C41 162 15 132 15 89V27z"
        fill="#c9a65d"
        opacity=".9"
      />

      <path
        d="M80 10 139 30v58c0 39-23 66-59 86-36-20-59-47-59-86V30z"
        fill="#19182a"
        stroke="#f2dfad"
        stroke-width="2"
      />

      <path
        d="M80 18v145c-32-18-52-42-52-76V35z"
        fill="#7b272d"
      />

      <path
        d="M80 18v145c32-18 52-42 52-76V35z"
        fill="#203d43"
      />

      <path
        d="M28 90h104"
        stroke="#e4c783"
        stroke-width="2"
      />

      <path
        d="M80 18v145"
        stroke="#e4c783"
        stroke-width="2"
      />

      <g
        fill="#f5e5bc"
        font-family="Georgia,serif"
        text-anchor="middle"
        font-weight="bold"
      >
        <text x="54" y="67" font-size="25">✦</text>
        <text x="106" y="67" font-size="23">♜</text>
        <text x="54" y="128" font-size="23">✧</text>
        <text x="106" y="128" font-size="23">☾</text>
      </g>

      <path
        d="M54 174h52l-8 10H62z"
        fill="#c9a65d"
      />

      <text
        x="80"
        y="183"
        text-anchor="middle"
        font-family="Cinzel,Georgia,serif"
        font-size="7"
        fill="#fff2cf"
        letter-spacing="2"
      >MAGIC</text>

    </svg>

  `;


  /* =====================================================
     OWL SVG
     ===================================================== */

  var owlSvg = `

    <svg viewBox="0 0 100 78" aria-hidden="true">

      <path
        class="wing back"
        d="M43 35C29 23 18 18 5 17c9 11 13 22 14 34 8-5 16-8 25-7z"
      />

      <path
        class="wing"
        d="M57 35c14-12 25-17 38-18-9 11-13 22-14 34-8-5-16-8-25-7z"
      />

      <path
        class="body"
        d="M50 23c-15-17-31-15-40-12 8 7 12 15 11 25-5 8-8 15-7 22 2 11 18 17 36 17s34-6 36-17c1-7-2-14-7-22-1-10 3-18 11-25-9-3-25-5-40 12z"
      />

      <path
        d="M50 28c-10-10-23-10-31-7 7 6 10 13 10 21 5-6 12-9 21-9s16 3 21 9c0-8 3-15 10-21-8-3-21-3-31 7z"
        fill="#e0dbcf"
      />

      <circle class="eye" cx="38" cy="43" r="10"/>
      <circle class="eye" cx="62" cy="43" r="10"/>

      <circle class="pupil" cx="39" cy="43" r="4"/>
      <circle class="pupil" cx="61" cy="43" r="4"/>

      <path class="beak" d="m46 53 4 8 4-8z"/>

      <path
        d="M35 68 30 77l13-5 7 6 7-6 13 5-5-9"
        fill="#9d9a91"
      />

    </svg>

  `;


  /* =====================================================
     GLOBAL REFERENCES
     ===================================================== */

  var ovl, card, inp, msg, hint, light;

  var tries = 0;
  var done = false;
  var prevOv = '';


  /* =====================================================
     OPEN SPELLGATE
     ===================================================== */

  enter.onclick = function () {

    var gate = document.getElementById('gate');

    if (gate) {
      gate.classList.add('gone');
    }

    prevOv = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });

    build();

    if (inp) {
      inp.focus({ preventScroll: true });
    }
  };


  /* =====================================================
     BUILD OVERLAY
     ===================================================== */

  function build() {

    ovl = document.createElement('div');

    ovl.className = 'sg';

    ovl.setAttribute('role', 'dialog');
    ovl.setAttribute('aria-modal', 'true');
    ovl.setAttribute('aria-label', 'Password entrance');

    var stars = '';
    var candles = '';
    var keys = '';
    var lanterns = '';
    var owls = '';
    var comets = '';

    var i;


    /* RANDOM STARS */

    for (i = 0; i < 110; i++) {

      stars +=
        '<i style="left:' +
        Math.random() * 100 +
        '%;top:' +
        Math.random() * 82 +
        '%;animation-duration:' +
        (2.2 + Math.random() * 4.5) +
        's;animation-delay:-' +
        Math.random() * 6 +
        's"></i>';
    }


    /* FLOATING CANDLES */

    for (i = 0; i < 13; i++) {

      candles +=
        '<div class="sg-candle" style="left:' +
        (2 + Math.random() * 96) +
        '%;top:' +
        (8 + Math.random() * 48) +
        '%;--candle-delay:-' +
        Math.random() * 6 +
        's;--candle-scale:' +
        (.65 + Math.random() * .45) +
        '"><div class="flame"></div><div class="wax"></div></div>';
    }


    /* FLYING KEYS */

    for (i = 0; i < 6; i++) {

      keys +=
        '<div class="sg-key" style="top:' +
        (17 + Math.random() * 55) +
        '%;--key-duration:' +
        (12 + Math.random() * 9) +
        's;--key-delay:-' +
        Math.random() * 12 +
        's"></div>';
    }


    /* SKY LANTERNS */

    for (i = 0; i < 9; i++) {

      lanterns +=
        '<div class="sg-lantern" style="left:' +
        (3 + Math.random() * 94) +
        '%;--duration:' +
        (20 + Math.random() * 14) +
        's;--delay:-' +
        Math.random() * 30 +
        's"><span></span></div>';
    }


    /* FLYING OWLS */

    for (i = 0; i < 4; i++) {

      owls +=
        '<div class="sg-owl" style="top:' +
        (10 + Math.random() * 48) +
        '%;--owl-size:' +
        (48 + Math.random() * 38) +
        'px;--owl-scale:' +
        (.72 + Math.random() * .35) +
        ';--owl-duration:' +
        (21 + Math.random() * 13) +
        's;--owl-delay:-' +
        Math.random() * 22 +
        's">' +
        owlSvg +
        '</div>';
    }


    /* =================================================
       RARE RANDOMIZED COMETS

       - Only 1 or 2 per page session.
       - Random starting positions near upper-left.
       - Random angles and comet lengths.
       - Each repeats every 34-56 seconds.
       - The visible streak lasts only a fraction of that cycle.
       ================================================= */

    var cometCount =
      1 + Math.floor(Math.random() * 2);

    for (i = 0; i < cometCount; i++) {

      var cometLeft =
        -220 + Math.random() * 115;

      var cometTop =
        -180 + Math.random() * 105;

      var cometWidth =
        125 + Math.random() * 75;

      var cometAngle =
        27 + Math.random() * 16;

      var cometDuration =
        34 + Math.random() * 22;

      var cometDelay =
        (i === 0 ? 6 : 17) + Math.random() * 12;

      comets +=

        '<div class="sg-comet" style="' +

        '--comet-left:' + cometLeft + 'px;' +

        '--comet-top:' + cometTop + 'px;' +

        '--comet-width:' + cometWidth + 'px;' +

        '--comet-angle:' + cometAngle + 'deg;' +

        '--comet-duration:' + cometDuration + 's;' +

        '--comet-delay:' + cometDelay + 's;' +

        '"></div>';
    }


    /* =================================================
       COMPLETE OVERLAY HTML
       ================================================= */

    ovl.innerHTML =

      '<div class="sg-stars" aria-hidden="true">' +
      stars +
      '</div>' +

      '<div class="sg-moon" aria-hidden="true"></div>' +

      comets +
      lanterns +
      owls +
      keys +
      castle +
      candles +

      '<div class="sg-mist" aria-hidden="true"></div>' +

      '<main class="sg-stage">' +

        '<section class="sg-story" aria-label="Hogwarts at night">' +

          '<div class="sg-brandline">' +
            'A place of wonder and magic' +
          '</div>' +

          '<div class="sg-story-head">' +

            crest +

            '<div class="sg-story-copy">' +

              '<p class="sg-est">Est. 990 A.D.</p>' +

              '<h1 class="sg-school">Hogwarts</h1>' +

              '<p class="sg-school-sub">' +
                'School of Witchcraft and Wizardry' +
              '</p>' +

            '</div>' +

          '</div>' +

          '<div class="sg-rule"></div>' +


          /* MANUSCRIPT QUOTES */

          '<div class="sg-quotebook">' +

            '<p class="sg-quote">' +
              'Life rarely announces the things we will remember.' +
            '</p>' +

            '<p class="sg-quote">' +
              'Some memories are better left with a little room around them.' +
            '</p>' +

            '<p class="sg-quote">' +
              'Some lessons arrive as advice. Some arrive through mistakes.' +
            '</p>' +

            '<div class="sg-quote-credit">' +
              'The castle is awake tonight. Somewhere, an owl is carrying a secret.' +
            '</div>' +

          '</div>' +

          '<div class="sg-book-stack" aria-hidden="true">' +
            '<i></i><i></i><i></i>' +
          '</div>' +

        '</section>' +


        /* PASSWORD CARD */

        '<form class="sg-card" autocomplete="off">' +

          '<div class="sg-card-top">' +
            '<span class="seal">✦</span>' +
            '<span>Restricted section · Authorized entry</span>' +
          '</div>' +

          '<h2></h2>' +

          '<p class="s"></p>' +

          '<div class="o">⚡ ✧ ⚯ ✧ ⚡</div>' +

          '<input ' +
            'type="password" ' +
            'aria-label="Password" ' +
            'autocomplete="current-password" ' +
            'autocapitalize="none" ' +
            'spellcheck="false" ' +
            'placeholder="Enter the secret spell…">' +

          '<button type="submit"></button>' +

          '<div class="m" role="status" aria-live="polite"></div>' +

          '<div class="h"></div>' +

          '<div class="sg-card-foot">' +
            'By moonlight · By magic · By invitation' +
          '</div>' +

        '</form>' +

      '</main>' +


      /* MUSIC BUTTON */

      '<button class="sg-music-toggle" type="button" aria-pressed="false">' +
        '♫ Play Music' +
      '</button>' +

      '<div class="sg-light"></div>';


    /* DOM REFERENCES */

    card = ovl.querySelector('.sg-card');

    inp = ovl.querySelector('input');

    msg = ovl.querySelector('.m');

    hint = ovl.querySelector('.h');

    light = ovl.querySelector('.sg-light');

    musicBtn = ovl.querySelector('.sg-music-toggle');


    /* CONFIGURATION TEXT */

    ovl.querySelector('h2').textContent =
      cfg.title || 'The Secret Word';

    ovl.querySelector('.s').textContent =
      cfg.subtitle || 'Only those who know the spell may pass.';

    ovl.querySelector(
      '.sg-card button[type="submit"]'
    ).textContent =
      cfg.button || 'Cast the spell';


    /* CURSOR MAGIC */

    if (
      window.matchMedia &&
      !window.matchMedia('(pointer: coarse)').matches
    ) {

      var lastSpark = 0;

      ovl.addEventListener('mousemove', function (e) {

        var now = Date.now();

        if (
          now - lastSpark < 65 ||
          Math.random() > .42
        ) {
          return;
        }

        lastSpark = now;

        var spark = document.createElement('span');

        spark.className = 'sg-wand';

        spark.style.left = e.clientX + 'px';

        spark.style.top = e.clientY + 'px';

        ovl.appendChild(spark);

        window.setTimeout(function () {
          spark.remove();
        }, 760);

      });
    }


    /* PASSWORD SUBMISSION */

    card.onsubmit = function (e) {

      e.preventDefault();

      if (done) return;

      ok(inp.value) ? unlock() : wrong();
    };


    document.body.appendChild(ovl);

    setupMusic();
  }


  /* =====================================================
     HARRYSONG BACKGROUND MUSIC
     ===================================================== */

  function setupMusic() {

    /*
     * HarrySong.mp3 must be in the same folder
     * as the HTML page.
     */

    music = new Audio('./HarrySong.mp3');

    music.loop = true;

    music.volume = musicVolume;

    music.preload = 'auto';

    updateMusicButton(false, '♫ Play Music');


    /* MUSIC BUTTON */

    musicBtn.addEventListener('click', function () {

      if (done || !music || musicBtn.disabled) {
        return;
      }

      if (music.paused) {

        music.play().then(function () {

          updateMusicButton(
            true,
            '♫ Music: ON'
          );

        }).catch(function (error) {

          console.warn(
            'HarrySong.mp3 could not be played:',
            error
          );

          updateMusicButton(
            false,
            '♫ Tap to Play'
          );

        });

      } else {

        music.pause();

        updateMusicButton(
          false,
          '♫ Play Music'
        );
      }
    });


    /* MISSING AUDIO FILE HANDLING */

    music.addEventListener('error', function () {

      if (!musicBtn || done) return;

      musicBtn.textContent =
        '♫ Song not found';

      musicBtn.disabled = true;

      musicBtn.title =
        'Place HarrySong.mp3 in the same folder as your HTML page.';

      musicBtn.setAttribute(
        'aria-pressed',
        'false'
      );
    });


    /* ATTEMPT AUTOPLAY AFTER ENTER CLICK */

    music.play().then(function () {

      updateMusicButton(
        true,
        '♫ Music: ON'
      );

    }).catch(function () {

      updateMusicButton(
        false,
        '♫ Play Music'
      );
    });
  }


  /* UPDATE MUSIC BUTTON */

  function updateMusicButton(playing, label) {

    if (!musicBtn) return;

    musicBtn.textContent =
      label || (
        playing
          ? '♫ Music: ON'
          : '♫ Play Music'
      );

    musicBtn.setAttribute(
      'aria-pressed',
      String(playing)
    );
  }


  /* =====================================================
     CINEMATIC MUSIC FADE
     ===================================================== */

  function fadeOutMusic() {

    if (musicBtn) {
      musicBtn.disabled = true;
    }

    if (!music || music.paused) {

      updateMusicButton(
        false,
        '♫ Music Off'
      );

      return;
    }

    if (musicFadeTimer) {

      window.clearInterval(musicFadeTimer);

      musicFadeTimer = null;
    }

    var startingVolume = music.volume;

    var fadeDuration = 1800;

    var fadeStarted = Date.now();

    if (musicBtn) {

      musicBtn.disabled = true;

      updateMusicButton(
        true,
        '♫ Fading out…'
      );
    }

    musicFadeTimer = window.setInterval(function () {

      var progress = Math.min(
        (Date.now() - fadeStarted) / fadeDuration,
        1
      );

      music.volume = Math.max(
        0,
        startingVolume * (1 - progress)
      );

      if (progress >= 1) {

        window.clearInterval(musicFadeTimer);

        musicFadeTimer = null;

        music.pause();

        try {
          music.currentTime = 0;
        } catch (e) {
          /* Ignore if metadata is not ready. */
        }

        music.volume = musicVolume;

        updateMusicButton(
          false,
          '♫ Music Off'
        );
      }

    }, 50);
  }


  /* =====================================================
     WRONG PASSWORD
     ===================================================== */

  function wrong() {

    tries++;

    msg.textContent =
      cfg.wrong || 'That spell did not work. Try again.';

    if (tries >= 2 && cfg.hint) {

      hint.textContent =
        'Hint: ' + cfg.hint;
    }

    card.classList.remove('shake');

    void card.offsetWidth;

    card.classList.add('shake');

    ovl.classList.add('bad');

    window.setTimeout(function () {

      ovl.classList.remove('bad');

    }, 700);

    inp.value = '';

    inp.focus({
      preventScroll: true
    });
  }


  /* =====================================================
     SUCCESSFUL PASSWORD / LUMOS UNLOCK
     ===================================================== */

  function unlock() {

    done = true;

    fadeOutMusic();

    msg.textContent =
      '✨ Lumos! Access Granted ✨';

    hint.textContent = '';

    card.classList.add('ok');


    /* MAGICAL PARTICLE BURST */

    for (var i = 0; i < 80; i++) {

      var a = Math.random() * 6.283;

      var r = 140 + Math.random() * 360;

      var s = document.createElement('span');

      s.className = 'sg-sp';

      s.style.setProperty(
        '--x',
        Math.cos(a) * r + 'px'
      );

      s.style.setProperty(
        '--y',
        Math.sin(a) * r + 'px'
      );

      ovl.appendChild(s);
    }


    /* LUMOS LIGHT TRANSITION */

    window.setTimeout(function () {

      light.classList.add('on');

    }, 350);


    /* ORIGINAL UNLOCK CALLBACK */

    orig();

    document.body.style.overflow = prevOv;


    /* REMOVE OVERLAY */

    window.setTimeout(function () {

      ovl.classList.add('fade');

    }, 1900);

    window.setTimeout(function () {

      if (ovl && ovl.parentNode) {
        ovl.remove();
      }

    }, 3400);
  }

})();
