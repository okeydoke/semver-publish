const AWS = require('aws-sdk');
const { debugMessage } = require('./utils');

const DISTRIBUTION_ID_MAP = {
  'bdcdn-dev': 'E2GX7EXNNOP81Q',
  'bdcdn-ci': 'E2Y40Z4XPHSPWF',
  'bdcdn-qa': 'E3IS939CHFZZ27',
  'bdcdn-pe': 'E1ZRFU42QS5LW8',
  'bdcdn-stage': 'E23AG6STLTGQI9',
  'bdcdn-prod': 'EDH46CBWJMUTD'
};

function invalidate(bucketId, items, options) {
  const Items = !Array.isArray(items) ? [items] : items;

  return new Promise((resolve, reject) => {
    const params = {
      DistributionId: DISTRIBUTION_ID_MAP[bucketId],
      InvalidationBatch: {
        CallerReference: `semver${Date.now()}`, // unique identifier
        Paths: {
          Items,
          Quantity: Items.length
        }
      }
    };

    new AWS.CloudFront(options).createInvalidation(params, (err, data) => {
      debugMessage('uploadFile:listObjects (err, data)', err, data);
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
