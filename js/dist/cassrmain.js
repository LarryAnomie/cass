/*
 * jQuery plugin to wrap elements
 *
 * http://jsbin.com/idize
 *
 */
(function(a) {
    a.fn.wrapChildren = function(b) {
        var b = a.extend({childElem: undefined, sets: 1, wrapper: "div"}, b || {});
        if (b.childElem === undefined) {
            return this
        }
        return this.each(function() {
            var d = a(this).children(b.childElem);
            var c = [];
            d.each(function(e, f) {
                c.push(f);
                if (((e + 1) % b.sets === 0) || (e === d.length - 1)) {
                    var g = a(c);
                    c = [];
                    g.wrapAll(a("<" + b.wrapper + ">"))
                }
            })
        })
    }
})(jQuery);
;/**
 * BxSlider v4.0 - Fully loaded, responsive content slider
 * http://bxslider.com
 *
 * Copyright 2012, Steven Wanderski - http://stevenwanderski.com - http://bxcreative.com
 * Written while drinking Belgian ales and listening to jazz
 *
 * Released under the WTFPL license - http://sam.zoy.org/wtfpl/
 */

;(function($){

    var plugin = {};
    
    var defaults = {
        
        // GENERAL
        mode: 'horizontal',
        slideSelector: '',
        infiniteLoop: true,
        hideControlOnEnd: false,
        speed: 500,
        easing: null,
        slideMargin: 0,
        startSlide: 0,
        randomStart: false,
        captions: false,
        ticker: false,
        tickerHover: false,
        adaptiveHeight: false,
        adaptiveHeightSpeed: 500,
        touchEnabled: true,
        swipeThreshold: 50,
        video: false,
        useCSS: true,
        
        // PAGER
        pager: true,
        pagerType: 'full',
        pagerShortSeparator: ' / ',
        pagerSelector: null,
        buildPager: null,
        pagerCustom: null,
        
        // CONTROLS
        controls: true,
        nextText: 'Next',
        prevText: 'Prev',
        nextSelector: null,
        prevSelector: null,
        autoControls: false,
        startText: 'Start',
        stopText: 'Stop',
        autoControlsCombine: false,
        autoControlsSelector: null,
        
        // AUTO
        auto: false,
        pause: 4000,
        autoStart: true,
        autoDirection: 'next',
        autoHover: false,
        autoDelay: 0,
        
        // CAROUSEL
        minSlides: 1,
        maxSlides: 1,
        moveSlides: 0,
        slideWidth: 0,
        
        // CALLBACKS
        onSliderLoad: function() {},
        onSlideBefore: function() {},
        onSlideAfter: function() {},
        onSlideNext: function() {},
        onSlidePrev: function() {}
    }

    $.fn.bxSlider = function(options){
        
        if(this.length == 0) return;
        
        // support mutltiple elements
        if(this.length > 1){
            this.each(function(){$(this).bxSlider(options)});
            return this;
        }
        
        // create a namespace to be used throughout the plugin
        var slider = {};
        // set a reference to our slider element
        var el = this;
        plugin.el = this;
        
        /**
         * ===================================================================================
         * = PRIVATE FUNCTIONS
         * ===================================================================================
         */
        
        /**
         * Initializes namespace settings to be used throughout plugin
         */
        var init = function(){
            // merge user-supplied options with the defaults
            slider.settings = $.extend({}, defaults, options);
            // store the original children
            slider.children = el.children(slider.settings.slideSelector);
            // if random start, set the startSlide setting to random number
            if(slider.settings.randomStart) slider.settings.startSlide = Math.floor(Math.random() * slider.children.length);
            // store active slide information
            slider.active = { index: slider.settings.startSlide }
            // store if the slider is in carousel mode (displaying / moving multiple slides)
            slider.carousel = slider.settings.minSlides > 1 || slider.settings.maxSlides > 1;
            // calculate the min / max width thresholds based on min / max number of slides
            // used to setup and update carousel slides dimensions
            slider.minThreshold = (slider.settings.minSlides * slider.settings.slideWidth) + ((slider.settings.minSlides - 1) * slider.settings.slideMargin);
            slider.maxThreshold = (slider.settings.maxSlides * slider.settings.slideWidth) + ((slider.settings.maxSlides - 1) * slider.settings.slideMargin);
            // store the current state of the slider (if currently animating, working is true)
            slider.working = false;
            // initialize the controls object
            slider.controls = {};
            // determine which property to use for transitions
            slider.animProp = slider.settings.mode == 'vertical' ? 'top' : 'left';
            // determine if hardware acceleration can be used
            slider.usingCSS = slider.settings.useCSS && slider.settings.mode != 'fade' && (function(){
                // create our test div element
                var div = document.createElement('div');
                // css transition properties
                var props = ['WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
                // test for each property
                for(var i in props){
                    if(div.style[props[i]] !== undefined){
                        slider.cssPrefix = props[i].replace('Perspective', '').toLowerCase();
                        slider.animProp = '-' + slider.cssPrefix + '-transform';
                        return true;
                    }
                }
                return false;
            }());
            // if vertical mode always make maxSlides and minSlides equal
            if(slider.settings.mode == 'vertical') slider.settings.maxSlides = slider.settings.minSlides;
            // perform all DOM / CSS modifications
            setup();
        }

        /**
         * Performs all DOM and CSS modifications
         */
        var setup = function(){
            // wrap el in a wrapper
            el.wrap('<div class="bx-wrapper"><div class="bx-viewport"></div></div>');
            // store a namspace reference to .bx-viewport
            slider.viewport = el.parent();
            // add a loading div to display while images are loading
            slider.loader = $('<div class="bx-loading" />');
            slider.viewport.prepend(slider.loader);
            // set el to a massive width, to hold any needed slides
            // also strip any margin and padding from el
            el.css({
                width: slider.settings.mode == 'horizontal' ? slider.children.length * 215 + '%' : 'auto',
                position: 'relative',
            });
            // if using CSS, add the easing property
            if(slider.usingCSS && slider.settings.easing){
                el.css('-' + slider.cssPrefix + '-transition-timing-function', slider.settings.easing);
            // if not using CSS and no easing value was supplied, use the default JS animation easing (swing)
            }else if(!slider.settings.easing){
                slider.settings.easing = 'swing';
            }
            // make modifications to the viewport (.bx-viewport)
            slider.viewport.css({
                width: '100%',
                overflow: 'hidden',
                position: 'relative'
            });
            // apply css to all slider children
            slider.children.css({
                float: slider.settings.mode == 'horizontal' ? 'left' : 'none',
                listStyle: 'none',
            });
            // apply the calculated width after the float is applied to prevent scrollbar interference
            slider.children.width(getSlideWidth());
            // if slideMargin is supplied, add the css
            if(slider.settings.mode == 'horizontal' && slider.settings.slideMargin > 0) slider.children.css('marginRight', slider.settings.slideMargin);
            if(slider.settings.mode == 'vertical' && slider.settings.slideMargin > 0) slider.children.css('marginBottom', slider.settings.slideMargin);
            // if "fade" mode, add positioning and z-index CSS
            if(slider.settings.mode == 'fade'){
                slider.children.css({
                    position: 'absolute',
                    zIndex: 0,
                    display: 'none'
                });
                // prepare the z-index on the showing element
                slider.children.eq(slider.settings.startSlide).css({zIndex: 50, display: 'block'});
            }
            // create an element to contain all slider controls (pager, start / stop, etc)
            slider.controls.el = $('<div class="bx-controls" />');
            // if captions are requested, add them
            if(slider.settings.captions) appendCaptions();
            // if infinite loop, prepare additional slides
            if(slider.settings.infiniteLoop && slider.settings.mode != 'fade' && !slider.settings.ticker){
                var slice = slider.settings.mode == 'vertical' ? slider.settings.minSlides : slider.settings.maxSlides;
                var sliceAppend = slider.children.slice(0, slice).clone().addClass('bx-clone');
                var slicePrepend = slider.children.slice(-slice).clone().addClass('bx-clone');
                el.append(sliceAppend).prepend(slicePrepend);
            }
            // check if startSlide is last slide
            slider.active.last = slider.settings.startSlide == getPagerQty() - 1;
            // if video is true, set up the fitVids plugin
            if(slider.settings.video) el.fitVids();
            // only check for control addition if not in "ticker" mode
            if(!slider.settings.ticker){
                // if pager is requested, add it
                if(slider.settings.pager) appendPager();
                // if controls are requested, add them
                if(slider.settings.controls) appendControls();
                // if auto is true, and auto controls are requested, add them
                if(slider.settings.auto && slider.settings.autoControls) appendControlsAuto();
                // if any control option is requested, add the controls wrapper
                if(slider.settings.controls || slider.settings.autoControls || slider.settings.pager) slider.viewport.after(slider.controls.el);
            }
            // preload all images, then perform final DOM / CSS modifications that depend on images being loaded
            el.children().imagesLoaded(function(){
                // remove the loading DOM element
                slider.loader.remove();
                // set the left / top position of "el"
                setSlidePosition();
                // if "vertical" mode, always use adaptiveHeight to prevent odd behavior
                if (slider.settings.mode == 'vertical') slider.settings.adaptiveHeight = true;
                // set the viewport height
                slider.viewport.height(getViewportHeight());
                // onSliderLoad callback
                slider.settings.onSliderLoad(slider.active.index);
                // if auto is true, start the show
                if (slider.settings.auto && slider.settings.autoStart) initAuto();
                // if ticker is true, start the ticker
                if (slider.settings.ticker) initTicker();
                // if pager is requested, make the appropriate pager link active
                if (slider.settings.pager) updatePagerActive(slider.settings.startSlide);
                // check for any updates to the controls (like hideControlOnEnd updates)
                if (slider.settings.controls) updateDirectionControls();
                // if touchEnabled is true, setup the touch events
                if (slider.settings.touchEnabled && !slider.settings.ticker) initTouch();
            });
        }
        
        /**
         * Returns the calculated height of the viewport, used to determine either adaptiveHeight or the maxHeight value
         */
        var getViewportHeight = function(){
            var height = 0;
            // first determine which children (slides) should be used in our height calculation
            var children = $();
            // if mode is not "vertical", adaptiveHeight is always false, so return all children
            if(slider.settings.mode != 'vertical' && !slider.settings.adaptiveHeight){
                children = slider.children;
            }else{
                // if not carousel, return the single active child
                if(!slider.carousel){
                    children = slider.children.eq(slider.active.index);
                // if carousel, return a slice of children
                }else{
                    // get the individual slide index
                    var currentIndex = slider.settings.moveSlides == 1 ? slider.active.index : slider.active.index * getMoveBy();
                    // add the current slide to the children
                    children = slider.children.eq(currentIndex);
                    // cycle through the remaining "showing" slides
                    for (i = 1; i <= slider.settings.maxSlides - 1; i++){
                        // if looped back to the start
                        if(currentIndex + i >= slider.children.length){
                            children = children.add(slider.children.eq(i - 1));
                        }else{
                            children = children.add(slider.children.eq(currentIndex + i));
                        }
                    }
                }
            }
            // if "vertical" mode, calculate the sum of the heights of the children
            if(slider.settings.mode == 'vertical'){
                children.each(function(index) {
                  height += $(this).outerHeight();
                });
                // add user-supplied margins
                if(slider.settings.slideMargin > 0){
                    height += slider.settings.slideMargin * (slider.settings.minSlides - 1);
                }
            // if not "vertical" mode, calculate the max height of the children
            }else{
                height = Math.max.apply(Math, children.map(function(){
                    return $(this).outerHeight(false);
                }).get());
            }
            return height;
        }
        
        /**
         * Returns the calculated width to be applied to each slide
         */
        var getSlideWidth = function(){
            // start with any user-supplied slide width
            var newElWidth = slider.settings.slideWidth;
            // get the current viewport width
            var wrapWidth = slider.viewport.width();
            // if slide width was not supplied, use the viewport width (means not carousel)
            if(slider.settings.slideWidth == 0){
                newElWidth = wrapWidth;
            // if carousel, use the thresholds to determine the width
            }else{
                if(wrapWidth > slider.maxThreshold){
                    newElWidth = (wrapWidth - (slider.settings.slideMargin * (slider.settings.maxSlides - 1))) / slider.settings.maxSlides;
                }else if(wrapWidth < slider.minThreshold){
                    newElWidth = (wrapWidth - (slider.settings.slideMargin * (slider.settings.minSlides - 1))) / slider.settings.minSlides;
                }
            }
            return newElWidth;
        }
        
        /**
         * Returns the number of slides currently visible in the viewport (includes partially visible slides)
         */
        var getNumberSlidesShowing = function(){
            var slidesShowing = 1;
            if(slider.settings.mode == 'horizontal'){
                // if viewport is smaller than minThreshold, return minSlides
                if(slider.viewport.width() < slider.minThreshold){
                    slidesShowing = slider.settings.minSlides;
                // if viewport is larger than minThreshold, return maxSlides
                }else if(slider.viewport.width() > slider.maxThreshold){
                    slidesShowing = slider.settings.maxSlides;
                // if viewport is between min / max thresholds, divide viewport width by first child width
                }else{
                    var childWidth = slider.children.first().width();
                    slidesShowing = Math.floor(slider.viewport.width() / childWidth);
                }
            // if "vertical" mode, slides showing will always be minSlides
            }else if(slider.settings.mode == 'vertical'){
                slidesShowing = slider.settings.minSlides;
            }
            return slidesShowing;
        }
        
        /**
         * Returns the number of pages (one full viewport of slides is one "page")
         */
        var getPagerQty = function(){
            var pagerQty = 0;
            // if moveSlides is specified by the user
            if(slider.settings.moveSlides > 0){
                if(slider.settings.infiniteLoop){
                    pagerQty = slider.children.length / getMoveBy();
                }else{
                    // use a while loop to determine pages
                    var breakPoint = 0;
                    var counter = 0
                    // when breakpoint goes above children length, counter is the number of pages
                    while (breakPoint < slider.children.length){
                        ++pagerQty;
                        breakPoint = counter + getNumberSlidesShowing();
                        counter += slider.settings.moveSlides <= getNumberSlidesShowing() ? slider.settings.moveSlides : getNumberSlidesShowing();
                    }
                }
            // if moveSlides is 0 (auto) divide children length by sides showing, then round up
            }else{
                pagerQty = Math.ceil(slider.children.length / getNumberSlidesShowing());
            }
            return pagerQty;
        }
        
        /**
         * Returns the number of indivual slides by which to shift the slider
         */
        var getMoveBy = function(){
            // if moveSlides was set by the user and moveSlides is less than number of slides showing
            if(slider.settings.moveSlides > 0 && slider.settings.moveSlides <= getNumberSlidesShowing()){
                return slider.settings.moveSlides;
            }
            // if moveSlides is 0 (auto)
            return getNumberSlidesShowing();
        }
        
        /**
         * Sets the slider's (el) left or top position
         */
        var setSlidePosition = function(){
            // if last slide
            if(slider.active.last){
                if (slider.settings.mode == 'horizontal'){
                    // get the last child's position
                    var lastChild = slider.children.last();
                    var position = lastChild.position();
                    // set the left position
                    setPositionProperty(-(position.left - (slider.viewport.width() - lastChild.width())), 'reset', 0);
                }else if(slider.settings.mode == 'vertical'){
                    // get the last showing index's position
                    var lastShowingIndex = slider.children.length - slider.settings.minSlides;
                    var position = slider.children.eq(lastShowingIndex).position();
                    // set the top position
                    setPositionProperty(-position.top, 'reset', 0);
                }
            // if not last slide
            }else{
                // get the position of the first showing slide
                var position = slider.children.eq(slider.active.index * getMoveBy()).position();
                // check for last slide
                if (slider.active.index == getPagerQty() - 1) slider.active.last = true;
                // set the repective position
                if (position != undefined){
                    if (slider.settings.mode == 'horizontal') setPositionProperty(-position.left, 'reset', 0);
                    else if (slider.settings.mode == 'vertical') setPositionProperty(-position.top, 'reset', 0);
                }
            }
        }
        
        /**
         * Sets the el's animating property position (which in turn will sometimes animate el).
         * If using CSS, sets the transform property. If not using CSS, sets the top / left property.
         *
         * @param value (int) 
         *  - the animating property's value
         *
         * @param type (string) 'slider', 'reset', 'ticker'
         *  - the type of instance for which the function is being
         *
         * @param duration (int) 
         *  - the amount of time (in ms) the transition should occupy
         *
         * @param params (array) optional
         *  - an optional parameter containing any variables that need to be passed in
         */
        var setPositionProperty = function(value, type, duration, params){
            // use CSS transform
            if(slider.usingCSS){
                // determine the translate3d value
                var propValue = slider.settings.mode == 'vertical' ? 'translate3d(0, ' + value + 'px, 0)' : 'translate3d(' + value + 'px, 0, 0)';
                // add the CSS transition-duration
                el.css('-' + slider.cssPrefix + '-transition-duration', duration / 1000 + 's');
                if(type == 'slide'){
                    // set the property value
                    el.css(slider.animProp, propValue);
                    // bind a callback method - executes when CSS transition completes
                    el.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function(){
                        // unbind the callback
                        el.unbind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd');
                        updateAfterSlideTransition();
                    });
                }else if(type == 'reset'){
                    el.css(slider.animProp, propValue);
                }else if(type == 'ticker'){
                    // make the transition use 'linear'
                    el.css('-' + slider.cssPrefix + '-transition-timing-function', 'linear');
                    el.css(slider.animProp, propValue);
                    // bind a callback method - executes when CSS transition completes
                    el.bind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function(){
                        // unbind the callback
                        el.unbind('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd');
                        // reset the position
                        setPositionProperty(params['resetValue'], 'reset', 0);
                        // start the loop again
                        tickerLoop();
                    });
                }
            // use JS animate
            }else{
                var animateObj = {};
                animateObj[slider.animProp] = value;
                if(type == 'slide'){
                    el.animate(animateObj, duration, slider.settings.easing, function(){
                        updateAfterSlideTransition();
                    });
                }else if(type == 'reset'){
                    el.css(slider.animProp, value)
                }else if(type == 'ticker'){
                    el.animate(animateObj, speed, 'linear', function(){
                        setPositionProperty(params['resetValue'], 'reset', 0);
                        // run the recursive loop after animation
                        tickerLoop();
                    });
                }
            }
        }
        
        /**
         * Populates the pager with proper amount of pages
         */
        var populatePager = function(){
            var pagerHtml = '';
            pagerQty = getPagerQty();
            // loop through each pager item
            for(var i=0; i < pagerQty; i++){
                var linkContent = '';
                // if a buildPager function is supplied, use it to get pager link value, else use index + 1
                if(slider.settings.buildPager && $.isFunction(slider.settings.buildPager)){
                    linkContent = slider.settings.buildPager(i);
                    slider.pagerEl.addClass('bx-custom-pager');
                }else{
                    linkContent = i + 1;
                    slider.pagerEl.addClass('bx-default-pager');
                }
                // var linkContent = slider.settings.buildPager && $.isFunction(slider.settings.buildPager) ? slider.settings.buildPager(i) : i + 1;
                // add the markup to the string
                pagerHtml += '<div class="bx-pager-item"><a href="" data-slide-index="' + i + '" class="bx-pager-link">' + linkContent + '</a></div>';
            };
            // populate the pager element with pager links
            slider.pagerEl.html(pagerHtml);
        }
        
        /**
         * Appends the pager to the controls element
         */
        var appendPager = function(){
            if(!slider.settings.pagerCustom){
                // create the pager DOM element
                slider.pagerEl = $('<div class="bx-pager" />');
                // if a pager selector was supplied, populate it with the pager
                if(slider.settings.pagerSelector){
                    $(slider.settings.pagerSelector).html(slider.pagerEl);
                // if no pager selector was supplied, add it after the wrapper
                }else{
                    slider.controls.el.addClass('bx-has-pager').append(slider.pagerEl);
                }
                // populate the pager
                populatePager();
            }else{
                slider.pagerEl = $(slider.settings.pagerCustom);
            }
            // assign the pager click binding
            slider.pagerEl.delegate('a', 'click', clickPagerBind);
        }
        
        /**
         * Appends prev / next controls to the controls element
         */
        var appendControls = function(){
            slider.controls.next = $('<a class="bx-next" href="">' + slider.settings.nextText + '</a>');
            slider.controls.prev = $('<a class="bx-prev" href="">' + slider.settings.prevText + '</a>');
            // bind click actions to the controls
            slider.controls.next.bind('click', clickNextBind);
            slider.controls.prev.bind('click', clickPrevBind);
            // if nextSlector was supplied, populate it
            if(slider.settings.nextSelector){
                $(slider.settings.nextSelector).append(slider.controls.next);
            }
            // if prevSlector was supplied, populate it
            if(slider.settings.prevSelector){
                $(slider.settings.prevSelector).append(slider.controls.prev);
            }
            // if no custom selectors were supplied
            if(!slider.settings.nextSelector && !slider.settings.prevSelector){
                // add the controls to the DOM
                slider.controls.directionEl = $('<div class="bx-controls-direction" />');
                // add the control elements to the directionEl
                slider.controls.directionEl.append(slider.controls.prev).append(slider.controls.next);
                // slider.viewport.append(slider.controls.directionEl);
                slider.controls.el.addClass('bx-has-controls-direction').append(slider.controls.directionEl);
            }
        }
        
        /**
         * Appends start / stop auto controls to the controls element
         */
        var appendControlsAuto = function(){
            slider.controls.start = $('<div class="bx-controls-auto-item"><a class="bx-start" href="">' + slider.settings.startText + '</a></div>');
            slider.controls.stop = $('<div class="bx-controls-auto-item"><a class="bx-stop" href="">' + slider.settings.stopText + '</a></div>');
            // add the controls to the DOM
            slider.controls.autoEl = $('<div class="bx-controls-auto" />');
            // bind click actions to the controls
            slider.controls.autoEl.delegate('.bx-start', 'click', clickStartBind);
            slider.controls.autoEl.delegate('.bx-stop', 'click', clickStopBind);
            // if autoControlsCombine, insert only the "start" control
            if(slider.settings.autoControlsCombine){
                slider.controls.autoEl.append(slider.controls.start);
            // if autoControlsCombine is false, insert both controls
            }else{
                slider.controls.autoEl.append(slider.controls.start).append(slider.controls.stop);
            }
            // if auto controls selector was supplied, populate it with the controls
            if(slider.settings.autoControlsSelector){
                $(slider.settings.autoControlsSelector).html(slider.controls.autoEl);
            // if auto controls selector was not supplied, add it after the wrapper
            }else{
                slider.controls.el.addClass('bx-has-controls-auto').append(slider.controls.autoEl);
            }
            // update the auto controls
            updateAutoControls(slider.settings.autoStart ? 'stop' : 'start');
        }
        
        /**
         * Appends image captions to the DOM
         */
        var appendCaptions = function(){
            // cycle through each child
            slider.children.each(function(index){
                // get the image title attribute
                var title = $(this).find('img:first').attr('title');
                // append the caption
                if (title != undefined) $(this).append('<div class="bx-caption"><span>' + title + '</span></div>');
            });
        }
        
        /**
         * Click next binding
         *
         * @param e (event) 
         *  - DOM event object
         */
        var clickNextBind = function(e){
            // if auto show is running, stop it
            if (slider.settings.auto) el.stopAuto();
            el.goToNextSlide();
            e.preventDefault();
        }
        
        /**
         * Click prev binding
         *
         * @param e (event) 
         *  - DOM event object
         */
        var clickPrevBind = function(e){
            // if auto show is running, stop it
            if (slider.settings.auto) el.stopAuto();
            el.goToPrevSlide();
            e.preventDefault();
        }
        
        /**
         * Click start binding
         *
         * @param e (event) 
         *  - DOM event object
         */
        var clickStartBind = function(e){
            el.startAuto();
            e.preventDefault();
        }
        
        /**
         * Click stop binding
         *
         * @param e (event) 
         *  - DOM event object
         */
        var clickStopBind = function(e){
            el.stopAuto();
            e.preventDefault();
        }

        /**
         * Click pager binding
         *
         * @param e (event) 
         *  - DOM event object
         */
        var clickPagerBind = function(e){
            // if auto show is running, stop it
            if (slider.settings.auto) el.stopAuto();
            var pagerLink = $(e.currentTarget);
            var pagerIndex = parseInt(pagerLink.attr('data-slide-index'));
            // if clicked pager link is not active, continue with the goToSlide call
            if(pagerIndex != slider.active.index) el.goToSlide(pagerIndex);
            e.preventDefault();
        }
        
        /**
         * Updates the pager links with an active class
         *
         * @param slideIndex (int) 
         *  - index of slide to make active
         */
        var updatePagerActive = function(slideIndex){
            // if "short" pager type
            if(slider.settings.pagerType == 'short'){
                slider.pagerEl.html((slideIndex + 1) + slider.settings.pagerShortSeparator + slider.children.length);
                return;
            }
            // remove all pager active classes
            slider.pagerEl.find('a').removeClass('active');
            // apply the active class
            slider.pagerEl.find('a').eq(slideIndex).addClass('active');
        }
        
        /**
         * Performs needed actions after a slide transition
         */
        var updateAfterSlideTransition = function(){
            // if infinte loop is true
            if(slider.settings.infiniteLoop){
                var position = '';
                // first slide
                if(slider.active.index == 0){
                    // set the new position
                    position = slider.children.eq(0).position();
                // carousel, last slide
                }else if(slider.active.index == getPagerQty() - 1 && slider.carousel){
                    position = slider.children.eq((getPagerQty() - 1) * getMoveBy()).position();
                // last slide
                }else if(slider.active.index == slider.children.length - 1){
                    position = slider.children.eq(slider.children.length - 1).position();
                }
                if (slider.settings.mode == 'horizontal') { setPositionProperty(-position.left, 'reset', 0);; }
                else if (slider.settings.mode == 'vertical') { setPositionProperty(-position.top, 'reset', 0);; }
            }
            // declare that the transition is complete
            slider.working = false;
            // onSlideAfter callback
            slider.settings.onSlideAfter(slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index);
        }
        
        /**
         * Updates the auto controls state (either active, or combined switch)
         *
         * @param state (string) "start", "stop"
         *  - the new state of the auto show
         */
        var updateAutoControls = function(state){
            // if autoControlsCombine is true, replace the current control with the new state 
            if(slider.settings.autoControlsCombine){
                slider.controls.autoEl.html(slider.controls[state]);
            // if autoControlsCombine is false, apply the "active" class to the appropriate control 
            }else{
                slider.controls.autoEl.find('a').removeClass('active');
                slider.controls.autoEl.find('a:not(.bx-' + state + ')').addClass('active');
            }
        }
        
        /**
         * Updates the direction controls (checks if either should be hidden)
         */
        var updateDirectionControls = function(){
            // if infiniteLoop is false and hideControlOnEnd is true
            if(!slider.settings.infiniteLoop && slider.settings.hideControlOnEnd){
                // if first slide
                if (slider.active.index == 0){
                    slider.controls.prev.addClass('disabled');
                    slider.controls.next.removeClass('disabled');
                // if last slide
                }else if(slider.active.index == getPagerQty() - 1){
                    slider.controls.next.addClass('disabled');
                    slider.controls.prev.removeClass('disabled');
                // if any slide in the middle
                }else{
                    slider.controls.prev.removeClass('disabled');
                    slider.controls.next.removeClass('disabled');
                }
            }
        }
        
        /**
         * Initialzes the auto process
         */
        var initAuto = function(){
            // if autoDelay was supplied, launch the auto show using a setTimeout() call
            if(slider.settings.autoDelay > 0){
                var timeout = setTimeout(el.startAuto, slider.settings.autoDelay);
            // if autoDelay was not supplied, start the auto show normally
            }else{
                el.startAuto();
            }
            // if autoHover is requested
            if(slider.settings.autoHover){
                // on el hover
                el.hover(function(){
                    // if the auto show is currently playing (has an active interval)
                    if(slider.interval){
                        // stop the auto show and pass true agument which will prevent control update
                        el.stopAuto(true);
                        // create a new autoPaused value which will be used by the relative "mouseout" event
                        slider.autoPaused = true;
                    }
                }, function(){
                    // if the autoPaused value was created be the prior "mouseover" event
                    if(slider.autoPaused){
                        // start the auto show and pass true agument which will prevent control update
                        el.startAuto(true);
                        // reset the autoPaused value
                        slider.autoPaused = null;
                    }
                });
            }
        }
        
        /**
         * Initialzes the ticker process
         */
        var initTicker = function(){
            var startPosition = 0;
            // if autoDirection is "next", append a clone of the entire slider
            if(slider.settings.autoDirection == 'next'){
                el.append(slider.children.clone().addClass('bx-clone'));
            // if autoDirection is "prev", prepend a clone of the entire slider, and set the left position
            }else{
                el.prepend(slider.children.clone().addClass('bx-clone'));
                var position = slider.children.first().position();
                startPosition = slider.settings.mode == 'horizontal' ? -position.left : -position.top;
            }
            setPositionProperty(startPosition, 'reset', 0);
            // do not allow controls in ticker mode
            slider.settings.pager = false;
            slider.settings.controls = false;
            slider.settings.autoControls = false;
            // if autoHover is requested
            if(slider.settings.tickerHover && !slider.usingCSS){
                // on el hover
                slider.viewport.hover(function(){
                    el.stop();
                }, function(){
                    // calculate the total width of children (used to calculate the speed ratio)
                    var totalDimens = 0;
                    slider.children.each(function(index){
                      totalDimens += slider.settings.mode == 'horizontal' ? $(this).outerWidth(true) : $(this).outerHeight(true);
                    });
                    // calculate the speed ratio (used to determine the new speed to finish the paused animation)
                    var ratio = slider.settings.speed / totalDimens;
                    // determine which property to use
                    var property = slider.settings.mode == 'horizontal' ? 'left' : 'top';
                    // calculate the new speed
                    var newSpeed = ratio * (totalDimens - (Math.abs(parseInt(el.css(property)))));
                    tickerLoop(newSpeed);
                });
            }
            // start the ticker loop
            tickerLoop();
        }
        
        /**
         * Runs a continuous loop, news ticker-style
         */
        var tickerLoop = function(resumeSpeed){
            speed = resumeSpeed ? resumeSpeed : slider.settings.speed;
            var position = {left: 0, top: 0};
            var reset = {left: 0, top: 0};
            // if "next" animate left position to last child, then reset left to 0
            if(slider.settings.autoDirection == 'next'){
                position = el.find('.bx-clone').first().position();
            // if "prev" animate left position to 0, then reset left to first non-clone child
            }else{
                reset = slider.children.first().position();
            }
            var animateProperty = slider.settings.mode == 'horizontal' ? -position.left : -position.top;
            var resetValue = slider.settings.mode == 'horizontal' ? -reset.left : -reset.top;
            var params = {resetValue: resetValue};
            setPositionProperty(animateProperty, 'ticker', speed, params);
        }
        
        /**
         * Initializes touch events
         */
        var initTouch = function(){
            // initialize object to contain all touch values
            slider.touch = {
                start: {x: 0, y: 0},
                end: {x: 0, y: 0}
            }
            slider.viewport.bind('touchstart', onTouchStart);
        }
        
        /**
         * Event handler for "touchstart"
         *
         * @param e (event) 
         *  - DOM event object
         */
        var onTouchStart = function(e){
            if(slider.working){
                e.preventDefault();
            }else{
                // record the original position when touch starts
                slider.touch.originalPos = el.position();
                var orig = e.originalEvent;
                // record the starting touch x, y coordinates
                slider.touch.start.x = orig.changedTouches[0].pageX;
                slider.touch.start.y = orig.changedTouches[0].pageY;
                // bind a "touchmove" event to the viewport
                slider.viewport.bind('touchmove', onTouchMove);
                // bind a "touchend" event to the viewport
                slider.viewport.bind('touchend', onTouchEnd);
            }
        }
        
        /**
         * Event handler for "touchmove"
         *
         * @param e (event) 
         *  - DOM event object
         */
        var onTouchMove = function(e){
            e.preventDefault();
            if(slider.settings.mode != 'fade'){
                var orig = e.originalEvent;
                var value = 0;
                // if horizontal, drag along x axis
                if(slider.settings.mode == 'horizontal'){
                    var change = orig.changedTouches[0].pageX - slider.touch.start.x;
                    value = slider.touch.originalPos.left + change;
                // if vertical, drag along y axis
                }else{
                    var change = orig.changedTouches[0].pageY - slider.touch.start.y;
                    value = slider.touch.originalPos.top + change;
                }
                setPositionProperty(value, 'reset', 0);
            }
        }
        
        /**
         * Event handler for "touchend"
         *
         * @param e (event) 
         *  - DOM event object
         */
        var onTouchEnd = function(e){
            slider.viewport.unbind('touchmove', onTouchMove);
            var orig = e.originalEvent;
            var value = 0;
            // record end x, y positions
            slider.touch.end.x = orig.changedTouches[0].pageX;
            slider.touch.end.y = orig.changedTouches[0].pageY;
            // if fade mode, check if absolute x distance clears the threshold
            if(slider.settings.mode == 'fade'){
                var distance = Math.abs(slider.touch.start.x - slider.touch.end.x);
                if(distance >= slider.settings.swipeThreshold){
                    slider.touch.start.x > slider.touch.end.x ? el.goToNextSlide() : el.goToPrevSlide();
                    el.stopAuto();
                }
            // not fade mode
            }else{
                var distance = 0;
                // calculate distance and el's animate property
                if(slider.settings.mode == 'horizontal'){
                    distance = slider.touch.end.x - slider.touch.start.x;
                    value = slider.touch.originalPos.left;
                }else{
                    distance = slider.touch.end.y - slider.touch.start.y;
                    value = slider.touch.originalPos.top;
                }
                // if not infinite loop and first / last slide, do not attempt a slide transition
                if(!slider.settings.infiniteLoop && ((slider.active.index == 0 && distance > 0) || (slider.active.last && distance < 0))){
                    setPositionProperty(value, 'reset', 200);
                }else{
                    // check if distance clears threshold
                    if(Math.abs(distance) >= slider.settings.swipeThreshold){
                        distance < 0 ? el.goToNextSlide() : el.goToPrevSlide();
                        el.stopAuto();
                    }else{
                        // el.animate(property, 200);
                        setPositionProperty(value, 'reset', 200);
                    }
                }
            }
            slider.viewport.unbind('touchend', onTouchEnd);
        }
        
        /**
         * ===================================================================================
         * = PUBLIC FUNCTIONS
         * ===================================================================================
         */
        
        /**
         * Performs slide transition to the specified slide
         *
         * @param slideIndex (int) 
         *  - the destination slide's index (zero-based)
         *
         * @param direction (string) 
         *  - INTERNAL USE ONLY - the direction of travel ("prev" / "next")
         */
        el.goToSlide = function(slideIndex, direction){
            // if plugin is currently in motion, ignore request
            if(slider.working || slider.active.index == slideIndex) return;
            // declare that plugin is in motion
            slider.working = true;
            // store the old index
            slider.oldIndex = slider.active.index;
            // if slideIndex is less than zero, set active index to last child (this happens during infinite loop)
            if(slideIndex < 0){
                slider.active.index = getPagerQty() - 1;
            // if slideIndex is greater than children length, set active index to 0 (this happens during infinite loop)
            }else if(slideIndex >= getPagerQty()){
                slider.active.index = 0;
            // set active index to requested slide
            }else{
                slider.active.index = slideIndex;
            }
            // onSlideBefore, onSlideNext, onSlidePrev callbacks
            slider.settings.onSlideBefore(slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index);
            if(direction == 'next'){
                slider.settings.onSlideNext(slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index);
            }else if(direction == 'prev'){
                slider.settings.onSlidePrev(slider.children.eq(slider.active.index), slider.oldIndex, slider.active.index);
            }
            // check if last slide
            slider.active.last = slider.active.index >= getPagerQty() - 1;
            // update the pager with active class
            if(slider.settings.pager) updatePagerActive(slider.active.index);
            // // check for direction control update
            if(slider.settings.controls) updateDirectionControls();
            // if slider is set to mode: "fade"
            if(slider.settings.mode == 'fade'){
                // if adaptiveHeight is true and next height is different from current height, animate to the new height
                if(slider.settings.adaptiveHeight && slider.viewport.height() != getViewportHeight()){
                    slider.viewport.animate({height: getViewportHeight()}, slider.settings.adaptiveHeightSpeed);
                }
                // fade out the visible child and reset its z-index value
                slider.children.filter(':visible').fadeOut(slider.settings.speed).css({zIndex: 0});
                // fade in the newly requested slide
                slider.children.eq(slider.active.index).css('zIndex', 51).fadeIn(slider.settings.speed, function(){
                    $(this).css('zIndex', 50);
                    updateAfterSlideTransition();
                });
            // slider mode is not "fade"
            }else{
                // if adaptiveHeight is true and next height is different from current height, animate to the new height
                if(slider.settings.adaptiveHeight && slider.viewport.height() != getViewportHeight()){
                    slider.viewport.animate({height: getViewportHeight()}, slider.settings.adaptiveHeightSpeed);
                }
                var moveBy = 0;
                var position = {left: 0, top: 0};
                // if carousel and not infinite loop
                if(!slider.settings.infiniteLoop && slider.carousel && slider.active.last){
                    if(slider.settings.mode == 'horizontal'){
                        // get the last child position
                        var lastChild = slider.children.eq(slider.children.length - 1);
                        position = lastChild.position();
                        // calculate the position of the last slide
                        moveBy = slider.viewport.width() - lastChild.width();
                    }else{
                        // get last showing index position
                        var lastShowingIndex = slider.children.length - slider.settings.minSlides;
                        position = slider.children.eq(lastShowingIndex).position();
                    }
                    // horizontal carousel, going previous while on first slide (infiniteLoop mode)
                }else if(slider.carousel && slider.active.last && direction == 'prev'){
                    // get the last child position
                    var eq = slider.settings.moveSlides == 1 ? slider.settings.maxSlides - getMoveBy() : ((getPagerQty() - 1) * getMoveBy()) - (slider.children.length - slider.settings.maxSlides);
                    var lastChild = el.children('.bx-clone').eq(eq);
                    position = lastChild.position();
                // if infinite loop and "Next" is clicked on the last slide
                }else if(direction == 'next' && slider.active.index == 0){
                    // get the last clone position
                    position = el.find('.bx-clone').eq(slider.settings.maxSlides).position();
                    slider.active.last = false;
                // normal non-zero requests
                }else if(slideIndex >= 0){
                    var requestEl = slideIndex * getMoveBy();
                    position = slider.children.eq(requestEl).position();
                }
                // plugin values to be animated
                var value = slider.settings.mode == 'horizontal' ? -(position.left - moveBy) : -position.top;
                setPositionProperty(value, 'slide', slider.settings.speed);
            }
        }
        
        /**
         * Transitions to the next slide in the show
         */
        el.goToNextSlide = function(){
            // if infiniteLoop is false and last page is showing, disregard call
            if (!slider.settings.infiniteLoop && slider.active.last) return;
            var pagerIndex = slider.active.index + 1;
            el.goToSlide(pagerIndex, 'next');
        }
        
        /**
         * Transitions to the prev slide in the show
         */
        el.goToPrevSlide = function(){
            // if infiniteLoop is false and last page is showing, disregard call
            if (!slider.settings.infiniteLoop && slider.active.index == 0) return;
            var pagerIndex = slider.active.index - 1;
            el.goToSlide(pagerIndex, 'prev');
        }
        
        /**
         * Starts the auto show
         *
         * @param preventControlUpdate (boolean) 
         *  - if true, auto controls state will not be updated
         */
        el.startAuto = function(preventControlUpdate){
            // if an interval already exists, disregard call
            if(slider.interval) return;
            // create an interval
            slider.interval = setInterval(function(){
                slider.settings.autoDirection == 'next' ? el.goToNextSlide() : el.goToPrevSlide();
            }, slider.settings.pause);
            // if auto controls are displayed and preventControlUpdate is not true
            if (slider.settings.autoControls && preventControlUpdate != true) updateAutoControls('stop');
        }
        
        /**
         * Stops the auto show
         *
         * @param preventControlUpdate (boolean) 
         *  - if true, auto controls state will not be updated
         */
        el.stopAuto = function(preventControlUpdate){
            // if no interval exists, disregard call
            if(!slider.interval) return;
            // clear the interval
            clearInterval(slider.interval);
            slider.interval = null;
            // if auto controls are displayed and preventControlUpdate is not true
            if (slider.settings.autoControls && preventControlUpdate != true) updateAutoControls('start');
        }
        
        /**
         * Returns current slide index (zero-based)
         */
        el.getCurrentSlide = function(){
            return slider.active.index;
        }
        
        /**
         * Returns number of slides in show
         */
        el.getSlideCount = function(){
            return slider.children.length;
        }
        
        /**
         * Makes slideshow responsive
         */
        // first get the original window dimens (thanks alot IE)
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        $(window).resize(function(){
            // get the new window dimens (again, thank you IE)
            var windowWidthNew = $(window).width();
            var windowHeightNew = $(window).height();
            // make sure that it is a true window resize
            // *we must check this because our dinosaur friend IE fires a window resize event when certain DOM elements
            // are resized. Can you just die already?*
            if(windowWidth != windowWidthNew || windowHeight != windowHeightNew){
                // set the new window dimens
                windowWidth = windowWidthNew;
                windowHeight = windowHeightNew;
                // resize all children in ratio to new screen size
                slider.children.add(el.find('.bx-clone')).width(getSlideWidth());
                // adjust the height
                slider.viewport.css('height', getViewportHeight());
                // if active.last was true before the screen resize, we want
                // to keep it last no matter what screen size we end on
                if (slider.active.last) slider.active.index = getPagerQty() - 1;
                // if the active index (page) no longer exists due to the resize, simply set the index as last
                if (slider.active.index >= getPagerQty()) slider.active.last = true;
                // if a pager is being displayed and a custom pager is not being used, update it
                if(slider.settings.pager && !slider.settings.pagerCustom){
                    populatePager();
                    updatePagerActive(slider.active.index);
                }
                // update the slide position
                if(!slider.settings.ticker) setSlidePosition();
            }
        });
        
        init();
        
        // returns the current jQuery object
        return this;
    }

})(jQuery);

/*!
 * jQuery imagesLoaded plugin v2.1.0
 * http://github.com/desandro/imagesloaded
 *
 * MIT License. by Paul Irish et al.
 */

/*jshint curly: true, eqeqeq: true, noempty: true, strict: true, undef: true, browser: true */
/*global jQuery: false */

(function(c,n){var l="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";c.fn.imagesLoaded=function(f){function m(){var b=c(i),a=c(h);d&&(h.length?d.reject(e,b,a):d.resolve(e));c.isFunction(f)&&f.call(g,e,b,a)}function j(b,a){b.src===l||-1!==c.inArray(b,k)||(k.push(b),a?h.push(b):i.push(b),c.data(b,"imagesLoaded",{isBroken:a,src:b.src}),o&&d.notifyWith(c(b),[a,e,c(i),c(h)]),e.length===k.length&&(setTimeout(m),e.unbind(".imagesLoaded")))}var g=this,d=c.isFunction(c.Deferred)?c.Deferred():
0,o=c.isFunction(d.notify),e=g.find("img").add(g.filter("img")),k=[],i=[],h=[];c.isPlainObject(f)&&c.each(f,function(b,a){if("callback"===b)f=a;else if(d)d[b](a)});e.length?e.bind("load.imagesLoaded error.imagesLoaded",function(b){j(b.target,"error"===b.type)}).each(function(b,a){var d=a.src,e=c.data(a,"imagesLoaded");if(e&&e.src===d)j(a,e.isBroken);else if(a.complete&&a.naturalWidth!==n)j(a,0===a.naturalWidth||0===a.naturalHeight);else if(a.readyState||a.complete)a.src=l,a.src=d}):m();return d?d.promise(g):
g}})(jQuery);;//this needs to be properly global for GA to work
var _gaq = _gaq || [];

/**
 * The main CASS wrapper object
 * @version $Revision: 6291 $ ($Date: 2012-09-05 16:06:30 +0100 (Wed, 05 Sep 2012) $)
 * @author City Web Team
 */
var CASS = (function(w, Modernizr, yepnope) {

    "use strict";

    var

    /**
     * The object to hold all loadable scripts, add an object here to allow it's loading in a page
     *
     * Each child object has three properties:
     *   description: a short description of the script
     *           src: the filename of the script
     *       [async]: Whether to load the script asynchronously (assumed false unless given)
     *
     * @var Object
     */
    scripts = {
        googleAnalytics: {
            description: "google Analytics tracking code",
            src: "lib/ga.js",
            async: true
        },
        flowplayer: {
            description: "include flowplayer for pages with videos",
            src: "lib/flowplayer/flowplayer-3.2.4.min.js"
        },
        flowplayerEmbed: {
            description: "Embed code for flowplayer",
            src: "lib/flowplayer/flowplayer.embed-3.0.3.min.js"
        },
        swfobject: {
            description: "swfobject for youtube video(s)",
            src: "lib/swfobject/swfobject.js"
        },
        galleria: {
            description: "JQuery image gallery plugin",
            src: "lib/jquery/plugins/galleria/galleria-1.2.9/galleria-1.2.9.min.js"
        },
        galleriaTheme: {
            description: "city galleria theme",
            src: "lib/jquery/plugins/galleria/themes/city/galleria.city.min.js"
        },
        highcharts: {
            description: "JQuery charting plugin",
            src: "lib/jquery/plugins/highcharts/highcharts.js"
        },
        shadowbox: {
            description: "script to display a modal window",
            src: "lib/shadowbox/shadowbox.js"
        }
    },

    /***************************************************************************
     * GLOBAL VARIABLES
     ***************************************************************************/

    /**
     * What level of debugging is required (currently binary 0 or 1, no debug messages or all)
     * @var Integer
     */
    debugLevel = 0,

    /**
     * cache window.location
     */
     windowLocation = w.location,

    /**
     * The location of external scripts (with trailing slash)
     * @var String
     */
    srcPrefix = "//" + windowLocation.hostname.replace(/www|intranet/, "s1").replace("cass.", "") + "/cassrmain/js/",

    /**
     * A standard time limit to use in intervals
     * @var int
     */
    //defined not used, intervalTime = 250,

    /**
     * An object literal to hold intervals, utility array
     * @var int
     */
    // defined not used, intervals = {},

    /**
     * Google Analytics global variable
     */
    //ga = null,

    /**
     * Google Analytics tracking ID, set in page
     */
    gaAccount = null,

    /**
     * The version number to prepend to the file name, set in page
     * @var String
     */
    version = w.CITY_VERSION || "123456789.",

    /**
     * used for detecting download filetypes by extension
     */
    // defined not used, downloadFileTypes = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "pps", "ppsx",
//"pdf", "jpg", "png", "gif", "zip", "txt", "rtf", "mp3"],

    /**
     * are we on the Cass sub-domain?
     */
    isCass = windowLocation.hostname.indexOf("cass.city.ac.uk") !== -1,

    /**
     * are we on the Bunhill sub-domain?
     */
    isBunhill = windowLocation.hostname.indexOf("bunhill.city.ac.uk") !== -1,

    /**
     * Our design breakpoints as defined in _mixin_pages.scss
     */
    breakpoints = {
        "thin" : 320,
        "medium": 768,
        "thinish": 480,
        "wide": 980,
        "wider" : 1200
    },

    /**
     * Screen size on load, set in initPage
     */
    screenSize,

    /***************************************************************************
     * USEFUL GLOBAL FUNCTIONS
     ***************************************************************************/

    /**
     * Sends a message to the browser console (Gecko, Webkit) or into the <body> (IE)
     * @param {String} message: the message to print out
     */
    debug = function(message) {

        var debugContainer, elmt;

        if (debugLevel > 0 || location.search.match("debug")) {

            try {
                //for Safari, Chrome, Firefox(w/ firebug)
                w.console.log(message);
            } catch (e) {
                try {
                    //for Opera
                    opera.postError.apply(opera, message);
                } catch (e1) {
                    //for IE

                    //create a debug container (if none exists)
                    debugContainer = document.getElementById("debugContainer");
                    if (!debugContainer) {
                        debugContainer = document.createElement("div");
                        debugContainer.setAttribute("id", "debugContainer");
                        debugContainer.setAttribute("class", "hide");
                        document.getElementsByTagName("body").item(0).appendChild(debugContainer);
                    }
                    elmt = document.createElement("pre");
                    elmt.setAttribute("class", "debug");
                    elmt.appendChild(document.createTextNode(message));
                    debugContainer.appendChild(elmt);
                }
            } //end IE catch block

        }

    },

    /**
     * Lazyload function, now proxies to yepnope
     *
     * @param {Object} jsHandle: The Object from CASS.scripts to load
     * @param {String} callback: The name of the callback to be executed after this script has loaded
     */
    load = function(jsHandle, callback) {

        //work out full path
        var path = (function() {

            var script = scripts[jsHandle];

            if (/^https?:\/\//.test(script.src)) {
                return script.src;
            }

            return srcPrefix + (/plugins|lib/.test(script.src) ? "" : "modules/") + script.src;

        }());

        yepnope({
            load: path,
            callback: callback
        });

    },

    setVersion = function(v) {
        version = v;
    },

    setGaAccount = function(gaa) {
        gaAccount = gaa;
    },

    /**
     * returns the size of an object
     */
    objectSize = function(object) {

        var size = 0, key;

        for (key in object) {
            if (object.hasOwnProperty(key)) {
                size += 1;
            }
        }

        return size;

    },

    /**
     * returns true if a number is even
     * @param {Number} value
     * @return {Boolean}
     */
    isEven = function(value) {

        if (value % 2 === 0) {
            return true;
        } else {
            return false;
        }

    },

    /**
     * Read a page's GET URL variables and return them as an associative array.
     */
    getUrlVars = function() {

        var vars = [],
            hash,
            i = 0,
            hashes = windowLocation.href.slice(windowLocation.href.indexOf("?") + 1).split("&");

        for (i; i < hashes.length; i = i + 1) {

            hash = hashes[i].split("=");
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }

        return vars;

    },

    // Array Remove - By John Resig (MIT Licensed)
    //defined not used
/*    arrayRemove = function(array, from, to) {

        var rest = array.slice((to || from) + 1 || array.length);

        array.length = from < 0 ? array.length + from : from;

        return array.push.apply(array, rest);

    },*/

    /**
     * gets window width
     * @param: {Object} - window object
     * @return: {Number} - window width
     */
    getWindowWidth = function(w) {
        return Math.round($(w).width());
    },

    /**
     * returns true if the viewport size has changed -
     * useful in responsive layout, see
     * snook.ca/archives/javascript/ie6_fires_onresize
     */
    viewportChanged = function() {

        var changed = false,
            docEl = w.document.documentElement,
            coolOff = 20, //further calls within this window get
            //the same return value
            now = Date.now ? Date.now() : (function() {
                return new Date().valueOf();
            }());

        //set up a holder object (if it doesn't exist)
        w.viewport = w.viewport || {};

        //these need zeroing before we begin (if not already set)
        w.viewport.dimensions = w.viewport.dimensions || {height: null, width: null};

        //need to handle the situation where many calls to this
        //function happen in quick succession
        if (w.viewport.timeStamp && now - w.viewport.timeStamp < coolOff) {
            debug("within window, returning " + w.viewport.storedResult);
            return w.viewport.storedResult;
        }

        //store the time of this call
        w.viewport.timeStamp = now;

        //have we changed viewport size?
        if (w.viewport.dimensions.width !== docEl.clientWidth ||
                w.viewport.dimensions.height !== docEl.clientHeight) {
            changed = true;
        }

        //store new dimensions
        w.viewport.dimensions.height = docEl.clientHeight;
        w.viewport.dimensions.width = docEl.clientWidth;

        //store this result in case of a re-call within coolOff
        w.viewport.storedResult = changed;

        debug("viewport changed: " + changed);

        return changed;

    },

    /***************************************************************************
     * BEGIN CASS MODULES
     ***************************************************************************/

    /**
     * Initialises shadowbox
     * @param {Object} $shadowbox - link containing DOM elements with a class of "shadowbox"
     * @return {Undefined}
     */
    initShadowbox = function() {

/*        $("a[rel=\"shadowbox\"]").click(function() {

        });*/

        Shadowbox.init();

    },

    /*
     * sets up a carousel on a page
     * @param carouselObj : Object
     *
     */
    createSlider = function($carouselObj) {

        var numSlides = $carouselObj.children().length,
            initSlider = function() {
                var options = {
                    auto: true,
                    autoControls: true,
                    pause: 15000,
                    autoHover: true,
                    touchEnabled: false,
                    mode: "fade",
                    startText: "<i class=\"icon-play\"></i>",
                    stopText: "<i class=\"icon-pause\"></i>",
                    nextText: "<i class=\"icon-caret-right\"></i>",
                    prevText: "<i class=\"icon-caret-left\"></i>",
                    adaptiveHeight: true
                };

                $carouselObj.bxSlider(options);
                $carouselObj.removeClass("loading");
                //$(".bxslider").show();
                //$(".bx-controls").show();
            };

        //set up slider
        if (numSlides > 1) {
            CASS.debug("more than 1 slide, need carousel. NumSlides =" + numSlides);
            initSlider($carouselObj);
        }
    },

    /**
     * Create a image Gallery
     *
     * @param {Object} a jquery object representing a single instance of a gallery
     * @param {Boolean} true if the gallery is in a widget, false if in main content body
     * @return {Object || Undefined} returns the galleria jQuery object if
     * successful else undefined - for instance if $gallery is not a jQuery object
     *
     */
    createGallery = function($gallery) {

        var data = {
                src: "/apis/galleries/galleria-json?root=",
                root: ""
            },
            $loader = $("<span class=\"loading\">loading</span>"),
            $galleryInner,
            //some default options
            galleriaOptions = {
                height: 0.5625,
                lightbox: false,
                maxScaleRatio: 1,
                preload: 2,
                showInfo: false,
                imageCrop: false,
                debug: true,
                extend: function(/* defined but not used: options */) {

                    if ("city" === $gallery.attr("data-theme")) {
                        $gallery.prepend($("<div/>", {
                            "class": "cg-caption"
                        }));

                        /*loadstart is triggered every time galleria loads an image*/
                        this.bind("loadstart", function(e) {
                            var data = this._data[e.index],
                                    //$caption is refound here as it needs to be scoped to this gallery
                                    $caption = $gallery.find(".cg-caption");

                            if (data.m_caption) {
                                $caption.html(data.m_caption);
                            } else {
                                $caption.html("&nbsp;");
                            }

                        });

                    }
                }
            },
            galleriaThemeCallback = function() {

                //get id of root from id of gallery div
                data.root = $gallery.attr("id").replace("gallery-", "");

                $.getJSON(data.src + data.root, function(data) {
                    //remove loader
                    $loader.hide();
                    $gallery.css("opacity", "1");
                    galleriaOptions.data_source = data;
                    $galleryInner.galleria(galleriaOptions);
                });

                return $galleryInner;

            };
        //end vars

        //some checks before we go further
        if (!$gallery || $gallery.length === 0) {
            debug("$gallery is undefined or not a jQuery object");
            return;
        } else {
            $galleryInner = $gallery.find(".gallery-inner");
        }

        //return if no stage found
        if ($galleryInner.length === 0) {
            debug("no stage found");
            return;
        }

        //set some options from $galleryInner classes - this are set as metadata on the gallery folder
        if ($galleryInner.hasClass("lightbox")) {
            galleriaOptions.lightbox = true;
        }

        if ($galleryInner.hasClass("caption")) {
            galleriaOptions.showInfo = true;
        }

        //add loading gif
        $gallery.prepend($loader);

        yepnope({
            load: ["lib/jquery/plugins/galleria/galleria-1.2.9/galleria-1.2.9.min.js",
                "lib/jquery/plugins/galleria/galleria-1.2.9/themes/city/galleria.city.js"],
            complete: galleriaThemeCallback
        });
    }, //end createGallery

    initGoogleAnalytics = function() {

        //bail if gaAccount has not been set
        if (!gaAccount) {
            debug("need to call CASS.setGaAccount(), before initialising google analytics");
            return;
        }

        //Enhanced link attribution
        var pluginUrl = "//www.google-analytics.com/plugins/ga/inpage_linkid.js";

        _gaq.push(["_require", "inpage_linkid", pluginUrl]);

        //_gaq defined at top of this file
        _gaq.push(["_setAccount", gaAccount]);

        if (!CASS.isCass) {

            _gaq.push(["_setDomainName", ".city.ac.uk"]);

        } else if (CASS.isCass || CASS.isBunhill) {

            // as per instructions from Simon W, the "none" was used with setDomainName and setAllowedLinker added
            //_gaq.push(["_setDomainName", ".cass.city.ac.uk"]);

            _gaq.push(["_setDomainName", ".city.ac.uk"]);
            _gaq.push(["_setAllowedLinker", "true"]);

        }

        _gaq.push(["_trackPageview"]);
        _gaq.push(["_trackPageLoadTime"]);

        //this will pull in ga.js, which does whatever _gaq is set up to do.
        load("googleAnalytics");

    },



    /**
     * adds autocomplete functionality to the main search bar, using jQuery UI
     * @param: {Object} form - jQuery object for form to run autoSuggest on
     * @param: {Object} input - jQuery object for input elements to run autoSuggest on
     * @param: {String} collection - the name of the Funnelback collection to query
     * @retun: {Undefined}
     */
    searchAutoComplete = function(form, input, collection) {

        input.autocomplete({
            source: function(request, response) {

                $.ajax({
                    url: "/mirror/fb-prod/padre-qs-core.cgi?collection=" + collection + "&fmt=json",
                    dataType: "json",
                    data: {
                        partial_query: request.term
                    },
                    success: function(data) {
                        response($.map(data, function(item) {
                            return {
                                label: item
                            };
                        }));
                    }
                }); //end $.ajax

            }, //end source function

            minLength: 2,
            delay: 20,

            //when you have selected something
            "select": function(event, ui) {
                //close the drop down
                //need to create a dummy assignment, to please jslint
                //close is still performed

                var c = this.close;

                //make sure on click the selected value replaces the type value
                $(this).val(ui.item.value);
                form.submit();

            },
            //show the drop down
            open: function() {
                $(this).removeClass("ui-corner-all").addClass("ui-corner-top");
            },
            //close the drop down
            close: function() {
                $(this).removeClass("ui-corner-top").addClass("ui-corner-all");
            }

        });
    },

    /**
     * Finds any vid images on a page and replaces them with either a YouTube iframe or SWFObject for FMS vids
     * @return: Undefined
     */
    videos = function () {

        var $youtubeVids = $("img.youtube"),
            $fmsVids = $("img.fms"),

            /*
             * Replaces an image element with YouTube iFrame
             * @param: {Object} : $el - jQuery object for youTube images to be replaced
             * @retun: {Undefined}
             */
            embedYoutube = function ($youtubeVids) {

                $youtubeVids.each(function (i, el) {

                    var $el = $(el),
                        vidWidth = 500, // default width
                        vidHeight = 320, // default height
                        videoID = $el.attr("id").replace("vid_", "");

                    $el.replaceWith("<div class=\"embed-wrapper\"><div class=\"embed-container\"><iframe height=" + vidHeight +  " width= " + vidWidth + " src=\"http://www.youtube.com/embed/" + videoID + "?rel=0\" frameborder='0' allowfullscreen></iframe></div></div>" );
                });
            },

            /*
             * Replaces an image element with SWF Object
             * @param: {Object} : $el - jQuery object for all fms images to be replaced
             * @retun: {Undefined}
             */
            embedFms = function ($fmsVids) {

                var splashImages = {
                        cassStandard : "//s1.city.ac.uk/i/flowplayer-cass.jpg",
                        cassRetina : "",
                        cityStandard : "//s1.city.ac.uk/i/flowplayer-city.jpg?v=8101",
                        cityRentina : ""
                    };

                $fmsVids.each(function (i, el) {

                    var $el = $(el),
                        vidWidth = 687, //default width
                        vidHeight = 419, // default height
                        elId = $el.attr("id"),
                        vidId = elId.replace("vid_", ""),
                        expressInstall = "//s1.city.ac.uk/js/swfobject/expressInstall.swf",
                        flashtargetversion = "9.0.28",
                        flashvars = null,
                        params = {
                            allowScriptAccess: "always",
                            allowfullscreen: "true",
                            wmode: "transparent"
                        },
/*                        atts = {
                            "class": "vidplayer",
                            id: vidId
                        },*/
                        splashImage = CITY.isCass ? splashImages.cassStandard : splashImages.cityStandard,
                        swfCallBack = function(e) {
                            $(e.ref).wrap("<div class=\"embed-wrapper\" style=\"width:" + vidWidth + "px\"><div class=\"embed-container\"></div></div>");
                        };

                    //if video is included in the course description div of a course N page, width needs to be 419
                    if ($el.parents(".course-description").length !== 0) {
                        vidWidth = 419;
                    }

                    //vids have different sizes depending on the size of the content div and if they are widescreen on square
                    if ($el.hasClass("widescreen")) {
                        vidHeight = vidWidth * 0.61;
                    } else {
                        vidWidth = 500;
                        vidHeight = 320;
                    }

                    if (!swfobject.hasFlashPlayerVersion(flashtargetversion)) {

                        //explain why there is no video
                        $el.after("<p class=\"notice-message\"><i class=\"icon-warning-sign\" style=\"color : #CCCC00\"></i> You need to have flash player " +
                            flashtargetversion  + " or greater installed to see the video.</p>" +
                            "<p><a href=\"http://get.adobe.com/flashplayer/\">Get Flash Player</a></p>");


                    } else {

                        //config has to be in a string and key and values have to be "quoted" - nightmare
                        // construct all the variables to pass to the player -
                        // tried to make this a proper json array, didn't work :(
                        // IE doesn't like double quotes here so ignore JSHint error

                        /* jshint -W018 */
                        flashvars = "{'clip': {'provider': 'rtmp'}, 'playlist': [{'url':'" + splashImage + "', 'autoPlay': true}, {'url': '" + vidId.replace('vid_', '') + "/Hi_bandwidth', 'autoPlay': false, 'scaling': 'fit'}], 'plugins': {'rtmp': {'url': 'http://s1.city.ac.uk/js/flowplayer/flowplayer.rtmp-3.2.3.swf', 'netConnectionUrl': 'rtmp://media.city.ac.uk/flowplayer', 'objectEncoding': '0', 'proxyType': 'none' }, 'controls': {'url': 'flowplayer.controls.swf'} } }";
                        /* jshint +W018 */

                        // initiate the player
                        swfobject.embedSWF(
                            "http://s1.city.ac.uk/js/flowplayer/flowplayer-3.2.6.swf",
                            elId,
                            vidWidth,
                            vidHeight,
                            "9.0.0",
                            expressInstall,
                            { config: flashvars },
                            params,
                            false,
                            swfCallBack
                        );

                    } //end has flash if

                });
            };

        if ($youtubeVids.length) {
            embedYoutube($youtubeVids);
        }
        if ($fmsVids.length) {
            yepnope({
                load: scripts.swfobject.src,
                callback : function () {
                    embedFms($fmsVids);
                }
            });
        }

    }, // end videos

    /**
     * creates the You Tube module - a UI component featuring a carousel of videos and a featured video area. Clicking on one of the slides
     * updates the featured video, plus the title, description, views and share links. Requires Underscore.js
     * @param {Object} ytModule a jQuery Object representing the container for the ytModule.
     * @return {Undefined}
     */
    ytModule = function($ytModule) {

        var ytUrl,
            vl,
            fv,
            /*
             * constructor for FeaturedVideo obj
             * @param {String} el - a jQuery selector for the FeaturedVideo container
             * @return {Object} Returns a newa FeaturedVideo obj
             * @constructor
             */
            FeaturedVideo = function(el) {
                if (!(this instanceof FeaturedVideo)) {
                    return new FeaturedVideo(el);
                }
                this.el = el;
                this.$el = $(el);
                this.player = $("#yt-video-player");
                /* jshint -W015 */
                this.tmpl = [
                    "<div class=\"span14\">",
                        "<div id=\"yt-video-player\" class=\"yt-video-player\">",
                            "<div class=\"embed-wrapper\">",
                                "<div class=\"embed-container\">",
                                    "<iframe src=\"http://www.youtube.com/embed/<%= data.id %>?rel=0\" frameborder=\"0\" allowfullscreen></iframe>",
                                "</div>",
                            "</div>",
                        "</div>",
                    "</div>",
                    "<div class=\"span10\">",
                        "<div class=\"video-meta\">",
                            "<h2 class=\"video-title\"><%= data.title %></h2>",
                            "<p class=\"video-description\"><%= data.description %></p>",
                            "<p class=\"video-views\">Views : <%= data.views %></p>",
                            "<p class=\"social-flat-links\">",
                                "<span class=\"facebook social-btn\"><a href=\"https://www.facebook.com/dialog/feed?app_id=141996839165515&amp;redirect_uri=<% window.location.href %>&amp;link=<%= data.player %>\"><i class=\"icon-facebook\"></i>Facebook</a></span>",
                                "<span class=\"twitter social-btn\"><a href=\"https://twitter.com/intent/tweet?url=<%= data.player %>&amp;title=<%= data.title %>\"><i class=\"icon-twitter\"></i>Twitter</a></span>",
                                "<span class=\"google social-btn\"><a href=\"https://plus.google.com/share?url=<%= data.player %>\"><i class=\"icon-google-plus\"></i>Google +</a></span>",
                            "</p>",
                        "</div>",
                    "<div>",
                ].join("\n");
                /* jshint +W015 */

                return this;
            },
            /*
             * constructor for VideosList obj
             * @param {String} el - a jQuery selector for the VideosList container
             * @return {Object} Returns a new VideosList obj
             * @constructor
             */
            VideosList = function(el) {
                if (!(this instanceof VideosList)) {
                    return new VideosList(el);
                }
                this.el = el;
                this.$el = $(el);
                /* jshint -W015 */
                this.tmpl = [
                    "<li data-video-id=\"<%= data.id %>\" data-video-title=\"<%= data.title %>\" data-video-description=\"<%= data.description %>\" data-video-player=\"<%= data.player %>\" data-video-views=\"<%= data.views %>\" class=\"video event event-video <%= data.activeClass %>\">",
                        "<a href=\"http://www.youtube.com/embed/<%= data.id %>\" class=\"video-link\">",
                            "<img src=\"<%= data.thumbnail %>\" />",
                        "</a>",
                        "<p class=\"video-title\">",
                            "<a href=\"http://www.youtube.com/embed/<%= data.id %>\" class=\"video-link\"><%= data.title %></a>",
                        "</p>",
                        "<p class=\"video-views\"><span class=\"view-count\"><%= data.views %></span> views</p>",
                    "</li>"
                ].join("\n");
                /* jshint +W015 */

                return this;
            };

            // end ytModule var

        /*
         * @method
         * @param {Object} videoDate - updates the featured video
         */
        FeaturedVideo.prototype.update = function(videoData) {

            var newFeatured = _.template(this.tmpl, videoData, {variable: "data"});

            this.$el.addClass("loading").empty().append(newFeatured).removeClass("loading");

        };
        /*
         * @method
         * {Array} slidesArray - each element contains html for individual slides
         */
        VideosList.prototype.buildList = function(slidesArray) {
            // attach to DOM
            this.$el.append("<ul class=\"yt-videos-list\">" + slidesArray.join("") + "</ul>");

            // attach click handler
            this.videoLinks = this.$el.find(".video-link");

            this.$el.on("click", ".video-link", function(e) {
                var $self = $(this),
                    $selfParent = $self.parents(".video"),
                    videoData = {};

                e.preventDefault();

                videoData.title = $selfParent.data("video-title");
                videoData.description = $selfParent.data("video-description");
                videoData.views = $selfParent.data("video-views");
                videoData.src = $self.attr("href");
                videoData.id = $selfParent.data("video-id");
                videoData.player = $selfParent.data("video-player");

                $(".video-link").each(function() {
                    $(this).parent(".video").removeClass("active");
                });

                $selfParent.addClass("active");

                // update feature vid object
                fv.update(videoData);

                //scroll up to player
                $("html, body").animate({
                    scrollTop: $("#yt-video-player").offset().top
                }, 500);
            });

            // init slider
            this.$el.find("ul").bxSlider({
                slideWidth: 200,
                minSlides: 2,
                maxSlides: 10,
                slideMargin: 10,
                moveSlides: 1,
                infiniteLoop: true,
                nextText: "<i class=\"icon-caret-right\"></i>",
                prevText: "<i class=\"icon-caret-left\"></i>",
                touchEnabled: true,
                preventDefaultSwipeY: true,
                adaptiveHeight: true
            });
        };

        // begin

        //bail if underscore.js isn't loaded
        if (!window._) {
            CASS.debug("ytModule requires Underscore.js to be loaded");
            return;
        }

        $ytModule = $ytModule || $("#yt-module");
        fv = new FeaturedVideo("#yt-featured-video");
        vl = new VideosList("#yt-videos-list");
        ytUrl = $ytModule.data("yt-playlist");

        if (!ytUrl) {
            CASS.debug("Needs a YouTube playlist");
            return;
        }

        $.ajax({
            url: ytUrl,
            dataType: "jsonp",
            success: function(data) {

                var items = data.data.items,
                    itemsLength = items.length,
                    tmpArray = [],
                    compiled,
                    dataForTemplate,
                    i;

                for (i = 0; i < itemsLength; i++) {

                    // private videos won't have a thumbnail
                    if (items[i].video.thumbnail) {
                        dataForTemplate = {
                            title: items[i].video.title,
                            description: items[i].video.description,
                            views: items[i].video.viewCount,
                            id: items[i].video.id,
                            player: encodeURI(items[i].video.player["default"]),
                            thumbnail: items[i].video.thumbnail.hqDefault,
                            activeClass: ""
                        };
                        if (i === 0) {
                            dataForTemplate.activeClass = "active";
                            // update featured vid DOM
                            fv.update(dataForTemplate);
                        } else {
                            dataForTemplate.activeClass = "";
                        }
                        compiled = _.template(vl.tmpl, dataForTemplate, {variable: "data"});
                        // add compiled string to array
                        tmpArray[i] = compiled;

                    }
                }

                // update videos list DOM
                vl.buildList(tmpArray);

            },
            complete: function() {
                $ytModule.removeClass("loading");
            },
            error: function(jqXHR, textStatus, errorThrown) {
                CASS.debug(jqXHR, textStatus, errorThrown);
            }
        });
    },

    /**
     * creates and adds a function as the default error handler for jQuery ajax operations
     */
    initJsFailureNotifier = function() {

        var webService = "//webapps.city.ac.uk/matrix/services/jQueryError.php",
                notify = function(event, jqXHR, ajaxSettings, errorThrown) {

            //insert an "image" which has a web service as the src,
            //the web service sends email to ucs-webteam
            $("<img />", {
                src: webService + "?u=" + escape(windowLocation.href) + "&s=" +
                        escape(ajaxSettings.url) + "&t=" + ajaxSettings.type + "&e=" + escape(errorThrown),
                style: "display: none"
            }).appendTo("#footer");

        };

        //register this as a global ajax event handler
        $(document).ajaxError(notify);

    },

    /**
     * This is our yepnope filter
     *
     * splices in the version string we have set up in setVersion
     * prepends the correct s1 domain, where it hasn't been provided
     *
     * N.B. will fail if we have an s1 top level folder containing
     * dots (see comment below)
     *
     */
/*    yepnopeFilter = function(resource) {

        var loc, lastItem;

         If we are loading in an absolute url, don't touch it
         * this is the regex which fails on a top level folder with dots
         *
         * matches:
         * http://www.external.com/scripts/script.js
         * www.external.com/scripts/script.js
         * absolute.with.many.sub.domains.domain.com/scripts/script.js
         * https://absoulte.with.many.sub.domains.domain.com/scripts/script.js
         *
         * doesn't match:
         * modules/test.js
         * lib/subdir/script.js
         * lib/subdir.123/script.js
         *
         * will match when we don't want to:
         * toplevel.with.dots/script.js
         * lib.v2/jquery/script.js
         *
         * I think it's an unlikely issue, but if anyone can tweak the regex
         * to prevent this please do.
         *

        if (/^(https?:\/\/)?([^\/.]+\.)+[^\/]+\//.test(resource.url)) {
            return resource;
        }

        loc =
        //already contains s1? - don't add prefix
        ((/s1/.test(resource.url) ? "" : srcPrefix) +
        resource.url)

        //split for splicing
            .split("/");

        //splice in version
        lastItem = loc.length - 1;
        loc[lastItem] = version + loc[lastItem];

        resource.url = loc.join("/");

        // if on prod and we are loading a module/.js file
        // we want .min.js rather than .js
        if (/s1\.city/.test(resource.url) && !/js\/lib/.test(resource.url)) {
            resource.url = resource.url.replace(/js$/, "min.js");
        }

        return resource;

    },*/

    /**
     *
     * What needs to happen after a bxslider carousel has finished loading:
     * 1. inject controls into @widget. finds default bxslider controls, replace with font awesome icons and append in widget
     * 2. add scrollable class to widget content
     * 3. remove loading spinner
     * @param jQuery widget: a jquery wrapped .widget (needed for widget controls)
     * @param string middleButtonText: what to write on the middle button (defaults to "All") (needed for widget controls)
     * @param string allLink: the "all" middle button href (needed for widget controls)
     */
    afterBxSliderLoaded = function (widget, allLink, middleButtonText) {

        var leftWidgetButton = "<i class=\"icon-caret-left\"></i>",
            rightWidgetButton = "<i class=\"icon-caret-right\"></i>",
            // carousel controls
            previousButton = widget.find(".bx-prev"),
            nextButton = widget.find(".bx-next"),
            inputMiddleButtonText = middleButtonText ? middleButtonText : "All";

        previousButton.empty().append(leftWidgetButton);
        nextButton.empty().append(rightWidgetButton);
        //add the "all" button between previous and next buttons if it is needed
        if (allLink) {
            previousButton.after("<a href=\"" + allLink + "\" class=\"bx-all\" >" + inputMiddleButtonText + "</a>");
        }
        widget.find(".bx-controls-direction").appendTo(widget);

        //add class
        widget.find(".widget-content").addClass("scrollable");

        //remove widget loading spinner
        widget.removeClass("widget-loading");

    },

    /**
     * news widget
     */
    initNews = function () {

        var $newsWidget = $("#news-widget"),
            $newsList = $newsWidget.find("#news-results"),
            allLink = "//www.cass.ac.uk/news",
            showAmount = 3;

        //reformat the content into column sizes based on determined size, if there are more than showAmount items
        if ( $newsList.find("> .article").size() > showAmount ) {
            //set up sortable
            $newsList.wrapChildren({
                childElem: ".article",
                sets: showAmount
            });

            //launch bxslider
            $newsList.bxSlider({
                auto: false,
                autoControls: false,
                pause: 15000,
                autoHover: true,
                touchEnabled: false,
                pager: false,
                infiniteLoop: false,
                hideControlOnEnd: true,
                adaptiveHeight: true,
                onSliderLoad: function(){
                    afterBxSliderLoaded($newsWidget, allLink);
                }
            });
        }
        else {
            //remove widget loading spinner, case where the carousel isn't needed
            $newsWidget.removeClass("widget-loading");
        }
    },

    /**
     * events widget
     */
    initEvents = function () {

        var $eventsWidget = $("#events-widget"),
            $eventsList = $eventsWidget.find("#events-results"),
            allLink = "//www.cass.ac.uk/events",
            showAmount = 3;

        //click anywhere on event
        $($eventsList).on("click", ".vevent", function() {
            window.location = $(this).find("a").attr("href");
            return false;
        });

        if ($eventsList.find("> .vevent").size() > showAmount) {
            //sort the children into groups of showAmount
            $eventsList.wrapChildren({
                childElem: ".event",
                sets: showAmount
            });

            $eventsList.bxSlider({
                auto: false,
                autoControls: false,
                pause: 15000,
                autoHover: true,
                touchEnabled: false,
                pager: false,
                infiniteLoop: false,
                hideControlOnEnd: true,
                adaptiveHeight: true,
                onSliderLoad: function(){
                    afterBxSliderLoaded($eventsWidget, allLink);
                }
            });
        }
        else {
            //remove widget loading spinner, case where the carousel isn't needed
            $eventsWidget.removeClass("widget-loading");
        }

    },//end initEvents

    initFlickr = function () {

        var $widget = $("#flickr-widget"),
            $slideWrapper = $widget.find("ul"),
            loadedOtherPics,
            bxSliderCallback = function () {

                debug("flickr callback...");

                $(".widget-content", $widget).each(function () {

                    //find the ul
                    var firstdiv = $("ul div:first-child", this),
                        //ul = $("ul", this), defined not used
                        thisJq = $(this),
                        height = firstdiv.height(),
                        width = firstdiv.width();

                    //add classes
                    thisJq.addClass("scrollable");

                    //add css to .widget-content
                    thisJq.stop().animate({
                        "min-height": height
                    });
                    thisJq.css("width", width);

                    //remove loading icon when the content is ready
                    $widget.removeClass("widget-loading");

                });

                afterBxSliderLoaded($widget);

            };

        //attach an event to init the rest of the pics
        $widget.mouseenter(function () {

            //we only want to run this once
            if (loadedOtherPics) {
                return;
            }

            loadedOtherPics = true;

            //translate all the span.imageurl"s into actual images
            //(saves some rendering time)
            $("a .imageurl", $widget).each(function () {

                var thisJq = $(this),
                    text = thisJq.text(),
                    imgTag = "<img src=\"" + text + "\" alt=\"\">";

                thisJq.parent().text("").prepend(imgTag);

            });

            $("p .imageurl", $widget).each(function () {
                var thisJq = $(this),
                    text = thisJq.text(),
                    styleAttr = "background-image: url(" + text + ");";

                thisJq.parent().attr("style", styleAttr);
                thisJq.remove();

            });

        });

        //set up scrollable
        $slideWrapper.bxSlider({
            auto: false,
            autoControls: false,
            pause: 15000,
            autoHover: true,
            touchEnabled: false,
            pager: false,
            infiniteLoop: false,
            hideControlOnEnd: true,
            adaptiveHeight: true,
            onSliderLoad: function(){
                bxSliderCallback();
            }
        });

    },//end initFlickr

    /**
     * courses widget
     */
    initCourses = function () {

        var $widget = $("#courses-widget"),
            $widgetContent = $widget.find(".widget-content");

        $widgetContent.accordion({
            heightStyle: "content",
            collapsible : true,
            active : false,
            animate : false,
            icons : false,
            create: function(){
                afterBxSliderLoaded($widget);
            }
        });

    },//end initCourses



    /**
     * testimonials widget
     */
    initTestimonials = function () {

        var $testimonialsWidget = $("#testimonials-widget"),
            $widgetContent = $testimonialsWidget.find(".widget-content"),
            $testimonialsList = $widgetContent.find("ul"),
            bxSliderCallback;
            //end vars

        // loop through list of testimonials and remove dialog functionality - won't
        // work corss domain
        $testimonialsList.find(".more-opener").remove();

        //check there is more than 1 testimonials and if so, start the carousel
        if ($testimonialsList.find("li").length < 2) {
            debug("Less than 2 testimonials, no need for carousel");
            $testimonialsWidget.removeClass("widget-loading");
            return;
        }

        bxSliderCallback = function () {
            //add controls
            afterBxSliderLoaded($testimonialsWidget);
            $testimonialsWidget.removeClass("widget-loading");
        };

        //initialise bxslider
        $testimonialsList.bxSlider({
            auto: false,
            autoControls: false,
            pause: 15000,
            autoHover: true,
            touchEnabled: false,
            pager: false,
            infiniteLoop: false,
            hideControlOnEnd: true,
            adaptiveHeight: true,
            onSliderLoad: function(){
                bxSliderCallback();
            }
        });

    },//end initTestimonials

    /**
     * profiles widget
     */
    initProfiles = function () {

        var $profilesWidget = $("#profiles-widget"),
            widgetContent = $profilesWidget.find(".widget-content"),
            profilesList = widgetContent.find("ul"),
            bxSliderCallback;//end vars

        //check there is more than 1 testimonials and if so, start the carousel
        if ($("li", profilesList).length < 2) {
            debug("Less than 2 testimonials, no need for carousel");
            $profilesWidget.removeClass("widget-loading");
            return;
        }

        bxSliderCallback = function () {
            //add controls
            afterBxSliderLoaded($profilesWidget);
            $profilesWidget.removeClass("widget-loading");
        };

        //initialise bxslider
        profilesList.bxSlider({
            auto: false,
            autoControls: false,
            pause: 15000,
            autoHover: true,
            touchEnabled: false,
            pager: false,
            infiniteLoop: false,
            hideControlOnEnd: true,
            adaptiveHeight: true,
            onSliderLoad: function(){
                bxSliderCallback();
            }
        });

    },//end profilesWidgets

    /**
     * RSS widget
     */
    initRss = function () {

        var $widget = $("#rss-widget"),
            $widgetContent = $widget.find(".widget-content"),
            $items = $widgetContent.find(".items"); //end vars

        if ($items.children().length > 1) {
            //load up bxslider
            $items.bxSlider({
                auto: false,
                autoControls: false,
                pause: 15000,
                autoHover: true,
                touchEnabled: false,
                pager: false,
                infiniteLoop: false,
                hideControlOnEnd: true,
                adaptiveHeight: true,
                onSliderLoad: function(){
                    afterBxSliderLoaded($widget);
                }
            });

        } else {
            //don't load the bxslider carousel , just show widget
            $widget.removeClass("widget-loading");
        }

    },

    /**
     * Call to action widget
     */
    initCallToAction = function () {

        var start_date =  $("#start_date").val(),
            end_date = $("#end_date").val(),
            sd = new Date(),
            ed = new Date(),
            cd,
            splitDate = function (dt, idt) {

                var dateArray  = dt.split("/"),
                    endofArray = dateArray[2].split(" ");

                idt.setFullYear(endofArray[0]);
                idt.setMonth(dateArray[1] - 1);
                idt.setDate(dateArray[0]);

                return idt;

            };

        sd = splitDate(start_date, sd);
        ed = splitDate(end_date, ed);

        //current date
        cd = new Date();

        if (ed >= cd && sd <= cd) {

            //Show the on date
            $("#content_on_date").attr("class", "widget-content cta-widget-show");
            $("#content_out_of_date").attr("class", "cta-widget-hide");

        } else {

            //Show out of date
            $("#content_out_of_date").attr("class", "widget-content cta-widget-show");
            $("#content_on_date").attr("class", "cta-widget-hide");
        }

    },

    /**
     * initiates an image gallery widget
     *
     * @return {object || undefined} returns the galleria jQuery object if
     * successful else undefined - for instance if $gallery is not a jQuery object
     *
     */
    initGallery = function () {

        var $gallery = $("#gallery-widget .gallery");
        return createGallery($gallery, true);

    },

    /**
     * The master widget initialiser, calls all the other init{map,events...} functions
     */
    initWidgets = function () {

        var widgets = {
                "events"   : {
                    f: initEvents
                },
                "news"     : {
                    f: initNews
                },
                "flickr"   : {
                    f: initFlickr
                },
                "courses"  : {
                    f: initCourses
                },
                "testimonials" : {
                    f: initTestimonials
                },
                "rss" : {
                    f: initRss
                },
                "gallery" : {
                    f: initGallery
                },
                "cta": {
                    f: initCallToAction
                },
                "profiles" : {
                    f: initProfiles
                }
            },
            i,
            currentWidget;


        debug("init widget related scripts");

        //loop through each widget type and init if present
        for (i in widgets) {

            if (widgets.hasOwnProperty(i)) {

                //debug("searching for " + i);
                currentWidget = $("#" + i + "-widget");

                //bail here if the widget is not present
                if (currentWidget.length === 0) {
                    debug("no " + i + " widget");
                    continue;
                }

                //bail here if we can't find init func
                if (typeof widgets[i].f !== "function") {
                    debug("can't find init func of " + i + " widget");
                    continue;
                }

                //run the init
                debug("running init func of " + i + " widget");
                widgets[i].f.apply();

            }

        }

    }, //end initWidgets

    /**
     * Stuff needed on everypage - explore city, login etc.
     */
    initPage = function() {

        var
            $windowObj = $(w),
            $body = $("body"),

            // search
            $form = $body.find("#search"),
            $query = $form.find("#query"),
            //indexForm = $("#fb-queryform"),
            //indexQuery = $indexQuery.find("#search-query"),
            collection = "main-all",

            // navigation
            $globalNav = $body.find("#global-nav"),
/*            $primaryNav = $("#primary-nav"),
            $secondaryNav = $("#secondary-nav"),
            $secondaryNavLis = $("#secondary-nav > li"),*/
            $responsiveTogglers = $(".responsive-toggler"),         // buttons to hide/show navigation menus
            $togglees = $(".toggle"),                               // the areas to be shown/hidden when the above button is clicked
            $globalNavAccordionOptions = {
                header : ".header",
                active: false,
                collapsible: true,
                autoHeight: true,
                animate: false,
/*                icons: {
                    "header": "ui-icon-triangle-1-s",
                    "headerSelected": "ui-icon-triangle-1-n"
                }*/
                icons : false
            },
            //currentUrl = $primaryNav.data().url,

            // in page UI elements
            $content = $("#content"),
            $carouselObj = $("#promo-area"),                        // carousel container
            $accordions = $body.find(".accordion"),
            $tabs = $body.find(".tabs"),
            $ytModule = $(".yt-module"),
            $shadowbox = $("a[rel=\"shadowbox\"]"),
            $galleries = $content.find(".gallery");

        //end initPage vars

        // set screensize
        screenSize = getWindowWidth(window) >= breakpoints.wide ? "wide" : "mobile";

        // attach click events on mobile navigation togglers
        $responsiveTogglers.on("click", function(e) {

            var $self = $(this),
                $toggle = $self.next(".toggle");

            e.preventDefault();
            $self.toggleClass("active");
            $toggle.toggleClass("active");

            if ($self.hasClass("global-nav-bttn")) {
                // need to refesh to calculate height when accordion is visible
                $globalNav.accordion("refresh");
            }


        });

        // keyboard accessible dropdowns
        $globalNav.find(".dd > a").on("focus", function(e) {
            $(e.target).next(".children").addClass("visible");
        });

        $globalNav.find(".dd > a").on("focusout", function(e) {
            $(e.target).next(".children").removeClass("visible");
        });

        // on page load if we start with wide sized browser we want
        // the mega dropdowns
        if (screenSize === "wide") {

        } else {
            $globalNav.data("ui", "accordion");
            $globalNav.accordion($globalNavAccordionOptions);
        }

        // attach resize event to window
        $windowObj.resize(function() {

            if (!viewportChanged()) {
                return;
            }

            if (getWindowWidth(window) >= breakpoints.wide) {
                //big to small?
                screenSize = "wide";
                //console.log("small to big, TODO: kill accordion");

                // destroy accordion
                if ($globalNav.data("ui") === "accordion") {
                    $globalNav.data("ui", "");
                    $globalNav.accordion("destroy");
                }

                // close any openers which were open before width change
                $responsiveTogglers.removeClass("active");
                $togglees.removeClass("active");


            } else {
                //console.log("big to small");
                screenSize = "mobile";
                $globalNav.data("ui", "accordion");
                $globalNav.accordion($globalNavAccordionOptions);

            }

        });

        // initalise any accordions found
        $accordions.accordion({
            heightStyle: "content",
            collapsible: true,
            active: false,
            animate: false,
            icons : false
        });

        // initalise any tabs found
        $tabs.tabs();

        // if we have a carousel - set it up
        if ($carouselObj.length !== 0) {
            createSlider($carouselObj);
        }

        // if a gallery is found invoke initGallery for each
        if ($galleries.length !== 0) {
            $galleries.each(function() {
                createGallery($(this), false);
            });
        }

        // fallback for browsers that don't understand placeholder attribute
        if (!Modernizr.input.placeholder) {

            $("[placeholder]").focus(function() {
                var input = $(this);
                if (input.val() === input.attr("placeholder")) {
                    input.val("");
                    input.removeClass("placeholder");
                }
            }).blur(function() {
                var input = $(this);
                if (input.val() === "" || input.val() === input.attr("placeholder")) {
                    input.addClass("placeholder");
                    input.val(input.attr("placeholder"));
                }
            }).blur();
            $("[placeholder]").parents("form").submit(function() {
                $(this).find("[placeholder]").each(function() {
                    var input = $(this);
                    if (input.val() === input.attr("placeholder")) {
                        input.val("");
                    }
                });
            });
        }

        //set up autocomplete on search box
        searchAutoComplete($form, $query, collection);

        //set up autocomplete on search box on main search page
        //searchAutoComplete(indexForm, indexQuery, collection);


        //catch any hallway style call to action or banner action
        if ($content.find(".action-hallway, .banner-hallway").length) {
            CASS.load("hallway");
        }

        // catch any videos that have been manually input
        $("iframe[src*='youtube']").each(function() {

            var $element = $(this),
                vidWidth = $element.outerWidth(),
                $parent = $element.parent();

            // don't double wrap an iframe
            if (!$parent.hasClass("embed-container")) {
                // for elastic objects, we need 2 (!) wrappers
                $element.wrap("<div class=\"embed-wrapper\" style=\"width:" + vidWidth + "px\"><div class=\"embed-container\"></div></div>");
            }

        });

        // YouTube module
        if ($ytModule.length) {
            yepnope({
                load: "lib/backbone/underscore.js",
                complete: function() {
                    ytModule($ytModule);
                }
            });
        }

        // check if shadowbox is needed
        if ($shadowbox.length) {
            yepnope({
                load: ["lib/shadowbox/shadowbox.js"],
                complete: function() {
                    initShadowbox();
                }
            });
        }

    }, //end initPage

    /**
     * Initialisation function, called immediately after CASS declaration below
     */
    init = function() {

        debug("CASS ready (we are in " + document.compatMode + ")");


        // the following needs domready
        $(function() {

            initPage();

            initWidgets();

            //set up any videos on page
            videos();

            //Google Analytics always
            initGoogleAnalytics();

            //while we are developing, lets include the devstuff
            // load("devStuff");

            //set up the js failure notification
            initJsFailureNotifier();

        });

    };

    // end CASS var

    /**
     *  This literal defines what methods to make publicly accessible
     *  outsite CASS
     */
    return {
        init: init,
        load: load,
        debug: debug,
        setVersion: setVersion,
        setGaAccount: setGaAccount,
        isEven: isEven,
        getUrlVars: getUrlVars,
        objectSize: objectSize,
        getWindowWidth: getWindowWidth,
        s1Server: srcPrefix,
        isCass : isCass,
        isBunhill : isBunhill
    };

}(window, Modernizr, yepnope));

// end CASS
