export interface Suggestion {
	/** Short text on the pill. */
	label: string;
	/** What is actually asked when the pill is tapped. */
	question: string;
}

// Each question must stay within the Worker's 300-character limit (checked by a test).
export const SUGGESTIONS: Suggestion[] = [
	{ label: 'What does Aditya do?', question: 'What does Aditya do?' },
	{ label: 'His experience', question: "Tell me about Aditya's work experience." },
	{ label: 'Best projects', question: "What are Aditya's best projects?" },
	{ label: 'Voice agents', question: 'Has Aditya built voice agents?' },
	{ label: 'Roles he wants', question: 'What kind of roles is Aditya looking for?' },
	{ label: 'Beyond code', question: 'What does Aditya do outside of work?' },
];

const normalise = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Finds the pill a message corresponds to, whether it was tapped, typed or spoken,
 * so a pill can be retired once its question has been asked.
 */
export function matchSuggestion(text: string): Suggestion | undefined {
	const wanted = normalise(text);
	return SUGGESTIONS.find((s) => normalise(s.question) === wanted || normalise(s.label) === wanted);
}
