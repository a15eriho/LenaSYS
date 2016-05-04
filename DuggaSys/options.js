$(function() {
	$("#mouseLoggingON").click(function() {
		setOption("mouseMoveLogging", "1");
	});

	$("#mouseLoggingOFF").click(function() {
		setOption("mouseMoveLogging", "0");
	});

	$("#FRLoggingON").click(function() {
		setOption("fourthRound", "1");
	});

	$("#FRLoggingOFF").click(function() {
		setOption("fourthRound", "0");
	});

	$('.switch').change(function(){
		$(this).toggleClass('checked');
	});

	$('.switch').click(function(e) {
		var that = $(this);
		e.preventDefault();
		setOption($(this).attr('data-label'), $(this).hasClass('checked') ? '0' : '1', function(data) {
			if (data.success) {
				that.find('input').prop('checked');
				that.find('input').change();
			}
		});
	});
	
	
});

function setOption(label, value, cb) {
	$.ajax({
		url: "optionservice.php",
		type: "POST",
		dataType: "json",
		data: {
			label: label,
			value: value
		},
		success: function(data) {
			cb(data);
			
			var value2;
			
			if(value == 1){
				value2 = "true";
			}else if(value == 0){
				value2 = "false";
			}else{
				value2 = value;
			}
			
			var number = $("#settingsToast").children().size() + 1;

			$("#settingsToast").html("");
			$("#settingsToast").show("fast").append("<div id='toastBar"+number+"' class='toastBar'>Successfully set the "+ label +" option to "+ value2 +"</div>");
			$("#toastBar"+number).delay('3000').fadeOut('slow');
			
		}
	});
}

$(window).resize(function(){
  equalheight('.allSettings .setting');
});

equalheight = function(container){

var currentTallest = 0,
     currentRowStart = 0,
     rowDivs = new Array(),
     $el,
     topPosition = 0;
 $(container).each(function() {

   $el = $(this);
   $($el).height('auto')
   topPostion = $el.position().top;

   if (currentRowStart != topPostion) {
     for (currentDiv = 0 ; currentDiv < rowDivs.length ; currentDiv++) {
       rowDivs[currentDiv].height(currentTallest);
     }
     rowDivs.length = 0; // empty the array
     currentRowStart = topPostion;
     currentTallest = $el.height();
     rowDivs.push($el);
   } else {
     rowDivs.push($el);
     currentTallest = (currentTallest < $el.height()) ? ($el.height()) : (currentTallest);
  }
   for (currentDiv = 0 ; currentDiv < rowDivs.length ; currentDiv++) {
     rowDivs[currentDiv].height(currentTallest);
   }
 });
}