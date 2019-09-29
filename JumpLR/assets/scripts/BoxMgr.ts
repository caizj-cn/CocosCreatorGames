import NodeMgr from "./NodeMgr";

/*
 * @Copyright: Copyright (c) 2019
 * @Author: caizhijun
 * @Version: 1.0
 * @Date: 2019-09-02 14:15:36
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
export default class BoxMgr extends cc.Component {
    // 障碍物父节点
    @property(cc.Node)
    nodeParent: cc.Node = null;

    // 障碍物预制
    @property(cc.Prefab)
    prefabBox: cc.Prefab = null;

    private mMaxY: number = 0; // 最大Y坐标
    private mMemMinY: number = 0; // 需要保留的最小Y值
    private mStartY: number = 200; // 起始位置
    private mNewBoxs: cc.Node[] = []; // 所有的障碍物
    private mMemBoxs: cc.Node[] = []; // 需要保存的障碍物
    private mMaxOffset: number = 3; // 最大偏移量
    private mCurrOffset: number = 0; // 当前偏移量
    private mMaxZIndex:number = 10000; // 最大层级
    private mCurrZIndex: number = 0; // 当前层级
    private mIntervalX: number = 0; // X间距
    private mIntervalY: number = 0; // Y间距
    private mStandBox: cc.Node = null; // 障碍物链头
    private mIsNew: boolean = true;
    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.mMaxY = 3 * cc.winSize.height + this.prefabBox.data.height / 2;
        this.mMemMinY = 2* cc.winSize.height - this.prefabBox.data.height / 2;
        this.mIntervalX = this.prefabBox.data.width * 0.5;
        this.mIntervalY = this.prefabBox.data.height * 0.5;
    }

    start () {
        // this.reloadAll();
    }

    /**
     * @description: 生成一个障碍物
     * @param {type} 
     * @return: 
     */
    getBox(){
        let box = NodeMgr.getBox();
        if(box == null){
            box = cc.instantiate(this.prefabBox);
        }
        return box;
    }

    /**
     * @description: 回收一个障碍物
     * @param {type} 
     * @return: 
     */
    putBox(box: cc.Node){
        if(box != null){
            NodeMgr.putBox(box);
        }        
    }

    clearAll(){
        if(this.mMemBoxs != null){
            for(let i = 0; i < this.mMemBoxs.length; i++){
                this.putBox(this.mMemBoxs[i]);
            }
            this.mMemBoxs = [];
        }

        if(this.mNewBoxs != null){
            for(let i = 0; i < this.mNewBoxs.length; i++){
                this.putBox(this.mNewBoxs[i]);
            }
            this.mNewBoxs = [];
        }
    }

    /**
     * @description: 重新加载所有障碍物
     * @param {type} 
     * @return: 
     */
    reloadAll(){
        for(let i = 0; i < this.mNewBoxs.length; i++){
            this.putBox(this.mNewBoxs[i]);
        }
        this.mNewBoxs = [];

        this.mCurrZIndex = this.mMaxZIndex;
        if(this.mMemBoxs.length <= 0){
            this.mIsNew = true;
            this.mCurrOffset = 0;
            this.reloadNew(this.mStartY);
        }else{
            this.mIsNew = false;
            let i = 0;
            while(i < this.mMemBoxs.length){                
                this.mMemBoxs[i].y -= (2 * cc.winSize.height);
                this.mMemBoxs[i].zIndex = this.mCurrZIndex;
                this.mMemBoxs[i].getComponent('Box').setNum(this.mCurrZIndex);
                this.mCurrZIndex--;
                this.mNewBoxs.push(this.mMemBoxs[i]);
                i++;
            }

            let last = this.mMemBoxs[this.mMemBoxs.length - 1];
            this.mMemBoxs = [];

            this.mCurrOffset = last.getComponent('Box').getOffset();
            cc.log('CurrOffset', this.mCurrOffset);

            this.reloadNew(last.y);
        }
    }

    /**
     * @description: 重新加载新的障碍物（不包含换屏的）
     * @param {type} 
     * @return: 
     */
    reloadNew(startY: number){
        let y = startY + this.mIntervalY;
        while(y < this.mMaxY){            
            let box = this.getBox();
            
            // 障碍物链
            if(this.mStandBox == null){
                this.mStandBox = box;
            }

            let random = this.getRandom();
            // 第一个居中
            if(!this.mIsNew){
                // 最右
                if(this.mCurrOffset + random > this.mMaxOffset){
                    this.mCurrOffset -= random;
                }
                // 最左
                else if(this.mCurrOffset + random < -this.mMaxOffset){
                    this.mCurrOffset -= random;
                }
                // 合法
                else{
                    this.mCurrOffset += random;
                }
            }                
            
            this.mIsNew = false;
            let js = box.getComponent('Box');            
            box.x = this.mCurrOffset * this.mIntervalX;
            box.y = y;
            box.zIndex = this.mCurrZIndex;
            js.setNum(this.mCurrZIndex);
            this.mCurrZIndex--;
            box.parent = this.nodeParent;            

            // 切屏保留           
            if(y >= this.mMemMinY){
                if(this.mMemBoxs.length > 0){
                    this.mMemBoxs[this.mMemBoxs.length - 1].getComponent('Box').setNext(box);                
                    js.setPrev(this.mMemBoxs[this.mMemBoxs.length - 1]);
                }else{
                    this.mNewBoxs[this.mNewBoxs.length - 1].getComponent('Box').setNext(box);                
                    js.setPrev(this.mNewBoxs[this.mNewBoxs.length - 1]);
                }
                this.mMemBoxs.push(box);
            }else{
                if(this.mNewBoxs.length > 0){
                    this.mNewBoxs[this.mNewBoxs.length - 1].getComponent('Box').setNext(box);                
                    js.setPrev(this.mNewBoxs[this.mNewBoxs.length - 1]);
                }else{
                    js.setPrev(null);
                }
                this.mNewBoxs.push(box);
            }

            y += this.mIntervalY;
        }
    }

    /**
     * @description: 获取随机数
     * @param {type} 
     * @return: 
     */
    getRandom(){
        let ran = Math.random(); //[0,1)
        return (ran < 0.5)? -1: 1;
    }

    getIntervalX(){
        return this.mIntervalX;
    }

    getIntervalY(){
        return this.mIntervalY;
    }

    getStandBox(){
        return this.mStandBox;
    }

    // update (dt) {}
}
