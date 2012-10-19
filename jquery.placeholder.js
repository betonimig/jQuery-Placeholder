/*
* Placeholder plugin for jQuery
* ---
* Copyright 2010, Daniel Stocks (http://webcloud.se)
* Released under the MIT, BSD, and GPL Licenses.
*/
(function($) {
    function setSelectionRange(input, selectionStart, selectionEnd) {
      if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(selectionStart, selectionEnd);
      }
      else if (input.createTextRange) {
        var range = input.createTextRange();
        range.collapse(true);
        if (selectionEnd==selectionStart){
            range.move("character", selectionStart);
        }else{
            range.moveEnd('character', selectionEnd);
            range.moveStart('character', selectionStart);
        }
        range.select();
      }
    }
    function setCaretToPos (input, pos) {
      setSelectionRange(input, pos, pos);
    }
    function Placeholder(input) {
        this.input = input;
        if (input.attr('type') == 'password') {
            this.handlePassword();
        }
        // Prevent placeholder values from submitting
        $(input[0].form).submit(function() {
            if (input.hasClass('placeholder') && input[0].value == input.attr('placeholder')) {
                input[0].value = '';
            }
        });
    }
    Placeholder.prototype = {
        show : function(loading) {
            // FF and IE saves values when you refresh the page. If the user refreshes the page with
            // the placeholders showing they will be the default values and the input fields won't be empty.
            if (this.input[0].value === '' || (loading && this.valueIsPlaceholder())) {
                var ifocus = this.input;
                if (this.isPassword) {
                    try {
                        if($.browser.msie) throw true;
                        this.input[0].setAttribute('type', 'text');
                    } catch (e) {
                        this.input.before(this.fakePassword.show()).hide();
                    }
                    ifocus = this.fakePassword;
                }
                this.input.addClass('placeholder');
                this.input[0].value = this.input.attr('placeholder');
                ifocus.trigger('focus');
            }
        },
        hide : function() {
            if (this.valueIsPlaceholder() && this.input.hasClass('placeholder')) {
                this.input.removeClass('placeholder');
                this.input[0].value = '';
                if (this.isPassword) {
                    try {
                        this.input[0].setAttribute('type', 'password');
                    } catch (e) { }
                    // Restore focus for Opera and IE
                    this.input.show();
                    this.input[0].focus();
                }
            }
        },
        valueIsPlaceholder : function() {
            return this.input[0].value == this.input.attr('placeholder');
        },
        handlePassword: function() {
            var input = this.input;
            input.attr('realType', 'password');
            this.isPassword = true;
            // IE < 9 doesn't allow changing the type of password inputs
            if ($.browser.msie && input[0].outerHTML) {
                var fakeHTML = $(input[0].outerHTML.replace(/type=(['"])?password\1/gi, 'type=$1text$1'));
                this.fakePassword = fakeHTML.val(input.attr('placeholder'))
                                             .addClass('placeholder')
                                             .keydown(function() {
                                                 input.trigger('keydown');
                                                 $(this).hide();
                                             }).focus(function(){
                                                 setCaretToPos(this, 0);
                                             }).mouseup(function(){
                                                 if (this.value===input.attr('placeholder'))
                                                     $(this).trigger('focus');
                                             });
                $(input[0].form).bind('submit.placeholder', function() {
                    fakeHTML.remove();
                    input.show()
                    input.unbind('.placeholder')
                    $(this).unbind('.placeholder');
                });
            }
        }
        
    };
    var NATIVE_SUPPORT = !!("placeholder" in document.createElement( "input" ));
    $.fn.placeholder = function() {
        return NATIVE_SUPPORT ? this : this.each(function() {
            var input = $(this);
            var placeholder = new Placeholder(input);
            placeholder.show(true);
            input.bind('keydown.placeholder', function() {
                if (this.value==='')
                    placeholder.show(false);
                else
                    placeholder.hide();
            }).bind('keyup.placeholder', function() {
                if (this.value==='')
                    placeholder.show(false);
            }).bind('blur.placeholder', function() {
                placeholder.show(false);
            }).bind('mouseup.placeholder', function(){
                if (this.value===placeholder.input.attr('placeholder'))
                    input.trigger('focus');
            });

            // On page refresh, IE doesn't re-populate user input
            // until the window.onload event is fired.
            if ($.browser.msie) {
                $(window).load(function() {
                    if(input.val()) {
                        input.removeClass("placeholder");
                    }
                    placeholder.show(true);
                });
                // What's even worse, the text cursor disappears
                // when tabbing between text inputs, here's a fix
                input.bind('focus.placeholder', function() {
                    setCaretToPos(this, 0);
                });
            }
        });
    }
})(jQuery);