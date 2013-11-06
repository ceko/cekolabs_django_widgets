

def add_class(attributes, new_css_class):
    css_class = attributes.get('class', '')
    if new_css_class not in css_class.split(' '):
        attributes['class'] = ("%s %s" % (css_class, new_css_class)).strip()