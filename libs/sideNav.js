define([
    'libs/modernizr',
    'underscore',
    'libs/jquery.hammer'
], function (Modernizr, _) {

    return function(options) {

        var defaults = {
            dataAttrs: true,
            prefix: "side-nav",
            burger: "burger",
            nav: "nav",
            app: "app",
            content: "content",
            navW: "245"
        };

        var config = $.extend(defaults, options || {});

        var state = {
            open: false
        };

        /**
         * When a CSS transition is triggered from the navigation
         * set the state and unbind events here to ensure the slider
         * is set to showing.
         */

        App.vent.on('region:showing', function() {
            state.open = false;
            $('body').removeClass('nav-open').addClass('nav-closed');
            $app.off("tap", $content.selector);
        });

        var prefix = "data-" + config.prefix,
            burger = config.burger,
            nav = config.nav,
            app = config.app,
            content = config.content,
            navWidth = config.navW;

        if (config.dataAttrs === false) {
            $burger = $('#' + burger);
            $nav = $('#' + nav);
            $app = $('#' + app);
            $content = $('#' + content);
        } else {
            $burger = $('[' + prefix + '="' + burger + '"]');
            $nav = $('[' + prefix + '="' + nav + '"]');
            $app = $('[' + prefix + '="' + app + '"]');
            $content = $('[' + prefix + '="' + content + '"]');
        }

        console.log($burger, $nav, $app, $content, navWidth);

        this.openNav = function() {

            App.vent.trigger('dashboard:shrink');

            // Add class to body for stying purposes
            $('body').removeClass('nav-closed').addClass('nav-open');

            // Animate App
            if (Modernizr.csstransforms) {
                $app.css("transform", "translate(" + navWidth + "px,0)");
                $app.css("-webkit-transition", "0.1s ease-out");
            } else {
                $app.css("left", navWidth + "px");
            }

            $app.hammer().on("tap", $content.selector, function(event) {
                if (event.type === 'tap') {
                    touchEvent();
                }
            });
            state.open = true;
        };

        this.close = function() {

            // Add class to body for styling purposes
            $('body').removeClass('nav-open').addClass('nav-closed');

            // Animate App
            if (Modernizr.csstransforms3d) {
                $app.css("-webkit-transform", "translate3d(0px,0,0)");
            } else if (Modernizr.csstransforms) {
                $app.css("-webkit-transform", "translate(0px,0)");
            } else {
                $app.css("left", "0px");
            }

            $app.css("-webkit-transition", "0.1s ease-out");

            // Unbind content tap
            $app.off("tap", $content.selector);

            // Set state
            state.open = false;
        };
        this.listen = function() {

            // Unbind click
            $burger.off('click');

            // Bind touch
            $app.on('touchstart', $burger.selector, function (e) {
                $burger.addClass('burger-touching');
                $burger.bind('touchmove', cancel);
                $burger.bind('touchcancel', cancel);

                function cancel () {
                    $burger.removeClass('burger-touching');
                }
            });

            $app.on('touchend', $burger.selector, function (e) {
                $burger.removeClass('burger-touching');
                touchEvent();
            });

            $app.hammer().on("dragend dragleft dragright", $content.selector, function(event) {
                if (event.type === 'dragleft' || event.type === 'dragright') {
                    event.gesture.preventDefault();
                }
                if (event.type === 'dragend') {
                    console.log('released');

                    var dragEnd = event.gesture.direction;

                    if(dragEnd === 'right' || dragEnd === 'left') {
                        event.gesture.preventDefault();
                    }
                    //if nav is not opened make sure user dragged from left to right else ignore event
                    if (state.open === false) {
                        // make sure user is swiping left to right
                        // nav is on the left   else ignore
                        if (dragEnd === 'right' && !$('body').hasClass('disable-menuSwipe')) {
                            touchEvent();
                        }
                    } else {
                        // make sure user is swiping in the opposite direction to close the nav else ignore
                        if (dragEnd === 'left') {
                            touchEvent();
                        }
                    }

                    //else ignore drag
                }
            });
        };

        function touchEvent() {
            if (state.open === false) {
                // If closed, open nav.
                this.openNav();
            } else {
                // Close nav.
                this.close();
            }
        }

        // Start listening for open event
        this.listen();

    };
});
