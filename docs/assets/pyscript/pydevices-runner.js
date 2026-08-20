/**
 * pydevices-runner.js — Client-side Pyodide manager for PyDevices documentation.
 *
 * Automatically bootstraps Pyodide in the background, unpacks the local zero-network
 * package bundle, and connects interactive code editors to live HTML5 <canvas> targets.
 */

(function () {
  let pyodidePromise = null;
  let pyodideInstance = null;

  function findBundleUrl() {
    // Resolve relative path to assets/pyscript/pydevices_bundle.zip based on page depth
    const scripts = document.getElementsByTagName("script");
    for (let s of scripts) {
      if (s.src && s.src.includes("pydevices-runner.js")) {
        return s.src.replace("pydevices-runner.js", "pydevices_bundle.zip");
      }
    }
    return "assets/pyscript/pydevices_bundle.zip";
  }

  async function getPyodide(updateStatus) {
    if (pyodideInstance) return pyodideInstance;
    if (!pyodidePromise) {
      pyodidePromise = (async () => {
        if (typeof loadPyodide === "undefined") {
          throw new Error("Pyodide script library not loaded. Check CDN link.");
        }

        if (updateStatus) updateStatus("Downloading Python engine…");
        const pyodide = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"
        });

        if (updateStatus) updateStatus("Loading package tools…");
        await pyodide.loadPackage("micropip");

        if (updateStatus) updateStatus("Unpacking PyDevices libraries…");
        const bundleUrl = findBundleUrl();
        try {
          const resp = await fetch(bundleUrl);
          if (resp.ok) {
            const buf = await resp.arrayBuffer();
            pyodide.unpackArchive(buf, "zip", { extractDir: "/lib/python3.12/site-packages" });
          } else {
            console.warn("Could not fetch local bundle, status:", resp.status);
          }
        } catch (e) {
          console.warn("Could not load local pydevices_bundle.zip:", e);
        }

        // Set up sys.path in Pyodide
        await pyodide.runPythonAsync(`
import sys, os
if "/lib/python3.12/site-packages" not in sys.path:
    sys.path.insert(0, "/lib/python3.12/site-packages")
`);

        pyodideInstance = pyodide;
        return pyodide;
      })();
    }
    return pyodidePromise;
  }

  async function executeDemo(demo, pyodide) {
    const editor = demo.querySelector(".code-editor");
    const output = demo.querySelector(".demo-output");
    const canvas = demo.querySelector("canvas");
    const status = demo.querySelector(".demo-status");
    const runBtn = demo.querySelector(".run-btn");

    if (!editor || !canvas) return;
    const canvasId = canvas.id;
    const code = editor.value;

    if (runBtn) runBtn.disabled = true;
    if (status) status.textContent = "Running…";
    if (output) output.textContent = "";

    try {
      // Capture print output into the demo output box
      await pyodide.runPythonAsync(`
import builtins, sys
from js import document

class _DomOutput:
    def __init__(self, target_id):
        self.target_id = target_id
    def write(self, s):
        el = document.getElementById(self.target_id)
        if el is not None and s:
            el.textContent += s
    def flush(self):
        pass
`);

      const outputId = output ? output.id || (output.id = "out_" + Math.random().toString(36).substr(2, 9)) : "";
      
      const setupCode = `
import builtins, sys
_out = _DomOutput("${outputId}")
sys.stdout = _out
sys.stderr = _out
CANVAS_ID = "${canvasId}"
`;
      await pyodide.runPythonAsync(setupCode);
      await pyodide.runPythonAsync(code);

      if (status) status.textContent = "Active";
    } catch (err) {
      if (output) {
        output.textContent = "Error: " + (err.message || String(err));
      }
      if (status) status.textContent = "Error";
    } finally {
      if (runBtn) runBtn.disabled = false;
    }
  }

  function initDemos() {
    const demos = document.querySelectorAll(".pydevices-live-demo");
    if (demos.length === 0) return;

    demos.forEach((demo, idx) => {
      const runBtn = demo.querySelector(".run-btn");
      const resetBtn = demo.querySelector(".reset-btn");
      const editor = demo.querySelector(".code-editor");
      const status = demo.querySelector(".demo-status");
      const canvas = demo.querySelector("canvas");

      if (canvas && !canvas.id) {
        canvas.id = "live_canvas_" + idx;
      }

      if (editor) {
        demo._initialCode = editor.value;
      }

      if (runBtn) {
        runBtn.addEventListener("click", async () => {
          try {
            const pyodide = await getPyodide((msg) => {
              if (status) status.textContent = msg;
            });
            await executeDemo(demo, pyodide);
          } catch (e) {
            if (status) status.textContent = "Load Failed";
            console.error(e);
          }
        });
      }

      if (resetBtn && editor) {
        resetBtn.addEventListener("click", () => {
          editor.value = demo._initialCode || "";
          if (runBtn) runBtn.click();
        });
      }
    });

    // Automatically trigger Pyodide background load and initial execution
    getPyodide((msg) => {
      demos.forEach((d) => {
        const st = d.querySelector(".demo-status");
        if (st) st.textContent = msg;
      });
    })
      .then((pyodide) => {
        demos.forEach((demo) => {
          const runBtn = demo.querySelector(".run-btn");
          const status = demo.querySelector(".demo-status");
          if (status) status.textContent = "Ready";
          if (runBtn) runBtn.disabled = false;
          executeDemo(demo, pyodide);
        });
      })
      .catch((err) => {
        demos.forEach((d) => {
          const st = d.querySelector(".demo-status");
          if (st) st.textContent = "Load Failed";
        });
        console.error("Pyodide boot error:", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDemos);
  } else {
    initDemos();
  }
})();
