const DEBUG = process.env.debug || false;

function debugMessage(...args) {
  if (DEBUG) {
    args.forEach(a => console.info('DEBUG:', a));
    console.log('-------');
  }
}

const intersection = (...arrays) =>
  [...new Set([].concat(...arrays))].filter(toFind =>
    arrays.every(arr => arr.some(el => el === toFind)
  )
);

module.exports = {
  debugMessage,
  intersection
};
