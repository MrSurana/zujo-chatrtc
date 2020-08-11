ChatRTC
===

WebRTC peer to peer chat, built with:

1. Node.js
2. MongoDB
3. WebRTC
4. PeerJS
5. Express.js
6. Websocket
7. Docker


Instructions
===

1. Copy .env.example to .env file and customize mongo details as required.

2. Run with docker (from project root directory):
```sh
    docker-compose up -d
```

OR 

2. Run without docker (from project root directory):
```sh
    npm install peer -g
    peerjs --port 9000 --key peerjs --path /myapp

    npm install
    npm start
```
