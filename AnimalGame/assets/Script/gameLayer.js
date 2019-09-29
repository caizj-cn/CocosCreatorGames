

let ANI_ROW = 14;   //小动物行数/列数
let ANI_TYPE = 14;  //小动物种类数
let MAX_COUNT = 36; //最大次数

let __DESIGN_RESOLUTION_WIDTH = 1280;
let __DESIGN_RESOLUTION_HEIGHT = 720;

let lineDir = {
    NONE : -1,      //空
    TOP : 0,        //上
    BOTTOM : 1,     //下
    LEFT : 2,       //左
    RIGHT : 3,      //右
}

//音效名称
let sound = {
    BG : "sound/pveBg",     //BG
    BUTTON : "sound/click",      //按钮点击音效
    COMBO1 : "sound/combo1",    //1
    COMBO2 : "sound/combo2",    //2
    COMBO3 : "sound/combo3",    //3
    COMBO4 : "sound/combo4",    //4
    GAMEOVER : "sound/over",     //结束
    GAMEPASS : "sound/pass",     //过关
    READYGO : "sound/readyGo",   //准备
}

cc.Class({
    extends: cc.Component,

    properties: {
        //主界面
        menuBg : cc.Node,
        startBtn : cc.Node,
        //游戏界面
        gameBg : cc.Node,
        levelText : cc.Label,
        scoreText : cc.Label,
        bestScoreText : cc.Label,
        restTimesText : cc.Label,
        aniParentLayer : cc.Node,

        aniBtn : {
            default: [],
            type: cc.Button,
        },

        tiziSp : cc.Node,
        refreshBtn : cc.Node,
        readySp : cc.Node,
        goSp : cc.Node,
        tipText : cc.Node,

        //失败层
        failLayer : cc.Node,

        //过关层
        winLayer : cc.Node,
        awardText : cc.Label,

        //结算层
        endLayer : cc.Node,
        endScoreText : cc.Label,
        againBtn : cc.Node,
        exitBtn : cc.Node,

        //小动物预制体
        aniPrefab : cc.Prefab,

        btnImgAtlas : cc.SpriteAtlas,
        aniImgAtlas : cc.SpriteAtlas,
    },

    onLoad: function () {
        //初始化界面数据
        this.levelText.string = "1";
        this.scoreText.string = "0";
        
        let aniBestScore = parseInt(cc.sys.localStorage.getItem("aniBestScore")) || 0;
        this.bestScoreText.string = aniBestScore;

        this.restTimesText.string = "35";
        this.fitNode();
    },

    //元素适配
    fitNode : function(){
        let canvasSize = cc.view.getCanvasSize();
        let canvasScale = canvasSize.width / canvasSize.height;
        // 高的比例
        let bMoreHeight = canvasScale < (__DESIGN_RESOLUTION_WIDTH / __DESIGN_RESOLUTION_HEIGHT);

        //全屏显示
        let allShow = (obj)=>{
            if (bMoreHeight) {
                obj.width = __DESIGN_RESOLUTION_WIDTH;
                obj.height = __DESIGN_RESOLUTION_WIDTH / canvasScale;
            } else {
                obj.width = __DESIGN_RESOLUTION_HEIGHT * canvasScale;
                obj.height = __DESIGN_RESOLUTION_HEIGHT;
            }
        };

        //左对齐
        let leftAlign = (obj)=>{
            if (!bMoreHeight) {
                obj.x = obj.position.x - (__DESIGN_RESOLUTION_HEIGHT * canvasScale - __DESIGN_RESOLUTION_WIDTH) / 2;
            } else {
                obj.x = obj.position.x;
            }
        };

        //右对齐
        let rightAlign = (obj)=>{
            if (!bMoreHeight) {
                obj.x = obj.position.x + (__DESIGN_RESOLUTION_HEIGHT * canvasScale - __DESIGN_RESOLUTION_WIDTH) / 2;
            } else {
                obj.x = obj.position.x;
            }
        };

        //上对齐
        let topAlign = (obj)=>{
            if (bMoreHeight) {
                obj.y = obj.position.y + (__DESIGN_RESOLUTION_WIDTH / canvasScale - __DESIGN_RESOLUTION_HEIGHT) / 2;
            } else {
                obj.y = obj.position.y;
            }
        };

         //下对齐
        let bottomAlign = (obj)=>{
            if (bMoreHeight) {
                obj.y = obj.position.y - (__DESIGN_RESOLUTION_WIDTH / canvasScale - __DESIGN_RESOLUTION_HEIGHT) / 2;
            } else {
                obj.y = obj.position.y;
            }
        };

        //适配高度
        let heightScale = (obj)=>{
            let canvasSize = cc.view.getCanvasSize();    
            let scale = canvasSize.height / __DESIGN_RESOLUTION_HEIGHT;
            obj.height = scale * 700;
            obj.width = scale * 700;
        };

        //全屏显示组件
        allShow(this.menuBg);
        allShow(this.gameBg);
        allShow(this.endLayer);

        //左对齐组件
        leftAlign(this.refreshBtn);

        //右对齐组件
        rightAlign(this.tiziSp);
        rightAlign(this.tipText);

        //上对齐组件
        topAlign(this.refreshBtn);
        topAlign(this.tiziSp);

        //下对齐组件
        bottomAlign(this.startBtn);
        bottomAlign(this.againBtn);
        bottomAlign(this.exitBtn);
        bottomAlign(this.tipText);
        

        heightScale(this.aniParentLayer);
    },

    //创建游戏界面
    showGameLayer : function(){
        //this.playSound(sound.BG, true);
        this.gameBg.active = true;
        this.readyGoAni();

        //随机显示一个背景图
        this.changeBgSp();

        this.resetGame();
    },

    //readyGo动画
    readyGoAni : function(){
        this.playSound(sound.READYGO, false);
        this.readySp.active = true;
        this.readySp.opacity = 0;
        this.readySp.runAction(cc.sequence(cc.fadeIn(0.2), cc.delayTime(0.5), cc.fadeOut(0.3)));

        this.goSp.active = true;
        this.goSp.opacity = 0;
        this.goSp.runAction(cc.sequence(cc.delayTime(1.0), cc.fadeIn(0.2), cc.delayTime(0.5), cc.fadeOut(0.3), cc.callFunc(()=>{
            //设置动物按钮可点击
            for(let i = 0; i < 6; i++){
                this.aniBtn[i].enabled = true;
            }
        })));
    },

    //修改背景图
    changeBgSp : function(){
        let r = Math.floor(Math.random() * 100) % 5;
        let str = 'bg/bg' + r;
        cc.loader.loadRes(str, cc.SpriteFrame, function (err, spriteFrame) {
            if (err) {
                cc.error(err.message || err);
                return;
            }
            this.gameBg.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        }.bind(this));
    },

    //创建动物
    createAnis : function(){
        this._curAniTypes = [];
        this._allAnimals = [];
    
        for(let i = 0; i < 6; ){
            let r = Math.floor(Math.random() * 100) % ANI_TYPE;
            //检查是否已经取出
            let isCan = true;
            for(let i = 0; i < this._curAniTypes.length; i++){
                let t = this._curAniTypes[i];
                if(t == r){
                    isCan = false;
                }
            }

            //没有重复，将这个动物类型保存下来
            if(isCan){
                this._curAniTypes.push(r);
                i++;
            }
        }
    
        //创建小动物
        for(let row = 0; row < ANI_ROW; row++){
            for(let col = 0; col < ANI_ROW; col++){
                let item = cc.instantiate(this.aniPrefab);
                item.parent = this.aniParentLayer;
                item.position = cc.v2(-350 + (col * 50 + 25), 350 - (row * 50 + 25));

                let itemNode = item.getComponent("aniItem");
                itemNode.setImgAtlas(this.aniImgAtlas);
                itemNode.setAnimalOpacity(false);
                //设置动物类型
                let type = Math.floor(Math.random() * 100) % 6;
                itemNode.setAniType(this._curAniTypes[type]);
                itemNode.setSelected(false);
                itemNode.setAniBg();
                let node = itemNode.getBg();
                node.runAction(cc.sequence(cc.delayTime((row * ANI_ROW + col) * 0.007), cc.callFunc(()=>{
                    itemNode.animalAni();
                })));
                this._allAnimals.push(itemNode);
            }
        }

        //刷新小动物按钮纹理
        for(let i = 0; i < 6; i++){
            let str = "a" + this._curAniTypes[i];
            this.aniBtn[i].getComponent(cc.Sprite).spriteFrame = this.aniImgAtlas.getSpriteFrame("a" + this._curAniTypes[i]);
            this.aniBtn[i].node.attr({"_tag_" : this._curAniTypes[i]});
        }
    },

    computeAnis : function(){
        //防止漏掉上方和左方的,所以循环遍历
        for(let num = 0; num < (ANI_ROW - 1); num++){
            for (let row = 0; row < ANI_ROW; row++) {
                for (let col = 0; col < ANI_ROW; col++) {
                    let idx = row * ANI_ROW + col;
                    let itemNode = this._allAnimals[idx]; 
                    let isSelected = itemNode.getSelected();
                    let type = itemNode.getAniType();

                    //是可以被同化的类型
                    if((type == this._newType) && (isSelected == false)){
                        //判断他的上下左右有没有已经被同化的，如果有，则同化它，否则不同化
                        for(let i = row - 1; i <= (row + 1); i++){
                            for(let j = col - 1; j <= (col + 1); j++){
                                let isCan = true;

                                //越界判断
                                if((i < 0) || (i >= ANI_ROW) || (j < 0) || (j >= ANI_ROW)){
                                    isCan = false;
                                }

                                //忽略斜角，忽略自己
                                if(((i != row) && (j != col)) || ((i == row) && (j == col))){
                                    isCan = false;
                                }

                                if(isCan){
                                    let adjoinIdx = i * ANI_ROW + j;
                                    let adjoinItemNode = this._allAnimals[adjoinIdx];
                                    let adjoinIsSelected = adjoinItemNode.getSelected();
                                    if(adjoinIsSelected){
                                        //设置自己被同化
                                        itemNode.setSelected(true);
                                        itemNode.setAniBg();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },

    //显示红线
    showRedLine : function(){
        this._curNum = 0;
        for(let row = 0; row < ANI_ROW; row++){
            for(let col = 0; col < ANI_ROW; col++){
                let idx = row * ANI_ROW + col;
                let itemNode = this._allAnimals[idx]; 
                let isSelected = itemNode.getSelected();
                itemNode.showLine(lineDir.NONE);

                if(isSelected){
                    this._curNum = this._curNum + 1;
                    //判断他的上下左右有没有已经被同化的，如果没有，则显示红线
                    for(let i = row - 1; i <= (row + 1); i++){
                        for(let j = col - 1; j <= (col + 1); j++){
                            let isCan = true;

                            //边界判断
                            if((i < 0) || (i >= ANI_ROW) || (j < 0) || (j >= ANI_ROW)){
                                if(i == -1){
                                    itemNode.showLine(lineDir.TOP);
                                }
                                else if(i == ANI_ROW){
                                    itemNode.showLine(lineDir.BOTTOM);
                                }
                                else if(j == -1){
                                    itemNode.showLine(lineDir.LEFT);
                                }
                                else if(j == ANI_ROW){
                                    itemNode.showLine(lineDir.RIGHT);
                                }
                                isCan = false;
                            }

                            //忽略斜角，忽略自己
                            if(((i != row) && (j != col)) || ((i == row) && (j == col))){
                                isCan = false;
                            }

                            if(isCan){
                                let curIdx = i * ANI_ROW + j;
                                let curItemNode = this._allAnimals[curIdx];
                                let curIsSelected = curItemNode.getSelected();
    
                                if(!curIsSelected){
                                    if(i < row){
                                        itemNode.showLine(lineDir.TOP);
                                    }
                                    else if(i > row){
                                        itemNode.showLine(lineDir.BOTTOM);
                                    }
                                    else if(j < col){
                                        itemNode.showLine(lineDir.LEFT);
                                    }
                                    else if(j > col){
                                        itemNode.showLine(lineDir.RIGHT);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },

    //计算得分
    computeScore : function(){
        let score = 0;
        let num = this._curNum - this._lastNum;
        if(num <= 2){//1倍得分
            score = num * 10;
        }  
        else if(num <= 5){//2倍得分
            score = num * 10 * 2;
            this.playSound(sound.COMBO1, false);
        }
        else if(num <= 10){//3倍得分
            score = num * 10 * 3;
            this.playSound(sound.COMBO2, false);
        }
        else if(num <= 15){ //大于15个，4倍得分
            score = num * 10 * 4;
            this.playSound(sound.COMBO3, false);
        }
        else{
            score = num * 10 * 4;
            this.playSound(sound.COMBO4, false);
        }
        return score;
    },
    
    //判断是否结束
    checkOver : function(){
        if(this._curNum == (ANI_ROW * ANI_ROW)){ //已经全部同化
            //显示过关界面
            this.gameWinLayer();
        }
        else if(this._restTimes == 0){ //步数用完了
            //显示失败界面
            this.gameFailLayer();
        }
    },

    //过关界面
    gameWinLayer : function(){
        this.winLayer.active = true;
        this.playSound(sound.GAMEPASS, false);

        //奖励得分
        let awardScore = this._restTimes * 100;
        if(awardScore > 0){
            this.awardText.getComponent(cc.Label).string = "奖励：" + awardScore;
        }
        else{
            this.awardText.getComponent(cc.Label).string = "";
        }
    
        this._curScore = this._curScore + awardScore;
        this.updateScore();
        this.saveHighScore();
    },

    //失败界面
    gameFailLayer : function(){
        this.failLayer.active = true;
        this.playSound(sound.GAMEOVER, false);
    },

    //更新当前关卡
    updateLevel : function(){
        this.levelText.string = this._curLevel;
    },

    //更新分数
    updateScore : function(){
        this.scoreText.string = this._curScore;
    },

    //保存最高分
    saveHighScore : function(){
        let highScore = parseInt(cc.sys.localStorage.getItem("AnimalGameHighScore") || 0);
        if(this._curScore > highScore){
            cc.sys.localStorage.setItem("AnimalGameHighScore", this._curScore);
            this.bestScoreText.string = this._curScore;
        }
    },

    //更新剩余次数
    updateRestTimes : function(){
        this.restTimesText.string = this._restTimes;
    },
    
    //显示结算界面
    showEndLayer : function(){
        this.endLayer.active = true;
        //显示得分
        this.endScoreText.string = "得分：" + this._curScore;
    },

    //进入下一关游戏
    nextGame : function(){
        //随机一个背景图
        this.changeBgSp();
        this.endLayer.active = false;
        this.aniParentLayer.removeAllChildren();
    
        //上一次同化动物个数
        this._lastNum = 0;
    
        //当前同化的动物个数
        this._curNum = 0;
    
        //设置关卡数
        this._curLevel = this._curLevel + 1;
        this.updateLevel();
    
        //设置剩余步数
        this._restTimes = MAX_COUNT - this._curLevel;
        this.updateRestTimes();
    
        //设置动物按钮不可点击
        for(let i = 0; i < 6; i++){
            this.aniBtn[i].enabled = false;
        }
    
        this.readyGoAni();
    
        //创建动物
        this.createAnis();
    
        //默认选中第一个小动物类型
        let itemNode = this._allAnimals[0];
        itemNode.setSelected(true);
        itemNode.setAniBg();
        this._lastType = itemNode.getAniType();
        this._newType = this._lastType;
    
        this.computeAnis();
        this.showRedLine();
        this._lastNum = this._curNum;
    },

    //重置游戏
    resetGame : function(){
        this._curLevel = 0;
        this._lastType = 0;
        this._newType = 0;
        //设置得分
        this._curScore = 0;
        this.updateScore();

        //设置最高分
        this.saveHighScore();
        this.nextGame();
    },

    //开始按钮回调
    startBtnCallBack : function(event, customEventData){
        this.playSound(sound.BUTTON, false);
        //显示游戏界面
        this.showGameLayer();
    },

    //动物按钮点击回调
    aniBtnCallBack : function(event, customEventData){
        this.playSound(sound.BUTTON, false);
        this._newType = event.target._tag_;

        //和上次点击的不一样才算有效
        if(this._lastType != this._newType){
            //修改所有已经被同化的动物纹理
            for(let row = 0; row < ANI_ROW; row++){ //14行
                for(let col = 0; col < ANI_ROW; col++){ //14行
                    let idx = row * ANI_ROW + col;
                    let itemNode = this._allAnimals[idx];
                    let isSelected = itemNode.getSelected();
                    if(isSelected){
                        itemNode.setAniType(this._newType);
                        itemNode.setAniBg();
                    }
                } 
            } 
            
            this.computeAnis();
            //被同化的动物用红色边框框起来
            this.showRedLine();

            //更新剩余次数
            this._restTimes = this._restTimes - 1;
            this.updateRestTimes();
            this._lastType = this._newType;

            //计算得分
            let score = this.computeScore();
            this._curScore = this._curScore + score;
            this.updateScore();
            this.saveHighScore();
            this._lastNum = this._curNum;

            //结束检测
            this.checkOver();
        }
    },

    //重置按钮点击回调
    resetBtnCallBack : function(event, customEventData){
        this.playSound(sound.BUTTON, false);
        //重置游戏
        this.resetGame();
    },

    //过关后，下一关按钮回调
    nextBtnCallBack : function(event, customEventData){
        this.playSound(sound.BUTTON, false);
        this.winLayer.active = false;
        this.nextGame();
    },

    //失败后，显示结算界面按钮回调
    overBtnCallBack : function(event, customEventData){
        this.playSound(sound.BUTTON, false);
        this.failLayer.active = false;
        //显示结算界面
        this.showEndLayer();
    },

    //再来一局按钮点击回调
    againBtnCallBack : function(event, customEventData){
        this.playSound(sound.BUTTON, false);
        this.resetGame();
    },

    //退出按钮点击回调 
    exitBtnCallBack : function(event, customEventData){
        this.playSound(sound.BUTTON, false);
        //返回主界面
        this.endLayer.active = false;
        this.gameBg.active = false;
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

    // called every frame
    update: function (dt) {

    },
});
