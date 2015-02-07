
viewHeight = 800
game = null

class RockfallGame
  constructor: (element, @levels, @listener) ->
    @levelnr = 0
    @level = @levels[@levelnr]
    game = new Phaser.Game(450, viewHeight, Phaser.AUTO, view, {
      preload: => @preload()
      update: => @update()
      create: =>
        @sound = {}
        ['jump', 'rock0', 'rock1', 'win', 'gameover'].forEach (a) => @sound[a] = game.add.audio(a)
        @pause("first")

    })

  preload: ->
    game.load.image("background", "img/Tileable3h.png")
    game.load.spritesheet("hero", "img/luggage.png", 32, 48)
    game.load.spritesheet("wizzard", "img/rincewind.png", 32, 48)
    game.load.image("wall", "img/wall.png")
    game.load.spritesheet("rock", "img/url.png", 92, 92, -1, 18, 36)
    game.load.audio("jump", "wav/jump.wav")
    game.load.audio("rock0", "wav/rock0.wav")
    game.load.audio("rock1", "wav/rock1.wav")

  #related to state
  pause: (@state = "paused") ->
    game.paused = true
    @listener.onPause?(@state)
  gameover: ->
    @pause("gameover")
  win: ->
    @state = "levelend"
    @state = "win" if @levelnr == @levels.length - 1
    @pause(@state)
  nextlevel: ->
    @levelnr = @levelnr + 1
    @samelevel()
  setlevel: (lvl) ->
    @levelnr = lvl
    @samelevel()
  samelevel: ->
    @level = @levels[@levelnr]
    @addAll(@level)
    @listener.onResize?(game.world.width, viewHeight)

  resume: ->
    switch @state
      when "first" then @samelevel()
      when "levelend" then @nextlevel()
      when "gameover" then @samelevel()
      when "win" then return
      when "running" then return
      when "paused"
      #do nothing
      else throw "Unknown state #{@state}"
    game.paused = false
    @state = "running"
    @listener.onResume?()

  # gameplay
  addRock: (bigProb, width, offsetLeft)->
    size = 50 + if game.rnd.frac() > bigProb then 50 else 0
    slots = Math.floor(width / size)
    x = offsetLeft+ game.rnd.integerInRange(0, slots-1)*size
    frame = 49
    #I cannot undersstand why for frame == 49 it renders whole trxture :(
    while frame == 49
      frame = game.rnd.integerInRange(0, 61)

    rock1 = @rocks.create(x, 0, 'rock', frame)
    rock1.body.gravity.y = 200
    #rock1.body.immovable = true
    rock1.body.collideWorldBounds = true
    rock1.body.bounce.y = 0
    rock1.width = size
    rock1.height = size

  addAll: (level) ->
    game.world.removeAll()
    wallWidth = 10
    ledgeOffset = 100
    ledgeWidth = 40

    width = level.width + wallWidth + ledgeWidth
    game.world.setBounds(0, 0, width, level.height)
    game.camera.setSize(width, viewHeight) #camera
    game.scale.setGameSize(width, viewHeight)

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.add.tileSprite(0, 0, width, level.height, "background")
    @hero = hero = game.add.sprite(width/2, level.height - 100, "hero")
    game.camera.follow(hero)
    game.physics.arcade.enable(hero)

    @wizzard = wizzard = game.add.sprite(width - 32, ledgeOffset - 48, "wizzard")
    game.physics.arcade.enable(wizzard)

    hero.body.gravity.y = 400
    hero.body.collideWorldBounds = true
    hero.body.bounce.y = 0
    hero.animations.add('right', [8,9,10,11], 10, true)
    hero.animations.add('left', [4,5,6,7], 10, true)

    @walls = walls = game.add.group()
    walls.enableBody = true
    addWall = (x0, y0, w, h) ->
      wall = walls.create(x0, y0, 'wall')
      wall.width = w
      wall.height = h
      wall.body.immovable = true

    addWall(0,0,wallWidth,level.height)
    addWall(level.width + wallWidth,ledgeOffset,wallWidth,level.height)
    addWall(wallWidth,level.height - wallWidth,level.width,wallWidth)
    addWall(level.width + wallWidth,ledgeOffset,ledgeWidth,wallWidth)

    @rocks = rocks = game.add.group()
    rocks.enableBody = true

    @cursors = game.input.keyboard.createCursorKeys();
    @space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)

    @lastRockAddedAgo = 0

  update: ->
    heroLanding = =>
      if @hero.body.touching.down and not @hero.landing
        @hero.landing = true
        @sound.rock0.play()
    rockLanding = (rock) =>
      rock.body.immovable = true
      rock.body.allowGravity = false
      rock.body.mass = Infinity
      rock.landing = true
      @sound.rock1.play()

    game.physics.arcade.collide(@hero, @rocks, heroLanding)
    game.physics.arcade.collide(@hero, @walls, heroLanding)
    game.physics.arcade.collide(@rocks, @rocks, (r1, r2) -> rockLanding(r1); rockLanding(r2))
    game.physics.arcade.collide(@rocks, @walls, rockLanding)
    if not @hero.body.touching.down
      @hero.landing = false

    if game.physics.arcade.overlap(@hero, @wizzard)
      return @win()

    @lastRockAddedAgo += game.time.physicsElapsedMS
    if @lastRockAddedAgo > @level.every
      @lastRockAddedAgo = 0
      @addRock(@level.size2, @level.width, 10)

    @hero.body.velocity.x = 0;
    if @cursors.left.isDown
      @hero.body.velocity.x = -150
      @hero.animations.play('left')
    else if @cursors.right.isDown
      @hero.body.velocity.x = 150
      @hero.animations.play('right')
    else
      @hero.animations.stop()
      @hero.frame = 0
    isInAir = not (@hero.body.touching.down or @hero.body.onFloor())
    if (@cursors.up.isDown and not isInAir) or (@pressedDown and @cursors.up.downDuration(200))
      @hero.body.velocity.y = -@cursors.up.duration-200
      @sound.jump.play() if not @pressedDown
      @pressedDown = true
    if @cursors.up.isUp
      @pressedDown = false
    if isInAir
      @hero.body.velocity.x = @hero.body.velocity.x / 2
    if @hero.body.touching.up and not isInAir
      @gameover()

window.RockfallGame = RockfallGame