import { describe, expect, it } from 'vitest';
import { forSpeech, spell } from '../src/pronounce';

describe('spell', () => {
	it('uses letter names so a lone A is not read as the article', () => {
		expect(spell('AI')).toBe('ay eye');
		expect(spell('API')).toBe('ay pee eye');
		expect(spell('QA')).toBe('cue ay');
		expect(spell('W')).toBe('double you');
	});
});

describe('forSpeech', () => {
	it('spells acronyms with letter names, not as words', () => {
		expect(forSpeech('He works on AI.')).toBe('He works on ay eye.');
		expect(forSpeech('QA and UI')).toBe('cue ay and you eye');
		expect(forSpeech('IIIT')).toBe('eye eye eye tee');
	});

	it('handles plural acronyms', () => {
		expect(forSpeech('Strong LLMs')).toBe('Strong el el ems');
	});

	it('respells tool and framework names', () => {
		expect(forSpeech('He uses FastAPI and PyTorch.')).toBe(
			'He uses Fast ay pee eye and Pie Torch.',
		);
		expect(forSpeech('LangGraph and LangChain')).toBe('Lang Graph and Lang Chain');
	});

	it('matches case-insensitively and whole words only', () => {
		expect(forSpeech('fastapi')).toBe('Fast ay pee eye');
		expect(forSpeech('Jiraffe')).toBe('Jiraffe'); // not "Jira"
	});

	it('handles terms containing punctuation', () => {
		expect(forSpeech('A B.Tech graduate')).toBe('A bee Tech graduate');
		expect(forSpeech('He works on AI/ML and CI/CD')).toBe(
			'He works on ay eye and em el and see eye see dee',
		);
		expect(forSpeech('B2C and B2B products')).toBe('bee to see and bee to bee products');
	});

	it('respells names and places', () => {
		expect(forSpeech('Aditya Pratap Singh lives in Hyderabad.')).toBe(
			'Uh dit yuh Pruh tahp Sing lives in High der uh bad.',
		);
	});

	it('leaves acronyms that are read as words', () => {
		expect(forSpeech('RAG is OK')).toBe('RAG is OK');
	});

	it('leaves ordinary sentences untouched, including the article "A" and the pronoun "I"', () => {
		const sentence = 'A good engineer says I built things at Equal.';
		expect(forSpeech(sentence)).toBe(sentence);
	});

	it('does not re-process its own respellings', () => {
		expect(forSpeech('FAISS index')).toBe('Face index');
		expect(forSpeech('FastAPI')).toBe('Fast ay pee eye'); // not spelled out twice
	});

	it('collapses extra whitespace', () => {
		expect(forSpeech('  hello    world  ')).toBe('hello world');
	});
});
