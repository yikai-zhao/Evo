// =====================================================================
// Evo Platform SDK Adapter (v1.5.0) — Poki / CrazyGames / Standalone
// =====================================================================
// Unified API:
//   SDK.init()                 → Promise, called once on page load
//   SDK.gameplayStart()        → called when actual gameplay begins
//   SDK.gameplayStop()         → called on death / pause / menu
//   SDK.commercialBreak()      → Promise, mid-game ad (called between rounds)
//   SDK.rewardedBreak()        → Promise<boolean>, rewarded ad
//   SDK.happyTime(intensity)   → emit "engagement spike" (Poki)
//   SDK.platform               → 'poki' | 'crazygames' | 'standalone'
//   SDK.lastAdAt               → timestamp of last ad shown
//   SDK.MIN_AD_INTERVAL        → 120000 ms (Poki guideline: max 1 ad / 2 min)
// =====================================================================
(function(){
  const SDK = {
    platform: 'standalone',
    ready: false,
    lastAdAt: 0,
    MIN_AD_INTERVAL: 120000,
    _pokiReady: false,
    _czReady: false,
  };

  function detectPlatform(){
    const q = (location.search||'').toLowerCase();
    const h = (location.hostname||'').toLowerCase();
    if (q.includes('platform=poki') || h.includes('poki')) return 'poki';
    if (q.includes('platform=crazygames') || h.includes('crazygames')) return 'crazygames';
    return 'standalone';
  }

  function loadScript(url){
    return new Promise((res, rej)=>{
      const s = document.createElement('script');
      s.src = url; s.async = true;
      s.onload = ()=>res();
      s.onerror = ()=>rej(new Error('load failed: '+url));
      document.head.appendChild(s);
    });
  }

  SDK.init = async function(){
    SDK.platform = detectPlatform();
    try {
      if (SDK.platform === 'poki'){
        await loadScript('https://game-cdn.poki.com/scripts/v2/poki-sdk.js');
        if (window.PokiSDK){
          await window.PokiSDK.init().catch(()=>{});
          window.PokiSDK.gameLoadingStart && window.PokiSDK.gameLoadingStart();
          SDK._pokiReady = true;
        }
      } else if (SDK.platform === 'crazygames'){
        await loadScript('https://sdk.crazygames.com/crazygames-sdk-v3.js');
        if (window.CrazyGames && window.CrazyGames.SDK){
          await window.CrazyGames.SDK.init().catch(()=>{});
          SDK._czReady = true;
        }
      }
    } catch(e){
      console.warn('[SDK] init failed, falling back to standalone:', e);
      SDK.platform = 'standalone';
    }
    SDK.ready = true;
    return SDK;
  };

  SDK.gameLoadingFinished = function(){
    if (SDK._pokiReady && window.PokiSDK && window.PokiSDK.gameLoadingFinished){
      try { window.PokiSDK.gameLoadingFinished(); } catch(e){}
    }
  };

  SDK.gameplayStart = function(){
    if (SDK._pokiReady && window.PokiSDK){
      try { window.PokiSDK.gameplayStart(); } catch(e){}
    } else if (SDK._czReady && window.CrazyGames){
      try { window.CrazyGames.SDK.game.gameplayStart(); } catch(e){}
    }
  };

  SDK.gameplayStop = function(){
    if (SDK._pokiReady && window.PokiSDK){
      try { window.PokiSDK.gameplayStop(); } catch(e){}
    } else if (SDK._czReady && window.CrazyGames){
      try { window.CrazyGames.SDK.game.gameplayStop(); } catch(e){}
    }
  };

  SDK.happyTime = function(intensity){
    if (SDK._pokiReady && window.PokiSDK){
      try { window.PokiSDK.happyTime(Math.max(0, Math.min(1, intensity||0.5))); } catch(e){}
    }
  };

  // Audio pause/resume hooks for ad coordination
  SDK._onAdStart = ()=>{ try { window.dispatchEvent(new Event('evo:ad-start')); } catch(e){} };
  SDK._onAdEnd   = ()=>{ try { window.dispatchEvent(new Event('evo:ad-end'));   } catch(e){} };

  SDK.commercialBreak = function(){
    return new Promise((resolve)=>{
      const now = Date.now();
      if (now - SDK.lastAdAt < SDK.MIN_AD_INTERVAL){ resolve(false); return; }
      SDK.lastAdAt = now;
      SDK._onAdStart();
      const done = ()=>{ SDK._onAdEnd(); resolve(true); };
      if (SDK._pokiReady && window.PokiSDK){
        try { window.PokiSDK.commercialBreak().then(done, done); }
        catch(e){ done(); }
      } else if (SDK._czReady && window.CrazyGames){
        try {
          window.CrazyGames.SDK.ad.requestAd('midgame', {
            adStarted: ()=>{},
            adFinished: done,
            adError: ()=>done(),
          });
        } catch(e){ done(); }
      } else {
        done();
      }
    });
  };

  SDK.rewardedBreak = function(){
    return new Promise((resolve)=>{
      SDK.lastAdAt = Date.now();
      SDK._onAdStart();
      const finish = (ok)=>{ SDK._onAdEnd(); resolve(!!ok); };
      if (SDK._pokiReady && window.PokiSDK){
        try { window.PokiSDK.rewardedBreak().then((r)=>finish(r!==false), ()=>finish(false)); }
        catch(e){ finish(false); }
      } else if (SDK._czReady && window.CrazyGames){
        try {
          window.CrazyGames.SDK.ad.requestAd('rewarded', {
            adStarted: ()=>{},
            adFinished: ()=>finish(true),
            adError: ()=>finish(false),
          });
        } catch(e){ finish(false); }
      } else {
        finish(false);
      }
    });
  };

  window.SDK = SDK;
})();
