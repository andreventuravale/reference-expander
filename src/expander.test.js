const { makeContractionFinder } = require('./contraction-finder')
const { makeExpander } = require('./expander')
const { z } = require('zod')
const td = require('testdouble')

afterEach(() => {
	td.reset()
})

const contractedSchema = z
	.object({
		_content_type_uid: z.string(),
		uid: z.string()
	})
	.strict()

const expandedSchema = z.object({
	uid: z.string()
})

const isContraction = (v) => contractedSchema.safeParse(v).success

const isExpansion = (v) => expandedSchema.safeParse(v).success

const getKey = (v) => expandedSchema.parse(v)

const contractionFinder = makeContractionFinder({ isContraction, isExpansion })

const findContractions = (node, { limit }) => contractionFinder.find(node, { limit })

test('respects the max depth', async () => {
	const loader = td.func()

	const input = {
		uid: '0',
		ref: {
			_content_type_uid: 'bar',
			uid: '1' // d=1
		},
		foo: {
			bar: {
				ref: {
					_content_type_uid: 'bar',
					uid: '2' // d=1
				}
			}
		},
		baz: {
			uid: '3',
			qux: {
				uid: '4',
				ref: {
					_content_type_uid: 'bar',
					uid: '5' // d=3
				}
			},
			ref: {
				_content_type_uid: 'bar',
				uid: '6' // d=2
			}
		}
	}

	await td.when(await loader({ _content_type_uid: 'bar', uid: '6' })).thenResolve({
		uid: '6',
		waldo: {
			ref: {
				_content_type_uid: 'bar',
				uid: '7' // d=3
			},
			x: {
				ref: {
					_content_type_uid: 'bar',
					uid: '8' // d=3
				},
				y: {
					uid: '9',
					ref: {
						_content_type_uid: 'bar',
						uid: '10' // d=4
					}
				}
			}
		}
	})

	await makeExpander({
		findContractions,
		getKey,
		limit: 2,
		loader
	}).expand(input)

	await td.verify(await loader({ _content_type_uid: 'bar', uid: '1' }), { times: 1 })

	await td.verify(await loader({ _content_type_uid: 'bar', uid: '2' }), { times: 1 })

	// does not load because it is too deep

	await td.verify(await loader({ _content_type_uid: 'bar', uid: '5' }), { times: 0 })

	await makeExpander({
		findContractions,
		getKey,
		limit: 3,
		loader
	}).expand(input)

	await td.verify(await loader({ _content_type_uid: 'bar', uid: '1' }), { times: 1 })

	await td.verify(await loader({ _content_type_uid: 'bar', uid: '2' }), { times: 1 })

	await td.verify(await loader({ _content_type_uid: 'bar', uid: '5' }), { times: 1 })

	// loads because ../waldo isn't an entry therefore the depth remains the same

	await td.verify(await loader({ _content_type_uid: 'bar', uid: '7' }), { times: 1 })

	// loads because ../waldo/x isn't an entry therefore the depth remains the same

	await td.verify(await loader({ _content_type_uid: 'bar', uid: '8' }), { times: 1 })

	// does not load because ../waldo/x/y is an entry therefore the depth increases

	await td.verify(await loader({ _content_type_uid: 'bar', uid: '10' }), { times: 0 })

	expect(input).toEqual({
		baz: {
			qux: {
				uid: '4'
			},
			ref: {
				uid: '6',
				waldo: {
					x: {
						y: {
							ref: {
								_content_type_uid: 'bar',
								uid: '10'
							},
							uid: '9'
						}
					}
				}
			},
			uid: '3'
		},
		foo: {
			bar: {}
		},
		uid: '0'
	})
})

test('avoid cycles ( if the same contraction appears again )', async () => {
	const loader = td.func()

	const input = {
		uid: '0',
		foo: {
			bar: {
				ref: {
					_content_type_uid: 'bar',
					uid: '1'
				}
			}
		}
	}

	await td.when(await loader({ _content_type_uid: 'bar', uid: '1' })).thenResolve({
		uid: '1',
		ref: {
			_content_type_uid: 'bar',
			uid: '0'
		}
	})

	await makeExpander({
		findContractions,
		getKey,
		limit: 10,
		loader
	}).expand(input)

	await td.verify(await loader({ _content_type_uid: 'bar', uid: '0' }), { times: 0 })
})

test('avoid cycles ( if the same input appears again )', async () => {
	const loader = td.func()

	const input = {
		uid: '0',
		foo: {
			bar: {
				ref: {
					_content_type_uid: 'bar',
					uid: '1'
				}
			}
		}
	}

	await td.when(await loader({ _content_type_uid: 'bar', uid: '1' })).thenResolve(input)

	await makeExpander({
		findContractions,
		getKey,
		limit: 10,
		loader
	}).expand(input)

	await td.verify(await loader({ _content_type_uid: 'bar', uid: '0' }), { times: 0 })
})

test('custom setter', async () => {
	const loader = td.func()

	const input = {
		uid: '0',
		foo: {
			bar: {
				ref: {
					_content_type_uid: 'bar',
					uid: '1'
				}
			}
		}
	}

	await td
		.when(await loader({ _content_type_uid: 'bar', uid: '1' }))
		.thenResolve({ uid: '1', foo: 'bar' })

	await makeExpander({
		findContractions,
		getKey,
		limit: 10,
		loader,
		setter: (target, path, expansion, defaultSetter) =>
			defaultSetter(target, `${path}.obj`, expansion, defaultSetter)
	}).expand(input)

	expect(input).toEqual({
		foo: {
			bar: {
				ref: {
					_content_type_uid: 'bar',
					obj: {
						foo: 'bar',
						uid: '1'
					},
					uid: '1'
				}
			}
		},
		uid: '0'
	})
})
