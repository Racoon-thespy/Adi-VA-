/** 16 kHz mono 16-bit PCM is what Whisper handles best, and it is the format the Worker accepts. */
export const WAV_SAMPLE_RATE = 16_000;

export function encodeWav(samples: Float32Array, sampleRate = WAV_SAMPLE_RATE): ArrayBuffer {
	const dataBytes = samples.length * 2;
	const buffer = new ArrayBuffer(44 + dataBytes);
	const view = new DataView(buffer);
	const tag = (offset: number, text: string) => {
		for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
	};

	tag(0, 'RIFF');
	view.setUint32(4, 36 + dataBytes, true);
	tag(8, 'WAVE');
	tag(12, 'fmt ');
	view.setUint32(16, 16, true); // fmt chunk size
	view.setUint16(20, 1, true); // PCM
	view.setUint16(22, 1, true); // mono
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true); // byte rate
	view.setUint16(32, 2, true); // block align
	view.setUint16(34, 16, true); // bits per sample
	tag(36, 'data');
	view.setUint32(40, dataBytes, true);

	for (let i = 0; i < samples.length; i++) {
		const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0));
		view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
	}
	return buffer;
}

/**
 * Converts whatever the browser recorded (WebM/Opus, MP4/AAC, Ogg) into 16 kHz
 * mono WAV, so the Worker only ever has to deal with one tested format.
 */
export async function blobToWav(blob: Blob): Promise<ArrayBuffer> {
	const context = new AudioContext();
	try {
		const decoded = await context.decodeAudioData(await blob.arrayBuffer());
		const frames = Math.max(1, Math.ceil(decoded.duration * WAV_SAMPLE_RATE));
		const offline = new OfflineAudioContext(1, frames, WAV_SAMPLE_RATE);
		const source = offline.createBufferSource();
		source.buffer = decoded;
		source.connect(offline.destination);
		source.start();
		const rendered = await offline.startRendering();
		return encodeWav(rendered.getChannelData(0));
	} finally {
		void context.close();
	}
}
