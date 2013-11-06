from __future__ import absolute_import, unicode_literals
import django.forms.widgets
from django.utils.encoding import force_text, force_unicode
from django.forms.util import flatatt
from django.utils.safestring import mark_safe
from django.utils.html import escape, conditional_escape
import cekolabs_django_widgets.utils as labutils


class MarkdownEditor(django.forms.widgets.Textarea):
    """
    Creates a textarea with a default toolbar that gives basic markdown functionality.
    """
    
    default_textarea_class = 'cl-markdown-editor'
    default_button_options = (
        'bold',
        'italic',        
        'h1',
        'h2',
        'h3',
        'ordered_list',
        'unordered_list',
        'quote',
        'blog_link',
        'image_link',
        'file_link',
        'resource_manager', 
    )
    
    def render(self, name, value, attrs=None):
        if value is None: value = ''
        final_attrs = self.build_attrs(attrs, name=name)
        id = final_attrs['id']
        labutils.add_class(final_attrs, MarkdownEditor.default_textarea_class)
        
        editor_html = u'<div id="markdown_wrap_%s" class="cl-markdown">%s<textarea%s>%s</textarea></div>' % (
            id,
            self._toolbar_html(), 
            flatatt(final_attrs),
            conditional_escape(force_unicode(value))
        )
        jquery_bootstrap = u"<script>jQuery(function() { jQuery('#markdown_wrap_%s').cekolabs_markdownwidget() })</script>" % id
                
        return mark_safe(editor_html + jquery_bootstrap)

    def _toolbar_html(self):
        button_html = (u"<div class='markdown-button %s' command='%s'></div>" % (b,b) for b in MarkdownEditor.default_button_options)        
        return u"<div class='cl-markdown-toolbar'>%s</div>" % "".join(button_html)

    class Media:
        js = ('js/cekolabs_django_widgets/widgets.js',)

class TagInput(django.forms.widgets.TextInput):
    """
    Creates a textbox with optional autocomplete that automatically adds tags to a target div when
    a user presses enter.  Tags cannot contain commas.
    """
    
    default_input_class = 'cl-tag-input'    
    
    def render(self, name, value, attrs=None):                
        tags = value or []
        hidden_value = ''
        if any(tags):                        
            hidden_value = force_text(",".join(tags))
        
        final_attrs = self.build_attrs(attrs, type=self.input_type, name=name)
        final_attrs['autocomplete'] = 'off'
        labutils.add_class(final_attrs, TagInput.default_input_class)
                
        id = final_attrs['id']
        name = final_attrs['name']
                    
        hidden_attrs = {
            'type' : 'hidden',
            'id' : '%s_hidden' % id,
            'name' : '%s_hidden' % name,
            'class' : 'cl-tag-hidden',
            'value' : hidden_value            
        }
                                                                                                
        inputs_html = u"<input%s/><input%s/>" % (flatatt(final_attrs), flatatt(hidden_attrs))
        tag_list_html = ""
        for tag in tags:
            tag_list_html += "<div class='tag'>%s<div class='tag-close'></div></div>" % escape(tag)
        inputs_wrap_html = u"<div id='tag_wrap_{0}' class='cl-tag-wrap'>{1}<div id='tag_list_{0}' class='cl-tag-list'>{2}</div></div>".format(id, inputs_html, tag_list_html)
        jquery_bootstrap = u"<script>jQuery(function() { jQuery('#tag_wrap_%s').cekolabs_tagwidget() })</script>" % id
            
        return mark_safe(inputs_wrap_html + jquery_bootstrap)    
    
    def value_from_datadict(self, data, files, name):
        str_data = data['%s_hidden' % name]
        tags = []
        if str_data:
            tags = [t for t in str_data.split(',') if t]
            
        return tags
    
    class Media:
        js = ('js/cekolabs_django_widgets/widgets.js',)