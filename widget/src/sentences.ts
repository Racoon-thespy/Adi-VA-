/**
 * Splits a reply into a few sentence-sized chunks. Each is synthesised in
 * parallel, so the first sentence can start playing while the rest are still
 * being generated. Tiny fragments are merged so clips don't sound choppy.
 */
export function splitSentences(text: string, minChars = 40, maxParts = 3): string[] {
	const clean = text.replace(/\s+/g, ' ').trim();
	if (!clean) return [];

	const pieces = clean.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [clean];
	const parts: string[] = [];
	for (const piece of pieces) {
		const sentence = piece.trim();
		if (!sentence) continue;
		const last = parts.length - 1;
		if (last >= 0 && (parts[last]?.length ?? 0) < minChars) parts[last] += ` ${sentence}`;
		else parts.push(sentence);
	}
	while (parts.length > maxParts) {
		const tail = parts.pop() ?? '';
		parts[parts.length - 1] += ` ${tail}`;
	}
	return parts;
}
