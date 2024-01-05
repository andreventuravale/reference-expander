const { default: fetch } = require('node-fetch-cjs')
const { inspect } = require('node:util')
const { makeContractionFinder } = require('../src/contraction-finder')
const { makeExpander } = require('../src/expander')

const loader = async ({ type, id }) => {
	const response = await fetch(`https://jsonplaceholder.typicode.com/${type}s/${id}`)

	return await response.json()
}

const input = {
	foo: {
		posts: [
			{
				type: 'post',
				id: '1'
			},
			{
				type: 'post',
				id: '2'
			}
		]
	}
}

const { find } = makeContractionFinder({
	isContraction: (t) => Object.keys(t).every((k) => ['type', 'id'].includes(k)),
	isExpansion: (t) => 'id' in t
})

const { expand } = makeExpander({
	findContractions: find,
	getKey: (t) => t.id,
	loader
})

console.log(inspect(input, false, Infinity, true))

expand(input).then(() => {
	console.log(inspect(input, false, Infinity, true))
})
