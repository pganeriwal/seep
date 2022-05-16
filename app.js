import { webConnect } from './peer.js';
import { game } from './game-seep.js';

var app = Vue.createApp({// Vue 3.0
    data() {
        return {
            peerId: "",
            message: 'Please wait for your Peer Id:',
            otherPeerId: otherPeerId,
            messageForPeer: "",
            totalPlayers: 4,
            testing: null,

            players: [],
            teams: {},
            table: null,
            biddingCard: null,
            createChoices: null,
            pickChoices: null,
        };
    },
    methods: {
        connectToOtherPeer: function () {
            const ret = webConnect.connectToOtherPeer(this.otherPeerId);
            if (ret && ret.error) {
                this.message = ret.error;
            }
        },
        sendMessageToPeers: function () {
            const ret = webConnect.sendMessageToPeers(this.messageForPeer);
        },
        test() {
            this.biddingCard = null;
            this.testing = game.test();
            this.next();
            this.players = Object.values(game._players);
            this.teams = game._teams;
            this.table = game._table;
        },
        next(choice) {
            this.createChoices = null;
            this.pickChoices = null;
            if (this.testing) {
                const { done, value } = this.testing.next(choice);
                if (done) {
                    this.testing.done = done;
                }
                if (value) {
                    this.createChoices = value.createChoices;
                    this.pickChoices = value.pickChoices;
                }
                this.updateData();
            }
        },
        selectCreate() {
            this.next('create');
        },
        selectPick() {
            this.next('pick');
        },
        selectPut() {
            this.next('put');
        },
        init() {
            this.players = [];
            this.teams = {};
            this.biddingCard = null;
            game.init(this.totalPlayers);

            for (let id = 1; id <= this.totalPlayers; id++) {
                const player = { id };
                this.players.push(player);
                game.addPlayer(player);
            }

            this.table = game._table;
        },
        updateData() {
            this.players = Object.values(game._players);
            this.teams = Object.assign({}, game._teams);
            this.table = Object.assign({}, game._table);
            this.biddingCard = this.biddingCard || game.getBiddingPlayer().cards[0];
        },
        sortCards(playerId) {
            const players = playerId ? [game._players[playerId]] : Object.values(game._players);
            players.forEach(player => {
                game.sortCards(player.cards);
            });
            this.updateData();
        },
        pickedCardGroups(team) {
            return this.teams?.[team]?.pickedCardGroups;
        },
    },
    computed: {
        looseCardsOnTable() {
            return this.table && this.table.cards;
        },
        housesOnTable() {
            return this.table && this.table.houses;
        },
    },
});
app.use(Quasar);
app.mount('#app');