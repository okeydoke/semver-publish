const AWS = require('aws-sdk');

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

function newClient(options) {
  return new AWS.S3(options);
}

/**
 * Retrieve array of objects from S3 based on key (folderPath)
 * @param  {String}   folderPath  S3 directory/key
 * @param  {Object}   s3Client    S3 client
 * @param  {Object}   options
 */
function getExistingFiles(Bucket, prefix, s3Client) {
  const MaxKeys = 100000; // max amount of objects return in response

  const Prefix = prefix.indexOf('/') !== -1 ? prefix : `${prefix}/`; // add trailing slash if needed
  const params = {
    Bucket,
    MaxKeys,
    Prefix
  };

  return new Promise((resolve, reject) => {
    console.log('Checking for existing content...');
    const exists = s3Client.listObjects(params, (err, data) => {
      if (err) {
        return reject(err);
      }

      const regex = new RegExp(`^${Prefix}`);
      const files = data.Contents
        .filter(c => c.Size > 0) // remove folders
        .map(c => c.Key.replace(regex, '')); // remove the prefix

      return resolve(files);
    });
  });
}


function uploadFile(Bucket, fileName, src, dest, s3Client) {
  if (!Bucket) {
    throw new Error('`Bucket` argument required');
  }
  if (!fileName) {
    throw new Error('`fileName` argument required');
  }
  if (!src) {
    throw new Error('`src` argument required');
  }
  if (!dest) {
    throw new Error('`dest` argument required');
  }

  const fileBuffer = fs.readFileSync(path.resolve(src, fileName));
  const fileExtension = (/\.[\w\d]+$/.exec(src) || [])[0];
  const prefix = dest.charAt(dest.length - 1) !== '/' ? `${dest}/` : dest; // add slash if needed
  const Key = `${prefix + fileName}`;

  const params = {
    Bucket,
    Key,
    ACL: 'public-read',
    Body: fileBuffer,
    CacheControl: 'max-age=31536000',
    ContentType: mime.lookup(fileExtension) || 'application/octet-stream'
  };

  return new Promise((resolve, reject) => {
    console.log(`Uploading to ${Bucket}:${Key}`);

    s3Client.upload(params, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}

module.exports = {
  newClient,
  getExistingFiles,
  uploadFile
};
