!function(t){function e(){this.opts={eventsuffix:".dragdrop",anchor:"",bound:"window",dragstart:t.noop,dragend:t.noop,dragmove:t.noop}}function n(t){var e=0,n=0;return t.pageX||t.pageY?(e=t.pageX,n=t.pageY):(t.clientX||t.clientY)&&(e=t.clientX+document.body.scrollLeft+document.documentElement.scrollLeft,n=t.clientY+document.body.scrollTop+document.documentElement.scrollTop),{x:e,y:n}}function o(t){return t.preventDefault&&t.preventDefault(),t.stopPropagation&&t.stopPropagation(),t.returnValue=!1,!1}e.prototype={constructor:e,init:function(e,a){var i=this;return t.extend(i.opts,a),i.$select=t(e),i.opts.anchor&&(i.$anchor=i.$select.find(i.opts.anchor),i.$anchor.length||(i.$anchor=t(i.opts.anchor))),i.$anchor&&i.$anchor.length||(i.$anchor=i.$select),i.$anchor.on("mousedown"+i.opts.eventsuffix,function(e){return o(e),i.$select.is(".dragging")?!1:(i.$select.addClass("dragging"),i.setMouseOffset(n(e)),i.opts.dragstart.call(i.$select,e),void t(document).on("mousemove"+i.opts.eventsuffix,function(t){o(t),i.moveTo(n(t))}).on("mouseup"+i.opts.eventsuffix,function(e){o(e),i.$select.removeClass("dragging"),t(document).off(i.opts.eventsuffix),i.opts.dragend.call(i.$select,e)}))}),this},setMouseOffset:function(t){var e=this.$select.offset();this.mouseOffset={top:t.y-e.top,left:t.x-e.left}},moveTo:function(t){var e=this,n={},o=e.getBound();t.y>o.y.max&&(t.y=o.y.max-1),t.y<o.y.min&&(t.y=o.y.min+1),t.x>o.x.max&&(t.x=o.x.max-1),t.x<o.x.min&&(t.x=o.x.min+1),n.top=t.y-e.mouseOffset.top,n.left=t.x-e.mouseOffset.left,setTimeout(function(){e.$select.offset(n).css({right:"initial",bottom:"initial"}),e.opts.dragmove.call(e.$select,n)},10)},getBound:function(){var e=this.opts.bound;if("string"==typeof e){var n=t("window"===e?window:e),o=n.offset(),a=o?o.left:0,i=o?o.top:0;e={x:{min:a,max:a+n.width()},y:{min:i,max:i+n.height()}}}return e},destroy:function(){var e=this;e.$anchor.off(e.opts.eventsuffix),t(document).off(e.opts.eventsuffix),e.$select.removeData("dragdrop")}},t.fn.dragdrop=function(){var n=this,o=arguments;return 0===o.length||n.data("dragdrop")?n.data("dragdrop"):1===o.length?n.each(function(){t.data(this,"dragdrop",(new e).init(this,o[0]))}):void 0}}(jQuery),function(){function t(t){if(255!=t.getUint8(0)||216!=t.getUint8(1))return!1;for(var e,n=2,o=t.byteLength;o>n;){if(255!=t.getUint8(n))return!1;if(e=t.getUint8(n+1),192==e)return{height:t.getUint16(n+5),width:t.getUint16(n+7)};n+=2+t.getUint16(n+2)}}var e=SP("mycanvas",{width:1280,height:800,panel:$("#panel-tpl"),tools:["brush","chooser","preview"]}),n=$("#mycanvas .sp-panel");n.dragdrop({bound:"#mycanvas",anchor:".sp-panel-header"}),n.find(".sp-panel-header .sp-panel-icon").on("click",function(t){t.stopImmediatePropagation();var e=$(this);e.is(".active")?(n.find(".sp-panel-content").slideUp(),e.removeClass("active")):(n.find(".sp-panel-content").slideDown(),e.addClass("active"))}),window.sp=e;var o=document.getElementById("filechooser");o.onchange=function(n){e.paper.clear();var o=new FileReader;o.onload=function(){var o=t(new DataView(this.result));e.paper.setSize(o.width,o.height),e.paper.setViewBox(0,0,o.width,o.height);var a=new FileReader;a.readAsDataURL(n.target.files[0]),a.onload=function(){e.paper.image(this.result,0,0,o.width,o.height)}},o.readAsArrayBuffer(n.target.files[0])}}();