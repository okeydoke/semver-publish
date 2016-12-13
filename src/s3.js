const AWS = require('aws-sdk');

const fs = require('fs');
const path = require('path');

function newClient(options) {
  return new AWS.S3(options);
}

/**
 * Retrieve array of objects from S3 based on key (folderPath)
 * @param  {String}   folderPath  S3 directory/key
 * @param  {Object}   s3Client    S3 client
 * @param  {Object}   options
 */
function existingContent(bucket, s3Client) {
  const MaxKeys = 1000000; // max amount of objects return in response

  return new Promise((resolve, reject) => {
    const params = {
      MaxKeys,
      Bucket: bucket,
      Prefix: 'events'
    };

    console.log('Checking for existing content');
    const exists = s3Client.listObjects(params, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}


function upload(folderPath, s3Client, options) {
  const { bucket, src } = options;

  return new Promise((resolve, reject) => {
    const params = {
      s3Params: {
        Bucket: bucket,
        ACL: 'public-read'
      }
    };

    let uploader;

    // Check if src is directory or file and use s3 accordingly
    if (fs.lstatSync(src).isDirectory()) {
      params.localDir = src;
      params.s3Params.Prefix = folderPath;
      uploader = s3Client.uploadDir(params);
    } else {
      const fileName = path.basename(src);
      params.localFile = src;
      params.s3Params.Key = path.join(folderPath, fileName);
      uploader = s3Client.uploadFile(params);
    }

    console.log(`Uploading to ${bucket}:${folderPath}`);

    uploader.on('error', err => {
      reject(err);
    });

    uploader.on('end', () => {
      resolve();
    });
  });
}

module.exports = {
  newClient,
  existingContent,
  upload
};
