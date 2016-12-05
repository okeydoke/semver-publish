const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');
const path = require('path');

function client(options) {
  return new S3.createClient({
    s3Options: {
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey
    }
  });
}

function upload(folderPath, options, callback) {

  return new Promise(resolve, reject) {
    const params = {
      s3Params: {
        Bucket: options.bucket,
        ACL: 'public-read'
      }
    };

    const stat = fs.lstatSync(options.src);
    let uploader;

    // Check if src is directory or file and use s3 accordingly
    if (stat.isDirectory()) {
      params.localDir = options.src;
      params.s3Params.Prefix = folderPath;
      uploader = client.uploadDir(params);
    } else {
      const fileName = path.basename(options.src);
      params.localFile = options.src;
      params.s3Params.Key = path.join(folderPath, fileName);
      uploader = client.uploadFile(params);
    }

    console.log(`Uploading to ${options.bucket}:${folderPath}`);

    uploader.on('error', err => {
      reject(err);
    });

    uploader.on('end', () => {
      resolve();
    });
  };
}
