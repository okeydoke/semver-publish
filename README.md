Upload's directories/files to S3 maintaining semver safely by not allowing overwriting existing files, also updates a semver major latest version of file

The reasoning behind this project is to enforce semantic version while also allowing for a way to get the latest changes


TODO
-[ ] Handle file paths other than source maps
-[ ] Check CSS sourcemaps path renaming
-[ ] handle multiple semver patterns in fileName
-[ ] Semver minor latest version as well
-[ ] create minimal set of invalidations