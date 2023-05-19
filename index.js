"use strict"

const minimist = require('minimist')

const color = {

	// help screen theme
	helpHeader: 		str => `\n\x1b[1;97m ${str}\x1b[0m`,
	helpGroupHeader:	str => `\n\x1b[97m  ${str}\x1b[0m`,
	helpCmd: 			str => `\x1b[1;94m${str}\x1b[0m`,
	helpCmdExample: 	str => `\x1b[32m${str}\x1b[0m`,
	helpCmdExampleDesc: str => `\x1b[2;37m${str}\x1b[0m`,
	helpFlags: 			str => `\x1b[33m${str}\x1b[0m`,

	// standard
	redDark: 		str => `\x1b[2;31m${str}\x1b[0m`,
	redDim: 		str => `\x1b[31m${str}\x1b[0m`,
	red: 			str => `\x1b[91m${str}\x1b[0m`,
	redBold: 		str => `\x1b[1;31m${str}\x1b[0m`,

	greenDark:		str => `\x1b[2;32m${str}\x1b[0m`,
	greenDim:		str => `\x1b[32m${str}\x1b[0m`,
	green: 			str => `\x1b[92m${str}\x1b[0m`,
	greenBold:		str => `\x1b[1;32m${str}\x1b[0m`,

	yellowDark:		str => `\x1b[2;33m${str}\x1b[0m`,
	yellowDim:		str => `\x1b[33m${str}\x1b[0m`,
	yellow: 		str => `\x1b[93m${str}\x1b[0m`,
	yellowBold:		str => `\x1b[1;33m${str}\x1b[0m`,

	blueDark:		str => `\x1b[2;34m${str}\x1b[0m`,
	blueDim:		str => `\x1b[34m${str}\x1b[0m`,
	blue: 			str => `\x1b[94m${str}\x1b[0m`,
	blueBold:		str => `\x1b[1;34m${str}\x1b[0m`,

	magentaDark:	str => `\x1b[2;35m${str}\x1b[0m`,
	magentaDim:		str => `\x1b[35m${str}\x1b[0m`,
	magenta: 		str => `\x1b[95m${str}\x1b[0m`,
	magentaBold:	str => `\x1b[1;35m${str}\x1b[0m`,

	cyanDark:		str => `\x1b[2;36m${str}\x1b[0m`,
	cyanDim:		str => `\x1b[36m${str}\x1b[0m`,
	cyan: 			str => `\x1b[96m${str}\x1b[0m`,
	cyanBold:		str => `\x1b[1;36m${str}\x1b[0m`,

	whiteDark:		str => `\x1b[2;37m${str}\x1b[0m`,
	whiteDim:		str => `\x1b[37m${str}\x1b[0m`,
	white: 			str => `\x1b[97m${str}\x1b[0m`,
	whiteBold:		str => `\x1b[1;37m${str}\x1b[0m`,

	blackDark:		str => `\x1b[2;30m${str}\x1b[0m`,
	blackDim:		str => `\x1b[30m${str}\x1b[0m`,
	black: 			str => `\x1b[90m${str}\x1b[0m`,
	blackBold:		str => `\x1b[1;30m${str}\x1b[0m`,

	gray:			str => `\x1b[2;37m${str}\x1b[0m`, // white dark
	grayBold:		str => `\x1b[1;2;37m${str}\x1b[0m`,

	// xterm256 generic
	xterm: 			(cid, str) => `\x1b[38;5;${cid}m${str}\x1b[0m`,

	// true color
	rgb: 			(colorStr, text) => `\x1b[38;2;${colorStr}m${text}\x1b[0m`,

}


class Clitter {

	/** Configuration object for cmd line arg parser, minimist module
		See https://github.com/substack/minimist#methods
	**/
	opts = {
		// alias: {},
		// default: {},
	}

	/** Help page configuration

		// command description format:
		commands: {
			cmd1: 'description',
			cmd2: ['description', '$cmd-example'],
			cmd3: ['description', ['#example-description', '$cmd-example'] ],
			cmd3: ['description', [
						['#example-description', '$cmd-example'],
						['#example-description', '$cmd-example'],
						[ null, '$cmd-example'],
					]],
		}
	**/
	help = {
		app: 'app',
		about: null,
		version: null,
		commands: {
			help: 'shows help information, this screen',
		},
		flags: {},
		group: {},
		hide: [],
		sections: {},
		config: {
			cmdPrepend: true, // prepend appName+cmdName to cmd example
		},
	}

	/** Help config extender
	 	// usage in extending class:
		help = this.Help({
			app: 'appname',
			about: 'my app info',
			...
		})
	**/
	Help(obj) {
		try {
			for(const key in obj){
				if(obj[key] !== null && typeof obj[key] === 'object')
					// merge obj
					this.help[key] = Object.assign(this.help[key], obj[key])
				else if(Array.isArray(obj[key]))
					// merge array
					this.help[key] = [].concat(this.help[key], obj[key])
				else
					// override
					this.help[key] = obj[key]
			}
			return this.help
		} catch {
			console.error('Error: invalid help object format')
		}
	}

	color = color

	// Run >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

	terminate(msg, code=1) {
		// Print error message and exit

		console.error(this.color.redBold('[err]'), msg)
		this.shutdown && this.shutdown(code)
		process.exit(code)
	}

	// async init(cmd){}
	// async shutdown(exitCode){}

	async run() {
		/** Command runner, the entry point **/

		// parse command line arguemnts
		this.argv = minimist(process.argv.slice(2), this.opts)

		// get command name
		const cmd = this.argv._[0]
			? this.argv._[0].replace(/-/g, '_')
			: null

		// call init if defined
		this.init && await this.init(cmd)

		// get handler
		const handler = cmd
			? 'cmd_' + cmd
			: 'cmd_help'

		// Run given command, but don't catch errors
		if(this[handler])
			await this[handler](this.argv)
		else
			this.terminate('invalid command, run "help" to see available commands')

		// exit gracefully
		this.shutdown && await this.shutdown(0)
	}

	// Commands >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

	async cmd_help() {

		// get available commands
		const commands = this.getCommands()

		// set spacers
		const spacer = width => ''.padStart(width, ' ')
		const stdSpacer = spacer(2)
		const cmdSpacer = spacer(3)
		const cmdWidth = Math.min(9, Math.max(...commands.map(cmd => cmd.length)))
		const cmdDescSpacer = spacer(cmdWidth + 5)
		const cmdInfoSpacer = spacer(cmdWidth + 7)

		// define printers
		const header = str => console.log(this.color.helpHeader(str))
		const groupheader = str => console.log(this.color.helpGroupHeader(str))
		const printSection = text => console.log(this.indent(stdSpacer, text))
		const printCm = (cmd, desc) => console.log(`${cmdSpacer}${this.color.helpCmd(cmd.replace(/_/g, '-').padEnd(cmdWidth, ' '))}  ${desc ?
										this.indent(cmdDescSpacer, desc).trimStart() : ''}`)
		const printED = (desc) => console.log(this.color.helpCmdExampleDesc(this.indent(cmdInfoSpacer, desc, {prefix:'# '})))
		const printEx = (cmd, example) => console.log(this.color.helpCmdExample(this.indent(cmdInfoSpacer,
										this.help.config.cmdPrepend ? `${this.help.app || 'app'} ${cmd} ${example}` : example)))

		/*** Print Help ***/

		// Help header - app name and version
		header(`${this.help.app || 'app'}${this.help.version ? this.color.gray(' v' + this.help.version) : ''}`)

		if(this.help.about)
			printSection(this.help.about)

		// Commands
		header('Commands')

		// print help for each command, where available
		for(const cmd of commands){

			let cmdHelp = this.help.commands[cmd] || ''

			// print group name or blank line?
			if(this.help.group[cmd]){
				if(this.help.group[cmd] === true)
					// prepend with blank line only
					console.log('')
				else
					// print group name
					groupheader(this.help.group[cmd])
			}

			// print commands and optional examples
			if(typeof cmdHelp == 'string'){
				// single desc
				printCm(cmd, cmdHelp)
			} else {
				// with examples
				printCm(cmd, cmdHelp[0])

				if(typeof cmdHelp[1] == 'string'){
					// single example
					printEx(cmd, cmdHelp[1])
				} else if(typeof cmdHelp[1][0] == 'string') {
					// desc example pair
					printED(cmdHelp[1][0])
					printEx(cmd, cmdHelp[1][1])
				} else {
					// multiple examples
					for(const entry of cmdHelp[1]){
						entry[0] && printED(entry[0])
						printEx(cmd, entry[1])
					}
				}
			}
		}

		// Flags info
		const flags = Object.keys(this.help.flags)
		if(flags.length){
			header('Flags')
			const flagWidth = Math.min(20, Math.max(...flags.map(flag => flag.length)))
			const descSpacer = spacer(flagWidth + 4)
			for(const flag in this.help.flags)
				console.log(`${stdSpacer}${this.color.helpFlags(flag.padEnd(flagWidth, ' '))}  ${this.indent(descSpacer, this.help.flags[flag]).trimStart()}`)
		}

		// Sections
		const sections = Object.keys(this.help.sections)
		for(const section of sections){
			header(section)
			printSection(this.help.sections[section])
		}

		// print last empty line for spacing
		console.log('')
	}

	// Internal >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

	getCommands() {
		/** Get list of runnable commands.
			Runnable command is any method that starts with `cmd_`.
			This is used for help screen to print list of available commands.
		**/

		// collect class methods recursively
		const methodSet = []
		let klass = Object.getPrototypeOf(this)

		while(true) {
			
			// loop all methods in current class
			const methods = []
			for(const method of Object.getOwnPropertyNames(klass)){
				// if it starts with cmd_then it is a command
				if(method.startsWith('cmd_'))
					methods.push(method.substring(4))
			}

			methodSet.push(methods)

			// bail out if origin class is reached
			if(klass.constructor.name == 'Clitter')
				break;

			// get parent class
			klass = Object.getPrototypeOf(klass.constructor.prototype)
		}

		// flatten and reverse so methods are listed in class extension order
		const methods = [].concat(...(methodSet.reverse()))

		// remove hidden commands
		for(const cmd of this.help.hide){
			const idx = methods.indexOf(cmd)
			if(idx > -1)
				methods.splice(idx, 1)
		}

		return methods
	}

	// Helpers >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

	arg(idx){
		return this.argv._[idx]
	}

	header(text) {
		console.log(`\n\x1b[94m ■ \x1b[1;97m${text}\x1b[0m\n`)
	}

	msgOk(message) {
		console.log(` ${this.color.green('✔')} ${this.color.white(message)}`)
	}

	msgErr(message) {
		console.log(` ${this.color.red('✘')} ${this.color.white(message)}`)
	}

	indent(spacer, text, opts={}){
		/** Indent multiline strings
			  :spacer   (str) string to use for indentation
			  :text     (str) text string
			  :opts
			    .array?   (bool) return array, otherwise string
			    .prefix?  (str) symbol to prefix each line with
		**/

		const out = []
		for(const line of text.split('\n'))
			out.push(spacer + (opts.prefix || '') + line)

		return opts.array ? out : out.join('\n')
	}

	padder(align, width, padChar=' '){
		/** Returns configured function that aligns strings automatically **/

		return function(str){
			if(align == '>')
				return str.padStart(width, padChar)
			else if(align == '<')
				return str.padEnd(width, padChar)
			else
				throw new Error('Padder: invalid align symbol, use < or >')
		}
	}

	clear() {
		/** Clear terminal contents **/
		return process.stdout.write('\x1Bc')
	}

	progress(steps, updateRateMs) {

		class ProgressBar {

			steps = null
			currentStep = 0

			updateRateMs = 200	// time in ms between repaints
			lastRepaintTime = 0

			numWidth = null 	// width of steps number
			barWidth = null 	// bar width after spacing

			terminalWidth = process.stdout.columns || 60

			readline = require('readline')

			barStart = Date.now()

			constructor(steps, updateRateMs=200) {

				this.steps = steps
				this.updateRateMs = updateRateMs

				this.setup()
			}

			setup() {
				/** Set runtime vars **/
				this.numWidth = String(this.steps).length
				this.barWidth = this.terminalWidth - 27 - (2 * this.numWidth)
			}

			setTotal(newSteps, stepsDelta) {
				/** Set new steps value to update bar on the fly **/

				if(newSteps)
					this.steps = newSteps
				else if(stepsDelta)
					this.steps += stepsDelta

				// adjust sizing
				this.setup()
			}

			setCurrent(newStep, stepDelta) {
				/** Set new current step value to update bar on the fly **/

				if(newStep)
					this.currentStep = newStep
				else if(stepDelta)
					this.currentStep += stepDelta
			}

			complete() {
				this.currentStep = this.steps
			}

			tick(steps=1) {

				this.currentStep += steps

				// check if it's time to repaint
				const stepTime = Date.now()
				if(((stepTime - this.lastRepaintTime) < this.updateRateMs) && this.currentStep != this.steps) {
					// skip this tick
					return;
				}

				this.lastRepaintTime = stepTime

				// Let's draw

				// clear last line
				// TODO: drop readline in favor of ANSI control chars
				this.readline.clearLine(process.stdout, 0)
				this.readline.cursorTo(process.stdout, 0, null)

				const percentage = this.currentStep / this.steps

				const doneBarLength = parseInt(this.barWidth * percentage)
				const todoBarLength = this.barWidth - doneBarLength

				// performance & ETA
				const sps = 1000 / ( (Date.now() - this.barStart) / this.currentStep )
				const eta = (this.steps - this.currentStep) / sps

				process.stdout.write(
					' [' +
					color.green(''.padStart(doneBarLength, '■')) +
					''.padStart(todoBarLength, '·') +
					'] ' +
					(parseInt(percentage * 100) + '%').padStart(4, ' ') + ' | ' +
					(this.currentStep + '').padStart(this.numWidth, ' ') +
					'/' +
					this.steps + ' | ' +
					(sps < 10 ? parseFloat(sps, 2) : parseInt(sps)) + '/s | ' +
					(eta < 60 ? parseInt(eta) + 's' : parseInt(eta / 60) + 'm') +
					''
				)

				// close line, if finished
				if(this.currentStep >= this.steps)
					process.stdout.write('\n')
			}
		}

		return new ProgressBar(steps, updateRateMs)
	}

	spinner(message) {

		const color = this.color

		class Spinner {

			isComplete = false
			isSuccess = false

			intervalRef = null

			readline = require('readline')

			constructor(message="Processing", opts={}){

				this.message = message

				this.spinnerLen = this.spinnerStr.length

				this.intervalRef = setInterval( () => {
					this.paint()
				}, 100)
			}

			done(msg) {
				clearInterval(this.intervalRef)
				this.isComplete = true
				this.isSuccess = true
				this.paint(msg)
			}

			fail(msg) {
				clearInterval(this.intervalRef)
				this.isComplete = true
				this.paint(msg)
			}

			paint(message) {

				// clear last line
				this.readline.clearLine(process.stdout, 0)
				this.readline.cursorTo(process.stdout, 0, null)

				if(!this.isComplete) {
					// in progress
					process.stdout.write(
						' \x1B[?25l' + // hide cursor
						this.spinner() +
						' ' +
						this.message
					)
				} else {

					const text = this.isSuccess
						? ` ${color.green('✔')} ${color.gray(message || this.message)}`
						: ` ${color.red('✘')} ${color.redBold(message || this.message)}`

					process.stdout.write(text + '\x1B[?25h\n') // re-enable cursor
				}
			}

			spinnerStr = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
			spinnerPos = -1
			spinnerLen = 0

			spinner() {
				this.spinnerPos += 1
				if(this.spinnerPos == this.spinnerLen)
					this.spinnerPos = 0
				return color.green( this.spinnerStr[this.spinnerPos] )
			}
		}

		return new Spinner(message)
	}

	async sleep(ms) {
		return new Promise(resolve =>
			setTimeout(x => resolve(true), ms)
		)
	}

	async prompt(prompt, validator) {
		/** Prompt user for input, validator must return undefined (or nothing) for this to work **/

		let answer;

		while(answer === undefined)
			answer = await this._prompt(prompt, validator)

		return answer
	}

	async _prompt(prompt, validator) {

		return new Promise( (resolve, reject) => {

			const readline = require('readline').createInterface({
				input: process.stdin,
				output: process.stdout
			})

			readline.question(prompt + ' ', (ans) => {
				resolve(validator(ans))
				readline.close()
			})
		})
	}

	async confirm(prompt, dflt) {

		const c = this.color.yellowDim
		const d = this.color.yellow

		const yn = (dflt === true || dflt === false
						? (dflt === true
								? c(' [') + d('Y') + c('|n]')
								: c(' [y|') + d('N') + c(']')
								// ? c(' [') + d('Y') + c('/n]')
								// : c(' [y/') + d('N') + c(']')
							)
						// : c(' [y/n]')
						: c(' [y|n]')
					)
		let answer;
		while(answer === undefined){
			answer = await this._prompt(prompt + yn, ans => {
				if(ans == '') {
					// default option
					if(dflt === true || dflt === false)
						return dflt
				} else if(ans == 'y' || ans == 'Y')
					return true
				else if(ans == 'n' || ans == 'N')
					return false
			})
		}

		return answer
	}

	async password(prompt, validator, maskChar) {

		let pass;

		while(pass === undefined)
			pass = await this._promptPassword(prompt, validator, maskChar)

		return pass
	}

	async _promptPassword(prompt, validator, maskChar='') {

		return new Promise( (resolve, reject) => {

			const readline = require('readline')

			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
				terminal: true,
			})

			rl.question(prompt + ' ', function(password) {
				resolve(validator(password))
				rl.close()
			})

			rl._writeToOutput = function(char) {
				if(char.charCodeAt(0) == 13)
					// print new line on Enter
					process.stdout.write('\n')
				else if(maskChar)
					// print star instead of character
					rl.output.write(maskChar)
			}
		})
	}
	async pause(message) {
		/** Hold execution until an Enter key is pressed
			Uses password engine to avoid character print
		**/

		let answer;
		while(answer === undefined)
			answer = await this._promptPassword(message || 'Press Enter to continue...', ans => true, false)
	}

	async exec(cmd, opts={}){
		/** Execute command and pass output to the console.
			  :cmd    (str|arr) full command string or array: [cmd, [args]]
			  :opts?  (obj) see https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
		**/

		const {spawn} = require('child_process')

		// convert string command to array accepted by .spawn
		if(typeof cmd == 'string'){
			const idx = cmd.indexOf(' ')
			if(idx > 0){
				const c1 = cmd.substring(0, idx)
				const c2 = cmd.substring(idx+1)
				cmd = [c1, c2.split(' ')]
			} else {
				cmd = [cmd, []]
			}
		}

		return new Promise( (resolve, reject) => {

			const proc = spawn(cmd[0], cmd[1], opts)

			proc.stdout.on('data', data => {
				process.stdout.write(data + '\n')
			})
			proc.stderr.on('data', data => {
				process.stderr.write(data + '\n')
			})
			proc.on('error', (error) => {
				resolve({code:error.errno, error})
			})
			proc.on('close', code => {
				resolve({code})
			})
		})
	}

	async execCapture(cmd, opts={}){
		/** Execute command and capture output.
			  :cmd    (str) full command string
			  :opts?  (obj) see https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback
		**/

		const {exec} = require('child_process')

		return new Promise( (resolve, reject) => {
			exec(cmd, opts, (error, stdout, stderr) => {
				const obj = {
					code: 0,
					stdout,
					stderr
				}
				if(error){
					obj.code = error.code
					obj.error = error
				}
				resolve(obj)
			})
		})
	}
}

module.exports = Clitter