/**
 * Rewrites text so the text-to-speech voice pronounces it correctly. MeloTTS has
 * no phoneme or SSML input, so the only lever is respelling. This only affects
 * what is spoken; the text shown to the visitor is never changed.
 *
 * To fix a word: add it to WORDS below, then listen with `npm run say`.
 */

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** [written form, spoken respelling]. Matched whole-word and case-insensitively. */
const WORDS: [string, string][] = [
	// Phrases and punctuation-heavy terms first, so shorter rules don't break them.
	['B.Tech', 'B Tech'],
	['AI/ML', 'A I and M L'],
	['CI/CD', 'C I C D'],
	['B2C', 'B to C'],
	['B2B', 'B to B'],
	['scikit-learn', 'sigh kit learn'],
	['PostgreSQL', 'Postgres Q L'],
	['MongoDB', 'Mongo D B'],

	// Tools and frameworks
	['FastAPI', 'Fast A P I'],
	['LangGraph', 'Lang Graph'],
	['LangChain', 'Lang Chain'],
	['PyTorch', 'Pie Torch'],
	['Pytest', 'Pie test'],
	['TensorFlow', 'Tensor Flow'],
	['FAISS', 'Face'],
	['LiveKit', 'Live Kit'],
	['VoIP', 'voyp'],
	['Streamlit', 'Stream lit'],
	['Composeproof', 'Compose proof'],
	['Mixpanel', 'Mix panel'],
	['Statsig', 'Stat sig'],
	['Flocon', 'Flow con'],
	['Jira', 'Jeera'],
	['logcat', 'log cat'],
	['GitHub', 'Git Hub'],
	['WebSockets', 'Web Sockets'],

	// Names and places
	['Dialflo', 'Dial flow'],
	['Guwahati', 'Goo wah hah tee'],
	['Yuvaan', 'You vaan'],

	// Instruments
	['tabla', 'tub la'],
	['cajon', 'ka hone'],
];

/** All-caps words that are read as ordinary words, not spelled out. */
const READ_AS_WORDS = new Set(['OK', 'RAG', 'REST', 'NASA']);

const RULES: [RegExp, string][] = WORDS.map(([written, spoken]) => [
	new RegExp(`(?<![A-Za-z0-9])${escape(written)}(?![A-Za-z0-9])`, 'gi'),
	spoken,
]);

export function forSpeech(text: string): string {
	let out = text;
	for (const [pattern, spoken] of RULES) out = out.replace(pattern, spoken);

	// Remaining all-caps acronyms (LLM, QA, UI, IIIT...) are spelled letter by letter.
	out = out.replace(/\b([A-Z]{2,6})(s?)\b/g, (match, letters: string, plural: string) =>
		READ_AS_WORDS.has(letters) ? match : `${[...letters].join(' ')}${plural}`,
	);

	// A slash between words reads better as a space.
	return out
		.replace(/(?<=[A-Za-z])\/(?=[A-Za-z])/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}
