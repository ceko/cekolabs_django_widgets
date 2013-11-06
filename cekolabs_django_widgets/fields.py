from django import forms
import cekolabs_django_widgets


class TagField(forms.Field):
    widget = cekolabs_django_widgets.widgets.TagInput