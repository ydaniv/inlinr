Inlinr
======

Killer in-browser styles inliner.

What?
=====

Inlinr is a simple tool that takes all the stylesheets included in a web page,
finds all the rules in them that apply to a given element(s), finds the value for every style property for that element(s)
and sets those properties and values to the style attribute of that element(s).

In short, it inlines all the style properties of an element.

Why?
====

Inlinr is mainly used for parsing markup to be used for HTML email messages.

It can also be used for anything else you could think of, e.g. transferring markup between windows (i.e. `iframe`).

How?
====

Inlinr gets all matched CSS rules on an element using Webkit's `window.getMatchedCSSRules()` or its
[polyfill for FireFox 6+](https://gist.github.com/3033012 "mozGetMatchedCSSRules.js"). Then it can either take the original [specified values](http://www.w3.org/TR/CSS21/cascade.html#specified-value),
or the [used values](http://www.w3.org/TR/CSS21/cascade.html#used-value) for that element using `window.getComputedStyle()`, builds a long CSS string and puts it into that element's [style] attribute.

Installing
==========

Inlinr is AMD compliant so you can load it to your page using [requirejs](http://requirejs.org "requirejs") or another AMD compliant library.
Alternatively you can just include it to your page using this line in your `head` or `body` tags:

    <script src="path_to_static_js/inlinr.js"></script>

Where `path_to_static_js` is the path to you JS folder.

API
===

If you're not loading Inlinr as an AMD module it will place itself on the `window` object under the `Inlinr` namespace.

Then to inline styles of elements simply use:

    Inlinr.inline(element, parent)

`element` can be a selector or an element. It can also be an `Array` of elements or a 
selector for matching multiple elements.

`parent` is an optional argument that can be used for narrowing down the query, if `element` is a selector.
`parent` can also be an element or a selector.

Should you want to inline the specified values just configure it first before each call:

    Inlinr.configure({ use_specified : true }).inline(element, parent)

Should you want to *NOT* inline styles but simply get back an `Array` of style strings corresponding to the list of elements
you supplied to `inline` then use `calculate`:

    Inline.calculate(elements)

If `elements` is a single `HTMLElement` then it's treated as an `Array` with a length of 1.
If `elements` is a selector `String` then you'll get back an `Array` of containing the selected elements and all their descendants/

License
=======

Copyright 2011 Yehonatan Daniv. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY Yehonatan Daniv ''AS IS'' AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Yehonatan Daniv OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those of the
authors and should not be interpreted as representing official policies, either expressed
or implied, of Yehonatan Daniv.