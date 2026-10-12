const API_URL = "https://api.qrserver.com/v1/create-qr-code/";
const form = document.getElementById("qrForm");
const qrText = document.getElementById("qrText");
const qrImage = document.getElementById("qrImage");
const qrPlaceholder = document.getElementById("qrPlaceholder");
const resultNote = document.getElementById("resultNote");
const charCount = document.getElementById("charCount");
const downloadButton = document.getElementById("downloadButton");
const copyButton = document.getElementById("copyButton");
const historyList = document.getElementById("historyList");
const clearButton = document.getElementById("clearButton");
const clearHistoryButton = document.getElementById("clearHistoryButton");

let currentText = "";
let currentUrl = "";
let historyItems = [];

qrText.addEventListener("input", () => {
  charCount.textContent = `${qrText.value.length} / 1500`;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = qrText.value.trim();

  if (!text) {
    await Swal.fire({
      title: "Text is required",
      text: "Enter a message or link before generating a QR code.",
      icon: "warning",
      confirmButtonColor: "#8c7aff"
    });
    qrText.focus();
    return;
  }

  currentText = text;
  currentUrl = `${API_URL}?size=300x300&format=png&data=${encodeURIComponent(text)}`;
  qrImage.hidden = true;
  qrPlaceholder.hidden = false;
  qrPlaceholder.innerHTML = "<p>Generating your QR code...</p>";
  resultNote.textContent = "Connecting to the QR code service...";
  downloadButton.disabled = true;
  copyButton.disabled = true;

  qrImage.onload = async () => {
    qrPlaceholder.hidden = true;
    qrImage.hidden = false;
    resultNote.textContent = text.length > 60 ? `${text.slice(0, 60)}...` : text;
    downloadButton.disabled = false;
    copyButton.disabled = false;
    saveToHistory(text, currentUrl);
    await Swal.fire({
      title: "QR code created!",
      text: "Your QR code is ready to scan or download.",
      icon: "success",
      confirmButtonColor: "#8c7aff",
      timer: 1700,
      showConfirmButton: false
    });
  };

  qrImage.onerror = async () => {
    qrImage.hidden = true;
    qrPlaceholder.hidden = false;
    qrPlaceholder.innerHTML = '<span class="placeholder-icon">!</span><p>Could not load the QR code.</p>';
    resultNote.textContent = "Check your internet connection and try again.";
    await Swal.fire({
      title: "Something went wrong",
      text: "The QR service could not be reached. Please try again.",
      icon: "error",
      confirmButtonColor: "#8c7aff"
    });
  };

  qrImage.src = currentUrl;
});

downloadButton.addEventListener("click", async () => {
  if (!currentUrl) return;

  try {
    const response = await fetch(currentUrl);
    if (!response.ok) throw new Error("Download failed");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "qr-quickshare.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
    Swal.fire({
      title: "Downloaded!",
      text: "Your QR code image has been saved.",
      icon: "success",
      confirmButtonColor: "#8c7aff",
      timer: 1500,
      showConfirmButton: false
    });
  } catch {
    window.open(currentUrl, "_blank", "noopener");
    Swal.fire({
      title: "QR code opened",
      text: "If the download did not start, right-click the image and choose Save image as.",
      icon: "info",
      confirmButtonColor: "#8c7aff"
    });
  }
});

copyButton.addEventListener("click", async () => {
  if (!currentText) return;

  try {
    await navigator.clipboard.writeText(currentText);
    Swal.fire({
      title: "Copied!",
      text: "The original text has been copied.",
      icon: "success",
      confirmButtonColor: "#8c7aff",
      timer: 1400,
      showConfirmButton: false
    });
  } catch {
    Swal.fire({
      title: "Copy unavailable",
      text: "Your browser blocked clipboard access. Select and copy the text manually.",
      icon: "info",
      confirmButtonColor: "#8c7aff"
    });
  }
});

clearButton.addEventListener("click", async () => {
  if (!qrText.value.trim()) return;

  const result = await Swal.fire({
    title: "Clear the input?",
    text: "This will remove the text from the input box.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, clear it",
    cancelButtonText: "Keep text",
    confirmButtonColor: "#8c7aff",
    cancelButtonColor: "#42495d"
  });

  if (result.isConfirmed) {
    qrText.value = "";
    charCount.textContent = "0 / 1500";
    qrText.focus();
  }
});

clearHistoryButton.addEventListener("click", async () => {
  if (historyItems.length === 0) {
    await Swal.fire({
      title: "History is empty",
      text: "There are no saved QR codes to clear.",
      icon: "info",
      confirmButtonColor: "#8c7aff"
    });
    return;
  }

  const result = await Swal.fire({
    title: "Clear all history?",
    text: "This only clears the recent list on this page.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Clear history",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#8c7aff",
    cancelButtonColor: "#42495d"
  });

  if (result.isConfirmed) {
    historyItems = [];
    renderHistory();
    Swal.fire({
      title: "History cleared",
      icon: "success",
      confirmButtonColor: "#8c7aff",
      timer: 1300,
      showConfirmButton: false
    });
  }
});

function saveToHistory(text, url) {
  historyItems = historyItems.filter(item => item.text !== text);
  historyItems.unshift({ text, url });
  historyItems = historyItems.slice(0, 6);
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";

  if (historyItems.length === 0) {
    historyList.innerHTML = '<p class="empty-history">Your recent QR codes will show up here.</p>';
    return;
  }

  historyItems.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "history-item";

    const image = document.createElement("img");
    image.className = "history-thumb";
    image.src = item.url;
    image.alt = "QR code thumbnail";

    const details = document.createElement("div");
    details.className = "history-text";

    const title = document.createElement("strong");
    title.textContent = item.text;

    const subtitle = document.createElement("span");
    subtitle.textContent = `${item.text.length} characters`;

    const openButton = document.createElement("button");
    openButton.className = "history-open";
    openButton.type = "button";
    openButton.textContent = "Use";
    openButton.addEventListener("click", () => {
      qrText.value = item.text;
      charCount.textContent = `${item.text.length} / 1500`;
      form.requestSubmit();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    details.append(title, subtitle);
    card.append(image, details, openButton);
    historyList.append(card);
  });
}
