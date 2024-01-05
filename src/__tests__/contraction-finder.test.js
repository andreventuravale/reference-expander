import { unset } from 'lodash-es'
import * as td from 'testdouble'
import { z } from 'zod'
import { makeContractionFinder } from '../contraction-finder'

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

test('refs must match exactly', () => {
	const input = {
		exactRef: {
			_content_type_uid: 'bar',
			uid: '123'
		},
		almostExactRef: {
			_content_type_uid: 'bar',
			uid: '123',
			foo: 'bar'
		}
	}

	let contractedRefs = makeContractionFinder({
		isContraction,
		isExpansion
	}).find(input)

	expect(contractedRefs).toEqual([
		[
			'exactRef',
			{
				_content_type_uid: 'bar',
				uid: '123'
			},
			1
		]
	])

	unset(input, 'almostExactRef.foo')

	contractedRefs = makeContractionFinder({
		isContraction,
		isExpansion
	}).find(input)

	expect(contractedRefs).toEqual([
		[
			'exactRef',
			{
				_content_type_uid: 'bar',
				uid: '123'
			},
			1
		],
		[
			'almostExactRef',
			{
				_content_type_uid: 'bar',
				uid: '123'
			},
			1
		]
	])
})

test('when the top-level looks like a contracted ref ( it can not be )', () => {
	const contractedRefs = makeContractionFinder({
		isContraction,
		isExpansion
	}).find({
		_content_type_uid: 'bar',
		uid: '123'
	})

	expect(contractedRefs).toEqual([])
})

test('top-level => object', () => {
	const contractedRefs = makeContractionFinder({
		isContraction,
		isExpansion
	}).find({
		foo: {
			_content_type_uid: 'bar',
			uid: '123'
		}
	})

	expect(contractedRefs).toEqual([
		[
			'foo',
			{
				_content_type_uid: 'bar',
				uid: '123'
			},
			1
		]
	])
})

test('top-level => object => array [ ref ]', () => {
	const contractedRefs = makeContractionFinder({
		isContraction,
		isExpansion
	}).find({
		foo: [
			{
				_content_type_uid: 'bar',
				uid: '123'
			}
		]
	})

	expect(contractedRefs).toEqual([
		[
			'foo[0]',
			{
				_content_type_uid: 'bar',
				uid: '123'
			},
			1
		]
	])
})

test('top-level => object => array [ ?, ref ]', () => {
	const contractedRefs = makeContractionFinder({
		isContraction,
		isExpansion
	}).find({
		foo: [
			'bar',
			{
				_content_type_uid: 'baz',
				uid: '1234'
			}
		]
	})

	expect(contractedRefs).toEqual([
		[
			'foo[1]',
			{
				_content_type_uid: 'baz',
				uid: '1234'
			},
			1
		]
	])
})

test('top-level => object => array [ ?, ref, ?, ref, ?, ref, ? ]', () => {
	const contractedRefs = makeContractionFinder({
		isContraction,
		isExpansion
	}).find({
		foo: [
			'bar',
			{
				_content_type_uid: 'type',
				uid: '1'
			},
			'baz',
			{
				_content_type_uid: 'type',
				uid: '2'
			},
			'qux',
			{
				_content_type_uid: 'type',
				uid: '3'
			},
			'waldo'
		]
	})

	expect(contractedRefs).toEqual([
		[
			'foo[1]',
			{
				_content_type_uid: 'type',
				uid: '1'
			},
			1
		],
		[
			'foo[3]',
			{
				_content_type_uid: 'type',
				uid: '2'
			},
			1
		],
		[
			'foo[5]',
			{
				_content_type_uid: 'type',
				uid: '3'
			},
			1
		]
	])
})

test('does not crash with undefined or null', () => {
	const contractedRefs = makeContractionFinder({
		isContraction,
		isExpansion
	}).find({
		foo: [
			undefined,
			{
				_content_type_uid: 'type',
				uid: '1'
			},
			undefined,
			{
				_content_type_uid: 'type',
				uid: '2'
			},
			null,
			{
				_content_type_uid: 'type',
				uid: '3'
			},
			null
		]
	})

	expect(contractedRefs).toEqual([
		[
			'foo[1]',
			{
				_content_type_uid: 'type',
				uid: '1'
			},
			1
		],
		[
			'foo[3]',
			{
				_content_type_uid: 'type',
				uid: '2'
			},
			1
		],
		[
			'foo[5]',
			{
				_content_type_uid: 'type',
				uid: '3'
			},
			1
		]
	])
})

test('depth-limit', () => {
	const payload = {
		uid: '1d4f216c-19e1-4a7d-bb7a-aa85e952d62d',
		ref: {
			_content_type_uid: 'bar',
			uid: 'cc662bdb-d52b-48c2-b80f-370a493eb480'
			// depth is 1
		},
		a: {
			ref: {
				_content_type_uid: 'bar',
				uid: '0cbc95d6-4e6a-4244-9c95-e0646645aa33'
				// depth is 1 because ../a is not an entry
			},
			b: {
				ref: {
					_content_type_uid: 'bar',
					uid: '4753203e-8c24-4f1b-9ac2-5a10be93c421'
					// depth is 1 because ../b is not an entry
				},
				c: {
					uid: 'af40c11e-7a7f-4c22-9f68-83d47c87d410',
					ref: {
						_content_type_uid: 'bar',
						uid: '818720eb-9e83-448b-92d0-ab05d31dbf8c'
						// depth is 2 because ../c is an entry
					},
					d: {
						ref: {
							_content_type_uid: 'bar',
							uid: '85aee8b1-1354-4ac1-a0e2-9af251140d64'
							// depth is 2 because ../d is not an entry
						},
						e: {
							uid: 'ddaaaf5f-80ff-4877-8ea3-c7a3eb3cfaab',
							ref: {
								_content_type_uid: 'bar',
								uid: '4320e926-169d-4655-b557-f00234fa27f6'
								// depth is 3 because ../e is not an entry
							}
						}
					}
				}
			}
		}
	}

	expect(
		makeContractionFinder({
			isContraction,
			isExpansion
		}).find(payload, { limit: 0 })
	).toEqual([])

	expect(
		makeContractionFinder({
			isContraction,
			isExpansion
		}).find(payload, { limit: 1 })
	).toEqual([
		[
			'ref',
			{
				_content_type_uid: 'bar',
				uid: 'cc662bdb-d52b-48c2-b80f-370a493eb480'
			},
			1
		],
		[
			'a.ref',
			{
				_content_type_uid: 'bar',
				uid: '0cbc95d6-4e6a-4244-9c95-e0646645aa33'
			},
			1
		],
		[
			'a.b.ref',
			{
				_content_type_uid: 'bar',
				uid: '4753203e-8c24-4f1b-9ac2-5a10be93c421'
			},
			1
		]
	])

	expect(
		makeContractionFinder({
			isContraction,
			isExpansion
		}).find(payload, { limit: 2 })
	).toEqual([
		[
			'ref',
			{
				_content_type_uid: 'bar',
				uid: 'cc662bdb-d52b-48c2-b80f-370a493eb480'
			},
			1
		],
		[
			'a.ref',
			{
				_content_type_uid: 'bar',
				uid: '0cbc95d6-4e6a-4244-9c95-e0646645aa33'
			},
			1
		],
		[
			'a.b.ref',
			{
				_content_type_uid: 'bar',
				uid: '4753203e-8c24-4f1b-9ac2-5a10be93c421'
			},
			1
		],
		[
			'a.b.c.ref',
			{
				_content_type_uid: 'bar',
				uid: '818720eb-9e83-448b-92d0-ab05d31dbf8c'
			},
			2
		],
		[
			'a.b.c.d.ref',
			{
				_content_type_uid: 'bar',
				uid: '85aee8b1-1354-4ac1-a0e2-9af251140d64'
			},
			2
		]
	])

	expect(
		makeContractionFinder({
			isContraction,
			isExpansion
		}).find(payload, { limit: 3 })
	).toEqual([
		[
			'ref',
			{
				_content_type_uid: 'bar',
				uid: 'cc662bdb-d52b-48c2-b80f-370a493eb480'
			},
			1
		],
		[
			'a.ref',
			{
				_content_type_uid: 'bar',
				uid: '0cbc95d6-4e6a-4244-9c95-e0646645aa33'
			},
			1
		],
		[
			'a.b.ref',
			{
				_content_type_uid: 'bar',
				uid: '4753203e-8c24-4f1b-9ac2-5a10be93c421'
			},
			1
		],
		[
			'a.b.c.ref',
			{
				_content_type_uid: 'bar',
				uid: '818720eb-9e83-448b-92d0-ab05d31dbf8c'
			},
			2
		],
		[
			'a.b.c.d.ref',
			{
				_content_type_uid: 'bar',
				uid: '85aee8b1-1354-4ac1-a0e2-9af251140d64'
			},
			2
		],
		[
			'a.b.c.d.e.ref',
			{
				_content_type_uid: 'bar',
				uid: '4320e926-169d-4655-b557-f00234fa27f6'
			},
			3
		]
	])
})
