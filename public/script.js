const form = document.getElementById("emailForm");
const generateBtn = document.getElementById("generateBtn");
const resultPanel = document.getElementById("resultPanel");
const subjectOutput = document.getElementById("subjectOutput");
const bodyOutput = document.getElementById("bodyOutput");
const statusText = document.getElementById("status");
const modeBadge = document.getElementById("modeBadge");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    recipient: document.getElementById("recipient").value.trim(),
    purpose: document.getElementById("purpose").value.trim(),
    tone: document.getElementById("tone").value,
    details: document.getElementById("details").value.trim()
  };
  if (!payload.purpose) {
    statusText.textContent = "Please enter the purpose of the email.";
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "Generating...";
  statusText.textContent = "";

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong.");

    subjectOutput.value = data.subject;
    bodyOutput.value = data.body;
    modeBadge.textContent = data.mode === "ai" ? "AI generated" : "Demo mode";
    resultPanel.classList.remove("hidden");
    statusText.textContent = data.mode === "ai"
      ? "Generated with an AI model. Review before sending."
      : "Demo mode: this is a template, not a real AI response. Add an API key to enable AI generation.";
    resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    statusText.textContent = error.message;
    resultPanel.classList.remove("hidden");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "✨ Generate Email";
  }
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  const text = `Subject: ${subjectOutput.value}\n\n${bodyOutput.value}`;
  try {
    await navigator.clipboard.writeText(text);
    statusText.textContent = "Email copied to clipboard.";
  } catch {
    statusText.textContent = "Copy was blocked by the browser. Select the text and copy it manually.";
  }
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const text = `Subject: ${subjectOutput.value}\n\n${bodyOutput.value}`;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "generated-email.txt";
  a.click();
  URL.revokeObjectURL(url);
  statusText.textContent = "Email downloaded as a text file.";
});
