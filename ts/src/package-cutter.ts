import {promises as Fs} from "fs"
import Path from "path"

interface CliArgs {
	readonly input: string
	readonly output: string
	readonly keys: readonly (readonly string[])[]
	readonly pretty: boolean
}

const defaultKeys = "scripts:devDependencies:target"

function displayHelp(): never {
	let helpStr = `A tool to cut out stuff not important for release from package.json

-i, --input:        Path to input package.json. Default: ./package.json
-o, --output:       Path to output package.json. Cannot be the same as input, unless --same-output is set.
-s, --same-output:  Boolean flag to allow input to be the same as output.
-k, --keys:         List of colon-separated keys that will be thrown away. Entries can contain dots to point into nested objects. Default: ${defaultKeys}
-h, -help, --help:  Display this text and exit.
-p, --pretty:       Pretty-print output JSON.`
	console.error(helpStr)
	process.exit(1)
}

function parseKeyStr(keyStr: string): string[][]{
	return keyStr.split(':').map(key => key.split("."))
}

function parseCli(): CliArgs {
	let input = "./package.json"
	let output: string | null = null
	let keysStr = defaultKeys
	let pretty = false
	let sameOutput = false
	for(let i = 2; i < process.argv.length; i++){
		let arg = process.argv[i]!
		if(arg === "-i" || arg === "--input"){
			i++
			input = process.argv[i]!
		} else if(arg === "-o" || arg === "--output"){
			i++
			output = process.argv[i]!
		} else if(arg === "-k" || arg === "--keys"){
			i++
			keysStr = process.argv[i]!
		} else if(arg === "-h" || arg === "-help" || arg === "--help"){
			displayHelp()
		} else if(arg === "-p" || arg === "--pretty"){
			pretty = true
		} else if(arg === "-s" || arg === "--same-output"){
			sameOutput = true
		} else {
			throw new Error("Unknown CLI key: " + arg)
		}
	}

	if(!input){
		throw new Error("No input file path passed.")
	}

	if(!output){
		throw new Error("No output file path passed.")
	}

	input = Path.resolve(input)
	output = Path.resolve(output)
	if(input === output && !sameOutput){
		throw new Error("Input file is the same as output. This may damage source file and most probably is an error. But if you're sure about that, you can pass --same-output to skip this check.")
	}

	if(!keysStr){
		throw new Error("No key list passed.")
	}

	return { input, output, keys: parseKeyStr(keysStr), pretty }
}

async function main(): Promise<void>{
	let args = parseCli()
	let packageJson = JSON.parse(await Fs.readFile(args.input, "utf-8"))
	const actuallyRemovedChains: (readonly string[])[] = []
	outer: for(let keyChain of args.keys){
		let container = packageJson
		for(let i = 0; i < keyChain.length - 1; i++){
			if(!container){
				continue outer
			}
			container = container[keyChain[i]!]
		}
		if(!container){
			continue
		}
		delete container[keyChain[keyChain.length - 1]!]
		actuallyRemovedChains.push(keyChain)
	}

	if(actuallyRemovedChains.length === 0){
		throw new Error("Failed to remove even one key from package.json. Check the configuration.")
	}

	let outStr = args.pretty? JSON.stringify(packageJson, null, 2) : JSON.stringify(packageJson)
	await Fs.writeFile(args.output, outStr, "utf-8")

	let chainsStr = actuallyRemovedChains.map(chain => chain.join(".")).join(", ")
	console.error(`Removed ${actuallyRemovedChains.length} key${actuallyRemovedChains.length > 1? "s": ""} from package.json: ${chainsStr}`)
}

async function wrappedMain(): Promise<void>{
	try {
		await main()
	} catch(e){
		console.error(e + "")
		process.exit(1)
	}
}

wrappedMain()