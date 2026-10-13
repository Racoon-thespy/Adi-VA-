/**
 * Deterministic defences that do not depend on the model behaving.
 * Prompt wording alone is not reliable: in testing, a fake closing tag in a
 * visitor message broke the model out of the profile block, and "repeat
 * everything above" leaked the opening lines of the system prompt.
 */

/** Phrases that only appear in the system prompt, never in a legitimate answer. */
export const PROMPT_MARKERS = [
	'profile_data',
	'UNTRUSTED INPUT',
	'SOURCE OF TRUTH',
	'# SCOPE',
	'VOICE OUTPUT',
	'CONVERSATION BEHAVIOR',
	'SALARY AND COMPENSATION',
	'You are an AI voice assistant',
];

export const DEFLECTION = "I'm here to talk about Aditya.";

/** Replaces a reply that quotes the system prompt with a fixed deflection. */
export function guardReply(reply: string): string {
	return PROMPT_MARKERS.some((marker) => reply.includes(marker)) ? DEFLECTION : reply;
}

/**
 * Removes tag-like text (for example a fake `</profile_data>`) from visitor
 * input so it cannot imitate the delimiters the system prompt relies on.
 */
export function stripMarkup(text: string): string {
	return text
		.replace(/\[\/?\s*(?:INST|SYS)\s*\]|<<\/?\s*SYS\s*>>/gi, ' ') // before the generic tag rule
		.replace(/<\/?\s*[a-z_][\w-]*[^>]*>/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}
