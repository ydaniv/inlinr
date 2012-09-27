// ### AMD wrapper
;(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define(function () {
            return factory(root);
        });
    } else {
        // if not using an AMD library set the global `Inlinr` namespace
        root.Inlinr = factory(root);
    }
}(this, function (global) {

    var defaults = {
            use_specified   : false
        },
        options = copy({}, defaults),
        Inlinr;

    function copy (target, source) {
        var k;
        for ( k in source ) {
            target[k] = source[k];
        }
        return target;
    }

    // convert an array-like object to array
    function toArray (list) {
        return [].slice.call(list);
    }

    // get a list of matched nodes
    function $get (selector, parent) {
        if ( parent ) {
            if ( typeof parent.querySelectorAll === 'function' ) {
                return parent.querySelectorAll(selector);
            } else if ( typeof parent === 'string' ) {
                return $get(selector, $get(parent)[0]);
            }
        }
        return global.document.querySelectorAll(selector);
    }

    // polyfill window.getMatchedCSSRules()
    if ( typeof global.getMatchedCSSRules !== 'function' ) {

        var ELEMENT_RE = /[\w-]+/g,
            ID_RE = /#[\w-]+/g,
            CLASS_RE = /\.[\w-]+/g,
            ATTR_RE = /\[[^\]]+\]/g,
            // :not() pseudo-class does not add to specificity, but its content does as if it was outside it
            PSEUDO_CLASSES_RE = /\:(?!not)[\w-]+(\(.*\))?/g,
            PSEUDO_ELEMENTS_RE = /\:\:?(after|before|first-letter|first-line|selection)/g;
        // handles extraction of `cssRules` as an `Array` from a stylesheet or something that behaves the same
        function getSheetRules (stylesheet) {
            var sheet_media = stylesheet.media && stylesheet.media.mediaText;
            // if this sheet is disabled skip it
            if ( stylesheet.disabled ) return [];
            // if this sheet's media is specified and doesn't match the viewport then skip it
            if ( sheet_media && sheet_media.length && ! global.matchMedia(sheet_media).matches ) return [];
            // get the style rules of this sheet
            return toArray(stylesheet.cssRules);
        }

        function _find (string, re) {
            var matches = string.match(re);
            return re ? re.length : 0;
        }

        // calculates the specificity of a given `selector`
        function calculateScore (selector) {
            var score = [0,0,0],
                parts = selector.split(' '),
                part, match;
            //TODO: clean the ':not' part since the last ELEMENT_RE will pick it up
            while ( part = parts.shift(), typeof part == 'string' ) {
                // find all pseudo-elements
                match = _find(part, PSEUDO_ELEMENTS_RE);
                score[2] = match;
                // and remove them
                match && part.replace(PSEUDO_ELEMENTS_RE, '');
                // find all pseudo-classes
                match = _find(part, PSEUDO_CLASSES_RE);
                score[1] = match;
                // and remove them
                match && part.replace(PSEUDO_CLASSES_RE, '');
                // find all attributes
                match = _find(part, ATTR_RE);
                score[1] += match;
                // and remove them
                match && part.replace(ATTR_RE, '');
                // find all IDs
                match = _find(part, ID_RE);
                score[0] = match;
                // and remove them
                match && part.replace(ID_RE, '');
                // find all classes
                match = _find(part, CLASS_RE);
                score[1] += match;
                // and remove them
                match && part.replace(CLASS_RE, '');
                // find all elements
                score[2] += _find(part, ELEMENT_RE);
            }
            return parseInt(score.join(''), 10);
        }

        // returns the heights possible specificity score an element can get from a give rule's selectorText
        function getSpecificityScore (element, selector_text) {
            var selectors = selector_text.split(','),
                selector, score, result = 0;
            while ( selector = selectors.shift() ) {
                if ( element.mozMatchesSelector(selector) ) {
                    score = calculateScore(selector);
                    result = score > result ? score : result;
                }
            }
            return result;
        }

        function sortBySpecificity (element, rules) {
            // comparing function that sorts CSSStyleRules according to specificity of their `selectorText`
            function compareSpecificity (a, b) {
                return getSpecificityScore(element, b.selectorText) - getSpecificityScore(element, a.selectorText);
            }

            return rules.sort(compareSpecificity);
        }

        //TODO: not supporting 2nd argument for selecting pseudo elements
        //TODO: not supporting 3rd argument for checking author style sheets only
        global.getMatchedCSSRules = function (element /*, pseudo, author_only*/) {
            var style_sheets, sheet, sheet_media,
                rules, rule,
                result = [];
            // get stylesheets and convert to a regular Array
            style_sheets = toArray(global.document.styleSheets);

            // assuming the browser hands us stylesheets in order of appearance
            // we iterate them from the beginning to follow proper cascade order
            while ( sheet = style_sheets.shift() ) {
                // get the style rules of this sheet
                rules = getSheetRules(sheet);
                // loop the rules in order of appearance
                while ( rule = rules.shift() ) {
                    // if this is an @import rule
                    if ( rule.styleSheet ) {
                        // insert the imported stylesheet's rules at the beginning of this stylesheet's rules
                        rules = getSheetRules(rule.styleSheet).concat(rules);
                        // and skip this rule
                        continue;
                    }
                    // if there's no stylesheet attribute BUT there IS a media attribute it's a media rule
                    else if ( rule.media ) {
                        // insert the contained rules of this media rule to the beginning of this stylesheet's rules
                        rules = getSheetRules(rule).concat(rules);
                        // and skip it
                        continue
                    }
                    //TODO: for now only polyfilling Gecko
                    // check if this element matches this rule's selector
                    if ( element.mozMatchesSelector(rule.selectorText) ) {
                        // push the rule to the results set
                        result.push(rule);
                    }
                }
            }
            // sort according to specificity
            return sortBySpecificity(element, result);
        };
    }

    // prefix the number with a 0 if it's a single digit
    function prefix0 (number_str) {
        return number_str.length < 2 ? '0' + number_str : number_str;
    }

    // takes a number or a string representation of a number and return a string of it in Hex radix
    function toHex (num) {
        return (+num).toString(16);
    }

    // replaces all rgb() color format occurrences to their HEX representations
    function rgbToHex (str) {
        return str.replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g, function (match, r, g, b) {
            return '#' + prefix0(toHex(r)) + prefix0(toHex(g)) + prefix0(toHex(b));
        });
    }

    // get matched rules
    function getMatchedRules (element) {
        // get the matched rules from all style sheets
        var matched_rules = global.getMatchedCSSRules(element);
        // return `null` or return the list converted into an `Array`
        return matched_rules && toArray(matched_rules);
    }

    // returns a map of style properties, which are used in author style sheets,
    // to their values for a given element
    function getUsedValues (element) {
        var matched_rules = getMatchedRules(element),
            values = {},
            rule, computed, style, property;
        // if nothing is matched we get null so bail out
        if ( ! matched_rules ) return values;
        // get the actual computed style
        //TODO: not supporting pseudo elements
        computed = global.getComputedStyle(element, null);

        // loop over the matched rules from the end since they should come in cascade order
        while ( rule = matched_rules.pop() ) {
            //for each rule convert rule.style into an array
            style = toArray(rule.style);
            // loop over the array of style properties that were defined in any of the stylesheets
            while ( property = style.shift() ) {
                // if it's not in `values`
                if ( ! (property in values) ) {
                    // take the used value and add it to the list  
                    values[property] = computed.getPropertyValue(property);
                }
            }
        }
        return values;
    }

    function getSpecifiedValues (element) {
        var matched_rules = getMatchedRules(element),
            values = {},
            rule, style_text, properties, property;
        // if nothing is matched we get null so bail out
        if ( ! matched_rules ) return values;

        // loop over the matched rules from the end since they should come in cascade ascending order
        // i.e.: last one is most important
        while ( rule = matched_rules.pop() ) {
            style_text = rule.style.cssText;
            //for each rule parse and tokenize the cssText into style properties
            properties = style_text.split(';').map(function (item) { return item.split(':'); });
            // loop over the array of style properties that were defined in any of the stylesheets
            while ( property = properties.shift() ) {
                // if it's not in `values`
                if ( property[0] && ! (property[0] in values) ) {
                    // take the value and add it to the list
                    values[property[0]] = property[1];
                }
            }
        }
        return values;
    }

    function process (elements, context, do_inline) {
        var getValues = options.use_specified ? getSpecifiedValues : getUsedValues,
            el, styles, style_str, s, inlined = [];

        if ( typeof elements === 'string' ) {
            //get the elements if it's only a selector
            elements = toArray($get(elements, context));
        }
        // if it's a single element then stick it in an array
        else if ( elements.nodeType ) {
            elements = [elements];
        }

        // loop over the elements
        while ( el = elements.shift() ) {
            // pick all the values that were set in any of the stylesheets
            styles = getValues(el);
            style_str = '';
            // loop over the rules
            for ( s in styles ) {
                // build a "cssText" string
                style_str += s + ':' + styles[s] + ';';
            }
            if ( style_str ) {
                style_str = rgbToHex(style_str);
                // whether to actually set the style attribute
                if ( do_inline ) {
                    // inline it - set it to the style attribute of the element
                    style_str && el.setAttribute('style', style_str);
                }
            }
            inlined.push(style_str);
        }
        // returned the number of inlined elements, just for reference
        return inlined;
    }

    function configure (ops) {
        copy(options, ops);
        return Inlinr;
    }

    // inlines styles for a given element[s]
    function inline (elements, context) {
        return process(elements, context, true);
    }

    function calculate (elements, context) {
        return process(elements, context, false);
    }

    Inlinr =  {
        inline      : inline,
        calculate   : calculate,
        configure   : configure
    };
    return Inlinr;
}));