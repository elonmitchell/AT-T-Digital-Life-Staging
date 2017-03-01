/**	`css` is a requirejs plugin
	that loads a css file and inject it into a page.
	note that this loader will return immediately,
	regardless of whether the browser had finished parsing the stylesheet.
	this css loader is implemented for file optimization and dependency management
 */

define({
	load: function (name, require, load, config) {
		require(["text!" + name], function(content) {
            var head = document.getElementsByTagName('head')[0],
                style = document.createElement('style'),
                rules = document.createTextNode(content);
                style.type = 'text/css';
                if (style.styleSheet) {
                    style.styleSheet.cssText = rules.nodeValue;
                }
                else {
                    style.appendChild(rules);
                }
                head.appendChild(style);
                load(true);
		});
	},
	pluginBuilder: './css-build'
});
