/*** instructions for the jslint parser */
/*jslint white: false, browser: true, undef: true, nomen: true, eqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, regexp: false, continue: true, regexp: true */
/*global window, escape, _gat, setApiKey, jQuery, $, opera, google, unescape, swfobject, load, _cga, stLight, _push, _error, trackEvent, trackSocial */
/*** end instructions for the jslint parser */

CITY.hallway = (function (w,$) {

    //private
    var hallwayBlock, blocks, counter, $currentLoopBlock,

    // hover effect on hallway items: grey out all but the currently hovered over item
    hoverEffect = function () {

        //wrap each hallway item img with an href and add an overlay div
        for( counter=0; counter < blocks.length; counter++ ) {
            $currentLoopBlock = $(blocks[counter]);
            //when creating the overlay divs, also grad the image width and assign it to the overlay.
            //this makes sure that if the image is smaller than the whole container, the overlay fits.
            $currentLoopBlock.wrapInner('<a href="' + $currentLoopBlock.find("a").attr("href") + '" class="hallwayjs" />').prepend('<div class="hallway-overlay" style="width:' + $currentLoopBlock.find("img").width() + 'px;"/>');
        }

        blocks.bind('mouseenter focus', function () {
            //do some crazy class addition or removal to take care of the css transitions on the overlay
            active = $(this);
            active.removeClass("hallway-opaque-off").removeClass("hallway-opaque");
            blocks.not(active).removeClass("hallway-opaque-off").addClass("hallway-opaque");

        })
        .bind("mouseleave blur", function () {
            //do some more crazy class addition for css transitions on the overlay
            blocks.addClass("hallway-opaque-off");

        });
    };

    $(function () {

        hallwayBlock = $("#container .hallway");
        blocks = hallwayBlock.find(".hallway-item");


        //if there is no hallway container on the page, do nothing.
        if (!hallwayBlock.length) {
            return;
        }

        hoverEffect();

    });

}(window,jQuery));