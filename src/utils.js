const DEBUG = process.env.debug || false;

function debugMessage(...args) {
  if (DEBUG) {
    if (![1, '1', true, 'true'].includes(DEBUG) && args.filter(a => String(a).includes(DEBUG)).length === 0) {
      return;
    }

    args.forEach(a => console.info('DEBUG:', a));
    console.log('-------');
  }
}

const intersection = (...arrays) =>
  [...new Set([].concat(...arrays))].filter(toFind =>
    arrays.every(arr => arr.some(el => el === toFind)
  )
);

function appendFolderSlash(folder) { // append slash if needed
  return folder.charAt(folder.length - 1) !== '/'
          && folder.length > 0
          ? `${folder}/`
          : folder;
}

module.exports = {
  appendFolderSlash,
  debugMessage,
  intersection
};
