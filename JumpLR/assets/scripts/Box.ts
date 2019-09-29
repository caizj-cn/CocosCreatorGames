import NodeMgr from "./NodeMgr";

/*
 * @Copyright: Copyright (c) 2019
 * @Author: caizhijun
 * @Version: 1.0
 * @Date: 2019-08-22 15:05:44
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
export default class Box extends cc.Component {
    @property(cc.Label)
    txtNum: cc.Label = null;

    private mPrevBox: cc.Node = null; // 上一个石块
    private mNextBox: cc.Node = null; // 下一个石块
    private mOffset: number = 0; // 左右偏移量 [-4,4]

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {

    }

    // update (dt) {}

    setOffset(offset: number){
        this.mOffset = offset;
    }

    getOffset(){
        return this.mOffset;
    }

    setPrev(prev: cc.Node){
        this.mPrevBox = prev;
    }

    getPrev(){
        return this.mPrevBox;
    }

    setNext(next: cc.Node){
        this.mNextBox = next;
    }

    getNext(){
        return this.mNextBox;
    }

    setNum(num: number){
        this.txtNum.string = `${num}`;
    }

    down(y: number){
        this.node.runAction(cc.sequence(
            cc.moveBy(0.4, 0, y),
            cc.callFunc( () => {
                NodeMgr.putBox(this.node);
            })
        ));
    }
}
