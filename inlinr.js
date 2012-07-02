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

    //TODO: add support for nested rules, i.e. CSSRule.parentRule for @media blocks

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
                // if this sheet's media is specified and is NOT all or screen then skip it
                if ( sheet_media.length &&
                    ! (~ sheet_media.indexOf('screen') || ~ sheet_media.indexOf('all')) ) continue;
                // get the style rules of this sheet
                rules = toArray(sheet.cssRules);
                // loop the rules
                while ( rule = rules.shift() ) {
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

    // returns a map of style properties, which are used in author style sheets,
    // to their values for a given element
    function getUsedValues (element) {
        var matched_rules, rule, computed, style, property,
            used_values = {};
        // get the matched rules from all style sheets
        matched_rules = toArray(global.getMatchedCSSRules(element));
        // get the actual computed style
        //TODO: not supporting pseudo elements
        computed = global.getComputedStyle(element, null);

        // loop over the matched rules
        while ( rule = matched_rules.shift() ) {
            //for each rule convert rule.style into an array
            style = toArray(rule.style);
            // loop over the array of style properties
            while ( property = style.shift() ) {
                // if it's not in used_values and its value equals computed[property]
                if ( ! (property in used_values) && rule.style.getPropertyValue(property) === computed.getPropertyValue(property) ) {
                    used_values[property] = rule.style.getPropertyValue(property);
                }
            }
        }
        return used_values;
    }

    // inlines styles for a given element[s]
    function inline (elements, context, keep_inlined) {
        var el, styles, style_str, s, inlined = 0;

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
            styles = getUsedValues(el);
            style_str = '';
            for ( s in styles ) {
                style_str += s + ':' + styles[s] + ';';
            }
            el.setAttribute('style', style_str);
            inlined += 1;
        }
        return inlined;
    }

    return {
        inline  : inline
    };
}));