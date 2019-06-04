const chalk = require('chalk');
const fetch = require('isomorphic-fetch');
const fs = require('fs');
const path = require('path');

const log = (...args) =>
  console.log(chalk.gray(new Date().toISOString()), ...args);

const dirContents = fs.readdirSync(path.resolve(__dirname));

if (dirContents.indexOf('icons') === -1) {
  log(chalk.magenta('Creating icons folder'));
  fs.mkdirSync(path.resolve(__dirname, 'icons'));
}

if (dirContents.indexOf('success.txt') === -1) {
  console.log();
  log(chalk.magenta('Creating success.txt file'));
  fs.writeFileSync(path.resolve(__dirname, 'success.txt'), '');
}

console.log();
log(chalk.magenta('Creating failure.txt file'));
fs.writeFileSync(path.resolve(__dirname, 'failure.txt'), '');

const successFiles = fs
  .readFileSync(path.resolve(__dirname, 'success.txt'), 'utf-8')
  .trim()
  .split('\n');

async function main() {
  console.log();
  log(chalk.blue('Fetching icon names'));
  const data = await fetch(
    'https://material.io/tools/icons/static/data.json'
  ).then(x => x.json());
  log(chalk.green('Icon names fetched!'));
  const icons = data.categories.reduce((acc, each) => {
    acc.push(...each.icons);
    return acc;
  }, []);
  console.log();
  log(chalk.red('Total number of icons - '), chalk.red(icons.length));
  const iconTypes = ['sharp', 'baseline', 'twotone', 'round', 'outline'];
  for (const [i, icon] of icons.entries()) {
    for (const [j, type] of iconTypes.entries()) {
      if (successFiles.indexOf(icon.id + '-' + type) === -1) {
        console.log();
        log(
          chalk.blue(i + 1 + '.' + (j + 1) + ')'),
          chalk.black.bgBlue(icon.id),
          chalk.blue('of type'),
          chalk.black.bgBlue(type)
        );
        const assetUrl =
          'https://material.io/tools/icons/static/icons/' +
            (icon.imageUrls && icon.imageUrls[type]) ||
          type + '-' + icon.id + '-24px.svg';
        log(chalk.magenta('Initiating fetch.'));
        try {
          const svgIcon = await fetch(assetUrl).then(x => {
            if (x.ok) {
              return x.text();
            }
            throw new Error(x.statusText);
          });
          fs.writeFileSync(
            path.resolve(__dirname, 'svg', icon.id + '-' + type + '.svg'),
            svgIcon
          );
          fs.appendFileSync(
            path.resolve(__dirname, 'success.txt'),
            icon.id + '-' + type + '\n'
          );
          log(chalk.green('Fetch successful.'));
        } catch (ex) {
          fs.appendFileSync(
            path.resolve(__dirname, 'failure.txt'),
            icon.id + '-' + type + '\n'
          );
          log(chalk.red('[Fetch failure]', ex.message));
        }
      }
    }
  }
}

main();
