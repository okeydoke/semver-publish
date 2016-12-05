const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');
const path = require('path');

function newClient(options) {
  return new S3.createClient({
    s3Options: {
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey
    }
  });
}

/**
 * Retrieve array of objects from S3 based on key (folderPath)
 * @param  {String}   folderPath  S3 directory/key
 * @param  {Object}   s3Client    S3 client
 * @param  {Object}   options
 */
function existingContent(folderPath, s3Client, options) {
  const { bucket, src } = options;
  const MaxKeys = 0; // max amount of objects return in response (0 = infinite)

  return new Promise((resolve, reject) => {
    const params = {
      s3Params: {
        Bucket: bucket,
        Prefix: folderPath,
        MaxKeys
      }
    };

    console.log('Checking for existing content');
    const exists = s3Client.listObjects(params);

    exists.on('error', err => {
      reject(err);
    });

    const contents = [];

    exists.on('data', data => {
      if (data.Contents) {
        data.Contents.forEach(content => {
          contents.push({
            key: content.Key,
            lastModified: content.LastModified
          });
        });
      }
    });

    exists.on('end', () => {
      resolve(contents);
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
}