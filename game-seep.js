import { forEachInOrder, shuffleArray, pushToArray } from "./util.js";

export const deck = (function () {
    let _deck = {};

    _deck.BLACK = "black";
    _deck.RED = "red";
    _deck.CLUB = "club";
    _deck.DIAMOND = "diamond";
    _deck.HEART = "heart";
    _deck.SPADE = "spade";
    _deck.JOKER = "joker";
    _deck.ACE = "ace";
    _deck.JACK = "jack";
    _deck.QUEEN = "queen";
    _deck.KING = "king";

    _deck.ALL_SUITS = [_deck.CLUB, _deck.DIAMOND, _deck.HEART, _deck.SPADE];
    _deck.ALL_SUIT_CARDS_COUNT = 13;
    _deck.STANDARD_52_CARDS_DECK = {
        "all": true,
        "totalJokers": 0,
        "totalDecks": 1
    };
    _deck.STANDARD_DECK_WITH_1_JOKER = {
        "all": true,
        "totalJokers": 1,
        "totalDecks": 1
    };
    _deck.STANDARD_DECK_WITH_2_JOKER = {
        "all": true,
        "totalJokers": 2,
        "totalDecks": 1
    };
    _deck.STANDARD_DOUBLE_DECK = {
        "all": true,
        "totalJokers": 0,
        "totalDecks": 2
    };
    _deck.STANDARD_DOUBLE_DECK_WITH_1_JOKER = {
        "all": true,
        "totalJokers": 1,
        "totalDecks": 2
    };
    _deck.STANDARD_DOUBLE_DECK_WITH_2_JOKER = {
        "all": true,
        "totalJokers": 2,
        "totalDecks": 2
    };

    const getCardColour = function (suit, cardNumber) {
        let colour = _deck.RED;
        switch (suit) {
            case _deck.CLUB:
            case _deck.SPADE: {
                colour = _deck.BLACK;
                break;
            }
            case _deck.DIAMOND:
            case _deck.HEART: {
                colour = _deck.RED;
                break;
            }
            case _deck.JOKER: {
                colour = (cardNumber % 2) ? _deck.BLACK : _deck.RED;
                break;
            }
        }
        return colour;
    };
    const getCardName = function (number) {
        let name = "" + number;
        switch (number) {
            case 0: {
                name = _deck.JOKER;
                break;
            }
            case 1: {
                name = _deck.ACE;
                break;
            }
            case 11: {
                name = _deck.JACK;
                break;
            }
            case 12: {
                name = _deck.QUEEN;
                break;
            }
            case 13: {
                name = _deck.KING;
                break;
            }
        }
        return name;
    };
    class Card {
        constructor(deckNumber, suit, cardNumber) {
            this.id = `${deckNumber}__${suit}__${cardNumber}`;
            this.deck = deckNumber;
            this.number = (_deck.JOKER !== suit) ? cardNumber : 0;
            this.suit = suit;
            this.colour = getCardColour(suit, cardNumber);
            this.name = getCardName(this.number);
            this.value = 0;
        }
    }
    _deck.shuffleDeckArray = function (array) {
        shuffleArray(array);
    };

    _deck.removeCards = function (cardsToRemove, fromCards) {
        let ret = fromCards;
        if (Array.isArray(cardsToRemove) && Array.isArray(fromCards)) {
            ret = fromCards.filter(card => {
                let remove = false;
                if (card && card.id) {
                    remove = cardsToRemove.some(removeCard => removeCard && removeCard.id === card.id);
                }
                return !remove;
            });
        }
        return ret;
    };
    _deck.removeCardGroups = function (cardGroups, fromCards) {
        let ret = fromCards;
        if (Array.isArray(cardGroups) && Array.isArray(fromCards)) {
            forEachInOrder(cardGroups, cardGroups => {
                ret = _deck.removeCards(cardGroups, ret);
            });
        }
        return ret;
    };
    _deck.getDeckArray = function (deckObject, shuffled) {
        let array = Object.values(deckObject);
        if (shuffled) {
            _deck.shuffleDeckArray(array);
        }
        return array;
    };
    _deck.init = function (config) {

    };
    _deck.createPlayingCard = function (playingDeck, deckNumber, suit, cardNumber, checkCard) {
        const card = new Card(deckNumber, suit, cardNumber);
        let addCard = ("function" === typeof checkCard) ? checkCard(card) : true;
        if (addCard && playingDeck) {
            playingDeck[card.id] = card;
        }
        return ((addCard) ? card : null);
    };
    _deck.createPlayingDeck = function (config, checkCard) {
        let playingDeck = {};
        config = config || _deck.STANDARD_52_CARDS_DECK;
        if (config.all) {
            config.suits = _deck.ALL_SUITS;
            config.suitCardsCount = _deck.ALL_SUIT_CARDS_COUNT;
        }
        for (let deckNumber = 1; deckNumber <= config.totalDecks; deckNumber++) {
            config.suits.forEach(suit => {
                for (let cardNumber = 1; cardNumber <= config.suitCardsCount; cardNumber++) {
                    _deck.createPlayingCard(playingDeck, deckNumber, suit, cardNumber, checkCard);
                }
            });
        }
        for (let jokerNumber = 1; jokerNumber <= config.totalJokers; jokerNumber++) {
            _deck.createPlayingCard(playingDeck, 1, _deck.JOKER, jokerNumber, checkCard);
        }
        return playingDeck;
    };
    return _deck;
})();

export const game = (function () {
    let _game = {};

    _game.STATES = {};
    _game.STATES.RESET = "reset";
    _game.STATES.INIT = "init";
    _game.STATES.START = "start";
    _game.STATES.END = "end";
    _game.STATES.PAUSE = "pause";

    _game.SUB_STATES = {};
    _game.SUB_STATES.BIDDER_SELECTED = "bidder_selected";
    _game.SUB_STATES.BID = "bid";
    _game.SUB_STATES.FIRST_TURN = "first_turn";
    _game.SUB_STATES.LAST_TURN = "last_turn";

    _game.RULES = {};
    _game.RULES.RULE_BID = "bid";
    _game.RULES.RULE_CREATE_HOUSE = "create";
    _game.RULES.RULE_PICK_CARDS = "pick";
    _game.RULES.RULE_PICK_CARDS_SEEP = "seep";
    _game.RULES.RULE_PUT_LOOSE = "put";
    _game.RULES.RULE_JOIN_HOUSE = "join";
    _game.RULES.RULE_ADD_CARDS_TO_HOUSE = "add";

    _game.dealCardsSourceToTarget = function (sourceCards, cardsToBeDealt, target, checkDealCards) {
        let dealt = false;
        if (sourceCards && 1 <= cardsToBeDealt.length && target) {
            const indexes = [];
            const dealingCards = [];
            const tempCardsToBeDealt = [...cardsToBeDealt];

            sourceCards.forEach((sourceCard, index) => {
                const tempIndex = tempCardsToBeDealt.findIndex(tempCard => tempCard.id === sourceCard.id);
                if (-1 < tempIndex) {
                    dealingCards.push(sourceCard);
                    indexes.push(index);
                    tempCardsToBeDealt.splice(tempIndex, 1);
                }
            });

            const proceedDeal = ("function" === typeof checkDealCards) ? checkDealCards(dealingCards) : true;

            if (proceedDeal) {
                indexes.sort((a, b) => b - a);
                indexes.forEach(index => {
                    sourceCards.splice(index, 1);
                });
                target.cards = (target.cards || []).concat(dealingCards);
                dealt = true;
            }
        }
        return dealt;
    };

    _game.dealCardsFromDeck = function (numberOfCards, target, checkDealCards) {
        let dealt = false;
        if (1 <= numberOfCards) {
            const totalCardsInDeck = _game._playingDeckArray.length;
            numberOfCards = (numberOfCards <= totalCardsInDeck) ? numberOfCards : totalCardsInDeck;

            const dealingCards = _game._playingDeckArray.slice(0, numberOfCards);
            dealt = _game.dealCardsSourceToTarget(_game._playingDeckArray, dealingCards, target, checkDealCards);
        }
        return dealt;
    };

    _game.getBiddingPlayer = function () {
        let biddingPlayer = null;
        let firstPlayer = null;
        forEachInOrder(_game._players, (player, id, i) => {
            if (player) {
                if (0 === i) {
                    firstPlayer = player;
                }
                if (true === player.hasBid) {
                    biddingPlayer = player;
                }
            }
        });
        biddingPlayer = biddingPlayer || firstPlayer;
        biddingPlayer.hasTurn = true;
        biddingPlayer.hasBid = true;
        return biddingPlayer;
    };

    _game.makeBidder = function (player) {
        const previousBiddingPlayer = _game.getBiddingPlayer();
        previousBiddingPlayer.hasTurn = false;
        previousBiddingPlayer.hasBid = false;
        player.hasTurn = true;
        player.hasBid = true;
        _game._sub_state = _game.SUB_STATES.BIDDER_SELECTED;
    };

    _game.changeTurnAndGetNextPlayer = function () {
        let turnPlayer = null;
        let firstPlayer = null;
        let nextPlayer = null;
        forEachInOrder(_game._players, (player, id, i) => {
            if (player) {
                if (0 === i) {
                    firstPlayer = player;
                }
                if (true === player.hasTurn) {
                    turnPlayer = player;
                } else if (!nextPlayer && turnPlayer) {
                    nextPlayer = player;
                }
            }
        });
        nextPlayer = nextPlayer || firstPlayer;
        turnPlayer.hasTurn = false;
        nextPlayer.hasTurn = true;
        return nextPlayer;
    };

    const dealToBiddingPlayer = function (checkDealCards) {
        //deal 4 cards from _game._playingDeckArray to the player who has the turn to bid
        return _game.dealCardsFromDeck(4, _game.getBiddingPlayer(), checkDealCards);
    };

    const dealAfterBidOnTable = function () {
        //deal 4 cards from _game._playingDeckArray on the table
        return _game.dealCardsFromDeck(4, _game._table);
    };

    const dealAfterFirstTurn = function () {
        forEachInOrder(_game._players, (player, id, i) => {
            if (player) {
                const numberOfCards = (player.hasBid) ? 8 : 12;
                _game.dealCardsFromDeck(numberOfCards, player);
            }
        });
    };

    const firstDeal = function () {
        //start dealing
        //pg
        const dealt = dealToBiddingPlayer(_game.isAnyHouseCard);
        console.log("dealt: " + dealt);
        if (!dealt) {
            firstDeal();
        };
    };

    const showRedeal = function () {
        //show redeal button to the bidding player
    };

    const isValidCardNumber = number => ("number" === typeof number && 1 <= number && 13 >= number);
    const isValidCardWithNumber = card => !!(card && isValidCardNumber(card.number));
    const isValidHouseNumber = number => ("number" === typeof number && 9 <= number && 13 >= number);
    _game.isHouseCard = card => !!(card && isValidHouseNumber(card.number));
    _game.isAnyHouseCard = cards => (Array.isArray(cards) && cards.some(_game.isHouseCard));
    const isValidHouse = house => (house && house.owner && house.ownerTeam && isValidHouseNumber(house.number)
        && Array.isArray(house.cardGroups));
    const isHouseLocked = house => (house && Array.isArray(house.cardGroups) && 2 <= house.cardGroups.length);
    const getHouseForNumber = number => (isValidHouseNumber(number) && _game._table.houses)
        ? _game._table.houses[number] : null;
    const doesHouseExistForNumber = number => !!(getHouseForNumber(number));
    const isPlayerHouseOwner = (house, player) => (isValidHouse(house) && isValidPlayer(player))
        ? 0 <= house.owner.indexOf(player.id) : false;
    const isPlayerFirstHouseOwner = (house, player) => (isValidHouse(house) && isValidPlayer(player))
        ? 0 === house.owner.indexOf(player.id) : false;
    const isPlayersTeamHouseOwner = (house, player) => (isValidHouse(house) && isValidPlayer(player))
        ? 0 <= house.ownerTeam.indexOf(player.team) : false;
    const addPlayerAsHouseOwner = (house, player) => {
        let ret = false;
        if (isValidHouse(house) && isValidPlayer(player) && !isPlayersTeamHouseOwner(house, player)) {
            house.owner.push(player.id);
            house.ownerTeam.push(player.team);
            ret = true;
        }
        return ret;
    };
    const getCardsTotalNumber = cards => {
        let ret = -1;
        if (Array.isArray(cards) && 1 <= cards.length) {
            ret = cards.reduce((total, card) => {
                if (isValidCardWithNumber(card)) {
                    total += card.number;
                }
                return total;
            }, 0);
        }
        return ret;
    };
    const getCardGroupsNumber = cardGroups => {
        let ret = -1;
        if (Array.isArray(cardGroups) && 1 <= cardGroups.length) {
            let firstGroupTotalNumber = null;
            const allSame = cardGroups.every(cards => {
                let isGroupTotalNumberSame = true;
                const cardsTotalNumber = getCardsTotalNumber(cards);
                if (null === firstGroupTotalNumber) {
                    firstGroupTotalNumber = cardsTotalNumber;
                } else {
                    isGroupTotalNumberSame = firstGroupTotalNumber === cardsTotalNumber;
                }
                return isGroupTotalNumberSame;
            });
            if (allSame) {
                ret = firstGroupTotalNumber;
            }
        }
        return ret;
    };
    const addCardGroupsToHouse = (house, cardGroups) => {
        let ret = false;
        if (isValidHouse(house) && house.number === getCardGroupsNumber(cardGroups)) {
            pushToArray(house.cardGroups, cardGroups);
            ret = true;
        }
        return ret;
    };

    const checkIfRedealIsNeeded = function () {
        let redeal = true;
        const player = _game.getBiddingPlayer();
        if (player && Array.isArray(player.cards)) {
            //array any card that is 9 or greater
            redeal = !player.cards.some(_game.isHouseCard);
        }
        return redeal;
    };
    const getCurrentPlayersCount = function () {
        return Object.keys(_game._players).length;
    };

    const checkCard = function (card) {
        let value = card.value;
        switch (card.suit) {
            case _game._deck.CLUB:
            case _game._deck.HEART: {
                value = (1 === card.number) ? 1 : 0;
                break;
            }
            case _game._deck.DIAMOND: {
                switch (card.number) {
                    case 1: {
                        value = 1;
                        break;
                    }
                    case 10: {
                        value = 6;
                        break;
                    }
                }
                break;
            }
            case _game._deck.SPADE: {
                value = card.number
                break;
            }
        }
        card.value = value;
        return (1 === card.deck && _game._deck.JOKER !== card.suit);
    };

    const isValidPlayer = function (player) {
        return !!(player && player.id);
    };
    const createTeams = function (totalTeams) {
        for (let i = 0; i < totalTeams; i++) {
            _game._teams[i] = {
                "index": i,
                "players": []
            };
        }
    };
    const isTeamIndexValid = function (teamIndex) {
        return ((-1 < teamIndex) && (teamIndex < _game._totalTeams));
    };
    const getValidTeamIndex = function (teamIndex) {
        return (isTeamIndexValid(teamIndex)) ? teamIndex : 0;
    };
    const addPlayerToNextTeam = function (player) {
        let updated = false;
        if (isValidPlayer(player)) {
            let teamIndexWithLeastPlayers = 0;
            let maxPlayersInOtherTeam = 1;
            for (let i = 0; i < _game._totalTeams; i++) {
                const team = _game._teams[i];
                if (team && Array.isArray(team.players)) {
                    const teamPlayersCount = team.players.length;

                    if (teamPlayersCount < maxPlayersInOtherTeam) {
                        teamIndexWithLeastPlayers = i;
                        break;
                    } else if (teamPlayersCount > maxPlayersInOtherTeam) {
                        maxPlayersInOtherTeam = teamPlayersCount;
                    }
                }
            }
            if (isTeamIndexValid(teamIndexWithLeastPlayers)) {
                _game._teams[teamIndexWithLeastPlayers].players.push(player.id);
                player["team"] = teamIndexWithLeastPlayers;
                updated = true;
            }
        }
        return updated;
    };
    const removePlayerFromTeam = function (player) {
        let updated = false;
        if (isValidPlayer(player)) {
            const teamIndex = player["team"];
            const team = (isTeamIndexValid(teamIndex)) ? _game._teams[teamIndex] : null;
            if (team && Array.isArray(team.players)) {
                team.players = team.players.filter(id => id !== player.id);
                delete player["team"];
                updated = true;
            }
        }
        return updated;
    };

    _game.reset = function () {
        _game._totalPlayers = 0;
        _game._totalTeams = 0;
        _game._bidCard = null;
        _game._table = {};
        _game._players = {};
        _game._teams = {};
        _game._scoreboard = {};
        _game._deck = null;
        _game._playingDeck = null;
        _game._playingDeckArray = null;
        _game._state = _game.STATES.RESET;
    };
    _game.init = function (totalPlayers, totalTeams, localDeck) {
        _game.reset();
        _game._deck = localDeck || deck;
        _game._totalPlayers = ("number" === typeof totalPlayers) ? totalPlayers : 4;
        _game._totalTeams = ("number" === typeof totalTeams) ? totalTeams : 2;
        createTeams(_game._totalTeams);
        _game._deck.init();
        _game._playingDeck = _game._deck.createPlayingDeck(null, checkCard);
        _game._playingDeckArray = _game._deck.getDeckArray(_game._playingDeck, true);
        _game._state = _game.STATES.INIT;
    };
    _game.shuffleDeck = function () {
        _game._deck.shuffleDeckArray(_game._playingDeckArray);
    };
    _game.destroy = function () {
        _game.reset();
    };

    _game.sortCards = function (cards) {
        if (Array.isArray(cards)) {
            const isAscOrder = cards._isAscOrder
                = ("boolean" === typeof cards._isAscOrder) ? !cards._isAscOrder : false;
            cards.sort((aCard, bCard) => {
                let diff = 0;
                if (isValidCardWithNumber(aCard) && isValidCardWithNumber(bCard)) {
                    if (aCard.number < bCard.number) {
                        diff = -1;
                    } else if (aCard.number > bCard.number) {
                        diff = 1;
                    } else {
                        const aSuit = aCard.suit.toLowerCase();
                        const bSuit = bCard.suit.toLowerCase();
                        if (aSuit < bSuit) {
                            diff = -1;
                        } else if (aSuit > bSuit) {
                            diff = 1;
                        }
                    }

                    if (!isAscOrder) {
                        diff *= -1;
                    }
                }
                return diff;
            });
        }
        return cards;
    };

    _game.bid = function (card) {
        let valid = false;
        const aHouseCard = _game.isHouseCard(card);
        if (aHouseCard) {
            _game._bidCard = card;
            dealAfterBidOnTable();
            _game._sub_state = _game.SUB_STATES.BID;
            valid = true;
        } else {
            alert("Invalid card, select a card greater than or equal to 9");
        }
        return valid;
    };

    const ch = {};
    ch[_game.RULES.RULE_CREATE_HOUSE] = {
        "cardId": {
            "cardId": "cardId",
            "isOptimum": false,
            "isSeepToOther": false,
            "isLockedHouse": false,
            "isFinalHouse": false,
            "isNewHouse": true,
            "houseValue": 0
        }
    };
    ch[_game.RULES.RULE_PICK_CARDS] = {
        "cardId": {
            "cardId": "cardId",
            "isOptimum": false,
            "isSeepToOther": false,
            "pickingFinalHouse": false,
            "isSeep": false,
            "pickValue": 0
        }
    };
    ch[_game.RULES.RULE_PICK_CARDS_SEEP] = {};
    ch[_game.RULES.RULE_PUT_LOOSE] = {
        "cardId": {
            "cardId": "cardId",
            "isOptimum": false,
            "isSeepToOther": false,
            "putValue": 0
        }
    };
    ch[_game.RULES.RULE_JOIN_HOUSE] = {
        "cardId": {
            "cardId": "cardId",
            "isOptimum": false,
            "isSeepToOther": false,
            "isLockedHouse": true,
            "isFinalHouse": false,
            "isNewHouse": false,
            "houseValue": 0
        }
    };
    ch[_game.RULES.RULE_ADD_CARDS_TO_HOUSE] = {
        "cardId": {
            "cardId": "cardId",
            "isOptimum": false,
            "isSeepToOther": false,
            "isLockedHouse": true,
            "isFinalHouse": false,
            "isNewHouse": false,
            "houseValue": 0
        }
    };

    const getPlayerCardsAnalysis = function (player) {
        let playerCards = null;
        const playerCardsAnalysis = {
            numberCount: {},
            cardIds: [],
            houseNumberCount: {}
        };
        if (player && Array.isArray(playerCards = player.cards)) {
            //build choices based upon the playerCards, tableCards and rules to be applied
            /**
             * newHouseNumbers will depend upon the type of cards the player has
             * and the cards on the table
             * 1. in case of bid turn the new house will only contain the BID card's number
             */
            const newHouseNumbers = [];
            /**
             * joinHouseNumbers will depend upon the type of cards the player has
             * and the cards on the table
             * 1. in case of bid turn the join house will be EMPTY
             */
            const joinHouseNumbers = [];
            /**
             * joinHouseNumbers will depend upon the type of cards on the table
             * 1. in case of bid turn the add house will be EMPTY
             */
            const addHouseNumbers = [];

            forEachInOrder(playerCards, card => {
                if (isValidCardWithNumber(card)) {
                    playerCardsAnalysis.cardIds.push(card.id);
                    playerCardsAnalysis.numberCount[card.number] = 1 + (playerCardsAnalysis.numberCount[card.number] || 0);
                    if (_game.isHouseCard(card)) {
                        playerCardsAnalysis.houseNumberCount[card.number] = playerCardsAnalysis.numberCount[card.number];
                    }
                }
            });
            pushToArray(newHouseNumbers, Object.keys(playerCardsAnalysis.houseNumberCount));
            playerCardsAnalysis["newHouseNumbers"] = newHouseNumbers;
            playerCardsAnalysis["joinHouseNumbers"] = newHouseNumbers;
            playerCardsAnalysis["addHouseNumbers"] = addHouseNumbers;
        }
        return playerCardsAnalysis;
    };

    const getTableCardsAnalysis = function () {
        const tableCardsAnalysis = {
            looseCardIds: [],
            looseCardsNumberCount: {}
        };
        const looseCards = _game._table.cards;
        forEachInOrder(looseCards, card => {
            if (isValidCardWithNumber(card)) {
                tableCardsAnalysis.looseCardIds.push(card.id);
                tableCardsAnalysis.looseCardsNumberCount[card.number] = 1 + (tableCardsAnalysis.looseCardsNumberCount[card.number] || 0);
            }
        });
        return tableCardsAnalysis;
    };

    const getCombinationsForCardNumber = function (isRecursive, checkNumber, cards, allCombinations) {
        const ret = {
            found: false,
            singleCards: [],
            cardGroups: []
        };
        if (isValidCardNumber(checkNumber) && Array.isArray(cards)) {
            if (!isRecursive) {
                console.log("checkNumber: " + checkNumber);
                console.log("cards:", cards);
                //this is the first call to this function, hence singleCards can be checked here only
                ret.singleCards = filterSameNumberCards(checkNumber, cards);
            }
            ret.found = (1 <= ret.singleCards.length);
            if (!ret.found || allCombinations) {
                //if singleCards NOT found or all the combinations are required
                if (!isRecursive) {
                    //this is the first call to this function, hence filter and sort cards for cardGroups
                    //setting _isAscOrder to false since we need the cards to be sorted in ascending order
                    cards = filterSmallerNumberCards(checkNumber, cards);
                    cards._isAscOrder = false;
                    _game.sortCards(cards);
                }
                for (let i = 0; (i < cards.length && (!ret.found || allCombinations)); i++) {
                    /**
                     * check for next card ONLY if:
                     * 1. i < length
                     * AND
                     * 2. combination is NOT found OR
                     * 3. all combinations are required
                     */
                    const card = cards[i];
                    if (checkNumber < card.number) {
                        /**
                         * if the card is greater than the checkNumber than we should STOP
                         * since it cannot be combined anymore with this option
                         * because the cards are sorted in ascending order
                         */
                        break;
                    } else if (checkNumber === card.number) {
                        //if the card is equal to the checkNumber than we've found one of the possible combinations
                        ret.found = true;
                        const groupsArr = [card];
                        groupsArr._value = card.value;
                        ret.cardGroups.push(groupsArr);
                    } else if (checkNumber > card.number) {
                        const diff = checkNumber - card.number;
                        if (diff < card.number) {
                            /**
                             * since the cards are sorted in ascending order
                             * and the diff is smaller than the card itself
                             * hence no more cards can be combined together to make total equal to the checkNumber
                             * check next card
                             */
                            continue;
                        } else {
                            /**
                             * else if the diff is greater or equal to the card itself
                             * and since the cards are sorted in ascending order
                             * hence we need to check if this card can be combined with other cards together
                             * to make total equal to the checkNumber
                             */
                            const nextIndex = i + 1;
                            if (nextIndex < cards.length) {
                                //if there are more cards to be checked and combined
                                const recursiveRet = getCombinationsForCardNumber(true, diff, cards.slice(nextIndex), allCombinations);
                                if (recursiveRet.found) {
                                    recursiveRet.cardGroups.forEach(group => {
                                        if (Array.isArray(group)) {
                                            group.unshift(card);
                                            group._value += card.value;
                                        }
                                    });
                                    ret.found = ret.found || recursiveRet.found;
                                    pushToArray(ret.cardGroups, recursiveRet.cardGroups);
                                }
                            }
                        }
                    }
                }
            }
        }
        return ret;
    };
    _game.getCombinationsOnTable = function (checkNumber) {
        return getCombinationsForCardNumber(false, checkNumber, _game._table.cards, true);
    };
    _game.anyCombinationsOnTable = function (checkNumber) {
        return getCombinationsForCardNumber(false, checkNumber, _game._table.cards, false);
    };

    const filterSameNumberCards = (number, cards) => {
        let ret = [];
        if (isValidCardNumber(number) && Array.isArray(cards)) {
            ret = cards.filter(card => isValidCardWithNumber(card) && card.number === number);
        }
        return ret;
    };

    const filterSmallerNumberCards = (number, cards) => {
        let ret = [];
        if (isValidCardNumber(number) && Array.isArray(cards)) {
            ret = cards.filter(card => isValidCardWithNumber(card) && card.number < number);
        }
        return ret;
    };

    class House {
        constructor(number) {
            this.number = number;
            this.cardGroups = [];
            this.owner = [];
            this.ownerTeam = [];
            this.value = 0;
        }
    }

    const turn = {
        "check": {},
        "play": {}
    };

    const getCardGroupsForCombinations = (combinations) => {
        const cardGroups = [];
        cardGroups._value = 0;
        if (combinations && combinations.found) {
            //add card for single cards
            forEachInOrder(combinations.singleCards, singleCard => {
                cardGroups.push([singleCard]);
                cardGroups._value += singleCard.value;
            });
            //add cards
            forEachInOrder(combinations.cardGroups, cards => {
                cardGroups.push(cards);
                cardGroups._value += cards._value;
            });
        }
        return cardGroups;
    };

    const filterCombinations = (combinations, mode) => {
        if (combinations && combinations.found && combinations.cardGroups.length) {
            switch (mode) {
                case "first": {
                    combinations.cardGroups.splice(1, Infinity);
                    break;
                }
                case "max-value": {
                    let cardsWithMaxValue = combinations.cardGroups.reduce((maxValCards, cards) => {
                        if (!maxValCards || cards._value > maxValCards._value) {
                            maxValCards = cards;
                        }
                        return maxValCards;
                    }, null);
                    combinations.cardGroups.splice(0, Infinity);
                    combinations.cardGroups.push(cardsWithMaxValue);
                    break;
                }
                case "duplicate-first":
                default: {
                    const duplicateCard = {};
                    const uniqueCards = [];
                    let isAnyDuplicate = false;
                    combinations.cardGroups.forEach((cards, index) => {
                        let isCardsUnique = true;
                        cards.forEach(card => {
                            if (duplicateCard[card.id]) {
                                isCardsUnique = false;
                            } else {
                                duplicateCard[card.id] = card;
                            }
                        });
                        if (isCardsUnique) {
                            uniqueCards.push(cards);
                        } else {
                            isAnyDuplicate = true;
                        }
                    });
                    if (isAnyDuplicate) {
                        combinations.cardGroups.splice(0, Infinity);
                        pushToArray(combinations.cardGroups, uniqueCards);
                    }
                    break;
                }
            }
        }
        return combinations;
    };

    const addCardToCombination = (card, combination, addAtStart) => {
        let ret = false;
        if (isValidCardWithNumber(card) && Array.isArray(combination)) {
            if (addAtStart) {
                combination.unshift(card);
            } else {
                combination.push(card);
            }
            combination._value = (combination._value || 0) + card.value;
            ret = true;
        }
        return ret;
    };

    const addCombinationToCardGroups = (combination, cardGroups, addAtStart) => {
        let ret = false;
        if (Array.isArray(combination) && Array.isArray(cardGroups)) {
            if (addAtStart) {
                cardGroups.unshift(combination);
            } else {
                cardGroups.push(combination);
            }
            cardGroups._value = (cardGroups._value || 0) + (combination._value || 0);
            ret = true;
        }
        return ret;
    };

    const addCombinationsToCardGroups = (combinations, cardGroups, addAtStart) => {
        let ret = false;
        if (Array.isArray(combinations)) {
            ret = combinations.reduce((acc, combination) => {
                const tempRet = addCombinationToCardGroups(combination, cardGroups, addAtStart);
                return acc && tempRet;
            }, true);
        }
        return ret;
    };

    const mergeCardGroups = (cardGroupA, cardGroupB) => {
        if (pushToArray(cardGroupA, cardGroupB)) {
            cardGroupA._value = cardGroupA._value || 0;
            cardGroupB._value = cardGroupB._value || 0;
            cardGroupA._value += cardGroupB._value;
        }
    };

    const playCardToCreateJoinAddHouse = function (house, playingCard, combinations, player) {
        let ret = false;
        if (isValidHouse(house) && isValidCardWithNumber(playingCard)
            && Array.isArray(combinations) && player && Array.isArray(player.cards)) {
            /**
             * ideally we should validate if the combinations are valid or not again
             * but now we are only validating the total
             */
            _game._table.cards = _game._deck.removeCards(combinations, _game._table.cards);
            addCardToCombination(playingCard, combinations, true);
            const allCardGroups = [];
            addCombinationsToCardGroups([combinations], allCardGroups);
            //add other combinations on the table with addCardGroupsToHouse
            let otherCombinations = _game.getCombinationsOnTable(house.number);
            if (otherCombinations.found) {
                filterCombinations(otherCombinations);
                const sameCardGroups = getCardGroupsForCombinations(otherCombinations);
                mergeCardGroups(allCardGroups, sameCardGroups);
                _game._table.cards = _game._deck.removeCardGroups(sameCardGroups, _game._table.cards);
            }
            addPlayerAsHouseOwner(house, player);
            addCardGroupsToHouse(house, allCardGroups);
            player.cards = _game._deck.removeCards([playingCard], player.cards);
            ret = true;
        }
        return ret;
    };

    turn.play[_game.RULES.RULE_CREATE_HOUSE] = function (houseNumber, playingCard, player, combinations) {
        let ret = false;
        if (isValidHouseNumber(houseNumber) && isValidCardWithNumber(playingCard)
            && Array.isArray(combinations) && player && Array.isArray(player.cards)) {
            console.log(`creating house of (number): ${houseNumber}`);
            const house = new House(houseNumber);
            _game._table.houses = _game._table.houses || {};
            _game._table.houses[house.number] = house;
            ret = playCardToCreateJoinAddHouse(house, playingCard, combinations, player);
            console.log(`isHouseLocked: ${isHouseLocked(house)}`);
        }
        return ret;
    };

    turn.play[_game.RULES.RULE_PICK_CARDS] = function (pickNumber, playingCard, player, combinations) {
        let ret = false;
        if (isValidCardNumber(pickNumber) && isValidCardWithNumber(playingCard)
            && Array.isArray(combinations) && player && Array.isArray(player.cards)) {
            console.log(`picking card(s) of (number): ${pickNumber}`);
            /**
             * ideally we should validate if the combinations are valid or not again
             * but now we are only validating the total
             */
            _game._table.cards = _game._deck.removeCards(combinations, _game._table.cards);
            const pickingCardArray = [];
            pickingCardArray._isPickingCard = true;
            addCardToCombination(playingCard, pickingCardArray, true);
            const allCardGroups = [];
            addCombinationsToCardGroups([pickingCardArray, combinations], allCardGroups);
            //add other combinations on the table to the pick group
            let otherCombinations = _game.getCombinationsOnTable(pickNumber);
            if (otherCombinations.found) {
                const sameCardGroups = getCardGroupsForCombinations(otherCombinations);
                mergeCardGroups(allCardGroups, sameCardGroups);
                _game._table.cards = _game._deck.removeCardGroups(sameCardGroups, _game._table.cards);
            }
            _game._teams[player.team].pickedCardGroups = _game._teams[player.team].pickedCardGroups || [];
            mergeCardGroups(_game._teams[player.team].pickedCardGroups, allCardGroups);
            player.cards = _game._deck.removeCards([playingCard], player.cards);
            ret = true;
            console.log("team pick value total: " + _game._teams[player.team].pickedCardGroups._value);
        }
        return ret;
    };

    turn.play[_game.RULES.RULE_PUT_LOOSE] = function (putNumber, playingCard, player) {
        let ret = false;
        if (isValidCardNumber(putNumber) && isValidCardWithNumber(playingCard) && player
            && Array.isArray(player.cards)) {
            console.log(`putting loose card of (number): ${putNumber}`);
            //check if combinations exists on the table
            let otherCombinations = _game.getCombinationsOnTable(putNumber);
            if (!otherCombinations.found) {
                _game._table.cards.push(playingCard);
                player.cards = _game._deck.removeCards([playingCard], player.cards);
                ret = true;
            }
        }
        return ret;
    };

    // _game.RULES.RULE_JOIN_HOUSE = "join";
    turn.play[_game.RULES.RULE_JOIN_HOUSE] = function (houseNumber, playingCard, player, combinations) {
        let ret = false;
        let house = null;
        if (isValidHouseNumber(houseNumber) && isValidCardWithNumber(playingCard)
            && Array.isArray(combinations) && player && Array.isArray(player.cards)
            && (house = getHouseForNumber(houseNumber))) {
            if (!isPlayersTeamHouseOwner(house, player)) {
                console.log(`joining house of (number): ${houseNumber}`);
                ret = playCardToCreateJoinAddHouse(house, playingCard, combinations, player);
                console.log("Should be true always isHouseLocked: " + isHouseLocked(house));
            }
        }
        return ret;
    };

    // _game.RULES.RULE_ADD_CARDS_TO_HOUSE = "add";
    //pg
    turn.play[_game.RULES.RULE_ADD_CARDS_TO_HOUSE] = function (houseNumber, playingCard, player, combinations) {
        let ret = false;
        let house = null;
        if (isValidHouseNumber(houseNumber) && isValidCardWithNumber(playingCard)
            && Array.isArray(combinations) && player && Array.isArray(player.cards) && (house = getHouseForNumber(houseNumber))) {
            if (isPlayersTeamHouseOwner(house, player)) {
                console.log(`adding card to house of (number): ${houseNumber}`);
                ret = playCardToCreateJoinAddHouse(house, playingCard, combinations, player);
                console.log("Should be true always isHouseLocked: " + isHouseLocked(house));
            }
        }
        return ret;
    };

    _game.playTurnWithChoice = function (choice, player) {
        let played = false;
        if (choice) {
            const playHandler = turn.play[choice.turn];
            if ("function" === typeof playHandler) {
                played = playHandler(choice.number, choice.playingCard, player, choice.combinations);
                console.log("Table after turn:", _game._table);
            }
        }
        return played;
    };

    _game.start = function () {
        //all the players should be available
        if (getCurrentPlayersCount() === _game._totalPlayers) {
            firstDeal();
            if (checkIfRedealIsNeeded()) {
                showRedeal();
            }
            _game._state = _game.STATES.START;
        }
    };

    _game.redeal = function () {
        if (checkIfRedealIsNeeded()) {
            firstDeal();
        }
    };
    _game.end = function () {
        //the game should be in start state
        //any player can request to end the game
        _game._state = _game.STATES.END;
    };
    _game.pause = function () {
        //the game should be in start state
        //any player can request to pause the game
        _game._state = _game.STATES.PAUSE;
    };
    _game.resume = function () {
        //the game should be in pause state
        //any player can request to resume the game
        _game._state = _game.STATES.START;
    };
    _game.addPlayer = function (player) {
        let success = null;
        if (isValidPlayer(player) && getCurrentPlayersCount() < _game._totalPlayers) {
            success = addPlayerToNextTeam(player);
            if (success) {
                _game._players[player.id] = player;
            }
        }
        return success;
    };
    _game.removePlayer = function (player) {
        let success = null;
        if (isValidPlayer(player)) {
            success = removePlayerFromTeam(_game._players[player.id]);
            if (success) {
                delete _game._players[player.id];
            }
        }
        return success;
    };
    _game.swapPlayers = function () { };

    class TurnChoice {
        constructor(card, turn, number, combinations, extraCombinations) {
            this.playingCard = card;
            this.turn = turn;
            this.number = isValidCardNumber(number) ? number : -1;
            this.combinations = combinations || [];
            this.extraCombinations = extraCombinations || [];
        }
    }

    const getChoicesForCombinations = (card, turn, number, combinations) => {
        const choices = [];
        if (combinations && combinations.found) {
            //add choices for single cards
            forEachInOrder(combinations.singleCards, singleCard => {
                const singleCardArray = [singleCard];
                singleCardArray._value = singleCard.value;
                const choice = new TurnChoice(card, turn, number, singleCardArray);
                choices.push(choice);
            });
            //add choices for card groups
            forEachInOrder(combinations.cardGroups, cardGroups => {
                const choice = new TurnChoice(card, turn, number, cardGroups);
                choices.push(choice);
            });
        }
        return choices;
    };

    _game.getTurnChoicesForHouseNumber = function (houseNumber, cards) {
        const create = _game.RULES.RULE_CREATE_HOUSE;
        const pick = _game.RULES.RULE_PICK_CARDS;
        const turnChoices = {};
        turnChoices[create] = [];
        turnChoices[pick] = [];
        if (isValidHouseNumber(houseNumber) && Array.isArray(cards)) {
            /**
             * filter the cards as follows:
             * 1. keep cards with number smaller than the houseNumber
             * 2. keep cards with number equal to the houseNumber IF there are multiple houseNumber cards
             * since house can be made by placing the same number card if the player has two or more cards
             */
            const sameHouseNumberCards = filterSameNumberCards(houseNumber, cards);
            const smallerNumberCards = filterSmallerNumberCards(houseNumber, cards);
            const pushChoicesForCardNumber = (card, number) => {
                let combinations = _game.getCombinationsOnTable(number);
                console.log(combinations);
                let createTurn = _game.RULES.RULE_CREATE_HOUSE;
                let choices;
                if (houseNumber === number) {
                    if (2 <= sameHouseNumberCards.length) {
                        choices = getChoicesForCombinations(card, createTurn, houseNumber, combinations);
                        pushToArray(turnChoices[create], choices);
                    }
                    pushToArray(turnChoices[pick],
                        getChoicesForCombinations(card, _game.RULES.RULE_PICK_CARDS, number, combinations)
                    );
                } else {
                    choices = getChoicesForCombinations(card, createTurn, houseNumber, combinations);
                    pushToArray(turnChoices[create], choices);
                }
            };
            //find combinations equal to the houseNumber for each sameHouseNumberCards
            forEachInOrder(sameHouseNumberCards, card => {
                if (isValidCardWithNumber(card)) {
                    pushChoicesForCardNumber(card, card.number);
                }
            });
            //find combinations houseNumber - card.number for each smallerNumberCards
            forEachInOrder(smallerNumberCards, card => {
                if (isValidCardWithNumber(card)) {
                    const diffForHouse = houseNumber - card.number;
                    pushChoicesForCardNumber(card, diffForHouse);
                }
            });
        }
        return turnChoices;
    };

    const handleCreatePickPutStep = function ({ player, create, pick, put, isFirstTurn }) {
        const ret = { success: false };
        if (player) {
            if (create) { } else if (pick) { } else if (put) {
                if (!isFirstTurn || put.number === _game._bidCard.number) {
                    const allTurnChoices = _game.getTurnChoicesForHouseNumber(put.number, player.cards);
                    console.log("allCreateChoices:", allTurnChoices);

                    const createChoices = allTurnChoices[_game.RULES.RULE_CREATE_HOUSE];
                    const canCreate = createChoices && createChoices.length;
                    const pickChoices = allTurnChoices[_game.RULES.RULE_PICK_CARDS];
                    const canPick = pickChoices && pickChoices.length;

                    if (!canPick) {
                        ret.success = _game.playTurnWithChoice({
                            turn: _game.RULES.RULE_PUT_LOOSE,
                            number: put.number,
                            playingCard: put
                        }, player);
                    }
                }
            }
        }
        if (!ret.success) {
            alert("Invalid turn");
        }
        return ret;
    };

    _game.nextStep = function (input) {

        /**
         * //pg//TODO
         * Need to introduce _sub_state, _next_step and _previous_steps
         * _next_step: {
         *  type: "auto", //auto or manual
         *  name: "play", //play-a-card or select-cards-from-deck or draw-a-card-from-deck or select-a-card-from-deck
         *  who: "app" //app or user1 or user2 etc.
         * }
         * playingCard?
         * create? house number?
         * join? house number?
         * add? house number?
         * pick?
         * put?
         * 
         */
        const output = {};
        switch (_game._state) {
            case _game.STATES.END:
            default: {
                _game.init(4, 2, deck);
                _game.addPlayer({ id: 1 });
                _game.addPlayer({ id: 2 });
                _game.addPlayer({ id: 3 });
                _game.addPlayer({ id: 4 });
                _game.getBiddingPlayer();
                break;
            }
            case _game.STATES.INIT: {
                const { biddingPlayer } = input;
                const biddingPlayerCards = biddingPlayer.cards;
                console.log("biddingPlayer.cards:", biddingPlayerCards);
                _game.makeBidder(biddingPlayer);
                _game.start();
                break;
            }
            case _game.STATES.START: {
                switch (_game._sub_state) {
                    case _game.SUB_STATES.BIDDER_SELECTED:
                    default: {
                        const { bid } = input;
                        console.log("bidding for card:", bid);
                        _game.bid(bid);
                        break;
                    }
                    case _game.SUB_STATES.BID: {
                        input.isFirstTurn = true;
                        const ret = handleCreatePickPutStep(input);
                        Object.assign(output, ret);
                        break;
                    }
                }
                break;
            }
        }
        output.state = _game._state;
        output.sub_state = _game._sub_state;
        return output;
    };

    _game.test = function* () {
        _game.init(4, 2, deck);
        _game.addPlayer({ id: 1 });
        _game.addPlayer({ id: 2 });
        _game.addPlayer({ id: 3 });
        _game.addPlayer({ id: 4 });

        let biddingPlayer = _game.getBiddingPlayer();

        yield;

        const bidYieldValue = yield;
        const { bid } = bidYieldValue;

        if (bidYieldValue.biddingPlayer) {
            biddingPlayer = bidYieldValue.biddingPlayer;
        }
        // _game.start();

        const biddingPlayerCards = biddingPlayer.cards;

        // _game.sortCards(biddingPlayerCards);
        console.log("biddingPlayer.cards:", biddingPlayer.cards);

        console.log("bidding for card:", bid);
        _game.bid(bid);

        yield;

        console.log("anyCombinationsOnTable for number:", bid.number);
        let combinations = _game.anyCombinationsOnTable(bid.number);
        console.log("combinations found for number:", combinations);

        // yield;

        console.log("combinations for house number:", bid.number);
        const allFirstPlayerChoices = _game.getTurnChoicesForHouseNumber(bid.number, biddingPlayerCards);
        console.log("allCreateChoices:", allFirstPlayerChoices);

        const createChoices = allFirstPlayerChoices[_game.RULES.RULE_CREATE_HOUSE];
        const pickChoices = allFirstPlayerChoices[_game.RULES.RULE_PICK_CARDS];

        const { choice } = yield { createChoices, pickChoices };

        let firstTurnPlayed = false;
        if ((!choice || 'create' === choice) && createChoices && 1 <= createChoices.length) {
            //create a house if possible
            //optimisation can be done later
            const createChoice = createChoices[0];
            firstTurnPlayed = _game.playTurnWithChoice(createChoice, biddingPlayer);
        } else if ((!choice || 'pick' === choice) && pickChoices && 1 <= pickChoices.length) {
            //if a house cannot be created
            //pick cards if possible
            //optimisation can be done later
            const pickChoice = pickChoices[0];
            firstTurnPlayed = _game.playTurnWithChoice(pickChoice, biddingPlayer);
        } else if ((!choice || 'put' === choice)) {
            //if a house cannot be created
            //and cards cannot be picked
            //then put the first same value card
            //optimisation can be done later
            firstTurnPlayed = _game.playTurnWithChoice({
                turn: _game.RULES.RULE_PUT_LOOSE,
                number: bid.number,
                playingCard: bid
            }, biddingPlayer);
        }

        yield;

        if (firstTurnPlayed) {
            dealAfterFirstTurn();
            const nextPlayer = _game.changeTurnAndGetNextPlayer();
            console.log("nextPlayer:", nextPlayer);
        }
    };
    return _game;
})();