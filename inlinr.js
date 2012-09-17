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
        //TODO: not supporting 2nd argument for selecting pseudo elements
        //TODO: not supporting 3rd argument for checking author style sheets only
        global.getMatchedCSSRules = function (element /*, pseudo, author_only*/) {
            var style_sheets, sheet, sheet_media,
                rules, rule,
                result = [];
            // get stylesheets and convert to a regular Array
            style_sheets = toArray(global.document.styleSheets);

            while ( sheet = style_sheets.shift() ) {
                sheet_media = sheet.media.mediaText;
                // if this sheet is disabled skip it
                if ( sheet.disabled ) continue;
                // if this sheet's media is specified and doesn't match the viewport then skip it
                if ( sheet_media.length && ! global .matchMedia(sheet_media).matches ) continue;
                // get the style rules of this sheet
                rules = toArray(sheet.cssRules);
                // loop the rules
                while ( rule = rules.shift() ) {
                    // if this is an @import rule
                    if ( rule.stylesheet ) {
                        // add the imported stylesheet to the stylesheets array
                        style_sheets.push(rule.stylesheet);
                        // and skip this rule
                        continue;
                    }
                    // if there's no stylesheet attribute BUT there IS a media attribute it's a media rule
                    else if ( rule.media ) {
                        // add this rule to the stylesheets array since it quacks like a stylesheet (has media & cssRules attributes)
                        style_sheets.push(rule);
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
            return result;
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

    // returns a map of style properties, which are used in author style sheets,
    // to their values for a given element
    function getUsedValues (element) {
        var matched_rules, rule, computed, style, property,
            used_values = {};
        // get the matched rules from all style sheets
        matched_rules = global.getMatchedCSSRules(element);
        // if nothing is matched we get null so bail out
        if ( ! matched_rules ) return used_values;
        // convert the matched rules into an Array
        matched_rules = toArray(matched_rules);
        // get the actual computed style
        //TODO: not supporting pseudo elements
        computed = global.getComputedStyle(element, null);

        // loop over the matched rules from the end since they should come in cascade order
        while ( rule = matched_rules.pop() ) {
            //for each rule convert rule.style into an array
            style = toArray(rule.style);
            // loop over the array of style properties that were defined in any of the stylesheets
            while ( property = style.shift() ) {
                // if it's not in used_values
                if ( ! (property in used_values) ) {
                    // take the used value and add it to the list  
                    // we have to take the used value calculated by the browser
                    used_values[property] = computed.getPropertyValue(property);
                }
            }
        }
        return used_values;
    }

    function process (elements, context, do_inline) {
        var el, styles, style_str, s, inlined = [];

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
            // pick all the used values that were set in any of the stylesheets
            styles = getUsedValues(el);
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

    // inlines styles for a given element[s]
    function inline (elements, context) {
        return process(elements, context, true);
    }

    function calculate (elements, context) {
        return process(elements, context, false);
    }

    return {
        inline      : inline,
        calculate   : calculate 
    };
}));