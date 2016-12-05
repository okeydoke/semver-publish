const minimist = require('minimist');

const args = process.argv.slice(2);
const argMap = minimist(args); // expects arguments in --key=value format

let { accessKeyId, secretAccessKey, bucket, src, dest } = argMap;
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET, AWS_SRC, AWS_DEST } = process.env;

accessKeyId = accessKeyId || AWS_ACCESS_KEY_ID;
secretAccessKey = secretAccessKey || AWS_SECRET_ACCESS_KEY;
bucket = bucket || AWS_BUCKET;
src = src || AWS_SRC;
dest = dest || AWS_DEST;

console.log(argMap);
