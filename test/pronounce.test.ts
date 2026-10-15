import { describe, expect, it } from 'vitest';
import { forSpeech } from '../src/pronounce';

describe('forSpeech', () => {
	it('respells tool and framework names', () => {
		expect(forSpeech('He uses FastAPI and PyTorch.')).toBe('He uses Fast A P I and Pie Torch.');
		expect(forSpeech('LangGraph and LangChain')).toBe('Lang Graph and Lang Chain');
	});

	it('matches case-insensitively and whole words only', () => {
		expect(forSpeech('fastapi')).toBe('Fast A P I');
		expect(forSpeech('Jiraffe')).toBe('Jiraffe'); // not "Jira"
	});

	it('handles terms containing punctuation', () => {
		expect(forSpeech('A B.Tech graduate')).toBe('A B Tech graduate');
		expect(forSpeech('He works on AI/ML and CI/CD')).toBe('He works on A I and M L and C I C D');
		expect(forSpeech('B2C and B2B products')).toBe('B to C and B to B products');
	});

	it('spells out remaining all-caps acronyms, including plurals', () => {
		expect(forSpeech('QA and UI')).toBe('Q A and U I');
		expect(forSpeech('Strong LLMs')).toBe('Strong L L Ms');
		expect(forSpeech('IIIT Guwahati')).toBe('I I I T Goo wah hah tee');
	});

	it('leaves acronyms that are read as words', () => {
		expect(forSpeech('RAG is OK')).toBe('RAG is OK');
	});

	it('leaves ordinary sentences untouched', () => {
		const sentence = 'Aditya worked at Equal and built things in Hyderabad.';
		expect(forSpeech(sentence)).toBe(sentence);
	});

	it('does not leave a respelling that would be spelled out again', () => {
		// "Face" for FAISS must not become "F a c e": rewrites must not be re-matched as acronyms.
		expect(forSpeech('FAISS index')).toBe('Face index');
	});

	it('collapses extra whitespace', () => {
		expect(forSpeech('  hello    world  ')).toBe('hello world');
	});
});
