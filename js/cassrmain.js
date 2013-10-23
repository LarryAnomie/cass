//this needs to be properly global for GA to work
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
