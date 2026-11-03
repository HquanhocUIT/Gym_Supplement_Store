const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const script = path.join(__dirname, 'check-pr-title.cjs');

// Chạy bằng biến môi trường giống GitHub Actions, không thực thi nội dung title.
function checkTitle(title) {
  return spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    env: { ...process.env, PR_TITLE: title },
  });
}

test('chấp nhận tiêu đề Conventional Commits', () => {
  for (const title of ['feat(store): add product catalog', 'ci: add checks', 'fix(api)!: change response', 'docs: a']) {
    assert.equal(checkTitle(title).status, 0, title);
  }
});

test('từ chối tiêu đề thiếu type, dấu cách hoặc nội dung', () => {
  for (const title of ['[Task 11] Add CI', 'unknown: add checks', 'fix:no space', 'fix: ', 'feat: line\nsecond']) {
    assert.equal(checkTitle(title).status, 1, title);
  }
});
