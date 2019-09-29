/*
 * @Copyright: Copyright (c) 2019
 * @Author: caizhijun
 * @Version: 1.0
 * @Date: 2019-07-29 14:40:00
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

//方块类型
let boxType = {
    NONE : 0,   //无效位置
    WALL : 1,   //墙面
    LAND : 2,   //地面
    BODY : 3,   //物体
    BOX : 4,    //箱子
    ENDBOX : 5, //合体后的箱子
    HERO : 6    //人物
}

//音效名称
let sound = {
    BUTTON : "Texture/sound/button",      //按钮点击音效
    GAMEWIN : "Texture/sound/gamewin",    //过关音效
    MOVE : "Texture/sound/move",          //人物移动音效
    PUSHBOX : "Texture/sound/pushbox",    //推箱子音效
    WRONG : "Texture/sound/wrong",        //错误音效
}

cc.Class({
    extends: cc.Component,

    properties: {
        bg : cc.Node,
        menuLayer : cc.Node,    //主界面层
        levelLayer : cc.Node,   //关卡选择层
        gameLayer : cc.Node,    //游戏层
        gameControlLayer : cc.Node, //游戏操作层
        gameOverLayer : cc.Node,    //游戏结束层

        //主界面元素
        startBtn : cc.Node,
        titleImg : cc.Node,
        iconImg : cc.Node,
        loadingTxt : cc.Node,

        //关卡界面元素
        levelScroll : cc.Node,
        levelContent : cc.Node,

        //游戏界面元素
        levelTxt : cc.Node,
        curNum : cc.Node,
        bestNum : cc.Node,

        //合图
        itemImgAtlas: cc.SpriteAtlas,
        levelImgAtlas: cc.SpriteAtlas,

        levelItemPrefab : cc.Prefab,
    },

    onLoad : function(){
        //记录当前界面
        this.curLayer = 0;  //0-主界面，1-关卡界面，2-游戏界面
        //清理游戏中的数据
        this.clearGameData();

        //初始化游戏数据，加载游戏配置
        this.initData();

        //显示游戏主界面
        this.menuLayer.active = true;
        this.levelLayer.active = false;
        this.gameLayer.active = false;
        this.gameOverLayer.active = false;
        this.loadingTxt.active = true;
        this.startBtn.getComponent(cc.Button).interactable = false;

        //背景图适配
        this.fitNode(this.bg);

        this.menuLayerAni();
    },

    // 适配结点
    fitNode: function (obj) {
        let canvasSize = cc.view.getCanvasSize();
        let canvasScale = canvasSize.width / canvasSize.height;
        let designScale = 720 / 1280;
        this.bg.height = 1280 * (designScale / canvasScale);
    },

    initData : function(){
        //初始化数据
        this.boxWidth = 90;
        this.boxHeight = 90;
        this.allWidth = 720;
        this.allHeight = 1280;
        this.allRow = 8;
        this.allCol = 8;

        this.allLevelCount = 0;
        this.allLevelConfig = {};
        cc.loader.loadRes('levelConfig.json', function (err, object) {
            if (err) {
                console.log(err);
                return;
            }
            this.allLevelConfig = object.json.level;
            this.allLevelCount = object.json.levelCount;
            this.loadingTxt.active = false;
            this.startBtn.getComponent(cc.Button).interactable = true;

            //加载完配置后，直接创建关卡元素
            this.createLavelItem();
        }.bind(this));

        this.tabLevel = [];
    },

    // 创建关卡界面子元素
    createLavelItem (){
        // 进入关卡level
        let callfunc = level => {            
            this.selectLevelCallBack(level);
        };

        for(let i = 0; i < this.allLevelCount; i++){
            let node = cc.instantiate(this.levelItemPrefab);
            node.parent = this.levelScroll;
            let levelItem = node.getComponent("levelItem");
            levelItem.levelFunc(callfunc);
            this.tabLevel.push(levelItem);
        }
        // 设置容器高度
        this.levelContent.height = Math.ceil(this.allLevelCount / 5) * 135 + 20;
    },

    // 刷新关卡上的信息
    updateLevelInfo(){
        let finishLevel = parseInt(cc.sys.localStorage.getItem("finishLevel") || 0);  //已完成关卡
        for(let i = 1; i <= this.allLevelCount; i++){
            // 完成的关卡
            if(i <= finishLevel){
                let data = parseInt(cc.sys.localStorage.getItem("levelStar" + i) || 0);
                this.tabLevel[i - 1].showStar(true, data, this.levelImgAtlas, i);
            }
            // 新开的关卡
            else if(i == (finishLevel + 1)){
                this.tabLevel[i - 1].showStar(true, 0, this.levelImgAtlas, i);
            }
            // 未开启关卡图
            else{  
                this.tabLevel[i - 1].showStar(false, 0, this.levelImgAtlas, i);
            }
        }
    },

    //主界面动画
    menuLayerAni(){
        this.startBtn.scale = 1.0;
        this.startBtn.runAction(cc.repeatForever(cc.sequence(
            cc.scaleTo(0.6, 1.5), 
            cc.scaleTo(0.6, 1.0)
        )));
    },

    //开始按钮回调
    startBtnCallBack(event, customEventData){
        if(this.curLayer == 1){
            return;
        }
        this.curLayer = 1;

        this.playSound(sound.BUTTON);       

        this.menuLayer.runAction(cc.sequence(
            cc.fadeOut(0.1),
            cc.callFunc(() => {
                this.startBtn.stopAllActions();
                this.startBtn.scale = 1.0;
                this.menuLayer.opacity = 255;
                this.menuLayer.active = false;
            }
        )));

        this.levelLayer.active = true;
        this.levelLayer.opacity = 0;
        this.levelLayer.runAction(cc.sequence(
            cc.delayTime(0.1), 
            cc.fadeIn(0.1), 
            cc.callFunc(() => {
                this.updateLevelInfo();
            }
        )));
    },

    //关卡界面返回回调
    levelBackCallBack : function(event, customEventData){
        if(this.curLayer == 0){
            return;
        }
        this.playSound(sound.BUTTON);
        this.curLayer = 0;
        this.levelLayer.runAction(cc.sequence(cc.fadeOut(0.1), cc.callFunc(function () {
            this.levelLayer.opacity = 255;
            this.levelLayer.active = false;
        }, this)));

        this.menuLayer.active = true;
        this.menuLayer.opacity = 0;
        this.menuLayer.runAction(cc.sequence(cc.delayTime(0.1), cc.fadeIn(0.1)));
        this.menuLayerAni();
    },

    //关卡选择回调
    selectLevelCallBack : function(level){
        this.curLevel = level;
        if(this.curLayer == 2){
            return;
        }
        this.playSound(sound.BUTTON);
        this.curLayer = 2;
        this.levelLayer.runAction(cc.sequence(cc.fadeOut(0.1), cc.callFunc(function () {
            this.levelLayer.opacity = 255;
            this.levelLayer.active = false;
        }, this)));

        this.gameLayer.active = true;
        this.gameLayer.opacity = 0;
        this.gameLayer.runAction(cc.sequence(cc.delayTime(0.1), cc.callFunc(function(){
            this.createLevelLayer(level);
        }, this), cc.fadeIn(0.1)));
    },

    //游戏中返回关卡界面回调
    backLevelCallBack : function(event, customEventData){
        this.clearGameData();
        if(this.curLayer == 1){
            return;
        }
        this.playSound(sound.BUTTON);
        this.curLayer = 1;
        this.gameLayer.runAction(cc.sequence(cc.fadeOut(0.1), cc.callFunc(function () {
            this.gameLayer.opacity = 255;
            this.gameLayer.active = false;
        }, this)));

        this.levelLayer.active = true;
        this.levelLayer.opacity = 0;
        this.levelLayer.runAction(cc.sequence(cc.fadeIn(0.1), cc.callFunc(function () {
            this.updateLevelInfo();
        }, this)));
    },

    //下一关按钮回调
    nextLevelCallBack(event, customEventData){
        this.playSound(sound.BUTTON);
        //隐藏结算界面
        this.gameOverLayer.active = false;

        this.curLevel = this.curLevel + 1;
        if(this.curLevel > this.allLevelCount){
            //已通关，返回关卡界面
            this.backLevelCallBack();
        }
        else{
            //创建新关卡
            this.createLevelLayer(this.curLevel);
        }
    },

    //重置按钮回调
    refreshCallBack : function(event, customEventData){
        this.playSound(sound.BUTTON);
        //停止人运动动作
        this.gameLayer.stopAllActions();
        this.clearGameData();
        this.createLevelLayer(this.curLevel);
    },

    //撤销按钮回调
    revokeCallBack : function(event, customEventData){
        //暂时没做
    },

    // 创建关卡
    createLevelLayer(level){
        this.gameControlLayer.removeAllChildren();
        this.setLevel();
        this.setCurNum();
        this.setBestNum();

        let levelContent = this.allLevelConfig[level].content;
        this.allRow = this.allLevelConfig[level].allRow;
        this.allCol = this.allLevelConfig[level].allCol;
        this.heroRow = this.allLevelConfig[level].heroRow;
        this.heroCol = this.allLevelConfig[level].heroCol;

        // 计算方块大小
        this.boxW = this.allWidth / this.allCol;
        this.boxH = this.boxW;

        // 计算起始坐标
        let sPosX = -(this.allWidth / 2) + (this.boxW / 2);
        let sPosY = (this.allWidth / 2) - (this.boxW / 2);

        // 计算坐标的偏移量，运算规则（宽铺满，设置高的坐标）
        let offset = 0;
        if(this.allRow > this.allCol){
            offset = ((this.allRow - this.allCol) * this.boxH) / 2;
        }
        else{
            offset = ((this.allRow - this.allCol) * this.boxH) / 2;
        }
        this.landArrays = [];   //地图容器
        this.palace = [];       //初始化地图数据
        for(let i = 0; i < this.allRow; i++){
            this.landArrays[i] = [];  
            this.palace[i] = [];
        }

        for(let i = 0; i < this.allRow; i++){    //每行
            for(let j = 0; j < this.allCol; j++){     //每列
                let x = sPosX + (this.boxW * j);
                let y = sPosY - (this.boxH * i) + offset;
                let node = this.createBoxItem(i, j, levelContent[i * this.allCol + j], cc.v2(x, y));
                this.landArrays[i][j] = node;
                node.width = this.boxW;
                node.height = this.boxH;
            }
        }

        // 显示人物
        this.setLandFrame(this.heroRow, this.heroCol, boxType.HERO);
    },

    // 创建元素
    createBoxItem(row, col, type, pos){
        let node = new cc.Node();
        let sprite = node.addComponent(cc.Sprite);
        let button = node.addComponent(cc.Button);
        sprite.spriteFrame = this.itemImgAtlas.getSpriteFrame("p" + type);
        node.parent = this.gameControlLayer;
        node.position = pos;
        if(type == boxType.WALL){  //墙面，//墙面，命名为wall_row_col
            node.name = "wall_" + row + "_" + col;
            node.attr({"_type_" : type});
        }
        else if(type == boxType.NONE){  //空白区域,//墙面，命名为none_row_col
            node.name = "none_" + row + "_" + col;
            node.attr({"_type_" : type});
        }
        else{  //游戏界面，命名为land_row_col
            node.name = "land_" + row + "_" + col;
            node.attr({"_type_" : type});
            node.attr({"_row_" : row});
            node.attr({"_col_" : col});
            button.interactable = true;
            button.target = node;
            button.node.on('click', this.clickCallBack, this);
            if(type == boxType.ENDBOX){  //在目标点上的箱子，直接将完成的箱子数加1
                this.finishBoxCount += 1;
            }
        }
        this.palace[row][col] = type;

        return node;
    },

    clickCallBack : function(event, customEventData){
        let target = event.target;
        //最小路径长度
        this.minPath = this.allCol * this.allRow + 1;
        //最优路线
        this.bestMap = [];

        //终点位置
        this.end = {};
        this.end.row  = target._row_;
        this.end.col = target._col_;

        //起点位置
        this.start = {};
        this.start.row = this.heroRow;
        this.start.col = this.heroCol;

        //判断终点类型
        let endType = this.palace[this.end.row][this.end.col];
        if((endType == boxType.LAND) || (endType == boxType.BODY)){  //是空地或目标点，直接计算运动轨迹
            this.getPath(this.start, 0, []);

            if(this.minPath <= this.allCol * this.allRow){
                cc.log("从起点[", this.start.row, ",", this.start.col, "]到终点[", 
                this.end.row, ",", this.end.col, "]最短路径长为：", this.minPath, "最短路径为：");

                cc.log("[", this.start.row, ",", this.start.col, "]");
                for(let i = 0; i< this.bestMap.length;i++){
                    cc.log("=>[",this.bestMap[i].row,",",this.bestMap[i].col,"]");
                }
                this.bestMap.unshift(this.start);
                this.runHero();
            }else{
                console.log("找不到路径到达");
            }
        }
        else if((endType == boxType.BOX) || (endType == boxType.ENDBOX)){ //是箱子，判断是否可以推动箱子
            //计算箱子和人物的距离
            let lr = this.end.row - this.start.row;
            let lc = this.end.col - this.start.col;
            if((Math.abs(lr) + Math.abs(lc)) == 1){  //箱子在人物的上下左右方位
                //计算推动方位是否有障碍物
                let nextr = this.end.row + lr;
                let nextc = this.end.col + lc;
                let t = this.palace[nextr][nextc];
                if(t && (t != boxType.WALL) && (t != boxType.BOX) && (t != boxType.ENDBOX)){  //前方不是障碍物，也不是墙壁，推动箱子
                    this.playSound(sound.PUSHBOX);
                    //人物位置还原
                    this.setLandFrame(this.start.row, this.start.col, this.palace[this.start.row][this.start.col]);

                    //箱子位置类型
                    let bt = this.palace[this.end.row][this.end.col];
                    if(bt == boxType.ENDBOX){      //有目标物体的箱子类型，还原成目标点
                        this.palace[this.end.row][this.end.col] = boxType.BODY;
                        this.finishBoxCount -= 1;
                    }
                    else{
                        this.palace[this.end.row][this.end.col] = boxType.LAND;
                    }
                    //箱子位置变成人物图，但类型保存为空地或目标点
                    this.setLandFrame(this.end.row, this.end.col, boxType.HERO);

                    //箱子前面位置变成箱子
                    let nt = this.palace[nextr][nextc];
                    if(nt == boxType.BODY){  //有目标点，将箱子类型设置成有目标箱子
                        this.palace[nextr][nextc] = boxType.ENDBOX;
                        this.finishBoxCount += 1;
                    }
                    else {
                        this.palace[nextr][nextc] = boxType.BOX;
                    }
                    this.setLandFrame(nextr, nextc, this.palace[nextr][nextc]);

                    this.curStepNum += 1;
                    //刷新步数
                    this.setCurNum();
                    
                    //刷新人物位置
                    this.heroRow = this.end.row;
                    this.heroCol = this.end.col;

                    this.checkGameOver();
                }
                else{
                    this.playSound(sound.WRONG);
                    console.log("前方有障碍物");
                }
            }
            else{   //目标点错误
                this.playSound(sound.WRONG);
                console.log("目标点错误");
            }
        }
    },

    //curPos记录当前坐标，step记录步数
    getPath : function(curPos, step, result){
        //判断是否到达终点
        if((curPos.row == this.end.row) && (curPos.col == this.end.col)){
            if(step < this.minPath){
                this.bestMap = [];
                for(let i = 0; i < result.length; i++){
                    this.bestMap.push(result[i]);
                }
                this.minPath = step; //如果当前抵达步数比最小值小，则修改最小值
                result = [];
            }
        }

        //递归
        for(let i = (curPos.row - 1); i <= (curPos.row + 1); i++){
            for(let j = (curPos.col - 1); j <= (curPos.col + 1); j++){
                //越界跳过
                if((i < 0) || (i >= this.allRow) || (j < 0) || (j >= this.allCol)){
                    continue;
                }
                if((i != curPos.row) && (j != curPos.col)){//忽略斜角
                    continue;
                }
                else if(this.palace[i][j] && ((this.palace[i][j] == boxType.LAND) || (this.palace[i][j] == boxType.BODY))){
                    let tmp = this.palace[i][j];
                    this.palace[i][j] = boxType.WALL;  //标记为不可走

                    //保存路线
                    let r = {};
                    r.row = i;
                    r.col = j;
                    result.push(r);

                    this.getPath(r, step + 1, result);
                    this.palace[i][j] = tmp;  //尝试结束，取消标记
                    result.pop();
                }
            }
        }
    },

    //人物运动
    runHero : function(){
        this.setLandEnable(false);
        let array = [];
        for(let i = 1; i < this.bestMap.length; i++){
            array.push(cc.delayTime(0.1));
            array.push(cc.callFunc(function(){
                let pos = this.bestMap[i];
                this.setLandFrame(pos.row, pos.col, boxType.HERO);
                let lastPos = this.bestMap[i - 1];
                this.setLandFrame(lastPos.row, lastPos.col, this.palace[lastPos.row][lastPos.col]);

                this.curStepNum += 1;
                this.playSound(sound.MOVE);
                //刷新步数
                this.setCurNum();
            }, this));
        }
        array.push(cc.callFunc(function(){
            //刷新人物所在位置
            this.heroRow = this.end.row;
            this.heroCol = this.end.col;
            //设置地图是否可点击
            this.setLandEnable(true);
        }, this));

        if(array.length >= 2){  //避免出错
            this.gameLayer.runAction(cc.sequence(array));
        }
        else{
            this.setLandEnable(true);
        }
    },

    //设置地图不可点
    setLandEnable : function(isEnable){
        for(let i = 0; i < this.allRow; i++){
            for(let j = 0; j < this.allCol; j++){
                let land = this.landArrays[i][j];
                if(land){
                    land.getComponent(cc.Button).interactable = isEnable;
                }
            }
        }
    },

    //设置地板图片
    setLandFrame : function(row, col, type){
        let land = this.landArrays[row][col];
        if(land){
            land.getComponent(cc.Sprite).spriteFrame = this.itemImgAtlas.getSpriteFrame("p" + type);
            land.width = this.boxW;
            land.height = this.boxH;
        }
    },  

    // 游戏结束检测
    checkGameOver(){
        let count = this.allLevelConfig[this.curLevel].allBox;
        // 全部推到了指定位置
        if(this.finishBoxCount == count){   
            this.gameOverLayer.active = true;
            this.gameOverLayer.opacity = 1; 
            this.gameOverLayer.runAction(cc.sequence(
                cc.delayTime(0.5), 
                cc.fadeIn(0.1)
            ));

            // 刷新完成的关卡数
            let finishLevel = parseInt(cc.sys.localStorage.getItem("finishLevel") || 0);
            if(this.curLevel > finishLevel){
                cc.sys.localStorage.setItem("finishLevel", this.curLevel);
            }

            // 刷新星星等级
            cc.sys.localStorage.setItem("levelStar" + this.curLevel, 3);

            // 刷新最优步数
            let best = parseInt(cc.sys.localStorage.getItem("levelBest" + this.curLevel) || 0);
            if((this.curStepNum < best) || (best == 0)){
                cc.sys.localStorage.setItem("levelBest" + this.curLevel, this.curStepNum);
            }
            this.playSound(sound.GAMEWIN);
            this.clearGameData();
        }
    },

    //显示关卡等级
    setLevel : function(){
        this.levelTxt.getComponent(cc.Label).string = this.curLevel;
    },

    //显示当前步数
    setCurNum : function(){
        this.curNum.getComponent(cc.Label).string = this.curStepNum;
    },

    //显示最优步数
    setBestNum : function(){
        let bestNum = cc.sys.localStorage.getItem("levelBest" + this.curLevel) || "--";
        this.bestNum.getComponent(cc.Label).string = bestNum;
    },

    //清理游戏中数据
    clearGameData : function(){
        this.finishBoxCount = 0;
        this.curStepNum = 0;
        this.curStepNum = 0;
    },

    //播放音效
    playSound : function(name){
        cc.loader.loadRes(name, cc.AudioClip, function (err, clip) {
            var audioID = cc.audioEngine.playEffect(clip, false);
        });
    },

    start () {

    },
});