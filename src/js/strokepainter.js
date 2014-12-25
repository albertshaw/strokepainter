if (typeof jQuery === 'undefined') {
  throw new Error('StrokePainter requires jQuery');
}
if (typeof Raphael === 'undefined') {
  throw new Error('StrokePainter requires Raphael');
}

/*
 * Core
 */
(function($, R, win) {

  var StrokePainter = function(selector, options) {
    return new StrokePainter.fn.init(selector, options);
  }

  $.extend(StrokePainter, {
    opts : {
      width : 1024,
      height : 768
    },
    tools : {},
    addTool : function(name, fn) {
      this.tools[name] = fn;
    }
  });

  StrokePainter.fn = StrokePainter.prototype = {
    constructor : StrokePainter,
    init : function(selector, options) {
      var me = this;
      if (me.context || !selector) {
        return me;
      }
      me.context = $('#' + selector);
      me.context.empty();
      me.opts = $.extend(StrokePainter.opts, options);
      me.paper = R(selector, me.opts.width, me.opts.height);
      me.canvas = $(me.paper.canvas);
      me.panel = $(me.opts.panel.html()).appendTo(me.context);
      if (me.opts.tools && me.opts.tools.length > 0) {
        $.each(me.opts.tools, function(idx, name) {
          me.register(name, StrokePainter.tools[name]);
          if (!me.activatedTool) {
            me.active(name);
          }
        });
      } else {
        $.each(StrokePainter.tools, function(name, tool) {
          me.register(name, tool);
          if (!me.activatedTool) {
            me.active(name);
          }
        });
      }
      me.canvas.on('click', function() {
        if (me.activatedTool && me.activatedTool.click) {
          me.activatedTool.click.apply(me.activatedTool, arguments);
        }
      }).on('mousedown', function() {
        if (me.activatedTool && me.activatedTool.mousedown) {
          me.activatedTool.mousedown.apply(me.activatedTool, arguments);
        }
      }).on('mouseup', function() {
        if (me.activatedTool && me.activatedTool.mouseup) {
          me.activatedTool.mouseup.apply(me.activatedTool, arguments);
        }
      }).on('dbclick', function() {
        if (me.activatedTool && me.activatedTool.dbclick) {
          me.activatedTool.dbclick.apply(me.activatedTool, arguments);
        }
      })
      return this;
    }
  }

  StrokePainter.fn.init.prototype = StrokePainter.fn;

  $.extend(StrokePainter.fn, {
    tools : {},
    register : function(name, tool) {
      if ($.isFunction(tool)) {
        this.tools[name] = tool(this);
      } else {
        console.warn('Tool: ' + name + ' not found!');
      }
    },
    active : function(name) {
      if (this.activatedTool && name === this.activatedTool.name) {
        return;
      }
      this.deactive();
      this.activatedTool = this.tools[name];
      if (this.activatedTool && $.isFunction(this.activatedTool.activated)) {
        this.activatedTool.activated();
      }
    },
    deactive : function(name) {
      if (this.activatedTool && $.isFunction(this.activatedTool.deactivated)) {
        this.activatedTool.deactivated();
      }
      this.activatedTool = "";
    }
  });

  win.SP = win.StrokePainter = StrokePainter;
})(jQuery, Raphael, window);

/*
 * Brush
 */
(function($, SP) {
  var Brush = function(painter) {
    return new Brush.fn.init(painter);
  }
  Brush.fn = Brush.prototype = {
    constructor : Brush,
    name : 'brush',
    init : function(painter) {
      var me = this;
      me.painter = painter;
      me.icon = $('<a class="sp-panel-icon" href="javascript:;"><svg class="icon-pencil"><use xlink:href="#icon-pencil"></use></svg></a>');
      painter.panel.find('.sp-panel-content').append(me.icon);
      me.icon.on('click', function() {
        if (me.icon.is('.active')) {
          me.painter.deactive('brush');
        } else {
          me.painter.active('brush');
        }
      });
    }
  }

  Brush.fn.init.prototype = Brush.fn;

  $.extend(Brush.fn, {
    activated : function() {
      this.icon.addClass('active');
    },
    deactivated : function() {
      this.painter.canvas.off('.strokepainter.brush');
      this.icon.removeClass('active');
    },
    mousedown : function(event) {
      if (this.painting) {
        return;
      }
      var me = this;
      this.painting = true;
      var pathArr = [ 'M', event.offsetX, event.offsetY ], path;
      this.painter.canvas.on('mousemove.strokepainter.brush', function(evt) {
        pathArr.push('L');
        // FIXME firefox does NOT support offsetX offsetY
        pathArr.push(evt.offsetX);
        pathArr.push(evt.offsetY);
        if (!path) {
          // TODO customize path and stroke with
          path = me.painter.paper.path().attr({
            stroke : '#000',
            'stroke-width' : 2,
            path : pathArr
          });
        }
        path.attr({
          path : pathArr
        })
      })
    },
    mouseup : function(event) {
      if (!this.painting) {
        return;
      }
      this.painting = false;
      this.painter.canvas.off('mousemove.strokepainter.brush');
    }
  });

  SP.addTool('brush', Brush);
})(jQuery, StrokePainter);
/*
 * Chooser
 */
(function($, SP) {
  var Chooser = function(painter) {

  }
  SP.addTool('chooser', Chooser);
})(jQuery, StrokePainter);
/*
 * Preview
 */
(function($, SP) {
  var Preview = function(painter) {
    return new Preview.fn.init(painter);
  }
  Preview.fn = Preview.prototype = {
    constructor : Preview,
    name : 'preview',
    init : function(painter) {
      var me = this;
      me.painter = painter;
      me.icon = $('<a class="sp-panel-icon" href="javascript:;"><svg class="icon-eye"><use xlink:href="#icon-eye"></use></svg></a>');
      painter.panel.find('.sp-panel-content').append(me.icon);
      me.icon
          .click(function() {
            console.log(me.painter.canvas[0].outerHTML);
            me.painter.active('preview');
            var paths = me.painter.canvas.find('path');
            paths
                .each(function() {
                  var length = this.getTotalLength();
                  this.style.transition = this.style.WebkitTransition = 'none';
                  this.style.strokeDasharray = length + ' ' + length;
                  this.style.strokeDashoffset = length;
                  this.getBoundingClientRect();
                  // TODO customize transition
                  this.style.transition = this.style.WebkitTransition = 'stroke-dashoffset 2s ease-in-out';
                  this.style.strokeDashoffset = '0';
                });
            me.painter.deactive('preview');
          });
    }
  }

  Preview.fn.init.prototype = Preview.fn;

  $.extend(Preview.fn, {
    activated : function() {
      this.icon.addClass('active');
    },
    deactivated : function() {
      this.icon.removeClass('active');
    }
  });
  SP.addTool('preview', Preview);
})(jQuery, StrokePainter);
