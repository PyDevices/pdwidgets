/**
 * pydevices-runner.js — Client-side Pyodide manager for PyDevices documentation.
 *
 * Automatically bootstraps Pyodide in the background, installs the PyDevices
 * packages with micropip, and connects interactive code editors to live HTML5
 * <canvas> targets.
 *
 * Packages come from TestPyPI via micropip -- the same path the PyScript gallery
 * uses -- so these demos run the published wheels, including the compiled wasm
 * build of pygraphics. Set window.PYDEVICES_PACKAGES before this script to
 * override the list.
 */

(function () {
  let pyodidePromise = null;
  let pyodideInstance = null;

  // Pyodide must be a Python 3.14 build: the pygraphics wasm wheels are
  // cp313/cp314 pyemscripten only, so an older Pyodide cannot install them.
  const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v314.0.5/full/";
  const INDEX_URLS = [
    "https://test.pypi.org/simple/{package_name}/",
    "https://pypi.org/simple/{package_name}/"
  ];
  const DEFAULT_PACKAGES = ["pydevices", "pydevices-pdwidgets"];

  function packageList() {
    const custom = window.PYDEVICES_PACKAGES;
    return Array.isArray(custom) && custom.length ? custom : DEFAULT_PACKAGES;
  }

  async function getPyodide(updateStatus) {
    if (pyodideInstance) return pyodideInstance;
    if (!pyodidePromise) {
      pyodidePromise = (async () => {
        if (updateStatus) updateStatus("Downloading Python engine…");
        // Pyodide 314.x ships ESM only (pyodide.asm.mjs); the classic
        // pyodide.js loader 404s, so import the module build directly. Doing it
        // here also keeps the version in one place instead of in mkdocs.yml.
        const { loadPyodide } = await import(PYODIDE_URL + "pyodide.mjs");
        const pyodide = await loadPyodide({ indexURL: PYODIDE_URL });

        if (updateStatus) updateStatus("Loading package tools…");
        await pyodide.loadPackage("micropip");

        if (updateStatus) updateStatus("Installing PyDevices packages…");
        const micropip = pyodide.pyimport("micropip");
        micropip.set_index_urls(INDEX_URLS);
        for (const pkg of packageList()) {
          try {
            await micropip.install(pkg);
          } catch (e) {
            console.error("micropip could not install " + pkg + ":", e);
            throw new Error("Could not install " + pkg +
              " -- these demos need network access to TestPyPI.");
          }
        }

        if (updateStatus) updateStatus("Initializing Python environment…");
        // Set up sys.path and PyScript shims in Pyodide
        await pyodide.runPythonAsync(`
import sys, os, types

# Ensure the working directory is on sys.path. site-packages is already there
# and is version-specific, so let Pyodide own it rather than hardcoding it.
if "/home/pyodide" not in sys.path:
    sys.path.insert(0, "/home/pyodide")

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
