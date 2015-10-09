window.onload = function() {
  game.init();
};



// requestAnimationFrame() shim by Paul Irish
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function() {
  return  window.requestAnimationFrame       ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      window.oRequestAnimationFrame      ||
      window.msRequestAnimationFrame     ||
      function(/* function */ callback, /* DOMElement */ element){
        window.setTimeout(callback, 1000 / 60);
      };
})();

/**
 * Behaves the same as setInterval except uses requestAnimationFrame() where possible for better performance
 * @param {function} fn The callback function
 * @param {int} delay The delay in milliseconds
 */
window.requestInterval = function(fn, delay) {
  if( !window.requestAnimationFrame       &&
    !window.webkitRequestAnimationFrame &&
    !(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) && // Firefox 5 ships without cancel support
    !window.oRequestAnimationFrame      &&
    !window.msRequestAnimationFrame)
      return window.setInterval(fn, delay);

  var start = new Date().getTime(),
    handle = new Object();

  function loop() {
    var current = new Date().getTime(),
      delta = current - start;

    if(delta >= delay) {
      fn.call();
      start = new Date().getTime();
    }

    handle.value = requestAnimFrame(loop);
  };

  handle.value = requestAnimFrame(loop);
  return handle;
}

/**
 * Behaves the same as clearInterval except uses cancelRequestAnimationFrame() where possible for better performance
 * @param {int|object} fn The callback function
 */
    window.clearRequestInterval = function(handle) {
    window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) :
    window.webkitCancelAnimationFrame ? window.webkitCancelAnimationFrame(handle.value) :
    window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame(handle.value) : /* Support for legacy API */
    window.mozCancelRequestAnimationFrame ? window.mozCancelRequestAnimationFrame(handle.value) :
    window.oCancelRequestAnimationFrame ? window.oCancelRequestAnimationFrame(handle.value) :
    window.msCancelRequestAnimationFrame ? window.msCancelRequestAnimationFrame(handle.value) :
    clearInterval(handle);
};

/**
 * Behaves the same as setTimeout except uses requestAnimationFrame() where possible for better performance
 * @param {function} fn The callback function
 * @param {int} delay The delay in milliseconds
 */

window.requestTimeout = function(fn, delay) {
  if( !window.requestAnimationFrame       &&
    !window.webkitRequestAnimationFrame &&
    !(window.mozRequestAnimationFrame && window.mozCancelRequestAnimationFrame) && // Firefox 5 ships without cancel support
    !window.oRequestAnimationFrame      &&
    !window.msRequestAnimationFrame)
      return window.setTimeout(fn, delay);

  var start = new Date().getTime(),
    handle = new Object();

  function loop(){
    var current = new Date().getTime(),
      delta = current - start;

    delta >= delay ? fn.call() : handle.value = requestAnimFrame(loop);
  };

  handle.value = requestAnimFrame(loop);
  return handle;
};

/**
 * Behaves the same as clearTimeout except uses cancelRequestAnimationFrame() where possible for better performance
 * @param {int|object} fn The callback function
 */
window.clearRequestTimeout = function(handle) {
    window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) :
    window.webkitCancelAnimationFrame ? window.webkitCancelAnimationFrame(handle.value) :
    window.webkitCancelRequestAnimationFrame ? window.webkitCancelRequestAnimationFrame(handle.value) : /* Support for legacy API */
    window.mozCancelRequestAnimationFrame ? window.mozCancelRequestAnimationFrame(handle.value) :
    window.oCancelRequestAnimationFrame ? window.oCancelRequestAnimationFrame(handle.value) :
    window.msCancelRequestAnimationFrame ? window.msCancelRequestAnimationFrame(handle.value) :
    clearTimeout(handle);
};

var utils = {
  random: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  getRandomColor: function() {
    var colors = ['#D32F2F', '#F44336', '#7B1FA2', '#009688', '#FF9800'];
    return colors[this.random(0, colors.length - 1)];
  },
  inRange: function(value, min, max) {
    return (value > min && value < max);
  }
};

var game = {
  intervals: [],
  score: 0,
  sound: {
    die: undefined,
    move: undefined
  },
  enums: {
    _window: {
      height: $('body').height(),
      width: $('body').width()
    },
    mobile: {
      player: {
        distFromLeft: 10,
        posDown: 5,
        posUp: -20,
        size: 40
      }
    },
    other: {
      player: {
        distFromLeft: 10,
        posDown: 10,
        posUp: -100,
        size: 40
      }
    }
  },
  data: {
    player: {
      posY: 0,
      minPosY: 0,
      maxPosY: ($('body').height() - $('#chicken').height())
    }
  },
  isMobileDevice: ($('body').width() < 600),
  foods: [],
  init: function() {
    this.loadSoundTracks();
    this.intialState();
    this.applyGravityToPlayer();
    this.updateFoodPos();
    this.addFoodTimer();
    this.addEventListeners();
  },
  getConfig: function() {
    return this.isMobileDevice ? this.enums.mobile : this.enums.other;
  },
  loadSoundTracks: function() {
    this.sound.die = new Audio("assets/sounds/die.mp3");
  },
  intialState: function() {
    this.data.player.posY = 0;
    $('#chicken').show();
    $('.game-over').addClass('hide');
  },
  checkIfGameOver: function() {
    if((this.data.player.posY < this.data.player.minPosY) ||
       (this.data.player.posY > this.data.player.maxPosY)) {
      this.sound.die.play();
      $('#chicken').hide();
      $('.game-over').removeClass('hide');
      this.cancelTimers();
      this.removeEventListeners();
    }
  },
  addTimer: function(callback, timerInterval) {
    var self = this,
        interval;

    interval = requestInterval(function() {
      self.checkIfGameOver();
      callback();
    }, timerInterval);
    this.intervals.push(interval);
  },
  cancelTimers: function() {
    for(var index in this.intervals) {
      clearRequestInterval(this.intervals[index]);
    }
  },
  updateFoodPos: function() {
    var foodIsEaten;

    this.addTimer(function() {
      for(var index in this.foods) {
        foodIsEaten = this.isEaten(this.foods[index]);
        if(this.isEaten(this.foods[index]) ||
           this.isOutsideWindowBounds(this.foods[index].right)) {
          if(foodIsEaten) {
            this.score++;
            this.updateScoreUI();
          }
          this.foods[index].el.remove();
          this.foods.splice(index, 1);
        }
        else {
          this.foods[index].right += 3;
          this.foods[index].el.css({ right: ( '' + this.foods[index].right) + 'px' });
        }
      }
    }.bind(this), 16);
  },
  updateScoreUI: function() {
    $('.score').html(this.score);
  },
  isEaten: function(food) {
    var rightMax = this.enums._window.width - this.getConfig().player.distFromLeft - parseInt(this.getConfig().player.size/2),
        rightMin = rightMax - this.getConfig().player.size,
        topMax = this.data.player.posY + this.getConfig().player.size,
        topMin = this.data.player.posY;

    return (utils.inRange(food.right, rightMin, rightMax) &&
            utils.inRange(food.top, topMin, topMax));
  },
  isOutsideWindowBounds: function(distFromRight) {
    return (distFromRight > this.enums._window.width);
  },
  updatePlayerPos: function(posChange) {
    var $chicken = $('#chicken');

    this.data.player.posY += posChange;
    $chicken.css({ top: ( '' + this.data.player.posY + 'px') });
  },
  animatePlayer: function() {
    var $chicken = $('#chicken');

    $chicken.removeClass().addClass('chicken-move-1');
    requestTimeout(function() {
      $chicken.removeClass().addClass('chicken-move-4');
    }, 300);
  },
  applyGravityToPlayer: function() {
    this.addTimer(function() {
      this.updatePlayerPos(this.getConfig().player.posDown);
    }.bind(this), 50);
  },
  addFoodTimer: function() {
    this.addTimer(function() {
      this.addFood();
    }.bind(this), 3000);
  },
  addEventListeners: function() {
    var $body = $('body');
    $body.on('touchstart click', function() {
      this.checkIfGameOver();
      this.animatePlayer();
      this.updatePlayerPos(this.getConfig().player.posUp);
    }.bind(this));
  },
  removeEventListeners: function() {
    $('body').off();
    $('.food').remove();
    this.foods = [];
  },
  addFood: function() {
    var $food = $(document.createElement('div')),
        food = {
          top: utils.random(10, this.enums._window.height - 200),
          right: 10,
          'background-color': utils.getRandomColor(),
          el: $food
        };

    this.foods.push(food);
    $food.addClass('food').css(food);
    $('body').append($food);
  }
};