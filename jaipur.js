/**
 * Jaipur
 * This game is 2 players.
 * Win 2 rounds to win the game.
 */

var gamebits = {
  'cards' : {
    "diamond": {
      "qty":6,
    },
    "gold": {
      "qty":6,
    },
    "silver": {
      "qty":6,
    },
    "cloth": {
      "qty":8,
    },
    "spice": {
      "qty":8,
    },
    "leather": {
      "qty":10,
    },
    "camel": {
      "qty":11,
    }
  },
  'tokens' : {
    "Camel": {
      "qty":1,
      "points": [5]
    },
    "Seals of Excellence": {
      "qty":3,
    },
    "Diamond": {
      "qty":5,
      "points": [7, 7, 5, 5, 5]
    },
    "Gold": {
      "qty":5,
      "points": [6, 6, 5, 5, 5]
    },
    "Silver": {
      "qty":5,
      "points": [5, 5, 5, 5, 5]
    },
    "Cloth": {
      "qty":7,
      "points": [5, 3, 3, 2, 2, 1, 1]
    },
    "Spice": {
      "qty":7,
      "points": [5, 3, 3, 2, 2, 1, 1]
    },
    "Leather": {
      "qty":9,
      "points": [4, 3, 2, 1, 1, 1, 1, 1, 1]
    },
    "Bonus3": {
      "qty":7,
      "points": [3, 3, 2, 2, 1, 1, 1]
    },
    "Bonus4": {
      "qty":6,
      "points": [6, 6, 5, 5, 4, 4]
    },
    "Bonus5": {
      "qty":5,
      "points": [10, 10, 9, 8, 8]
    }
  }
};

var gamestate = {
  'marketplace' : [], // 5 cards in the marketplace
  'deck' : [],
  'discards': [],
  'tokens' : {
    'diamond' : [],
    'gold': [],
    'silver': [],
    'cloth': [],
    'spice': [],
    'leather': [],
    'bonus3': [],
    'bonus4': [],
    'bonus5': []
  },
  'players': {
    'alpha': {
      'hand': [],
      'camels' : 0,
      'tokens' : [],
      'points' : 0,
      'rounds' : 0,
      'bonusTokens': 0,
      'goodsTokens': 0
    },
    'beta': {
      'hand': [],
      'camels' : 0,
      'tokens' : [],
      'points' : 0,
      'rounds' : 0,
      'bonusTokens': 0,
      'goodsTokens': 0
    }
  },
  'emptyPiles': 0,
  'whoseTurn': 'alpha',
  'winner': false
};

function setup() {
  setupGoodsTokens();
  setupBonusTokens();
  setupTableCards();
  setupPlayers();
  logInitialGamestate();

  function logInitialGamestate() {
    console.log('Current Marketplace:');
    console.log(gamestate.marketplace);
    for (var key in gamestate.players) {
      var value = gamestate.players[key];
      console.log('Player ' + key + ' has ' + value.camels + ' camels.');
    }
  }

  function setupPlayers() {
    // give players a starting hand of 5 cards
    for (var key in gamestate.players) {
      var value = gamestate.players[key];
      for (var i = 0; i < 5; i++) {
        // players reveal any camel cards
        var thisCard = gamestate.deck.pop();
        if (thisCard == 'camel') {
          value.camels++;
        }
        else {
          value.hand.push(thisCard);
        }
      }
    }
    
    // determine starting player
    gamestate.whoseTurn = 'alpha';
    return { key, value };
  }

  function setupTableCards() {
    // place 3 camel cards on the table (marketplace)
    gamestate.marketplace = ['camel', 'camel', 'camel'];
    
    // shuffle the rest of the cards into a draw deck
    gamestate.deck = [];
    for (var key in gamebits.cards) {
      var qty = gamebits.cards[key].qty;
      if (key == 'camel') { // we already drew out 3 camels
        qty -= 3;
      }
      for (var count = 0; count < qty; count++) {
        gamestate.deck.push(key);
      }
    }
    shuffle(gamestate.deck);
    
    // draw 2 cards from the deck to complete the marketplace
    gamestate.marketplace.push(gamestate.deck.pop());
    gamestate.marketplace.push(gamestate.deck.pop());
  }

  // shuffle the #3, #4, and #5 Bonus tokens
  function setupBonusTokens() {
    gamestate.tokens.bonus3 = gamebits.tokens.Bonus3.points;
    shuffle(gamestate.tokens.bonus3);
    gamestate.tokens.bonus4 = gamebits.tokens.Bonus4.points;
    shuffle(gamestate.tokens.bonus4);
    gamestate.tokens.bonus5 = gamebits.tokens.Bonus5.points;
    shuffle(gamestate.tokens.bonus5);
  }

  // sort tokens in descending order
  function setupGoodsTokens() {
    gamestate.tokens.diamond = gamebits.tokens.Diamond.points; // assumes the JSON is already sorted this way
    gamestate.tokens.gold = gamebits.tokens.Gold.points; // assumes the JSON is already sorted this way
    gamestate.tokens.silver = gamebits.tokens.Silver.points; // assumes the JSON is already sorted this way
    gamestate.tokens.cloth = gamebits.tokens.Cloth.points; // assumes the JSON is already sorted this way
    gamestate.tokens.spice = gamebits.tokens.Spice.points; // assumes the JSON is already sorted this way
    gamestate.tokens.leather = gamebits.tokens.Leather.points; // assumes the JSON is already sorted this way
  }
}

function takeCamels(playerKey) {
  if (!playerCheck(playerKey)) {
    return;
  }
  var camelsTaken = 0;
  var newMarketplace = [];
  for (var key in gamestate.marketplace) {
    var value = gamestate.marketplace[key];
    if (value == 'camel') {
      camelsTaken++;
    } else {
      newMarketplace.push(value);
    }
  }
  
  if (camelsTaken == 0) {
    throw {
      'status': 'error',
      'message': 'There are no camels to take!'
    };
  }
  gamestate.players[playerKey].camels += camelsTaken;
  gamestate.marketplace = newMarketplace;
  console.log('Player ' + playerKey + ' took ' + camelsTaken + ' camels. They now have ' + gamestate.players[playerKey].camels + ' camels.');
  
  reloadMarketplace();
  nextPlayer();
}

function takeOneCard(playerKey, cardIdx) {
  if (!playerCheck(playerKey)) {
    return;
  }
  if (gamestate.players[playerKey].hand.length == 7) {
    throw {
      'status': 'error',
      'message': "Can't have more than 7 cards in hand."
    };
  }
  
  var cardTaken = gamestate.marketplace[cardIdx];
  gamestate.players[playerKey].hand.push(cardTaken);
  gamestate.marketplace.splice(cardIdx, 1);
  console.log('Player ' + playerKey + ' took the ' + cardTaken + ' card.');
  
  reloadMarketplace();
  nextPlayer();
}

function swapCards(playerKey, cardsToMarketplace, cardsToHand, camels) {
  if (!playerCheck(playerKey)) {
    return;
  }
  if (camels === undefined || camels < 0) {
    camels = 0;
  }
  
  if (camels > gamestate.players[playerKey].camels) {
    throw {
      'status': 'error',
      'message': "You don't have that many camels to trade away."
    };
  }
  
  var maxCamels = 7 - gamestate.players[playerKey].hand.length;
  if (camels > maxCamels) {
    throw {
      'status': 'error',
      'message': "Can't have more than 7 cards in hand."
    };
  }
  
  var oldHand = gamestate.players[playerKey].hand.slice(0); // make a copy of this array
  var newHand = [];
  var oldMarketplace = gamestate.marketplace.slice(0); // make a copy of this array
  var newMarketplace = [];

  // You must give the same number of cards you are taking
    if (cardsToMarketplace.length + camels != cardsToHand.length) {
      throw {
        'status': 'error',
        'message': 'You must give the same number of cards you are taking'
      };
    }
  
  // You cannot give the same cards you are trying to take
    var cardsNotAllowed = [];
    for (var key in cardsToMarketplace) {
      var idx = cardsToMarketplace[key];
      cardsNotAllowed.push(oldHand[idx]);
    }
    for(var key in cardsToHand) {
      var idx = cardsToHand[key];
      if (oldMarketplace[idx] == 'camel') {
        throw {
          'status': 'error',
          'message': 'You are not allowed to take camels, only goods.'
        };
      }
      var idx = cardsToHand[key];
      if (cardsNotAllowed.indexOf(oldMarketplace[idx]) > -1) {
        throw {
          'status': 'error',
          'message': 'You cannot give the same cards you are trying to take'
        };
      }
    }

  // Perform the swap
    for (var key in oldHand) {
      var value = oldHand[key];
      if (cardsToMarketplace.indexOf(parseInt(key)) > -1) {
        newMarketplace.push(value);
      } else {
        newHand.push(value);
      }
    }
    for (var key in oldMarketplace) {
      var value = oldMarketplace[key];
      if (cardsToHand.indexOf(parseInt(key)) > -1) {
        newHand.push(value);
      } else {
        newMarketplace.push(value);
      }
    }
    gamestate.players[playerKey].camels -= camels;
    for (var i = 0; i < camels; i++) {
      newMarketplace.push('camel');
    }
    
    gamestate.players[playerKey].hand = newHand;
    gamestate.marketplace = newMarketplace;
    nextPlayer();
  
  // Console log
    console.log('Player ' + playerKey + ' gave ' + camels + ' camels and:');
    for (var key in cardsToMarketplace) {
      var value = cardsToMarketplace[key];
      console.log(oldHand[value]);
    }
    console.log('Player ' + playerKey + ' took:');
    for (var key in cardsToHand) {
      var value = cardsToHand[key];
      console.log(oldMarketplace[value]);
    }
}

/**
 * Replenish the marketplace as cards are taken.
 */
function reloadMarketplace() {
  console.log('Old marketplace:');
  console.log(gamestate.marketplace);

  while (gamestate.marketplace.length < 5) {
    if (gamestate.deck.length == 0) {
      throw {
        'status': 'error',
        'message': "Can't reload marketplace; there are no cards left in the deck"
      };
    }
    gamestate.marketplace.push(gamestate.deck.pop());
  }
  
  console.log('New marketplace:');
  console.log(gamestate.marketplace);
}

function determineRoundWinner() {

  // determine who gets the camel token
    if (gamestate.players.alpha.camels != gamestate.players.beta.camels) {
      if (gamestate.players.alpha.camels > gamestate.players.beta.camels) {
        gamestate.players.alpha.points += 5;
        console.log('Alpha gets the camel token for 5 points.');
        gamestate.players.alpha.tokens.push({'type': 'camel', 'pts': 5});
       } else {
        gamestate.players.beta.points += 5;
        console.log('Beta gets the camel token for 5 points.');
        gamestate.players.beta.tokens.push({'type': 'camel', 'pts': 5});
      }
    }
  
  // winner of the round is the one with the most points
    console.log('Alpha = ' + gamestate.players.alpha.points + ' points.');
    console.log('Beta = ' + gamestate.players.beta.points + ' points.');
    if (gamestate.players.alpha.points > gamestate.players.beta.points) {
      gamestate.players.alpha.rounds++;
      return 'alpha';
    }
    if (gamestate.players.beta.points > gamestate.players.alpha.points) {
      gamestate.players.beta.rounds++;
      return 'beta';
    }
  
  // tiebreaker 1: most bonus tokens
    if (gamestate.players.alpha.bonusTokens > gamestate.players.beta.bonusTokens) {
      gamestate.players.alpha.rounds++;
      return 'alpha';
    }
    if (gamestate.players.beta.bonusTokens > gamestate.players.alpha.bonusTokens) {
      gamestate.players.beta.rounds++;
      return 'beta';
    }

  // tiebreaker 2: most goods tokens
    if (gamestate.players.alpha.goodsTokens > gamestate.players.beta.goodsTokens) {
      gamestate.players.alpha.rounds++;
      return 'alpha';
    }
    gamestate.players.beta.rounds++;
    return 'beta';
}

/**
 * When selling cards:
 * - you can only sell one type of card
 * - when selling silver, gold, or diamond, minimum of two (2)
 */
function sellCards(playerKey, cards) {
  var oldHand = gamestate.players[playerKey].hand.slice(0); // Make a copy
  var newHand = [];
  var typeOfGood = false;

  // validation
    if (cards.length == 0) {
      throw {
        'status': 'error',
        'message': 'No goods selected to sell'
      };
    }
    for (var key in cards) {
      var idx = cards[key];
      if (typeOfGood != oldHand[idx] && typeOfGood != false) {
        throw {
          'status': 'error',
          'message': 'You can only sell one type of good'
        };
      } else {
        typeOfGood = oldHand[idx];
      }
    }
    if (cards.length < 2) {
      switch (typeOfGood) {
        case 'silver':
        case 'gold':
        case 'diamond':
          throw {
            'status': 'error',
            'message': 'You must sell at least 2 ' + typeOfGood
          };
      }
    }

  // sell good
    for (var key in oldHand) {
      var value = oldHand[key];
      if (cards.indexOf(parseInt(key, 10)) > -1) {
        // get a token
          if (gamestate.tokens[value].length > 0) {
            var pointsEarned = gamestate.tokens[value].shift();
            gamestate.players[playerKey].points += pointsEarned;
            gamestate.players[playerKey].tokens.push({'type': value, 'pts': pointsEarned});
            console.log('Player ' + playerKey + ' sells ' + value + ' for ' + pointsEarned + ' points.');
          } else {
            console.log('Player ' + playerKey + ' sells ' + value + ', but there were no more tokens.');
          }
          
        // place card in discard pile
          gamestate.discards.push(value);
      } else {
        newHand.push(value);
      }
    }
    gamestate.players[playerKey].hand = newHand;
  
  // get a bonus token?
    var bonusPointsEarned = 0;
    var bonusType;
    if (cards.length >= 3) {
      if (cards.length == 3) {
        bonusType = 'bonus3';
      } else if (cards.length == 4) {
        bonusType = 'bonus4';
      } else {
        bonusType = 'bonus5';
      }
      bonusPointsEarned = gamestate.tokens[bonusType].shift();
      gamestate.players[playerKey].points += bonusPointsEarned;
      gamestate.players[playerKey].tokens.push({'type': bonusType, 'pts': bonusPointsEarned});
      console.log('Player ' + playerKey + ' gets a bonus for selling ' + cards.length + ' cards!');
    }
    
  nextPlayer();
}

function isRoundOver() {
  // when there are not enough cards in the deck to refill the marketplace
  if (gamestate.deck.length < (5 - gamestate.marketplace.length)) {
    return true;        
  }
  
  // when 3 piles of goods tokens are empty
  gamestate.emptyPiles = 0;
  if (gamestate.tokens.cloth.length == 0) {
    gamestate.emptyPiles++;
  }
  if (gamestate.tokens.diamond.length == 0) {
    gamestate.emptyPiles++;
  }
  if (gamestate.tokens.gold.length == 0) {
    gamestate.emptyPiles++;
  }
  if (gamestate.tokens.leather.length == 0) {
    gamestate.emptyPiles++;
  }
  if (gamestate.tokens.silver.length == 0) {
    gamestate.emptyPiles++;
  }
  if (gamestate.tokens.spice.length == 0) {
    gamestate.emptyPiles++;
  }
  if (gamestate.emptyPiles >= 3) {
    return true;
  }
  
  return false;
}

function camelCount() {
  var count = 0;
  for (var key in gamestate.marketplace) {
    var value = gamestate.marketplace[key];
    if (value == 'camel') {
      count++;
    }
  }
  return count;
}

function playerCheck(playerKey) {
  if (gamestate.whoseTurn == playerKey) {
    return true;
  } else {
    return false;
  }
}

function nextPlayer() {
  if (gamestate.whoseTurn == 'alpha') {
    gamestate.whoseTurn = 'beta';
  } else {
    gamestate.whoseTurn = 'alpha';
  }
}

(function($) {
  $(document).ready(function() {
    function drawMarketplace() {
      $('.cards-left .count').html(gamestate.deck.length);

      $('.tabletop .marketplace').empty();
      for (var key in gamestate.marketplace) {
        var value = gamestate.marketplace[key]
        $('.tabletop .marketplace').append('<div class="' + value + ' card off">' + value + '</div>');
      }
      
      for (var key in gamestate.tokens) {
        $('.tabletop .tokens .' + key + ' span').remove();
        var value = gamestate.tokens[key];
        for (var k in value) {
          var v = value[k];
          if (key.substr(0, 5) == 'bonus') {
            v = '?';
          }
          $('.tabletop .tokens .' + key).append('<span>' + v + '</span>');
        }
      }
    }
    
    function drawPlayer(playerIdx) {
      var thisPlayer = gamestate.players[playerIdx];
      $('.player.' + playerIdx + ' .hand').empty();
      for (var key in thisPlayer.hand) {
        var value = thisPlayer.hand[key];
        $('.player.' + playerIdx + ' .hand').append('<div class="' + value + ' card off">' + value + '</div>');
      }
      $('.player.' + playerIdx + ' .hand').append('<div class="clear"></div>');
      $('.player.' + playerIdx + ' .camels').html(thisPlayer.camels);
      $('.player.' + playerIdx + ' .score').html(thisPlayer.points + ((thisPlayer.points == 1 ? ' point' : ' points')));
      $('.player.' + playerIdx + ' .hidden .cards').html(thisPlayer.hand.length);
      $('.player.' + playerIdx + ' .hidden .tokens').html(thisPlayer.tokens.length);
    }

    /**
     * Clear out all actions and allow the active player to begin their turn.
     *
     * @param {string} playerIdx
     */
    function beginTurn(playerIdx) {
      $('.player .actions').empty();
      $('.player.' + playerIdx + ' .actions').html('<input type="button" class="take-turn" value="Take Turn" />');
    }
    
    function getThisPlayer(element) {
      if (element.parents('.player').hasClass('alpha')) {
        return 'alpha';
      }
      return 'beta';
    }

    function showStatus(message) {
      $('.status').html(message + '<a href="#" class="dismiss">(dismiss)</a>');
      $('.status').show();
    }

    $('.status').on('click', '.dismiss', function() {
      $('.status').hide();
    });

    /**
     * When a user begins their turn, present them with a list of possible moves they can make.
     */
    $('.player').on('click', '.take-turn', function() {
      var playerIdx = getThisPlayer($(this));

      $(this).parents('.player').find('.revealed').toggle();
      $(this).parents('.player').find('.hidden').toggle();
      $(this).parent().append('<h3>Available Actions:</h3><ul>');
      if (camelCount() > 0) {
        $(this).parent().append('<li><input type="button" class="take-camels" value="Take ' + camelCount() + ' Camels" /> from the board</li>');
      }
      if (camelCount() < 5 && gamestate.players[playerIdx].hand.length < 7) {
        $(this).parent().append('<li>Click on a good on the left, then <input type="button" class="take-good" value="Take 1 Good" /></li>');
      }
      if (gamestate.players[playerIdx].camels > 0 || gamestate.players[playerIdx].hand.length > 0) {
        $(this).parent().append('<li>Click on the same number of goods from your hand and the board, then <input type="button" class="trade" value="Trade" /><br />(You can also trade away your camels by selecting nothing from your hand)</li>');
      }
      if (gamestate.players[playerIdx].hand.length > 0) {
        $(this).parent().append('<li>Click on as many cards in your hand <strong>of the same type</strong>, then <input type="button" class="sell" value="Sell" /></li>');
      }
      $(this).parent().append('</ul>');
      $(this).remove();
    });
    
    $('.player').on('click', '.end-turn', function() {
      $(this).parents('.player').find('.revealed').toggle();
      $(this).parents('.player').find('.hidden').toggle();
      if (!isRoundOver()) {
        beginTurn(gamestate.whoseTurn);
      } else {
        var roundWinner = determineRoundWinner();
        gamestate.players[roundWinner].rounds++;
        showStatus('Round over: ' + roundWinner + ' won!');
      }
      $('.empty-piles .count').html(gamestate.emptyPiles);
      $(this).remove();
    });
    
    $('.player').on('click', '.take-camels', function() {
      var playerKey = getThisPlayer($(this));
      takeCamels(playerKey)
      drawMarketplace();
      drawPlayer(playerKey);
      $(this).parents('div.actions').html('<input type="button" class="end-turn" value="End Turn" />');
    });
    
    $('.player').on('click', '.take-good', function() {
      var playerKey = getThisPlayer($(this));
      var isCardTaken = false;
      if ($('.marketplace .card.on').length == 0) {
        showStatus('Click on a good on the left first, then click [Take 1 Good]');
        return;
      }
      if ($('.marketplace .card.on').length > 1) {
        showStatus("Don't be greedy! Only select 1 good, then click [Take 1 Good]");
      }
      if ($('.marketplace .card.on').length == 1) {
        $('.marketplace .card').each(function (key, element) {
          if ($(element).hasClass('on')) {
            try {
              takeOneCard(playerKey, key);
            } catch (err) {
              showStatus(err.message);
            }
          }
        });

        drawMarketplace();
        drawPlayer(playerKey);
        $(this).parents('div.actions').html('<input type="button" class="end-turn" value="End Turn" />');
      }
    });
    
    $('.marketplace, .hand').on('click', '.card', function() {
      if (!$(this).hasClass('camel')) {
        $(this).toggleClass('off on');
      }
    });

    $('.player').on('click', '.trade', function() {
      var playerKey = getThisPlayer($(this));
      var thisHand = $(this).parents('.player').find('.hand');
      var camelsToTrade = $('.marketplace .card.on').length - thisHand.find('.card.on').length;
      var cardsToHand = [];
      var cardsToMarketplace = [];
      
      $('.marketplace .card').each(function(key, element) {
        if ($(element).hasClass('on')) {
          cardsToHand.push(key);
        }
      });
      thisHand.find('.card').each(function(key, element) {
        if ($(element).hasClass('on')) {
          cardsToMarketplace.push(key);
        }
      });
      
      try {
        swapCards(playerKey, cardsToMarketplace, cardsToHand, camelsToTrade);  
        drawMarketplace();
        drawPlayer(playerKey);
        $(this).parents('div.actions').html('<input type="button" class="end-turn" value="End Turn" />');
      } catch(err) {
        showStatus(err.message);
      }

    });
    
    $('.player').on('click', '.sell', function() {
      var playerKey = getThisPlayer($(this));
      var thisHand = $(this).parents('.player').find('.hand');
      var cardsToSell = [];
      thisHand.find('.card').each(function(key, element) {
        if ($(element).hasClass('on')) {
          cardsToSell.push(key);
        }
      });

      try {
        sellCards(playerKey, cardsToSell);
        drawMarketplace();
        drawPlayer(playerKey);
        $(this).parents('div.actions').html('<input type="button" class="end-turn" value="End Turn" />');
      } catch(err) {
        showStatus(err.message);
      }
      
    });
    
    while (!gamestate.winner) {
      setup();
      drawMarketplace();
      drawPlayer('alpha');
      drawPlayer('beta');
      beginTurn(gamestate.whoseTurn);
break;
    }
  });
})(jQuery);