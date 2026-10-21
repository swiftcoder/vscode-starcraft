const vscode = require("vscode");
const os = require("node:os");

const DIRECTORY = "/opt/alignmutex";
const LIBRARY = `${DIRECTORY}/alignmutex.so`;

const MODE_AUTO = "Auto";
const MODE_ENABLED = "Enabled";
const MODE_DISABLED = "Disabled";

// Rosetta emulation of x86-64 containers is only available on Apple Silicon Macs
function isAppleSilicon() {
  if (process.platform !== "darwin") return false;

  if (process.arch === "arm64") return true;

  // The CPU model is reported by the host, even when VS Code itself runs under Rosetta
  const cpus = os.cpus();

  return cpus.some((cpu) => /Apple/i.test(cpu.model || ""));
}

function isEnabled() {
  const mode = vscode.workspace.getConfiguration("starcraft").get("rosetta");

  if (mode === MODE_ENABLED) return true;
  if (mode === MODE_DISABLED) return false;

  return isAppleSilicon();
}

module.exports = { DIRECTORY, LIBRARY, MODE_AUTO, MODE_ENABLED, MODE_DISABLED, isAppleSilicon, isEnabled };
