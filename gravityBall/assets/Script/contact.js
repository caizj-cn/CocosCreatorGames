//碰撞监听脚本
cc.Class({
    extends: cc.Component,
    properties: {

    },
    onLoad () {

    },

    onDestroy () {

    },

    onBeginContact ( contact, selfCollider, otherCollider){
        if(selfCollider.tag == 0 && otherCollider.tag == 0){
            cc.log("onBeginContact...");  //碰撞开始
            this.gameOver();
        }
    },
　　onEndContact (contact, selfCollider, otherCollider){
        //cc.log("onEndContact...");//碰撞结束 
    },
　　onPreSolve(contact, selfCollider, otherCollider){
        //cc.log("onPreSolve...");//碰撞持续,接触时被调用
    },
　　onPostSolve (contact, selfCollider, otherCollider){
        //cc.log("onPostSolve...");//碰撞接触更新完后调用,可以获得冲量信息
    },

    //游戏结束
    gameOver (){
        if(this.callBack){
            this.callBack();
        }
    },

    gameOverCallBack (callBack){
        this.callBack = callBack;
    },

    //隐藏动作
    hideBall (){
        this.node.runAction(cc.fadeOut(1.0));
    },

    //显示动作
    showBall(){
        this.node.opacity = 0;
        this.node.runAction(cc.fadeIn(0.5));
    }
});
