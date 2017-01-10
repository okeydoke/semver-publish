#semver-publish

Designed to be added as a NPM dependency that is as part of a build step on something like Jenkins or Teamcity. It upload's directories/files to S3, maintaining semver safely by not allowing overwriting of existing files, also updates a semver major latest version of file.
The reasoning behind this project is to enforce semantic version while also allowing for a way to get the latest changes

When uploading a directory and it encounters a file with a semver value eg `2.3.0` in its name it will create new copy with the semver part of its filename replaced with `latest-v<semver major value>` eg:

```
my-library.2.3.0.js
my-library.2.3.0.js.map
```
becomes
```
my-library.2.3.0.js
my-library.2.3.0.js.map
my-library.latest-v2.js
my-library.latest-v2.js.map
```
While creating the copy of a file which has sourceMappingURL at the end of the file it will replace the value to use the `latest-v*` value so that relative paths to source maps should be handled as well

As part of the upload process at the end it will also perform a CloudFront invalidation on the `latest-v*` files to ensure clients will be the latest changes. You can pass the `--skipInvalidation` argument to skip running a CloudFront invalidation

##Usage

`node index.js --accessKeyId=ID --secretAccessKey=SECRET_KEY --useRole --bucket=mybucket --destFolder=test --overwrite=IM_DOING_SOMETHING_REALLY_BAD --distributionId=ID`

The following command line arguments are available:
- `--bucket` (__Required__) - S3 bucket to upload to.
- `--distributionId` (__Required when `--skipInvalidation` argument is omitted__) - The CloudFront distributionId to perform invalidation against
- `--skipInvalidation` (*Optional*) - Skips creating a CloudFront invalidation when not passed must pass `--distributionId` argument.
- `--destFolder` (*Optional*) - Path to upload files to on S3.
- `--srcFolder`  (*Optional*) - Path to upload files from, defaults to `./dist`.
- `--overwrite=IM_DOING_SOMETHING_REALY_BAD` (*Optional*) - Will allow overwriting existing files, __please__ don't use this as it mostly defeats the purpose of this module.
- `--accessKeyId` (*Optional*) - AWS access key ID. Will be used if both `accessKeyId` & `secretAccessKey` are set otherwise will try to use the machine's IAM role  `accessKeyId`.
- `--secretAccessKey` (*Optional*) - AWS secret access Key ID. Will be used if both `accessKeyId` & `secretAccessKey` are set otherwise will try to use the machine's IAM role  `accessKeyId`.

##TODO
- [ ] write tests
- [ ] Test how it handles binary files
- [ ] Handle file paths other than source maps
- [ ] Check how it handles BASE64 encoding CSS source maps
- [ ] handle multiple semver patterns in fileName
- [ ] Semver minor latest version as well