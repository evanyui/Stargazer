// Constants
var TURN_FACTOR = 0.2;
var BOOST = 200;
var GAME_SPEED = 2.0;
var SPAWN = 6500; // Suggest: between 6000-7000

// Globals
var cursors;
var space;
var planets;
var planet;
var ship;
var x, y;
var v = 0;
var earth;
var labelScore;
var score;
var music;
var anim;
var pauseMsg;
var touchLabel;
var target;

// Create our 'main' state that will contain the game
var mainState = {
    preload: function() {
        // This function will be executed at the beginning
        // That's where we load the images and sounds

        // Load the map tiles
        game.load.image('space', 'assets/space.png');
        // Load the planet sprites
        game.load.image('planet1', 'assets/planet1.png');
        game.load.image('planet2', 'assets/planet2.png');
        game.load.image('planet3', 'assets/planet3.png');
        game.load.image('planet4', 'assets/planet4.png');
        game.load.image('planet5', 'assets/planet5.png');
        game.load.image('planet6', 'assets/planet6.png');
        // Load sprite sheets
        game.load.spritesheet('sprites', 'assets/sprites.png', 40, 28, 8);
    },

    create: function() {
        // This function is called after the preload function
        // Here we set up the game, display sprites, etc.
        // Scaling options
        // this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        // // Have the game centered horizontally
        // this.scale.pageAlignHorizontally = true;
        // this.scale.pageAlignVertically = true;

        // Set the physics system
        game.physics.startSystem(Phaser.Physics.P2JS);
        // Set background
        space = game.add.tileSprite(0, 0, window.screen.width, window.screen.height, 'space');

        // Set game boundary
        game.world.setBounds(0, -50, window.screen.width, window.screen.height+100);

        // Create an empty group
        planets = game.add.group();

        // Ship setup
        // Display the ship at center bottom of screen
        ship = game.add.sprite(game.world.centerX, game.world.centerY+game.world.centerY/4, 'sprites');
        // Set scale of ship
        // ship.scale.setTo(0.2, 0.2);
        // Add physics to the ship
        game.physics.p2.enable(ship, true);
        // Move the anchor to the left and downward
        ship.anchor.setTo(0.5, 0.5);
        ship.body.angle = -90;
        ship.body.clearShapes();
        // Initialize
        ship.body.force.x = 0;
        ship.body.force.y = 0;
        v = 0;
        // Load animation
        anim = ship.animations.add('fly');
        anim.frame = 7;

        // Add planets every 6~7 seconds
        this.timer = game.time.events.loop(SPAWN, this.createPlanet, this);

        // Call the 'boost' function when the spacekey is hit
        var spaceKey = game.input.keyboard.addKey(
                        Phaser.Keyboard.SPACEBAR);
        cursors = game.input.keyboard.createCursorKeys();
        spaceKey.onDown.add(this.boost, this);
        spaceKey.onUp.add(this.brake, this);
        game.input.onDown.add(this.boost, this);
        game.input.onUp.add(this.brake, this);

        // Add sounds
        // this.jumpSound = game.add.audio('jump');

        // Create score label
        score = 0;
        labelScore = game.add.text(window.screen.width/2, 50, "0",
            { font: "30px Arial", fill: "rgba(255,255,255,1.0)" });
        labelScore.anchor.set(0.5);

        // Pause Game mechanism
        var pauseLabel = game.add.text( window.screen.width-40, 20, '| |',
            { font: '20px Arial', fill: 'rgba(255,255,255,0.8)',  });
        pauseLabel.fontWeight = 'bold';
        pauseLabel.inputEnabled = true;
        // pauseLabel.strokeThickness = 4;
        pauseLabel.setShadow(0, 2, 'rgba(0,0,0,1.0)', 2);
        pauseLabel.events.onInputUp.add(function () {
          // Pause
          game.paused = true;
          music.pause();
          // Message
          pauseMsg = game.add.text( window.screen.width/2, window.screen.height/2, 'Paused',
              { font: '30px Verdana', fill: 'rgba(255,255,255,1.0)' });
          pauseMsg.setShadow(0, 4, 'rgba(0,0,0,1.0)', 2);
          pauseMsg.anchor.set(0.5);

          touchLabel = game.add.text(window.screen.width/2,window.screen.height-100,'touch to resume',
                                    {font:'20px Verdana', fill:'rgba(255,255,255,0.2)',
                                    boundsAlignH:'center', boundsAlignV:'middle'});
          touchLabel.setShadow(0, 2, 'rgba(0,0,0,0.5)', 5);
          touchLabel.anchor.set(0.5);
        });
    },

    update: function() {
        // This function is called 60 times per second
        // It contains the game's logic
        // Keep score
        score++;
        labelScore.text = Math.floor(score/100);

        //  Scroll the background
        space.tilePosition.y += GAME_SPEED/2;
        // ship.body.y += GAME_SPEED;

        // If the ship is out of the screen, restart
        if (ship.y < 0 || ship.y > window.screen.height ||
              ship.x < 0 || ship.x > window.screen.width)
          this.restartGame();

        // Cursor controls
        // if (cursors.left.isDown)
        // {
        //     ship.body.angle-=TURN_FACTOR*10;
        // }
        // else if (cursors.right.isDown)
        // {
        //     ship.body.angle+=TURN_FACTOR*10;
        // }
        // For touch controls
        // var rad = Math.atan2(game.input.y - ship.body.y, game.input.x - ship.body.x);
        //decides turn left or right
        // var angle = game.math.radToDeg(rad)
        // ship.body.angle = angle;

        // Net gravitational force
        planets.forEach(function(p) {
          p.body.y += GAME_SPEED;
          if(p.body.y < -50 || p.body.y > window.screen.height+50) {
            planets.remove(p);
          }
          var speed;
          if (distanceBetween(ship,p) < 100) {
            speed = BOOST-100;
          } else if (distanceBetween(ship,p) < 200) {
            speed = BOOST-140;
          } else if (distanceBetween(ship,p) < 300) {
            speed = BOOST-200;
          }
          accelerateToObject(ship,p,speed);
        }, this);

        // Update ship direction to target
        if(planets.length>0) {
          var angle = Math.atan2(target.y - ship.y, target.x - ship.x);
          game.add.tween(ship.body).to({rotation: angle}, 200).start();
        }
        // Move ship according to new direction affected by gravity pull
        Math.radians = function(degrees) {
          return degrees * Math.PI / 180;
        };
        ship.body.force.y += v*Math.sin(game.math.degToRad(ship.angle));
        ship.body.force.x += v*Math.cos(game.math.degToRad(ship.angle));
    },

    // Boost ship
    boost: function() {
        // If game is paused, resume game
        if(game.paused) {
          game.paused = false;
          music.resume();
          pauseMsg.destroy();
          touchLabel.destroy();
        }
        else {
          v = BOOST;
          anim.play(null, true);
        }
    },

    // Brake the ship
    brake: function() {
        v = 0;
        anim.stop(null, true);
        anim.frame = 7;
    },

    // Restart the game
    restartGame: function() {
        // Start the 'main' state, which restarts the game
        planets.removeAll();
        loadData();
        game.state.start('finish');
    },

    // Create one planet
    createPlanet: function() {
        // Planet setup
        var y = -100;
        var x = Math.floor(Math.random() * (window.screen.width/4)+(3*window.screen.width/8));
        var style = Math.floor(Math.random() * 6) + 1;
        var p = game.add.sprite(x, y, 'planet'+style);
        // p.scale.setTo(0.2, 0.2);
        game.physics.p2.enable(p, true);
        p.body.static = true;
        p.body.clearShapes();
        // Automatically kill the planet when it's no longer visible
        p.checkWorldBounds = true;
        p.outOfBoundsKill = true;
        // Push into groups
        planets.add(p);

        // Update target for autoguidance
        target = p;
    },
};

var menuState = {
  preload: function() {
    // Load images
    game.load.image('ship', 'assets/ship.png');
    game.load.image('back', 'assets/space.png');

    // Load sounds
    game.load.audio('music', ['assets/music.mp3', 'assets/music.ogg']);
  },

  create: function() {
    // Scaling options
    // this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    // Have the game centered horizontally
    // this.scale.pageAlignHorizontally = true;
    // this.scale.pageAlignVertically = true;
    // Set up music
    music = game.add.audio('music');
    music.loop = true;
    music.play();

    // Ship setup
    // Display the ship at center bottom of screen


    this.back = game.add.tileSprite(0, 0, game.width, game.height, 'back');
    var nameLabel = game.add.text(window.screen.width/2,150,'Stargazer',{font:'50px Verdana', fill:'rgba(255,255,255,1.0)',
                              boundsAlignH:'center', boundsAlignV:'middle'});
    nameLabel.setShadow(0, 5, 'rgba(0,0,0,0.5)', 5);
    nameLabel.anchor.set(0.5);
    var highScore = game.add.text(window.screen.width/2, window.screen.height-150, "High Score: " + Math.floor(localStorage.getItem('highscore')/100),
                    { font: "22px Verdana", fill: "rgba(255,255,255,1.0)",
                      boundsAlignH:'center', boundsAlignV:'middle' });
    highScore.setShadow(0, 2, 'rgba(0,0,0,0.5)', 5);
    highScore.anchor.set(0.5);
    var tabLabel = game.add.text(window.screen.width/2,window.screen.height-100,'touch to start',
                              {font:'20px Verdana', fill:'rgba(255,255,255,0.2)',
                              boundsAlignH:'center', boundsAlignV:'middle'});
    tabLabel.setShadow(0, 2, 'rgba(0,0,0,0.5)', 5);
    tabLabel.anchor.set(0.5);
    var quoteLabel = game.add.text(window.screen.width/2,window.screen.height/2,"'Mankind was born on Earth. \n\t\t\t\t\tIt was never meant to die here.'\n\t\t\t\t\t\t\t\t\t\t - Interstellar",
                              {font:'16px Times New Roman', fill:'rgba(255,255,255,0.5)',
                              boundsAlignH:'center', boundsAlignV:'middle'});
    quoteLabel.setShadow(0, 2, 'rgba(0,0,0,0.5)', 5);
    quoteLabel.anchor.set(0.5);


    var spaceKey = game.input.keyboard.addKey(
                    Phaser.Keyboard.SPACEBAR);
    spaceKey.onDown.addOnce(this.start, this);
    this.game.input.onDown.add(this.start, this);

    var display = game.add.image(game.world.centerX, game.world.centerY+game.world.centerY/4, 'ship');
    display.anchor.setTo(0.5,0.5);
    display.angle = -90;
  },

  update: function() {
    // Background keeps going
    this.back.tilePosition.y += GAME_SPEED/2;
  },

  start: function() {
    game.state.start('main');
  }
};

var finishState = {
  preload: function() {
    game.load.image('back', 'assets/space.png');
  },

  create: function() {
    // Scaling options
    // this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    // // Have the game centered horizontally
    // this.scale.pageAlignHorizontally = true;
    // this.scale.pageAlignVertically = true;

    this.back = game.add.tileSprite(0, 0, window.screen.width, window.screen.height, 'back');
    var stringArray = ["'Do not go gentle into that good night; \n Old age should burn \n\t\t\t\t\t\t\t and rave at close of day. \n Rage, rage against the dying of the light.'",
                       "'Love is the one thing \n\t\t\t\t\t\t\t that transcends time and space.'",
                       "'We’re not meant to save the world, \n\t\t\t\t\t\t\t we’re meant to leave it.'",
                       "'We used to look up at the sky \n\t\t\t\t\t\tand wonder at our place in the stars, \n now we just look down \n\t\t\t\t\t\tand worry about our place in the dirt.'",
                       "'We’re still pioneers, we’ve barely begun. \n Our greatest accomplishments \n\t\t\t\t\t\t\t cannot be behind us, \n cause our destiny lies above us.'",
                       "'It's not possible.'\n\t\t\t\t\t\t\t'No. It's necessary.'",
                       "'Mankind was born on Earth. \n It was never meant to die here. \n The end of Earth will not be the end of us. \n Go further. \n Mankind's next step will be our greatest.'"];
    var chosen = Math.floor(Math.random()*stringArray.length);
    var strings = stringArray[chosen]+"\n\t\t\t\t\t\t\t\t\t\t - Interstellar";
    var quote = game.add.text(window.screen.width/2,window.screen.height/2-150,strings,{font:'16px Times New Roman', fill:'rgba(255,255,255,0.5)',
                              boundsAlignH:'center', boundsAlignV:'middle'});
    quote.setShadow(0, 2, 'rgba(0,0,0,0.5)', 5);
    quote.anchor.set(0.5);
    var currentScore = game.add.text(window.screen.width/2, window.screen.height/2+50, "Current Score: " + Math.floor(score/100),
                    { font: "22px Verdana", fill: "rgba(255,255,255,1.0)",
                      boundsAlignH:'center', boundsAlignV:'middle' });
    currentScore.fontWeight = 'bold';
    currentScore.setShadow(0, 2, 'rgba(0,0,0,0.5)', 5);
    currentScore.anchor.set(0.5);
    var highScore = game.add.text(window.screen.width/2, window.screen.height/2+100, "High Score: " + Math.floor(localStorage.getItem('highscore')/100),
                    { font: "22px Verdana", fill: "rgba(255,255,255,1.0)",
                      boundsAlignH:'center', boundsAlignV:'middle' });
    highScore.setShadow(0, 2, 'rgba(0,0,0,0.5)', 5);
    highScore.anchor.set(0.5);
    var tabLabel = game.add.text(window.screen.width/2,window.screen.height-100,'touch to start',
                              {font:'20px Verdana', fill:'rgba(255,255,255,0.2)',
                              boundsAlignH:'center', boundsAlignV:'middle'});
    tabLabel.setShadow(0, 2, 'rgba(0,0,0,0.5)', 5);
    tabLabel.anchor.set(0.5);

    var spaceKey = game.input.keyboard.addKey(
                    Phaser.Keyboard.SPACEBAR);
    spaceKey.onDown.addOnce(this.start, this);
    this.game.input.onDown.add(this.start, this);
  },

  update: function() {
    // Background keeps going
    this.back.tilePosition.y += GAME_SPEED/2;
  },

  start: function() {
    game.state.start('main');
  },

};

function distanceBetween(spriteA,spriteB) {
  var dx = spriteA.body.x - spriteB.body.x;  //distance ship X to planet X
  var dy = spriteA.body.y - spriteB.body.y;  //distance ship Y to planet Y
  var dist = Math.sqrt(dx*dx + dy*dy);     //pythagoras ^^  (get the distance to each other)
  return dist;
}

function accelerateToObject(obj1, obj2, speed) {
  // if (typeof speed === 'undefined') { speed = 10; }
  // var rad = Math.atan2(obj2.y - obj1.y, obj2.x - obj1.x);
  // //decides turn left or right
  // var angle = game.math.radToDeg(rad)<=0 ? (360-game.math.radToDeg(rad)) : game.math.radToDeg(rad);
  // var direc = obj1.body.angle<=0 ? (360-obj1.body.angle) : obj1.body.angle;
  // var diff = Math.abs(direc - angle);
  // if(diff<=0) {
  //   360 - diff;
  // }
  // if(diff >= 180) {
  //   // turn right
  //   obj1.body.angle+= TURN_FACTOR;
  // } else if(diff <= 180) {
  //   // turn left
  //   obj1.body.angle-= TURN_FACTOR;
  // }
  // obj1.body.force.x += Math.cos(rad) * speed;    // accelerateToObject
  // obj1.body.force.y += Math.sin(rad) * speed;
  if (typeof speed === 'undefined') { speed = 20; }
  var angle = Math.atan2(obj2.y - obj1.y, obj2.x - obj1.x);
  // obj1.body.rotation = angle;  // Autoguide system
  // game.add.tween(obj1.body).to({rotation: angle}, 80).start();
  obj1.body.force.x += Math.cos(angle) * speed;
  obj1.body.force.y += Math.sin(angle) * speed;
}

function loadData() {
  if(localStorage.getItem('highscore') === null){
    localStorage.setItem('highscore',score);
  } else if(score > localStorage.getItem('highscore')) {
    localStorage.setItem('highscore',score);
  }
}

// Initialize Phaser with game screen size
var game = new Phaser.Game(window.screen.width, window.screen.height);

// Add the 'mainState' and call it 'main'
game.state.add('main', mainState);
game.state.add('menu', menuState);
game.state.add('finish', finishState);

// Start the state to actually start the game
game.state.start('menu');
