export default class Table {

    constructor(scene) {
        this.scene = scene;

        this.cellWidth = 38;
        this.cellHeight = 38;
        this.width = 10; // in cells
        this.height = 23; // in cells
        this.topVisibleRow = 19;
        this.x = 135;
        this.y = 88;


        this.stepDelay = 400;
        this.linesPerLevel = 10;
        this.lines = 0;
        this.level = 0;
        this.emitter = this.scene.customEmitter;


        this.completeRows = [];

        this.init();

        return this;
    }

    init() {
        this.initAlphaArray();
        this.initCellsArray();
        this.particlesEmitter = this.scene.add.particles('atlas', 'particle').createEmitter({
            x: 0,
            y: 0,
            blendMode: 'screen',
            scale: { start: 1.2, end: 0 },
            speed: { min: -400, max: 400 },
            angle:{min: -180, max: 180},
            frequency: -1,
            quantity: 80
        });
        this.particlesEmitter.setEmitZone({
            source: new Phaser.Geom.Line(0, 0, 380, 0),
            type: 'edge',
            quantity: 80
        });
    }

    /* Creates and inits an 2d array of integers based on grid positions. 
    /* Each value represents a color.
    */
    initAlphaArray() {
        this.colorsArray = [];
        for (let i = 0; i < this.height; i++) {
            this.colorsArray[i] = new Array(this.width).fill(0);
        }
    }

    /* Creates and inits an 2d array of image objects based on grid positions. 
    /* Each value is a Phaser.GameObject.Image.
    */
    initCellsArray() {
        this.cellsArray = [];
        this.colorsArray.forEach((row, idxRow, arr) => {
            let imgsRow = [];

            row.forEach((v, idxColumn) => {
                let posX = this.x + this.cellWidth * idxColumn;
                let posY = this.y + this.cellHeight * (this.height - 1) - idxRow * this.cellHeight;
                let cellImg = this.scene.add.image(posX, posY, 'atlas', 'p5')
                    .setOrigin(0)
                    .setVisible(false);
                if (v) {
                    cellImg.setVisible(true);
                }
                imgsRow.push(cellImg);
            });

            this.cellsArray.push(imgsRow);
        });
    }


    /* Updates visibility and texture of the image objects in cellsArray. 
    /* For this purpose, uses the values of colorsArray.
    */
    update() {
        const updateCell = (x, y, pieceIndex) => {
            if (pieceIndex) {
                this.cellsArray[y][x]
                    .setTexture('atlas', 'p' + pieceIndex)
                    .setVisible(true);
            } else {
                this.cellsArray[y][x]
                    .setVisible(false);
            }
        } // end drawCell

        this.colorsArray.forEach((row, idxRow) => {
            row.forEach((v, idxColumn) => {
                updateCell(idxColumn, idxRow, v);
            });
        });
    }

    checkLines() {
        let completeRows = [];

        for (let i = this.colorsArray.length - 1; i >= 0; i--) {
            let row = this.colorsArray[i];
            let completed = false;
            for (let j = 0; j < row.length; j++) {

                if (!row[j]) {
                    completed = false;
                    break;
                }
                completed = true;
            }
            if (completed) completeRows.push(i);


        }

        this.completeRows = completeRows;

        let score = this.getScore();

        if (score) {
            this.updateLines();
            if (this.isLevelUp()) {
                this.level++;
                this.emitter.emit('levelup', this.level);
            }
        }

        return score;
    }

    updateLines() {
        this.lines += this.completeRows.length;
    }

    isLevelUp() {
        return Math.floor(this.lines / this.linesPerLevel) > this.level;
    }

    getScore() {
        let linesCompleted = this.completeRows.length;
        if (linesCompleted == 0) return 0;

        let score = 0;
        switch (linesCompleted) {
            case 1:
                return (this.level + 1) * 40;

            case 2:
                return (this.level + 1) * 100;

            case 3:
                return (this.level + 1) * 300;

            case 4:
                return (this.level + 1) * 1200;

            default:
                return 0;
        }
    }

    explodeLine(rowIndex) {
        let y = this.y + this.height * 38 - ((rowIndex + 1) - 0.5) * this.cellHeight;
        this.particlesEmitter.setPosition(this.x, y);
        this.particlesEmitter.explode();
        this.scene.snd_line.play();
    }

    explodeAll() {
        this.particlesEmitter.emitZone = null;

        this.particlesEmitter.setPosition(this.scene.game.config.width/2, 550);
        this.particlesEmitter.setFrame(['p1', 'p2', 'p3', 'p4', 'p5'], true, 100);
        
        this.scene.music_gameover.play();
        this.scene.music_gameover.on('complete', () => {
            this.initAlphaArray();
            this.update();
            this.scene.snd_line.play();
            this.particlesEmitter.explode();
            this.scene.customEmitter.emit('explodeall');
        });



    }

    deleteCompletes() {
        this.completeRows.forEach((rowIndex) => {
            this.explodeLine(rowIndex);
            this.colorsArray.splice(rowIndex, 1);
        });

        // Not possible with push()
        for (let i = this.height - this.completeRows.length; i < this.height; i++) {
            this.colorsArray[i] = new Array(this.width).fill(0);
        }

        this.completeRows = [];
    }

    getPosition(column, row) {
        let position = {};
        position.x = this.x + this.cellWidth * column + this.cellWidth / 2;
        position.y = this.y + (this.cellHeight * this.height) - this.cellHeight * row + this.cellHeight / 2;

        return position;
    }
}