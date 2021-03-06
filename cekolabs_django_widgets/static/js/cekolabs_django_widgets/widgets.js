// Generated by CoffeeScript 1.4.0
(function() {
  var $, AsyncPreviewRequestManager, MarkdownEditor, MarkdownPreview, MarkdownStringEditor, TagInput,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $ = jQuery;

  $.fn.extend({
    cekolabs_tagwidget: function(options) {
      var settings;
      settings = {
        tag_input_class: 'cl-tag-input',
        tag_list_class: 'cl-tag-list',
        tag_hidden_class: 'cl-tag-hidden'
      };
      settings = $.extend(settings, options);
      this.each(function(i, el) {
        var $el, $tag_hidden_element, $tag_input_element, $tag_list_element, taginput;
        $el = $(el);
        $tag_input_element = $el.find("." + settings.tag_input_class);
        $tag_list_element = $el.find("." + settings.tag_list_class);
        $tag_hidden_element = $el.find("." + settings.tag_hidden_class);
        return taginput = new TagInput($tag_input_element, $tag_list_element, $tag_hidden_element);
      });
      return this;
    },
    cekolabs_markdownwidget: function(options) {
      var settings;
      settings = {
        toolbar_class: 'cl-markdown-toolbar',
        editor_class: 'cl-markdown-editor'
      };
      settings = $.extend(settings, options);
      this.each(function(i, el) {
        var $editor_element, $el, $toolbar_element, taginput;
        $el = $(el);
        $toolbar_element = $el.find("." + settings.toolbar_class);
        $editor_element = $el.find("." + settings.editor_class);
        return taginput = new MarkdownEditor($toolbar_element, $editor_element);
      });
      return this;
    },
    cekolabs_markdownpreview: function(options) {
      var settings;
      settings = {
        preview_url: '/blog/parse-markdown',
        $markdown_el: $('#id_markdown')
      };
      settings = $.extend(settings, options);
      return this.each(function(i, el) {
        var markdown_preview;
        return markdown_preview = new MarkdownPreview($(el), settings.$markdown_el, settings.preview_url);
      });
    },
    insertAtCaret: function(myValue) {
      this.each(function(i, el) {
        var endPos, scrollTop, sel, startPos;
        if (document.selection) {
          this.focus();
          sel = document.selection.createRange();
          sel.text = myValue;
          return this.focus();
        } else if (this.selectionStart || this.selectionStart === 0) {
          startPos = this.selectionStart;
          endPos = this.selectionEnd;
          scrollTop = this.scrollTop;
          this.value = this.value.substring(0, startPos) + myValue + this.value.substring(endPos, this.value.length);
          this.focus();
          this.selectionStart = startPos + myValue.length;
          this.selectionEnd = startPos + myValue.length;
          return this.scrollTop = scrollTop;
        } else {
          this.value += myValue;
          return this.focus();
        }
      });
      return this;
    },
    getSelectedText: function() {
      var el, endPos, sel, selectedText, startPos;
      el = this[0];
      if (document.selection) {
        el.focus();
        sel = document.selection.createRange();
        selectedText = sel.text;
      } else {
        startPos = el.selectionStart;
        endPos = el.selectionEnd;
        selectedText = el.value.substring(startPos, endPos);
      }
      return selectedText;
    }
  });

  TagInput = (function() {

    function TagInput($input, $list, $hidden) {
      this.$input = $input;
      this.$list = $list;
      this.$hidden = $hidden;
      this._attach_behaviors();
    }

    TagInput.prototype._attach_behaviors = function() {
      var _this = this;
      this.$input.keydown(function(event) {
        if (event.which === 13) {
          event.stopPropagation();
          event.preventDefault();
          return _this.add_tag();
        }
      });
      return this.$list.find('.tag').click(function(event) {
        return _this.remove_tag($(event.target));
      });
    };

    TagInput.prototype.remove_tag = function($el) {
      var t, tag, tags;
      tag = $el.text();
      $el.remove();
      tags = this.$hidden.val().split(',');
      return this.$hidden.val(((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = tags.length; _i < _len; _i++) {
          t = tags[_i];
          if (t !== tag) {
            _results.push(t);
          }
        }
        return _results;
      })()).join(','));
    };

    TagInput.prototype.add_tag = function(tag) {
      var tags,
        _this = this;
      tag = $.trim(tag || this.$input.val()).replace(/,/g, " ");
      tags = this.$hidden.val().split(',');
      if (__indexOf.call(tags, tag) >= 0) {
        return;
      }
      this.$list.append("<div class='tag'>" + tag + "<div class='tag-close'></div></div>").click(function(event) {
        return _this.remove_tag($(event.target));
      });
      this.$input.val('');
      return this.$hidden.val(this.$hidden.val() + ("," + tag));
    };

    return TagInput;

  })();

  MarkdownStringEditor = (function() {

    function MarkdownStringEditor($editor) {
      this.$editor = $editor;
    }

    MarkdownStringEditor.prototype.add_linebreak = function() {
      var indent;
      this._extend_selection_through_whitespace();
      indent = this._get_line_indent() || '';
      return this.$editor.insertAtCaret("\n" + indent);
    };

    MarkdownStringEditor.prototype.eat_leading_whitespace = function(text) {
      var trim_pos, _ref;
      trim_pos = 0;
      while ((_ref = text[trim_pos]) === ' ' || _ref === '\t') {
        trim_pos++;
      }
      return text.substring(trim_pos);
    };

    MarkdownStringEditor.prototype.get_multiline_formatting = function(text, pattern_iterator) {
      var i, indent, line, lines, textbuffer, _i, _len;
      indent = this._get_line_indent();
      lines = text.split('\n');
      textbuffer = '';
      for (i = _i = 0, _len = lines.length; _i < _len; i = ++_i) {
        line = lines[i];
        textbuffer += pattern_iterator(line.replace(new RegExp("^" + indent), ''), indent || '', i);
      }
      return textbuffer;
    };

    MarkdownStringEditor.prototype._extend_selection_through_whitespace = function() {
      var caret_pos, cur, _ref;
      caret_pos = this.$editor[0].selectionEnd;
      cur = caret_pos;
      while ((_ref = this.$editor.val()[cur++]) === '\t' || _ref === ' ') {
        continue;
      }
      return this.$editor[0].selectionEnd = cur - 1;
    };

    MarkdownStringEditor.prototype._get_line_indent = function() {
      var caret_pos, charbuffer, cur, linebreaks, whitespace_idx, _ref;
      caret_pos = this.$editor[0].selectionStart;
      cur = caret_pos;
      if (this.$editor.val()[cur - 1] === '\n') {
        return '';
      }
      linebreaks = 0;
      while (cur >= 0) {
        if (this.$editor.val()[cur - 1] === '\n' || cur === 0) {
          whitespace_idx = cur;
          charbuffer = '';
          while ((_ref = this.$editor.val()[whitespace_idx]) === '\t' || _ref === ' ') {
            charbuffer += this.$editor.val()[whitespace_idx];
            whitespace_idx++;
          }
          return charbuffer;
        }
        cur--;
      }
    };

    return MarkdownStringEditor;

  })();

  MarkdownEditor = (function() {

    function MarkdownEditor($toolbar, $editor) {
      this.$toolbar = $toolbar;
      this.$editor = $editor;
      this._markup_handlers = __bind(this._markup_handlers, this);

      this.string_editor = new MarkdownStringEditor(this.$editor);
      this._attach_behaviors();
    }

    MarkdownEditor.prototype._attach_behaviors = function() {
      var _this = this;
      this.$toolbar.find('.markdown-button').click(function(event) {
        return _this._apply_markup($(event.target).attr('command'));
      });
      return this.$editor.keydown(function(event) {
        var shortcuts;
        shortcuts = {
          66: 'bold',
          73: 'italic'
        };
        if (event.ctrlKey && shortcuts[event.which] !== void 0) {
          _this._apply_markup(shortcuts[event.which]);
        }
        if (event.which === 9) {
          event.stopPropagation();
          event.preventDefault();
          if (event.shiftKey) {
            _this._apply_markup('untab');
          } else {
            _this._apply_markup('tab');
          }
        }
        if (event.which === 13) {
          event.stopPropagation();
          event.preventDefault();
          return _this.string_editor.add_linebreak();
        }
      });
    };

    MarkdownEditor.prototype._apply_markup = function(command) {
      var selected_text, transformed_text;
      selected_text = this.$editor.getSelectedText();
      transformed_text = this._markup_handlers()[command].call(this, selected_text);
      if (transformed_text !== null) {
        return this.$editor.insertAtCaret(transformed_text);
      }
    };

    MarkdownEditor.prototype._letters_before_selection = function() {
      var caret_pos, cur, _ref, _ref1;
      caret_pos = this.$editor[0].selectionStart;
      cur = caret_pos;
      while (--cur > 0) {
        if ((_ref = this.$editor.val()[cur]) === '\n' || _ref === '\r') {
          return false;
        } else if ((_ref1 = this.$editor.val()[cur]) === '\t' || _ref1 === ' ') {
          continue;
        } else {
          return true;
        }
      }
      return false;
    };

    MarkdownEditor.prototype._get_preamble = function(text) {
      if (this._letters_before_selection()) {
        return text;
      } else {
        return "";
      }
    };

    MarkdownEditor.prototype._markup_handlers = function() {
      return {
        tab: function(text) {
          var lines, tabbed, tmpselectionend, tmpselectionstart;
          if (this.$editor[0].selectionEnd - this.$editor[0].selectionStart <= 0) {
            return '\t';
          }
          lines = text.split('\n');
          tabbed = '\t' + lines.join('\n\t');
          tmpselectionstart = this.$editor[0].selectionStart + 1;
          tmpselectionend = this.$editor[0].selectionEnd;
          tmpselectionend += lines.length;
          this.$editor.insertAtCaret(tabbed);
          this.$editor[0].selectionStart = tmpselectionstart;
          this.$editor[0].selectionEnd = tmpselectionend;
          return null;
        },
        untab: function(text) {
          var cur, l, lengthbefore, lines, tabbed, tmpselectionend;
          cur = this.$editor[0].selectionStart;
          while (cur > 0 && this.$editor.val()[cur - 1] !== '\n') {
            cur--;
          }
          this.$editor[0].selectionStart = cur;
          text = this.$editor.getSelectedText();
          lines = text.split('\n');
          tmpselectionend = this.$editor[0].selectionEnd;
          tabbed = ((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = lines.length; _i < _len; _i++) {
              l = lines[_i];
              _results.push(l.replace(/^(\t)|^(\s{1,8})/, ''));
            }
            return _results;
          })()).join('\n');
          if (tabbed !== text) {
            lengthbefore = this.$editor.val().length;
            this.$editor.insertAtCaret(tabbed);
            this.$editor[0].selectionStart = cur;
            this.$editor[0].selectionEnd = tmpselectionend - (this.$editor.val().length - lengthbefore);
          }
          return null;
        },
        bold: function(text) {
          return "**" + text + "**";
        },
        italic: function(text) {
          return "_" + text + "_";
        },
        h1: function(text) {
          var lines,
            _this = this;
          lines = this.string_editor.get_multiline_formatting(text, function(line, indent, index) {
            var preamble, underline;
            line = _this.string_editor.eat_leading_whitespace(line);
            underline = Array(Math.min(21, line.length + 1)).join('=');
            preamble = _this._get_preamble('\n');
            return "" + preamble + (index > 0 || preamble === '\n' ? indent : '') + line + "\n" + indent + underline + "\n";
          });
          return lines;
        },
        h2: function(text) {
          var lines,
            _this = this;
          ({
            h1: function(text) {}
          });
          lines = this.string_editor.get_multiline_formatting(text, function(line, indent, index) {
            var preamble, underline;
            line = _this.string_editor.eat_leading_whitespace(line);
            underline = Array(Math.min(21, line.length + 1)).join('-');
            preamble = _this._get_preamble('\n');
            return "" + preamble + (index > 0 || preamble === '\n' ? indent : '') + line + "\n" + indent + underline + "\n";
          });
          return lines;
        },
        h3: function(text) {
          return "" + (this._get_preamble('\n')) + "###" + text + "\n";
        },
        quote: function(text) {
          var lines,
            _this = this;
          lines = this.string_editor.get_multiline_formatting(text, function(line, indent, index) {
            var preamble;
            preamble = index === 0 ? _this._get_preamble('\n') : '';
            return "" + preamble + (index > 0 || preamble === '\n' ? indent : '') + "> " + line + "\n";
          });
          return lines;
        },
        unordered_list: function(text) {
          var lines,
            _this = this;
          lines = this.string_editor.get_multiline_formatting(text, function(line, indent, index) {
            var preamble;
            preamble = index === 0 ? _this._get_preamble('\n') : '';
            return "" + preamble + (index > 0 || preamble === '\n' ? indent : '') + "- " + line + "\n";
          });
          return lines;
        },
        ordered_list: function(text) {
          var lines,
            _this = this;
          lines = this.string_editor.get_multiline_formatting(text, function(line, indent, index) {
            var preamble;
            preamble = index === 0 ? _this._get_preamble('\n') : '';
            return "" + preamble + (index > 0 || preamble === '\n' ? indent : '') + (index + 1) + ". " + line + "\n";
          });
          return lines;
        },
        resource_manager: function(text) {
          var _this = this;
          $.colorbox({
            href: '/blog/files/manager/?ajax',
            innerWidth: '750px',
            innerHeight: '300px',
            onComplete: function() {
              return $.fileview.bind('record_choose', function(event, record) {
                $.colorbox.close();
                return _this.$editor.insertAtCaret("![Alt text](" + record.fields.url + " \"Optional title\")");
              });
            }
          });
          return null;
        }
      };
    };

    return MarkdownEditor;

  })();

  AsyncPreviewRequestManager = (function() {

    function AsyncPreviewRequestManager($preview_container, $source, action_url) {
      this.$preview_container = $preview_container;
      this.$source = $source;
      this.action_url = action_url;
      this._last_request = null;
      this._last_text = null;
      this._current_request = null;
    }

    AsyncPreviewRequestManager.prototype.make_request = function() {
      var _this = this;
      if (this._last_text !== this.$source.val()) {
        this._last_text = this.$source.val();
        if (this._current_request) {
          this._current_request.abort();
        }
        this._last_request = new Date();
        return this._last_request = $.post(this.action_url, {
          'text': this.$source.val()
        }).success(function(data) {
          _this.$preview_container.find('.innercontent').removeClass('empty').html(data.html);
          if (window.prettyPrint) {
            return window.prettyPrint();
          }
        }).error(function(data) {
          return alert('error');
        });
      }
    };

    return AsyncPreviewRequestManager;

  })();

  MarkdownPreview = (function() {

    function MarkdownPreview($preview_container, $source, $action_url) {
      this.$preview_container = $preview_container;
      this.$source = $source;
      this.$action_url = $action_url;
      this._preview_request_manager = new AsyncPreviewRequestManager(this.$preview_container, this.$source, this.$action_url);
      this._attach_behaviors();
    }

    MarkdownPreview.prototype._attach_behaviors = function() {
      var _this = this;
      return this.$preview_container.bind('click', function() {
        return _this._preview_request_manager.make_request();
      });
    };

    return MarkdownPreview;

  })();

}).call(this);
