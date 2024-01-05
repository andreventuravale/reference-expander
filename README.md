### Usage

```javascript
const loader = async ({ type, uid }) => {
	const { json } = await fetch(`https://jsonplaceholder.typicode.com/${type}s/${id}`)

	return await json()
}

const input = {
	foo: {
		posts: [
			{
				ref: {
					type: 'post',
					id: '1'
				}
			},
			{
				ref: {
					type: 'post',
					id: '2'
				}
			}
		]
	}
}

const expander = await makeExpander({
	findContractions,
	getKey,
	limit: 10,
	loader,
	setter: ({ defaultSetter, expansion, path, target }) =>
		defaultSetter({
			expansion,
			path: `${path}.obj`,
			target
		})
})

expander.expand(input)

console.log(input)
```
