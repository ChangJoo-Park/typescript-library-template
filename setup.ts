const prompts = require('prompts');
const kebabCase = require('lodash.kebabcase')
const validate = require('validate-npm-package-name')
const fs = require('fs')
const rimraf = require('rimraf')

const PROJECT_URL_TEMPLATE = `https://github.com/{{github}}/{{name}}`
const package = require('./package.json')

const questions = [
  {
    type: 'text',
    name: 'name',
    message: 'What is your Project name? eg. my-first-lib',
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
    message: 'What is your GitHub username? (for set issues in package.json)'
  },
  {
    type: 'confirm',
    name: 'analytics',
    message: 'Thank you for using my template! Can you send me a name and github username for improve?',
    initial: false
  },
];

const onSubmit = (prompt, answer) => {
  if (prompt.name === 'name') {
    console.log(`Your package name will be ${answer}`)
  }

  if (prompt.analytics) {
    console.log('Thanks you for help my template')
  }
};

(async () => {
  const { name, github, analytics } = await prompts(questions, { onSubmit });
  const canProcess = name !== undefined && github !== undefined && analytics !== undefined
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

  const needPurge = [
    '@types/lodash.kebabcase',
    '@types/prompts',
    'prompts',
    'validate-npm-package-name'
  ]
  needPurge.forEach(key => {
    if (package['devDependencies'][key])
      delete package['devDependencies'][key]
  })

  console.log('Rewriting package.json...')
  fs.writeFile('package.json', JSON.stringify(package, null, 2), () => { })
  console.log('Removing node_modules')

  rimraf('node_modules', () => {
    console.log('Please run `npm install` or `yarn`')
    rimraf('setup.ts', () => {
      console.log('Congratulations! Start build your lib!')
    })
  })
})();
