const { isEqual, setWith } = require('lodash')

const defaultSetter = ({ expansion, path, target }) => {
	setWith(target, path, expansion, Object)
}

const makeExpander = ({ findContractions, getKey, limit, loader, setter = defaultSetter }) => {
	const expand = async (input) => {
		return await visit(input)

		async function visit(target, { depth = 1, stack = [] } = {}) {
			if (!target) return

			if (stack.find(([stackTarget]) => Object.is(stackTarget, target))) return

			const key = getKey(target)

			try {
				stack.push([target, key])

				const delta = limit - depth + 1

				if (delta <= 0) return

				const contractions = findContractions(target, { limit: delta })

				await Promise.all(
					contractions.map(async ([path, contraction, relativeDepth]) => {
						const expansionKey = getKey(contraction)

						if (stack.find(([, stackKey]) => isEqual(stackKey, expansionKey))) return

						const expansion = await loader(contraction)

						setter({ defaultSetter, expansion, path, target })

						await visit(expansion, { depth: depth + relativeDepth, stack })
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
