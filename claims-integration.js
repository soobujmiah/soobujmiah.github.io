/*
 * Public claim-status integration.
 * Loaded by app.js after the existing portfolio UI has initialized.
 *
 * This intentionally changes presentation only: it does not alter the
 * existing visual system, language data, or runtime behavior.
 */
(function () {
  "use strict";

  function addEvidenceLink() {
    var nav = document.querySelector(".foot nav");
    if (!nav || nav.querySelector('a[href="claims.html"]')) return;

    var link = document.createElement("a");
    link.href = "claims.html";
    link.textContent = "Evidence";
    link.setAttribute("aria-label", "View technical claim status and evidence model");
    nav.appendChild(link);
  }

  function qualifyClaims() {
    var replacements = [
      ["built a GPU-accelerated Debian workstation and local LLM lab entirely on an Android phone.",
       "built a Debian-based Android workstation and local LLM lab, with GPU acceleration explored experimentally on the device."],
      ["GPU-accelerated Debian desktop and local LLM inference lab on an Android phone",
       "Debian desktop and local LLM inference lab on an Android phone, with GPU acceleration investigated experimentally"],
      ["GPU-accelerated Linux desktop and local LLM inference lab running entirely on an Android phone",
       "Linux desktop and local LLM inference lab running on an Android phone, with GPU acceleration documented as experimental"],
      ["Full GUI desktops, GPU acceleration and shell automation, no root required.",
       "Full GUI desktops, shell automation and device-specific graphics experimentation, with acceleration dependent on the runtime and driver stack."],
      ["Private, offline AI that runs on your own hardware — no subscriptions, no data leaving the device.",
       "Private, offline AI workflows designed to run on your own hardware, subject to model, backend and device qualification."],
      ["Model selection, quantisation and GPU offload configured for your machine.",
       "Model selection and quantisation workflows, with GPU offload treated as device/backend-dependent."],
      ["GPU Config",
       "GPU Configuration / Diagnostics"]
    ];

    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var nodes = [];
    var node;
    while ((node = walker.nextNode())) nodes.push(node);

    nodes.forEach(function (textNode) {
      var value = textNode.nodeValue;
      replacements.forEach(function (pair) {
        if (value.indexOf(pair[0]) !== -1) value = value.split(pair[0]).join(pair[1]);
      });
      textNode.nodeValue = value;
    });
  }

  function init() {
    addEvidenceLink();
    qualifyClaims();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
