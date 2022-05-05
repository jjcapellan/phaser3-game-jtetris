import Table from '../prefabs/table.js';
import Controls from '../prefabs/controls.js';
import Piece from '../prefabs/piece.js';
import * as h from '../prefabs/helpers.js';

import {
    GRAVITY_LEVELS,
    MILLISECONDS_PER_FRAME,
    SOFTDROP_DELAY,
    PIECE_TYPES,
    COOKIE_LAST,
    COOKIE_TOP
} from '../prefabs/constants.js';

export default class InGame extends Phaser.Scene {
    constructor() {
        super('inGame');
    }

    init() {
        this.pieceQueue = { current: 0, next: 0 };
        this.initPieceQueue();
        this.stepDelay = GRAVITY_LEVELS[0] * MILLISECONDS_PER_FRAME; // 48 frames per cell in level 0
        this.score = 0;
        this.isGameOver = false;
    }

    create() {

        this.customEmitter = new Phaser.Events.EventEmitter();
        const customEmitter = this.customEmitter;

        this.add.image(100, 20, 'atlas', 'background').setOrigin(0);

        this.createUi();

        this.add.image(0, 0, 'atlas', 'table').setOrigin(0);

        this.table = new Table(this);

        this.piece = new Piece(this, this.pieceQueue.current, this.table.colorsArray);
        this.piece.print();
        this.table.update();

        this.controls = new Controls(this);

        //// Sounds
        this.snd_line = this.sound.add('line');
        this.snd_spin = this.sound.add('spin').setVolume(0.8);
        this.snd_down = this.sound.add('knock').setVolume(0.4);
        this.snd_levelup = this.sound.add('levelup');
        this.snd_score4 = this.sound.add('score4');
        this.snd_move = this.sound.add('move').setVolume(0.4);
        
        // Music
        this.music_gameover = this.sound.add('gameover');
        this.music_ingame = this.sound.add('ingame', { volume: 0.4, loop: true });
        this.music_ingame.play();

        //// Events
        const customEvents = {
            'PIECE_TOUCH_DOWN': 'pieceTouchDown',
            'GAME_OVER': 'gameover',
            'NEW_RECORD': 'newrecord',
            'X4_LINES': 'x4Lines',
            'LEVEL_UP': 'levelup',
            'NEXT_PIECE': 'nextPiece',
            'EXPLODE_ALL': 'explodeall'
        }


        customEmitter.on(customEvents.PIECE_TOUCH_DOWN, this.onPieceDown, this);
        customEmitter.on(customEvents.LEVEL_UP, this.onLevelUp, this);
        customEmitter.on(customEvents.GAME_OVER, this.onGameOver, this);
        customEmitter.on(customEvents.EXPLODE_ALL, this.onExplodeAll, this);

        this.timeCounter = 0;

    }

    createUi() {
        // UI SCORE
        this.add.text(324, 45, 'score', { fontSize: 24, align: 'center' }).setOrigin(0.5);
        this.ui_score = this.add.text(324, 70, '000000', { fontSize: 24, align: 'center' }).setOrigin(0.5);

        // UI NEXT
        this.add.text(370, 110, 'next', { fontSize: 24, align: 'center' }).setOrigin(0.5);
        this.ui_next = this.add.image(370, 148, 'atlas', PIECE_TYPES.get(this.pieceQueue.next)).setOrigin(0.5);

        // UI LEVEL
        this.add.text(276, 110, 'level', { fontSize: 24, align: 'center' }).setOrigin(0.5);
        this.ui_level = this.add.text(276, 135, '0', { fontSize: 24, align: 'center' }).setOrigin(0.5);

        // UI TOP SCORE
        let topScore = h.getCookie(COOKIE_TOP).padStart(6, '0');
        this.add.text(324, 1012, `TOP-${topScore}`, { fontSize: 24 }).setOrigin(0.5);

        // UI GAME OVER
        this.ui_gameover_1 = this.add.text(330, 446, 'GAME OVER', { fontSize: 52, align: 'center', fontStyle: 'bold' })
            .setOrigin(0.5)
            .setAlpha(0);
        this.ui_gameover_2 = this.add.text(330, 510, '-SCORE-', { fontSize: 48, align: 'center' })
            .setOrigin(0.5)
            .setAlpha(0);
        this.ui_gameover_score = this.add.text(330, 580, '', { fontSize: 48, align: 'center', fontStyle: 'bold' })
            .setOrigin(0.5)
            .setAlpha(0);
        this.ui_gameover_click = this.add.text(330, 650, 'click to continue', { fontSize: 24, align: 'center' })
            .setOrigin(0.5)
            .setAlpha(0);
        this.gameOverMask = this.add.image(130, 194, 'mask')
            .setOrigin(0)
            .setAlpha(0)
            .setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    initPieceQueue() {
        this.pieceQueue.current = Phaser.Math.Between(1, 7);
        this.pieceQueue.next = Phaser.Math.Between(1, 7);
    }

    updatePieceQueue() {
        this.pieceQueue.current = this.pieceQueue.next;
        this.pieceQueue.next = Phaser.Math.Between(1, 7);
    }

    updateScore(score) {
        this.score += score;
        let str_score = this.score.toString().padStart(6, '0');
        this.ui_score.setText(str_score);
    }

    update(_time, dt) {
        if (this.isGameOver) {
            return;
        }
        let delay = this.controls.softDrop ? SOFTDROP_DELAY : this.stepDelay;
        this.timeCounter += dt;
        if (this.timeCounter > delay) {
            this.timeCounter = 0;
            this.onTableStep();
        }
        this.controls.update(dt);
    }

    //// Event handlers

    onGameOver() {
        this.isGameOver = true;
        // Check scores
        let topScore = h.getCookie(COOKIE_TOP);
        topScore = topScore ? parseInt(topScore) : 0;
        if (this.score > topScore) {
            h.setCookie(COOKIE_TOP, this.score, 365);
            this.customEmitter.emit('newrecord', this.score);
        }
        h.setCookie(COOKIE_LAST, this.score, 365);

        this.music_ingame.stop();

        this.table.explodeAll(); // Async function. Emits 'explodeall' on end.
    }

    onExplodeAll() {
        this.time.removeAllEvents();

        // Print game over
        this.ui_gameover_1.setAlpha(1);
        this.ui_gameover_2.setAlpha(1);
        this.ui_gameover_score.setText(this.ui_score.text);
        this.ui_gameover_score.setAlpha(1);
        this.ui_gameover_click.setAlpha(1);
        this.gameOverMask.setAlpha(0.6);

        this.input.on('pointerdown', () => {
            this.scene.start('menu');
        });
    }

    onTableStep() {
        // Delete piece from table
        this.piece.clear();

        // Update piece position
        this.piece.y--;
        if (this.piece.checkCollision()) {
            this.piece.y++;
            this.customEmitter.emit('pieceTouchDown', this);
        }
        // Draw piece on table
        this.piece.print();
        // Score softDrop
        if (this.controls.softDrop) {
            this.score++;
        }

        this.table.update();
    }

    onLevelUp(level) {
        this.ui_level.setText(level);
        this.snd_levelup.play();
        let gravity = GRAVITY_LEVELS[this.table.level];
        this.stepDelay = gravity ? gravity * MILLISECONDS_PER_FRAME : 1;
    }

    onPieceDown() {
        this.controls.initDown();
        this.snd_down.play();
        // Draws the piece
        this.piece.print();
        // Score of softDrop
        this.updateScore(0);
        // Check complete lines
        let score = this.table.checkLines();
        if (score) {
            this.updateScore(score);
            this.table.deleteCompletes();
        }
        // Check game over
        if (this.piece.ySpawn == this.piece.y) {
            this.customEmitter.emit('gameover');
        }
        // Update pieceQueue
        this.updatePieceQueue();
        this.ui_next.setFrame(PIECE_TYPES.get(this.pieceQueue.next));
        // Inits the piece
        this.piece.init(this.pieceQueue.current);
    }

}