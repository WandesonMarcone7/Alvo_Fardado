window.AI_CONFIG = {
  provider: "grok",
  enabled: false,
  model: "",
  proxyEndpoint: "",
  note: "A chave de API nunca deve ficar no frontend. Ative apenas via proxy no servidor."
};

window.AI_BRIDGE = (function () {
  "use strict";

  function isEnabled() {
    var cfg = window.AI_CONFIG || {};
    return !!cfg.enabled && !!cfg.proxyEndpoint;
  }

  function describe() {
    var cfg = window.AI_CONFIG || {};
    return {
      provider: cfg.provider || "grok",
      enabled: isEnabled(),
      model: cfg.model || "",
      hasProxy: !!cfg.proxyEndpoint
    };
  }

  function requestStudyPlan() {
    return Promise.reject(new Error("Integração de IA desativada nesta versão. Nenhuma chamada foi feita."));
  }

  return { isEnabled: isEnabled, describe: describe, requestStudyPlan: requestStudyPlan };
})();
