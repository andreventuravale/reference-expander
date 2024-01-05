const { isEqual, setWith } = require('lodash')

const makeExpander = ({ findContractions, getKey, limit, loader }) => {
	const expand = async (input) => {
		return await visit(input)

		async function visit(node, { depth = 1, stack = [] } = {}) {
			if (!node) return

			if (stack.find(([stackNode]) => Object.is(stackNode, node))) return

			const key = getKey(node)

			try {
				stack.push([node, key])

				const delta = limit - depth + 1

				if (delta <= 0) return

				const contractions = findContractions(node, { limit: delta })

				await Promise.all(
					contractions.map(async ([path, contraction, relativeDepth]) => {
						const childKey = getKey(contraction)

						if (stack.find(([, stackKey]) => isEqual(stackKey, childKey))) return

						const child = await loader(contraction)

						setWith(node, path, child, Object)

						await visit(child, {
							depth: depth + relativeDepth,
							stack
						})
					})
				)
			} finally {
				stack.pop()
			}
		}
	}

	return {
		expand
	}
}

exports.makeExpander = makeExpander
