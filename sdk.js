// =====================================================================
// Evo Platform SDK Adapter (v2.0.0) — Poki / CrazyGames / GameDistribution / Steam / Standalone
// =====================================================================
// Unified API:
//   SDK.init()                 → Promise, called once on page load
//   SDK.gameplayStart()        → called when actual gameplay begins
//   SDK.gameplayStop()         → called on death / pause / menu
//   SDK.commercialBreak()      → Promise, mid-game ad (called between rounds)
//   SDK.rewardedBreak()        → Promise<boolean>, rewarded ad
//   SDK.happyTime(intensity)   → emit "engagement spike" (Poki)
//   SDK.platform               → 'poki' | 'crazygames' | 'gamedist' | 'steam' | 'standalone'
//   SDK.lastAdAt               → timestamp of last ad shown
//   SDK.MIN_AD_INTERVAL        → 120000 ms (Poki guideline: max 1 ad / 2 min)
//   SDK.noAds                  → true on Steam / paid platforms — skip all ad calls
// =====================================================================
(function(){
  const SDK = {
    platform: 'standalone',
    ready: false,
    noAds: false,          // v2.0.0: Steam / paid builds skip ads entirely
    lastAdAt: 0,
    MIN_AD_INTERVAL: 120000,
    _pokiReady: false,
    _czReady: false,
    _gdReady: false,       // v2.0.0: GameDistribution
  };

  function detectPlatform(){
    const q = (location.search||'').toLowerCase();
    const h = (location.hostname||'').toLowerCase();
    if (q.includes('platform=poki') || h.includes('poki')) return 'poki';
    if (q.includes('platform=crazygames') || h.includes('crazygames')) return 'crazygames';
    // v2.0.0: GameDistribution — detects their iframe or explicit param
    if (q.includes('platform=gamedist') || h.includes('gamedistribution') || h.includes('html5.api.gd')) return 'gamedist';
    // v2.0.0: Steam (Electron) — ?platform=steam set by electron-main.js
    if (q.includes('platform=steam')) return 'steam';
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
    // v2.0.0: Steam is a paid platform — no ads
    if (SDK.platform === 'steam'){ SDK.noAds = true; SDK.ready = true; return SDK; }
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
      } else if (SDK.platform === 'gamedist'){
        // v2.0.0: GameDistribution SDK — syndicates to 300+ partner portals
        await loadScript('https://html5.api.gamedistribution.com/main.min.js');
        if (window.gdsdk){
          await new Promise((res)=>{
            // GD SDK fires LOADED event when ready
            window.GD_OPTIONS = {
              gameId: '00000000000000000000000000000000', // replace with real GD game ID
              onEvent: function(event){
                if (event.name === 'SDK_GAME_START') res();
                if (event.name === 'SDK_READY') res();
              },
            };
            setTimeout(res, 3000); // fallback timeout
          });
          SDK._gdReady = true;
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
    } else if (SDK._gdReady && window.gdsdk){
      try { window.gdsdk.onResumeGame && window.gdsdk.onResumeGame(); } catch(e){}
    }
  };

  SDK.gameplayStop = function(){
    if (SDK._pokiReady && window.PokiSDK){
      try { window.PokiSDK.gameplayStop(); } catch(e){}
    } else if (SDK._czReady && window.CrazyGames){
      try { window.CrazyGames.SDK.game.gameplayStop(); } catch(e){}
    } else if (SDK._gdReady && window.gdsdk){
      try { window.gdsdk.onPauseGame && window.gdsdk.onPauseGame(); } catch(e){}
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
      if (SDK.noAds){ resolve(false); return; }   // v2.0.0: skip on paid platforms
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
      } else if (SDK._gdReady && window.gdsdk){
        // v2.0.0: GameDistribution interstitial
        try {
          window.gdsdk.showAd(window.gdsdk.AdType.Interstitial).then(done).catch(done);
        } catch(e){ done(); }
      } else {
        done();
      }
    });
  };

  SDK.rewardedBreak = function(){
    return new Promise((resolve)=>{
      if (SDK.noAds){ resolve(false); return; }   // v2.0.0: skip on paid platforms
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
      } else if (SDK._gdReady && window.gdsdk){
        // v2.0.0: GameDistribution rewarded ad
        try {
          window.gdsdk.showAd(window.gdsdk.AdType.Rewarded)
            .then(()=>finish(true)).catch(()=>finish(false));
        } catch(e){ finish(false); }
      } else {
        finish(false);
      }
    });
  };

  window.SDK = SDK;
})();
