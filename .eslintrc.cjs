module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true,
		'jest/globals': true
	},
	extends: 'eslint:recommended',
	ignorePatterns: ['*.js', '*.mjs'],
	overrides: [
		{
			env: {
				node: true
			},
			files: ['.eslintrc.{js,cjs}'],
			parserOptions: {
				sourceType: 'script'
			}
		}
	],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module'
	},
	plugins: ['jest'],
	rules: {}
}
