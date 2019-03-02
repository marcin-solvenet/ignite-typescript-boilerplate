const options = require('./options')
const { merge, pipe, assoc, omit, __ } = require('ramda')
const { getReactNativeVersion } = require('./lib/react-native-version')

/**
 * Is Android installed?
 *
 * $ANDROID_HOME/tools folder has to exist.
 *
 * @param {*} context - The gluegun context.
 * @returns {boolean}
 */
const isAndroidInstalled = function (context) {
  const androidHome = process.env['ANDROID_HOME']
  const hasAndroidEnv = !context.strings.isBlank(androidHome)
  const hasAndroid = hasAndroidEnv && context.filesystem.exists(`${androidHome}/tools`) === 'dir'

  return Boolean(hasAndroid)
}

/**
 * Let's install.
 *
 * @param {any} context - The gluegun context.
 */
async function install (context) {
  const {
    filesystem,
    parameters,
    ignite,
    reactNative,
    print,
    system,
    prompt,
    template
  } = context
  const { colors } = print
  const { red, yellow, bold, gray, blue, green } = colors

  const perfStart = (new Date()).getTime()

  const name = parameters.third
  const logo = red(`


                -aeaeaeaeaeae—             
            -eaeaeaeaeaeaeaeaeaeae-            
         /aeaeaeaeaeaeaeaeaeaeaeaeae\\         
       /aeaeaeaeaeaeaeaeaeaeaeaeaeaeae\\       
     /eaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaea\\       
    /aeaeaeaeaeaeaeaeaeaea/ |aeaeaeaeaeae\\      
   /aaeaeaeaeaeaeaeaeaeae/  |aeaeaeaeaeaea\\     
   aeaeaeaeaeaeaeaeaeae/    |eaeaeaeaeaeaea    
  |aeaeaeaeaeaeaeaeae/      |eaeaeaeaeaeaea|    
  aeaeaeaeaeaeaeaea/        |eaeaeaeaeaeaeae    
  eaeaeaeaeaeaeae/`) + yellow(`:`) + red(`\\        |aeaeaeaeaeaeaea    
  aeaeaeaeaeaea/`) + yellow(`::::`) + red(`\\       |eaeaeaeaeaeaeae    
  |aeaeaeaeae/`) + yellow(`:::::::`) + red(`\\      |eaeaeaeaeaeaea|    
   aeaeaeaeaeaeaeaeaea\\     |`) + yellow(`::::`) + red(`/aeaeaeaea   
   \\eaeaeaeaeaeaeaeaeaea\\   |`) + yellow(`:::`) + red(`/aeaeaeaea/     
    \\aeaeaeaeaeaeaeaeaeae\\  |`) + yellow(`::`) + red(`/aeaeaeaea/      
     \\aeaeaeaeaeaeaeaeaeae\\ |`) + yellow(`:`) + red(`/eaeeaeaea/       
       \\aeaeaeaeaeaeaeaeaea\\|/aeaeaeae/       
         \\aeaeaeaeaeaeaeaeaeaeaeaeae/         
            -eaeaeaeaeaeaeaeaeaeae-            
                -aeaeaeaeaeae—      

           __ _  ___ _ __ _  __ _ _ __  
          / _' |/ _ \\ '__| |/ _' | '_ \\ 
         | (_| |  __/ |  | | (_| | | | |
          \\__,_|\\___|_|  |_|\\__,_|_| |_|

`) + green(`
    🌳   Crafted with care in the Cotswolds.  🌳`) + yellow(`

                https://aerian.com/    

`);
  
  print.info(logo)
  const spinner = print
    .spin(`using the TypeScript boilerplate from Aerian Studios. You might want to make a cuppa while we get this ready. ☕️`)
    .succeed()

  // attempt to install React Native or die trying
  const rnInstall = await reactNative.install({
    name,
    version: getReactNativeVersion(context)
  })
  if (rnInstall.exitCode > 0) process.exit(rnInstall.exitCode)

  // remove the __tests__ directory and App.js that come with React Native
  filesystem.remove('__tests__')
  filesystem.remove('App.js')
  // copy our App, Tests & storybook directories
  spinner.text = '▸ copying files'
  spinner.start()
  filesystem.copy(`${ignite.ignitePluginPath()}/boilerplate/App`, `${process.cwd()}/App`, {
    overwrite: true,
    matching: '!*.ejs'
  })
  filesystem.copy(`${ignite.ignitePluginPath()}/boilerplate/Tests`, `${process.cwd()}/Tests`, {
    overwrite: true,
    matching: '!*.ejs'
  })
  filesystem.copy(`${ignite.ignitePluginPath()}/boilerplate/storybook`, `${process.cwd()}/storybook`, {
    overwrite: true,
    matching: '!*.ejs'
  })
  filesystem.copy(`${ignite.ignitePluginPath()}/boilerplate/types`, `${process.cwd()}/types`, {
    overwrite: true,
    matching: '!*.ejs'
  })
  spinner.stop()

  // --max, --min, interactive
  let answers
  if (parameters.options.max) {
    answers = options.answers.max
  } else if (parameters.options.min) {
    answers = options.answers.min
  } else {
    answers = await prompt.ask(options.questions)
  }

  // generate some templates
  spinner.text = '▸ generating files'
  const templates = [
    { template: 'index.js.ejs', target: 'index.js' },
    { template: 'README.md', target: 'README.md' },
    { template: 'ignite.json.ejs', target: 'ignite/ignite.json' },
    { template: 'babel.config.js', target: 'babel.config.js' },
    { template: 'tsconfig.json', target: 'tsconfig.json' },
    { template: 'tslint.json', target: 'tslint.json' },
    { template: 'rn-cli.config.js', target: 'rn-cli.config.js' },
    { template: 'Tests/Setup.tsx.ejs', target: 'Tests/Setup.tsx' },
    { template: 'storybook/storybook.ejs', target: 'storybook/storybook.js' },
    { template: '.env.example', target: '.env.example' }
  ]
  const templateProps = {
    name,
    igniteVersion: ignite.version,
    reactNativeVersion: rnInstall.version,
    vectorIcons: answers['vector-icons'],
    animatable: answers['animatable'],
    i18n: answers['i18n']
  }
  await ignite.copyBatch(context, templates, templateProps, {
    quiet: false,
    directory: `${ignite.ignitePluginPath()}/boilerplate`
  })

  /**
   * Append to files
   */
  // https://github.com/facebook/react-native/issues/12724
  filesystem.appendAsync('.gitattributes', '*.bat text eol=crlf')
  filesystem.append('.gitignore', '\n# Misc\n#')
  filesystem.append('.gitignore', '\n.env.example\n')
  filesystem.append('.gitignore', '.env\n')
  filesystem.append('.gitignore', 'dist\n')
  filesystem.append('.gitignore', '.jest\n')
  
  
  /**
   * Merge the package.json from our template into the one provided from react-native init.
   */
  async function mergePackageJsons () {
    // transform our package.json in case we need to replace variables
    const rawJson = await template.generate({
      directory: `${ignite.ignitePluginPath()}/boilerplate`,
      template: 'package.json.ejs',
      props: templateProps
    })
    const newPackageJson = JSON.parse(rawJson)

    // read in the react-native created package.json
    const currentPackage = filesystem.read('package.json', 'json')
    
    // deep merge, lol
    const newPackage = pipe(
      assoc(
        'dependencies',
        merge(currentPackage.dependencies, newPackageJson.dependencies)
      ),
      assoc(
        'devDependencies',
        merge(currentPackage.devDependencies, newPackageJson.devDependencies)
      ),
      assoc('scripts', merge(currentPackage.scripts, newPackageJson.scripts)),
      merge(
        __,
        omit(['dependencies', 'devDependencies', 'scripts'], newPackageJson)
      )
    )(currentPackage)

    // write this out
    filesystem.write('package.json', newPackage, { jsonIndent: 2 })
  }
  await mergePackageJsons()

  spinner.stop()

  // react native link -- must use spawn & stdio: ignore or it hangs!! :(
  spinner.text = `▸ linking native libraries`
  spinner.start()
  await system.spawn('react-native link', { stdio: 'ignore' })
  spinner.stop()

  // pass long the debug flag if we're running in that mode
  const debugFlag = parameters.options.debug ? '--debug' : ''

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  // NOTE(steve): I'm re-adding this here because boilerplates now hold permanent files
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  try {
    // boilerplate adds itself to get plugin.js/generators etc
    // Could be directory, npm@version, or just npm name.  Default to passed in values
    const boilerplate = parameters.options.b || parameters.options.boilerplate || 'ignite-typescript-boilerplate'

    await system.spawn(`ignite add ${boilerplate} ${debugFlag}`, { stdio: 'inherit' })

    // now run install of Ignite Plugins
    if (answers['dev-screens'] === 'Yes') {
      await system.spawn(`ignite add dev-screens@"~>2.2.0" ${debugFlag}`, {
        stdio: 'inherit'
      })
    }

    if (answers['vector-icons'] === 'react-native-vector-icons') {
      await system.spawn(`ignite add vector-icons@"~>1.0.0" ${debugFlag}`, {
        stdio: 'inherit'
      })
    }

    if (answers['i18n'] === 'react-native-i18n') {
      await system.spawn(`ignite add i18n@"~>1.0.0" ${debugFlag}`, { stdio: 'inherit' })
    }

    if (answers['animatable'] === 'react-native-animatable') {
      await system.spawn(`ignite add animatable@"~>1.0.0" ${debugFlag}`, {
        stdio: 'inherit'
      })
    }

  } catch (e) {
    ignite.log(e)
    throw e
  }

  // git configuration
  const gitExists = await filesystem.exists('./.git')
  if (!gitExists && !parameters.options['skip-git'] && system.which('git')) {
    // initial git
    const spinner = print.spin('configuring git')

    // TODO: Make husky hooks optional
    const huskyCmd = '' // `&& node node_modules/husky/bin/install .`
    system.run(`git init . && git add . && git commit -m "Initial commit." ${huskyCmd}`)

    spinner.succeed(`configured git`)
  }

  const perfDuration = parseInt(((new Date()).getTime() - perfStart) / 10) / 100
  spinner.succeed(`ignited ${yellow(name)} in ${perfDuration}s`)

  const androidInfo = isAndroidInstalled(context) ? ''
    : `\n\nTo run in Android, make sure you've followed the latest react-native setup instructions at https://facebook.github.io/react-native/docs/getting-started.html before using ignite.\nYou won't be able to run ${bold('react-native run-android')} successfully until you have.`

  const successMessage = `
    ${red('Ignite CLI')} ignited ${yellow(name)} in ${gray(`${perfDuration}s`)}

    To get started:

      cd ${name}
      react-native run-ios
      react-native run-android${androidInfo}
      ignite --help

    ${gray('Read the walkthrough at https://github.com/aerian-studios/ignite-typescript-boilerplate/blob/master/readme.md#boilerplate-walkthrough')}

    ${bold('Now get cooking! 🍽')}
  `


  print.info(successMessage)
}

module.exports = {
  install
}
