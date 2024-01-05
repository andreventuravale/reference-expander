const { isEqual, setWith } = require('lodash')

const makeExpander = ({ findContractions, getKey, limit: maxDepth, loader }) => {
	const expand = async (input) => {
		return await visit(input)

		async function visit(node, { depth = 1, stack = [] } = {}) {
			if (!node) return

			if (stack.find(([stackNode]) => Object.is(stackNode, node))) return

			const key = getKey(node)

			try {
				stack.push([node, key])

				const limit = maxDepth - depth + 1

				if (limit <= 0) return

				const refs = findContractions(node, { limit })

				await Promise.all(
					refs.map(async ([path, ref, relativeDepth]) => {
						const childKey = getKey(ref)

						if (stack.find(([, stackKey]) => isEqual(stackKey, childKey))) return

						const child = await loader(ref)

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
