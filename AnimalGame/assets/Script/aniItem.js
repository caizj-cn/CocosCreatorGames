// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

let lineDir = {
    NONE : -1,      //空
    TOP : 0,        //上
    BOTTOM : 1,     //下
    LEFT : 2,       //左
    RIGHT : 3,      //右
}

cc.Class({
    extends: cc.Component,
    properties: {
        bgSp : cc.Node,
        aniSp : cc.Node,
        lineSp : {
            default: [],
            type: cc.Node,
        },
    },

    onLoad : function (){
        
    },

    //小动物纹理图集
    setImgAtlas : function(imgAtlas) {
        this.imgAtlas = imgAtlas;
        for(let i = 0; i < 4; i++){
            this.lineSp[i].getComponent(cc.Sprite).spriteFrame = this.imgAtlas.getSpriteFrame("line");
            this.lineSp[i].active = false;
        }
    },

    //设置小动物类型
    setAniType: function(type){
        this._aniType = type;
        this.aniSp.getComponent(cc.Sprite).spriteFrame = this.imgAtlas.getSpriteFrame("a" + type);
    },

    //获取小动物类型
    getAniType : function(){
        return this._aniType;
    },

    //设置小动物的背景
    setAniBg : function(){
        if(this._isSelected){
            this.bgSp.getComponent(cc.Sprite).spriteFrame = this.imgAtlas.getSpriteFrame("a");
        }
        else{
            this.bgSp.getComponent(cc.Sprite).spriteFrame = this.imgAtlas.getSpriteFrame("b");
        }
    },

    //设置已经被选中
    setSelected : function(isSelected){
        this._isSelected = isSelected;
        // if(isSelected){
        //     this.aniSp.node.active = false;
        // }
    },

    //获取是否已经被选中
    getSelected : function(){
        return this._isSelected;
    },

    //显示红线
    showLine : function(type){
        if(type == lineDir.NONE){
            for(let i = 0; i < 4; i++){
                this.lineSp[i].active = false;
            }
        }
        else{
            this.lineSp[type].active = true;
            this.lineSp[type].zIndex = 5;
        }
    },

    //设置动物图片透明度
    setAnimalOpacity : function(isShow){
        if(isShow){
            this.aniSp.opacity = 255;
        }
        else{
            this.aniSp.opacity = 0;
        }
    },
    
    //动物图片显示效果
    animalAni : function(){
        this.setAnimalOpacity(false);
        this.aniSp.runAction(cc.fadeIn(0.3));
    },

    getBg : function(){
        return this.bgSp;
    }
});
