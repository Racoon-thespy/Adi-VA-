/**
 * Rewrites text so the text-to-speech voice pronounces it correctly. MeloTTS has
 * no phoneme, SSML or accent input (Cloudflare only accepts lang "en"), so the
 * only lever is respelling. This only affects what is spoken; the text shown to
 * the visitor is never changed.
 *
 * To fix a word: add it to WORDS below, then listen with `npm run say`.
 * The respellings for names and places are best guesses made without hearing
 * them, so audition alternatives with `npm run say -- --variants "a|b|c"`.
 */

// Letter names, as an Indian-English speaker says them. Spelling an acronym with
// these names (not bare capitals) matters: a lone "A" is read as the article "uh".
const LETTER_NAMES: Record<string, string> = {
	A: 'ay',
	B: 'bee',
	C: 'see',
	D: 'dee',
	E: 'ee',
	F: 'eff',
	G: 'jee',
	H: 'aitch',
	I: 'eye',
	J: 'jay',
	K: 'kay',
	L: 'el',
	M: 'em',
	N: 'en',
	O: 'oh',
	P: 'pee',
	Q: 'cue',
	R: 'ar',
	S: 'ess',
	T: 'tee',
	U: 'you',
	V: 'vee',
	W: 'double you',
	X: 'ex',
	Y: 'why',
	Z: 'zed',
};

/** "API" -> "ay pee eye". */
export function spell(letters: string): string {
	return [...letters.toUpperCase()].map((letter) => LETTER_NAMES[letter] ?? letter).join(' ');
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** [written form, spoken respelling]. Matched whole-word and case-insensitively. */
const WORDS: [string, string][] = [
	// Phrases and punctuation-heavy terms first, so shorter rules don't break them.
	['B.Tech', `${spell('B')} Tech`],
	['AI/ML', `${spell('AI')} and ${spell('ML')}`],
	['CI/CD', spell('CICD')],
	['B2C', `${spell('B')} to ${spell('C')}`],
	['B2B', `${spell('B')} to ${spell('B')}`],
	['scikit-learn', 'sigh kit learn'],
	['PostgreSQL', `Postgres ${spell('SQL')}`],
	['MongoDB', `Mongo ${spell('DB')}`],

	// Tools and frameworks
	['FastAPI', `Fast ${spell('API')}`],
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

	// Names and places (best guesses; audition alternatives with `npm run say -- --variants`)
	['Aditya', 'Uh dit yuh'],
	['Pratap', 'Pruh tahp'],
	['Singh', 'Sing'],
	['Lucknow', 'Luck now'],
	['Hyderabad', 'High der uh bad'],
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

	// Remaining all-caps acronyms (AI, LLM, QA, UI, IIIT...) are spelled with letter names.
	out = out.replace(/\b([A-Z]{2,6})(s?)\b/g, (match, letters: string, plural: string) =>
		READ_AS_WORDS.has(letters) ? match : `${spell(letters)}${plural}`,
	);

	// A slash between words reads better as a space.
	return out
		.replace(/(?<=[A-Za-z])\/(?=[A-Za-z])/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}
