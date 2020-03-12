$(document).ready(function() {
	$('#submit').click(function() {
		var username = $('#username').val();
		var password = $('#password').val();
		
		if (username == "") {
			$('#errorMessage').text("Username cannot be left blank.");
		}
		else if (password == "") {
			$("#errorMessage").text("Password cannot be left blank.");
		}
		else {
			$.ajax({
				url: "api/login",
				type: "POST",
				data: JSON.stringify({"username": username, "password": password}),
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				success: function(data) {
					console.log(data);
					if (data == true) {
						window.location.replace("connect");
					}
					else {
						$("#errorMessage").text("Username or password is incorrect.");
					}
					console.log("Works");
				}
			});
		}
	});
});
