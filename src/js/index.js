/*
 * Drag and Drop
 */
(function($) {
  function DragDrop() {
    this.opts = {
      eventsuffix : '.dragdrop',
      anchor : '',
      bound : 'window',
      dragstart : $.noop,
      dragend : $.noop,
      dragmove : $.noop
    };
  }

  function getPosition(evt) {
    var posX = 0;
    var posY = 0;
    if (evt.pageX || evt.pageY) {
      posX = evt.pageX;
      posY = evt.pageY;
    } else if (evt.clientX || evt.clientY) {
      posX = evt.clientX + document.body.scrollLeft
          + document.documentElement.scrollLeft;
      posY = evt.clientY + document.body.scrollTop
          + document.documentElement.scrollTop;
    }
    return {
      x : posX,
      y : posY
    };
  }

  function stopEvent(evt) {
    if (evt.preventDefault) {
      evt.preventDefault();
    }
    if (evt.stopPropagation) {
      evt.stopPropagation();
    }
    evt.returnValue = false;
    return false;
  }

  DragDrop.prototype = {
    constructor : DragDrop,
    init : function(domElem, opts) {
      var me = this;
      $.extend(me.opts, opts);
      me.$select = $(domElem);
      if (me.opts.anchor) {
        me.$anchor = me.$select.find(me.opts.anchor);
        if (!me.$anchor.length) {
          me.$anchor = $(me.opts.anchor);
        }
      }
      if (!me.$anchor || !me.$anchor.length) {
        me.$anchor = me.$select;
      }
      me.$anchor.on('mousedown' + me.opts.eventsuffix, function(e) {
        stopEvent(e);
        if (me.$select.is('.dragging')) {
          return false;
        }
        me.$select.addClass('dragging');
        me.setMouseOffset(getPosition(e));
        me.opts.dragstart.call(me.$select, e);
        $(document).on('mousemove' + me.opts.eventsuffix, function(evt) {
          stopEvent(evt);
          me.moveTo(getPosition(evt));
        }).on('mouseup' + me.opts.eventsuffix, function(evt) {
          stopEvent(evt);
          me.$select.removeClass('dragging');
          $(document).off(me.opts.eventsuffix);
          me.opts.dragend.call(me.$select, evt);
        });
      });
      return this;
    },
    setMouseOffset : function(pos) {
      var offset = this.$select.offset();
      this.mouseOffset = {
        top : pos.y - offset.top,
        left : pos.x - offset.left
      };
    },
    moveTo : function(dest) {
      var me = this, newoffset = {}, bound = me.getBound();
      if (dest.y > bound.y.max) {
        dest.y = bound.y.max - 1;
      }
      if (dest.y < bound.y.min) {
        dest.y = bound.y.min + 1;
      }
      if (dest.x > bound.x.max) {
        dest.x = bound.x.max - 1;
      }
      if (dest.x < bound.x.min) {
        dest.x = bound.x.min + 1;
      }

      newoffset.top = dest.y - me.mouseOffset.top;
      newoffset.left = dest.x - me.mouseOffset.left;

      setTimeout(function() {
        me.$select.offset(newoffset).css({
          'right' : 'initial',
          'bottom' : 'initial'
        });
        me.opts.dragmove.call(me.$select, newoffset);
      }, 10);
    },
    getBound : function() {
      var bound = this.opts.bound;
      if (typeof bound === 'string') {
        var $bound = $(bound === 'window' ? window : bound), boundOffset = $bound
            .offset(), left = boundOffset ? boundOffset.left : 0, top = boundOffset ? boundOffset.top
            : 0;
        bound = {
          x : {
            min : left,
            max : left + $bound.width()
          },
          y : {
            min : top,
            max : top + $bound.height()
          }
        };
      }
      return bound;
    },
    destroy : function() {
      var me = this;
      me.$anchor.off(me.opts.eventsuffix);
      $(document).off(me.opts.eventsuffix);
      me.$select.removeData('dragdrop');
    }
  };
  $.fn.dragdrop = function() {
    var select = this, args = arguments;
    if (args.length === 0 || select.data('dragdrop')) {
      return select.data('dragdrop');
    } else if (args.length === 1) {
      return select.each(function() {
        $.data(this, 'dragdrop', new DragDrop().init(this, args[0]));
      });
    }
  };

})(jQuery);

(function() {

  var sp = SP('mycanvas', {
    width : 1280,
    height : 800,
    panel : $('#panel-tpl'),
    tools : [ 'brush', 'chooser', 'preview' ]
  });
  var spPanel = $('#mycanvas .sp-panel');
  spPanel.dragdrop({
    bound : '#mycanvas',
    anchor : '.sp-panel-header'
  });
  spPanel.find('.sp-panel-header .sp-panel-icon').on('click', function(evt) {
    evt.stopImmediatePropagation();
    var $this = $(this);
    if ($this.is('.active')) {
      spPanel.find('.sp-panel-content').slideUp();
      $this.removeClass('active');
    } else {
      spPanel.find('.sp-panel-content').slideDown();
      $this.addClass('active');
    }
  })

  window.sp = sp;// debug

  var fileChooser = document.getElementById('filechooser');
  fileChooser.onchange = function(evt) {
    sp.paper.clear();
    var reader = new FileReader();
    reader.onload = function(e) {
      var dimension = getImgDimension(new DataView(this.result));
      sp.paper.setSize(dimension.width, dimension.height);
      sp.paper.setViewBox(0, 0, dimension.width, dimension.height);
      var r = new FileReader();
      r.readAsDataURL(evt.target.files[0]);
      r.onload = function() {
        sp.paper.image(this.result, 0, 0, dimension.width, dimension.height);
      };
    };
    reader.readAsArrayBuffer(evt.target.files[0]);
  }

  function getImgDimension(dataView) {
    if ((dataView.getUint8(0) != 0xFF) || (dataView.getUint8(1) != 0xD8)) {
      return false; // SOI标记位不对，不是jpg图片
    }

    var offset = 2, length = dataView.byteLength, marker;
    while (offset < length) {
      if (dataView.getUint8(offset) != 0xFF) {
        return false; // 不是图片标记位
      }

      marker = dataView.getUint8(offset + 1);
      if (marker == 0xC0) {
        // 标记位位0xC0表示图片帧SOF开始
        return {
          height : dataView.getUint16(offset + 5),
          width : dataView.getUint16(offset + 7)
        };
      } else {
        // 非图片帧则跳过该段
        offset += 2 + dataView.getUint16(offset + 2);
      }

    }
  }
})();
