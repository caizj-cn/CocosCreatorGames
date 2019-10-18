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
            this.contactFunction(selfCollider, otherCollider);
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

    //碰撞监听
    contactFunction (selfCollider, otherCollider){
        if(this.callBack){
            this.callBack(selfCollider, otherCollider);
        }
    },

    contactCallBack (callBack){
        this.callBack = callBack;
    },

});
