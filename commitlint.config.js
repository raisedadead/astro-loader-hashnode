export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'build',
        'revert',
      ],
    ],
  'subject-case': [2, 'never', ['pascal-case', 'upper-case']],
  // Remove length restrictions to allow long commit messages (e.g. generated release notes)
  'header-max-length': [0, 'always', Infinity],
  'body-max-line-length': [0, 'always', Infinity],
  'footer-max-line-length': [0, 'always', Infinity],
  },
};
