import NodeMgr from "./NodeMgr";

/*
 * @Copyright: Copyright (c) 2019
 * @Author: caizhijun
 * @Version: 1.0
 * @Date: 2019-08-22 15:09:43
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

enum RobotFace{
    Left,
    Right
}

@ccclass
export default class Robot extends cc.Component {
    @property(cc.SpriteFrame)
    spfLeft: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    spfRight: cc.SpriteFrame = null;

    @property(cc.Label)
    txtPoints: cc.Label = null;

    private mPrevNode: cc.Node = null; // 上一次站着的节点
    private mCurrNode: cc.Node = null; // 当前站着的节点
    private mNextNode: cc.Node = null; // 下一个节点
    private mOffset: cc.Vec2 = cc.v2(11, 120); // 机器人与障碍物中心间隔
    private mRobotFace:number = -1; // -1朝左，1朝右
    private mAddCallback: any = null;
    private mFailedCallback: any = null;
    private mJumping: boolean = false;
    private mPoints: number = 0;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.node.zIndex = 20000;
        this.txtPoints.string = `${this.mPoints}`;
    }

    // update (dt) {}
    /**
     * @description: 向左转
     * @param {type} 
     * @return: 
     */
    turnLeft(){
        this.mRobotFace = RobotFace.Left;
        this.node.getComponent(cc.Sprite).spriteFrame = this.spfLeft;
    }

    /**
     * @description: 向右转
     * @param {type} 
     * @return: 
     */
    turnRight(){
        this.mRobotFace = RobotFace.Right;
        this.node.getComponent(cc.Sprite).spriteFrame = this.spfRight;
    }

    /**
     * @description: 设置下一个节点
     * @param {type} 
     * @return: 
     */
    setNext(node: cc.Node){
        this.mNextNode = node;
    }

    /**
     * @description: 设置当前节点
     * @param {type} 
     * @return: 
     */
    setCurrent(node: cc.Node){
        this.mCurrNode = node;
        this.node.position = this.mCurrNode.position.add(this.mOffset);
    }

    getCurrent(){
        return this.mCurrNode;
    }

    setAddCallback(callback: any){
        this.mAddCallback = callback;
    }

    setFailedCallback(callback: any){
        this.mFailedCallback = callback;
    }

    /**
     * @description: 跳
     * @param {type} 
     * @return: 
     */
    jump(){
        if(this.mNextNode == null){
            return;
        }
        this.mJumping = true;

        let curPos = this.node.position;       
        let nextPos = this.mNextNode.position;
        nextPos = nextPos.add(this.mOffset);

        // 能跳上去
        if((this.mRobotFace == RobotFace.Left && nextPos.x < curPos.x) || 
            (this.mRobotFace == RobotFace.Right && nextPos.x > curPos.x)){
            this.node.runAction(cc.sequence(
                cc.jumpTo(0.2, nextPos, 30, 1),
                cc.callFunc( () => {
                    this.mPrevNode = this.mCurrNode;
                    this.mCurrNode = this.mNextNode;
                    this.mNextNode = this.mCurrNode.getComponent('Box').getNext();
                    this.mJumping = false;
                }),
                cc.callFunc( () => {
                    if(this.mPrevNode != null){
                        this.mPrevNode.getComponent('Box').down(-this.getDownY(this.mPrevNode));
                        this.mPrevNode = null;
                    }

                    if(this.mAddCallback != null){
                        this.mAddCallback();
                    }
                    this.mPoints++;
                    this.txtPoints.string = `${this.mPoints}`;
                })
            )); 
        }
        // 跳不上去
        else{
            let targetPos = curPos;
            if(nextPos.x > curPos.x){
                targetPos.x -= 130;
            }else{
                targetPos.x += 130;
            }
            targetPos.y += 65;

            this.node.runAction(cc.sequence(
                cc.jumpTo(0.2, targetPos, 30, 1),
                cc.callFunc( () => {
                    this.mJumping = false;
                    if(this.mPrevNode != null){
                        this.mPrevNode.getComponent('Box').down(-this.getDownY(this.mPrevNode));
                        this.mPrevNode = null;
                    }                   

                    this.node.runAction(cc.sequence(
                        cc.moveBy(0.5, 0, -this.getDownY(this.node)),
                        cc.callFunc( () => {
                            if(this.mFailedCallback != null){
                                this.mFailedCallback();
                            }
                        })
                    ));
                }),
            ));
        }        
    }

    getDownY(node: cc.Node){        
        let pos = node.parent.convertToWorldSpace(node.position);
        let y = pos.y + node.height;
        return y;
    }

    isJumping(){
        return this.mJumping;
    }
}
