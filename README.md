# Clitter

Power armor for command line Node.js applications.

Clitter wraps your application and provides it with a command based interface, TUI helpers, formatters, and a nifty, semi-automatic help screen.


## Features

- command based app interface
- command line argument parser
- semi-auto help page
- terse API
- TUI helpers
    - prompt, confirm, password
    - progress bar, spinner
    - colorizers and formatters
    - shell exec handler
    - and more
- single dependency (minimist)


## Table of Contents

- [Install](#install)
- [Basic Usage](#basic-usage)
- [Argument parsing](#argument-parsing)
- [Lifecycle: Init & Shutdown](#lifecycle-init--shutdown)
- [Help Screen](#help-screen)
- [Helpers](#helpers)
    - [Input](#input)
        - [Confirm](#confirm)
        - [Prompt](#prompt)
        - [Password](#password)
    - [Display](#display)
        - [Clear](#clear)
        - [Progress](#progress)
        - [Spinner](#spinner)
    - [Control Flow](#control-flow)
        - [Pause](#pause)
        - [Sleep](#sleep)
        - [Terminate](#terminate)
    - [Blocks](#blocks)
        - [Header](#header)
        - [msgOk](#msgok)
        - [msgErr](#msgerr)
    - [Formatters](#formatters)
        - [Indent](#indent)
        - [Padder](#padder)
    - [Colors](#colors)
        - [Basic ANSI 16 colors](#basic-ansi-16-colors)
        - [xterm 256 colors](#xterm-256-colors)
        - [RGB True Color](#rgb-true-color)
    - [Shell Commands](#shell-commands)
        - [Exec](#exec)
        - [Exec Capture](#exec-capture)
- [Note](#note)
- [License](#license)


## Install

```
npm i clitter
```

## Basic Usage

Clitter will make your handlers runnable from command line via commands. Any method that starts with `cmd_` will be accessible to command line via its name, with `_` characters translated to `-`. For example method `cmd_add_user` will run with `add-user` command. Methods can be sync or async.

```js
const Clitter = require('clitter')

class MyApp extends Clitter {
    cmd_mycommand(argv) {
        console.log(argv)
    }
}

(new MyApp()).run()
```

Terminal
```console
$ myapp mycommand -abc=3 --flag --option=value
{
    _: ['mycommand'],
    a: true,
    b: true,
    c: 3,
    flag: true,
    option: 'value',
}
```

## Argument parsing

Clitter uses [`minimist`](https://github.com/minimistjs/minimist) module to handle argument parsing. Parser config is set via `opts` class property, and is optional.

```js
class MyApp extends Clitter {
    opts = {
        alias: {
            // map argument short forms to long ones
            // mypp cmd -x  =>  argv = {_:['cmd'], x:true, expanded:true}
            x: 'expanded',
        },
        default: {
            // default argunment values
            // myapp cmd  =>  argv = {_:['cmd'], name:'value'}
            name: 'value',
        }
    }
}
```
Options:

- `opts.string` - (str|arr) argument names to always treat as strings
- `opts.boolean` - (str|arr) argument names to always treat as booleans
- `opts.alias` - (obj) mapping of argument names to their alias names, string or array
- `opts.default` - (obj) mapping of argument names to default values
- `opts.stopEarly` - (bool) when `true`, populate `argv._` with everything after the first non-option
- `opts.unknown` - (fn) function which is invoked with an argument name not defined in the opts. If the function returns false, the unknown option is not added to argv.
- `opts['--']` - (bool) when `true`, populate `argv._` with everything before the `--` and `argv['--']` with everything after the `--`


## Lifecycle: Init & Shutdown

`init` and `shutdown` are optional methods that are called before and after command execution. This is your chance to setup environment, run checks and then cleanup afterwards. `shutdown` is also called on termination with `.terminate`.

```js
class MyApp extends Clitter {

    // init receives command name
    async init(cmdName) {}

    // handler receives command args
    async cmd_mycommand(args) {}

    // shutdown receives exit code
    async shutdown(exitCode) {}
}
```


## Help Screen

Clitter provides semi-automatic help screen that needs little configuration to look good. It will pick up all defined commands and display them in declared order. It's up to you to add command descriptions, examples, and other info. Help screen will be shown when app is invoked without arguments, or via help command, ie `myapp help`. All description strings and code examples can be multiline, broken with `\n`, and it should print nicely aligned.

All fields are optional.

```js
class MyApp extends Clitter {

    help = this.Help({
        // Name of the app
        app: 'superapp',
        // Short information about the app
        about: 'SuperApp does magic and more',
        // Version of the app
        version: require('./package.json').version,
        // Command descriptions
        commands: { // showing several formats
            // most basic, description only
            mycommand: 'show command line args',
            // with single example
            mycommand: ['description', 'command example'],
            // single example with own description
            mycommand: ['description', ['cmd desc', 'cmd example'] ],
            // multiple examples with descriptions
            mycommand: ['description', [
                        ['cmd desc', 'cmd example'],
                        ['cmd desc', 'cmd example'],
            ]],
        },
        // Group commands, separate them by empty line, or a header
        group: {
            // blank line
            mycommand: true,
            // header
            mycommand: 'Admin',
        },
        // Describe flags used by the app
        flags: {
            '-f --fast': 'make the app run faster',
            '-m --magic': 'enable real magic',
        },
        // Sections provide additional information.
        // Keys are arbitrary and will serve as section header.
        // Multiline text is supported, naturally.
        sections: {
            'Advanced Usage': '...',
            Website: 'https://super.app',
            Repo:    'https://github.com/void/superapp',
            Author:  'Mr Nobody (hello@dev.null)',
            License: 'MIT',
        },
        // Commands to hide from the help screen.
        hide: ['secretcmd'],
        // Help page config options
        config: {
            // automatically prepend app and command names to command examples
            cmdPrepend: true,
        },
    })
}

```

## Helpers

All helpers are available from within handlers via `this`, ex:

```js
cmd_somecmd() {
    const answer = await this.confirm('All good?')
}
```
Some methods are async, pay attention to that.

Most can be seen in action by running `npm run demo` in the package root.


### Input

#### Confirm

`.confirm(message, default?)`

Get answer to yes/no question. Default is suggested when provided, and can be chosen by a single press of the `Enter` key.

```js
const maybe = await this.confirm('Really?', true)
// Really? [Y/n]
```


#### Prompt

`.prompt(message, validator)`

Prompt user for input. `validator` param is a function that must evaluate input, and return value upon success. When `undefined` (or nothing), is returned from the validator, the prompt is repeated. Input is always a string.

```js
const year = await this.prompt('What year?', inpt => {
    inpt = parseInt(inpt)
    if(inpt >= 2000 && inpt <= 2050)
        return inpt
})
```

#### Password

`.password(message, validator, mask='')`

Prompt user for password. `validator` has the same characteristic as with prompt. `mask` is a string that will be used in place of a typed letter, ie `*`. Default empty string does not print anyting.

```js
const pass = await this.password(`Password?`, pass => {
    if(pass == 'pass')
        return pass
    else
        console.log('Invalid password')
})
```


### Display

#### Clear

`.clear()`

Clear entire terminal screen.

```js
this.clear()
```

#### Progress

`.progress(steps, updateRateMs=200)`

Shows animated progress bar. Provides information on current/total steps, steps per second, and the remaining time. `updateRateMs` param adjusts how often the bar is updated, with millisecond resolution. Note that nothing else can output to the screen when progress is running, or it will break the display.

```js
const progress = await this.progress(10000)
while(...) {
    // tick by one
    porgress.tick()
    // tick by any
    porgress.tick(100)
}
```
`[■■■■■■■■■■■■···················]  48% | 241/500 | 118/s | 3s`

Progress bar can also be adjusted on the fly:

```js
progress.setCurrent(int) // adjust current step and update progress
progress.setTotal(int)   // adjust total steps required to complete
progress.complete()      // complete immediately, fill bar to 100%
```


#### Spinner

`.spinner(message)`

Shows animated spinner until stopped. Can complete with success or failure, the icon will be set accordingly. Optionally both `.done()` and `.fail()` methods take string arg that will replace original message. As with `.progress`, don't output anything when the spinner is running.

```js
const spinner = this.spinner('Processing...')
// ...something time taking...
// then complete with success
spinner.done()
// or failure
spinner.fail('Something went wrong!')
```


### Control Flow

#### Pause

`.pause(message?)`

Pauses program execution until `Enter` key is pressed. Takes custom message as a parameter.

```js
await this.pause()
```

#### Sleep

`.sleep(ms)`

Sleeps for given amount of milliseconds.

```js
await this.sleep(1000) // one second
```

#### Terminate

`.terminate(message, code=1)`

Terminates program execution with error message. Takes optional exit code as a parameter.
Calls `shutdown` with exit code, before quitting.

```js
this.terminate('The computer said no.')
```


### Blocks

#### Header

`.header(text)`

Displays nicely padded header.

```js
this.header('Boot')
```

#### msgOk

`.msgOk(message)`

Displays success message with an icon.

```js
this.msgOk('All good')
// ✔ All good
```

#### msgErr

`.msgErr(message)`

Displays failure message with an icon.

```js
this.msgErr('Not good')
// ✘ Not good
```


### Formatters

#### Indent

`.indent(spacer, text, opts)`

Formats multi-line strings with consistent indentation.

Parameters:
- `spacer`- (str) string used to indent each line with
- `text` - (str) text to transform
- `opts.prefix?` - (str) string to prefix each line with
- `opts.array?` (bool) return lines as array, otherwise string


#### Padder

`.padder(align, width, padChar=' ')`

Returns configured function that will pad and align given string.

Params:
- `align` - (str) left `<` or right `>`
- `width` - (int) width of resulting string
- `padChar` - (str) character to pad with, defaults to space

```js
const pad = this.padder('>', 10, '.')
const txt = pad('hello')
> '.....hello'
```

### Colors

Functions for string coloring.

> Note: Color handling to be reworked in future version to be more flexible.

#### Basic ANSI 16 colors

```js
this.color.red(str)
this.color.redDark(str)
this.color.redDim(str)
this.color.redBold(str)

this.color.green(str)
this.color.greenDark(str)
this.color.greenDim(str)
this.color.greenBold(str)

this.color.yellow(str)
this.color.yellowDark(str)
this.color.yellowDim(str)
this.color.yellowBold(str)

this.color.blue(str)
this.color.blueDark(str)
this.color.blueDim(str)
this.color.blueBold(str)

this.color.magenta(str)
this.color.magentaDark(str)
this.color.magentaDim(str)
this.color.magentaBold(str)

this.color.cyan(str)
this.color.cyanDark(str)
this.color.cyanDim(str)
this.color.cyanBold(str)

this.color.white(str)
this.color.whiteDark(str)
this.color.whiteDim(str)
this.color.whiteBold(str)

this.color.black(str)
this.color.blackDark(str)
this.color.blackDim(str)
this.color.blackBold(str)

this.color.gray(str)
this.color.grayBold(str)
```

#### xterm 256 colors

```js
this.color.xterm(colorCode, str)
this.color.xterm(184, str)
```

#### RGB True Color

```js
this.color.rgb(colorStr, text)
this.color.rgb('130;50;240', text)
```

### Shell Commands

#### Exec

`.exec(cmd, options?)`

Execute shell command and let it print its output to the console immediately. Uses `child_process.spawn`.

You can use strings for simple commands, but for anything more complicated than that, use array in the form: `[cmd, [arg1, arg2]]`. For options, see Node [docs](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options).

```js
const res = await this.exec(cmd)
res.code  // exit code
res.error // on error
```

#### Exec Capture

`.execCapture(cmd, options?)`

Execute shell command and capture its output. Uses `child_process.exec`.

Use string for command, for options, see Node [docs](https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback).

```js
const res = await this.execCapture(cmd)
res.code   // exit code
res.stdout
res.stderr
res.error  // on error
```

## Note

This library was tested on Linux only.


## License

MIT

![](https://hello.haxtra.com/gh-clitter)