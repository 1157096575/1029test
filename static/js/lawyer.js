/*在调用此 js 前, 要给定这4个参数
var send = "", // 发送者 id
    receive = "", // 接收者 id
    appId = "",
    appKey = "";
*/

AV.init({
    appId: appId, 
    appKey: appKey
});

var realTime = new AV.Realtime({
    appId: appId,
    plugins: [AV.TypedMessagesPlugin]
});

//向 leancloud 注册用户
var client = realTime.createIMClient(send);

//查询历史消息. 页面开启时就运行
(function() {
    return create().then(function(conversation) {
        return conversation.queryMessages({
            limit: 10, //最新的十条消息，按时间增序排列. 取值 1 ~ 1000, 默认 20 
        }).then(function(messages) {
            console.log(messages);
            //此处处理接收的历史消息
        }).catch(console.error);
    }).catch(console.error);
})();

//接收消息
client.then(function(conversation) {
    return conversation.on('message', function(message, conversation) {
        console.log(message);
        /*if (message != null && message != undefined && message != '') {
            
        }*/
        //此处处理接收的消息
    });
});

//创建对话
function create() {
    var conv;
    //先查询, 如果没有记录再创建, 并且创建时使用 unique 参数
    client.then(function(conversation) {
        conversation.getQuery().containsMembers([send, receive]).find().then(function (convs) {
            if (convs != null && convs != undefined && convs.length == 1) {
                conv = convs[0];
            }
        }).catch(console.error);
    });
    if (conv == null || conv == undefined) {
        return client.then(function(conversation) {
            return conversation.createConversation({
                members: [receive],
                transient: false,
                unique: true
            });
        });
    }
    return conv;
}
//发送文字消息
function sendText(msg) {
    return create().then(function(conversation) {
        return conversation.send(new AV.TextMessage(msg));
    }).then(function(message) {
        console.log(message);
        //此处处理发送的文字消息
    }).catch(console.error);
}
//发送文件
function sendFile(obj) {
    if (checkFile(obj)) {
        return create().then(function(conversation) {
            var file = new AV.File(obj.name, obj);
            file.save().then(function() {
                return conversation.send(new AV.FileMessage(file));
            }).then(function(message) {
                console.log(message);
                //此处处理发送的文件消息
            });
        }).catch(console.error);
    }
}
//发送图片
function sendImage(obj) {
    if (obj != null && obj != undefined) {
        var imageFileFlag = (obj.type != undefined && obj.type.startsWith("image"));
        var imageUrlFlag = /http(s?):\/\/(.*)\.(jpg|jpeg|bmp|png|gif)$/i.test(obj);
        if (imageFileFlag || imageUrlFlag) {
            return create().then(function(conversation) {
                var file;
                if (imageFileFlag) {
                    file = new AV.File(obj.name, obj);
                } else {
                    file = new AV.File.withURL(obj.substring(obj.lastIndexOf("/") + 1), obj);
                }
                if (file != null && file != undefined) {
                    file.save().then(function() {
                        return conversation.send(new AV.ImageMessage(file));
                    }).then(function(message) {
                        console.log(message);
                        //此处处理发送的图片消息
                    });
                }
            }).catch(console.error);
        }
    }
}
//检查是否是一个文本, 是则返回 true
function checkFile(obj) {
    return obj != null && obj != undefined && obj.type != undefined && obj.type.startsWith("text");
}
//检查是否是一个 图片 或 图片 url, 是则返回 true
function checkImage(obj) {
    if (obj == null || obj == undefined) return false;
    if (obj.type != undefined && obj.type.startsWith("image")) return true;
    return /http(s?):\/\/(.*)\.(jpg|jpeg|bmp|png|gif)$/i.test(obj);
}
//发送文字
$("#sendMsg_text").on('click', function(event) {
    event.preventDefault();
    var msg = $("#textMsg").val();
    sendText(msg);
});
//发送图片
$("#sendMsg_img").on('click', function(event) {
    event.preventDefault();
    var msg = $("#imgMsg")[0].files[0];
    if (checkImage(msg)) {
        sendImage(msg);
    } else {
        $('#imgMsg').val("");
    }
});
//发送文件
$("#sendMsg_file").on('click', function(event) {
    event.preventDefault();
    var msg = $("#fileMsg")[0].files[0];
    if (checkFile(msg)) {
        sendFile(msg);
    } else {
        $('#fileMsg').val("");
    }
});