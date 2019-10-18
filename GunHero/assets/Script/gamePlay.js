cc.Class({
    extends: cc.Component,

    properties: {
        bgImg : cc.Node,
        sunImg : cc.Node,
        moonImg : cc.Node,
        floorParent : cc.Node,
        farHouseImg0 : cc.Node,
        farHouseImg1 : cc.Node,
        nearHouseImg0 : cc.Node,
        nearHouseImg1 : cc.Node,
        farFloorImg0 : cc.Node,
        farFloorImg1 : cc.Node,
        nearFloorImg0 : cc.Node,
        nearFloorImg1 : cc.Node,
        scoreText : cc.Label,

        //我方英雄组件
        heroNode : cc.Node,
        shootLineImg : cc.Node,
        myBulletImg : cc.Node,
        myHeroImg : cc.Node,
        myGunImg : cc.Node,
        shieldImg : cc.Node,
        bloodBar : cc.ProgressBar,
        heroDieParticle : cc.ParticleSystem,

        //结束层
        endLayer : cc.Node,
        bestScoreText : cc.Label,
        allScoreText : cc.Label,

        myBulletPrefab : {
            default: [],
            type: cc.Prefab,
        },
        enemyPrefab : cc.Prefab,
    },

    onLoad: function () {
        this._winSize = cc.winSize;
        this._canShooting = true;  //是否能射击
        this._canContact = true;   //是否检测碰撞
        this._curScore = 0;  //当前得分
        this._heroBloodValue = 100;  //当前血量值

        //打开物理系统
        cc.director.getPhysicsManager().enabled = true;
        //cc.director.getPhysicsManager().debugDrawFlags = true;

        // 重力加速度的配置
        cc.director.getPhysicsManager().gravity = cc.v2(0, -640);

        //随机获取一种类型
        this.randStyle = Math.floor(Math.random() * 100) % 3; 
        cc.sys.localStorage.setItem("gunHeroBgStyle", this.randStyle);

        //角色类型
        this.heroType = parseInt(cc.sys.localStorage.getItem("gunHeroType")) || 0;

        //修改辅助线纹理
        this.setImgTexture("imageRes/line" + this.heroType, this.shootLineImg);
        
        //修改大炮纹理
        this.setImgTexture("imageRes/gun" + this.heroType, this.myGunImg);

        //游戏背景
        this.setImgTexture("bg/bgImg" + this.randStyle, this.bgImg);

        //太阳图片  
        if(this.randStyle == 2){
            this.sunImg.active = false;
            this.moonImg.active = true;
        }
        else{
            this.moonImg.active = false;
            this.sunImg.active = true;
            this.setImgTexture("imageRes/sun" + this.randStyle, this.sunImg);
        }

        //远处房子
        this.setImgTexture("imageRes/house" + this.randStyle, this.farHouseImg0);
        this.setImgTexture("imageRes/house" + this.randStyle, this.farHouseImg1);

        //近处房子
        this.setImgTexture("imageRes/houshSmall" + this.randStyle, this.nearHouseImg0);
        this.setImgTexture("imageRes/houshSmall" + this.randStyle, this.nearHouseImg1);

        //远处地面
        this.setImgTexture("imageRes/floor" + this.randStyle, this.farFloorImg0);
        this.setImgTexture("imageRes/floor" + this.randStyle, this.farFloorImg1);

        //近处地面
        this.setImgTexture("imageRes/gameFloor" + this.randStyle, this.nearFloorImg0);
        this.setImgTexture("imageRes/gameFloor" + this.randStyle, this.nearFloorImg1);
        this.nearFloorImg0.zIndex = 5;
        this.nearFloorImg1.zIndex = 5;

        //得分
        this.scoreText.string = "0";

        this.node.on(cc.Node.EventType.TOUCH_START, this.onEventStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onEventMove, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onEventCancel, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onEventEnd, this);

        //云动画
        this.yunAni();

        //创建敌人
        this.createEnemy();

        //我方英雄等待动作
        this.myHeroAni(false);

        //地方英雄等待动画
        this._enemyNode.enemyAni();

        //英雄身上的护盾动画
        this.shieldImg.getComponent("spriteFrameAni").playAni("shield", 4, 0.1, true);
    },

    //云动画
    yunAni : function(){
        let curWidth = -this._winSize.width / 2;
        while(curWidth < this._winSize.width / 2){
            //随机一个类型
            let t = Math.floor(Math.random() * 100) % 3;
            //随机一个高度值
            let h = Math.random() * (this._winSize.height * 1 / 6) + this._winSize.height * 2 / 8;
            curWidth = curWidth + Math.random() * 150 + 150;

            let yunNode = new cc.Node();
            let yunSp = yunNode.addComponent(cc.Sprite);
            yunNode.parent = this.floorParent;
            yunNode.position = cc.v2(curWidth, h);
            this.setImgTexture("imageRes/yun" + this.randStyle + "_" + t, yunSp);
            yunNode.runAction(cc.repeatForever(cc.sequence(cc.moveBy(1.0, cc.v2(-20, 0)), cc.callFunc(() =>{
                if(yunNode.position.x < -this._winSize.width / 2 - 100){
                    yunNode.position = cc.v2(this._winSize.width / 2 + 100, yunNode.position.y);
                }
            }))));
        }
    },

    //创建敌人
    createEnemy : function(){
        let node = cc.instantiate(this.enemyPrefab);
        node.position = cc.v2(0, -110);
        node.parent = this.floorParent;
        this._enemyNode = node.getComponent("enemy");
        this._enemyNode.comeOnAni();

        this._enemyNode.finishCallBack(()=>{
            //可检测碰撞
            this._canContact = true;
            //设置为可发炮
            this._canShooting = true;
            node.removeFromParent();
            node = null;
            this.createEnemy();
        });
        this._enemyNode.hitHeroCallBack(()=>{
            this._heroBloodValue = this._heroBloodValue - 25;
            if(this._heroBloodValue <= 0){
                this.playSound("sound/heroDie", false);
                this._heroBloodValue = 0;
                this.myHeroDie();
                //显示结算界面
                this.gameOver();
            }
            else{
                this.playSound("sound/enemyDie", false);
                this.setBloodValue();
                
                //还原炮的角度
                this.myGunImg.angle = 0;

                //设置为允许开炮
                this._canShooting = true;
                this._canContact = true;
            }
        });
    },

    //更新炮管角度
    updateGunAngle : function(){
        this.shootLineImg.active = true;
        this._curAngle = 0;
        this.gunSchedule = function(){
            if (this._curAngle < 90){
                this._curAngle += 1;
                this.myGunImg.angle = this._curAngle;
            }
        };
        this.schedule(this.gunSchedule, 0.03);
    },

    //停止更新炮管
    stopGunAngle(){
        this.unschedule(this.gunSchedule);
        this.shootLineImg.active = false;
    },

    //给自己的子弹绑定刚体
    setBulletBody : function(){
        //创建子弹
        this.bulletNode = cc.instantiate(this.myBulletPrefab[this.heroType]);
        this.bulletNode.parent = this.myGunImg;
        this.bulletNode.position = this.myBulletImg.position;
        let bulletSp = this.bulletNode.getComponent("contact");
        bulletSp.contactCallBack((selfCollider, otherCollider) => {
            if(!this._canContact){
                return;
            }
            this.playSound("sound/openFire", false);
            this._canContact = false;
            //停止子弹监听
            this.unschedule(this.bulletfun);

            let bodyGroup0 = selfCollider.node.group;
            let bodyGroup1 = otherCollider.node.group;

            //子弹打到地面
            if((bodyGroup0 == "heroBullet" && bodyGroup1 == "floor") 
            || (bodyGroup0 == "floor" && bodyGroup1 == "heroBullet")){
                this.node.runAction(cc.sequence(cc.delayTime(0.5),cc.callFunc(() =>{
                    this.bulletNode.removeFromParent();
                    this.bulletNode = null;
                    this.enemyOpenFire();
                })));
            }

            //子弹打到柱子
            if((bodyGroup0 == "heroBullet" && bodyGroup1 == "column") 
            || (bodyGroup0 == "column" && bodyGroup1 == "heroBullet")){
                this.node.runAction(cc.sequence(cc.delayTime(0.5),cc.callFunc(() =>{
                    this.bulletNode.removeFromParent();
                    this.bulletNode = null;
                    this.enemyOpenFire();
                })));
            }

            //子弹打到敌人
            if((bodyGroup0 == "heroBullet" && bodyGroup1 == "enemy") 
            || (bodyGroup0 == "enemy" && bodyGroup1 == "heroBullet")){
                this._enemyNode.enemyDie();
                this.node.runAction(cc.sequence(cc.delayTime(0.3),cc.callFunc(() =>{
                    this.bulletNode.removeFromParent();
                    this.bulletNode = null;
                    this.updateScore();
                    this.myHeroAni(true);
                    this.myHeroScaleAni();
                    this.gameBgAni();
                    this._enemyNode.enemyMove();
                })));
            }
        });
    },

    //我方英雄运动
    myHeroAni : function(isRun){
        if(isRun){
            this.myHeroImg.getComponent("spriteFrameAni").playAni("heroRun" + this.heroType + "_", 5, 0.06, true);
        }
        else{
            this.myHeroImg.getComponent("spriteFrameAni").playAni("heroWait" + this.heroType + "_", 3,  0.1, true);
        }
    },

    //我方英雄缩放效果
    myHeroScaleAni : function(){
        this.heroNode.runAction(cc.sequence(cc.scaleTo(1.0, 1.1), cc.scaleTo(1.0, 1.0)));
    },

    //背景运动
    gameBgAni : function(){
        //远处房子
        let fw = this.farHouseImg0.width;
        this.farHouseImg0.runAction(cc.sequence(cc.moveBy(2.0, cc.v2(-200, 0)), cc.delayTime(0.1), cc.callFunc(() =>{
            if(this.farHouseImg0.position.x <= -fw - this._winSize.width / 2){
                this.farHouseImg0.position = cc.v2(this.farHouseImg1.position.x + fw, this.farHouseImg0.position.y);
            }
            this.myHeroAni(false);
        })));
        this.farHouseImg1.runAction(cc.sequence(cc.moveBy(2.0, cc.v2(-200, 0)), cc.delayTime(0.1), cc.callFunc(() =>{
            if(this.farHouseImg1.position.x <= -fw - this._winSize.width / 2){
                this.farHouseImg1.position = cc.v2(this.farHouseImg0.position.x + fw, this.farHouseImg1.position.y);
            }
        })));

        //近处房子
        let nw = this.nearHouseImg0.width;
        this.nearHouseImg0.runAction(cc.sequence(cc.moveBy(2.0, cc.v2(-300, 0)), cc.delayTime(0.1), cc.callFunc(() =>{
            if(this.nearHouseImg0.position.x <= -nw - this._winSize.width / 2){
                this.nearHouseImg0.position = cc.v2(this.nearHouseImg1.position.x + nw, this.nearHouseImg0.position.y);
            }
        })));
        this.nearHouseImg1.runAction(cc.sequence(cc.moveBy(2.0, cc.v2(-300, 0)), cc.delayTime(0.1), cc.callFunc(() =>{
            if(this.nearHouseImg1.position.x <= -nw - this._winSize.width / 2){
                this.nearHouseImg1.position = cc.v2(this.nearHouseImg0.position.x + nw, this.nearHouseImg1.position.y);
            }
        })));

        //远处地面
        let ffw = this.farFloorImg0.width;
        this.farFloorImg0.runAction(cc.sequence(cc.moveBy(2.0, cc.v2(-400, 0)), cc.delayTime(0.1), cc.callFunc(() =>{
            if(this.farFloorImg0.position.x <= -ffw - this._winSize.width / 2){
                this.farFloorImg0.position = cc.v2(this.farFloorImg1.position.x + ffw, this.farFloorImg0.position.y);
            }
        })));
        this.farFloorImg1.runAction(cc.sequence(cc.moveBy(2.0, cc.v2(-400, 0)), cc.delayTime(0.1), cc.callFunc(() =>{
            if(this.farFloorImg1.position.x <= -ffw - this._winSize.width / 2){
                this.farFloorImg1.position = cc.v2(this.farFloorImg0.position.x + ffw, this.farFloorImg1.position.y);
            }
        })));

        //近处地面
        let nfw = this.nearFloorImg0.width;
        for(let i = 0; i < 100; i++){
            this.nearFloorImg0.runAction(cc.sequence(cc.delayTime(0.02 * i), cc.callFunc(() =>{
                if(i % 9 == 0){
                    this.playSound("sound/walk", false);
                }
                let pX1 = this.nearFloorImg0.position.x - 4;
                this.nearFloorImg0.position =  cc.v2(pX1, this.nearFloorImg0.position.y);

                let pX2 = this.nearFloorImg1.position.x - 4;
                this.nearFloorImg1.position = cc.v2(pX2, this.nearFloorImg1.position.y);

                if(pX1 <= -nfw - this._winSize.width / 2){
                    this.nearFloorImg0.position = cc.v2(this.nearFloorImg1.position.x + nfw, this.nearFloorImg0.position.y);
                }
                if(pX2 <= -nfw - this._winSize.width / 2){
                    this.nearFloorImg1.position = cc.v2(this.nearFloorImg0.position.x + nfw, this.nearFloorImg1.position.y);
                }
            })));
        }
    },

    //敌方开炮
    enemyOpenFire : function(){
        //敌方子弹世界坐标
        let enemyBulletPos = this._enemyNode.enemyBulletWorldPos();
        //我方英雄世界坐标
        let myHeroPos = this.myHeroImg.parent.convertToWorldSpaceAR(cc.v2(this.myHeroImg.position.x, this.myHeroImg.position.y + 30));

        //计算夹角
        let lenX = Math.abs(enemyBulletPos.x - myHeroPos .x);
        let lenY = Math.abs(enemyBulletPos.y - myHeroPos .y);
        let angle = Math.atan2(lenY, lenX) * 180 / Math.PI;

        //设置敌方小火炮的角度
        this._enemyNode.setGunAngle(angle);

        //计算炮运行的距离
        let len = Math.sqrt(Math.pow(lenX, 2) + Math.pow(lenY, 2));
        this._enemyNode.gunAni(len);
        this.playSound("sound/enemyBullet", false);
    },

    //刷新英雄的血量
    setBloodValue : function(){
        //设置盾牌透明度
        let p = this._heroBloodValue / 100;
        this.shieldImg.opacity = Math.floor(p * 255);
        //设置血量进度
        this.bloodBar.progress = p;
    },

    //我方英雄死亡动画
    myHeroDie : function(){
        this.heroDieParticle.node.active = true;
        this.heroDieParticle.stopSystem();
        this.heroDieParticle.resetSystem();
        //隐藏我方英雄
        this.heroNode.active = false;
    },

    //游戏结束
    gameOver : function(){
        this.node.runAction(cc.sequence(cc.delayTime(1.0),cc.callFunc(() =>{
            //显示结算界面
            this.endLayer.active = true;
            //显示最高得分
            let bestScore = parseInt(cc.sys.localStorage.getItem("gunBestScore")) || 0;
            if(this._curScore > bestScore){
                this.bestScoreText.string = this._curScore;
                cc.sys.localStorage.setItem("gunBestScore", this._curScore);
            }
            else{
                this.bestScoreText.string = bestScore;
            }
            //显示当前得分
            this.allScoreText.string = this._curScore;
        })));
    },

    // 按钮的回调
    exitCallBack : function(event, customEventData){
        this.playSound("sound/click", false);
        cc.director.preloadScene('start', function () {
            cc.director.loadScene('start');
        });
    },

    //重新开始回调
    refreshCallBack : function(event, customEventData){
        this.playSound("sound/click", false);
        cc.director.preloadScene('playScene', function () {
            cc.director.loadScene('playScene');
        });
    },

    //屏幕触摸回调
    onEventStart : function(event){
        if(!this._canShooting){
            return;
        }
        cc.log("onEventStart");
        this.updateGunAngle();
    },

    onEventMove : function(event){
        cc.log("onEventMove");
    },

    onEventEnd : function(event){
        if(!this._canShooting){
            return;
        }
        cc.log("onEventEnd");
        this.playSound("sound/heroBullet", false);
        this._canShooting = false;
        this.stopGunAngle();
        this.setBulletBody(this.myBulletImg);

        let x = 5000; 
        //2号子弹体积较大，需要更大的力
        if(this.heroType == 1){
            x = 7000; 
        }
        //通过角度计算力度
        let y = x * Math.tan(Math.abs(this._curAngle) * (Math.PI / 180)); 
        //给子弹设置冲量
        this.bulletNode.getComponent(cc.RigidBody).applyForceToCenter(cc.v2(x, y));

        let curPos = this.bulletNode.position;
        let lastPos = curPos;
        this.bulletfun = function(){
            curPos = this.bulletNode.position;
            //计算角度
            let lenX = curPos.x - lastPos.x;
            let lenY = 0;
            let r = 0;
            if(curPos.y < lastPos.y){ //向上运动
                lenY = curPos.y - lastPos.y;
                r = Math.atan2(lenY, lenX) * 180 / Math.PI;
            }
            else{   //向下运动
                lenY = lastPos.y - curPos.y;
                r = -1 * Math.atan2(lenY, lenX) * 180 / Math.PI;
            }
            lastPos = curPos;
            this.bulletNode.angle = r;
        };
        this.schedule(this.bulletfun, 0.1);
    },

    onEventCancel : function(event){
        this.onEventEnd(event);
    },

    //刷新得分
    updateScore : function(){
        this._curScore += 1;
        this.scoreText.string = this._curScore;
        this.playSound("sound/addScore", false);
    },

    //更换纹理
    setImgTexture : function(str, node){
        cc.loader.loadRes(str, cc.SpriteFrame, function (err, spriteFrame) {
            if (err) {
                cc.error(err.message || err);
                return;
            }
            node.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        }.bind(this));
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

    update: function (dt) {

    },
});