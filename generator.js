const chalk = require('chalk');
const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');

const parser = new xml2js.Parser();

function toPascalCase(name) {
  const exceptions = {
    '360': 'ThreeSixty',
    '3d': 'ThreeD',
    '4k': 'FourK',
  };
  return name
    .split('_')
    .map(each => {
      if (Object.keys(exceptions).indexOf(each) > -1) {
        return exceptions[each];
      }
      return each.charAt(0).toUpperCase() + each.substr(1).toLowerCase();
    })
    .join('');
}

function elementConstructor(children, element = '') {
  Object.keys(children).forEach(child => {
    children[child].forEach(each => {
      element += `<${child}`;
      const attributes = Object.keys(each.$ || {}).reduce((acc, key) => {
        acc += ` ${key}="${each.$[key]}"`;
        return acc;
      }, '');
      if (attributes) {
        element += attributes;
      }
      if (
        Object.keys(each).length > 1 ||
        Object.keys(each).indexOf('$') === -1
      ) {
        // Has children
        element +=
          '>' +
          elementConstructor(
            Object.keys(each).reduce((acc, ele) => {
              if (ele !== '$') {
                acc[ele] = each[ele];
              }
              return acc;
            }, {})
          ) +
          `</${child}>`;
      } else {
        element += ' />';
      }
    });
  });
  return element;
}

const rootFolderContents = fs.readdirSync(path.resolve(__dirname));

if (rootFolderContents.indexOf('icons') === -1) {
  fs.mkdirSync(path.resolve(__dirname, 'icons'));
  fs.mkdirSync(path.resolve(__dirname, 'icons', 'utils'));
} else {
  try {
    fs.mkdirSync(path.resolve(__dirname, 'icons', 'utils'));
  } catch (ex) {
    // Ignore
  }
}

// Copy utils to icons folder
fs.readdirSync(path.resolve(__dirname, 'utils')).forEach(each => {
  fs.copyFileSync(
    path.resolve(__dirname, 'utils', each),
    path.resolve(__dirname, 'icons', 'utils', each)
  );
});

fs.writeFileSync(path.resolve(__dirname, 'icons', 'index.js'), '');

const files = fs.readdirSync(path.resolve(__dirname, 'svg'));

for (file of files) {
  const svg = fs.readFileSync(path.resolve(__dirname, 'svg', file), 'utf-8');
  parser.parseString(svg, (err, result) => {
    try {
      const { viewBox } = result.svg.$;
      const children = Object.keys(result.svg)
        .filter(key => key !== '$')
        .reduce((acc, key) => {
          if (key === 'path') {
            acc[key] = result.svg[key].filter(each => each.$.fill !== 'none');
          } else {
            acc[key] = result.svg[key];
          }
          return acc;
        }, {});
      let element = elementConstructor(children);
      const totalChildren = Object.keys(children).reduce(
        (acc, each) => acc + children[each].length,
        0
      );
      if (totalChildren > 1) {
        element += '<g>' + element + '</g>';
      }
      const [name, type] = file.replace('.svg', '').split('-');
      const suffices = {
        baseline: '',
        twotone: '_twoTone',
        outline: '_outLined',
        round: '_round',
        sharp: '_sharp',
      };
      const fileName = toPascalCase(name + suffices[type]);
      fs.writeFileSync(
        path.resolve(__dirname, 'icons', fileName + '.js'),
        `import React from 'react';\nimport createSvg from './utils/createSvg';\n\nexport default createSvg('${element}', '${fileName}', '${viewBox}');`
      );
      fs.appendFileSync(
        path.resolve(__dirname, 'icons', 'index.js'),
        `export { default as ${fileName} } from './${fileName}';\n`
      );
    } catch (e) {
      console.error(chalk.red(e.message));
      console.log(result.svg);
      console.log(file, result);
      process.exit();
    }
  });
}
