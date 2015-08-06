/**
 * @ a slider widget depends on jQuery/Zepto
 * @ author: James
 * @ usage:
 	 dom:
 	 	<div id="mySlider" class="slider-box"> <!-- container -->
		    <div class="slider-wrapper"> <!-- wrapper -->
			    <div class="slider-item"> <!-- slider item-->
				    <img src="1.png" alt=""/>
			    </div>
				......
		    </div>
	     </div>
 *   create:
 *       $(".slider-box").slider(configObject);
 *   method:
 *       destory()
 *       stop()
 *       play()
 */
(function ($, window){ 
	$.fn.slider = function (customConf){ 
		var defaultConf = { 
			width : 400, //int, widget width
			loopTime : 5000, //int, slider loop time
			transTime : 300, //int, slider transition time
			autoPrevNext : true, //boolean, whether show previous & next button only when mouse over
			showPoint : true, //boolean, whether show index point of each slider item
			pointClick : true,//boolean, the index points can be click or not
			loopCallBack : null, //function, if this method is provided, it will be called after each time the slide finish
			description : null  //array, the descriptions of slider items, pay attention to the index
		};
		var browser,
			_oself = this;
        this.config = $.extend(defaultConf, customConf);
        var _init = function (){ 
        	_browserCheck();
        	_initDom();
        	_initStyle();
        	_slideLoopControl(2);
        	_createPrevNext();
        	_createPoint();
        	_createDescription();
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
        	_oself.slideWrapper = _oself.children();
			_oself.originItems = _oself.slideWrapper.children();
			_oself.originLength = _oself.originItems.length;
			var firstCloneItem = _oself.originItems[0],
				lastCloneItem = _oself.originItems[_oself.originLength - 1];
			$(lastCloneItem).clone(false).prependTo(_oself.slideWrapper).addClass(".slider-item-clone");
			$(firstCloneItem).clone(false).appendTo(_oself.slideWrapper).addClass(".slider-item-clone");
			_oself.slideItems = _oself.slideWrapper.children();
			_oself.itemsLength = _oself.slideItems.length;
			_oself.slideWrapper.css("left", "-" + _oself.config.width * 1 + "px");
			_oself.transition = browser.engine + "-transition";
			setTimeout(function (){
				_oself.slideWrapper.css(_oself.transition, "left " + _oself.config.transTime / 1000 + "s ease");
			}, 0);
			_oself.slideWrapper.on(browser ? browser.transEnd : "transitionEnd", _indexCheck);
        }
		var _initStyle = function (){ 
			var width = _oself.config.width;
			_oself.css("max-width", width);
			_oself.slideWrapper.css("width" , width * _oself.itemsLength);
			_oself.slideItems.css({"position" : "relative","float" : "left","width" : width});
		}
        var _createPrevNext = function (){ 
        	var topVal = (_oself.height() - 64) / 2; //if you change the previous or next button's picture, this value must be recalculated
        	var prevBtn = $("<div class='slider-prev slider-control' style='top: " + topVal + "px'><img src='prev.png' class='slider-hidePrevNext'></div>");
        	prevBtn.appendTo(_oself).on("click", function (e){ 
        		e.preventDefault();
        		e.stopPropagation();
        		_oself.nextIndex = _oself.prevIndex;
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
        	if (_oself.config.autoPrevNext){
        		$(".slider-control").on("mouseover mouseout", function (e){ 
					$(this).find("img").toggleClass("slider-hidePrevNext");
	        	});
	        } else {
	        	$(".slider-control").find("img").css("visibility", "visible");
	        }
        }
        var _createPoint = function (){ 
        	if (_oself.config.showPoint){
        		var pointBox = $("<div class='slider-point-box'></div>");
        		_oself.append(pointBox);
        		for (var i = 0;i < _oself.itemsLength;i ++){ 
        			var pointHide = "";
        			if (i == 0 || i == _oself.itemsLength - 1){
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
        		descrArr.unshift(descrArr[descrLength - 1]);
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
    	 	if (_oself.nextIndex == 0){
	 			_oself.nextIndex = _oself.itemsLength - 2;
	 			_changeIndexWithoutTransition(_oself.nextIndex);
    	 	}
    	 	if (_oself.nextIndex == _oself.itemsLength - 1){
	 			_oself.nextIndex = 1;
	 			_changeIndexWithoutTransition(_oself.nextIndex);
    	 	}
    	 	$(".slider-point-active").removeClass("slider-point-active");
    	 	$(".slider-point:eq(" + _oself.nextIndex + ")").addClass("slider-point-active");
    	 	_oself.prevIndex = _oself.nextIndex - 1;
    	 	if (_oself.prevIndex == -1) _oself.prevIndex = _oself.itemsLength - 1;
    		_oself.nextIndex ++;
    		if (_oself.nextIndex == _oself.itemsLength) _oself.nextIndex = 0;
        }
        var _changeIndexWithoutTransition = function (newIndex){
			_oself.slideWrapper.css(_oself.transition, "left 0s ease");
			_oself.slideWrapper.css("left", "-" + _oself.config.width * newIndex + "px");
			setTimeout(function (){ 
				_oself.slideWrapper.css(_oself.transition, "left " + _oself.config.transTime / 1000 + "s ease");
			}, 0);
        }
        this.destory = function (){
        	_oself.remove();
        }
        this.stop = function (){
        	window.clearInterval(_oself.loop);
        }
        this.play = function (index){
        	_slideLoopControl(index || _oself.index);
        }
        _init();
        return this;
	}
})(jQuery, window);