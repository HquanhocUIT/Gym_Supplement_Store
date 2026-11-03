// Tiêu đề dùng định dạng Conventional Commits: type(scope): nội dung.
const title = process.env.PR_TITLE || '';
const pattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9][a-z0-9._/-]*\))?!?: \S(?:.*\S)?$/;

if (!pattern.test(title) || /[\r\n]/.test(title)) {
  console.error('Tiêu đề PR không hợp lệ. Ví dụ: feat(store): add product catalog');
  process.exitCode = 1;
} else {
  console.log('Tiêu đề PR hợp lệ.');
}
