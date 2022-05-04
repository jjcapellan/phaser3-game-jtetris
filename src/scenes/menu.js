import { getCookie } from "../prefabs/helpers.js";
import { COOKIE_LAST, COOKIE_TOP } from "../prefabs/constants.js";
export default class Menu extends Phaser.Scene {
    constructor() {
        super('menu');
    }

    create() {
        // Background
        this.add.image(100, 20, 'atlas', 'background').setOrigin(0);

        // Top score
        let topScore = getCookie(COOKIE_TOP).padStart(6, '0');
        this.add.text(324, 1012, `TOP-${topScore}`, { fontSize: 24 }).setOrigin(0.5);

        // Board
        this.add.image(0, 0, 'atlas', 'table')
            .setOrigin(0);

        // Play sound
        this.snd_play = this.sound.add('go');

        // Menu contents
        this.createContents();

        const configCamera = {
            x: 121,
            y: 195,
            width: 406,
            height: 770,
            contentBounds: {
                x: 2000,
                y: 2000,
                length: 3 * 406
            },
            drag: 0.95,
            snap: {
                enable: true,
                padding: 406
            },
            horizontal: true
        }

        this.menuCamera = new ScrollingCamera(this, configCamera);
    }

    createContents() {
        const originX = 2000;
        const originY = 2000;
        const snapPadding = 406;

        this.createMenu(originX, originY);
        this.createCredits(originX + 1 * snapPadding, originY);
        this.createControls(originX + 2 * snapPadding, originY);
    }

    createMenu(originX, originY) {
        const centerX = originX + 406 / 2;
        const originYbt = originY + 300;

        this.add.image(centerX, originY + 140, 'atlas-menu', 'logowhite');

        // Button play
        this.bt_play = this.add.image(centerX, originYbt, 'atlas-menu', 'btplay')
            .setInteractive();
        this.bt_play.on('pointerdown', () => {
            this.snd_play.play();
            this.scene.start('inGame');
        });

        // Button controls
        this.bt_controls = this.add.image(centerX, originYbt + 1 * 130, 'atlas-menu', 'btcontrols')
            .setInteractive();
        this.bt_controls.on('pointerdown', () => {
            this.menuCamera.setSpeed(2 * 1300);
        });

        //Button credits
        this.bt_credits = this.add.image(centerX, originYbt + 2 * 130, 'atlas-menu', 'btcredits')
            .setInteractive();
        this.bt_credits.on('pointerdown', () => {
            this.menuCamera.setSpeed(1235);
        });

    }

    createCredits(originX, originY) {
        const centerX = originX + 406 / 2;

        this.add.image(centerX, originY + 100, 'atlas-menu', 'credits').setOrigin(0.5, 0);

        this.bt_back_credits = this.add.image(centerX, originY + 770 - 100, 'atlas-menu', 'btback')
            .setInteractive();

        this.bt_back_credits.on('pointerdown', () => {
            this.menuCamera.setSpeed(-2000);
        });

    }

    createControls(originX, originY) {
        const centerX = originX + 406 / 2;

        this.add.image(centerX, originY + 100, 'atlas-menu', 'controls').setOrigin(0.5, 0);

        this.bt_back_controls = this.add.image(centerX, originY + 770 - 100, 'atlas-menu', 'btback')
            .setInteractive();

        this.bt_back_controls.on('pointerdown', () => {
            this.menuCamera.setSpeed(-2 * 2000);
        });
    }
}