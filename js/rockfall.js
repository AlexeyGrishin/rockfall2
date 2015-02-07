(function() {
  var RockfallGame, game, viewHeight;

  viewHeight = 800;

  game = null;

  RockfallGame = (function() {
    function RockfallGame(element, _at_levels, _at_listener) {
      this.levels = _at_levels;
      this.listener = _at_listener;
      this.levelnr = 0;
      this.level = this.levels[this.levelnr];
      game = new Phaser.Game(450, viewHeight, Phaser.AUTO, view, {
        preload: (function(_this) {
          return function() {
            return _this.preload();
          };
        })(this),
        update: (function(_this) {
          return function() {
            return _this.update();
          };
        })(this),
        create: (function(_this) {
          return function() {
            _this.sound = {};
            ['jump', 'rock0', 'rock1', 'win', 'gameover'].forEach(function(a) {
              return _this.sound[a] = game.add.audio(a);
            });
            return _this.pause("first");
          };
        })(this)
      });
    }

    RockfallGame.prototype.preload = function() {
      game.load.image("background", "img/Tileable3h.png");
      game.load.spritesheet("hero", "img/luggage.png", 32, 48);
      game.load.spritesheet("wizzard", "img/rincewind.png", 32, 48);
      game.load.image("wall", "img/wall.png");
      game.load.spritesheet("rock", "img/url.png", 92, 92, -1, 18, 36);
      game.load.audio("jump", "wav/jump.wav");
      game.load.audio("rock0", "wav/rock0.wav");
      return game.load.audio("rock1", "wav/rock1.wav");
    };

    RockfallGame.prototype.pause = function(_at_state) {
      var _base;
      this.state = _at_state != null ? _at_state : "paused";
      game.paused = true;
      return typeof (_base = this.listener).onPause === "function" ? _base.onPause(this.state) : void 0;
    };

    RockfallGame.prototype.gameover = function() {
      return this.pause("gameover");
    };

    RockfallGame.prototype.win = function() {
      this.state = "levelend";
      if (this.levelnr === this.levels.length - 1) {
        this.state = "win";
      }
      return this.pause(this.state);
    };

    RockfallGame.prototype.nextlevel = function() {
      this.levelnr = this.levelnr + 1;
      return this.samelevel();
    };

    RockfallGame.prototype.setlevel = function(lvl) {
      this.levelnr = lvl;
      return this.samelevel();
    };

    RockfallGame.prototype.samelevel = function() {
      var _base;
      this.level = this.levels[this.levelnr];
      this.addAll(this.level);
      return typeof (_base = this.listener).onResize === "function" ? _base.onResize(game.world.width, viewHeight) : void 0;
    };

    RockfallGame.prototype.resume = function() {
      var _base;
      switch (this.state) {
        case "first":
          this.samelevel();
          break;
        case "levelend":
          this.nextlevel();
          break;
        case "gameover":
          this.samelevel();
          break;
        case "win":
          return;
        case "running":
          return;
        case "paused":
          break;
        default:
          throw "Unknown state " + this.state;
      }
      game.paused = false;
      this.state = "running";
      return typeof (_base = this.listener).onResume === "function" ? _base.onResume() : void 0;
    };

    RockfallGame.prototype.addRock = function(bigProb, width, offsetLeft) {
      var frame, rock1, size, slots, x;
      size = 50 + (game.rnd.frac() > bigProb ? 50 : 0);
      slots = Math.floor(width / size);
      x = offsetLeft + game.rnd.integerInRange(0, slots - 1) * size;
      frame = 49;
      while (frame === 49) {
        frame = game.rnd.integerInRange(0, 61);
      }
      rock1 = this.rocks.create(x, 0, 'rock', frame);
      rock1.body.gravity.y = 200;
      rock1.body.collideWorldBounds = true;
      rock1.body.bounce.y = 0;
      rock1.width = size;
      return rock1.height = size;
    };

    RockfallGame.prototype.addAll = function(level) {
      var addWall, hero, ledgeOffset, ledgeWidth, rocks, wallWidth, walls, width, wizzard;
      game.world.removeAll();
      wallWidth = 10;
      ledgeOffset = 100;
      ledgeWidth = 40;
      width = level.width + wallWidth + ledgeWidth;
      game.world.setBounds(0, 0, width, level.height);
      game.camera.setSize(width, viewHeight);
      game.scale.setGameSize(width, viewHeight);
      game.physics.startSystem(Phaser.Physics.ARCADE);
      game.add.tileSprite(0, 0, width, level.height, "background");
      this.hero = hero = game.add.sprite(width / 2, level.height - 100, "hero");
      game.camera.follow(hero);
      game.physics.arcade.enable(hero);
      this.wizzard = wizzard = game.add.sprite(width - 32, ledgeOffset - 48, "wizzard");
      game.physics.arcade.enable(wizzard);
      hero.body.gravity.y = 400;
      hero.body.collideWorldBounds = true;
      hero.body.bounce.y = 0;
      hero.animations.add('right', [8, 9, 10, 11], 10, true);
      hero.animations.add('left', [4, 5, 6, 7], 10, true);
      this.walls = walls = game.add.group();
      walls.enableBody = true;
      addWall = function(x0, y0, w, h) {
        var wall;
        wall = walls.create(x0, y0, 'wall');
        wall.width = w;
        wall.height = h;
        return wall.body.immovable = true;
      };
      addWall(0, 0, wallWidth, level.height);
      addWall(level.width + wallWidth, ledgeOffset, wallWidth, level.height);
      addWall(wallWidth, level.height - wallWidth, level.width, wallWidth);
      addWall(level.width + wallWidth, ledgeOffset, ledgeWidth, wallWidth);
      this.rocks = rocks = game.add.group();
      rocks.enableBody = true;
      this.cursors = game.input.keyboard.createCursorKeys();
      this.space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
      return this.lastRockAddedAgo = 0;
    };

    RockfallGame.prototype.update = function() {
      var heroLanding, isInAir, rockLanding;
      heroLanding = (function(_this) {
        return function() {
          if (_this.hero.body.touching.down && !_this.hero.landing) {
            _this.hero.landing = true;
            return _this.sound.rock0.play();
          }
        };
      })(this);
      rockLanding = (function(_this) {
        return function(rock) {
          rock.body.immovable = true;
          rock.body.allowGravity = false;
          rock.body.mass = Infinity;
          rock.landing = true;
          return _this.sound.rock1.play();
        };
      })(this);
      game.physics.arcade.collide(this.hero, this.rocks, heroLanding);
      game.physics.arcade.collide(this.hero, this.walls, heroLanding);
      game.physics.arcade.collide(this.rocks, this.rocks, function(r1, r2) {
        rockLanding(r1);
        return rockLanding(r2);
      });
      game.physics.arcade.collide(this.rocks, this.walls, rockLanding);
      if (!this.hero.body.touching.down) {
        this.hero.landing = false;
      }
      if (game.physics.arcade.overlap(this.hero, this.wizzard)) {
        return this.win();
      }
      this.lastRockAddedAgo += game.time.physicsElapsedMS;
      if (this.lastRockAddedAgo > this.level.every) {
        this.lastRockAddedAgo = 0;
        this.addRock(this.level.size2, this.level.width, 10);
      }
      this.hero.body.velocity.x = 0;
      if (this.cursors.left.isDown) {
        this.hero.body.velocity.x = -150;
        this.hero.animations.play('left');
      } else if (this.cursors.right.isDown) {
        this.hero.body.velocity.x = 150;
        this.hero.animations.play('right');
      } else {
        this.hero.animations.stop();
        this.hero.frame = 0;
      }
      isInAir = !(this.hero.body.touching.down || this.hero.body.onFloor());
      if ((this.cursors.up.isDown && !isInAir) || (this.pressedDown && this.cursors.up.downDuration(200))) {
        this.hero.body.velocity.y = -this.cursors.up.duration - 200;
        if (!this.pressedDown) {
          this.sound.jump.play();
        }
        this.pressedDown = true;
      }
      if (this.cursors.up.isUp) {
        this.pressedDown = false;
      }
      if (isInAir) {
        this.hero.body.velocity.x = this.hero.body.velocity.x / 2;
      }
      if (this.hero.body.touching.up && !isInAir) {
        return this.gameover();
      }
    };

    return RockfallGame;

  })();

  window.RockfallGame = RockfallGame;

}).call(this);
