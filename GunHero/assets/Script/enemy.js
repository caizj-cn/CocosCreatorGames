cc.Class({
    extends: cc.Component,

    properties: {
        cloumnNode : cc.Node,
        cloumn : cc.Node,
        enemyGunImg : cc.Node,
        enemyBulletImg : cc.Node,
        enemyHeroImg : cc.Node,
        enemyDieParticle : cc.ParticleSystem,
    },

    onLoad: function () {
        this._winSize = cc.winSize;
        this.enemyHeroImg.active = false;
        this.enemyGunImg.active = false; 
    },

    //敌人运动
    enemyAni : function(){
        this.enemyHeroImg.getComponent("spriteFrameAni").playAni("enemy", 3, 0.1, true);
    },
    
    //调整敌方柱子高度
    setColumnHight : function(){
        //随机获取高度
        let y = Math.floor(Math.random() * -250) - 100;
        this.cloumn.position = cc.v2(this._winSize.width / 2 + 100, y);
    },

    //敌人进场动作
    comeOnAni : function(){
        this.setColumnHight();
        let w = Math.floor(Math.random() * (this._winSize.width / 4));
        
        this.cloumn.runAction(cc.sequence(cc.moveTo(1.0, cc.v2(w, this.cloumn.position.y)), cc.callFunc(() =>{ 
            this.enemyHeroImg.active = true;
            this.enemyGunImg.active = true;
            this.enemyAni();
        }, this)));
    },

    //敌方柱子运动
    enemyMove : function(){
        this.enemyHeroImg.active = false;
        this.enemyGunImg.active = false;
        this.cloumn.runAction(cc.sequence(cc.moveTo(1.0, cc.v2(-this._winSize.width / 2 - 100, this.cloumn.position.y)), cc.callFunc(() =>{
            if(this.callBack){
                this.callBack();
            } 
        })));
    },

    //获取敌方子弹的世界坐标
    enemyBulletWorldPos : function(){
        let pos = this.cloumn.convertToWorldSpaceAR(cc.v2(this.enemyGunImg.position));
        return pos;
    },

    //设置炮的角度
    setGunAngle : function(angle){
        this.enemyGunImg.angle = angle;
    },

    //炮运动
    gunAni : function(len){
        let bulletPos = this.enemyBulletImg.position;
        this.enemyBulletImg.runAction(cc.sequence(cc.moveTo(0.3, cc.v2(len, 0)), cc.callFunc(() =>{
            if(this.hitHeroCallBack){
                this.hitHeroCallBack();
            }
            this.enemyBulletImg.position = bulletPos;
        })));
    },

    //敌方英雄死亡动画
    enemyDie : function(){
        this.enemyDieParticle.node.active = true;
        this.enemyDieParticle.stopSystem();
        this.enemyDieParticle.resetSystem();

        //隐藏敌方英雄
        this.enemyGunImg.active = false;
        this.enemyHeroImg.active = false;
    },

    //播放音效
    playSound : function(name, isLoop){
        cc.loader.loadRes(name, cc.AudioClip, function (err, clip) {
            if(err){
                return;
            }
            var audioID = cc.audioEngine.playEffect(clip, isLoop);
        });
    },
    
    //运动完成的回调
    finishCallBack (callBack){
        this.callBack = callBack;
    },

    //打中我方英雄后的回调
    hitHeroCallBack : function(callBack){
        this.hitHeroCallBack = callBack;
    },

    // called every frame
    update: function (dt) {

    },
});
