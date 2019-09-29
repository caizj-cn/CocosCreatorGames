// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        nodeMoney: cc.Node,
        nodeGuide: cc.Node,
        nodeStart: cc.Node,
        txtCount: cc.Label,
        txtTime: cc.Label,
        nodeMoneyBg: cc.Node,
        nodeTimerBg: cc.Node,
        nodeSpillMoney: cc.Node,
        txtTotal: cc.Label,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.node.on(cc.Node.EventType.TOUCH_START, event => {
            this.onTouchStart(event);
        });

        this.node.on(cc.Node.EventType.TOUCH_MOVE, event => {
            this.onTouchMove(event);
        });

        this.node.on(cc.Node.EventType.TOUCH_END, event => {
            this.onTouchEnd(event);
        });

        this.nodeMoneyBg.zIndex = 10;
        this.nodeTimerBg.zIndex = 10;
        this.nodeStart.zIndex = 20;

        this._touchNode = null;
        this._count = 0;
        this._isPlaying = false;
    },

    start () {

    },

    startGame(){
        this._isPlaying = true;
        this.nodeStart.active = false;
        this.txtTime.string = 10;
        this.txtCount.string = 0;
        this._count = 0;
        this.startTimer();
        this.spillMoney();
    },

    startTimer(){
        this.schedule(this.timeCallback, 1);
    },

    timeCallback(){
        let time = parseInt(this.txtTime.string);
        time--;
        this.txtTime.string = time;
        if(time <= 0){
            this.unschedule(this.timeCallback);
            this.onTimeout();
        }
    },

    onTimeout(){
        this.onGameEnd();
    },

    onGameEnd(){
        this.nodeStart.active = true;
        this._isPlaying = false;
        this.node.stopActionByTag(0xff);
        this.txtTotal.string = `￥${this._count * 100}`;
    },

    // update (dt) {},

    onTouchStart(event){
        if(!this._isPlaying){
            return;
        }

        this._touchNode = cc.instantiate(this.nodeMoney);
        this._touchNode.active = true;
        this._touchNode.parent = this.nodeMoney.parent;

        this.nodeGuide.active = false;
    },

    onTouchMove(event){
        if(!this._isPlaying){
            return;
        }

        let pos = event.getLocation();
        pos = this._touchNode.parent.convertToNodeSpaceAR(pos);

        if(pos.y > this._touchNode.y){
            this._touchNode.y = pos.y;
        }        
    },

    onTouchEnd(event){
        if(!this._isPlaying){
            return;
        }

        let now = event.getLocation();
        let start = event.getStartLocation();
        
        if(now.y - start.y > 10){
            let seq = cc.sequence(
                cc.spawn(
                    cc.moveBy(0.3, 0, cc.winSize.height),
                    cc.scaleTo(0.3, 0.7)
                ),
                cc.removeSelf(),
            );
            this._touchNode.runAction(seq);
        }

        this._count++;
        this.txtCount.string = `${this._count * 100}`;
    },

    onClick(){
        this.startGame();
    },

    spillMoney(){
        let seq = cc.sequence(
            cc.delayTime(0.2),
            cc.callFunc( () => {
                let x = Math.random() * cc.winSize.width;
                x -= cc.winSize.width / 2;

                let node = cc.instantiate(this.nodeSpillMoney);
                node.active = true;
                node.parent = this.nodeSpillMoney.parent;
                node.runAction(cc.sequence(
                    cc.place(x, cc.winSize.height / 2 + node.height / 2),
                    cc.spawn(cc.moveBy(1, 0, -cc.winSize.height - node.height / 2), cc.rotateBy(1, 1080)),
                    cc.removeSelf(),
                ));
            }),
        );

        seq.setTag(0xff);
        this.node.runAction(seq.repeatForever());
    },
});
