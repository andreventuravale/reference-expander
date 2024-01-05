type ContractionFinderFactoryOptions = {
	isContraction: <T>(something: T) => boolean

	isExpansion: <T>(something: T) => boolean
}

type ContractionFinder = {
	find: <Input, Contraction>(input: Input, options?: { limit?: number }) => Contraction[]
}

type ContractionFinderFactory = (options: ContractionFinderFactoryOptions) => ContractionFinder

type Setter = <Target, Expansion>(
	target: Target,
	path: string,
	expansion: Expansion,
	defaultSetter: Setter
) => void

type ExpanderFactoryOptions = {
	findContractions: <Input, Contraction>(input: Input, options: { limit: number }) => Contraction[]

	getKey: <Something, Key>(something: Something) => Promise<Key>

	limit: number

	loader: <Contraction, Expansion>(contraction: Contraction) => Promise<Expansion>

	setter?: Setter
}

type Expander = { expand: <Input>(input: Input) => Promise<void> }

type ExpanderFactory = (options: ExpanderFactoryOptions) => Expander
