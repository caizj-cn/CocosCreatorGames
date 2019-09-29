/*
 * @Copyright: Copyright (c) 2019
 * @Author: caizhijun
 * @Version: 1.0
 * @Date: 2019-08-02 11:01:59
 */
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
        starImg : cc.Node,
        itemBg : cc.Node,
        levelTxt : cc.Node,
    },

    onLoad : function (){
        
    },

    /**
     * @description: 显示星星数量
     * @param {boolean} isOpen 是否开启
     * @param {starCount} 星星数量
     * @param {cc.SpriteAtlas} levelImgAtlas 纹理图
     * @param {number} level 关卡
     * @return: 
     */
    showStar(isOpen, starCount, levelImgAtlas, level){
        this.itemBg.attr({"_level_" : level});
        if(isOpen){
            this.itemBg.getComponent(cc.Sprite).spriteFrame = levelImgAtlas.getSpriteFrame("pass_bg");
            this.starImg.active = true;
            this.starImg.getComponent(cc.Sprite).spriteFrame = levelImgAtlas.getSpriteFrame("point" + starCount);
            this.levelTxt.opacity = 255;
            this.itemBg.getComponent(cc.Button).interactable = true;
        }
        else{
            this.itemBg.getComponent(cc.Sprite).spriteFrame = levelImgAtlas.getSpriteFrame("lock");
            this.starImg.active = false;
            this.levelTxt.opacity = 125;
            this.itemBg.getComponent(cc.Button).interactable = false;
        }
        this.levelTxt.getComponent(cc.Label).string = level;
    },

    btnCallBack : function(event, customEventData){
        if(this._callfunc){
            this._callfunc(this.itemBg._level_);
        }
    },

    levelFunc : function(callfunc){
        this._callfunc = callfunc;
    }
});
