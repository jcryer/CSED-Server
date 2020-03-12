$(document).ready(function() {
	$('#newAccount').click(function() {
		var username = $('#username').val();
        var password = $('#password').val();
		var confirmedPassword = $('#confirmedPassword').val();
		//var firstName = $('#forename').val();
		//var lastName = $('#surname').val();
		
		if (username.localeCompare("") == 0) {

            document.getElementById('errorMessage').innerHTML = "One or more fields are blank!";

		} /*else if (firstName.localeCompare("") == 0) {

			document.getElementById('errorMessage').innerHTML = "One or more fields are blank!";

		} else if (lastName.localeCompare("") == 0) {

			document.getElementById('errorMessage').innerHTML = "One or more fields are blank!";

		} */ else if (password.localeCompare("") == 0) {

			document.getElementById('errorMessage').innerHTML = "One or more fields are blank!";

		} else if (confirmedPassword.localeCompare("") == 0) {

			document.getElementById('errorMessage').innerHTML = "One or more fields are blank!";

		} else {
			
			switch(password.localeCompare(confirmedPassword)) {

				case 0:
					document.getElementById('errorMessage').innerHTML = "";
					console.log(username);
					$.ajax({
						url: "api/register",
						type: "POST",
						data: JSON.stringify({"username": username, "password": password /*, "forename": firstName, "surname": lastName */ }),
						contentType: "application/json; charset=utf-8",
						dataType: "json",
						success: function(data) {
							console.log(data);
                            console.log("Works");
                            if (data == true) {
                                window.location.replace("/");
                            }
                            else {
                                document.getElementById('errorMessage').innerHTML = "Passwords do not match!";
                            }
						}
					});
					break;
			
				default:
					document.getElementById('errorMessage').innerHTML = "Passwords do not match!";
		}

		}
		
	});
});