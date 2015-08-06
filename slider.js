/**
 * @slider widget 
 * @author: James
 * @usage:
 *   create:
 *     $(".slider-box").slider(configObj);
 *   method:
 *     destory()
 *     stop()
 *     play()
 */
(function ($, window){ 
	$.fn.slider = function (customConf){ 
		var defaultConf = { 
			width : 400, //数字，轮播组件宽度
			loopTime : 5000, //数字，循环时间
			transTime : 300, //数字，动画过渡时间，默认300毫秒
			autoPrevNext : true, //布尔值，鼠标悬停时自动显示prev和next
			showPoint : true, //布尔值，是否显示序列点
			pointClick : true,//布尔值，序列点是否可点击
			loopCallBack : null, //函数，每次循环完成的回调，提供当前index参数，this指向为轮播组件本身（_oself）
			description : null  //数组，每张图片的底部描述，个数和位置必须和每个轮播元素相对应，可以为纯文本或html
		};
		var browser, //浏览器类型
			_oself = this; //轮播组件jQuery对象(最外层容器节点)
        this.config = $.extend(defaultConf, customConf); //配置合并
        var _init = function (){ 
        	_browserCheck();
        	_initDom(); //初始化dom
        	_initStyle(); //加载样式
        	_slideLoopControl(2); //循环控制，默认显示第二项（第一项是过渡用的克隆项）
        	_createPrevNext(); //生成左右按钮
        	_createPoint(); //生成序列点
        	_createDescription(); //生成对应描述
        }
        var _browserCheck = function (){ 
			var tem,
				N = navigator.appName,
				ua = navigator.userAgent;
			var coreMap = { 
				Chrome : {engine : "-webkit",transEnd : "webkitTransitionEnd"},
				Safari : {engine : "-webkit",transEnd : "webkitTransitionEnd"},
				Opera : {engine : "-webkit",transEnd : "webkitTransitionEnd"},
				Firefox : {engine : "-moz",transEnd : "mozTransitionEnd"},
				MSIE : {engine : "-ms",transEnd : "msTransitionEnd"}
			};
			var M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
			if (M && (tem = ua.match(/version\/([\.\d]+)/i)) != null) M[2] = tem[1];
			M = M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];
			M = M[0];
			browser = coreMap[M];
        }
        var _initDom = function (){ 
        	_oself.slideWrapper = _oself.children(); //内层包裹
			_oself.originItems = _oself.slideWrapper.children(); //初始轮播项
			_oself.originLength = _oself.originItems.length; //初始轮播项个数
			//克隆过渡元素（把最前那个复制一个到最后，把最后那个复制一个到最前）
			var firstCloneItem = _oself.originItems[0],
				lastCloneItem = _oself.originItems[_oself.originLength - 1];
			$(lastCloneItem).clone(false).prependTo(_oself.slideWrapper).addClass(".slider-item-clone");
			$(firstCloneItem).clone(false).appendTo(_oself.slideWrapper).addClass(".slider-item-clone");
			_oself.slideItems = _oself.slideWrapper.children(); //添加克隆后的轮播项
			_oself.itemsLength = _oself.slideItems.length; //轮播项个数
			//克隆完成后，把默认显示的换成第二项
			_oself.slideWrapper.css("left", "-" + _oself.config.width * 1 + "px");
			//添加过渡样式
			_oself.transition = browser.engine + "-transition";
			setTimeout(function (){
				_oself.slideWrapper.css(_oself.transition, "left " + _oself.config.transTime / 1000 + "s ease");
			}, 0);
			//绑定过渡动画完成事件
			_oself.slideWrapper.on(browser ? browser.transEnd : "transitionEnd", _indexCheck);
        }
		var _initStyle = function (){ 
			var width = _oself.config.width;
			_oself.css("max-width", width);
			_oself.slideWrapper.css("width" , width * _oself.itemsLength);
			_oself.slideItems.css({"position" : "relative","float" : "left","width" : width});
		}
        var _createPrevNext = function (){ 
        	var topVal = (_oself.height() - 64) / 2; //64为prev和next图片的高度，若图片变化要修改该数值
        	var prevBtn = $("<div class='slider-prev slider-control' style='top: " + topVal + "px'><img src='prev.png' class='slider-hidePrevNext'></div>");
        	prevBtn.appendTo(_oself).on("click", function (e){ 
        		e.preventDefault();
        		e.stopPropagation();
        		_oself.nextIndex = _oself.prevIndex; //将上一个index作为要滚动到的index
            	_startLoop();
            	return false;
        	});
        	var nextBtn = $("<div class='slider-next slider-control' style='top: " + topVal + "px'><img src='next.png' class='slider-hidePrevNext'></div>");
        	nextBtn.appendTo(_oself).on("click", function (e){ 
        		e.preventDefault();
        		e.stopPropagation();
        		_startLoop();
        		return false;
        	});
        	if (_oself.config.autoPrevNext){ //鼠标指上自动显示
        		$(".slider-control").on("mouseover mouseout", function (e){ 
					$(this).find("img").toggleClass("slider-hidePrevNext");
	        	});
	        } else { //一直显示
	        	$(".slider-control").find("img").css("visibility", "visible");
	        }
        }
        var _createPoint = function (){ 
        	if (_oself.config.showPoint){ //是否显示
        		var pointBox = $("<div class='slider-point-box'></div>");
        		_oself.append(pointBox);
        		for (var i = 0;i < _oself.itemsLength;i ++){ 
        			var pointHide = "";
        			if (i == 0 || i == _oself.itemsLength - 1){  //隐藏克隆项的点
        				pointHide = "slider-point-hide";
        			}
        			pointBox.append($("<span class='slider-point " + pointHide + "' data-index='" + i + "'></span>"));
        		}
        		_oself.config.pointClick && $(".slider-point").not('.slider-point-hide')
        		.css("cursor", "pointer")
        		.on("click", function (){ 
        			_oself.nextIndex = $(this).attr("data-index");
        			_startLoop();
        		});
        		$(".slider-point:nth-child(2)").addClass("slider-point-active");
        	}
        }
        var _createDescription = function (){ 
        	var descrArr = _oself.config.description,
        		descrLength = descrArr.length;
        	if (descrLength > 0){ 
        		descrArr.unshift(descrArr[descrLength - 1]); //克隆元素的描述
        		descrArr.push(descrArr[1]);
	        	for (var i = 0;i < _oself.itemsLength;i ++){ 
	        		var descHtml = $("<span class='slider-description'>" + descrArr[i] + "</span>");
	        		_oself.slideWrapper.children(":eq(" + i + ")").append(descHtml);
	        	}
        	}
        }
        var _slideLoopControl = function (index){ 
        	_oself.nextIndex = index;
        	_oself.prevIndex = 0;
        	_oself.loop = setInterval(function (){ 
        		_startLoop();
        	}, _oself.config.loopTime);
        }
        var _startLoop = function (){ 
        	_oself.slideWrapper.css("left", "-" + _oself.config.width * _oself.nextIndex + "px");
    	 	_oself.config.loopCallBack && _oself.config.loopCallBack.call(_oself, _oself.nextIndex);
        }
        var _indexCheck = function (e){ 
			//1.检测当前位置是否是过渡用的克隆元素，如果是，就悄悄地换到对应的非克隆元素位置
    	 	if (_oself.nextIndex == 0){ //如果当前显示的是最前那个克隆元素
	 			//去掉过渡效果，悄悄换到原始轮播项的最后一个元素（也就是现在轮播项数量减2位置，倒数第二位）
	 			_oself.nextIndex = _oself.itemsLength - 2;
	 			_changeIndexWithoutTransition(_oself.nextIndex);
    	 	}
    	 	if (_oself.nextIndex == _oself.itemsLength - 1){ //如果当前显示的是最后那个克隆元素
	 			//去掉过渡效果，悄悄换到原始轮播项的最前一个元素（也就是现在轮播项的1位置，正数第二位）
	 			_oself.nextIndex = 1;
	 			_changeIndexWithoutTransition(_oself.nextIndex);
    	 	}
    	 	//2.改变序列点状态
    	 	$(".slider-point-active").removeClass("slider-point-active");
    	 	$(".slider-point:eq(" + _oself.nextIndex + ")").addClass("slider-point-active");
    	 	//3.以当前位置为基准，获取到pre和next的index
    	 	_oself.prevIndex = _oself.nextIndex - 1;
    	 	if (_oself.prevIndex == -1) _oself.prevIndex = _oself.itemsLength - 1; //如果为-1，说明上一个index为最后一个
    		_oself.nextIndex ++;
    		if (_oself.nextIndex == _oself.itemsLength) _oself.nextIndex = 0; //如果为最后一个+1，说明下一个为第一个
        }
        var _changeIndexWithoutTransition = function (newIndex){ //悄悄改变位置，换掉过渡用的克隆元素
			_oself.slideWrapper.css(_oself.transition, "left 0s ease");
			_oself.slideWrapper.css("left", "-" + _oself.config.width * newIndex + "px");
			setTimeout(function (){ 
				_oself.slideWrapper.css(_oself.transition, "left " + _oself.config.transTime / 1000 + "s ease");
			}, 0);
        }
        this.destory = function (){ //销毁组件方法
        	_oself.remove();
        }
        this.stop = function (){ //暂停方法
        	window.clearInterval(_oself.loop);
        }
        this.play = function (index){ //继续播放方法（没传index就默认为上次暂停的地方）
        	_slideLoopControl(index || _oself.index);
        }
        //启动组件
        _init();
        //链式调用
        return this;
	}
})(jQuery, window);