/**
 * @author Simon Mayes <Simon.Mayes@intendance.com>
 * @copyright Intendance 2011. All Rights Reserved.
 *
 * This Google Analytics uses Google"s _gaq object to track events across the
 * system. It provides a wrapper interface in order to keep a registry of all
 * the events in the system.
 */
CASS._ga = (function(w) {

    "use strict";

    if ("undefined" === typeof w._gaq) {
        CASS.debug("The _gaq object must exist.");
        return;
    }

    /**
     * Google Analytics function
     * @scope private
     */
    var _gaq = w._gaq,
            _cga = w._cga,
            analyticsFileTypes = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "pps", "ppsx",
        "pdf", "jpg", "png", "gif", "zip", "txt", "rtf", "mp3"],
            _errors = [],
            /**
             * Event config
             * @scope private
             */
            _events = {
        /*example: {
         category: "", // string, required
         action: "", // string, required
         opt_label: "", // string, optional
         opt_value: 0 // number, optional
         },*/
        //# General "q"
        // Email
        g_email: {
            category: "Email",
            action: "mailto",
            opt_label: "" // Email address
        },
        // Downloads
        g_downloads: {
            category: "Downloads",
            action: "Download",
            opt_label: "" // URL
        },
        //# Widgets
        // Contact widgets
        // Emails from widgets
        w_contact_email: {
            category: "Email widget",
            action: "mailto",
            opt_label: "" // Email address
        },
        // Emails from body content
        w_contact_body_email: {
            category: "Email body",
            action: "mailto",
            opt_label: "" // Email address
        },
        // News widgets
        // Clicks on forward, back and all buttons
        w_news_forward: {
            category: "News Widget Controls",
            action: "Forward"
        },
        w_news_back: {
            category: "News Widget Controls",
            action: "Back"
        },
        w_news_show_all: {
            category: "News Widget Controls",
            action: "Show all"
        },
        // Clicks on news article in widgets
        w_news_view: {
            category: "News Widget Controls",
            action: "View news item",
            opt_label: "" // URL
        },
        // Events widget
        // Click on forward, back and all buttons
        w_events_forward: {
            category: "Event Widget Controls",
            action: "Forward"
        },
        w_events_back: {
            category: "Event Widget Controls",
            action: "Back"
        },
        w_events_show_all: {
            category: "Event Widget Controls",
            action: "Show all"
        },
        // Clicks on events article in widgets
        w_events_view: {
            category: "Event Widget Controls",
            action: "View event item"
        },
        // Courses widget
        // Click on different course types
        w_courses_undergraduate: {
            category: "Courses Widget Accordion",
            action: "Undergraduate",
            opt_label: "" // accordion title
        },
        w_courses_postgraduate: {
            category: "Courses Widget Accordion",
            action: "Postgraduate",
            opt_label: "" // accordion title
        },
        w_courses_short_course: {
            category: "Courses Widget Accordion",
            action: "Short course",
            opt_label: "" // accordion title
        },
        w_courses_foundation: {
            category: "Courses Widget Accordion",
            action: "Foundation",
            opt_label: "" // accordion title
        },
        w_courses_cpd: {
            category: "Courses Widget Accordion",
            action: "CPD",
            opt_label: "" // accordion title
        },
        w_courses_research: {
            category: "Courses Widget Accordion",
            action: "Research Degrees",
            opt_label: "" // accordion title
        },
        // Click on course
        w_courses_course: {
            category: "Courses Widget Course",
            action: "Click",
            opt_label: "" // URL
        },
        // Freetext widget
        w_freetext_download: {
            category: "Free Text Widget Download",
            action: "download",
            opt_label: "" // URL
        },
        w_freetext_email: {
            category: "Free Text Widget Email",
            action: "mailto:",
            opt_label: "" // email address
        },
        w_freetext_link: {
            category: "Free Text Widget Link",
            action: "Click",
            opt_label: "" // URL
        },
        // Map widget
        w_map_expand: {
            category: "Map Widget",
            action: "Expand",
            opt_lable: "" // Location name
        },
        w_map_close: {
            category: "Map Widget",
            action: "Close"
        },
        // Flickr widget
        w_flickr_forward: {
            category: "News Widget Controls",
            action: "Forward"
        },
        w_flickr_back: {
            category: "News Widget Controls",
            action: "Back"
        },
        w_flickr_show_all: {
            category: "News Widget Controls",
            action: "Show all"
        },
        // Testimonial widget
        w_testimonial_expand: {
            category: "Testimonial widget controls",
            action: "Expand"
        },
        w_testimonial_close: {
            category: "Testimonial widget controls",
            action: "Close"
        },
        w_testimonial_forward: {
            category: "Testimonial widget controls",
            action: "Forward"
        },
        w_testimonial_back: {
            category: "Testimonial widget controls",
            action: "Back"
        },
        // Event page
        e_calendar: {
            category: "Events",
            action: "Sign up",
            opt_label: "" // top or bottom
        },
        e_booking: {
            category: "Events",
            action: "Add to calendar",
            opt_label: "" // top or bottom
        },
        c_accordian: {
            category: "Course",
            action: "Accordian",
            opt_label: "" // accordian title
        },
        c_accordian_details: {
            category: "Course",
            action: "Accordian Details",
            opt_label: "", // accordian title
            opt_value: "" // time on accordian
        },
        c_accordian_exposure: {
            category: "Course",
            action: "Accordian Details Exposure",
            opt_label: "", // accordian title
            opt_value: "" // time on accordian
        },
        c_apply: {
            category: "Course",
            action: "How to Apply",
            opt_val: "" // page title
        },
        c_apply_downloads: {
            category: "Course",
            action: "Application action",
            opt_val: "" // URL
        },
        //Tabs across academics
        t_click_tabs: {
            category: "People Academics",
            action: "Click Academics Tabs"
        },
        //Contact us academics
        t_click_contact_us: {
            category: "People Academics",
            action: "Click Contact Us"
        },
        //Read more academics
        t_click_read_more: {
            category: "People Academics",
            action: "Click Read More"
        },
        //Read less academics
        t_click_read_less: {
            category: "People Academics",
            action: "Click Read Less"
        },
        //Keywords academics
        t_click_keywords: {
            category: "People Academics",
            action: "Click Keywords"
        },
        //carousel events
        carousel_click_prev: {
            category: "Carousel",
            action: "Click Left"
        },
        carousel_click_next: {
            category: "Carousel",
            action: "Click Right"
        },
        carousel_click_number: {
            category: "Carousel",
            action: "Click number"
        },
        carousel_click_play: {
            category: "Carousel",
            action: "Click Play"
        },
        carousel_click_pause: {
            category: "Carousel",
            action: "Click Pause"
        },
        //any text
        carousel_click_text: {
            category: "Carousel",
            action: "Click text"
        },
        //any hyperlinks
        carousel_click_link: {
            category: "Carousel",
            action: "Click link"
        },
        //the date box
        carousel_click_date: {
            category: "Carousel",
            action: "Click Date"
        },
        carousel_click_image: {
            category: "Carousel",
            action: "Click image"
        },
        //click anywhere on the carousel
        carousel_click_background: {
            category: "Carousel",
            action: "Click background"
        }
    },
    _socials = {
        /*example: {
         network: "", // string, required
         socialAction: "", // string, required
         opt_target: "", // string, optional, default: location.href
         opt_pagePath: "" // string, optional, defualt: location.pathname + location.search
         }*/
        s_buttons: {
            network: "Social Buttons",
            socialAction: "Follow"
        }
    },
    /**
     * Registry
     * @scope private
     */
    _registry = {
        // methods
        trackEvent: [],
        trackSocial: []
    },
    init = function() {

        var i;

        CASS.debug("setting up event tracking");

        if (_cga instanceof Array) {

            for (i; i < _cga.length; i++) {
                _push.apply([], _cga[i]);
                _cga.push = _push;
            }

        } else {

            _cga = w._cga = [];
            _cga.push = _push;

        }

        //for document links
        $("a").click(function() {

            var $a = $(this),
                    href = $a.attr("href"),
                    downloadTracked = false,
                    extension,
                    protocol;

            if (href === undefined || "#" === href) {
                return;
            }

            //if this is document link, check that we want to track this type
            extension = href.split(".").pop();
            if ($.inArray(extension, analyticsFileTypes) !== -1) {

                downloadTracked = true;

                //attach a click event, original will still carry on

                // _gaq.push(["_trackEvent", "Downloads", extension.toUpperCase(), href]);
                _cga.push(["_trackEvent", "global", "g_downloads", extension.toUpperCase() + ": " + href]);


            } //end check for document links

            //check for links offsite
            if ((href.match(/^http/)) && (!href.match(document.domain)) && (downloadTracked === false)) {

                //attach a click event, original will still carry on

                w._gaq.push(["_trackEvent", "Outbound Traffic", href.match(/:\/\/([^\/]+)/)[1], href]);


            } //end check for offsite links
            // protocol = href.split(":").shift()
            if ("mailto" === href.split(":").shift()) {
                _cga.push(["_trackEvent", "global", "g_email", href.match(/mailto:([^\/]+)/)[1]]);
            }

        }); //end $("a") match
    },
            _push = function(obj) {

        if (!(obj instanceof Array)) {
            _error("\"" + typeof obj + "\" must be an Array");
            return;
        }

        var args = obj,
                method = args.shift();

        switch (method) {
            case "_trackEvent":
                trackEvent.apply({}, args); // ie. source, event, opt_label, opt_value
                break;
            case "_trackSocial":
                trackSocial.apply({}, args); // ie. source, social, opt_target, opt_pagePath
                break;
            default:
                _error("\"" + method + "\" is not supported");
                return;
        }

        this[this.length] = obj;

    },
            /**
             * @scope private
             */
            _error = function(message, source) {
        if ("string" !== source) {
            source = "";
        }
        _errors.push({
            source: source,
            message: message
        });

        // debug mode
        CASS.debug("CASS_ga:" + source + ":" + message);

    },
            /**
             * @scope public
             */
            getLastError = function() {
        var index = _errors.lenth;
        if (index) {
            return _errors[index - 1];
        } else {
            return false;
        }
    },
            getErrors = function() {
        return _errors;
    },
            /**
             * Wraps _gaq.trackEvent() and adds request to registry.
             *
             * @scope public
             * @param string source
             * @param string event
             * @param string opt_label
             * @param number opt_value
             */
            trackEvent = function(source, event, opt_label, opt_value) {
        if ("undefined" === typeof source) {
            _error("source required.", source);
            return false;
        } else if ("string" !== typeof source) {
            _error("source must be a string.", source);
            return false;
        }
        if ("undefined" === typeof event) {
            _error("event required.", source);
            return false;
        } else if ("string" !== typeof event) {
            _error("event must be a string.", source);
            return false;
        }
        if ("undefined" === typeof _events[event]) {
            _error("event \"" + event + "\" does not exist.", source);
            return false;
        }
        if ("string" === typeof _events[event].opt_label && "undefined" === typeof opt_label) {
            _error("opt_label required.", source);
            return false;
        } else if ("string" === typeof _events[event].opt_label && "string" !== typeof opt_label) {
            _error("opt_label must be a string.", source);
            return false;
        }
        if ("number" === typeof _events[event].opt_value && "undefined" === typeof opt_value) {
            _error("opt_value required.", source);
            return false;
        } else if ("number" === typeof _events[event].opt_value && "number" !== typeof opt_value) {
            _error("opt_value must be a number.", source);
            return false;
        }
        // add to registry
        _registry.trackEvent.push(Array.prototype.slice.call(arguments));
        // add to google
        w._gaq.push(["_trackEvent", _events[event].category, _events[event].action, opt_label, opt_value]);
        return true;
    },
            trackSocial = function(source, social, opt_target, opt_pagePath) {
        if ("undefined" === typeof source) {
            _error("source required.", source);
            return false;
        } else if ("string" !== typeof source) {
            _error("source must be a string.", source);
            return false;
        }
        if ("undefined" === typeof social) {
            _error("social required.", source);
            return false;
        } else if ("string" !== typeof social) {
            _error("social must be a string.", source);
            return false;
        }
        if ("undefined" === typeof _socials[social]) {
            _error("social \"" + social + "\" does not exist.", source);
            return false;
        }
        if ("string" === typeof _socials[social].opt_target && "undefined" === typeof opt_target) {
            _error("opt_target required.", source);
            return false;
        } else if ("string" === typeof _socials[social].opt_target && "string" !== typeof opt_target) {
            _error("opt_target must be a string.", source);
            return false;
        }
        if ("number" === typeof _socials[social].opt_pagePath && "undefined" === typeof opt_pagePath) {
            _error("opt_pagePath required.", source);
            return false;
        } else if ("number" === typeof _socials[social].opt_pagePath && "string" !== typeof opt_pagePath) {
            _error("opt_pagePath must be a string.", source);
            return false;
        }
        // add to registry
        _registry.trackSocial.push(Array.prototype.slice.call(arguments));
        // add to google
        w._gaq.push(["_trackSocial", _socials[social].network, _socials[social].socialAction, opt_target, opt_pagePath]);
        return true;
    },
            getTrackEventRegistry = function() {
        return _registry.trackEvent;
    },
            getTrackSocialRegistry = function() {
        return _registry.trackSocial;
    };

    return {
        trackEvent: trackEvent,
        trackSocial: trackSocial,
        getTrackEventRegistry: getTrackEventRegistry,
        getTrackSocialRegistry: getTrackSocialRegistry,
        getErrors: getErrors,
        getLastError: getLastError,
        init: init
    };

}(window));