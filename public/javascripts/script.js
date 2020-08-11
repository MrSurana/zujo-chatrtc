const websocketUrl = 'ws://localhost:3000';
const peerConfig = { host: 'localhost', port: 9000, path: '/myapp' };

var app = new Vue({
    el: '#app',
    data: {
        message: '',
        users: [],
        messages: [],
        selUser: null,
        loggedInUser: null,
        peer: null
    },

    mounted: function () {
        let username = localStorage.getItem('username');
        if (username == null) username = this.askForUsername();
        if (username == null) return;

        this.findOrCreateUser(username);
    },

    methods: {
        findOrCreateUser: function (username) {
            fetch(`/api/users/${username}`)
                .then(res => res.json())
                .then(json => {
                    localStorage.setItem('username', username);
                    this.loggedInUser = json;

                    this.initPeer();
                    this.fetchUsers();
                })
                .catch(err => console.error(err));

        },

        initPeer: function () {
            if (this.peer != null) this.peer.disconnect();

            this.peer = new Peer(this.loggedInUser._id, peerConfig);

            this.peer.on('open', (id) => {
                // console.log('My peer ID is: ' + id);
            });

            this.peer.on('connection', (conn) => {
                // console.log('Connected to: %s', conn.peer);

                const userIndex = this.users.findIndex(u => u._id == conn.peer);
                this.users[userIndex].conn = conn;

                conn.on('open', () => Vue.set(this.users, userIndex, this.users[userIndex]));

                conn.on('data', (data) => {
                    if (this.selUser && data.data.senderId == this.selUser._id) {
                        this.messages.push(data.data)
                    }
                });
            });
        },

        initWebsocket: function () {
            const websocket = new WebSocket(websocketUrl);
            websocket.onopen = (e) => {
                console.log("[ws-open] Connection established");
                websocket.send(JSON.stringify({
                    type: 'login',
                    data: this.loggedInUser
                }));
            };

            websocket.onmessage = (event) => this.handleWebsocketMessage(event.data);

            websocket.onclose = (event) => {
                if (event.wasClean) {
                    console.log(`[ws-close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
                } else {
                    console.log('[ws-close] Connection died');
                }
            };

            websocket.onerror = (error) => console.error(`[ws-error] ${error.message}`);
        },

        handleWebsocketMessage: function (message) {
            const json = JSON.parse(message);
            switch (json.type) {
                case 'users':
                    json.data.forEach(this.markOnline);
                    break;

                case 'user-online':
                    this.markOnline(json.data);
                    break;

                case 'user-offline':
                    this.markOffline(json.data);
                    break;

                default:
                    break;
            }
        },

        // establish peer connection to user
        markOnline: function (user) {
            const userIndex = this.users.findIndex(u => u._id == user._id);
            if (userIndex > -1) this.tryPeerConnect(userIndex);
        },

        // unestablish peer connection to user
        markOffline: function (user) {
            const userIndex = this.users.findIndex(u => u._id == user._id);
            if (userIndex > -1) this.peerDisconnect(userIndex);
        },

        tryPeerConnect: function (userIndex) {
            const user = this.users[userIndex];

            if (!user.conn || !user.conn.open) {
                user.conn = this.peer.connect(user._id);

                user.conn.on('data', (data) => {
                    if (this.selUser && data.data.senderId == this.selUser._id) {
                        this.messages.push(data.data)
                    } else {
                        const uIndex = this.users.findIndex(u => data.data.senderId == u._id);
                        this.users[uIndex].unreadMessages = true;
                        Vue.set(this.users, uIndex, this.users[uIndex]);
                    }
                });

                user.conn.on('open', () => {
                    Vue.set(this.users, userIndex, user);
                });
            }
        },

        peerDisconnect: function (userIndex) {
            const user = this.users[userIndex];

            if (user.conn) {
                user.conn.close();
                delete user.conn;

                Vue.set(this.users, userIndex, user);
            }
        },

        chatWithUser: function (user, index) {
            this.selUser = user;
            user.unreadMessages = false;

            this.fetchMessages(user._id);
            this.tryPeerConnect(index);
        },

        sendMessage: function () {
            if (this.selUser.conn && this.selUser.conn.open) {
                this.selUser.conn.send({
                    type: 'message',
                    data: { _id: this.messages.length + 1, text: this.message, senderId: this.loggedInUser._id }
                });
            }

            this.messages.push({ _id: this.messages.length + 1, text: this.message, senderId: this.loggedInUser._id });
            this.saveMessage(this.selUser._id, this.message);

            this.message = '';
        },

        switchUser: function () {
            username = this.askForUsername();
            if (username == null) return;

            for (const i in this.users) this.peerDisconnect(i);

            this.findOrCreateUser(username);
        },

        askForUsername: function () {
            const username = prompt('Username');
            if (username == null) return null;

            if (!username.match(/^[a-zA-Z]+$/)) {
                alert('Invalid username! Only alphabets are allowed.');
                return this.askForUsername();
            }

            return username;
        },

        fetchUsers: function () {
            fetch('/api/users').then(res => res.json())
                .then(json => {
                    this.users = json.filter(u => u._id != this.loggedInUser._id);
                    this.initWebsocket();
                })
                .catch(err => console.error(err));
        },

        fetchMessages: function (userId) {
            fetch(`/api/users/${userId}/${this.loggedInUser._id}/messages`)
                .then(res => res.json())
                .then(json => this.messages = json)
                .catch(err => console.error(err));
        },

        saveMessage: function (userId, text) {
            fetch(`/api/users/${this.loggedInUser._id}/${userId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ text: text }),
                headers: { 'Content-Type': 'application/json' },
            })
                .then(res => res.json())
                .then(json => null)
                .catch(err => console.error(err));
        },
    }
});
