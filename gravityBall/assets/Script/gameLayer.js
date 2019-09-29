let DESIGN_WIDTH = 720;            //设计分辨率宽
let DESIGN_HEIGHT = 1280;          //设计分辨率高
let BOARD_DEFAULT_WIDTH = 98;    //挡板初始宽度
// let BOARD_BINGBOX_POS = [(-21, 15), (21, 15), (29, 10), (32, 4), 
//                         (32, -4), (29, -10), (21, -15), (-21, -15), 
//                         (-29, -10), (-32, -4), (-32, 4), (-20, 10)];

let BOARD_INTERVAL_MIN = 30;   //两个挡板之前的最小间距
let BOARD_INTERVAL_MAX = 70;   //两个挡板之前的最大间距

let HEIGHT_INTERVAL = 130;      //两挡板之间高度间隔

let BOARD_WIDTH_MIN = [198, 150, 98, 98, 98, 98, 98];       //挡板最小宽度 (7个等级)
let BOARD_WIDTH_MAX = [498, 450, 398, 350, 350, 300, 300];    //挡板最大宽度 (7个等级)

let BOARD_SPEED = [1, 1.5, 2, 2.5, 3, 4, 5];             //挡板运行速度 (7个等级)

let BOARD_COLOR = [cc.Color.GREEN, cc.Color.CYAN, cc.Color.YELLOW, cc.Color.ORANGE, cc.Color.MAGENTA, cc.Color.RED, cc.Color.GRAY];

//音效名称
let sound = {
    BG : "sound/background",      //背景
    DIE : "sound/buzz",           //死亡音效
    GAMEWIN : "sound/get_item",   //过关音效
    GAMEOVER : "sound/pass",   //游戏结束
}

cc.Class({
    extends: cc.Component,

    properties: {
        bg : cc.Node,
        gameBgImg : cc.Node,
        physicsLayer : cc.Node,
        boardLayer : cc.Node,
        upgradeImg : cc.Node,
        gameScoreText : cc.Label,
        fireEffect0 : cc.Node,
        fireEffect1 : cc.Node,
        fireBody0 : cc.Node,
        fireBody1 : cc.Node,

        //游戏结束界面
        bgSp : cc.Node,
        gameOverLayer : cc.Node,
        scoreTxt : cc.Node,
        bestScoreTxt : cc.Node,
        bestScoreImg : cc.Node,
        newRecordImg : cc.Node,
        
        ballAtlas : cc.SpriteAtlas,
        ballPrefab : cc.Prefab,
        boardPrefab : cc.Prefab,
    },

    onLoad () {
        this.allBoards = [];  //所有挡板
        this.curLevel = 0;    //记录当前等级
        this.curColorIdx = 0; //记录当前颜色索引
        this.curTimeStamp = new Date().getTime(); //获取当前时间戳
        this.curScore = 0;    //记录当前得分
        this.isGameOver = false; //是否有戏结束

        this.playMusic(sound.BG);

        //打开重力传感系统
        this.openDeviceMotion();

        //打开物理系统
        cc.director.getPhysicsManager().enabled = true;
        //cc.director.getPhysicsManager().debugDrawFlags = true;
        
        // 重力加速度的配置
        cc.director.getPhysicsManager().gravity = cc.v2(0, -1000);

        //创建多行挡板
        let curH = 0;
        while(curH >= (-DESIGN_HEIGHT / 2 - HEIGHT_INTERVAL)){
            this.createALineBoard(curH);
            curH -= HEIGHT_INTERVAL;
        }

        //创建小球
        this.createBall();

        //适配
        this.fitNode(this.bg);
        this.fitNode(this.gameBgImg);
        this.fitNode(this.bgSp);

        //上下火粒子动画适配
        let h = this.gameBgImg.height;
        this.fireEffect0.position = cc.v2(0, -h / 2);
        this.fireEffect1.position = cc.v2(0, h / 2);
        this.fireBody0.position = cc.v2(0, -h / 2);
        this.fireBody1.position = cc.v2(0, h / 2);

    },

    //创建小球
    createBall (){
        if(this.ballImg == null){
            this.ballImg = cc.instantiate(this.ballPrefab);
            this.ballImg.parent = this.physicsLayer;
        }
        this.ballImg.position = cc.v2(200, 300);
        let ballNode = this.ballImg.getComponent("contact");
        ballNode.gameOverCallBack(() => {
            if(!this.isGameOver){
                cc.log("game over...gameLayer");
                this.playSound(sound.DIE);
                //停止所有动作
                this.isGameOver = true;
                this.closeDeviceMotion();
                //小球逐渐隐藏
                ballNode.hideBall();
                this.gameBgImg.runAction(cc.sequence(cc.delayTime(0.5), cc.callFunc(()=>{
                    this.showGameOverLayer();
                })));
            }
        });
        
        //小球显示
        ballNode.showBall();

        let rand = Math.floor(Math.random() * 9) + 1;
        ballNode.getComponent(cc.Sprite).spriteFrame = this.ballAtlas.getSpriteFrame("ball_" + rand);
    },

    // 适配结点
    fitNode: function (obj) {
        let canvasSize = cc.view.getCanvasSize();
        let canvasScale = canvasSize.width / canvasSize.height;
        let designScale = DESIGN_WIDTH / DESIGN_HEIGHT;
        obj.height = DESIGN_HEIGHT * (designScale / canvasScale);
    },

    onDestroy () {
        this.closeDeviceMotion();
    },

    openDeviceMotion(){
        cc.systemEvent.setAccelerometerEnabled(true);
        cc.systemEvent.on(cc.SystemEvent.EventType.DEVICEMOTION, this.onDeviceMotionEvent, this);
    },

    closeDeviceMotion(){
        cc.systemEvent.off(cc.SystemEvent.EventType.DEVICEMOTION, this.onDeviceMotionEvent, this);
    },

    onDeviceMotionEvent (event) {
        if(this.ballImg){
            this.ballImg.getComponent(cc.RigidBody).applyForceToCenter(cc.v2(event.acc.x * 400000 , 0));
        }
    },

    //创建一排挡板
    createALineBoard : function(posH){
        let isNeed = true;
        let boards = [];
        while(isNeed){
            //随机一个宽度
            let randomW = Math.random() * (BOARD_WIDTH_MAX[this.curLevel] - BOARD_WIDTH_MIN[this.curLevel]) + BOARD_WIDTH_MIN[this.curLevel];  

            let posX = 0;
            if(boards.length == 0){//第一个挡板
                //随机一个坐标
                let minPosX = -DESIGN_WIDTH / 2 - randomW / 2;
                let maxPosX = -DESIGN_WIDTH / 2 + randomW / 2;
                posX = Math.random() * (maxPosX - minPosX) + minPosX;

                let board = {};
                board.w = randomW;
                board.x = posX;
                boards.push(board);
                this.createBoard(cc.v2(posX, posH), board.w);
            } 
            else{//不是第一个，根据前一个挡板的坐标进行计算位置
                let lastBoard = boards[boards.length - 1];
                let randomInterval = Math.random() * (BOARD_INTERVAL_MAX - BOARD_INTERVAL_MIN) + BOARD_INTERVAL_MIN;
                posX = lastBoard.w / 2 + randomW / 2 + randomInterval + lastBoard.x;

                //校验这个挡板坐标是否会影响下一个挡板的创建
                //计算这个挡板到右边距的距离
                let rightDis = DESIGN_WIDTH / 2 - posX - randomW / 2;
                if((rightDis < BOARD_INTERVAL_MIN) && (rightDis > 0)){  //如果到右边距离小于最小间距且大于0，则当前挡板大小不合适，需要重新创建
                    isNeed = true;
                }
                else {
                    let board = {};
                    board.w = randomW;
                    board.x = posX;
                    boards.push(board);
                    this.createBoard(cc.v2(board.x, posH), board.w);
                    if(rightDis > BOARD_INTERVAL_MAX){//如果到右边距离大于最大间距，则还需要继续创建
                        isNeed = true;
                    }
                    else {
                        isNeed = false;
                    }
                }
            }
        }
        return boards;
    },

    //创建挡板
    createBoard : function(pos, width){
        let board = cc.instantiate(this.boardPrefab);
        board.parent = this.boardLayer;
        board.position = pos;
        board.width = width;
        board.color = BOARD_COLOR[this.curColorIdx];

        let boxP = board.getComponent(cc.PhysicsPolygonCollider);
        let points = boxP.points;
        for(let i = 0; i < points.length; i++){
            let pos = points[i];
            if(pos.x > 0){  //大于0的向右扩展
                board.getComponent(cc.PhysicsPolygonCollider).points[i] = cc.v2(pos.x + (width - BOARD_DEFAULT_WIDTH) / 2, pos.y);
            }
            else{
                board.getComponent(cc.PhysicsPolygonCollider).points[i] = cc.v2(pos.x - (width - BOARD_DEFAULT_WIDTH) / 2, pos.y);
            }
        }
        boxP.apply();
        this.allBoards.push(board);
        return board;
    },

    //移动挡板
    moveBoard : function(){
        for(let i = 0; i < this.allBoards.length; i++){
            let board = this.allBoards[i];
            let curPosY = board.position.y;

            //移动挡板
            board.position = cc.v2(board.position.x, curPosY + BOARD_SPEED[this.curLevel]);
            //判断挡板是否已经完全移除屏幕
            if(board.position.y > (DESIGN_HEIGHT / 2 + 150)){
                this.allBoards.splice(i, 1);
                board.removeFromParent();
            }
        }
    },

    //计算变化后的RGB值
    computeGRB : function(oldValue, newValue, tmpValue){
        if(tmpValue != newValue){
            if(newValue > oldValue){
                tmpValue += 8;
                if(tmpValue > newValue){
                    tmpValue = newValue;
                }
            }
            else{
                tmpValue -= 8;
                if(tmpValue < newValue){
                    tmpValue = newValue;
                }
            }   
        }
        return tmpValue;
    },

    //计算升级
    computeUpgrade : function(){
        //获取时间戳，判断是否需需要升级
        let timeStamp = new Date().getTime();
        if((timeStamp - this.curTimeStamp) >= 10000){ //每10s调整一次难度
            if(this.curLevel < 6){
                //显示升级提示图片
                this.upgradeImg.active = true;
                this.upgradeImg.opacity = 255;
                this.upgradeImg.runAction(cc.sequence(cc.delayTime(1.0), cc.blink(1, 5), cc.fadeOut(1, 0)));
        
                this.curLevel += 1;
            }
            this.curTimeStamp = timeStamp;

            //保存现在的颜色
            let oldColor = BOARD_COLOR[this.curColorIdx];
            let tmpRedValue = oldColor.getR();
            let tmpGreenValue = oldColor.getG();
            let tmpBlueValue = oldColor.getB();

            this.curColorIdx = (this.curColorIdx + 1) % 7;
            //更换所有挡板颜色
            let array = [];
            for(let num = 0; num < 32; num++){ //32是最多变化次数  255除以8向上取整所得
                array.push(cc.callFunc(() =>{
                    tmpRedValue = this.computeGRB(oldColor.getR(), BOARD_COLOR[this.curColorIdx].getR(), tmpRedValue);
                    tmpGreenValue = this.computeGRB(oldColor.getG(), BOARD_COLOR[this.curColorIdx].getG(), tmpGreenValue);
                    tmpBlueValue = this.computeGRB(oldColor.getB(), BOARD_COLOR[this.curColorIdx].getB(), tmpBlueValue);
                    
                    for(let i = 0; i < this.allBoards.length; i++){
                        let board = this.allBoards[i];
                        board.color = cc.color(tmpRedValue, tmpGreenValue, tmpBlueValue, 255);
                    }
                }));
                array.push(cc.delayTime(0.05));
            }
            this.physicsLayer.runAction(cc.sequence(array));
        }
    },

    //计算得分
    computeSocre : function(){
        this.gameScoreText.string = this.curScore;
    },

    //显示结算界面
    showGameOverLayer (){
        this.playSound(sound.GAMEOVER);
        this.gameOverLayer.active = true;
        this.gameOverLayer.position = cc.v2(0, 2000);
        this.gameOverLayer.runAction(cc.moveTo(0.8, cc.v2(0, 0)));

        //当前得分
        this.scoreTxt.getComponent(cc.Label).string = this.curScore;

        //最高分
        let ballBestScore = parseInt(cc.sys.localStorage.getItem("ballBestScore") || 0);
        this.bestScoreTxt.getComponent(cc.Label).string = ballBestScore;
        if(ballBestScore >= this.curScore){
            this.bestScoreTxt.active = true;
            this.bestScoreImg.active= true;
            this.newRecordImg.active = false;
        }
        else{
            this.bestScoreTxt.active = false;
            this.bestScoreImg.active= false;
            this.newRecordImg.active = true;
            cc.sys.localStorage.setItem("ballBestScore", this.curScore);
        }
    },

    //再来一局按钮回调
    againBtnCallBack(){
        //清理上局的挡板
        this.boardLayer.removeAllChildren();
        //刷新界面，重新开始游戏
        this.gameOverLayer.runAction(cc.sequence(cc.moveTo(0.3, cc.v2(1500, 0)), cc.callFunc(()=>{
            //重置得分
            this.curScore = 0;
            this.computeSocre();
            this.isGameOver = false;
            this.curLevel = 0;
            this.curTimeStamp = new Date().getTime();
            this.curColorIdx = 0;
            //重置小球
            this.createBall();

            //创建多行挡板
            let curH = 0;
            while(curH >= (-DESIGN_HEIGHT / 2 - HEIGHT_INTERVAL)){
                this.createALineBoard(curH);
                curH -= HEIGHT_INTERVAL;
            }

            //开启传感系统
            this.openDeviceMotion();
        })));
    },

    //播放音乐
    playMusic : function(name){
        cc.loader.loadRes(name, cc.AudioClip, function (err, clip) {
            var audioID = cc.audioEngine.playEffect(clip, true);
        });
    },

    //播放音效
    playSound : function(name){
        cc.loader.loadRes(name, cc.AudioClip, function (err, clip) {
            var audioID = cc.audioEngine.playEffect(clip, false);
        });
    },

    update: function (dt) {
        if(!this.isGameOver){
            this.computeUpgrade();
            this.moveBoard();
    
            //判断是否要新建一行挡板
            let allCount = this.allBoards.length;
            if((allCount > 0) && this.allBoards[allCount - 1]){
                let pos = this.allBoards[allCount - 1].position;
                if(pos.y >= -DESIGN_HEIGHT / 2){
                    this.createALineBoard(pos.y - HEIGHT_INTERVAL);
                    this.curScore += 1;
                    this.computeSocre();
                    this.playSound(sound.GAMEWIN);
                }
            }
        }
    },
});