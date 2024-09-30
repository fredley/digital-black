cd frontend/black
npm i
npm run build
cd ../..

rm -rf public/*
cp -r frontend/black/build public/

npm i
sudo cp black.service /etc/systemd/system/black.service
sudo systemctl daemon-reload
sudo systemctl restart black