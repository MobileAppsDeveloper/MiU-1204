var parseSignUpForm = function(data) {
	// uses form data here;
	console.log(data);
};

$(document).ready(function() {

	var	signUpform = $('#signUpForm'),
			signUpErrorsLink = $('#signUpErrorsLink')	
	;
	
	signUpform.validate({
		invalidHandler: function(form, validator) {
			signUpErrorsLink.click();
			var html = '';
			for(var key in validator.submitted){
				var label = $('label[for^="'+ key +'"]').not('[generated]');
				var legend = label.closest('fieldset').find('.ui-controlgroup-label');
				// var fieldName = condition ? true : false
				var fieldName = legend.length ? legend.text() : label.text();
				html += '<li>'+ fieldName +'</li>';
			};
			$("#signUpFormErrors ul").html(html);		
		},
		submitHandler: function() {
			var data = signUpform.serializeArray();
			parseSignUpForm(data);
		}
	});

});