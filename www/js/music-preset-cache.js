// js/music-preset-cache.js
// Client-side loader for Hybrid Presets from Edge Function
// FAIL-FAST MODE: No fallback; throws error if Edge cannot provide presets

(() => {
  // Cache in memory only (no localStorage, no legacy fallback)
  let memoryCache = {}; // { "trial.water.lofi": { preset object }, ... }
  let fetchPromise = null;
  let cacheVersion = 'none';

  // ── Fetch single preset from Edge Function (real call) ──
  async function fetchPresetFromEdge(edition, element, style) {
    const url = `${window.SUPABASE_URL}/functions/v1/get-music-preset`;
    const apiKey = window.SUPABASE_ANON_KEY || '';
    console.log(`[PresetCache] Fetching ${edition}.${element}.${style} from Edge...`);
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
      body: JSON.stringify({ edition, element, style })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(`Edge returned ${resp.status}: ${err.error || 'Unknown error'}`);
    }
    const data = await resp.json();
    if (!data.preset) {
      throw new Error(`Edge response missing preset for ${edition}.${element}.${style}`);
    }
    // Update memory cache
    const key = `${edition}.${element}.${style}`;
    memoryCache[key] = data.preset;
    cacheVersion = data.version || 'edge';
    return data.preset;
  }

  // ── Public API ──
  window.MusicPresetCache = {
    /**
     * Get preset for given edition, element, style.
     * Throws error if not available.
     */
    async getPreset(edition, element, style) {
      const key = `${edition}.${element}.${style}`;
      // Return cached if exists
      if (memoryCache[key]) {
        console.log(`[PresetCache] Cache hit: ${key}`);
        return memoryCache[key];
      }
      // Fetch from Edge (single preset)
      if (!fetchPromise) {
        // We fetch one by one; no bulk fetch to keep simple
        fetchPromise = fetchPresetFromEdge(edition, element, style)
          .finally(() => { fetchPromise = null; });
      }
      const preset = await fetchPromise;
      return preset;
    },

    getCacheVersion() {
      return cacheVersion;
    },

    // For debugging
    clear() {
      memoryCache = {};
      cacheVersion = 'none';
    }
  };

  console.log('[PresetCache] Module loaded (FAIL-FAST v1.0)');
})();