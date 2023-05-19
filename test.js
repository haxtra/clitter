const Clitter = require('./')

class Cli extends Clitter {

	help = this.Help({
		app: 'clitter-test',
		about: 'Test/demo file for clitter.js',
		version: require('./package.json').version,
		commands: {
			demo: 		'feature showcase',
			spinner: 	'shows spinner animation until stopped',
			progress: 	'shows progress bar',
			prompt: 	'prompts user for input',
			confirm: 	['prompts user for confirmation',
							['command description', '']
						],
			password: 	['prompts user for password', [
								['command explained\nsecond line', 'example command'],
								['another command explained', 'another example\n--flags --opts'],
							]
						],
			opts: 		'test argument parsing',
			long_name_command: 'watch your space!',
			colors: 		'show color support',
			padder: 	'padding function',
			sleep: 		'sleeps for given time',
			pause: 		'holds execution until Enter is pressed',
			exec: 		'runs shell command',
		},
		flags: {
			'-n --noop': 'non operational flag\nanother line',
			'-l --long-flag-multi': 'long flag',
		},
		hide: ['help'],
		group: {
			help: 'Base',
			progress: 'Helpers',
			prompt: true,
			padder: true,
		},
		sections: {
			Info: 'Extended information...\nThat spans multiple lines...',
			Website: 'https://super.app',
			License: 'MIT',
		},
	})

	opts = {
		alias: {co:"colors"}
	}

	async cmd_demo() {
		// Showcase mostly everything

		this.header('Spinner')
		await this.cmd_spinner()

		this.header('Progress')
		await this.cmd_progress()

		this.header('Prompt')
		await this.cmd_prompt()

		this.header('Confirm')
		await this.cmd_confirm()

		this.header('Password')
		await this.cmd_password()

		this.header('Pause')
		await this.cmd_pause()

		this.header('Sleep')
		await this.cmd_sleep()

		this.header('Padder')
		this.cmd_padder()

		this.header('Messages')
		this.msgOk('All ok!')
		this.msgErr('Not ok!')

		await this.cmd_colors()

		this.header('Exec')
		await this.cmd_exec()

	}

	async cmd_progress() {

		const ticks = 500
		const progress = this.progress(ticks)

		for(let i=0; i<=ticks; i++){
			await this.sleep(8)
			progress.tick()
		}
	}

	async cmd_spinner() {
		let spin = this.spinner('charging flux capacitor')
		await this.sleep(3000)
		spin.done()

		spin = this.spinner('travelling in time')
		await this.sleep(3000)
		spin.fail()
	}

	async cmd_prompt() {
		const answer = await this.prompt('Just say ok:', (answer) => {
			if(answer == 'ok')
				return answer
		})

		console.log('You said', answer)
	}

	async cmd_confirm() {
		const answer1 = await this.confirm('Do it?')
		const answer2 = await this.confirm('Sure?', true)
		const answer3 = await this.confirm('Really?', false)
	}

	async cmd_password() {

		const PASS = await this.password(`Password (pass)?`, pass => {
			if(pass == 'pass')
				return pass
			else
				console.log('Invalid password')
		})

		console.log('Password is', PASS)
	}

	cmd_padder() {

		let pad;

		pad = this.padder('>', 20)
		console.log(pad('foo'), 'ok?')
		pad = this.padder('>', 20, '.')
		console.log(pad('foobar'), 'ok?')

		pad = this.padder('<', 20)
		console.log(pad('foo'), 'ok?')
		console.log(pad('foobar'), 'ok?')

		pad = this.padder('<', 20, '.')
		console.log(pad('foo'), 'ok?')
		console.log(pad('foobar'), 'ok?')

	}

	async cmd_pause() {
		await this.pause()
	}

	async cmd_sleep() {
		console.log('Sleeping for 2s')
		await this.sleep(2000)
		console.log('Woken up')
	}

	async cmd_exec() {
		await this.exec('ls -al')
	}

	async cmd_opts(argv) {

		console.log('_:', argv._)

		for(const key in argv){
			if(key == '_'){
				continue
			} else
				console.log(key, argv[key])
		}
	}

	cmd_long_name_command() {
		console.log("don't mind me!")
	}

	cmd_colors() {

		this.header('Colors')

		console.log(' ANSI 16 colors\n')

		const colors = [
			['blackDark', 'blackDim', 'black', 'blackBold'],
			['redDark', 'redDim', 'red', 'redBold'],
			['greenDark', 'greenDim', 'green', 'greenBold'],
			['yellowDark', 'yellowDim', 'yellow', 'yellowBold'],
			['blueDark', 'blueDim', 'blue', 'blueBold'],
			['magentaDark', 'magentaDim', 'magenta', 'magentaBold'],
			['cyanDark', 'cyanDim', 'cyan', 'cyanBold'],
			['whiteDark', 'whiteDim', 'white', 'whiteBold'],
		]

		const text = 'tada!'

		for(const color of colors){
			console.log(` ${this.color[color[0]](text)} ${this.color[color[1]](text)} ${this.color[color[2]](text)} ${this.color[color[3]](text)} `)
		}
	}
}

(new Cli()).run()
