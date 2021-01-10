git checkout .
git pull
SPOON_KEY=`cat ~/spoon.key`
echo "SPOON KEY is $SPOON_KEY"
sed -i "s/SPOON_KEY_PLACEHOLDER/$SPOON_KEY/g" server.js

./update.sh
