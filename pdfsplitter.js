const { PDFDocument } = PDFLib;

const generateBtn = document.getElementById("generateBtn");
const splitBtn = document.getElementById("splitBtn");
const pdfForm = document.getElementById("pdfForm");
const autoRadio = document.getElementById("automatic");
const manualRadio = document.getElementById("manual");
const autoSplitBox = document.getElementById("autoSplitBox");

let dropZone = null;
let pdfFileInput = null;
let rangeInput = null;
let droppedFile = null;

// -------------------- Mode toggle --------------------
function toggleMode() {
  const manual = manualRadio.checked;
  rangeInput && (rangeInput.style.display = manual ? "block" : "none");
  const label = document.getElementById("hiddenLabel");
  label && (label.style.display = manual ? "block" : "none");
  autoSplitBox.style.display = manual ? "none" : "block";
}
autoRadio.addEventListener("change", toggleMode);
manualRadio.addEventListener("change", toggleMode);

// -------------------- Setup PDF input and drop zone --------------------
function setupPDFInput() {
  pdfForm.innerHTML = "";

  // Hidden file input
  pdfFileInput = document.createElement("input");
  pdfFileInput.type = "file";
  pdfFileInput.accept = "application/pdf";
  pdfFileInput.style.display = "none";
  pdfForm.appendChild(pdfFileInput);

  // Drop zone
  dropZone = document.createElement("div");
  dropZone.textContent = "Click or drag a PDF file here";
  Object.assign(dropZone.style, {
    width: "100%",
    padding: "1rem",
    margin: "1rem 0",
    textAlign: "center",
    border: "2px solid #00ffff",
    borderRadius: "8px",
    background: "#0f0f20",
    color: "#00fff7",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 0 15px #00fff7 inset",
  });
  pdfForm.appendChild(dropZone);

  // Click to open file dialog
  dropZone.addEventListener("click", () => pdfFileInput.click());

  // File input change
  pdfFileInput.addEventListener("change", () => {
    if (pdfFileInput.files.length > 0) {
      droppedFile = pdfFileInput.files[0];
      dropZone.textContent = droppedFile.name;
    }
  });

  // Drag-and-drop events
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.background = "rgba(0,255,255,0.1)";
    dropZone.style.border = "dashed";
    dropZone.style.boxShadow = "0 0 20px #00fff7";
    dropZone.textContent = "Drop your PDF file here";
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.style.background = "#0f0f20";
    dropZone.style.border = "solid 2px #00ffff";
    dropZone.style.boxShadow = "0 0 15px #00fff7 inset";
    dropZone.textContent = droppedFile
      ? droppedFile.name
      : "Click or drag a PDF file here";
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.background = "#0f0f20";
    dropZone.style.border = "solid 2px #00ffff";
    dropZone.style.boxShadow = "0 0 15px #00fff7 inset";
    dropZone.textContent = droppedFile
      ? droppedFile.name
      : "Click or drag a PDF file here";
  });

  // Manual range input
  const rangeLabel = document.createElement("label");
  rangeLabel.id = "hiddenLabel";
  rangeLabel.textContent = "Page ranges (e.g. 1-2,3-4,7-9):";
  pdfForm.appendChild(rangeLabel);

  rangeInput = document.createElement("input");
  rangeInput.type = "text";
  rangeInput.id = "rangeInput";
  rangeInput.placeholder = "e.g. 1-2,3-4,7-9";
  rangeInput.style.width = "100%";
  pdfForm.appendChild(rangeInput);

  splitBtn.style.display = "block";
  toggleMode();
}

// -------------------- Split PDF --------------------
splitBtn.addEventListener("click", async () => {
  const file = droppedFile || (pdfFileInput && pdfFileInput.files[0]);
  if (!file) return alert("Please upload or drop a PDF first.");

  const originalName = file.name.replace(/\.[^/.]+$/, "");
  const arrayBuffer = await file.arrayBuffer();
  const originalPdf = await PDFDocument.load(arrayBuffer);
  const totalPages = originalPdf.getPageCount();
  const mode = document.querySelector('input[name="mode"]:checked').value;

  if (mode === "manual") {
    if (!rangeInput.value) return alert("Please enter at least one range.");
    const ranges = rangeInput.value.split(",").map((r) => r.trim());

    for (const range of ranges) {
      if (!range) continue;
      let start, end;
      if (range.includes("-"))
        [start, end] = range.split("-").map((n) => parseInt(n.trim(), 10));
      else start = end = parseInt(range, 10);

      if (
        isNaN(start) ||
        isNaN(end) ||
        start < 1 ||
        end > totalPages ||
        start > end
      ) {
        console.warn(`Skipping invalid range: ${range}`);
        continue;
      }

      const newPdf = await PDFDocument.create();
      for (let p = start - 1; p < end; p++) {
        const [copiedPage] = await newPdf.copyPages(originalPdf, [p]);
        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(
        new Blob([pdfBytes], { type: "application/pdf" })
      );
      link.download = `${originalName}-part-${start}-${end}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  } else if (mode === "auto") {
    const partCount = parseInt(document.getElementById("partCount").value, 10);
    if (isNaN(partCount) || partCount < 2)
      return alert("Enter a valid number of parts (>=2).");

    const pagesPerPart = Math.ceil(totalPages / partCount);
    let start = 1;

    for (let i = 1; i <= partCount; i++) {
      const end = Math.min(start + pagesPerPart - 1, totalPages);
      const newPdf = await PDFDocument.create();
      for (let p = start - 1; p < end; p++) {
        const [copiedPage] = await newPdf.copyPages(originalPdf, [p]);
        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(
        new Blob([pdfBytes], { type: "application/pdf" })
      );
      link.download = `${originalName}-part-${i}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);

      start = end + 1;
      if (start > totalPages) break;
    }
  }

  alert("PDF split completed!");
});

// -------------------- Initialize --------------------

function logErrorDetails({ message, source, lineno, colno, error }) {
  console.group("🚨 JavaScript Error");
  console.error("Message:", message);
  console.error("Source:", source);
  console.error("Line:", lineno);
  console.error("Column:", colno);
  console.error("Error object:", error);
  console.groupEnd();
}
window.addEventListener("error", (event) => {
  const { message, filename: source, lineno, colno, error } = event;
  logErrorDetails({ message, source, lineno, colno, error });
  let humanMessage = "An error was found.";
  if (typeof message === "string") {
    const msg = message.trim();
    if (/is not defined/i.test(msg)) {
      const match = msg.match(/(\w+)\s+is\s+not\s+defined/i);
      if (match)
        humanMessage = `An error found: The variable or function \`${match[1]}\` is not defined (line ${lineno}).`;
    } else if (/is not a function/i.test(msg)) {
      const match = msg.match(/(\w+)\s+is\s+not\s+a\s+function/i);
      if (match)
        humanMessage = `An error found: \`${match[1]}\` was called as a function, but it isn’t one (line ${lineno}).`;
    } else if (/cannot read property/i.test(msg)) {
      const match = msg.match(/Cannot read property '([^']+)' of (.+)/i);
      if (match)
        humanMessage = `An error found: Tried to access property \`${match[1]}\` of ${match[2]}, which is invalid (line ${lineno}).`;
    } else if (/unexpected token/i.test(msg)) {
      const match = msg.match(/Unexpected token (\S+)/i);
      humanMessage = `An error found: Syntax error — unexpected token \`${
        match ? match[1] : ""
      }\` (line ${lineno}).`;
    } else if (/JSON/.test(msg) && /parse/i.test(msg)) {
      humanMessage = `An error found: Invalid JSON format — the data could not be parsed (line ${lineno}).`;
    } else if (/well.?formed/i.test(msg) || /malformed/i.test(msg)) {
      humanMessage = `An error found: ${msg.replace(
        /Error:\s*/i,
        ""
      )} (line ${lineno}).`;
    } else {
      humanMessage = `An error found: ${msg.replace(
        /^Uncaught\s*/i,
        ""
      )} (line ${lineno}).`;
    }
  }
  alert(`${humanMessage}\n\nSee console for more details.`);
  popupevent.preventDefault();
});
window.addEventListener("unhandledrejection", (event) => {
  console.group("🚨 Unhandled Promise Rejection");
  console.error(event.reason);
  console.groupEnd();
  alert("A promise error occurred. See console for details.");
});
