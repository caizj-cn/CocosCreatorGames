cc.Class({
    extends: cc.Component,

    properties: {
        heroBtn : {
            default: [],
            type: cc.Button,
        },
    },

    onLoad: function () {
        //设置当前选择的英雄
        let tag = parseInt(cc.sys.localStorage.getItem("gunHeroType") || 0);
        for(let i = 0; i < 4; i++){
            let hero = this.heroBtn[i];
            hero.interactable = true;
        }
        let hero = this.heroBtn[tag];
        hero.interactable = false;
    },

    //开始按钮回调
    startBtnCallBack : function(event, customEventData){
        this.playSound("sound/click", false);
        //显示游戏界面
        cc.log("startBtnCallBack"); 
        cc.director.preloadScene('playScene', function () {
            cc.director.loadScene('playScene');
        });
    },

    //选择英雄按钮的回调
    selectHeroCallBack : function(event, customEventData){
        this.playSound("sound/select", false);
        let tag = parseInt(customEventData);
        for(let i = 0; i < 4; i++){
            let hero = this.heroBtn[i];
            hero.interactable = true;
        }
        let hero = this.heroBtn[tag];
        hero.interactable = false;

        //保存当前选择的英雄
        cc.sys.localStorage.setItem("gunHeroType", tag);
    },

    //播放音效
    playSound : function(name, isLoop){
        cc.loader.loadRes(name, cc.AudioClip, function (err, clip) {
            if(err){
                return;
            }
            let audioID = cc.audioEngine.playEffect(clip, isLoop);
        });
    },

    // called every frame
    update: function (dt) {

    },
});
