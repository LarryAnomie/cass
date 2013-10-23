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
