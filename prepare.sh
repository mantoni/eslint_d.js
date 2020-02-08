set -e

cd test/fixture/v4.0.x
npm i

cd ../v5.0.x
npm i

cd ../v6.0.x
npm i

cd ../v4.19.x
npm i

cd ../v5.16.x
npm i

cd ../v6.8.x
npm i

cd ../eslint-plugin
npm i
