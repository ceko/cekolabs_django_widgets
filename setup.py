from distutils.core import setup


setup(
    name='cekolabs_django_widgets',
    version='0.1.1',
    author='Dave Lafferty',
    author_email='info@dave-lafferty.com',
    packages=['cekolabs_django_widgets',],
    scripts=[],
    url='http://dave-lafferty.com/python-packages/cekolabs_django_widgets', #TODO: Switch to github
    license='LICENSE.txt',
    description='All the django widgets used on www.dave-lafferty.com.',
    long_description=open('README.txt').read(),
    install_requires=[
        "Django >= 1.4.2", 
        "markdown",       
    ],
)