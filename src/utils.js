const DEBUG = process.env.debug || false;

function appendPathSlash(path) { // append slash if needed
  return path.charAt(path.length - 1) !== '/'
          && path.length > 0
          ? `${path}/`
          : path;
}

function debugMessage(...args) {
  if (DEBUG) {
    if (![1, '1', true, 'true'].includes(DEBUG) && args.filter(a => String(a).includes(DEBUG)).length === 0) {
      return;
    }

    args.forEach(a => console.info('DEBUG:', a));
    console.log('-------');
  }
}

function errorMessage(error) {
  console.error(`${error.message || error}\n`);
  process.exit(1);
}


const intersection = (...arrays) =>
  [...new Set([].concat(...arrays))].filter(toFind =>
    arrays.every(arr => arr.some(el => el === toFind)
  )
);

function prependPathSlash(path) { // prepend slash if needed
  return path.charAt(0) !== '/'
          && path.length > 0
          ? `/${path}`
          : path;
}

const uniq = a => [...new Set(a)];

module.exports = {
  appendPathSlash,
  debugMessage,
  errorMessage,
  intersection,
  prependPathSlash,
  uniq
};
