$(document).ready(function() {
	$('#newAccount').click(function() {
		var username = $('#username').val();
        var password = $('#password').val();
		var confirmedPassword = $('#confirmedPassword').val();
		var firstName = $('#forename').val();
		var lastName = $('#surname').val();
		
		if (password.localeCompare(confirmedPassword) != 0) {
			console.log("Password doesn't match");
			document.getElementById('incorrectPassword').innerHTML = "<br>Passwords do not match!";
		} else {
			document.getElementById('incorrectPassword').innerHTML = "";
			console.log(username);
			console.log(JSON.stringify({"username": username, "password": password, "forename": firstName, "surname": lastName}));
			$.ajax({
				url: "api/login",
				type: "POST",
				data: JSON.stringify({"username": username, "password": password, "forename": firstName, "surname": lastName}),
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				success: function(data) {
					console.log(data);
					console.log("Works");
				}
			});
			
			window.location.replace("index.html");
						
		}
		
	});
});