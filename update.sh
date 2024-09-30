npm i
sudo cp black.service /etc/systemd/system/black.service
sudo systemctl daemon-reload
sudo systemctl restart black
cd frontend/black
npm i
npm run build
