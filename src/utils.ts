/**
 * Decodes a 24kHz 16-bit signed little-endian PCM raw audio base64 string
 * and plays it perfectly using the HTML5 Web Audio API.
 * Returns the source node and AudioContext so the caller can stop playback if needed.
 */
export function playRawPCM(
  base64Data: string,
  sampleRate: number = 24000
): Promise<{ source: AudioBufferSourceNode; ctx: AudioContext }> {
  return new Promise((resolve, reject) => {
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 16-bit PCM has 2 bytes per sample
      const int16Array = new Int16Array(bytes.buffer);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      const buffer = ctx.createBuffer(1, int16Array.length, sampleRate);
      const channelData = buffer.getChannelData(0);

      for (let i = 0; i < int16Array.length; i++) {
        // Convert 16-bit signed PCM to 32-bit floating point [-1.0, 1.0]
        channelData[i] = int16Array[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      
      resolve({ source, ctx });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Converts a standard File object into a base64 string along with its mimeType
 */
export function fileToBase64(file: File): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const commaIndex = result.indexOf(",");
      if (commaIndex === -1) {
        reject(new Error("Could not parse file."));
        return;
      }
      const mimeType = result.substring(result.indexOf(":") + 1, result.indexOf(";"));
      const data = result.substring(commaIndex + 1);
      resolve({ mimeType, data });
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Formats timestamps into nice relative/absolute times
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
