const transparentBgCheckbox = document.getElementById("transparentBg");
const fileInput = document.getElementById("fileInput");
const fileInputLabel = document.getElementById("fileInputLabel");
const conversionSelect = document.getElementById("outputDiv");
const convertBtn = document.getElementById("convertBtn");
const resultDiv = document.getElementById("result");
const qualityInput = document.getElementById("quality");
const qualityValue = document.getElementById("quality-value");
const progressBar = document.getElementById("progressBar");

const sharedCanvas = document.createElement("canvas");
const sharedCtx = sharedCanvas.getContext("2d");
let activeObjectUrl = null;

// Update controls on load
window.onload = () => {
  updateControls();
  fileInputLabel.textContent =
    fileInput.files.length > 0 ? fileInput.files[0].name : "Select File";
};

// Update transparency & quality based on format
function updateControls() {
  const val = conversionSelect.value;

  // Transparent background only disabled for JPEG
  transparentBgCheckbox.disabled = val === "output-jpeg";
  transparentBgCheckbox.style.opacity = val === "output-jpeg" ? 0.5 : 1;

  // Quality slider enabled for JPEG, WebP, AVIF, and GIF
  const supported = ["output-jpeg", "output-webp", "output-gif"];
  qualityInput.disabled = !supported.includes(val);
  qualityInput.style.opacity = supported.includes(val) ? "1" : "0.5";
}

conversionSelect.addEventListener("change", updateControls);
qualityInput.addEventListener("input", () => {
  qualityValue.textContent = qualityInput.value;
});

// File input UI
fileInput.addEventListener("change", () => {
  fileInputLabel.textContent =
    fileInput.files.length > 0 ? fileInput.files[0].name : "Select File";
});

// Drag & Drop
const overlay = document.getElementById("overlay");

document.addEventListener("dragover", (e) => {
  e.preventDefault();
  overlay.style.display = "flex";
});
overlay.addEventListener("dragleave", (e) => {
  overlay.style.display = "none";
});
overlay.addEventListener("drop", (e) => {
  e.preventDefault();
  overlay.style.display = "none";
  fileInput.files = e.dataTransfer.files;
  fileInputLabel.textContent = fileInput.files[0].name;
});

// Convert button
convertBtn.addEventListener("click", () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please select a file!");
  const type = conversionSelect.value;
  resultDiv.innerHTML = "";
  convertImage(file, getMime(type), getExt(type));
});

// MIME type mapping
function getMime(type) {
  switch (type) {
    case "output-pdf":
      return "application/pdf";
    case "output-jpeg":
      return "image/jpeg";
    case "output-png":
      return "image/png";
    case "output-webp":
      return "image/webp";
    case "output-svg":
      return "image/svg+xml";
    case "output-avif":
      return "image/avif";
    case "output-html":
      return "text/html";
    case "output-gif":
      return "image/gif";
    case "output-bmp":
      return "image/bmp";
    case "output-utif":
      return "image/tiff";
    case "output-canvas":
      return "text/html";
    case "output-base64":
      return "application/octet-stream";
    case "output-heic":
      return "image/heif";
    case "output-ico":
      return "image/x-icon";
    case "output-svg2":
      return "image/svg+xml";
    case "output-xml":
      return "text/xml";
    case "output-json":
      return "text/json";
    case "output-dds":
      return "image/vnd-ms.dds";
    case "output-flif":
      return "image/flif";
    case "output-tga":
      return "image/x-tga";
    case "output-qoi":
      return "image/qoi";
    case "output-vml":
      return "application/vnd.ms-vml";
    case "output-tsv":
      return "text/tab-separated-values";
    case "output-dxf":
      return "image/vnd.dxf";

    default:
      return "unknown";
  }
}

// File extension mapping
function getExt(type) {
  switch (type) {
    case "output-jpeg":
      return "jpeg";
    case "output-png":
      return "png";
    case "output-webp":
      return "webp";
    case "output-svg":
      return "svg";
    case "output-avif":
      return "avif";
    case "output-html":
      return "html";
    case "output-gif":
      return "gif";
    case "output-pdf":
      return "pdf";
    case "output-bmp":
      return "bmp";
    case "output-utif":
      return "tif";
    case "output-canvas":
      return "html";
    case "output-base64":
      return "b64";
    case "output-heic":
      return "heic";
    case "output-rgb":
      return "rgb";
    case "output-rgba":
      return "rgba";
    case "output-ppm":
      return "ppm";
    case "output-pbm":
      return "pbm";
    case "output-pgm":
      return "pgm";
    case "output-ico":
      return "ico";
    case "output-svg2":
      return "svg2";
    case "output-xml":
      return "xml";
    case "output-json":
      return "json";
    case "output-dds":
      return "dds";
    case "output-flif":
      return "flif";
    case "output-tga":
      return "tga";
    case "output-qoi":
      return "qoi";
    case "output-vml":
      return "vml";
    case "output-tsv":
      return "tsv";
    case "output-dxf":
      return "dxf";
    default:
      return "unknown";
  }
}
// Convert Image Function
async function convertImage(file, mimeType, ext) {
  if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);

  progressBar.style.display = "block";
  progressBar.value = 0;
  const reader = new FileReader();
  let arrayBuffer;
  // === HEIF/HEIC DECODING ===
  if (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  ) {
    try {
      progressBar.style.display = "block";
      progressBar.value = 10;

      // Convert HEIC → Blob (PNG by default)
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/png",
        quality: parseFloat(qualityInput.value),
      });

      progressBar.value = 50;

      // Create an object URL from the converted blob
      const objectUrl = URL.createObjectURL(convertedBlob);
      const img = new Image();

      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;

        const useTransparent = transparentBgCheckbox.checked;
        if (!useTransparent) {
          sharedCtx.fillStyle = "#ffffff";
          sharedCtx.fillRect(0, 0, img.width, img.height);
        } else {
          sharedCtx.clearRect(0, 0, img.width, img.height);
        }

        sharedCtx.drawImage(img, 0, 0);
        const pngDataUrl = sharedCanvas.toDataURL("image/png");

        const originalName = file.name.replace(/\.[^/.]+$/, "");
        resultDiv.innerHTML = `
          <img src="${pngDataUrl}" alt="Converted HEIF"/>
          <br/>
          <a href="${pngDataUrl}" download="${originalName}.png">Download PNG</a>
        `;
        progressBar.style.display = "none";
        URL.revokeObjectURL(objectUrl);
      };

      img.onerror = () => {
        alert("Failed to load converted HEIF image.");
        progressBar.style.display = "none";
        URL.revokeObjectURL(objectUrl);
      };

      img.src = objectUrl;
      return;
    } catch (err) {
      console.error("HEIF/HEIC conversion failed:", err);
      alert("Failed to decode HEIF/HEIC image.");
      progressBar.style.display = "none";
      return;
    }
  }
  if (mimeType === "image/heif" || mimeType === "image/heic") {
    progressBar.style.display = "block";
    progressBar.value = 10;

    try {
      if (!heifModule) {
        alert(
          "libheif-js not yet initialized. Please wait a few seconds and try again."
        );
        progressBar.style.display = "none";
        return;
      }

      // Get RGBA data from canvas
      const imageData = sharedCtx.getImageData(
        0,
        0,
        sharedCanvas.width,
        sharedCanvas.height
      );
      const { data: rgba, width, height } = imageData;

      // === Create HEIF context ===
      const ctx = new heifModule.HeifContext();

      // === Create image handle with RGB (discard alpha like TIFF) ===
      const img = ctx.createImage(
        width,
        height,
        heifModule.Colorspace.RGB, // RGB instead of RGBA
        heifModule.Chroma.INTERLEAVED_RGB // interleaved RGB planes
      );

      // === Fill the RGB image with pixel data ===
      const plane = img.getPlane(heifModule.Channel.INTERLEAVED);

      // Copy RGBA -> RGB (drop alpha)
      for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
        plane[j] = rgba[i]; // R
        plane[j + 1] = rgba[i + 1]; // G
        plane[j + 2] = rgba[i + 2]; // B
        // Alpha is discarded
      }

      // === Add image to context ===
      ctx.addImage(img);

      // === Encode using HEVC (HEIC) ===
      const encoder = ctx.getEncoder("hevc");
      encoder.setLossyQuality(parseInt(qualityInput.value * 100)); // 0–100
      ctx.encodeImage(img, encoder);

      // === Write HEIF buffer ===
      const heifBuffer = ctx.write();
      const blob = new Blob([heifBuffer], { type: "image/heif" });
      const url = URL.createObjectURL(blob);
      const originalName = file.name.replace(/\.[^/.]+$/, "");

      resultDiv.innerHTML = `
        <img src="${sharedCanvas.toDataURL("image/png")}" alt="HEIF Preview" />
        <br/>
        <a href="${url}" download="${originalName}.heic">Download HEIC</a>
      `;

      progressBar.value = 100;
      progressBar.style.display = "none";
      return;
    } catch (err) {
      console.error("HEIF encoding failed:", err);
      alert("HEIF encoding failed: " + err.message);
      progressBar.style.display = "none";
      return;
    }
  }

  if (file.type === "image/tiff" || file.name.toLowerCase().endsWith(".tif")) {
    const arrayBuffer = await file.arrayBuffer();
    const ifds = UTIF.decode(arrayBuffer);
    UTIF.decodeImages(arrayBuffer, ifds);
    const rgba = UTIF.toRGBA8(ifds[0]);

    sharedCanvas.width = ifds[0].width;
    sharedCanvas.height = ifds[0].height;
    const imageData = new ImageData(
      new Uint8ClampedArray(rgba.buffer),
      ifds[0].width,
      ifds[0].height
    );
    sharedCtx.putImageData(imageData, 0, 0);

    const img = new Image();
    img.onload = () => {
      // Inline your conversion pipeline here
      sharedCanvas.width = img.width;
      sharedCanvas.height = img.height;

      const useTransparent = transparentBgCheckbox.checked;
      if (!useTransparent) {
        sharedCtx.fillStyle = "#ffffff";
        sharedCtx.fillRect(0, 0, img.width, img.height);
      } else {
        sharedCtx.clearRect(0, 0, img.width, img.height);
      }

      sharedCtx.drawImage(img, 0, 0);
    };

    img.onerror = () => {
      alert("Failed to load decoded TIFF image.");
      progressBar.style.display = "none";
    };

    img.src = sharedCanvas.toDataURL("image/png");

    return; // stop further execution for TIFF
  }

  reader.onprogress = (event) => {
    if (event.lengthComputable) {
      progressBar.value = (event.loaded / event.total) * 100;
    }
  };

  reader.onload = async () => {
    progressBar.value = 100;
    // VML Encoding

    if (ext === "vml") {
      try {
        const { svgString } = await convertToVectorSVG(file, {
          ltres: 1,
          qtres: 1,
          pathomit: 8,
          numberofcolors: 32,
        });

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(svgString, "image/svg+xml");
        const paths = xmlDoc.querySelectorAll("path");

        let vml = `<xml xmlns:v="urn:schemas-microsoft-com:vml">\n`;
        paths.forEach((path, i) => {
          const d = path.getAttribute("d");
          vml += `<v:shape id="path${i}" coordorigin="0,0" coordsize="1000,1000" path="${d}" stroked="true" fillcolor="none" />\n`;
        });
        vml += `</xml>`;

        const blob = new Blob([vml], { type: "application/vnd.ms-vml" });
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");

        resultDiv.innerHTML = `
          <textarea readonly style="width:100%; height:200px; background:#000; color:#0ff; border:2px solid #0ff; border-radius:10px; resize:none;">
    ${vml}
          </textarea>
          <br/>
          <a href="${url}" download="${originalName}.vml">Download VML</a>
        `;
      } catch (err) {
        alert("VML conversion failed.");
        console.error(err);
      }
      progressBar.style.display = "none";
      return;
    }
    // XML creation
    if (ext === "dds") {
      const img = new Image();
      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;

        if (transparentBgCheckbox.checked)
          sharedCtx.clearRect(0, 0, img.width, img.height);
        else {
          sharedCtx.fillStyle = "#fff";
          sharedCtx.fillRect(0, 0, img.width, img.height);
        }

        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const blob = encodeDDS(imageData);
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const preview = sharedCanvas.toDataURL("image/png");

        resultDiv.innerHTML = `
          <img src="${preview}" /><br>
          <a href="${url}" download="${originalName}.dds">Download DDS</a>
        `;
        progressBar.style.display = "none";
      };
      img.src = reader.result;
      return;
    }

    // === TSV Output ===
    if (ext === "tsv") {
      const img = new Image();
      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        sharedCtx.drawImage(img, 0, 0);

        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const { data, width, height } = imageData;

        // Convert pixel data to TSV (R G B per cell)
        let tsv = "";
        for (let y = 0; y < height; y++) {
          let row = [];
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            row.push(`${data[i]}\t${data[i + 1]}\t${data[i + 2]}`); // R G B
          }
          tsv += row.join("\t") + "\n";
        }

        const blob = new Blob([tsv], { type: "text/tab-separated-values" });
        const url = URL.createObjectURL(blob);

        resultDiv.innerHTML = `
          <textarea readonly style="width:100%; height:200px; background:#000; color:#0ff; border:2px solid #0ff; border-radius:10px; resize: none;">${tsv}</textarea>
          <br/>
          <a href="${url}" download="${originalName}.tsv">Download TSV</a>
        `;
        progressBar.style.display = "none";
      };
      img.src = reader.result;
      return;
    }
    if (ext === "flif") {
      const img = new Image();
      img.onload = async () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;

        if (transparentBgCheckbox.checked)
          sharedCtx.clearRect(0, 0, img.width, img.height);
        else {
          sharedCtx.fillStyle = "#fff";
          sharedCtx.fillRect(0, 0, img.width, img.height);
        }

        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const blob = await encodeFLIF(imageData); // async PNG wrap
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const preview = sharedCanvas.toDataURL("image/png");

        resultDiv.innerHTML = `
          <img src="${preview}" /><br>
          <a href="${url}" download="${originalName}.flif">Download FLIF</a>
        `;
        progressBar.style.display = "none";
      };
      img.src = reader.result;
      return;
    }
    if (ext === "tga") {
      const img = new Image();
      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;

        if (transparentBgCheckbox.checked)
          sharedCtx.clearRect(0, 0, img.width, img.height);
        else {
          sharedCtx.fillStyle = "#fff";
          sharedCtx.fillRect(0, 0, img.width, img.height);
        }

        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const blob = encodeTGA(imageData);
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const preview = sharedCanvas.toDataURL("image/png");

        resultDiv.innerHTML = `
          <img src="${preview}" /><br>
          <a href="${url}" download="${originalName}.tga">Download TGA</a>
        `;
        progressBar.style.display = "none";
      };
      img.src = reader.result;
      return;
    }
    if (ext === "qoi") {
      const img = new Image();
      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;

        if (transparentBgCheckbox.checked)
          sharedCtx.clearRect(0, 0, img.width, img.height);
        else {
          sharedCtx.fillStyle = "#fff";
          sharedCtx.fillRect(0, 0, img.width, img.height);
        }

        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const blob = encodeQOI(imageData);
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const preview = sharedCanvas.toDataURL("image/png");

        resultDiv.innerHTML = `
          <img src="${preview}" /><br>
          <a href="${url}" download="${originalName}.qoi">Download QOI</a>
        `;
        progressBar.style.display = "none";
      };
      img.src = reader.result;
      return;
    }

    if (ext === "xml") {
      try {
        const { svgString, url } = await convertToVectorSVG(file, {
          ltres: 1,
          qtres: 1,
          pathomit: 8,
          numberofcolors: 32,
        });
        const originalName = file.name.replace(/\.[^/.]+$/, "");

        // Escape special characters if needed (optional, if you want to be safe)
        const escapedSvg = svgString
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        resultDiv.innerHTML = `
      <textarea readonly style="width:100%; height:200px; background:#000; color:#0ff; border:2px solid #0ff; border-radius:10px; resize: none;">
${svgString}
      </textarea>
      <br/>
      <a href="${url}" download="${originalName}.xml">Download XML</a>
    `;
      } catch (err) {
        alert("SVG conversion failed. Image may be too large or unsupported.");
        console.error(err);
      }
      progressBar.style.display = "none";
      return;
    }

    // === SVG Vectorization ===
    if (ext === "svg") {
      try {
        const { svgString, url } = await convertToVectorSVG(file, {
          ltres: 1,
          qtres: 1,
          pathomit: 8,
          numberofcolors: 32,
        });
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        resultDiv.innerHTML = `
                                      <img src="${url}" alt="Converted SVG" />
                                      <br/>
                                      <a href="${url}"
                                     download="${originalName}.svg">Download SVG</a>
                                    `;
      } catch (err) {
        alert("SVG conversion failed. Image may be too large or unsupported.");
        console.error(err);
      }
      progressBar.style.display = "none";
      return;
    }
    if (ext === "svg2") {
      const img = new Image();
      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;
        const useTransparent = transparentBgCheckbox.checked;

        if (!useTransparent) {
          sharedCtx.fillStyle = "#ffffff"; // white background
          sharedCtx.fillRect(0, 0, img.width, img.height);
        } else {
          sharedCtx.clearRect(0, 0, img.width, img.height); // keep alpha
        }
        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const blob = encodeBMP(imageData);
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const dataURL = sharedCanvas.toDataURL("image/svg+xml");
        resultDiv.innerHTML = `
        <img src="${dataURL}"/> <br>
          <a href="${dataURL}" download="${originalName}.svg">Download SVG</a>
        `;
        progressBar.style.display = "none";
      };

      img.src = reader.result;
      return;
    }
    if (ext === "bmp") {
      const img = new Image();
      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;
        const useTransparent = transparentBgCheckbox.checked;

        if (!useTransparent) {
          sharedCtx.fillStyle = "#ffffff"; // white background
          sharedCtx.fillRect(0, 0, img.width, img.height);
        } else {
          sharedCtx.clearRect(0, 0, img.width, img.height); // keep alpha
        }
        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const blob = encodeBMP(imageData);
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const dataURL = sharedCanvas.toDataURL("image/png");
        resultDiv.innerHTML = `
        <img src="${dataURL}"/> <br>
          <a href="${url}" download="${originalName}.bmp">Download BMP</a>
        `;
        progressBar.style.display = "none";
      };

      img.src = reader.result;
      return;
    }
    if (ext === "ico") {
      const img = new Image();
      img.onload = async () => {
        // make this async
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;
        const useTransparent = transparentBgCheckbox.checked;

        if (!useTransparent) {
          sharedCtx.fillStyle = "#ffffff"; // white background
          sharedCtx.fillRect(0, 0, img.width, img.height);
        } else {
          sharedCtx.clearRect(0, 0, img.width, img.height); // keep alpha
        }

        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);

        // await the async ICO encoder
        const blob = await encodeICO(imageData);
        const url = URL.createObjectURL(blob);

        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const dataURL = sharedCanvas.toDataURL("image/png");

        resultDiv.innerHTML = `
          <img src="${dataURL}"/> <br>
          <a href="${url}" download="${originalName}.ico">Download ICO</a>
        `;

        progressBar.style.display = "none";
      };

      img.src = reader.result;
      return;
    }

    if (ext === "avif") {
      const img = new Image();
      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;
        const useTransparent = transparentBgCheckbox.checked;

        if (!useTransparent) {
          sharedCtx.fillStyle = "#ffffff"; // white background
          sharedCtx.fillRect(0, 0, img.width, img.height);
        } else {
          sharedCtx.clearRect(0, 0, img.width, img.height); // keep alpha
        }
        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const blob = encodeAVIF(imageData);
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const dataURL = sharedCanvas.toDataURL("image/avif");
        resultDiv.innerHTML = `
        <img src="${dataURL}"/> <br>          <a href="${url}" download="${originalName}.tif">Download AVIF</a>
        `;
        progressBar.style.display = "none";
      };

      img.src = reader.result;
      return;
    }
    if (ext === "json") {
      try {
        const { svgString, url } = await convertToVectorSVG(file, {
          ltres: 1,
          qtres: 1,
          pathomit: 8,
          numberofcolors: 32,
        });
        const originalName = file.name.replace(/\.[^/.]+$/, "");

        // Convert XML to JSON using DOMParser
        function xmlToJson(xml) {
          const obj = {};
          if (xml.nodeType === 1) {
            // element
            if (xml.attributes.length > 0) {
              obj["@attributes"] = {};
              for (let j = 0; j < xml.attributes.length; j++) {
                const attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
              }
            }
          } else if (xml.nodeType === 3) {
            // text
            return xml.nodeValue.trim();
          }

          // Process child nodes
          if (xml.hasChildNodes()) {
            for (let i = 0; i < xml.childNodes.length; i++) {
              const item = xml.childNodes.item(i);
              const nodeName = item.nodeName;
              const value = xmlToJson(item);
              if (value) {
                if (obj[nodeName] === undefined) {
                  obj[nodeName] = value;
                } else {
                  if (!Array.isArray(obj[nodeName])) {
                    obj[nodeName] = [obj[nodeName]];
                  }
                  obj[nodeName].push(value);
                }
              }
            }
          }
          return obj;
        }

        // Parse the SVG string into XML DOM
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(svgString, "application/xml");
        const jsonObj = xmlToJson(xmlDoc);
        const jsonString = JSON.stringify(jsonObj, null, 2); // pretty print JSON

        resultDiv.innerHTML = `
      <textarea readonly style="width:100%; height:200px; background:#000; color:#0ff; border:2px solid #0ff; border-radius:10px; resize: none;">
${jsonString}
      </textarea>
      <br/>
      <a href="data:application/json;charset=utf-8,${encodeURIComponent(
        jsonString
      )}"
         download="${originalName}.json">Download JSON</a>
    `;
      } catch (err) {
        alert("SVG conversion failed. Image may be too large or unsupported.");
        console.error(err);
      }
      progressBar.style.display = "none";
      return;
    }

    if (ext === "tif") {
      const img = new Image();
      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;
        const useTransparent = transparentBgCheckbox.checked;

        if (!useTransparent) {
          sharedCtx.fillStyle = "#ffffff"; // white background
          sharedCtx.fillRect(0, 0, img.width, img.height);
        } else {
          sharedCtx.clearRect(0, 0, img.width, img.height); // keep alpha
        }
        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const blob = encodeTIFF(imageData);
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const dataURL = sharedCanvas.toDataURL("image/png");
        resultDiv.innerHTML = `
        <img src="${dataURL}"/> <br>          <a href="${url}" download="${originalName}.tif">Download TIFF</a>
        `;
        progressBar.style.display = "none";
      };

      img.src = reader.result;
      return;
    }
    if (ext === "rgb") {
      const img = new Image();
      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;
        const useTransparent = transparentBgCheckbox.checked;

        if (!useTransparent) {
          sharedCtx.fillStyle = "#ffffff"; // white background
          sharedCtx.fillRect(0, 0, img.width, img.height);
        } else {
          sharedCtx.clearRect(0, 0, img.width, img.height); // keep alpha
        }
        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const blob = encodeRGB(imageData);
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const dataURL = sharedCanvas.toDataURL("image/png");
        resultDiv.innerHTML = `
        <img src="${url}" alt="No Preview"/> <br/>
          <a href="${url}" download="${originalName}.rgb">Download RGB</a>
        `;
        progressBar.style.display = "none";
      };

      img.src = reader.result;
      return;
    }
    if (ext === "rgba") {
      const img = new Image();
      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;
        const useTransparent = transparentBgCheckbox.checked;

        if (!useTransparent) {
          sharedCtx.fillStyle = "#ffffff"; // white background
          sharedCtx.fillRect(0, 0, img.width, img.height);
        } else {
          sharedCtx.clearRect(0, 0, img.width, img.height); // keep alpha
        }
        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const blob = encodeRGB(imageData);
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const dataURL = sharedCanvas.toDataURL("image/png");
        resultDiv.innerHTML = `
        <img src="${url}" alt="No Preview"/> <br/>
          <a href="${url}" download="${originalName}.rgba">Download RGBA</a>
        `;
        progressBar.style.display = "none";
      };

      img.src = reader.result;
      return;
    }
    if (ext === "ppm") {
      const img = new Image();
      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;
        const useTransparent = transparentBgCheckbox.checked;

        if (!useTransparent) {
          sharedCtx.fillStyle = "#ffffff"; // white background
          sharedCtx.fillRect(0, 0, img.width, img.height);
        } else {
          sharedCtx.clearRect(0, 0, img.width, img.height); // keep alpha
        }
        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const blob = encodePPM(imageData);
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const dataURL = sharedCanvas.toDataURL("image/png");
        resultDiv.innerHTML = `
        <img src="${url}" alt="No Preview"/> <br/>
          <a href="${url}" download="${originalName}.ppm">Download PPM</a>
        `;
        progressBar.style.display = "none";
      };

      img.src = reader.result;
      return;
    }
    if (ext === "pgm") {
      const img = new Image();
      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;
        const useTransparent = transparentBgCheckbox.checked;

        if (!useTransparent) {
          sharedCtx.fillStyle = "#ffffff"; // white background
          sharedCtx.fillRect(0, 0, img.width, img.height);
        } else {
          sharedCtx.clearRect(0, 0, img.width, img.height); // keep alpha
        }
        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const blob = encodePGM(imageData);
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const dataURL = sharedCanvas.toDataURL("image/png");
        resultDiv.innerHTML = `
        <img src="${url}" alt="No Preview"/> <br/>
          <a href="${url}" download="${originalName}.pgm">Download PGM</a>
        `;
        progressBar.style.display = "none";
      };

      img.src = reader.result;
      return;
    }
    if (ext === "pbm") {
      const img = new Image();
      img.onload = () => {
        sharedCanvas.width = img.width;
        sharedCanvas.height = img.height;
        const useTransparent = transparentBgCheckbox.checked;

        if (!useTransparent) {
          sharedCtx.fillStyle = "#ffffff"; // white background
          sharedCtx.fillRect(0, 0, img.width, img.height);
        } else {
          sharedCtx.clearRect(0, 0, img.width, img.height); // keep alpha
        }
        sharedCtx.drawImage(img, 0, 0);
        const imageData = sharedCtx.getImageData(0, 0, img.width, img.height);
        const blob = encodePBM(imageData);
        const url = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const dataURL = sharedCanvas.toDataURL("image/png");
        resultDiv.innerHTML = `
        <img src="${url}" alt="No Preview"/> <br/>
          <a href="${url}" download="${originalName}.pbm">Download PBM</a>
        `;
        progressBar.style.display = "none";
      };

      img.src = reader.result;
      return;
    }
    const img = new Image();

    img.onload = () => {
      const useTransparent = transparentBgCheckbox.checked;
      sharedCanvas.width = img.width;
      sharedCanvas.height = img.height;

      if (mimeType === "image/jpeg" || !useTransparent) {
        sharedCtx.fillStyle = "#ffffff";
        sharedCtx.fillRect(0, 0, sharedCanvas.width, sharedCanvas.height);
      } else {
        sharedCtx.clearRect(0, 0, sharedCanvas.width, sharedCanvas.height);
      }
      sharedCtx.drawImage(img, 0, 0);

      (async () => {
        if (ext === "pdf") {
          const pdfDoc = await PDFLib.PDFDocument.create();
          const pngBytes = await fetch(
            sharedCanvas.toDataURL("image/png")
          ).then((r) => r.arrayBuffer());
          const pngImage = await pdfDoc.embedPng(pngBytes);
          const page = pdfDoc.addPage([img.width, img.height]);
          page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
          });
          const pdfBytes = await pdfDoc.save();
          const url = URL.createObjectURL(
            new Blob([pdfBytes], { type: "application/pdf" })
          );
          const originalName = file.name.replace(/\.[^/.]+$/, "");
          resultDiv.innerHTML = `
        <iframe src="${url}" style="width:100%; height:320px; border:2px solid #00fff7; border-radius:12px;"></iframe>
        <br/>
        <a href="${url}" download="${originalName}.pdf">Download PDF</a>
      `;
          progressBar.style.display = "none";
          return;
        }
      })();
      // === GIF Output === \\
      if (mimeType === "image/gif") {
        // Map slider 0–1 to GIF.js quality 1–30 (invert: lower = better)
        const gifQuality = Math.max(
          1,
          Math.round((1 - parseFloat(qualityInput.value)) * 29 + 1)
        );
        const gif = new GIF({
          workers: 6,
          quality: gifQuality,
          width: img.width,
          height: img.height,
          transparent: transparentBgCheckbox.checked ? 0x00000000 : null,
          workerScript: "assets/gif.worker.js",
        });

        gif.addFrame(img, { delay: 500 });
        gif.on("finished", (blob) => {
          const url = URL.createObjectURL(blob);
          const originalName = file.name.replace(/\.[^/.]+$/, "");
          resultDiv.innerHTML = `
                            <img src="${url}" alt="Converted GIF" />
                            <br/>
                            <a href="${url}" download="${originalName}.gif">Download GIF</a>
                          `;
          progressBar.style.display = "none";
        });
        gif.on("progress", (p) => {
          progressBar.value = p * 100;
        });

        gif.render();
        return;
      }

      // === HTML Output ===
      if (mimeType === "text/html") {
        const isCanvasOutput = conversionSelect.value === "output-canvas";
        const dataUrl = sharedCanvas.toDataURL(
          "image/png",
          parseFloat(qualityInput.value)
        );
        const originalName = file.name.replace(/\.[^/.]+$/, "");

        let htmlContent;

        if (isCanvasOutput) {
          // 🟦 Output HTML page with <canvas> drawing the image
          htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Canvas Image</title>
  <style>
  canvas {
    border: 2px solid #00fff7;
    box-shadow: 0 0 20px #00fff7;
  
    max-width: 100vw;  /* max width is viewport width */
    max-height: 100vw; /*Max height is viewport width*/
    height: auto;      /* maintain aspect ratio */
    width: auto;       /* prevent distortion */
    display: block;
    margin: 0 auto;
  }
  
    body {
      margin: 0;
      background: ${useTransparent ? "transparent" : "black"};
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    canvas {
      border: 2px solid #00fff7;
      box-shadow: 0 0 20px #00fff7;
    }
  </style>
</head>
<body>
  <canvas id="imageCanvas" width="${img.width}" height="${img.height}"></canvas>
  <script>
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
    img.src = '${dataUrl}';
  </script>
</body>
</html>
`;
        } else {
          // 🟩 Output HTML page with <img> tag
          htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Converted Image</title>
  <style>
    body {
      background: ${useTransparent ? "transparent" : "#0f0f20"};
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    img {
      max-width: 100%;
      max-height: 100%;
      border: 2px solid #00fff7;
      box-shadow: 0 0 20px #00fff7;
    }
  </style>
</head>
<body>
  <img src="${dataUrl}" alt="Converted Image"/>
</body>
</html>
`;
        }

        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        resultDiv.innerHTML = `
<iframe src="${url}" style="width:100%; height:320px; border:2px solid #00fff7; border-radius:12px;"></iframe>
<br/>
<a href="${url}" download="${originalName}-${
          isCanvasOutput ? "canvas" : "image"
        }.html">
Download ${isCanvasOutput ? "Canvas" : "HTML"}
</a>
`;

        progressBar.style.display = "none";
        return;
      }
      // === Other Raster Formats ===
      const convertedUrl = sharedCanvas.toDataURL(
        mimeType,
        parseFloat(qualityInput.value)
      );
      const originalName = file.name.replace(/\.[^/.]+$/, "");
      if (ext === "b64") {
        const actualMime = sharedCanvas
          .toDataURL()
          .split(",")[0]
          .split(":")[1]
          .split(";")[0];
        const dataUrl = sharedCanvas.toDataURL(
          actualMime,
          parseFloat(qualityInput.value)
        );
        const base64Data = dataUrl.split(",")[1];

        // Convert Base64 to binary
        const binary = atob(base64Data);
        const len = binary.length;
        const buffer = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          buffer[i] = binary.charCodeAt(i);
        }

        // Create a Blob from the binary data
        const blob = new Blob([base64Data], {
          type: "application/octet-stream",
        });
        const blobUrl = URL.createObjectURL(blob);
        const originalName = file.name.replace(/\.[^/.]+$/, "");

        resultDiv.innerHTML = `
          <textarea readonly style="width:100%; height:200px; background:#000; color:#0ff; border:2px solid #0ff; border-radius:10px; resize: none;">
      ${base64Data}
          </textarea>
          <br/>
          <a href="${blobUrl}" download="${originalName}.${getExt(
          conversionSelect.value
        )}">
            Download ${getExt(conversionSelect.value).toUpperCase()}
          </a>
        `;
        progressBar.style.display = "none";
        return;
      }

      resultDiv.innerHTML = `
                                    <img src="${convertedUrl}" alt="Converted ${ext.toUpperCase()}" />
                                    <br/>
                                    <a href="${convertedUrl}" download="${originalName}.${ext}">Download ${ext.toUpperCase()}</a>
                                  `;
      progressBar.style.display = "none";
    };

    img.onerror = () => {
      alert("Failed to load image.");
      progressBar.style.display = "none";
    };

    img.src = reader.result;
  };

  reader.onerror = () => {
    alert("Failed to read file.");
    progressBar.style.display = "none";
  };

  reader.readAsDataURL(file);
}
function encodeTIFF(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const rgba = imageData.data;

  // TIFF header: 8 bytes
  const header = new ArrayBuffer(8);
  const dv = new DataView(header);
  dv.setUint8(0, 0x49); // II = little-endian
  dv.setUint8(1, 0x49);
  dv.setUint16(2, 42, true); // Magic number
  dv.setUint32(4, 8, true); // Offset to first IFD

  // BitsPerSample array: 4 channels (R,G,B,A)
  const bits = new Uint16Array([8, 8, 8, 8]);

  // IFD: 8 tags
  const numTags = 8;
  const ifdSize = 2 + numTags * 12 + 4;
  const ifd = new ArrayBuffer(ifdSize);
  const ifdv = new DataView(ifd);
  ifdv.setUint16(0, numTags, true);

  let offset = 2;
  const bitsOffset = header.byteLength + ifd.byteLength; // bits array after IFD
  const pixelOffset = bitsOffset + bits.byteLength; // pixel data after bits array

  function addTag(tag, type, count, valueOrOffset) {
    ifdv.setUint16(offset, tag, true);
    ifdv.setUint16(offset + 2, type, true);
    ifdv.setUint32(offset + 4, count, true);
    ifdv.setUint32(offset + 8, valueOrOffset, true);
    offset += 12;
  }

  addTag(256, 4, 1, width); // ImageWidth
  addTag(257, 4, 1, height); // ImageLength
  addTag(258, 3, 4, bitsOffset); // BitsPerSample
  addTag(259, 3, 1, 1); // Compression = none
  addTag(262, 3, 1, 2); // Photometric = RGB
  addTag(273, 4, 1, pixelOffset); // StripOffsets
  addTag(277, 3, 1, 4); // SamplesPerPixel = 4 (RGBA)
  addTag(339, 3, 1, 1); // ExtraSamples = 1 (alpha)

  ifdv.setUint32(offset, 0, true); // next IFD = 0

  // Pixel data: RGBA interleaved
  const pixelData = new Uint8Array(rgba.length);
  pixelData.set(rgba);

  // Concatenate all buffers
  const tiffBuffer = new Uint8Array(
    header.byteLength + ifd.byteLength + bits.byteLength + pixelData.byteLength
  );
  tiffBuffer.set(new Uint8Array(header), 0);
  tiffBuffer.set(new Uint8Array(ifd), header.byteLength);
  tiffBuffer.set(
    new Uint8Array(bits.buffer),
    header.byteLength + ifd.byteLength
  );
  tiffBuffer.set(
    pixelData,
    header.byteLength + ifd.byteLength + bits.byteLength
  );

  return new Blob([tiffBuffer], { type: "image/tiff" });
}
function encodeAVIF(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const rgba = imageData.data;

  // TIFF header: 8 bytes
  const header = new ArrayBuffer(8);
  const dv = new DataView(header);
  dv.setUint8(0, 0x49); // II = little-endian
  dv.setUint8(1, 0x49);
  dv.setUint16(2, 42, true); // Magic number
  dv.setUint32(4, 8, true); // Offset to first IFD

  // BitsPerSample array: 4 channels (R,G,B,A)
  const bits = new Uint16Array([8, 8, 8, 8]);

  // IFD: 8 tags
  const numTags = 8;
  const ifdSize = 2 + numTags * 12 + 4;
  const ifd = new ArrayBuffer(ifdSize);
  const ifdv = new DataView(ifd);
  ifdv.setUint16(0, numTags, true);

  let offset = 2;
  const bitsOffset = header.byteLength + ifd.byteLength; // bits array after IFD
  const pixelOffset = bitsOffset + bits.byteLength; // pixel data after bits array

  function addTag(tag, type, count, valueOrOffset) {
    ifdv.setUint16(offset, tag, true);
    ifdv.setUint16(offset + 2, type, true);
    ifdv.setUint32(offset + 4, count, true);
    ifdv.setUint32(offset + 8, valueOrOffset, true);
    offset += 12;
  }

  addTag(256, 4, 1, width); // ImageWidth
  addTag(257, 4, 1, height); // ImageLength
  addTag(258, 3, 4, bitsOffset); // BitsPerSample
  addTag(259, 3, 1, 1); // Compression = none
  addTag(262, 3, 1, 2); // Photometric = RGB
  addTag(273, 4, 1, pixelOffset); // StripOffsets
  addTag(277, 3, 1, 4); // SamplesPerPixel = 4 (RGBA)
  addTag(339, 3, 1, 1); // ExtraSamples = 1 (alpha)

  ifdv.setUint32(offset, 0, true); // next IFD = 0

  // Pixel data: RGBA interleaved
  const pixelData = new Uint8Array(rgba.length);
  pixelData.set(rgba);

  // Concatenate all buffers
  const avifBuffer = new Uint8Array(
    header.byteLength + ifd.byteLength + bits.byteLength + pixelData.byteLength
  );
  avifBuffer.set(new Uint8Array(header), 0);
  avifBuffer.set(new Uint8Array(ifd), header.byteLength);
  avifBuffer.set(
    new Uint8Array(bits.buffer),
    header.byteLength + ifd.byteLength
  );
  avifBuffer.set(
    pixelData,
    header.byteLength + ifd.byteLength + bits.byteLength
  );

  return new Blob([avifBuffer], { type: "image/avif" });
}
/*
| Format           | File extension   | MIME type                  | Notes                                              |
| ---------------- | ---------------- | -------------------------- | -------------------------------------------------- |
| TIFF / TIF @      | `.tif` / `.tiff` | `image/tiff`               | Lossless RGBA, already in your code (`encodeTIFF`) |
| BMP @             | `.bmp`           | `image/bmp`                | Uncompressed RGB/RGBA (`encodeBMP`)                |
| PPM (color) @     | `.ppm`           | `image/x-portable-pixmap`  | ASCII or binary, simple RGB                        |
| PGM (grayscale) @ | `.pgm`           | `image/x-portable-graymap` | ASCII or binary, grayscale only                    |
| PBM (monochrome) @| `.pbm`           | `image/x-portable-bitmap`  | ASCII or binary, black/white only                  |
| RAW RGB          | `.rgb`           | `application/octet-stream` | Raw RGB bytes                                      |
| RAW RGBA         | `.rgba`          | `application/octet-stream` | Raw RGBA bytes                                     |
| GIF (static) @    | `.gif`           | `image/gif`                | Limited palette, transparency via GIF.js if needed |

*/

function encodeRGB(imageData) {
  const rgba = imageData.data;
  const rgb = new Uint8Array((rgba.length / 4) * 3);

  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i]; // R
    rgb[j + 1] = rgba[i + 1]; // G
    rgb[j + 2] = rgba[i + 2]; // B
  }

  return new Blob([rgb], { type: "application/octet-stream" });
}
function encodePPM(imageData) {
  const { width, height, data } = imageData;
  const header = `P6\n${width} ${height}\n255\n`;
  const rgb = new Uint8Array(width * height * 3);

  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    rgb[j] = data[i]; // R
    rgb[j + 1] = data[i + 1]; // G
    rgb[j + 2] = data[i + 2]; // B
  }

  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(header);

  const blob = new Blob([headerBytes, rgb], {
    type: "image/x-portable-pixmap",
  });
  return blob;
}

function encodePBM(imageData) {
  const { width, height, data } = imageData;
  const header = `P4\n${width} ${height}\n`;
  const rowBytes = Math.ceil(width / 8);
  const pixels = new Uint8Array(height * rowBytes);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const byteIndex = y * rowBytes + (x >> 3);
      const bit = 7 - (x % 8);
      const luminance =
        0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (luminance < 128) pixels[byteIndex] |= 1 << bit; // black
    }
  }

  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(header);
  return new Blob([headerBytes, pixels], { type: "image/x-portable-bitmap" });
}

function encodePGM(imageData) {
  const { width, height, data } = imageData;
  const header = `P5\n${width} ${height}\n255\n`;
  const gray = new Uint8Array(width * height);

  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    // Simple luminance formula
    gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(header);

  return new Blob([headerBytes, gray], { type: "image/x-portable-graymap" });
}

function encodeBMP(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const rgba = imageData.data;

  // BMP header: 8 bytes
  const header = new ArrayBuffer(8);
  const dv = new DataView(header);
  dv.setUint8(0, 0x49); // II = little-endian
  dv.setUint8(1, 0x49);
  dv.setUint16(2, 42, true); // Magic number
  dv.setUint32(4, 8, true); // Offset to first IFD

  // BitsPerSample array: 4 channels (R,G,B,A)
  const bits = new Uint16Array([8, 8, 8, 8]);

  // IFD: 8 tags
  const numTags = 8;
  const ifdSize = 2 + numTags * 12 + 4;
  const ifd = new ArrayBuffer(ifdSize);
  const ifdv = new DataView(ifd);
  ifdv.setUint16(0, numTags, true);

  let offset = 2;
  const bitsOffset = header.byteLength + ifd.byteLength; // bits array after IFD
  const pixelOffset = bitsOffset + bits.byteLength; // pixel data after bits array

  function addTag(tag, type, count, valueOrOffset) {
    ifdv.setUint16(offset, tag, true);
    ifdv.setUint16(offset + 2, type, true);
    ifdv.setUint32(offset + 4, count, true);
    ifdv.setUint32(offset + 8, valueOrOffset, true);
    offset += 12;
  }

  addTag(256, 4, 1, width); // ImageWidth
  addTag(257, 4, 1, height); // ImageLength
  addTag(258, 3, 4, bitsOffset); // BitsPerSample
  addTag(259, 3, 1, 1); // Compression = none
  addTag(262, 3, 1, 2); // Photometric = RGB
  addTag(273, 4, 1, pixelOffset); // StripOffsets
  addTag(277, 3, 1, 4); // SamplesPerPixel = 4 (RGBA)
  addTag(339, 3, 1, 1); // ExtraSamples = 1 (alpha)

  ifdv.setUint32(offset, 0, true); // next IFD = 0

  // Pixel data: RGBA interleaved
  const pixelData = new Uint8Array(rgba.length);
  pixelData.set(rgba);

  // Concatenate all buffers
  const bmpBuffer = new Uint8Array(
    header.byteLength + ifd.byteLength + bits.byteLength + pixelData.byteLength
  );
  bmpBuffer.set(new Uint8Array(header), 0);
  bmpBuffer.set(new Uint8Array(ifd), header.byteLength);
  bmpBuffer.set(
    new Uint8Array(bits.buffer),
    header.byteLength + ifd.byteLength
  );
  bmpBuffer.set(
    pixelData,
    header.byteLength + ifd.byteLength + bits.byteLength
  );

  return new Blob([bmpBuffer], { type: "image/bmp" });
}

// Fixed ICO encoder — returns a Promise
async function encodeICO(imageData) {
  // Create a temporary canvas if input is ImageData
  let canvas;
  if (imageData instanceof ImageData) {
    canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d");
    ctx.putImageData(imageData, 0, 0);
  } else {
    // Assume it's a canvas
    canvas = imageData;
  }

  return new Promise((resolve) => {
    canvas.toBlob(async (pngBlob) => {
      const arrayBuffer = await pngBlob.arrayBuffer();
      const icoBuffer = new Uint8Array(6 + 16 + arrayBuffer.byteLength); // ICONDIR + ICONDIRENTRY + PNG data
      const dv = new DataView(icoBuffer.buffer);

      // ICONDIR
      dv.setUint16(0, 0, true); // reserved
      dv.setUint16(2, 1, true); // type = icon
      dv.setUint16(4, 1, true); // 1 image

      // ICONDIRENTRY
      const width = canvas.width > 255 ? 0 : canvas.width; // 0 = 256
      const height = canvas.height > 255 ? 0 : canvas.height;
      icoBuffer[6] = width;
      icoBuffer[7] = height;
      icoBuffer[8] = 0; // color palette
      icoBuffer[9] = 0; // reserved
      dv.setUint16(10, 1, true); // planes
      dv.setUint16(12, 32, true); // bit count
      dv.setUint32(14, arrayBuffer.byteLength, true); // size
      dv.setUint32(18, 6 + 16, true); // offset to image data

      // copy PNG data
      icoBuffer.set(new Uint8Array(arrayBuffer), 22);

      resolve(new Blob([icoBuffer], { type: "image/x-icon" }));
    }, "image/png");
  });
}
// ==========================
// 🟣 DDS ENCODER (basic uncompressed RGBA8)
// ==========================
function encodeDDS(imageData) {
  const { width, height, data } = imageData;
  const header = new ArrayBuffer(128);
  const view = new DataView(header);

  // Magic "DDS "
  view.setUint32(0, 0x20534444, true);

  // Header size
  view.setUint32(4, 124, true);

  // Flags
  view.setUint32(8, 0x00021007, true);

  // Height / Width
  view.setUint32(12, height, true);
  view.setUint32(16, width, true);

  // Pitch / Linear size
  view.setUint32(20, width * 4, true);

  // MipMap count
  view.setUint32(28, 1, true);

  // Pixel format
  view.setUint32(76, 32, true); // size
  view.setUint32(80, 0x41, true); // flags RGBA
  view.setUint32(84, 0, true); // FourCC (none)
  view.setUint32(88, 32, true); // RGB bit count
  view.setUint32(92, 0x00ff0000, true); // R
  view.setUint32(96, 0x0000ff00, true); // G
  view.setUint32(100, 0x000000ff, true); // B
  view.setUint32(104, 0xff000000, true); // A

  // DDSCAPS
  view.setUint32(108, 0x1000, true);

  const rgba = new Uint8Array(width * height * 4);
  rgba.set(data);

  return new Blob([header, rgba], { type: "image/vnd-ms.dds" });
}
// ==========================
// 🟢 FLIF ENCODER (mocked FLIF-like wrapper, saves PNG data with FLIF header for testing)
// ==========================
function encodeFLIF(imageData) {
  // NOTE: This isn’t real FLIF compression — browsers can’t natively do FLIF encoding.
  // We wrap a PNG blob with FLIF header bytes for compatibility testing.
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  ctx.putImageData(imageData, 0, 0);

  const pngBlobPromise = new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png")
  );

  return new Blob(["FLIF0", pngBlobPromise], { type: "image/flif" });
}
// ==========================
// 🔵 TGA ENCODER (true-color, uncompressed 24/32-bit)
// ==========================
function encodeTGA(imageData) {
  const { width, height, data } = imageData;
  const header = new Uint8Array(18);
  header[2] = 2; // uncompressed true-color image
  header[12] = width & 0xff;
  header[13] = (width >> 8) & 0xff;
  header[14] = height & 0xff;
  header[15] = (height >> 8) & 0xff;
  header[16] = 32; // 32 bits per pixel (RGBA)
  header[17] = 0x20; // top-left origin

  const pixels = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];
    pixels.set([b, g, r, a], i * 4);
  }

  return new Blob([header, pixels], { type: "image/x-tga" });
}
// ==========================
// 🟠 QOI ENCODER (simple version based on spec, no run-length optimization)
// ==========================
function encodeQOI(imageData) {
  const { width, height, data } = imageData;

  function writeU32(buf, offset, value) {
    buf[offset] = (value >> 24) & 0xff;
    buf[offset + 1] = (value >> 16) & 0xff;
    buf[offset + 2] = (value >> 8) & 0xff;
    buf[offset + 3] = value & 0xff;
  }

  const header = new Uint8Array(14);
  header[0] = "q".charCodeAt(0);
  header[1] = "o".charCodeAt(0);
  header[2] = "i".charCodeAt(0);
  header[3] = "f".charCodeAt(0);
  writeU32(header, 4, width);
  writeU32(header, 8, height);
  header[12] = 4; // channels RGBA
  header[13] = 0; // colorspace sRGB

  const pixelData = new Uint8Array(width * height * 4 + 8);
  pixelData.set(data, 0);
  // QOI end marker
  pixelData.set([0, 0, 0, 0, 0, 0, 0, 1], width * height * 4);

  return new Blob([header, pixelData], { type: "image/qoi" });
}

// === Vectorization helper for SVG ===
async function convertToVectorSVG(file, options = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        try {
          const svgString = ImageTracer.imagedataToSVG(
            ctx.getImageData(0, 0, canvas.width, canvas.height),
            options
          );
          const url = URL.createObjectURL(
            new Blob([svgString], { type: "image/svg+xml" })
          );
          resolve({ svgString, url });
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
