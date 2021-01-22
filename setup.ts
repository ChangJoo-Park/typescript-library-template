const prompts = require('prompts');
const kebabCase = require('lodash.kebabcase')
const validate = require('validate-npm-package-name')
const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const username = require('username')
const package = require('./package.json')

const PROJECT_URL_TEMPLATE = `https://github.com/{{github}}/{{name}}`

const questions = [
  {
    type: 'text',
    name: 'name',
    message: 'What is your Project name? eg. my-first-lib',
    initial: path.basename(path.resolve(process.cwd())),
    format: (value) => kebabCase(value),
    validate: value => {
      const validated = validate(value.replace(/\s/g, ''))
      if (validated.errors && validated.errors.length > 0) {
        return validated.errors.join('\n')
      }
      return true
    }
  },
  {
    type: 'text',
    name: 'github',
    initial: username.sync(),
    message: 'What is your GitHub username? (for set issues in package.json)'
  }
];

const onSubmit = (prompt, answer) => {
  if (prompt.name === 'name') {
    console.log(`Your package name will be ${answer}`)
  }
};

(async () => {
  const { name, github } = await prompts(questions, { onSubmit });
  const canProcess = name !== undefined && github !== undefined
  if (!canProcess) {
    console.log('See you later :)');
    process.exit()
  }

  const homepage = PROJECT_URL_TEMPLATE
    .replace('{{name}}', name)
    .replace('{{github}}', github)

  package.homepage = homepage
  package.bugs = `${homepage}/issues`

  const originalPackageName = `${package.name}`
  Object.keys(package).forEach(key => {
    if (typeof package[key] === 'string' && package[key].includes(originalPackageName))
      package[key] = package[key].replace(originalPackageName, name)
  })

  console.log('Purging packages for setup')
  const needPurge = [
    '@types/lodash.kebabcase',
    '@types/prompts',
    'prompts',
    'validate-npm-package-name',
    'username'
  ]

  needPurge.forEach(key => {
    if (package['devDependencies'][key])
      delete package['devDependencies'][key]
  })

  console.log('Rewriting package.json...')
  fs.writeFile('package.json', JSON.stringify(package, null, 2), () => { })
  console.log('Removing node_modules')

  rimraf('node_modules', () => {
    rimraf('assets', () => {})
    rimraf('package-lock.json', () => {})
    rimraf('yarn.lock', () => {})
    rimraf('setup.ts', () => {
      console.log('\nCongratulations! Start build your lib!')
      console.log('Please run `npm install` or `yarn`')
    })
  })
})();
