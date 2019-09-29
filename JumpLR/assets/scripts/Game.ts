/*
 * @Copyright: Copyright (c) 2019
 * @Author: caizhijun
 * @Version: 1.0
 * @Date: 2019-08-20 15:52:27
 */
// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class Game extends cc.Component {

    @property(cc.Node)
    nodeBg: cc.Node = null;

    @property(cc.Node)
    nodeRobot: cc.Node = null;

    @property(cc.Node)
    nodeEnd: cc.Node = null;

    @property(cc.Label)
    txtPoints: cc.Label = null;

    // 是否正在移动
    private mIsPlaying: boolean = false;
    private mPoints: number = 0;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.node.on(cc.Node.EventType.TOUCH_START, (event: any) => {
            event.stopPropagation();
            this.onTouchCallback(event);
        });

        this.mPoints = 0;
    }

    start () {
        this.reloadBoxs();

        let robot = this.nodeRobot.getComponent('Robot');
        robot.setAddCallback( () => {
            this.onAddPoints();
        });
        robot.setFailedCallback( () => {
            this.onGameEnd();
        });

        this.mIsPlaying = true;
    }

    onAddPoints(){
        this.mPoints++;
    }

    onGameEnd(){
        this.mIsPlaying = false;

        this.txtPoints.string = `得分：${this.mPoints}`;
        this.nodeEnd.active = true;
    }

    reloadBoxs(){
        let boxMgr = this.getComponent('BoxMgr');
        boxMgr.reloadAll();

        let robot = this.nodeRobot.getComponent('Robot');
        if(robot.getCurrent() == null){
            let standBox = boxMgr.getStandBox();
            let nextBox = standBox.getComponent('Box').getNext();

            robot.setCurrent(standBox);
            robot.setNext(nextBox);

            if(nextBox.x > standBox.x){
                robot.turnRight();
            }else{
                robot.turnLeft();
            }
        }else{
            robot.setCurrent(robot.getCurrent());
        }
    }

    robotJumpLeft(){
        let js = this.nodeRobot.getComponent('Robot');
        js.turnLeft();
        js.jump();
    }

    robotJumpRight(){
        let js = this.nodeRobot.getComponent('Robot');
        js.turnRight();
        js.jump();
    }

    // update (dt) {}

    /**
     * @description: 背景下移
     * @param {type} 
     * @return: 
     */
    bgDown(){
        let maxY = -cc.winSize.height / 2 - 2 * cc.winSize.height;
        let interval = this.node.getComponent('BoxMgr').getIntervalY();
        
        // 超出了，刷屏
        if(this.nodeBg.y - interval <= maxY){
            this.nodeBg.y += 2 * cc.winSize.height;
            this.reloadBoxs();
        }

        // 下移
        this.nodeBg.runAction(cc.sequence(
            cc.moveBy(0.2, 0, -interval),
            cc.callFunc( () => {
                
            })
        ));
    }

    /**
     * @description: 点击屏幕
     * @param {type} 
     * @return: 
     */
    onTouchCallback(event: any){
        if(!this.mIsPlaying){
            return;
        }

        if(this.nodeRobot.getComponent('Robot').isJumping()){
            return;
        }

        this.bgDown();

        this.mIsPlaying = true;
        let location = event.getLocation();
        if(location.x < cc.winSize.width / 2){
            this.robotJumpLeft();
        }else{
            this.robotJumpRight();
        }       
    }

    onClick(){
        this.nodeEnd.active = false;
        cc.director.loadScene('game');
    }
}
