let capturedStream = null;

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  if (!capturedStream) {
    chrome.tabCapture.capture(
      {
        audio: true,
        video: false
      },
      (stream) => {
        if (!stream) {
          console.error('No se pudo capturar audio del tab');
          return;
        }
        capturedStream = stream;
        console.log('Captura de audio iniciada');
        // TODO: enviar stream vía WebSocket al servidor local (MediaRecorder en content script)
      }
    );
  } else {
    capturedStream.getTracks().forEach((t) => t.stop());
    capturedStream = null;
    console.log('Captura de audio detenida');
  }
});

