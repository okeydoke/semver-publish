#!/usr/bin/env node

const {
  newClient,
  getExistingFiles: getExistingS3Files,
  uploadFile: s3Upload
} = require('./src/s3');

const {
  appendPathSlash,
  debugMessage,
  errorMessage,
  intersection
} = require('./src/utils');

const {
  invalidate
} = require('./src/invalidate');

const fs = require('fs-extra');
const minimist = require('minimist');
const path = require('path');
const util = require('util');
const replace = require('replace-in-file');

const argMap = minimist(process.argv.slice(2)); // expects arguments in --key=value format
const region = 'us-east-1';
const ALLOW_OVERWRITE = 'IM_DOING_SOMETHING_REALLY_BAD';

const { accessKeyId, secretAccessKey, bucket: Bucket, bucket, distributionId: DistributionId, destFolder } = argMap;
const srcFolder = argMap.srcFolder || './dist';
const skipInvalidation = argMap.skipInvalidation !== undefined;
const USE_ROLE = argMap.useRole !== undefined;
const EXISTING_FILE_ERROR_MSG = 'Failed to upload! Destination path contains existing content';

if (!Bucket) {
  errorMessage('Missing argument `bucket`\n');
}

if (!skipInvalidation && !DistributionId) {
  errorMessage('Missing argument `distributionId`\n');
}

if (!USE_ROLE && (!accessKeyId || !secretAccessKey)) {
  errorMessage('Missing credentials');
}

const getExistingFiles = directory => fs.readdirSync(path.resolve(directory));
const s3Client = newClient({ accessKeyId, secretAccessKey, region });

function checkExisting(files) {
  const existingFiles = getExistingFiles(srcFolder);

  // Allow for command line argument to overwrite files, but please don't do this
  if (argMap.overwrite === ALLOW_OVERWRITE) {
    console.log('Skipping. overwrite argument set!');
    return existingFiles;
  }

  const intersect = intersection(existingFiles, files);
  if (intersect.length > 0) {
    errorMessage(`${EXISTING_FILE_ERROR_MSG}:\n${intersect.join(',\n')}`);
  }
  return existingFiles;
}

function uploadFiles(files) {
  return Promise.all(files.map(fileName => s3Upload({ Bucket, fileName, srcFolder, destFolder, s3Client })));
}

// TODO look at using node-semver
function getSemver(fileName = '') {
  // TOOD handle multiple semver patterns in fileName - throw ambiguous semver error
  return (/\d+\.\d+\.\d+/.exec(fileName) || [])[0];
}

function getSemverMajor(semver) {
  return semver ? semver.split('.')[0] : '';
}

function uploadMessage(message = '') {
  return files => {
    const msg = message !== '' ? `${message} ` : message; // add a space at end
    console.log(`Successfully uploaded ${msg}files\n${files.map(f => f.key).join(',\n')}`);
    return files;
  };
}

function updateSourceMap(fileName, newName) {
  const options = {
    files: fileName,
    replace: /sourceMappingURL=(.+\.map)\s*$/,
    with: `sourceMappingURL=${newName}.map`
  };

  replace.sync(options);
}


function createLatestVersions(files) {
  console.log('Generating SEMVER latest versions...');
  const uploads = files.map(f => {
    // TODO split this out to make it testable
    const filename = f.key.replace(appendPathSlash(destFolder), '');
    const filePath = path.resolve(srcFolder, filename);
    const semver = getSemver(filename);
    const latestV = `latest-v${getSemverMajor(semver)}`;
    const newName = filename.replace(semver, latestV);
    const newNamePath = path.resolve(srcFolder, newName);
    const tempPath = `${newNamePath}.tmp`;

    // TODO would probably be better to use streams here
    fs.copySync(filePath, tempPath);
    updateSourceMap(tempPath, newName);
    const fileBuffer = fs.readFileSync(tempPath);

    return s3Upload({ Bucket, destFolder, fileName: newName, fileBuffer, s3Client, srcFolder });
  });

  return Promise.all(uploads);
}

function removeTemporaryFiles(files) {
  const filePaths = files.map(f => {
    const filename = f.key.replace(appendPathSlash(destFolder), '');
    const filePath = path.resolve(srcFolder, filename);
    fs.removeSync(`${filePath}.tmp`);
    return f.key;
  });
  console.log(`Removed temporary file/s:\n${filePaths.join(',\n')}`);
  return filePaths;
}

function createCloudFrontInvalidation(filePaths) {
  if (skipInvalidation) {
    return Promise.resolve({});
  }
  return invalidate(DistributionId, filePaths, { accessKeyId, secretAccessKey });
}

function invalidationMessage({ Invalidation }) {
  if (skipInvalidation) {
    console.log('CloudFront invalidation skipped');
  } else {
    console.log(`CloudFront invalidation created: ID=${Invalidation.Id}\n${Invalidation.InvalidationBatch.Paths.Items.join(',\n')}`);
  }
}

getExistingS3Files(Bucket, destFolder, s3Client)
  .then(checkExisting)
  .then(uploadFiles)
  .then(uploadMessage())
  .then(createLatestVersions)
  .then(uploadMessage('SEMVER'))
  .then(removeTemporaryFiles)
  .then(createCloudFrontInvalidation)
  .then(invalidationMessage)
  .catch(errorMessage);
