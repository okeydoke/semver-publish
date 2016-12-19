const {
  appendFolderSlash,
  newClient,
  getExistingFiles: getExistingS3Files,
  uploadFile: s3Upload
} = require('./src/s3');

const {
  debugMessage,
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
const { USE_ROLE } = process.env;

const { accessKeyId, secretAccessKey, bucket, folder } = argMap;
const src = argMap.src || './dist';
const EXISTING_FILE_ERROR_MSG = 'Failed to upload! Destination path contains existing content';

function errorMessage(message) {
  console.error(`${message}\n`);
  process.exit(1);
}

const requiredArgs = [
  'bucket'
].filter(a => argMap[a] === undefined);

if (requiredArgs.length > 0) {
  errorMessage(`Missing argument/s: ${requiredArgs.join(', ')}`, '\n');
}

if (!USE_ROLE && (!accessKeyId || !secretAccessKey)) {
  errorMessage('Missing credentials');
}

const getExistingFiles = directory => fs.readdirSync(path.resolve(directory));
const s3Client = newClient({ accessKeyId, secretAccessKey });

function existing(files) {
  const existingFiles = getExistingFiles(src);
  const intersect = intersection(existingFiles, files);
  if (intersect.length > 0) {
    errorMessage(`${EXISTING_FILE_ERROR_MSG}:\n${intersect.join(',\n')}`);
  }
  return existingFiles;
}

function getSemver(fileName = '') {
  // TOOD handle multiple semver patterns in fileName - throw ambiguous semver error
  return (/\d+\.\d+\.\d+/.exec(fileName) || [])[0];
}

function getSemverMajor(semver) {
  return semver.split('.')[0];
}

getExistingS3Files(bucket, folder, s3Client)
  .then(existing)
  .then(files => {
    const uploads = files.map(file => s3Upload(bucket, file, src, folder, s3Client));
    return Promise.all(uploads);
  })
  .catch(error => {
    errorMessage(error.message);
  })
  .then(uploaded => {
    console.log('Successfully uploaded files');

    console.log('Generating SEMVER latest versions...');
    uploaded.forEach(f => {
      // TODO split this out to make it testable
      const filename = f.key.replace(appendFolderSlash(folder), '');
      const semver = getSemver(filename);
      const latestV = `latest-v${getSemverMajor(semver)}`;
      const newName = filename.replace(semver, latestV);
      const newNamePath = path.resolve(src, newName);

      fs.copySync(path.resolve(src, filename), newNamePath);

      updateSourceMap(path.resolve(src, filename), newName);

      s3Upload(bucket, newName, src, folder, s3Client)
      .then(() => {
        console.log(`Removing temporary file: ${newName}`);
        fs.removeSync(newNamePath);
      })
      .then(() => {
        return invalidate(bucket, folder + newName, { accessKeyId, secretAccessKey });
      })
      .catch(err => console.log(err));
    });
  });

function updateSourceMap(fileName, newName) {
  const options = {
    files: fileName,
    replace: /sourceMappingURL=(.+\.map)\s*$/,
    with: `sourceMappingURL=${newName}.map`
  };

  replace.sync(options);
}
