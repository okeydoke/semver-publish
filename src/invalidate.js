const AWS = require('aws-sdk');
const util = require('util');

const { prependPathSlash, debugMessage, uniq } = require('./utils');

// TODO write some tests for this
// The reasoning behind this was to reduce the amount of invalidations paths to reduce costs
// but it seems like when using wild cards you're still changed for the total amount of paths
// that are invalidated anyway...
function reducePaths(paths) {
  return uniq(paths.map(item => `${item.split('.')[0]}*`));
}

// TODO encode <space> ~ @ ' characters
// TODO check for existing invalidation with same paths and skip if already on there
function invalidate(DistributionId, items, options) {
  const Items = !Array.isArray(items) ? [items] : items;

  return new Promise((resolve, reject) => {
    const params = {
      DistributionId,
      InvalidationBatch: {
        CallerReference: `semver-publish-${Date.now()}`, // unique identifier
        Paths: {
          Items: Items.map(p => prependPathSlash(p)), // paths must contain a forward slash
          Quantity: Items.length
        }
      }
    };

    debugMessage('invalidate:params', util.inspect(params, { depth: null }));

    new AWS.CloudFront(options).createInvalidation(params, (err, data) => {
      debugMessage('invalidate:createInvalidation (err, data)', err, data);
      if (err) {
        console.log(err);
        return reject(err);
      }

      return resolve(data);
    });
  });
}

module.exports = {
  invalidate
};
