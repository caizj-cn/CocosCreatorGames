/*
 * @Copyright: Copyright (c) 2019
 * @Author: caizhijun
 * @Version: 1.0
 * @Date: 2019-09-06 12:05:39
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
export default class NodeMgr {
    private static mBoxNodePool: cc.NodePool = null;

    public static putBox(box: cc.Node){
        if(this.mBoxNodePool == null){
            this.mBoxNodePool = new cc.NodePool('boxs');
        }

        if(box != null){
            this.mBoxNodePool.put(box);
        } 
    }

    public static getBox(){
        if(this.mBoxNodePool != null && this.mBoxNodePool.size() > 0){
            let box = this.mBoxNodePool.get();
            box.stopAllActions();
            return box;
        }else{
            return null;
        }
    }
}
