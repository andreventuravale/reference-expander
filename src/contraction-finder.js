const { isArray, isObject, isPlainObject } = require('lodash')

const makeContractionFinder = ({ isContraction, isExpansion }) => {
	const find = function (input, { limit = 1 } = {}) {
		const result = []

		visit(input)

		return result

		function visit(node, { depth = 1, path = [] } = {}) {
			if (depth > limit) return

			if (isArray(node)) {
				node.forEach((v, index) => {
					visit(v, { depth, path: path.concat([`[${index}]`]) })
				})
			} else if (node !== null && isObject(node) && isPlainObject(node)) {
				const topLevel = Object.is(node, input)

				const contracted = isContraction(node)

				if (contracted) {
					if (!topLevel) {
						result.push([path.join(''), node, depth])
					}
				} else {
					const expanded = !contracted && isExpansion(node)

					Object.entries(node).forEach(([k, v]) => {
						visit(v, {
							depth: !topLevel && expanded ? depth + 1 : depth,
							path: path.concat([path.length === 0 ? k : `.${k}`])
						})
					})
				}
			}
		}
	}

	return {
		find
	}
}

exports.makeContractionFinder = makeContractionFinder
