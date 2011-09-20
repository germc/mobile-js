(function( $ ){
  $.fn.footer = function() {
    $.tmpl($('#footerTemplate').html()).appendTo(this);
  };
})( jQuery );