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
    },
    getMouseOffsetPosition : function(evt) {
      var cnvsOffset = this.canvas.offset();
      return {
        left : evt.pageX - cnvsOffset.left,
        top : evt.pageY - cnvsOffset.top
      }
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

  $
      .extend(Brush.fn,
          {
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
              this.painting = true;
              var me = this, offsetP = this.painter
                  .getMouseOffsetPosition(event), pathArr = [ 'M',
                  offsetP.left, offsetP.top ], path;
              this.painter.canvas.on('mousemove.strokepainter.brush', function(
                  evt) {
                var offsetXY = me.painter.getMouseOffsetPosition(evt);
                pathArr.push('L');
                pathArr.push(offsetXY.left);
                pathArr.push(offsetXY.top);
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
    return new Chooser.fn.init(painter);
  }
  Chooser.fn = Chooser.prototype = {
    constructor : Chooser,
    name : 'chooser',
    init : function(painter) {
      var me = this;
      me.painter = painter;
      me.icon = $('<a class="sp-panel-icon" href="javascript:;"><svg class="icon-target"><use xlink:href="#icon-target"></use></svg></a>');
      painter.panel.find('.sp-panel-content').append(me.icon);
      me.icon.click(function() {
        if (me.icon.is('.active')) {
          me.painter.deactive('chooser');
        } else {
          me.painter.active('chooser');
        }
      });
    }
  }
  Chooser.fn.init.prototype = Chooser.fn;
  var subpanel = '<a class="sp-panel-icon" href="javascript:;"><svg class="icon-statistics"><use xlink:href="#icon-statistics"></use></svg></a>';
  $.extend(Chooser.fn, {
    subpanel : subpanel,
    compress : function() {
      if (!this.selected)
        return;
      var pathStr = this.selected.node.getAttribute('d');
      if (!pathStr)
        return;
      console.log(pathStr);
      var pathArr = pathStr.split(/\D+/).slice(1);
      console.log(pathArr);
      var points = [];
      for (var i = 0, idx = 0; i < pathArr.length;) {
        points.push({
          x : pathArr[i++],
          y : pathArr[i++],
          i : idx++
        })
      }
      this.dp(points[0], points[points.length - 1], points);

    },
    dp : function(from, to, points) {
      var A = (from.y - to.y)
          / Math.sqrt(Math.pow((from.y - to.y), 2)
              + Math.pow((from.x - to.x), 2));
      var B = (to.x - from.x)
          / Math.sqrt(Math.pow((from.y - to.y), 2)
              + Math.pow((from.x - to.x), 2));

      var C = (from.x * to.y - to.x * from.y)
          / Math.sqrt(Math.pow((from.y - to.y), 2)
              + Math.pow((from.x - to.x), 2));

      var m = from.i;
      var n = to.i;
      if (n == m + 1) {
        return;
      }

      var middle = {};
      var dmax = 0, maxPoint = {};
      var distance = 0;
      for (var i = m + 1; i < n; i++) {
        distance = Math.abs(A * (points[i].x) + B * (points[i].y) + C)
            / Math.sqrt(Math.pow(A, 2) + Math.pow(B, 2));
        if (dmax < distance) {
          dmax = distance;
          maxPoint = points[i];
        }
      }
      if (dmax <= 5) {
        for (var i = m + 1; i < n; i++) {
          points[i].remove = true;
        }
      } else {
        for (var i = m + 1; i < n; i++) {
          if ((Math.abs(A * (points[i].x) + B * (points[i].y) + C)
              / Math.sqrt(Math.pow(A, 2) + Math.pow(B, 2)) == dmax)) {
            middle = points[i];
          }
        }
        dp(from, middle, points);
        dp(middle, to, points);
      }
    },
    activated : function() {
      var me = this;
      me.painter.canvas.on('mouseover.strokepainter.chooser', 'path',
          function() {
            if (me.selected && me.selected.node == this)
              return false;
            var path = new Raphael.el.constructor(this, me.painter.paper);
            path.type = 'path';
            me.hovered = path;
            me.highlight(path);
          }).on('mouseleave.strokepainter.chooser', 'path', function() {
        me.resume(me.hovered);
        me.hovered = null;
      });
      me.painter.panel.find('.sp-subpanel').on('click', '.sp-panel-icon svg',
          function() {
            var $this = $(this);
            if ($this.is('.icon-statistics')) {
              me.compress();
            }
          }).html(me.subpanel).removeClass('hidden').slideDown();
      me.icon.addClass('active');
    },
    deactivated : function() {
      this.painter.canvas.off('.strokepainter.chooser');
      this.painter.panel.find('.sp-subpanel').slideUp();
      this.resume(this.hovered);
      this.resume(this.selected);
      this.icon.removeClass('active');
    },
    click : function() {
      if (this.hovered) {
        this.resume(this.selected);
        this.selected = this.hovered;
        this.hovered = null;
      }
    },
    highlight : function(el) {
      if (!el)
        return;
      el.attr({
        'stroke-width' : 6
      });
    },
    resume : function(el) {
      if (!el)
        return;
      el.attr({
        'stroke-width' : 2
      });
    }
  });
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
