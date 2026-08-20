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
    const scripts = document.querySelectorAll("script[src*='pydevices-runner.js']");
    if (scripts.length > 0) {
      const src = scripts[scripts.length - 1].src;
      return src.replace("pydevices-runner.js", "pydevices_bundle.zip");
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
        try {
          await pyodide.loadPackage("micropip");
        } catch (e) {
          console.warn("micropip load warning:", e);
        }

        if (updateStatus) updateStatus("Unpacking PyDevices libraries…");
        const bundleUrl = findBundleUrl();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          const resp = await fetch(bundleUrl, {
            signal: controller.signal,
            cache: "no-cache"
          });
          clearTimeout(timeoutId);
          if (resp.ok) {
            const buf = await resp.arrayBuffer();
            if (buf && buf.byteLength > 0) {
              pyodide.unpackArchive(new Uint8Array(buf), "zip");
            }
          } else {
            console.warn("Could not fetch local bundle, status:", resp.status);
          }
        } catch (e) {
          console.warn("Could not load local pydevices_bundle.zip:", e);
        }

        if (updateStatus) updateStatus("Initializing Python environment…");
        // Set up sys.path and PyScript shims in Pyodide
        await pyodide.runPythonAsync(`
import sys, os, types

# Ensure working directory and site-packages are on sys.path
for p in ["/home/pyodide", "/lib/python3.12/site-packages"]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Create compatibility shim for pyscript / pyscript.ffi -> pyodide.ffi
if "pyscript" not in sys.modules:
    ps = types.ModuleType("pyscript")
    ps_ffi = types.ModuleType("pyscript.ffi")
    try:
        import pyodide.ffi
        ps_ffi.create_proxy = pyodide.ffi.create_proxy
    except ImportError:
        pass
    from js import document, window
    ps.document = document
    ps.window = window
    ps.ffi = ps_ffi
    sys.modules["pyscript"] = ps
    sys.modules["pyscript.ffi"] = ps_ffi
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
import builtins, sys, traceback
from js import document

class _DomOutput:
    def __init__(self, target_id):
        self.target_id = target_id
    def write(self, s):
        el = document.getElementById(self.target_id)
        if el is not None and s:
            el.textContent += str(s)
    def flush(self):
        pass
`);

      const outputId = output ? output.id || (output.id = "out_" + Math.random().toString(36).substr(2, 9)) : "";
      
      const runnerCode = `
_out = _DomOutput("${outputId}")
sys.stdout = _out
sys.stderr = _out
CANVAS_ID = "${canvasId}"

_code = ${JSON.stringify(code)}
try:
    exec(compile(_code, "<demo>", "exec"), globals())
except Exception as _e:
    _err = traceback.format_exc()
    sys.stderr.write(_err)
    raise
`;
      await pyodide.runPythonAsync(runnerCode);

      if (status) status.textContent = "Active";
    } catch (err) {
      if (status) status.textContent = "Error";
      console.error("Demo execution error:", err);
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
