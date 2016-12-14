const { newClient, getExistingFiles: getExistingS3Files, uploadFile: s3Upload } = require('./src/s3');
const fs = require('fs');
const minimist = require('minimist');
const path = require('path');
const util = require('util');

const argMap = minimist(process.argv.slice(2)); // expects arguments in --key=value format
const { USE_ROLE } = process.env;

const { accessKeyId, secretAccessKey, bucket, src, dest, region } = argMap;
const EXISTING_FILE_ERROR_MSG = 'Failed to upload! Destination path contains existing content';

function errorMessage(message) {
  console.error(`${message}\n`);
  process.exit(1);
}

const requiredArgs = [
  'bucket',
  'src',
  'dest',
  'region'
].filter(a => argMap[a] === undefined);

if (requiredArgs.length > 0) {
  errorMessage(`Missing argument/s: ${requiredArgs.join(', ')}`, '\n');
}

if (!USE_ROLE && (!accessKeyId || !secretAccessKey)) {
  errorMessage('Missing credentials');
}

const intersection = (...arrays) =>
  [...new Set([].concat(...arrays))].filter(toFind =>
    arrays.every(arr => arr.some(el => el === toFind)
  )
);

const getExistingFiles = directory => fs.readdirSync(path.resolve(directory));

const s3Client = newClient({ accessKeyId, secretAccessKey });

function existing(files) {
  const existingFiles = getExistingFiles(src);
  const intersect = intersection(existingFiles, files);
  if (intersect.length > 0) {
    errorMessage(`${EXISTING_FILE_ERROR_MSG}:\n${existingFiles.join(', ')}`);
  }
  return existingFiles;
}

getExistingS3Files(bucket, dest, s3Client)
.then(existing)
.then(files => {
  const uploads = files.map(file => s3Upload(bucket, file, src, dest, s3Client));
  Promise.all(uploads)
    .then(v => console.log)
    .catch(e => console.error);
})
.catch(error => {
  errorMessage(error.message);
});

//if (fs.lstatSync(src).isDirectory()) {
