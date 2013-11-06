$ = jQuery

$.fn.extend	
	cekolabs_tagwidget: (options) ->
		# Default settings
		settings =
			tag_input_class: 'cl-tag-input' 
			tag_list_class: 'cl-tag-list'      
			tag_hidden_class: 'cl-tag-hidden'
			
		# Merge default settings with options.
		settings = $.extend settings, options
	
		@each (i, el) ->
			#The extension is called on the wrapper div.  We need to find the 
			#elements that TagInput is interested in now.
			$el = $(el)
			$tag_input_element = $el.find(".#{settings.tag_input_class}")
			$tag_list_element = $el.find(".#{settings.tag_list_class}") 
			$tag_hidden_element = $el.find(".#{settings.tag_hidden_class}")
	
			taginput = new TagInput($tag_input_element, $tag_list_element, $tag_hidden_element)
	
		return @		
	
	cekolabs_markdownwidget: (options) ->
		# Default settings
		settings =
			toolbar_class: 'cl-markdown-toolbar' 
			editor_class: 'cl-markdown-editor' 
						
		# Merge default settings with options.
		settings = $.extend settings, options
	
		@each (i, el) ->
			#The extension is called on the wrapper div.  We need to find the 
			#elements that TagInput is interested in now.
			$el = $(el)
			$toolbar_element = $el.find(".#{settings.toolbar_class}")
			$editor_element = $el.find(".#{settings.editor_class}")
				
			taginput = new MarkdownEditor($toolbar_element, $editor_element)
	
		return @	
	
	cekolabs_markdownpreview: (options) ->
		# Default settings
		settings =
			preview_url: '/blog/parse-markdown'
			$markdown_el: $('#id_markdown')
		
		settings = $.extend settings, options
		
		@each (i, el) ->
			markdown_preview = new MarkdownPreview($(el), settings.$markdown_el, settings.preview_url)
	
	insertAtCaret: (myValue) ->
			
		@each (i, el) ->
			#for IE
			if document.selection
				@focus()
				sel = document.selection.createRange()
				sel.text = myValue
				@focus()
			#for better browsers
			else if @selectionStart or @selectionStart == 0 				
				startPos = @selectionStart
				endPos = @selectionEnd
				scrollTop = @scrollTop
				@value = @value.substring(0, startPos)+myValue+@value.substring(endPos,@value.length)
				@focus()
				@selectionStart = startPos + myValue.length
				@selectionEnd = startPos + myValue.length
				@scrollTop = scrollTop
			else
				@value += myValue
				@focus()
				
		return @
	
	getSelectedText: ->		
		el = this[0]		
		if document.selection
			el.focus()
			sel = document.selection.createRange()
			selectedText = sel.text
		else
			startPos = el.selectionStart
			endPos = el.selectionEnd
			selectedText = el.value.substring(startPos, endPos)
		
		return selectedText
			
class TagInput
	constructor: (@$input, @$list, @$hidden) ->
		@_attach_behaviors()
	
	_attach_behaviors: ->		
		@$input.keydown (event) =>
			if event.which == 13 #enter key
				event.stopPropagation()
				event.preventDefault()
				
				@add_tag()			
		
		@$list.find('.tag').click (event) =>			
			@remove_tag($(event.target))
	
	remove_tag: ($el) ->
		tag = $el.text()
		$el.remove()
		tags = @$hidden.val().split(',')
		@$hidden.val( (t for t in tags when t != tag).join(',') )
	
	add_tag: (tag) ->
		tag = $.trim(tag || @$input.val()).replace(/,/g, " ")
		tags = @$hidden.val().split(',')
		if tag in tags
			return
		
		@$list.append("<div class='tag'>#{tag}<div class='tag-close'></div></div>").click (event) =>
			@remove_tag($(event.target))
		@$input.val('')
		@$hidden.val(@$hidden.val() + ",#{tag}")	

class MarkdownStringEditor
	constructor: (@$editor) ->
	
	add_linebreak: ->
		@_extend_selection_through_whitespace()
		indent = @_get_line_indent() or ''
		@$editor.insertAtCaret("\n#{indent}")
	
	eat_leading_whitespace: (text) ->
		trim_pos = 0					
		while text[trim_pos] in [' ', '\t']
			trim_pos++
		return text.substring(trim_pos)
	
	get_multiline_formatting: (text, pattern_iterator) ->
		indent = @_get_line_indent()
		lines = text.split('\n')
		textbuffer = ''
		for line,i in lines
			textbuffer += pattern_iterator(line.replace(new RegExp("^#{indent}"), ''), indent or '', i)
		
		return textbuffer
	
	_extend_selection_through_whitespace: ->
		caret_pos = @$editor[0].selectionEnd
		cur = caret_pos
				
		while @$editor.val()[cur++] in ['\t', ' ']
			continue
			
		@$editor[0].selectionEnd = cur-1
		
	_get_line_indent: ->
		caret_pos = @$editor[0].selectionStart
		cur = caret_pos
		if @$editor.val()[cur-1] == '\n'
			return ''
			
		linebreaks = 0
		while cur >= 0
			if @$editor.val()[cur-1] == '\n' or cur == 0
				whitespace_idx = cur
				charbuffer = ''
				while @$editor.val()[whitespace_idx] in ['\t', ' ']
					charbuffer += @$editor.val()[whitespace_idx]
					whitespace_idx++
			
				return charbuffer
			cur--			
		
class MarkdownEditor
	constructor: (@$toolbar, @$editor) ->
		@string_editor = new MarkdownStringEditor(@$editor)
		@_attach_behaviors()
    
	_attach_behaviors: ->
		@$toolbar.find('.markdown-button').click (event) =>
			@_apply_markup $(event.target).attr 'command'
		@$editor.keydown (event) =>
			shortcuts =
				66 : 'bold' #b char code
				73 : 'italic' #i char code
			if event.ctrlKey and shortcuts[event.which] != undefined
				@_apply_markup shortcuts[event.which]				
				
			if event.which == 9 #tab key
				event.stopPropagation()
				event.preventDefault()
				if event.shiftKey
					@_apply_markup 'untab'
				else
					@_apply_markup 'tab'
							
			if event.which == 13 #enter key
				event.stopPropagation()
				event.preventDefault()
				@string_editor.add_linebreak()
				
	_apply_markup: (command) ->
		selected_text = @$editor.getSelectedText()
		transformed_text = @_markup_handlers()[command].call(@,selected_text)		
		if transformed_text != null #some may choose to insert after an asynchronous event
			@$editor.insertAtCaret(transformed_text)
	
	#this tests to see if a linebreak is required when the element is inserted. 
	#example:
	#  Dave's Super Awesome Blog Post
	#         ^-----------^ (selection range)
	#  If this is a header element, there should be a line break (if using equals sign to
	#  express headers).  If the selection extends to the start of the line, then no 
	#  line break is required.
	_letters_before_selection: ->
		caret_pos = @$editor[0].selectionStart
		cur = caret_pos
		while --cur > 0 
			if @$editor.val()[cur] in ['\n', '\r']
				return false
			else if @$editor.val()[cur] in ['\t', ' ']
				continue
			else
				return true			
					
		return false	
	
	_get_preamble: (text) ->
		if @_letters_before_selection()
			return text
		else
			return ""
			
	_markup_handlers: => 
		tab: (text) ->
			if @$editor[0].selectionEnd - @$editor[0].selectionStart <= 0
				return '\t'
		
			lines = text.split '\n'
			tabbed = '\t' + lines.join '\n\t'
			tmpselectionstart = @$editor[0].selectionStart+1
			tmpselectionend = @$editor[0].selectionEnd
						
			tmpselectionend += lines.length
			@$editor.insertAtCaret(tabbed)
			@$editor[0].selectionStart = tmpselectionstart
			@$editor[0].selectionEnd = tmpselectionend
			
			return null
		untab: (text) ->			
			cur = @$editor[0].selectionStart
			while cur > 0 and @$editor.val()[cur-1] != '\n'
				cur--
			@$editor[0].selectionStart = cur
			text = @$editor.getSelectedText()
			lines = text.split '\n'
			
			tmpselectionend = @$editor[0].selectionEnd
			tabbed = (l.replace(/^(\t)|^(\s{1,8})/,'') for l in lines).join '\n'
			
			if tabbed != text
				lengthbefore = @$editor.val().length																		
				@$editor.insertAtCaret(tabbed)			
				@$editor[0].selectionStart = cur			
				@$editor[0].selectionEnd = tmpselectionend-(@$editor.val().length - lengthbefore)
			
			return null
		bold: (text) ->
			return "**#{text}**"
		italic: (text) ->
			return "_#{text}_"
		#Both of these functions need to do two things.  
		#1. Only prepend line breaks when the selection has text before it on the same line.
		#2. Only append line breaks when the selection has text after it on the same line.
		#These may only be possible in the browsers with better range support.
		h1: (text) ->
			lines = @string_editor.get_multiline_formatting text, (line, indent, index) =>
				line = @string_editor.eat_leading_whitespace(line)
				underline = Array(Math.min(21, line.length+1)).join('=')	
				preamble = @_get_preamble('\n')											
				return "#{preamble}#{if index > 0 or preamble == '\n' then indent else ''}#{line}\n#{indent}#{underline}\n"			
			
			return lines			
		h2: (text) ->
			h1: (text) ->
			lines = @string_editor.get_multiline_formatting text, (line, indent, index) =>
				line = @string_editor.eat_leading_whitespace(line)
				underline = Array(Math.min(21, line.length+1)).join('-')	
				preamble = @_get_preamble('\n')											
				return "#{preamble}#{if index > 0 or preamble == '\n' then indent else ''}#{line}\n#{indent}#{underline}\n"			
			
			return lines
		h3: (text) ->			
			return "#{@_get_preamble('\n')}####{text}\n"			
		quote: (text) ->
			lines = @string_editor.get_multiline_formatting text, (line, indent, index) =>
				preamble = if index == 0 then @_get_preamble('\n') else ''
				return "#{preamble}#{if index > 0 or preamble == '\n' then indent else ''}> #{line}\n"			
			
			return lines
		#Same comment for headers goes for unordered lists and ordered lists.
		unordered_list: (text) ->
			lines = @string_editor.get_multiline_formatting text, (line, indent, index) =>
				preamble = if index == 0 then @_get_preamble('\n') else ''				
				return "#{preamble}#{if index > 0 or preamble == '\n' then indent else ''}- #{line}\n"
			
			return lines
		ordered_list: (text) ->
			lines = @string_editor.get_multiline_formatting text, (line, indent, index) =>
				preamble = if index == 0 then @_get_preamble('\n') else ''				
				return "#{preamble}#{if index > 0 or preamble == '\n' then indent else ''}#{index+1}. #{line}\n"
			
			return lines
		resource_manager: (text) ->
			$.colorbox( 
				href:'/blog/files/manager/?ajax'
				innerWidth:'750px'
				innerHeight:'300px'
				onComplete: =>
					#change this to $.fileview.bind or something
					$.fileview.bind 'record_choose', (event, record) =>
						$.colorbox.close()
						@$editor.insertAtCaret("![Alt text](#{record.fields.url} \"Optional title\")") 
			)
			
			return null

class AsyncPreviewRequestManager
	constructor: (@$preview_container, @$source, @action_url) ->		
		@_last_request = null
		@_last_text = null
		@_current_request = null
		
	make_request: ->
		#This could probably be changed to something like @$source.has_edits()
		if @_last_text != @$source.val()
			@_last_text = @$source.val()
			if @_current_request
				@_current_request.abort()
				
			@_last_request = new Date()
			
			@_last_request = $.post(@action_url, {		
				'text': @$source.val(),
			})
			.success (data) =>
				@$preview_container.find('.innercontent')
					.removeClass('empty')			
					.html(data.html)
				if window.prettyPrint
					window.prettyPrint()
			.error (data) =>
				alert('error')

class MarkdownPreview
	constructor: (@$preview_container, @$source, @$action_url) ->
		@_preview_request_manager = new AsyncPreviewRequestManager(@$preview_container, @$source, @$action_url)
		@_attach_behaviors()
	
	_attach_behaviors: ->
		@$preview_container.bind 'click', =>
			@_preview_request_manager.make_request()
			
			
			
			
			
			
			
			
			
			
			
		
		