const { newClient, existingContent, upload } = require('./src/s3');
const minimist = require('minimist');
const util = require('util');

const argMap = minimist(process.argv.slice(2)); // expects arguments in --key=value format
const { USE_ROLE } = process.env;

const { accessKeyId, secretAccessKey, bucket, src, dest, region } = argMap;

const requiredArgs = [
  'bucket',
  'src',
  'dest',
  'region'
].filter(a => argMap[a] === undefined);

if (requiredArgs.length > 0) {
  console.error(`Missing argument/s: ${requiredArgs.join(', ')}`, '\n');
  process.exit(1);
}

if (!USE_ROLE && (!accessKeyId || !secretAccessKey)) {
  console.error('Missing credentials\n');
  process.exit(1);
}

existingContent(bucket, newClient({ accessKeyId, secretAccessKey })).then(contents => {
  console.log(util.inspect(contents, { showHidden: true, depth: null, colors: true }));
  
}).catch(error => {
  console.log({ error });
});
