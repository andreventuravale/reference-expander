import fetch from 'node-fetch'
import { inspect } from 'node:util'
import { makeContractionFinder } from '../src/contraction-finder.js'
import { makeExpander } from '../src/expander.js'

const loader = async ({ type, id }) => {
	const response = await fetch(`https://jsonplaceholder.typicode.com/${type}s/${id}`)

	return await response.json()
}

const input = {
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
