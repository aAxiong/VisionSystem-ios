var color_array = ["s2", "s3", "s1"];//色盲图数组
var rg_array = ["r2", "r3", "r4", "r1"]; //红绿图数组
var ds_array = ['W-E', 'S-E', 'D-E', 'A-E']; //视力 E 方向
var iv_arrau = [];
var route_array = ["visualAcuity", "nightAcuity", "colorBlindness", "redGreen"];  //页面名称
var route_num = [0, 1, 2, 3];
var moni = [1, 3];
var route_array1 = [];  //装最后剩下的页面
var socket = "";   // socket需要全局
var scanContent = "";  //二维码的内容
var wz = "";    //网址
var data_array = [];  //装最后上传数据的数组
var page = 0;   //页面编号  视力表为1 夜视力为2 色盲图为3 红绿图为4 提交报告为5
var colorPT = 0;   //色盲图片图片计数  暂无用 先保留
var redPT = 0;  //红绿图片计数  暂无用 先保留


$(function () {  //起始
    //socket = io.connect("http://192.168.4.251:8899");
    //rotePage(a);
    // handlePageArray(moni);
    // socket.on("route jump", function (data) {    //监听pc端控制台给你传的参数   
    //     rotePage(data);    //1-4
    //  });
    var array = [];
    actFun();
    handlePageArray(array)

})



/*-----------------------------------------------------------------------------所有的监听-------------------------------------------------------------------*/
$(document).on("pageReinit", function (e, pageId, $page) {  //页面监听事件  页面后退
    switch (pageId) {
        case "visualAcuity": page = 1; break;
        case "nightAcuity": page = 2; break;
        case "colorBlindness": page = 3; break;
        case "redGreen": page = 4; break;
        case "submit": page = 5; break;
    }
    //  $.toast("现在是页面" + page);
    socket.emit('char message', { MF: page, NUM: "" });
});

$(document).on("pageInit", function (e, pageId, $page) {  //页面前进
    switch (pageId) {
        case "visualAcuity": page = 1; break;
        case "nightAcuity": page = 2; break;
        case "colorBlindness": page = 3; break;
        case "redGreen": page = 4; break;
        case "submit": page = 5; break;
    }
    //  $.toast("现在是页面" + page);
    socket.emit('char message', { MF: page, NUM: "" });

});

//socket.on("route jump", function (data) {    //监听PC端控制台给你传的参数   
//  $.toast("此功能暂未更新");
//  handlePageArray(data.route);
//  //  alert(data.route);
//  //  rotePage(data.route);
//  //1-4
//});



function scaneds(t, r, f) {  //扫描登陆    r的格式 192.168.4.252,1,2,3
    var array = [];  //创建一个空数组来装页面编号
    var rp = r.split(","); //拆分网址rp[0] 和其他
    var sc = rp[0];  //网址
    var a = sc.split("/");
    if (rp[1] == undefined || rp[1] == "") {
        handlePageArray(array);
    } else {
        for (var i = 1; i < rp.length; i++) {
            array.push(rp[i]);
        }
        handlePageArray(array);
    }
    scanContent = sc;
    wz = a[0] + "//" + a[2];
    socket = io.connect(wz);
    //  $.toast("网址是:"+wz);
    prohibitClick();//先解绑点击事件
    actFun();
    $("#sub").unbind("click");
    $("#sub").text("扫码提交");
    $(document).on('click', '#sub', function (e) {
        subLimit();
        
    })
    socket.emit('ew close', { state: 'success' });
    $.router.loadPage("#" + route_array1[0]);


}


function actFun() {//激活函数
    //$(document).on('click', '.icon-left', function (e) {
    //    socket.emit('char message', { MF: page, NUM: "" });
    //}); //返回操作  log 15

    //$(document).on('click', '.button-green-o', function (e) {
    //    socket.emit('char message', { MF: page, NUM: "" });
    //});  //下一步操作  log 14
    $(document).on('click', '.sub', function () {
        socket.emit('char message', { MF: 5, NUM: "" }); //direction
    })
    eyeTable();  //视力表
    pit();       //红绿图
    subReport();//提交报告

}

function handlePageArray(array) {  //处理一下接收的页面的数组
    if (array.length == "") {
        rotePage(route_num);
    } else {
        var arr = xzArray(route_num, moni);
        rotePage(arr);
    }
}

function xzArray(a, b) { //删除数组相同而内容操作
    var temp = []; //临时数组1 
    var temparray = [];//临时数组2 
    for (var i = 0; i < b.length; i++) {
        temp[b[i]] = true;//把数组B的值当成临时数组1的键并赋值为真 
    };
    for (var i = 0; i < a.length; i++) {
        if (!temp[a[i]]) {
            temparray.push(a[i]);//同时把数组A的值当成临时数组1的键并判断是否为真，如果不为真说明没重复，就合并到一个新数组里，这样就可以得到一个全新并无重复的数组 
        };
    };
    temparray.join(",");
    return temparray;
}


function rotePage(data) {  //处理需要页面
    var route_arrayC = [];
    for (var i = 0; i < data.length; i++) {
        route_arrayC.push(route_array[data[i]]);
    }
    printf_route(route_arrayC);
    route_array1 = [].concat(route_arrayC);
}

function printf_route(array) {  //打印
    for (var i = 0; i < array.length; i++) {
        if (i == (array.length - 1)) {
            $("#" + array[i]).find(".button-green-o").attr("href", "#submit");
        }
        else {
            $("#" + array[i]).find(".button-green-o").attr("href", "#" + array[i + 1]);
        }
    }
}

function eysE(id) { //切换 E 函数
    iv_arrau = [];
    var news = ds_array.sort(function () { return 0.5 - Math.random() });
    for (var i = 0; i < 3; i++) {
        id.find(".ebox img").eq(i).attr("src", "img/" + news[i] + ".png");
        iv_arrau.push(news[i]);
    }

}

function randomsort(a, b) {//打乱数组
    return Math.random() > .5 ? -1 : 1;
}


/*-----------------------------------------------------------------------------点击类切换-------------------------------------------------------------------*/

function eyeTable() { //视力表rotePage(data)
    /*视力表&夜视力*/
    $(document).on('click', '.degrees-table ul li', function (e) {// 视力表和夜视力 切换度数
        $(this).addClass("active").siblings().removeClass("active");
        var num = parseInt($(this).parents(".page").attr("num"));
        eysE($(this).parents(".page"));
        socket.emit('char message', { MF: page, NUM: $(this).index() + 1, EQ: iv_arrau });
    })
}

function pit() { //图片
    /*色盲&红绿图*/
    $(document).on('click', '#color_B', function (e) {//色盲图切换
        var num = parseInt($(this).parents(".page").attr("num"));
        $.toast("切换成功");
        $(this).find("img").attr("src", "img/active/" + color_array[0] + ".png");
        var first = color_array.shift();
        color_array.push(first);
        socket.emit('char message', { MF: page, NUM: 14 });

    })
    $(document).on('click', '#red_green', function (e) {  //红绿随机图切换
        var num = parseInt($(this).parents(".page").attr("num"));
        $.toast("切换成功");
        $(this).find("img").attr("src", "img/active/" + rg_array[0] + ".png")
        var oneEle = rg_array.shift();
        rg_array.push(oneEle);
        socket.emit('char message', { MF: page, NUM: 14 });
    })
}

function subReport() { //提交报告
    /*提交报告*/
    $(document).on('click', '.Tdegrees-table ul li', function (e) {//提交报告填写度数
        $(this).addClass("active").siblings().removeClass("active");

    })
    $(document).on('click', '.trues', function (e) { //正常选项
        $(this).addClass("active").siblings().removeClass("active");
        $(this).find("img").attr("src", "img/yesa.png");
        $(this).siblings().eq(0).find("img").attr("src", "img/none.png");
        $(this).siblings().eq(1).find("img").attr("src", "img/notm.png");
    })
    $(document).on('click', '.falses', function (e) { //异常选项
        $(this).addClass("active").siblings().removeClass("active");
        $(this).find("img").attr("src", "img/nonea.png");
        $(this).siblings().find("img").attr("src", "img/yes.png");
        $(this).siblings().eq(1).find("img").attr("src", "img/notm.png");
    })
    $(document).on('click', '.notm', function (e) { //未测选项
        $(this).addClass("active").siblings().removeClass("active");
        $(this).find("img").attr("src", "img/notma.png");
        $(this).siblings().eq(0).find("img").attr("src", "img/yes.png");
        $(this).siblings().eq(1).find("img").attr("src", "img/none.png");
    })

    $("#num").bind("input", function () {  //确认删除框 删除按钮出现消失判断
        if ($(this).val() != "") {
            $("#sub").text("编码提交");
        }
        else {
            $("#sub").text("扫码提交");
        }
    });
    $("#sub").click(function () {
        subL();
    })


}


subL = function () {  //苹果 直接提交
    if ($("#left li.active").length <= 0) {
        $.toast("左眼视力还没有选择");
    }
    else if ($("#right li.active").length <= 0) {
        $.toast("右眼视力还没有选择");
    }
    else {
        var leftV = $("#left li.active").text();
        var rightV = $("#right li.active").text();
        var color = $(".chage .col-33.active").eq(0).text();  //色盲
        var redG = $(".chage .col-33.active").eq(1).text();  //红绿图
        var wa = $(".chage .col-33.active").eq(2).text();     //眼位
        var night = $(".chage .col-33.active").eq(3).text();  //夜视力
        data_array = [leftV, rightV, color, redG, night, wa];
        $.toast("提交成功");
        csh();
        setTimeout(function () {
            //$.router.loadPage("#visualAcuity");
            //  $.router.loadPage(route_arrayC[0]);
            $.toast("提交完毕,准备回到首页");
            $("#num").val("");
            $("#sub").val("提交");
            $.router.loadPage("#" + route_array1[0]);
            // route_array1 =[]; /
        }, 1000);

    }
}


csh = function () { //苹果的初始化
    color_array = ["s2.png", "s3.png", "s1.png"];//色盲图数组
    rg_array = ["r1.png", "r2.png", "r3.png", "r.png"]; //红绿图数组
    $("#visualAcuity  .degrees-table ul li").eq(0).addClass("active").siblings().removeClass("active");  //视力表初始化
    $("#nightAcuity  .degrees-table ul li").eq(0).addClass("active").siblings().removeClass("active");   //夜视力初始化

    //for (var i = 0; i < iv_array.length; i++) {
    //    $("#visualAcuity .ebox .main-content img").eq(i).attr("src", "img/" + iv_array[i]);
    //    $("#nightAcuity .ebox .main-content img").eq(i).attr("src", "img/" + iv_array[i]);
    //}
    //视力表 夜视力的e图片也要初始化
    $("#color_B img").attr("src", "img/active/s1.png");  //色盲图片初始化
    $("#red_green img").attr("src", "img/active/r1.png"); // 红绿随即图初始化
    $("#left li").removeClass("active");  //报告页面左边视力清空
    $("#right li").removeClass("active"); //报告页面右边边视力清空
    $(".changeBox .chage .trues").addClass("active");
    $(".changeBox .chage .falses").removeClass("active");
    $(".changeBox .chage .notm").removeClass("active");
    $(".trues img").attr("src", "img/yesa.png");
    $(".falses img").attr("src", "img/none.png");
    $(".notm img").attr("src", "img/notm.png");

}

function subLimit() {//提交限制
    if ($("#left li.active").length <= 0) {
        $.toast("左眼视力还没有选择");
    }
    else if ($("#right li.active").length <= 0) {
        $.toast("右眼视力还没有选择");
    }
    else {
        var leftV = $("#left li.active").text();
        var rightV = $("#right li.active").text();
        var color = $(".chage .col-33.active").eq(0).text();  //色盲
        var redG = $(".chage .col-33.active").eq(1).text();  //红绿图
        var wa = $(".chage .col-33.active").eq(2).text();     //眼位
        var night = $(".chage .col-33.active").eq(3).text();  //夜视力
        data_array = [leftV, rightV, color, redG, night, wa];
        var val = $("#num").val();
        var texts = $("#sub").text();
        if (texts == "扫码提交") {
            clicked("submit.html", true, true);
        }
        else {
            var reg = /^[0-9A-Za-z\u4e00-\u9fa5]{10,30}$/;
            if (reg.test(val)) {
                Initialization("", val, "");
            }
            else {
              $.toast("格式不正确,请重新输入")
            }
        }


    }
}

// 扩展API加载完毕，现在可以正常调用扩展API
function onPlusReady() {  //虽然是空函数 但是别删

}

function subAjax(result) {  //ajax  保留
    alert(result);
    for (var i = 0; i < data_array.length; i++) {
        alert(data_array[i]);
    }
}

/*-----------------------------------------------------------------------------提交完成后的初始化-------------------------------------------------------------------*/

function Initialization(t, r, f) { //初始化

    color_array = ["s2.png", "s3.png", "s1.png"];//色盲图数组
    rg_array = ["r1.png", "r2.png", "r3.png", "r.png"]; //红绿图数组
    $("#visualAcuity  .degrees-table ul li").eq(0).addClass("active").siblings().removeClass("active");  //视力表初始化
    $("#nightAcuity  .degrees-table ul li").eq(0).addClass("active").siblings().removeClass("active");   //夜视力初始化

    //for (var i = 0; i < iv_array.length; i++) {
    //    $("#visualAcuity .ebox .main-content img").eq(i).attr("src", "img/" + iv_array[i]);
    //    $("#nightAcuity .ebox .main-content img").eq(i).attr("src", "img/" + iv_array[i]);
    //}
    //视力表 夜视力的e图片也要初始化
    $("#color_B img").attr("src", "img/active/s1.png");  //色盲图片初始化
    $("#red_green img").attr("src", "img/active/r1.png"); // 红绿随即图初始化
    $("#left li").removeClass("active");  //报告页面左边视力清空
    $("#right li").removeClass("active"); //报告页面右边边视力清空
    $(".changeBox .chage .trues").addClass("active");
    $(".changeBox .chage .falses").removeClass("active");
    $(".changeBox .chage .notm").removeClass("active");
    $(".trues img").attr("src", "img/yesa.png");
    $(".falses img").attr("src", "img/none.png");
    $(".notm img").attr("src", "img/notm.png");
    //$(".changeBox1 .chage .trues").addClass("active");
    //$(".changeBox1 .chage .falses").removeClass("active");

    var id = (r.match(/[\u4e00-\u9fa5]/g)).join(""); //姓名        
    var num = r.replace(/[^0-9]/ig, "");  //数字   
    var date = (num.substr(num.length - 9, 8)).toString();  //生日
    var bir = date.substr(0, 4) + '-' + date.substr(4, 2) + '-' + date.substr(6, 2);  //生日格式 1996-04-01
    var pid = num.substr(0, num.length - 9);  //编号
    var datas = [
				{ "姓名": id, "出生日期": bir, "左眼视力": data_array[0], "右眼视力": data_array[1], "夜视力": data_array[4], "色盲检查": data_array[2], "立体视": data_array[3], "眼位": data_array[5] }
    ]
   
    // socket.emit('delect file', { success:1 });  //删除文件
   
   
    setTimeout(function () {
        //$.router.loadPage("#visualAcuity");
        //  $.router.loadPage(route_arrayC[0]);
        $.toast("提交完毕,准备回到首页");
        $("#num").val("");
        $("#sub").text("扫码提交");
        $.router.loadPage("#" + route_array1[0]);
        // route_array1 =[]; /
    }, 1000);
    socket.emit('wenben', { data: datas }); //发送数据给总端
}

function prohibitClick() {
    $(document).off('click', '#color_B');
    $(document).off('click', '#red_green');
    $(document).off('click', '.Tdegrees-table ul li');
    $(document).off('click', '.trues');
    $(document).off('click', '.notm');
    $(document).off('click', '.degrees-table ul li');
}



