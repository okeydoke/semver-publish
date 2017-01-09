const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { appendPathSlash, debugMessage } = require('./utils');

function newClient(options) {
  return new AWS.S3(options);
}

/**
 * Retrieve array of objects from S3 based on key (folderPath)
 * @param  {String}   folderPath  S3 directory/key
 * @param  {Object}   s3Client    S3 client
 * @param  {Object}   options
 */
function getExistingFiles(Bucket, destFolder = '', s3Client) {
  const MaxKeys = 100000; // max amount of objects return in response
  const Prefix = appendPathSlash(destFolder);

  const params = {
    Bucket,
    MaxKeys,
    Prefix
  };

  debugMessage('getExistingFiles params', params);

  return new Promise((resolve, reject) => {
    console.log('Checking for existing content...');
    const exists = s3Client.listObjects(params, (err, data) => {
      debugMessage('uploadFile:listObjects (err, data)', err, data);

      if (err) {
        // need to handle 403 differently as the api can return them when trying to list an object
        // that doesn't exist due to a lack of permissions to preventing leaking of information
        if (err.statusCode === 403) {
          return resolve([]);
        }
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

// Required Argument
function Required(argumentName) {
  throw new Error(`'${argumentName}' argument required`);
}

function uploadFile({ Bucket = Required('Bucket'), destFolder = '', fileBuffer = null, fileName = Required('fileName'), s3Client, srcFolder = Required('srcFolder') }) {
  const file = fileBuffer || fs.readFileSync(path.resolve(srcFolder, fileName));
  const fileExtension = (/\.[\w\d]+$/.exec(fileName) || [])[0];
  const prefix = appendPathSlash(destFolder);
  const Key = `${prefix + fileName}`;
  const ContentType = mime.lookup(fileExtension) || 'application/octet-stream';

  const params = {
    Bucket,
    ContentType,
    Key,
    ACL: 'public-read',
    Body: file,
    CacheControl: 'max-age=31536000'
  };

  debugMessage('uploadFile params', params);

  return new Promise((resolve, reject) => {
    debugMessage(`uploadFile:uploading ${Bucket}:${Key}`);

    s3Client.upload(params, (err, data) => {
      debugMessage('uploadFile:upload (err, data)', err, data);
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}

module.exports = {
  getExistingFiles,
  newClient,
  uploadFile
};
