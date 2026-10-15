// Builds the widget and copies it into the portfolio repo as agent.js.
//
//   npm run publish:widget                 (portfolio assumed at ../Portfolio)
//   PORTFOLIO_DIR=/path/to/Portfolio npm run publish:widget
//   npm run publish:widget -- --force      (overwrite even if agent.js has uncommitted edits)
//
// It only copies the file. Committing and pushing the portfolio is left to you, because
// pushing it publishes the live site.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const portfolio = resolve(process.env.PORTFOLIO_DIR ?? resolve(root, '../Portfolio'));
const target = resolve(portfolio, 'agent.js');
const built = resolve(root, 'dist/agent.js');
const force = process.argv.includes('--force');

const git = (...args) => execFileSync('git', ['-C', portfolio, ...args], { encoding: 'utf8' });
const fail = (message) => {
	console.error(message);
	process.exit(1);
};

if (!existsSync(resolve(portfolio, 'index.html'))) {
	fail(`No portfolio found at ${portfolio}. Set PORTFOLIO_DIR to its folder.`);
}

// Refuse to overwrite edits made by hand in the portfolio's copy: they would be lost.
if (existsSync(target) && !force) {
	let dirty = '';
	try {
		dirty = git('status', '--porcelain', '--', 'agent.js').trim();
	} catch {
		fail(`${portfolio} is not a git repository, so hand edits cannot be detected. Use --force.`);
	}
	if (dirty) {
		fail(
			'agent.js in the portfolio has uncommitted edits, so publishing would overwrite them.\n' +
				'Commit them, port them into widget/src, or re-run with --force.',
		);
	}
}

execFileSync(process.execPath, [resolve(root, 'scripts/build-widget.mjs')], { stdio: 'inherit' });

const next = readFileSync(built);
const current = existsSync(target) ? readFileSync(target) : null;
if (current && current.equals(next)) {
	console.log('Portfolio already has this build. Nothing to publish.');
	process.exit(0);
}

copyFileSync(built, target);
console.log(`Copied dist/agent.js to ${target}`);
console.log(`  size: ${current ? `${current.length} -> ` : ''}${next.length} bytes`);

const html = readFileSync(resolve(portfolio, 'index.html'), 'utf8');
if (!/<script[^>]+src="agent\.js"[^>]*data-api=/.test(html)) {
	console.warn('Warning: index.html has no <script src="agent.js" data-api="..."> tag.');
}

console.log('\nNext, to put it on the live site:');
console.log(`  git -C ${portfolio} add agent.js`);
console.log(`  git -C ${portfolio} commit -m "Update the AI voice assistant widget"`);
console.log(`  git -C ${portfolio} push origin main`);
