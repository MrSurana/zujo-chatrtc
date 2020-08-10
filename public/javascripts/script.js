// fetch list of users
var app = new Vue({
    el: '#app',
    data: {
        message: '',
        users: [],
        messages: [],
        selUser: null,
        loggedInUser: {
            _id: '1',
            name: 'johndoe',
        },
        peer: null
    },

    mounted: function () {
        // Fetch users
        this.fetchUsers();

        // TODO: Ask for username if not logged in
        this.loggedInUser._id = prompt('userid');

        // init Peer and init websocket
        this.peer = new Peer(this.loggedInUser._id, { host: 'localhost', port: 9000, path: '/chatrtc' });

        this.peer.on('open', (id) => {
            // console.log('My peer ID is: ' + id);
        });

        this.peer.on('connection', (conn) => {
            console.log('Connected to: %s', conn.peer);

            const userIndex = this.users.findIndex(u => u._id == conn.peer);
            if (userIndex > -1) {
                this.users[userIndex].conn = conn;
            }

            conn.on('data', (data) => {
                if (this.selUser && data.data.senderId == this.selUser._id) {
                    this.messages.push(data.data)
                }
            });
        });
    },

    methods: {
        chatWithUser: function (user) {
            this.selUser = user;

            // Fetch user messages
            this.fetchMessages(user._id);

            // Check if connection is active with user, if not then try connecting
            if (!user.conn || !user.conn.open) {
                user.conn = this.peer.connect(user._id);

                user.conn.on('data', (data) => {
                    if (this.selUser && data.data.senderId == this.selUser._id) {
                        this.messages.push(data.data)
                    }
                });
            }
        },

        sendMessage: function () {
            this.selUser.conn.send({
                type: 'message',
                data: { _id: this.messages.length + 1, text: this.message, senderId: this.loggedInUser._id }
            });
            this.messages.push({ _id: this.messages.length + 1, text: this.message, senderId: this.loggedInUser._id });
            this.message = '';
        },

        logout: function () {
            // TODO: Logout user
        },

        fetchUsers: function () {
            // Fetch users
            fetch('/api/users').then(res => res.json()).then(json => this.users = json).catch(err => console.error(err));
        },

        fetchMessages: function (user) {
            // TODO: Fetch messages for user 

            fetch(`/api/users/${user.id}/messages`)
                .then(res => res.json())
                .then(json => this.messages = json)
                .catch(err => console.error(err));
        },
    }
});
