set -e

cd test/fixture/

VERSIONS=`ls -d v*`
for VERSION in $VERSIONS
do
  cd $VERSION
  npm i
  cd ..
done
